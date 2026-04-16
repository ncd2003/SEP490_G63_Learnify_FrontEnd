import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, MapPin, Video } from 'lucide-react';
import ClassroomDetailLayout from '@/components/ClassroomDetailLayout';
import SessionModal from '@/components/SessionModal';
import EventDetailModal from '@/components/EventDetailModal';
import useSchedule from '@/hooks/useSchedule';
import { PATH_TEACHER } from '@/routes/paths';
import { SESSION_TYPE } from '@/schema/scheduleSchema';
import '@/assets/css/pages/classroom/classroomSchedule.css';
import '@/assets/css/components/eventDetailModal.css';

const VIEW_MODES = {
  MONTH: 'month',
  WEEK: 'week',
};

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "yyyy-MM-dd" → Date at midnight local */
const parseSessionDate = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
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

  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(':').map(Number);
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
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day));
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

const toYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const SchedulePage = () => {
  const { id: classroomId } = useParams();
  const routerNavigate = useNavigate();
  const { sessions, loading, error, createSession, updateSession, deleteSession } = useSchedule(classroomId);

  const [viewMode, setViewMode] = useState(VIEW_MODES.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [presetSessionDate, setPresetSessionDate] = useState('');

  // ─── Navigation ─────────────────────────────────────────────────────────────

  const navigate = (delta, unit) => {
    const d = new Date(currentDate);
    if (unit === 'month') d.setMonth(d.getMonth() + delta);
    else d.setDate(d.getDate() + delta);
    setCurrentDate(d);
  };

  // ─── Session → calendar event helpers ───────────────────────────────────────

  const getSessionsForDate = (date) => {
    if (!date) return [];
    return sessions.filter((s) => isSameDay(parseSessionDate(s.sessionDate), date));
  };

  // ─── Modal Handlers ────────────────────────────────────────────────────────

  const handleCreate = () => {
    setSelectedSession(null);
    setPresetSessionDate('');
    setIsModalOpen(true);
  };

  const handleCreateForDate = (date) => {
    setSelectedSession(null);
    setPresetSessionDate(toYmd(date));
    setIsModalOpen(true);
  };

  const handleEdit = (session) => {
    setSelectedSession(session);
    setPresetSessionDate('');
    setIsModalOpen(true);
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa buổi học này?')) return;
    try {
      await deleteSession(sessionId);
    } catch (err) {
      alert(err.response?.data?.message ?? 'Có lỗi xảy ra khi xóa buổi học');
    }
  };

  /**
   * @param {CreateClassSessionRequestDTO} payload
   * @param {number|undefined} sessionId - present when editing
   */
  const handleSubmit = async (payload, sessionId) => {
    try {
      const submitPayload = { ...payload };

      // meetingLink sẽ do backend tự động tạo nếu type là ONLINE và link đang trống.
      if (submitPayload.type !== SESSION_TYPE.ONLINE) {
        submitPayload.meetingLink = null;
      }

      if (sessionId) {
        await updateSession(sessionId, submitPayload);
      } else {
        await createSession(submitPayload);
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.';
      alert(msg);
    }
  };

  // ─── Day Detail Modal Handlers ──────────────────────────────────────────

  const handleDayClick = (date) => {
    setSelectedDayDate(date);
    setIsDayDetailOpen(true);
  };

  const handleCloseDayDetail = () => {
    setIsDayDetailOpen(false);
    setSelectedDayDate(null);
  };

  // ─── Event Detail Modal Handlers ─────────────────────────────────────────

  const handleEventClick = (session) => {
    setSelectedEventForDetail(session);
    setIsEventDetailOpen(true);
  };

  const handleCloseEventDetail = () => {
    setIsEventDetailOpen(false);
    setSelectedEventForDetail(null);
  };

  const handleEventEdit = (session) => {
    handleCloseEventDetail();
    handleEdit(session);
  };

  const handleEventDelete = async (sessionId) => {
    handleCloseEventDetail();
    await handleDelete(sessionId);
  };

  const handleOpenAttendance = (session) => {
    if (!classroomId || !session?.id) return;
    routerNavigate(PATH_TEACHER.classroom.attendanceSession(classroomId, session.id));
  };

  const getJoinDisabledReason = (session) => {
    if (!session?.sessionDate || !session?.startTime || !session?.endTime) return 'Chưa có đủ thông tin thời gian buổi học.';

    const now = new Date();
    const start = toSessionDateTime(session.sessionDate, session.startTime);
    const end = toSessionDateTime(session.sessionDate, session.endTime);

    if (!start || !end) return 'Chưa có đủ thông tin thời gian buổi học.';

    if (now < start) return 'Chưa đến giờ bắt đầu buổi học.';
    if (now > end) return 'Buổi học đã kết thúc.';

    return null;
  };

  const canJoinSession = (session) => !getJoinDisabledReason(session);

  const handleJoinMeeting = async (session, e) => {
    if (e) {
      e.stopPropagation();
    }

    const disabledReason = getJoinDisabledReason(session);
    if (disabledReason) {
      alert(disabledReason);
      return;
    }

    if (!session?.meetingLink || !session?.id) {
      alert('Không tìm thấy thông tin phòng họp hợp lệ.');
      return;
    }

    routerNavigate(`${PATH_TEACHER.classroom.lecture(classroomId)}?sessionId=${session.id}`);
  };

  // ─── Derived data ──────────────────────────────────────────────────────────

  const days = getDaysInMonth(currentDate);
  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderSessionBadge = (session) => (
    <span className="event-type-badge" title={session.type === SESSION_TYPE.ONLINE ? 'Trực tuyến' : 'Trực tiếp'}>
      {session.type === SESSION_TYPE.ONLINE ? <Video size={10} /> : <MapPin size={10} />}
    </span>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <ClassroomDetailLayout>
      <div className="classroom-schedule-page">
        {/* View mode tabs */}
        <div className="schedule-tabs">
          {Object.entries({ [VIEW_MODES.WEEK]: 'Tuần', [VIEW_MODES.MONTH]: 'Tháng' }).map(
            ([mode, label]) => (
              <button key={mode} className={`schedule-tab ${viewMode === mode ? 'active' : ''}`} onClick={() => setViewMode(mode)}>
                {label}
              </button>
            ),
          )}
        </div>

        {/* Navigation */}
        <div className="schedule-navigation">
          {viewMode === VIEW_MODES.MONTH && (
            <>
              <button className="nav-button" onClick={() => navigate(-1, 'month')}><ChevronLeft size={20} /> Trước</button>
              <div className="current-date">{currentMonth}, {currentYear}</div>
              <button className="nav-button" onClick={() => navigate(1, 'month')}>Sau <ChevronRight size={20} /></button>
            </>
          )}
          {viewMode === VIEW_MODES.WEEK && (
            <div className="schedule-week-nav">
              <button
                type="button"
                className="nav-icon-button"
                onClick={() => navigate(-7, 'day')}
                aria-label="Tuần trước"
                title="Tuần trước"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="current-date">{(() => { const w = getWeekDays(currentDate); return formatDateRange(w[0], w[6]); })()}</div>
              <button
                type="button"
                className="nav-icon-button"
                onClick={() => navigate(7, 'day')}
                aria-label="Tuần sau"
                title="Tuần sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="view-placeholder"><p>Đang tải lịch học...</p></div>
        )}

        {/* Error */}
        {error && (
          <div className="view-placeholder" style={{ borderColor: '#ef4444', color: '#ef4444' }}><p>{error}</p></div>
        )}

        {/* ─── MONTH VIEW ──────────────────────────────────────────────────── */}
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
                    className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${isPast ? 'past' : ''}`}
                    onClick={() => date && daySessions.length > 0 && handleDayClick(date)}
                    style={{ cursor: date && daySessions.length > 0 ? 'pointer' : 'default' }}
                  >
                    {date && (
                      <>
                        <div className="day-number">{date.getDate()}</div>
                        <div className="day-events">
                          {displaySessions.map((s) => (
                            <div 
                              key={s.id} 
                              className="event-item"
                              onClick={(e) => { e.stopPropagation(); handleEventClick(s); }}
                            >
                              <div className="event-content">
                                <span className="event-time">{s.startTime} {renderSessionBadge(s)}</span>
                                <span className="event-title">{s.title}</span>
                              </div>
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <button 
                              className="more-events-btn"
                              onClick={(e) => { e.stopPropagation(); handleDayClick(date); }}
                            >
                              +{remainingCount} more
                            </button>
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

        {/* ─── WEEK VIEW ───────────────────────────────────────────────────── */}
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
                    <div key={di} className={`week-board-day ${isDayToday ? 'today' : ''} ${isDayPast ? 'past' : ''}`}>
                      <div className="week-board-header">
                        <div className="week-board-day-heading">
                          <div className="week-board-day-name-row">
                            <span className="week-board-day-name">{WEEKDAYS[day.getDay()]}</span>
                          </div>
                          <div className="week-board-day-date">
                            {String(day.getDate()).padStart(2, '0')}/{String(day.getMonth() + 1).padStart(2, '0')}
                          </div>
                        </div>
                        {!isDayPast && (
                          <button
                            className="week-board-add-btn"
                            onClick={() => handleCreateForDate(day)}
                            title="Thêm lịch học"
                          >
                            +
                          </button>
                        )}
                      </div>

                      <div className="week-board-body">
                        {daySessions.length === 0 && (
                          <div className="week-board-empty">Không có lịch học</div>
                        )}

                        {daySessions.map((s) => (
                          <div
                            key={s.id}
                            className="week-board-event"
                            onClick={() => handleEventClick(s)}
                          >
                            <div className="week-board-event-time">{s.startTime} - {s.endTime}</div>
                            <div className="week-board-event-title" title={s.title}>{s.title}</div>
                            <div className="week-board-event-meta">
                              <span className="week-board-event-type-icon">{renderSessionBadge(s)}</span>
                              <span className="week-board-event-type-text">{s.type === SESSION_TYPE.ONLINE ? 'Trực tuyến' : (s.location || 'Tại lớp')}</span>
                            </div>
                            <div className={`week-board-event-actions ${s.type === SESSION_TYPE.ONLINE && s.meetingLink ? '' : 'is-placeholder'}`}>
                              {s.type === SESSION_TYPE.ONLINE && s.meetingLink ? (
                                <button
                                  type="button"
                                  className="week-board-join-btn"
                                  disabled={!canJoinSession(s)}
                                  title={getJoinDisabledReason(s) ?? 'Tham gia buổi học'}
                                  onClick={(e) => handleJoinMeeting(s, e)}
                                >
                                  Tham gia
                                </button>
                              ) : (
                                <span className="week-board-join-placeholder" aria-hidden="true" />
                              )}
                            </div>
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

        {/* Floating Create Button */}
        <button className="floating-create-btn" onClick={handleCreate} title="Tạo buổi học mới">
          <Plus size={24} />
        </button>
      </div>

      {/* Session Modal – mapped to CreateClassSessionRequestDTO */}
      <SessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        session={selectedSession}
        presetDate={presetSessionDate}
      />

      {/* Event Detail Modal – Google Calendar style */}
      <EventDetailModal
        isOpen={isEventDetailOpen}
        onClose={handleCloseEventDetail}
        session={selectedEventForDetail}
        onJoin={handleJoinMeeting}
        canJoinSession={canJoinSession}
        getJoinDisabledReason={getJoinDisabledReason}
        onEdit={handleEventEdit}
        onDelete={handleEventDelete}
        onOpenAttendance={handleOpenAttendance}
      />

      {/* Day Detail Modal */}
      {isDayDetailOpen && selectedDayDate && (
        <div className="modal-overlay" onClick={handleCloseDayDetail}>
          <div className="day-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="day-detail-header">
              <h3>
                {WEEKDAYS[selectedDayDate.getDay()]}, {selectedDayDate.getDate()} {MONTHS[selectedDayDate.getMonth()]} {selectedDayDate.getFullYear()}
              </h3>
              <button className="close-modal-btn" onClick={handleCloseDayDetail}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 8.586L3.707 2.293 2.293 3.707 8.586 10l-6.293 6.293 1.414 1.414L10 11.414l6.293 6.293 1.414-1.414L11.414 10l6.293-6.293-1.414-1.414L10 8.586z"/>
                </svg>
              </button>
            </div>
            <div className="day-detail-content">
              {getSessionsForDate(selectedDayDate).length === 0 ? (
                <div className="no-events-message">Không có buổi học nào trong ngày này</div>
              ) : (
                <div className="day-detail-events">
                  {getSessionsForDate(selectedDayDate)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((s) => (
                      <div 
                        key={s.id} 
                        className="day-detail-event-item"
                        onClick={() => { handleCloseDayDetail(); handleEventClick(s); }}
                      >
                        <div className="day-detail-event-header">
                          <div>
                            <div className="day-detail-event-time">
                              {s.startTime} - {s.endTime} {renderSessionBadge(s)}
                            </div>
                            <div className="day-detail-event-title">{s.title}</div>
                          </div>
                        </div>
                        {s.description && (
                          <div className="day-detail-event-description">{s.description}</div>
                        )}
                        {s.type === SESSION_TYPE.OFFLINE && s.location && (
                          <div className="day-detail-event-location">
                            <MapPin size={14} /> {s.location}
                          </div>
                        )}
                        {s.type === SESSION_TYPE.ONLINE && s.meetingLink && (
                          <div className="day-detail-event-location">
                            <Video size={14} />
                            <button
                              type="button"
                              className="day-detail-join-btn"
                              disabled={!canJoinSession(s)}
                              title={getJoinDisabledReason(s) ?? 'Tham gia buổi học'}
                              onClick={(e) => handleJoinMeeting(s, e)}
                            >
                              Tham gia cuộc họp
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ClassroomDetailLayout>
  );
};

export default SchedulePage;
