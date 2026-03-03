import { useState, useRef } from "react";
import { X, ImagePlus, Upload } from "lucide-react";
import classroomApi from "@/apis/classroomApi";
import { classroomValidationRules } from "@/schema/classroomSchema";
import "@/assets/css/pages/classroom/modals.css";

const INITIAL_FIELDS = { name: "", subject: "", description: "" };
const INITIAL_ERRORS = { name: "", subject: "", description: "" };

const validate = (fields) => {
  const errors = {};
  const { name: nr, subject: sr, description: dr } = classroomValidationRules;

  const nameLen = fields.name.trim().length;
  if (nameLen < nr.minLength || nameLen > nr.maxLength) {
    errors.name = nr.message;
  }

  const subjectLen = fields.subject.trim().length;
  if (subjectLen < sr.minLength || subjectLen > sr.maxLength) {
    errors.subject = sr.message;
  }

  if (fields.description.trim().length > 0) {
    const descLen = fields.description.trim().length;
    if (descLen < dr.minLength || descLen > dr.maxLength) {
      errors.description = dr.message;
    }
  }

  return errors;
};

const CreateClassroomModal = ({ onClose, onSuccess }) => {
  const fileInputRef = useRef(null);

  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: fields.name.trim(),
        subject: fields.subject.trim(),
        description: fields.description.trim() || undefined,
      };
      await classroomApi.createClassroom(data, imageFile);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setServerError(
        err.response?.data?.message ?? "Tạo lớp học thất bại. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Tạo lớp học mới</h2>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Server error */}
          {serverError && <p className="modal-error-alert">{serverError}</p>}

          {/* Tên lớp */}
          <div className="form-group">
            <label className="form-label">
              Tên lớp <span className="form-label-required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={fields.name}
              onChange={handleFieldChange}
              placeholder="Nhập tên lớp học (3–50 ký tự)"
              className={`form-input ${errors.name ? "has-error" : ""}`}
            />
            {errors.name && <p className="form-error-text">{errors.name}</p>}
          </div>

          {/* Môn học */}
          <div className="form-group">
            <label className="form-label">
              Môn học <span className="form-label-required">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={fields.subject}
              onChange={handleFieldChange}
              placeholder="Ví dụ: Toán, Văn, Tiếng Anh... (3–50 ký tự)"
              className={`form-input ${errors.subject ? "has-error" : ""}`}
            />
            {errors.subject && <p className="form-error-text">{errors.subject}</p>}
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label className="form-label">
              Mô tả
              <span className="form-label-optional">(tuỳ chọn)</span>
            </label>
            <textarea
              name="description"
              value={fields.description}
              onChange={handleFieldChange}
              placeholder="Mô tả ngắn về lớp học (3–50 ký tự nếu điền)..."
              rows={3}
              className={`form-textarea ${errors.description ? "has-error" : ""}`}
            />
            {errors.description && <p className="form-error-text">{errors.description}</p>}
          </div>

          {/* Ảnh đại diện */}
          <div className="form-group">
            <label className="form-label">
              Ảnh đại diện
              <span className="form-label-optional">(tuỳ chọn)</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="image-upload-area"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Xem trước" className="image-preview" />
                  <div className="image-overlay">
                    <Upload size={20} className="image-overlay-icon" />
                    <span className="image-overlay-text">Đổi ảnh</span>
                  </div>
                </>
              ) : (
                <div className="image-placeholder">
                  <ImagePlus className="image-placeholder-icon" />
                  <span className="image-placeholder-text">Kéo thả hoặc nhấn để chọn ảnh</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={handleFileChange}
            />

            {imageFile && <p className="form-hint-text">Đã chọn: {imageFile.name}</p>}
          </div>

          {/* Actions */}
          <div className="modal-actions with-padding-top">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-cancel">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Đang tạo..." : "Tạo lớp học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassroomModal;
