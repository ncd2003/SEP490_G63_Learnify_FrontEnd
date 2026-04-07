import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Video } from "lucide-react";
import { classroomApi } from "@/apis/classroom.api";
import { enrollmentApi } from "@/apis/enrollment.api";
import scheduleApi from "@/apis/schedule.api";
import EventDetailModal from "@/components/EventDetailModal";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_STUDENT, PATH_TEACHER } from "@/routes/paths";
import { SESSION_TYPE } from "@/schema/scheduleSchema";
import "@/assets/css/pages/classroom/classroomSchedule.css";
import "@/assets/css/components/eventDetailModal.css";

const VIEW_MODES = {
  MONTH: "month",
  WEEK: "week",
};

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const parseSessionDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isSameDay = (a, b) =>
  a && b &&
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();

const isToday = (date) => date && isSameDay(date, new Date());

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isPastDay = (date) => {
  if (!date) return false;
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime();
};

const toSessionDateTime = (sessionDate, timeStr) => {
  if (!sessionDate || !timeStr) return null;
  const baseDate = parseSessionDate(sessionDate);
  if (!baseDate) return null;

  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(":").map(Number);
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    Number.isNaN(hours) ? 0 : hours,
    Number.isNaN(minutes) ? 0 : minutes,
    Number.isNaN(seconds) ? 0 : seconds,
    0,
  );
};

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const days = [];

  for (let i = 0; i < startingDayOfWeek; i += 1) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) days.push(new Date(year, month, day));
  return days;
};

const getWeekDays = (date) => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const formatDateRange = (s, e) =>
  `${s.getDate()}/${s.getMonth() + 1} - ${e.getDate()}/${e.getMonth() + 1}/${e.getFullYear()}`;

const TeacherSchedulePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState(VIEW_MODES.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);

  const isStudent = user?.role === "ROLE_STUDENT";

  useEffect(() => {
    const fetchAllClassSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const classesResponse = isStudent
          ? await enrollmentApi.getMyClassrooms()
          : await classroomApi.getClassroomsByTeacher();
        const classrooms = classesResponse.result ?? [];

        if (!classrooms.length) {
          setSessions([]);
          return;
        }

        const sessionResponses = await Promise.allSettled(
          classrooms.map((c) => scheduleApi.getSessionsByClass(c.id)),
        );

        const merged = sessionResponses
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value?.result ?? [])
          .map((s) => ({
            ...s,
            classroomId: s.classroomId,
            classroomName: s.classroomName || "Lớp học",
          }));

        setSessions(merged);
      } catch (err) {
        setError(err.response?.data?.message ?? "Không thể tải lịch học tổng.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllClassSessions();
  }, [isStudent]);

  const navigatePeriod = (delta, unit) => {
    const d = new Date(currentDate);
    if (unit === "month") d.setMonth(d.getMonth() + delta);
    else d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  };

  const getSessionsForDate = (date) => {
    if (!date) return [];
    return sessions.filter((s) => isSameDay(parseSessionDate(s.sessionDate), date));
  };

  const getJoinDisabledReason = (session) => {
    if (!session?.sessionDate || !session?.startTime || !session?.endTime) return "Chưa có đủ thông tin thời gian buổi học.";

    const now = new Date();
    const start = toSessionDateTime(session.sessionDate, session.startTime);
    const end = toSessionDateTime(session.sessionDate, session.endTime);

    if (!start || !end) return "Chưa có đủ thông tin thời gian buổi học.";
    if (now < start) return "Chưa đến giờ bắt đầu buổi học.";
    if (now > end) return "Buổi học đã kết thúc.";

    return null;
  };

  const canJoinSession = (session) => !getJoinDisabledReason(session);

  const handleJoinMeeting = (session, e) => {
    if (e) e.stopPropagation();

    const disabledReason = getJoinDisabledReason(session);
    if (disabledReason) {
      alert(disabledReason);
      return;
    }

    if (!session?.meetingLink || !session?.id || !session?.classroomId) {
      alert("Không tìm thấy thông tin phòng họp hợp lệ.");
      return;
    }

    const lecturePath = isStudent
      ? PATH_STUDENT.classroom.detail(session.classroomId)
      : PATH_TEACHER.classroom.lecture(session.classroomId);

    navigate(`${lecturePath}?sessionId=${session.id}`);
  };

  const handleOpenAttendance = (session) => {
    if (isStudent) return;
    if (!session?.classroomId || !session?.id) return;
    navigate(PATH_TEACHER.classroom.attendanceSession(session.classroomId, session.id));
  };

  const handleEventClick = (session) => {
    setSelectedEventForDetail(session);
    setIsEventDetailOpen(true);
  };

  const handleCloseEventDetail = () => {
    setSelectedEventForDetail(null);
    setIsEventDetailOpen(false);
  };

  const handleEventEdit = (session) => {
    if (isStudent) return;
    if (!session?.classroomId) return;
    navigate(PATH_TEACHER.classroom.schedule(session.classroomId));
  };

  const handleEventDelete = (sessionId) => {
    if (isStudent) return;
    const session = sessions.find((s) => s.id === sessionId);
    if (!session?.classroomId) return;
    navigate(PATH_TEACHER.classroom.schedule(session.classroomId));
  };

  const renderSessionBadge = (session) => (
    <span className="event-type-badge" title={session.type === SESSION_TYPE.ONLINE ? "Trực tuyến" : "Trực tiếp"}>
      {session.type === SESSION_TYPE.ONLINE ? <Video size={10} /> : <MapPin size={10} />}
    </span>
  );

  const days = getDaysInMonth(currentDate);
  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  return (
    <div className="classroom-schedule-page">
      <div className="schedule-tabs">
        {Object.entries({ [VIEW_MODES.WEEK]: "Tuần", [VIEW_MODES.MONTH]: "Tháng" }).map(
          ([mode, label]) => (
            <button
              key={mode}
              className={`schedule-tab ${viewMode === mode ? "active" : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div className="schedule-navigation">
        {viewMode === VIEW_MODES.MONTH && (
          <>
            <button className="nav-button" onClick={() => navigatePeriod(-1, "month")}>
              <ChevronLeft size={20} /> Trước
            </button>
            <div className="current-date">{currentMonth}, {currentYear}</div>
            <button className="nav-button" onClick={() => navigatePeriod(1, "month")}>
              Sau <ChevronRight size={20} />
            </button>
          </>
        )}
        {viewMode === VIEW_MODES.WEEK && (
          <>
            <button className="nav-button" onClick={() => navigatePeriod(-7, "day")}>
              <ChevronLeft size={20} /> Tuần trước
            </button>
            <div className="current-date">
              {(() => {
                const w = getWeekDays(currentDate);
                return formatDateRange(w[0], w[6]);
              })()}
            </div>
            <button className="nav-button" onClick={() => navigatePeriod(7, "day")}>
              Tuần sau <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="view-placeholder"><p>Đang tải lịch học...</p></div>
      )}

      {error && (
        <div className="view-placeholder" style={{ borderColor: "#ef4444", color: "#ef4444" }}><p>{error}</p></div>
      )}

      {!loading && !error && viewMode === VIEW_MODES.MONTH && (
        <div className="calendar-container">
          <div className="calendar-header">
            {WEEKDAYS.map((day) => (<div key={day} className="calendar-header-cell">{day}</div>))}
          </div>
          <div className="calendar-grid">
            {days.map((date, index) => {
              const daySessions = getSessionsForDate(date);
              const maxDisplay = 3;
              const displaySessions = daySessions.slice(0, maxDisplay);
              const remainingCount = daySessions.length - maxDisplay;
              const isPast = isPastDay(date);

              return (
                <div
                  key={index}
                  className={`calendar-day ${!date ? "empty" : ""} ${isToday(date) ? "today" : ""} ${isPast ? "past" : ""}`}
                  onClick={() => date && daySessions.length > 0 && handleEventClick(daySessions[0])}
                  style={{ cursor: date && daySessions.length > 0 ? "pointer" : "default" }}
                >
                  {date && (
                    <>
                      <div className="day-number">{date.getDate()}</div>
                      <div className="day-events">
                        {displaySessions.map((s) => (
                          <div
                            key={`${s.classroomId}-${s.id}`}
                            className="event-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(s);
                            }}
                          >
                            <div className="event-content">
                              <span className="event-time">{s.startTime} {renderSessionBadge(s)}</span>
                              <span className="event-title" title={`${s.classroomName} - ${s.title}`}>{s.classroomName} - {s.title}</span>
                            </div>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <button className="more-events-btn">+{remainingCount} more</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !error && viewMode === VIEW_MODES.WEEK && (() => {
        const weekDaysView = getWeekDays(currentDate);
        return (
          <div className="week-board-container">
            <div className="week-board-grid">
              {weekDaysView.map((day, di) => {
                const daySessions = getSessionsForDate(day)
                  .slice()
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const isDayToday = isToday(day);
                const isDayPast = isPastDay(day);

                return (
                  <div key={di} className={`week-board-day ${isDayToday ? "today" : ""} ${isDayPast ? "past" : ""}`}>
                    <div className="week-board-header">
                      <div className="week-board-day-heading">
                        <div className="week-board-day-name-row">
                          <span className="week-board-day-name">{WEEKDAYS[day.getDay()]}</span>
                        </div>
                        {isDayToday && (
                          <div className="week-board-day-subrow">
                            <span className="week-board-today-badge">Hôm nay</span>
                          </div>
                        )}
                        <div className="week-board-day-date">
                          {String(day.getDate()).padStart(2, "0")}/{String(day.getMonth() + 1).padStart(2, "0")}
                        </div>
                      </div>
                    </div>

                    <div className="week-board-body">
                      {daySessions.length === 0 && (
                        <div className="week-board-empty">Không có lịch học</div>
                      )}

                      {daySessions.map((s) => (
                        <div
                          key={`${s.classroomId}-${s.id}`}
                          className="week-board-event"
                          onClick={() => handleEventClick(s)}
                        >
                          <div className="week-board-event-time">{s.startTime} - {s.endTime}</div>
                          <div className="week-board-event-title" title={`${s.classroomName} - ${s.title}`}>
                            {s.classroomName} - {s.title}
                          </div>
                          <div className="week-board-event-meta">
                            <span className="week-board-event-type-icon">{renderSessionBadge(s)}</span>
                            <span className="week-board-event-type-text">
                              {s.type === SESSION_TYPE.ONLINE ? "Trực tuyến" : (s.location || "Tại lớp")}
                            </span>
                          </div>
                          {s.type === SESSION_TYPE.ONLINE && s.meetingLink && (
                            <div className="week-board-event-actions">
                              <button
                                type="button"
                                className="week-board-join-btn"
                                disabled={!canJoinSession(s)}
                                title={getJoinDisabledReason(s) ?? "Tham gia buổi học"}
                                onClick={(e) => handleJoinMeeting(s, e)}
                              >
                                Tham gia
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <EventDetailModal
        isOpen={isEventDetailOpen}
        onClose={handleCloseEventDetail}
        session={selectedEventForDetail}
        onJoin={handleJoinMeeting}
        canJoinSession={canJoinSession}
        getJoinDisabledReason={getJoinDisabledReason}
        onEdit={!isStudent ? handleEventEdit : undefined}
        onDelete={!isStudent ? handleEventDelete : undefined}
        onOpenAttendance={!isStudent ? handleOpenAttendance : undefined}
      />
    </div>
  );
};

export default TeacherSchedulePage;
