import { useState, useRef } from "react";
import { X, ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { classroomApi } from "@/apis/classroom.api";
import { CreateClassroomSchema } from "@/schema/classroom.schema";
import "@/assets/css/pages/classroom/modals.css";

const SUBJECT_OPTIONS = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "Tin học",
  "GDCD",
  "OTHER",
];

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const INITIAL_FIELDS = { name: "", description: "" };
const INITIAL_ERRORS = { name: "", subject: "", description: "" };

const CreateClassroomDialog = ({ onClose, onSuccess }) => {
  const fileInputRef = useRef(null);

  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [subjectOption, setSubjectOption] = useState("");
  const [subjectOther, setSubjectOther] = useState("");
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

  const handleSubjectOptionChange = (e) => {
    const value = e.target.value;
    setSubjectOption(value);
    if (value !== "OTHER") {
      setSubjectOther("");
    }
    if (errors.subject) {
      setErrors((prev) => ({ ...prev, subject: "" }));
    }
  };

  const handleSubjectOtherChange = (e) => {
    setSubjectOther(e.target.value);
    if (errors.subject) {
      setErrors((prev) => ({ ...prev, subject: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(
        "Tệp không hợp lệ. Vui lòng tải lên hình ảnh JPEG, PNG, WEBP hoặc WEBP dưới 5MB.",
      );
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(
        "Tệp không hợp lệ. Vui lòng tải lên hình ảnh JPEG, PNG, WEBP hoặc WEBP dưới 5MB.",
      );
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const finalSubject =
      subjectOption === "OTHER" ? subjectOther.trim() : subjectOption;

    if (!finalSubject) {
      setErrors((prev) => ({ ...prev, subject: "Vui lòng chọn môn học" }));
      return;
    }

    const result = CreateClassroomSchema.safeParse({
      name: fields.name,
      subject: finalSubject,
      description: fields.description,
    });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors((prev) => ({
        ...prev,
        name: fieldErrors.name?.[0] ?? "",
        subject: fieldErrors.subject?.[0] ?? "",
        description: fieldErrors.description?.[0] ?? "",
      }));
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: result.data.name,
        subject: result.data.subject,
        description: result.data.description || undefined,
      };
      await classroomApi.createClassroom(data, imageFile);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setServerError(
        err.response?.data?.message ??
          "Tạo lớp học thất bại. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
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
            <select
              name="subject"
              value={subjectOption}
              onChange={handleSubjectOptionChange}
              className={`form-input ${errors.subject ? "has-error" : ""}`}
            >
              <option value="" disabled>
                Chọn môn học
              </option>
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "OTHER" ? "Khác" : option}
                </option>
              ))}
            </select>

            {subjectOption === "OTHER" && (
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  name="subjectOther"
                  value={subjectOther}
                  onChange={handleSubjectOtherChange}
                  placeholder="Nhập tên môn học khác"
                  className={`form-input ${errors.subject ? "has-error" : ""}`}
                />
              </div>
            )}

            {errors.subject && (
              <p className="form-error-text">{errors.subject}</p>
            )}
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
              placeholder="Mô tả ngắn về lớp học (tối đa 200 ký tự)..."
              rows={3}
              maxLength={200}
              className={`form-textarea ${errors.description ? "has-error" : ""}`}
            />
            {errors.description && (
              <p className="form-error-text">{errors.description}</p>
            )}
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
                  <img
                    src={imagePreview}
                    alt="Xem trước"
                    className="image-preview"
                  />
                  <div className="image-overlay">
                    <Upload size={20} className="image-overlay-icon" />
                    <span className="image-overlay-text">Đổi ảnh</span>
                  </div>
                </>
              ) : (
                <div className="image-placeholder">
                  <ImagePlus className="image-placeholder-icon" />
                  <span className="image-placeholder-text">
                    Kéo thả hoặc nhấn để chọn ảnh
                  </span>
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
            {imageFile && (
              <p className="form-hint-text">Đã chọn: {imageFile.name}</p>
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions with-padding-top">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-cancel"
            >
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

export default CreateClassroomDialog;
