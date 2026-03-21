import { X, Edit, Trash2, MapPin, Video, Calendar, Clock } from 'lucide-react';
import { SESSION_TYPE } from '@/schema/scheduleSchema';
import '@/assets/css/components/eventDetailModal.css';

/**
 * Modal hiển thị chi tiết sự kiện (Google Calendar style)
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.session - ClassSessionResponseDTO
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 */
const EventDetailModal = ({ isOpen, onClose, session, onEdit, onDelete }) => {
  if (!isOpen || !session) return null;

  const handleEdit = () => {
    onEdit(session);
    onClose();
  };

  const handleDelete = () => {
    onDelete(session.id);
    onClose();
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${weekdays[date.getDay()]}, ${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
  };

  return (
    <div className="event-detail-overlay" onClick={onClose}>
      <div className="event-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="event-detail-header">
          <div className="event-detail-color-bar" />
          <div className="event-detail-header-content">
            <h2 className="event-detail-title">{session.title}</h2>
            <div className="event-detail-datetime">
              {formatDate(session.sessionDate)} · {session.startTime} – {session.endTime}
            </div>
          </div>
          <div className="event-detail-actions">
            <button
              className="event-detail-action-btn"
              onClick={handleEdit}
              title="Chỉnh sửa"
            >
              <Edit size={20} />
            </button>
            <button
              className="event-detail-action-btn event-detail-action-btn--danger"
              onClick={handleDelete}
              title="Xóa"
            >
              <Trash2 size={20} />
            </button>
            <button
              className="event-detail-action-btn"
              onClick={onClose}
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="event-detail-body">
          {/* Time info */}
          <div className="event-detail-section">
            <Clock size={20} className="event-detail-icon" />
            <div className="event-detail-section-content">
              <div className="event-detail-time">
                {session.startTime} – {session.endTime}
              </div>
              <div className="event-detail-date">{formatDate(session.sessionDate)}</div>
            </div>
          </div>

          {/* Type & Location/Link */}
          {session.type === SESSION_TYPE.OFFLINE && session.location && (
            <div className="event-detail-section">
              <MapPin size={20} className="event-detail-icon" />
              <div className="event-detail-section-content">
                <div className="event-detail-label">Địa điểm</div>
                <div className="event-detail-value">{session.location}</div>
              </div>
            </div>
          )}

          {session.type === SESSION_TYPE.ONLINE && session.meetingLink && (
            <div className="event-detail-section">
              <Video size={20} className="event-detail-icon" />
              <div className="event-detail-section-content">
                <div className="event-detail-label">Link cuộc họp</div>
                <a
                  href={session.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-detail-link"
                >
                  Tham gia cuộc họp
                </a>
              </div>
            </div>
          )}

          {/* Description */}
          {session.description && (
            <div className="event-detail-section">
              <div className="event-detail-section-content event-detail-section-content--full">
                <div className="event-detail-label">Mô tả</div>
                <div className="event-detail-description">{session.description}</div>
              </div>
            </div>
          )}

          {/* Classroom info */}
          {session.classroomName && (
            <div className="event-detail-section">
              <Calendar size={20} className="event-detail-icon" />
              <div className="event-detail-section-content">
                <div className="event-detail-label">Lớp học</div>
                <div className="event-detail-value">{session.classroomName}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;
