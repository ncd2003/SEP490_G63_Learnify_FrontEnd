import { useState, useEffect, useRef } from "react";
import { X, Upload, ImagePlus } from "lucide-react";
import classroomApi from "@/apis/classroomApi";
import { classroomValidationRules } from "@/schema/classroomSchema";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Chỉnh sửa lớp học</h2>
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
              placeholder="Nhập tên lớp học"
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
              placeholder="Ví dụ: Toán, Văn, Tiếng Anh..."
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
            </label>
            <textarea
              name="description"
              value={fields.description}
              onChange={handleFieldChange}
              placeholder="Mô tả ngắn về lớp học..."
              rows={3}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                errors.description ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Ảnh đại diện */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh đại diện
              <span className="text-gray-400 font-normal ml-1">(tuỳ chọn)</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`relative w-full h-36 rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-colors ${
                errors.file
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/40"
              }`}
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
                    <span className="text-xs text-white font-medium">
                      Đổi ảnh
                    </span>
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
            {!imageFile && (
              <p className="mt-1 text-xs text-gray-400">Giữ nguyên ảnh hiện tại nếu không chọn ảnh mới.</p>
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
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClassroomModal;
