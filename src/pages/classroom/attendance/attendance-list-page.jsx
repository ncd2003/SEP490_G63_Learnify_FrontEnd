import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarClock, Clock3, ArrowRight, Loader2, Search, X } from "lucide-react";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import useSchedule from "@/hooks/useSchedule";
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

const AttendanceListPage = () => {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const { sessions, loading, error } = useSchedule(Number(classroomId));

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const da = parseDateTime(a.sessionDate, a.startTime)?.getTime() ?? 0;
      const db = parseDateTime(b.sessionDate, b.startTime)?.getTime() ?? 0;
      return db - da;
    });
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return sortedSessions;

    return sortedSessions.filter((session) => {
      const topic = (session.topic || "Buổi học").toLowerCase();
      const date = formatDate(session.sessionDate).toLowerCase();
      const time = `${session.startTime?.slice(0, 5) || ""} ${session.endTime?.slice(0, 5) || ""}`.toLowerCase();
      return topic.includes(keyword) || date.includes(keyword) || time.includes(keyword);
    });
  }, [searchValue, sortedSessions]);

  const handleOpenAttendance = (sessionId) => {
    navigate(PATH_TEACHER.classroom.attendanceSession(classroomId, sessionId));
  };

  return (
    <ClassroomDetailLayout>
      <div className="attendance-list-page">
        <div className="attendance-list-header">
          <h1>Điểm danh</h1>
          <p>Chọn một buổi học bên dưới để vào màn hình điểm danh chi tiết.</p>
        </div>

        {!loading && !error && sortedSessions.length > 0 && (
          <div className="attendance-list-search-wrap">
            <Search size={16} className="attendance-list-search-icon" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Tìm theo chủ đề, ngày hoặc giờ học"
              className="attendance-list-search-input"
            />
            {searchValue && (
              <button
                className="attendance-list-search-clear"
                onClick={() => setSearchValue("")}
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
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
          <div className="attendance-session-list">
            {filteredSessions.map((session) => {
              const state = getAttendanceState(session);
              return (
                <article key={session.id} className="attendance-session-card">
                  <div className="session-card-top">
                    <h2>{session.topic || "Buổi học"}</h2>
                    <span className={`session-state ${state.type}`}>{state.label}</span>
                  </div>

                  <div className="session-card-meta">
                    <span>
                      <CalendarClock size={14} /> {formatDate(session.sessionDate)}
                    </span>
                    <span>
                      <Clock3 size={14} /> {session.startTime?.slice(0, 5)} - {session.endTime?.slice(0, 5)}
                    </span>
                  </div>

                  <button
                    className="session-open-btn"
                    onClick={() => handleOpenAttendance(session.id)}
                  >
                    Vào điểm danh
                    <ArrowRight size={14} />
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && sortedSessions.length > 0 && filteredSessions.length === 0 && (
          <div className="attendance-list-empty">
            Không tìm thấy buổi học phù hợp với từ khóa tìm kiếm.
          </div>
        )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default AttendanceListPage;
