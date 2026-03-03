import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import '@/assets/css/components/eventModal.css';

const EventModal = ({ isOpen, onClose, onSubmit, event, classroomId }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    eventType: 'in-person', // 'in-person' or 'online'
    description: '',
    meetingLink: '',
    autoCreateMeet: false,
    location: '',
    address: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      // Edit mode: populate form with existing event data
      const startDateTime = new Date(event.date);
      const startDate = startDateTime.toISOString().split('T')[0];
      
      setFormData({
        title: event.title || '',
        startDate: startDate,
        startTime: event.startTime || '',
        endDate: startDate, // Default to same date
        endTime: event.endTime || '',
        eventType: event.eventType || 'in-person',
        description: event.description || '',
        meetingLink: event.meetingLink || '',
        autoCreateMeet: false,
        location: event.location || '',
        address: event.address || '',
      });
    } else {
      // Create mode: reset form
      resetForm();
    }
  }, [event, isOpen]);

  const resetForm = () => {
    setFormData({
      title: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      eventType: 'in-person',
      description: '',
      meetingLink: '',
      autoCreateMeet: false,
      location: '',
      address: '',
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề sự kiện';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Vui lòng chọn giờ kết thúc';
    }

    // Validate end time is after start time
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime <= startDateTime) {
        newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }

    if (formData.eventType === 'online' && !formData.meetingLink.trim() && !formData.autoCreateMeet) {
      newErrors.meetingLink = 'Vui lòng nhập link cuộc họp hoặc tự động tạo link';
    }

    if (formData.eventType === 'in-person' && !formData.location.trim()) {
      newErrors.location = 'Vui lòng nhập phòng học/địa điểm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Prepare data for submission
    const eventData = {
      ...formData,
      classroomId,
      id: event?.id, // Include ID if editing
    };

    onSubmit(eventData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="event-modal-overlay" onClick={handleClose}>
      <div className="event-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="event-modal-header">
          <h2>{event ? 'Chỉnh Sửa Sự Kiện' : 'Tạo Sự Kiện Mới'}</h2>
          <button className="event-modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="event-modal-form">
          {/* Event Details Section */}
          <div className="form-section">
            <h3>Chi Tiết Sự Kiện</h3>

            {/* Title */}
            <div className="form-group">
              <label>
                Tiêu đề sự kiện <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Vd: Bài giảng chương 1"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            {/* Time Range */}
            <div className="form-section-title">Thời gian</div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Ngày bắt đầu <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={errors.startDate ? 'error' : ''}
                />
                {errors.startDate && <span className="error-message">{errors.startDate}</span>}
              </div>

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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Ngày kết thúc <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={errors.endDate ? 'error' : ''}
                />
                {errors.endDate && <span className="error-message">{errors.endDate}</span>}
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

            {/* Event Type */}
            <div className="form-group">
              <label>Loại sự kiện <span className="required">*</span></label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="eventType"
                    value="in-person"
                    checked={formData.eventType === 'in-person'}
                    onChange={handleChange}
                  />
                  <span>Trực tiếp tại lớp</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="eventType"
                    value="online"
                    checked={formData.eventType === 'online'}
                    onChange={handleChange}
                  />
                  <span>Học trực tuyến</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập mô tả về nội dung học..."
                rows={4}
              />
            </div>
          </div>

          {/* Online-specific fields */}
          {formData.eventType === 'online' && (
            <div className="form-section">
              <h3>Link Cuộc Họp Trực Tuyến</h3>

              <div className="form-group">
                <label>Link cuộc họp</label>
                <input
                  type="url"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  className={errors.meetingLink ? 'error' : ''}
                  disabled={formData.autoCreateMeet}
                />
                {errors.meetingLink && <span className="error-message">{errors.meetingLink}</span>}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="autoCreateMeet"
                    checked={formData.autoCreateMeet}
                    onChange={handleChange}
                  />
                  <span>Tự động tạo link Google Meet</span>
                </label>
              </div>
            </div>
          )}

          {/* In-person-specific fields */}
          {formData.eventType === 'in-person' && (
            <div className="form-section">
              <h3>Địa Điểm</h3>

              <div className="form-group">
                <label>
                  Phòng học/Địa điểm <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Vd: Phòng 301, Tòa nhà A"
                  className={errors.location ? 'error' : ''}
                />
                {errors.location && <span className="error-message">{errors.location}</span>}
              </div>

              <div className="form-group">
                <label>Địa chỉ cụ thể</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Vd: 123 Đường, Quận, Thành phố"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="event-modal-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit">
              {event ? 'Cập Nhật' : 'Tạo Sự Kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
