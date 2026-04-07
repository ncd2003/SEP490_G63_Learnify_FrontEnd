import { X, Edit, Trash2, MapPin, Video, Calendar, Clock, Users } from 'lucide-react';
import { SESSION_TYPE } from '@/schema/scheduleSchema';
import '@/assets/css/components/eventDetailModal.css';

/**
 * Modal hiển thị chi tiết sự kiện (Google Calendar style)
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.session - ClassSessionResponseDTO
 * @param {Function} props.onJoin
 * @param {Function} props.canJoinSession
 * @param {Function} props.getJoinDisabledReason
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 * @param {Function} props.onOpenAttendance
 */
const EventDetailModal = ({ isOpen, onClose, session, onJoin, canJoinSession, getJoinDisabledReason, onEdit, onDelete, onOpenAttendance }) => {
  if (!isOpen || !session) return null;

  const canJoin = canJoinSession ? canJoinSession(session) : true;
  const joinDisabledReason = getJoinDisabledReason ? getJoinDisabledReason(session) : null;
  const canEdit = typeof onEdit === "function";
  const canDelete = typeof onDelete === "function";
  const canOpenAttendance = typeof onOpenAttendance === "function";

  const handleEdit = () => {
    if (!canEdit) return;
    onEdit(session);
    onClose();
  };

  const handleDelete = () => {
    if (!canDelete) return;
    onDelete(session.id);
    onClose();
  };

  const handleOpenAttendance = () => {
    onOpenAttendance?.(session);
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
        <div className="event-detail-toolbar">
          {session.type === SESSION_TYPE.ONLINE && session.meetingLink ? (
            <button
              type="button"
              className="event-detail-join-btn"
              disabled={!canJoin}
              title={joinDisabledReason ?? 'Tham gia buổi học'}
              onClick={(e) => onJoin?.(session, e)}
            >
              <Video size={16} />
              Vào phòng
            </button>
          ) : (
            <span className="event-detail-pill">Buổi học trực tiếp</span>
          )}

          <span className="event-detail-pill event-detail-pill--muted">
            {session.startTime} - {session.endTime}
          </span>

          <div className="event-detail-actions">
            {canEdit && (
              <button className="event-detail-action-btn" onClick={handleEdit} title="Chỉnh sửa">
                <Edit size={18} />
              </button>
            )}
            {canDelete && (
              <button className="event-detail-action-btn event-detail-action-btn--danger" onClick={handleDelete} title="Xóa">
                <Trash2 size={18} />
              </button>
            )}
            <button className="event-detail-action-btn" onClick={onClose} title="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="event-detail-headline">{session.title}</div>

        <div className="event-detail-body">
          <div className="event-detail-section">
            <Clock size={20} className="event-detail-icon" />
            <div className="event-detail-section-content">
              <div className="event-detail-time">{formatDate(session.sessionDate)}</div>
              <div className="event-detail-date">{session.startTime} - {session.endTime}</div>
            </div>
          </div>

          <div className="event-detail-section">
            <Users size={20} className="event-detail-icon" />
            <div className="event-detail-section-content">
              <div className="event-detail-label">Điểm danh</div>
              <div className="event-detail-value">{session.attendanceTaken ? 'Đã mở' : 'Chưa mở'}</div>
              {canOpenAttendance && session.id && (
                <button type="button" className="event-detail-link event-detail-link-btn" onClick={handleOpenAttendance}>
                  Mở trang điểm danh
                </button>
              )}
            </div>
          </div>

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
                <div className="event-detail-label">Loại phòng: Jitsi Meet</div>
                <button
                  type="button"
                  className="event-detail-link event-detail-link-btn"
                  disabled={!canJoin}
                  title={joinDisabledReason ?? 'Tham gia buổi học'}
                  onClick={(e) => onJoin?.(session, e)}
                >
                  Tham gia cuộc họp
                </button>
              </div>
            </div>
          )}

          {session.recordingLink && (
            <div className="event-detail-section">
              <Video size={20} className="event-detail-icon" />
              <div className="event-detail-section-content">
                <div className="event-detail-label">Bản ghi buổi học</div>
                <a
                  href={session.recordingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-detail-link"
                >
                  Xem recording
                </a>
              </div>
            </div>
          )}

          {session.description && (
            <div className="event-detail-section">
              <div className="event-detail-section-content event-detail-section-content--full">
                <div className="event-detail-label">Mô tả</div>
                <div className="event-detail-description">{session.description}</div>
              </div>
            </div>
          )}

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
