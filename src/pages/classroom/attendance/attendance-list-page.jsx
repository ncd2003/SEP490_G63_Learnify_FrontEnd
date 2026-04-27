import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import { attendanceApi } from "@/apis/attendance.api";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/classroom/attendanceListPage.css";

const ATTENDANCE_GRACE_MINUTES = 15;

const parseDateTime = (date, time) => {
  if (!date || !time) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hour ?? 0, minute ?? 0, 0, 0);
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getAttendanceState = (session) => {
  const now = new Date();
  const start = parseDateTime(session.sessionDate, session.startTime);
  const end = parseDateTime(session.sessionDate, session.endTime);

  if (!start || !end) {
    return { label: "Không xác định", type: "unknown" };
  }

  const endWithGrace = new Date(end.getTime() + ATTENDANCE_GRACE_MINUTES * 60 * 1000);

  if (now < start) {
    return { label: "Chưa đến giờ điểm danh", type: "upcoming" };
  }

  if (now > endWithGrace) {
    return { label: "Đã đóng điểm danh", type: "closed" };
  }

  return { label: "Đang mở điểm danh", type: "open" };
};

const ITEMS_PER_PAGE = 10;

const AttendanceListPage = () => {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    keyword: "",
    sessionDate: "",
    status: "all",
    timeSlot: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    keyword: "",
    sessionDate: "",
    status: "all",
    timeSlot: "all",
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchAttendanceSessions = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await attendanceApi.getAttendanceSessionsByClass(Number(classroomId));
        setSessions(response?.result ?? []);
      } catch (err) {
        setError(err?.response?.data?.message ?? "Không thể tải danh sách buổi học điểm danh.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceSessions();
  }, [classroomId]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const da = parseDateTime(a.sessionDate, a.startTime)?.getTime() ?? 0;
      const db = parseDateTime(b.sessionDate, b.startTime)?.getTime() ?? 0;
      return db - da;
    });
  }, [sessions]);

  const getSessionTitle = (session) => session.title || session.topic || "Buổi học";

  const getAttendanceStatus = (session) => {
    const state = getAttendanceState(session);
    if (session?.attendanceTaken) {
      return { label: "Hoàn thành", key: "completed" };
    }
    if (state.type === "open") {
      return { label: "Đang tiến hành", key: "open" };
    }
    if (state.type === "upcoming") {
      return { label: "Chưa điểm danh", key: "pending" };
    }
    if (state.type === "closed") {
      return { label: "Đã quá hạn điểm danh", key: "expired" };
    }
    return { label: "Không xác định", key: "unknown" };
  };

  const getAttendanceSummary = (session) => {
    const summary = session.attendanceSummary || session.attendanceStats || {};
    const total = session.totalStudents ?? summary.total ?? summary.totalCount ?? 0;
    const present = session.presentCount ?? summary.present ?? summary.presentCount ?? 0;
    const absent = session.absentCount ?? summary.absent ?? summary.absentCount ?? 0;
    const rate = total ? Math.round((present ?? 0) / total * 100) : null;
    return { total, present, absent, rate };
  };

  const timeSlotOptions = useMemo(() => {
    const slots = new Set();
    sessions.forEach((session) => {
      const start = session.startTime?.slice(0, 5) || "";
      const end = session.endTime?.slice(0, 5) || "";
      if (start && end) {
        slots.add(`${start} - ${end}`);
      }
    });
    return Array.from(slots).sort();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();
    return sortedSessions.filter((session) => {
      const title = getSessionTitle(session).toLowerCase();
      const date = session.sessionDate || "";
      const timeSlot = `${session.startTime?.slice(0, 5) || ""} - ${session.endTime?.slice(0, 5) || ""}`.trim();
      const statusKey = getAttendanceStatus(session).key;

      if (keyword) {
        const text = `${title} ${formatDate(session.sessionDate)} ${timeSlot}`.toLowerCase();
        if (!text.includes(keyword)) return false;
      }

      if (appliedFilters.sessionDate && date !== appliedFilters.sessionDate) return false;
      if (appliedFilters.status !== "all" && statusKey !== appliedFilters.status) return false;
      if (appliedFilters.timeSlot !== "all" && timeSlot !== appliedFilters.timeSlot) return false;

      return true;
    });
  }, [appliedFilters, sortedSessions]);

  const pagedSessions = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSessions, page]);

  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
  const pageStart = filteredSessions.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(filteredSessions.length, page * ITEMS_PER_PAGE);

  const handleSearch = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleReset = () => {
    const reset = { keyword: "", sessionDate: "", status: "all", timeSlot: "all" };
    setFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  };

  const handleOpenAttendance = (sessionId) => {
    navigate(PATH_TEACHER.classroom.attendanceSession(classroomId, sessionId));
  };

  return (
    <ClassroomDetailLayout>
      <div className="attendance-list-page">
        <div className="attendance-list-header">
          <h1>Điểm danh</h1>
        </div>

        {!loading && !error && sortedSessions.length > 0 && (
          <div className="attendance-filter-card">
            <div className="attendance-filter-grid">
              <div className="attendance-filter-field">
                <label htmlFor="attendance-keyword">Tên buổi học</label>
                <input
                  id="attendance-keyword"
                  type="text"
                  placeholder="Nhập tên buổi học"
                  value={filters.keyword}
                  onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                />
              </div>
              <div className="attendance-filter-field">
                <label htmlFor="attendance-date">Ngày học</label>
                <input
                  id="attendance-date"
                  type="date"
                  value={filters.sessionDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sessionDate: e.target.value }))}
                />
              </div>
              <div className="attendance-filter-field">
                <label htmlFor="attendance-status">Trạng thái điểm danh</label>
                <select
                  id="attendance-status"
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="open">Đang tiến hành</option>
                  <option value="pending">Chưa điểm danh</option>
                  <option value="expired">Đã quá hạn điểm danh</option>
                  <option value="unknown">Không xác định</option>
                </select>
              </div>
              <div className="attendance-filter-field">
                <label htmlFor="attendance-slot">Khung giờ</label>
                <select
                  id="attendance-slot"
                  value={filters.timeSlot}
                  onChange={(e) => setFilters((prev) => ({ ...prev, timeSlot: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  {timeSlotOptions.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="attendance-filter-actions">
              <button type="button" className="btn-primary" onClick={handleSearch}>
                Tìm kiếm
              </button>
              <button type="button" className="btn-secondary" onClick={handleReset}>
                Đặt lại
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="attendance-list-state">
            <Loader2 size={20} className="spin" />
            <span>Đang tải danh sách buổi học...</span>
          </div>
        )}

        {!loading && error && <div className="attendance-list-error">{error}</div>}

        {!loading && !error && sortedSessions.length === 0 && (
          <div className="attendance-list-empty">Chưa có buổi học nào để điểm danh.</div>
        )}

        {!loading && !error && filteredSessions.length > 0 && (
          <div className="attendance-table-card">
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên buổi học</th>
                    <th>Ngày học</th>
                    <th>Khung giờ</th>
                    <th>Tổng học sinh</th>
                    <th>Có mặt</th>
                    <th>Vắng mặt</th>
                    <th>Tỷ lệ có mặt</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedSessions.map((session, index) => {
                    const status = getAttendanceStatus(session);
                    const summary = getAttendanceSummary(session);
                    const timeSlot = `${session.startTime?.slice(0, 5) || "--"} - ${session.endTime?.slice(0, 5) || "--"}`;
                    return (
                      <tr key={session.id}>
                        <td>{(page - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td>{getSessionTitle(session)}</td>
                        <td>{formatDate(session.sessionDate)}</td>
                        <td>{timeSlot}</td>
                        <td>{summary.total ?? "-"}</td>
                        <td>{summary.present ?? "-"}</td>
                        <td>{summary.absent ?? "-"}</td>
                        <td>{summary.rate !== null ? `${summary.rate}%` : "-"}</td>
                        <td>
                          <span className={`attendance-status ${status.key}`}>{status.label}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="attendance-action-btn"
                            onClick={() => handleOpenAttendance(session.id)}
                            disabled={status.key === "pending" || status.key === "unknown"}
                          >
                            {status.key === "completed" || status.key === "expired" ? "Xem điểm danh" : "Vào điểm danh"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="attendance-table-footer">
              <span>
                Hiển thị {pageStart}-{pageEnd} trên tổng {filteredSessions.length} buổi điểm danh
              </span>
              <div className="attendance-pagination">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={p === page ? "active" : ""}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && sortedSessions.length > 0 && filteredSessions.length === 0 && (
          <div className="attendance-list-empty">
            Không tìm thấy buổi học phù hợp với điều kiện lọc.
          </div>
        )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default AttendanceListPage;
