import { useState, useRef } from "react";
import { X, ImagePlus, Upload } from "lucide-react";
import classroomApi from "@/apis/classroomApi";
import { classroomValidationRules } from "@/schema/classroomSchema";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Tạo lớp học mới</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Server error */}
          {serverError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Tên lớp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={fields.name}
              onChange={handleFieldChange}
              placeholder="Nhập tên lớp học (3–50 ký tự)"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Môn học */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Môn học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={fields.subject}
              onChange={handleFieldChange}
              placeholder="Ví dụ: Toán, Văn, Tiếng Anh... (3–50 ký tự)"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.subject ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.subject && (
              <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
            )}
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
              <span className="text-gray-400 font-normal ml-1">(tuỳ chọn)</span>
            </label>
            <textarea
              name="description"
              value={fields.description}
              onChange={handleFieldChange}
              placeholder="Mô tả ngắn về lớp học (3–50 ký tự nếu điền)..."
              rows={3}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                errors.description ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Ảnh đại diện (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh đại diện
              <span className="text-gray-400 font-normal ml-1">(tuỳ chọn)</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative w-full h-36 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer flex items-center justify-center overflow-hidden hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Xem trước"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Upload size={20} className="text-white mb-1" />
                    <span className="text-xs text-white font-medium">Đổi ảnh</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <ImagePlus size={28} />
                  <span className="text-xs">Kéo thả hoặc nhấn để chọn ảnh</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {imageFile && (
              <p className="mt-1 text-xs text-gray-400">Đã chọn: {imageFile.name}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang tạo..." : "Tạo lớp học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassroomModal;
