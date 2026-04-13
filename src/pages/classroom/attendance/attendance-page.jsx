import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, CircleX, Loader2, Pencil, RotateCcw, Save, X, ArrowLeft } from "lucide-react";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import useSchedule from "@/hooks/useSchedule";
import useAttendance, { STATUS } from "@/hooks/use-attendance";
import { classroomMemberApi } from "@/apis/classroom-member.api";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/classroom/attendancePage.css";

const ATTENDANCE_GRACE_MINUTES = 15;
const MSG97 = "MSG97: Đã hết thời gian học. Hệ thống khóa biểu mẫu ở chế độ chỉ đọc.";

const parseDateTime = (date, time) => {
  if (!date || !time) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0);
};

const formatTimeRange = (session) => {
  if (!session?.startTime || !session?.endTime) return "-";
  return `${session.startTime.slice(0, 5)} - ${session.endTime.slice(0, 5)}`;
};

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getSessionStatusLabel = (session, isWithinWindow) => {
  if (!session) return "Không có buổi học";
  if (isWithinWindow) return "Đang mở điểm danh";
  return "Đã đóng khung giờ điểm danh";
};

const extractRoster = (classroom) => {
  const rawList =
    classroom?.students ??
    classroom?.members ??
    classroom?.acceptedMembers ??
    classroom?.enrolledStudents ??
    [];

  const mapped = rawList
    .map((item) => {
      const student = item?.student ?? item?.user ?? item;
      const id = student?.id ?? item?.studentId ?? item?.memberId ?? null;
      if (!id) return null;

      return {
        id,
        fullName: student?.fullName ?? student?.name ?? item?.studentName ?? "Chưa cập nhật",
        email: student?.email ?? item?.studentEmail ?? "",
        phoneNumber: student?.phoneNumber ?? student?.phone ?? item?.studentPhone ?? "",
        avatarUrl: student?.avatarUrl ?? item?.avatarUrl ?? null,
      };
    })
    .filter(Boolean);

  const unique = new Map();
  mapped.forEach((student) => {
    unique.set(student.id, student);
  });

  return Array.from(unique.values());
};

const AttendancePage = () => {
  const { id: classroomId, sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { sessions, loading: sessionsLoading, error: sessionsError } = useSchedule(Number(classroomId));

  const [classroom, setClassroom] = useState(null);
  const [classroomLoading, setClassroomLoading] = useState(false);
  const [classroomError, setClassroomError] = useState("");

  const roster = useMemo(() => extractRoster(classroom), [classroom]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === Number(sessionId)) ?? null,
    [sessionId, sessions],
  );

  const isWithinAttendanceWindow = useMemo(() => {
    if (!selectedSession) return false;
    const start = parseDateTime(selectedSession.sessionDate, selectedSession.startTime);
    const end = parseDateTime(selectedSession.sessionDate, selectedSession.endTime);
    if (!start || !end) return false;

    const now = new Date();
    const endWithGrace = new Date(end.getTime() + ATTENDANCE_GRACE_MINUTES * 60 * 1000);
    return now >= start && now <= endWithGrace;
  }, [selectedSession]);

  const {
    rows,
    loading: attendanceLoading,
    submitting,
    error: attendanceError,
    success,
    locked,
    hasSubmitted,
    summary,
    setRowStatus,
    markAllPresent,
    markAllAbsent,
    resetChanges,
    enableEdit,
    save,
  } = useAttendance(sessionId, roster);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setClassroomLoading(true);
        setClassroomError("");
        const response = await classroomMemberApi.getAcceptedMembers(classroomId);
        setClassroom({ acceptedMembers: response?.result ?? [] });
      } catch (err) {
        setClassroomError(err?.response?.data?.message ?? "Không thể tải danh sách thành viên lớp học.");
      } finally {
        setClassroomLoading(false);
      }
    };

    fetchMembers();
  }, [classroomId]);

  const handleSubmit = async () => {
    if (!isWithinAttendanceWindow) return;
    await save();
  };

  const isTeacher = user?.role === "ROLE_TEACHER";
  const readOnlyByRule = !isTeacher || !isWithinAttendanceWindow;
  const selectedSessionNotFound = !sessionsLoading && sessions.length > 0 && !selectedSession;

  const handleGoBackToList = () => {
    navigate(PATH_TEACHER.classroom.attendance(classroomId));
  };

  return (
    <ClassroomDetailLayout>
      <div className="attendance-page">
        <div className="attendance-page-header">
          <h1>Điểm danh</h1>
          <p>Giáo viên điểm danh học sinh trong buổi học đang diễn ra.</p>
        </div>

        <div className="attendance-quick-actions">
          <button onClick={handleGoBackToList}>
            <ArrowLeft size={14} /> Chọn buổi khác
          </button>
        </div>

        <div className="attendance-session-panel">
          <div className="session-meta-left">
            <div className="session-grid">
              <div>
                <span>Chủ đề:</span>
                <strong>{selectedSession?.topic || "-"}</strong>
              </div>
              <div>
                <span>Thời gian:</span>
                <strong>{formatTimeRange(selectedSession)}</strong>
              </div>
              <div>
                <span>Tổng số học sinh:</span>
                <strong>{summary.total || roster.length}</strong>
              </div>
              <div>
                <span>Trạng thái:</span>
                <strong>{getSessionStatusLabel(selectedSession, isWithinAttendanceWindow)}</strong>
              </div>
              <div>
                <span>Ngày học:</span>
                <strong>{formatDate(selectedSession?.sessionDate)}</strong>
              </div>
            </div>
          </div>

          <div className="session-meta-right">
            <div className="summary-item present">
              <CheckCircle2 size={16} />
              Có mặt: {summary.presentCount}
            </div>
            <div className="summary-item absent">
              <CircleX size={16} />
              Vắng mặt: {summary.absentCount}
            </div>
          </div>
        </div>

        <div className="attendance-quick-actions">
          <button onClick={markAllPresent} disabled={locked || readOnlyByRule || attendanceLoading || submitting}>
            Đánh dấu tất cả có mặt
          </button>
          <button onClick={markAllAbsent} disabled={locked || readOnlyByRule || attendanceLoading || submitting}>
            Đánh dấu tất cả vắng mặt
          </button>
          <button onClick={resetChanges} disabled={attendanceLoading || submitting}>
            Nhập lại buổi trước
          </button>
        </div>

        {!isWithinAttendanceWindow && selectedSession && (
          <div className="attendance-alert error">{MSG97}</div>
        )}
        {!isTeacher && <div className="attendance-alert error">Chỉ giáo viên mới có thể điểm danh.</div>}
        {selectedSessionNotFound && (
          <div className="attendance-alert error">Không tìm thấy buổi học tương ứng. Vui lòng chọn lại buổi học.</div>
        )}
        {classroomError && <div className="attendance-alert error">{classroomError}</div>}
        {sessionsError && <div className="attendance-alert error">{sessionsError}</div>}
        {attendanceError && <div className="attendance-alert error">{attendanceError}</div>}
        {success && <div className="attendance-alert success">{success}</div>}

        {(classroomLoading || sessionsLoading || attendanceLoading) && (
          <div className="attendance-loading">
            <Loader2 size={20} className="spin" />
            <span>Đang tải dữ liệu điểm danh...</span>
          </div>
        )}

        {!classroomLoading && !sessionsLoading && !attendanceLoading && (
          <div className="attendance-table-wrapper">
            <div className="attendance-table-header">
              <h2>Danh sách điểm danh</h2>
              <span>
                Có mặt: {summary.presentCount} | Vắng mặt: {summary.absentCount} | Tổng: {summary.total}
              </span>
            </div>

            {rows.length === 0 ? (
              <div className="attendance-empty">
                Không có dữ liệu học sinh. Vui lòng đảm bảo lớp đã có thành viên được duyệt.
              </div>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Học sinh</th>
                    <th>Thông tin liên hệ</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.studentId}>
                      <td>
                        <div className="student-name-cell">
                          <div className="student-avatar">
                            {row.avatarUrl ? (
                              <img src={row.avatarUrl} alt={row.fullName} />
                            ) : (
                              <span>{(row.fullName || "?").slice(0, 1).toUpperCase()}</span>
                            )}
                          </div>
                          <strong>{row.fullName}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <div>Email: {row.email || "-"}</div>
                          <div>SĐT: {row.phoneNumber || "-"}</div>
                        </div>
                      </td>
                      <td>
                        <div className="status-cell">
                          <label>
                            <input
                              type="radio"
                              name={`status-${row.studentId}`}
                              checked={row.status === STATUS.PRESENT}
                              onChange={() => setRowStatus(row.studentId, STATUS.PRESENT)}
                              disabled={locked || readOnlyByRule || submitting}
                            />
                            Có mặt
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`status-${row.studentId}`}
                              checked={row.status === STATUS.ABSENT}
                              onChange={() => setRowStatus(row.studentId, STATUS.ABSENT)}
                              disabled={locked || readOnlyByRule || submitting}
                            />
                            Vắng mặt
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="attendance-actions">
          {hasSubmitted && locked ? (
            <button
              className="btn-edit"
              onClick={enableEdit}
              disabled={readOnlyByRule || submitting || rows.length === 0}
            >
              <Pencil size={16} /> Chỉnh sửa
            </button>
          ) : (
            <>
              <button className="btn-cancel" onClick={resetChanges} disabled={submitting}>
                <X size={16} /> Hủy
              </button>
              <button
                className="btn-save"
                onClick={handleSubmit}
                disabled={readOnlyByRule || submitting || rows.length === 0}
              >
                {submitting ? <Loader2 size={16} className="spin" /> : hasSubmitted ? <RotateCcw size={16} /> : <Save size={16} />}
                {hasSubmitted ? "Cập nhật" : "Lưu điểm danh"}
              </button>
            </>
          )}
        </div>
      </div>
    </ClassroomDetailLayout>
  );
};

export default AttendancePage;
