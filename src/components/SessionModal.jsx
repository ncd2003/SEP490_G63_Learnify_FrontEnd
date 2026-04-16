import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SESSION_TYPE, RECURRENCE_PATTERN, validateSessionForm } from '@/schema/scheduleSchema';
import '@/assets/css/components/eventModal.css';

const toYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

const fromDisplayDate = (displayDate) => {
  if (!displayDate) return '';
  const normalized = displayDate.trim().replace(/\s+/g, '');
  const parts = normalized.split('/');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts;
  if (!day || !month || !year) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const createDefaultFormData = (defaultDate = '') => {
  return {
    title: '',
    description: '',
    sessionDate: defaultDate || '',
    startTime: '',
    endTime: '',
    type: SESSION_TYPE.OFFLINE,
    location: '',
    meetingLink: '',
    recurrencePattern: RECURRENCE_PATTERN.NONE,
    recurrenceCount: null,
    allowRecording: true,
  };
};

/**
 * Modal for creating/editing a ClassSession.
 * Form fields map 1:1 to CreateClassSessionRequestDTO.
 *
 * @param {{ isOpen, onClose, onSubmit, session }} props
 *   - session: ClassSessionResponseDTO | null (null = create mode)
 */
const SessionModal = ({ isOpen, onClose, onSubmit, session, presetDate = '' }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sessionDate: '',
    startTime: '',
    endTime: '',
    type: SESSION_TYPE.OFFLINE,
    location: '',
    meetingLink: '',
    recurrencePattern: RECURRENCE_PATTERN.NONE,
    recurrenceCount: null,
    allowRecording: true,
  });
  const [displaySessionDate, setDisplaySessionDate] = useState('');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      const sessionDate = session.sessionDate ?? '';
      setFormData({
        title: session.title ?? '',
        description: session.description ?? '',
        sessionDate,
        startTime: session.startTime ?? '',
        endTime: session.endTime ?? '',
        type: session.type ?? SESSION_TYPE.OFFLINE,
        location: session.location ?? '',
        meetingLink: session.meetingLink ?? '',
        recurrencePattern: RECURRENCE_PATTERN.NONE,
        recurrenceCount: null,
        allowRecording: session.allowRecording ?? true,
      });
      setDisplaySessionDate(toDisplayDate(sessionDate));
    } else {
      const initialDate = presetDate || '';
      setFormData(createDefaultFormData(initialDate));
      setDisplaySessionDate(toDisplayDate(initialDate));
      setErrors({});
    }
  }, [session, isOpen, presetDate]);

  const resetForm = (defaultDate = '') => {
    setFormData(createDefaultFormData(defaultDate));
    setDisplaySessionDate(toDisplayDate(defaultDate));
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const next = { ...prev, [name]: nextValue };
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDisplayDateChange = (e) => {
    const nextDisplayDate = e.target.value;
    setDisplaySessionDate(nextDisplayDate);

    const nextSessionDate = fromDisplayDate(nextDisplayDate);
    setFormData((prev) => ({ ...prev, sessionDate: nextSessionDate }));

    if (errors.sessionDate) {
      setErrors((prev) => ({ ...prev, sessionDate: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { valid, errors: validationErrors } = validateSessionForm(formData);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Build payload matching CreateClassSessionRequestDTO exactly
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        sessionDate: formData.sessionDate,       // "yyyy-MM-dd"
        startTime: formData.startTime,           // "HH:mm"
        endTime: formData.endTime,               // "HH:mm"
        type: formData.type,                     // "ONLINE" | "OFFLINE"
        location: formData.type === SESSION_TYPE.OFFLINE ? formData.location.trim() || null : null,
        meetingLink: formData.type === SESSION_TYPE.ONLINE ? formData.meetingLink.trim() || null : null,
        recurrencePattern: session ? RECURRENCE_PATTERN.NONE : formData.recurrencePattern,
        recurrenceCount: session ? null : (formData.recurrencePattern !== RECURRENCE_PATTERN.NONE ? Number(formData.recurrenceCount) : null),
        allowRecording: formData.allowRecording,
      };

      await onSubmit(payload, session?.id);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm(presetDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal-overlay" onClick={handleClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="event-modal-header">
          <h2>{session ? 'Chỉnh Sửa Buổi Học' : 'Tạo Buổi Học Mới'}</h2>
          <button className="event-modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="event-modal-form">
          <div className="form-section">
            <h3>Chi Tiết Buổi Học</h3>

            {/* Title → title */}
            <div className="form-group">
              <label>
                Tiêu đề <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Vd: Bài giảng chương 1"
                className={errors.title ? 'error' : ''}
                maxLength={200}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            {/* Session Date & Time → sessionDate, startTime, endTime */}
            <div className="form-section-title">Thời gian</div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Ngày học <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="sessionDateDisplay"
                  value={displaySessionDate}
                  onChange={handleDisplayDateChange}
                  placeholder="dd/mm/yyyy"
                  inputMode="numeric"
                  className={errors.sessionDate ? 'error' : ''}
                />
                {errors.sessionDate && <span className="error-message">{errors.sessionDate}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Giờ bắt đầu <span className="required">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={errors.startTime ? 'error' : ''}
                />
                {errors.startTime && <span className="error-message">{errors.startTime}</span>}
              </div>

              <div className="form-group">
                <label>
                  Giờ kết thúc <span className="required">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={errors.endTime ? 'error' : ''}
                />
                {errors.endTime && <span className="error-message">{errors.endTime}</span>}
              </div>
            </div>

            {/* Type → type (ONLINE | OFFLINE) */}
            <div className="form-group">
              <label>
                Loại buổi học <span className="required">*</span>
              </label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value={SESSION_TYPE.OFFLINE}
                    checked={formData.type === SESSION_TYPE.OFFLINE}
                    onChange={handleChange}
                  />
                  <span>Trực tiếp tại lớp</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="type"
                    value={SESSION_TYPE.ONLINE}
                    checked={formData.type === SESSION_TYPE.ONLINE}
                    onChange={handleChange}
                  />
                  <span>Học trực tuyến</span>
                </label>
              </div>
              {errors.type && <span className="error-message">{errors.type}</span>}
            </div>

            {!session && (
              <div className="form-group">
                <label>Lặp lại lịch học</label>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tần suất lặp lại</label>
                    <select
                      name="recurrencePattern"
                      value={formData.recurrencePattern}
                      onChange={handleChange}
                      className={errors.recurrencePattern ? 'error' : ''}
                    >
                      <option value={RECURRENCE_PATTERN.NONE}>Không lặp lại</option>
                      <option value={RECURRENCE_PATTERN.DAILY}>Hàng ngày</option>
                      <option value={RECURRENCE_PATTERN.WEEKLY}>Hàng tuần</option>
                      <option value={RECURRENCE_PATTERN.MONTHLY}>Hàng tháng</option>
                      <option value={RECURRENCE_PATTERN.YEARLY}>Hàng năm</option>
                    </select>
                    {errors.recurrencePattern && <span className="error-message">{errors.recurrencePattern}</span>}
                  </div>

                  {formData.recurrencePattern !== RECURRENCE_PATTERN.NONE && (
                    <div className="form-group">
                      <label>
                        Số lần lặp lại <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        name="recurrenceCount"
                        value={formData.recurrenceCount ?? ''}
                        onChange={handleChange}
                        placeholder="Vd: 5"
                        min="1"
                        max="365"
                        className={errors.recurrenceCount ? 'error' : ''}
                      />
                      {errors.recurrenceCount && <span className="error-message">{errors.recurrenceCount}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Allow Recording → allowRecording */}
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="allowRecording"
                  checked={formData.allowRecording}
                  onChange={handleChange}
                />
                <span>Cho phép ghi hình buổi học này</span>
              </label>
            </div>

            {/* Description → description */}
            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập mô tả về nội dung buổi học..."
                rows={4}
                maxLength={1000}
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>
          </div>

          {/* Online fields → meetingLink */}
          {formData.type === SESSION_TYPE.ONLINE && (
            <div className="form-section">
              <h3>Link Cuộc Họp Trực Tuyến</h3>
              <p className="form-helper-text">Link phòng học sẽ được hệ thống tự động khởi tạo.</p>
              <div className="form-group">
                <label>Link cuộc họp</label>
                <input
                  type="text"
                  name="meetingLink"
                  value={formData.meetingLink || 'Hệ thống sẽ tự động tạo link Jitsi khi lưu buổi học'}
                  readOnly
                  className={errors.meetingLink ? 'error' : ''}
                />
                {errors.meetingLink && <span className="error-message">{errors.meetingLink}</span>}
              </div>
            </div>
          )}

          {/* Offline fields → location */}
          {formData.type === SESSION_TYPE.OFFLINE && (
            <div className="form-section">
              <h3>Địa Điểm</h3>
              <div className="form-group">
                <label>Phòng học / Địa điểm</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Vd: Phòng 301, Tòa nhà A"
                  className={errors.location ? 'error' : ''}
                  maxLength={200}
                />
                {errors.location && <span className="error-message">{errors.location}</span>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="event-modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : session ? 'Cập Nhật' : 'Tạo Buổi Học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;
