import { useState, useEffect, useRef } from "react";
import { X, Upload, ImagePlus } from "lucide-react";
import classroomApi from "@/apis/classroomApi";
import { classroomValidationRules } from "@/schema/classroomSchema";
import "@/assets/css/pages/classroom/modals.css";

const INITIAL_ERRORS = { name: "", subject: "", description: "" };

const validate = (fields) => {
  const errors = {};

  const { name, subject, description } = fields;
  const { name: nameRules, subject: subjectRules, description: descRules } =
    classroomValidationRules;

  if (!name || name.trim().length < nameRules.minLength) {
    errors.name = nameRules.message;
  } else if (name.trim().length > nameRules.maxLength) {
    errors.name = nameRules.message;
  }

  if (!subject || subject.trim().length === 0) {
    errors.subject = subjectRules.message;
  } else if (subject.trim().length > subjectRules.maxLength) {
    errors.subject = subjectRules.message;
  }

  if (description && description.trim().length > descRules.maxLength) {
    errors.description = descRules.message;
  }

  return errors;
};

const EditClassroomModal = ({ classroom, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);

  const [fields, setFields] = useState({
    name: "",
    subject: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Pre-fill form when classroom prop changes
  useEffect(() => {
    if (classroom) {
      setFields({
        name: classroom.name ?? "",
        subject: classroom.subject ?? "",
        description: classroom.description ?? "",
      });
      setImageFile(null);
      setImagePreview(classroom.imageUrl ?? null);
      setErrors(INITIAL_ERRORS);
      setServerError("");
    }
  }, [classroom]);

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
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: "" }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: "" }));
    }
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
        description: fields.description.trim(),
      };
      await classroomApi.updateClassroom(classroom.id, data, imageFile);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setServerError(
        err.response?.data?.message ?? "Cập nhật lớp học thất bại. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!classroom) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Chỉnh sửa lớp học</h2>
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
              placeholder="Nhập tên lớp học"
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
              placeholder="Ví dụ: Toán, Văn, Tiếng Anh..."
              className={`form-input ${errors.subject ? "has-error" : ""}`}
            />
            {errors.subject && <p className="form-error-text">{errors.subject}</p>}
          </div>

          {/* Mô tả */}
          <div className="form-group">
            <label className="form-label">Mô tả</label>
            <textarea
              name="description"
              value={fields.description}
              onChange={handleFieldChange}
              placeholder="Mô tả ngắn về lớp học..."
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
              className={`image-upload-area ${errors.file ? "has-error" : ""}`}
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
            {!imageFile && <p className="form-hint-text">Giữ nguyên ảnh hiện tại nếu không chọn ảnh mới.</p>}
          </div>

          {/* Actions */}
          <div className="modal-actions with-padding-top">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-cancel">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClassroomModal;
