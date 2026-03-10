import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, MapPin, Video } from 'lucide-react';
import ClassroomDetailLayout from '@/components/ClassroomDetailLayout';
import SessionModal from '@/components/SessionModal';
import useSchedule from '@/hooks/useSchedule';
import { SESSION_TYPE } from '@/schema/scheduleSchema';
import '@/assets/css/pages/classroom/classroomSchedule.css';

const VIEW_MODES = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
};

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];
const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00',
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

// ─── Component ────────────────────────────────────────────────────────────────

const SchedulePage = () => {
  const { id: classroomId } = useParams();
  const { sessions, loading, error, createSession, updateSession, deleteSession } = useSchedule(classroomId);

  const [viewMode, setViewMode] = useState(VIEW_MODES.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState(null);

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

  const getSessionsForDateTime = (date, timeSlot) => {
    const slotHour = timeSlot.split(':')[0];
    return getSessionsForDate(date).filter((s) => s.startTime?.split(':')[0] === slotHour);
  };

  // ─── Modal Handlers ────────────────────────────────────────────────────────

  const handleCreate = () => {
    setSelectedSession(null);
    setIsModalOpen(true);
  };

  const handleEdit = (session) => {
    setSelectedSession(session);
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
      if (sessionId) {
        await updateSession(sessionId, payload);
      } else {
        await createSession(payload);
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

  // ─── Auto scroll to current time on mount (Google Calendar style) ───────

  useEffect(() => {
    if (viewMode === VIEW_MODES.WEEK || viewMode === VIEW_MODES.DAY) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Scroll to current hour or closest available slot
        let targetHour = currentHour;
        if (currentHour < 7) targetHour = 7;
        if (currentHour > 22) targetHour = 22;
        
        const targetSlot = `${String(targetHour).padStart(2, '0')}:00`;
        const timeLabels = document.querySelectorAll('.time-slot-label, .day-time-slot-label');
        
        timeLabels.forEach((label) => {
          if (label.textContent.trim() === targetSlot) {
            // Scroll with offset from top (Google Calendar style)
            const container = label.closest('.week-view-container, .day-view-container');
            if (container) {
              const offset = label.offsetTop - 100; // 100px from top
              container.scrollTo({ top: offset, behavior: 'smooth' });
            }
          }
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [viewMode, currentDate]);

  // ─── Current time info for indicator ─────────────────────────────────────

  const getCurrentTimeInfo = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return { hours, minutes, isToday: true };
  };

  // ─── Derived data ──────────────────────────────────────────────────────────

  const days = getDaysInMonth(currentDate);
  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Always show full time slots (7:00 - 22:00) for week/day view
  const weekDays = viewMode === VIEW_MODES.WEEK ? getWeekDays(currentDate) : [];

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderSessionBadge = (session) => (
    <span className="event-type-badge" title={session.type === SESSION_TYPE.ONLINE ? 'Trực tuyến' : 'Trực tiếp'}>
      {session.type === SESSION_TYPE.ONLINE ? <Video size={10} /> : <MapPin size={10} />}
    </span>
  );

  const renderSessionActions = (session, iconSize = 14) => (
    <div className="event-actions">
      <button className="event-action-btn edit" onClick={(e) => { e.stopPropagation(); handleEdit(session); }} title="Chỉnh sửa">
        <Edit size={iconSize} />
      </button>
      <button className="event-action-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }} title="Xóa">
        <Trash2 size={iconSize} />
      </button>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <ClassroomDetailLayout>
      <div className="classroom-schedule-page">
        <h1 className="schedule-title">Lịch Học</h1>

        {/* View mode tabs */}
        <div className="schedule-tabs">
          {Object.entries({ [VIEW_MODES.MONTH]: 'Tháng', [VIEW_MODES.WEEK]: 'Tuần', [VIEW_MODES.DAY]: 'Ngày' }).map(
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
            <>
              <button className="nav-button" onClick={() => navigate(-7, 'day')}><ChevronLeft size={20} /> Tuần trước</button>
              <div className="current-date">{(() => { const w = getWeekDays(currentDate); return formatDateRange(w[0], w[6]); })()}</div>
              <button className="nav-button" onClick={() => navigate(7, 'day')}>Tuần sau <ChevronRight size={20} /></button>
            </>
          )}
          {viewMode === VIEW_MODES.DAY && (
            <>
              <button className="nav-button" onClick={() => navigate(-1, 'day')}><ChevronLeft size={20} /> Hôm trước</button>
              <div className="current-date">{WEEKDAYS[currentDate.getDay()]}, {currentDate.getDate()} {currentMonth} {currentYear}</div>
              <button className="nav-button" onClick={() => navigate(1, 'day')}>Hôm sau <ChevronRight size={20} /></button>
            </>
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
                return (
                  <div 
                    key={index} 
                    className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''}`}
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="event-content">
                                <span className="event-time">{s.startTime} {renderSessionBadge(s)}</span>
                                <span className="event-title">{s.title}</span>
                              </div>
                              {renderSessionActions(s)}
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
          const currentTime = getCurrentTimeInfo();
          return (
            <div className="week-view-container compact">
                  <div className="week-view-grid">
                    <div className="time-column">
                      <div className="time-header" />
                      {TIME_SLOTS.map((t) => (<div key={t} className="time-slot-label">{t}</div>))}
                    </div>
                    {weekDaysView.map((day, di) => {
                      const isDayToday = isToday(day);
                      return (
                        <div key={di} className="week-day-column">
                          <div className={`week-day-header ${isDayToday ? 'today' : ''}`}>
                            <div className="week-day-name">{WEEKDAYS_SHORT[day.getDay()]}</div>
                            <div className="week-day-number">{day.getDate()}</div>
                          </div>
                          <div className="week-time-slots">
                          {TIME_SLOTS.map((ts, ti) => {
                              const slotSessions = getSessionsForDateTime(day, ts);
                              const [slotHour] = ts.split(':').map(Number);
                              const showCurrentTimeLine = isDayToday && 
                                currentTime.hours === slotHour && 
                                currentTime.minutes < 60;
                              const currentTimePosition = showCurrentTimeLine 
                                ? (currentTime.minutes / 60) * 100 
                                : 0;
                              
                              return (
                                <div key={ti} className="week-time-slot">
                                  {showCurrentTimeLine && (
                                    <div 
                                      className="current-time-indicator" 
                                      style={{ top: `${currentTimePosition}%` }}
                                    >
                                      <div className="current-time-dot" />
                                      <div className="current-time-line" />
                                    </div>
                                  )}
                                  {slotSessions.map((s) => (
                                    <div key={s.id} className="week-event-item">
                                      <div className="week-event-content">
                                        <div className="week-event-time">{s.startTime} - {s.endTime}</div>
                                        <div className="week-event-title">{s.title}</div>
                                      </div>
                                      <div className="week-event-actions">
                                        {renderSessionActions(s, 12)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
          );
        })()}

        {/* ─── DAY VIEW ────────────────────────────────────────────────────── */}
        {!loading && !error && viewMode === VIEW_MODES.DAY && (() => {
          const currentTime = getCurrentTimeInfo();
          const isDayToday = isToday(currentDate);
          return (
            <div className="day-view-container compact">
                  <div className="day-view-grid">
                    <div className="time-column">
                      {TIME_SLOTS.map((t) => (<div key={t} className="day-time-slot-label">{t}</div>))}
                    </div>
                    <div className="day-events-column">
                      {TIME_SLOTS.map((ts, index) => {
                        const slotSessions = getSessionsForDateTime(currentDate, ts);
                        const [slotHour] = ts.split(':').map(Number);
                        const showCurrentTimeLine = isDayToday && 
                          currentTime.hours === slotHour && 
                          currentTime.minutes < 60;
                        const currentTimePosition = showCurrentTimeLine 
                          ? (currentTime.minutes / 60) * 100 
                          : 0;
                        
                        return (
                          <div key={index} className="day-time-slot">
                            {showCurrentTimeLine && (
                              <div 
                                className="current-time-indicator" 
                                style={{ top: `${currentTimePosition}%` }}
                              >
                                <div className="current-time-dot" />
                                <div className="current-time-line" />
                              </div>
                            )}
                            {slotSessions.map((s) => (
                              <div key={s.id} className="day-event-item">
                                <div className="day-event-header">
                                  <div className="day-event-time">{s.startTime} - {s.endTime} {renderSessionBadge(s)}</div>
                                  <div className="day-event-title">{s.title}</div>
                                  {renderSessionActions(s)}
                                </div>
                                {s.description && <div className="day-event-description">{s.description}</div>}
                                {s.type === SESSION_TYPE.OFFLINE && s.location && (
                                  <div className="day-event-location"><MapPin size={12} /> {s.location}</div>
                                )}
                                {s.type === SESSION_TYPE.ONLINE && s.meetingLink && (
                                  <div className="day-event-location"><Video size={12} /> <a href={s.meetingLink} target="_blank" rel="noopener noreferrer">Tham gia cuộc họp</a></div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
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
                      <div key={s.id} className="day-detail-event-item">
                        <div className="day-detail-event-header">
                          <div>
                            <div className="day-detail-event-time">
                              {s.startTime} - {s.endTime} {renderSessionBadge(s)}
                            </div>
                            <div className="day-detail-event-title">{s.title}</div>
                          </div>
                          {renderSessionActions(s, 16)}
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
                            <a href={s.meetingLink} target="_blank" rel="noopener noreferrer">
                              Tham gia cuộc họp
                            </a>
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
