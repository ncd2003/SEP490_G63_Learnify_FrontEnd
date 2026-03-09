import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import ClassroomDetailLayout from '@/components/ClassroomDetailLayout';
import EventModal from '@/components/EventModal';
import classroomApi from '@/apis/classroomApi';
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
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

const ClassroomSchedule = () => {
  const { id: classroomId } = useParams();
  const [viewMode, setViewMode] = useState(VIEW_MODES.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch schedule events on mount
  useEffect(() => {
    fetchScheduleEvents();
  }, [classroomId]);

  const fetchScheduleEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classroomApi.getScheduleEvents(classroomId);
      
      if (response.code === 1000) {
        // Transform API data to component format
        const transformedEvents = response.result.map(event => ({
          ...event,
          date: new Date(event.date || event.startDate), // Adjust based on actual API field
        }));
        setEvents(transformedEvents);
      } else {
        console.warn('Failed to fetch events:', response.message);
        // Keep using mock data if API not ready
        setEvents(getMockEvents());
      }
    } catch (err) {
      console.error('Error fetching schedule events:', err);
      // Fallback to mock data if API fails
      setEvents(getMockEvents());
    } finally {
      setLoading(false);
    }
  };

  const getMockEvents = () => [
    {
      id: 1,
      date: new Date(2026, 2, 4),
      startTime: '14:30',
      endTime: '16:30',
      title: 'Học phần',
      description: 'Thuyết trình video trong trò...',
    },
    {
      id: 2,
      date: new Date(2026, 2, 11),
      startTime: '14:30',
      endTime: '16:30',
      title: 'Học phần',
      description: 'Lớp học học trực tuyến',
    },
    {
      id: 3,
      date: new Date(2026, 2, 13),
      startTime: '08:00',
      endTime: '10:00',
      title: 'Học phần',
      description: 'Lớp học học trực tuyến',
    },
    {
      id: 4,
      date: new Date(2026, 2, 18),
      startTime: '14:30',
      endTime: '16:30',
      title: 'Học phần',
      description: 'Lớp học học trực tuyến',
    },
    {
      id: 5,
      date: new Date(2026, 2, 25),
      startTime: '14:30',
      endTime: '16:30',
      title: 'Học phần (Zoom/G Meet)',
      description: null,
    },
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = event.date;
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const getWeekDays = (date) => {
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const getEventsForDateTime = (date, timeSlot) => {
    const dateEvents = getEventsForDate(date);
    return dateEvents.filter(event => {
      const eventStart = event.startTime.split(':')[0];
      const slotHour = timeSlot.split(':')[0];
      return eventStart === slotHour;
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = `${startDate.getDate()}/${startDate.getMonth() + 1}`;
    const end = `${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
    return `${start} - ${end}`;
  };

  // Modal handlers
  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      try {
        const response = await classroomApi.deleteScheduleEvent(classroomId, eventId);
        
        if (response.code === 1000) {
          // Remove event from local state
          setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
          alert('Xóa sự kiện thành công!');
        } else {
          alert(response.message || 'Không thể xóa sự kiện');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Có lỗi xảy ra khi xóa sự kiện');
      }
    }
  };

  const handleSubmitEvent = async (eventData) => {
    try {
      if (eventData.id) {
        // Update existing event
        const response = await classroomApi.updateScheduleEvent(
          classroomId,
          eventData.id,
          eventData
        );
        
        if (response.code === 1000) {
          // Update event in local state
          setEvents(prevEvents =>
            prevEvents.map(e => (e.id === eventData.id ? { ...e, ...response.result } : e))
          );
          alert('Cập nhật sự kiện thành công!');
          setIsModalOpen(false);
        } else {
          alert(response.message || 'Không thể cập nhật sự kiện');
        }
      } else {
        // Create new event
        const response = await classroomApi.createScheduleEvent(classroomId, eventData);
        
        if (response.code === 1000) {
          // Add new event to local state
          const newEvent = {
            ...response.result,
            date: new Date(response.result.date || response.result.startDate),
          };
          setEvents(prevEvents => [...prevEvents, newEvent]);
          alert('Tạo sự kiện thành công!');
          setIsModalOpen(false);
        } else {
          alert(response.message || 'Không thể tạo sự kiện');
        }
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const days = getDaysInMonth(currentDate);
  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  return (
    <ClassroomDetailLayout>
      <div className="classroom-schedule-page">
        <h1 className="schedule-title">Lịch Học</h1>

        {/* View mode tabs */}
        <div className="schedule-tabs">
          <button
            className={`schedule-tab ${viewMode === VIEW_MODES.MONTH ? 'active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.MONTH)}
          >
            Tháng
          </button>
          <button
            className={`schedule-tab ${viewMode === VIEW_MODES.WEEK ? 'active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.WEEK)}
          >
            Tuần
          </button>
          <button
            className={`schedule-tab ${viewMode === VIEW_MODES.DAY ? 'active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.DAY)}
          >
            Ngày
          </button>
        </div>

        {/* Navigation */}
        <div className="schedule-navigation">
          {viewMode === VIEW_MODES.MONTH && (
            <>
              <button className="nav-button" onClick={handlePrevMonth}>
                <ChevronLeft size={20} />
                Trước
              </button>
              <div className="current-date">
                {currentMonth}, {currentYear}
              </div>
              <button className="nav-button" onClick={handleNextMonth}>
                Sau
                <ChevronRight size={20} />
              </button>
            </>
          )}
          {viewMode === VIEW_MODES.WEEK && (
            <>
              <button className="nav-button" onClick={handlePrevWeek}>
                <ChevronLeft size={20} />
                Tuần trước
              </button>
              <div className="current-date">
                {(() => {
                  const weekDays = getWeekDays(currentDate);
                  return formatDateRange(weekDays[0], weekDays[6]);
                })()}
              </div>
              <button className="nav-button" onClick={handleNextWeek}>
                Tuần sau
                <ChevronRight size={20} />
              </button>
            </>
          )}
          {viewMode === VIEW_MODES.DAY && (
            <>
              <button className="nav-button" onClick={handlePrevDay}>
                <ChevronLeft size={20} />
                Hôm trước
              </button>
              <div className="current-date">
                {WEEKDAYS[currentDate.getDay()]}, {currentDate.getDate()} {currentMonth} {currentYear}
              </div>
              <button className="nav-button" onClick={handleNextDay}>
                Hôm sau
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="view-placeholder">
            <p>Đang tải lịch học...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="view-placeholder" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
            <p>Có lỗi xảy ra khi tải lịch học. Vui lòng thử lại.</p>
          </div>
        )}

        {/* Calendar grid */}
        {!loading && !error && viewMode === VIEW_MODES.MONTH && (
          <div className="calendar-container">
            <div className="calendar-header">
              {WEEKDAYS.map((day) => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}
            </div>
            <div className="calendar-grid">
              {days.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                return (
                  <div
                    key={index}
                    className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''}`}
                  >
                    {date && (
                      <>
                        <div className="day-number">{date.getDate()}</div>
                        <div className="day-events">
                          {dayEvents.map((event) => (
                            <div key={event.id} className="event-item">
                              <div className="event-content">
                                <div className="event-time">
                                  {event.startTime} - {event.endTime}
                                </div>
                                <div className="event-title">{event.title}</div>
                                {event.description && (
                                  <div className="event-description">{event.description}</div>
                                )}
                              </div>
                              <div className="event-actions">
                                <button
                                  className="event-action-btn edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event);
                                  }}
                                  title="Chỉnh sửa"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="event-action-btn delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event.id);
                                  }}
                                  title="Xóa"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week view */}
        {!loading && !error && viewMode === VIEW_MODES.WEEK && (() => {
          const weekDays = getWeekDays(currentDate);
          return (
            <div className="week-view-container">
              <div className="week-view-grid">
                {/* Time column */}
                <div className="time-column">
                  <div className="time-header"></div>
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="time-slot-label">
                      {time}
                    </div>
                  ))}
                </div>
                
                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                  const dayEvents = getEventsForDate(day);
                  return (
                    <div key={dayIndex} className="week-day-column">
                      <div className={`week-day-header ${isToday(day) ? 'today' : ''}`}>
                        <div className="week-day-name">{WEEKDAYS_SHORT[day.getDay()]}</div>
                        <div className="week-day-number">{day.getDate()}</div>
                      </div>
                      <div className="week-time-slots">
                        {TIME_SLOTS.map((timeSlot, timeIndex) => {
                          const slotEvents = getEventsForDateTime(day, timeSlot);
                          return (
                            <div key={timeIndex} className="week-time-slot">
                              {slotEvents.map((event) => (
                                <div key={event.id} className="week-event-item">
                                  <div className="week-event-content">
                                    <div className="week-event-time">
                                      {event.startTime} - {event.endTime}
                                    </div>
                                    <div className="week-event-title">{event.title}</div>
                                  </div>
                                  <div className="week-event-actions">
                                    <button
                                      className="event-action-btn edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditEvent(event);
                                      }}
                                      title="Chỉnh sửa"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      className="event-action-btn delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEvent(event.id);
                                      }}
                                      title="Xóa"
                                    >
                                      <Trash2 size={12} />
                                    </button>
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

        {/* Day view */}
        {!loading && !error && viewMode === VIEW_MODES.DAY && (() => {
          const dayEvents = getEventsForDate(currentDate);
          return (
            <div className="day-view-container">
              <div className="day-view-grid">
                {/* Time column */}
                <div className="time-column">
                  {TIME_SLOTS.map((time) => (
                    <div key={time} className="day-time-slot-label">
                      {time}
                    </div>
                  ))}
                </div>
                
                {/* Events column */}
                <div className="day-events-column">
                  {TIME_SLOTS.map((timeSlot, index) => {
                    const slotEvents = getEventsForDateTime(currentDate, timeSlot);
                    return (
                      <div key={index} className="day-time-slot">
                        {slotEvents.map((event) => (
                          <div key={event.id} className="day-event-item">
                            <div className="day-event-header">
                              <div className="day-event-time">
                                {event.startTime} - {event.endTime}
                              </div>
                              <div className="day-event-title">{event.title}</div>
                              <div className="day-event-actions">
                                <button
                                  className="event-action-btn edit"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event);
                                  }}
                                  title="Chỉnh sửa"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className="event-action-btn delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event.id);
                                  }}
                                  title="Xóa"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {event.description && (
                              <div className="day-event-description">
                                {event.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Event summary */}
              {dayEvents.length > 0 && (
                <div className="day-event-summary">
                  <h3>Tổng kết ({dayEvents.length} sự kiện)</h3>
                  <div className="event-summary-list">
                    {dayEvents.map((event) => (
                      <div key={event.id} className="event-summary-item">
                        <div className="event-summary-time">
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="event-summary-details">
                          <div className="event-summary-title">{event.title}</div>
                          {event.description && (
                            <div className="event-summary-description">
                              {event.description}
                            </div>
                          )}
                        </div>
                        <div className="event-summary-actions">
                          <button
                            className="event-action-btn edit"
                            onClick={() => handleEditEvent(event)}
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="event-action-btn delete"
                            onClick={() => handleDeleteEvent(event.id)}
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Floating Create Button */}
        <button className="floating-create-btn" onClick={handleCreateEvent} title="Tạo sự kiện mới">
          <Plus size={24} />
        </button>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitEvent}
        event={selectedEvent}
        classroomId={classroomId}
      />
    </ClassroomDetailLayout>
  );
};

export default ClassroomSchedule;
