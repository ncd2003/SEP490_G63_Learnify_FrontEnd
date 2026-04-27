import { useState } from "react";
import { X, XCircle, Info, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { CreateQuestionBankSchema } from "@/schema/question-bank.schema";
import {
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";
import "@/assets/css/pages/classroom/modals.css";
import "@/assets/css/pages/question-bank/createQuestionBankDialog.css";

const MSG02 =
  "Các trường bắt buộc phải được điền đầy đủ và tất cả giá trị nhập vào phải hợp lệ.";

const INITIAL_FIELDS = {
  name: "",
  gradeLevel: "",
  customGradeLevel: "",
  subject: "",
  customSubject: "",
  description: "",
};

const INITIAL_ERRORS = {
  name: "",
  gradeLevel: "",
  customGradeLevel: "",
  subject: "",
  customSubject: "",
  description: "",
};

const CREATE_TIPS = [
  "Đặt tên ngắn gọn, dễ tìm kiếm theo chương hoặc chủ đề.",
  "Khối lớp và môn học nên khớp với bộ câu hỏi bạn sẽ nhập sau đó.",
  "Mô tả nên nêu rõ phạm vi kiến thức để dùng lại dễ hơn.",
];

const CreateQuestionBankDialog = ({ onClose, onSubmit, submitting }) => {
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [serverError, setServerError] = useState("");
  const [status, setStatus] = useState(null);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => {
      if (name === "gradeLevel") {
        return {
          ...prev,
          gradeLevel: value,
          customGradeLevel: value === "other" ? prev.customGradeLevel : "",
        };
      }

      if (name === "subject") {
        return {
          ...prev,
          subject: value,
          customSubject: value === "other" ? prev.customSubject : "",
        };
      }

      return { ...prev, [name]: value };
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "gradeLevel" || name === "customGradeLevel") {
      setErrors((prev) => ({ ...prev, customGradeLevel: "" }));
    }

    if (name === "subject" || name === "customSubject") {
      setErrors((prev) => ({ ...prev, customSubject: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setServerError("");

    const normalizedPayload = {
      name: String(fields.name ?? "").trim(),
      gradeLevel:
        fields.gradeLevel === "other"
          ? String(fields.customGradeLevel ?? "").trim()
          : String(fields.gradeLevel ?? "").trim(),
      subject:
        fields.subject === "other"
          ? String(fields.customSubject ?? "").trim()
          : String(fields.subject ?? "").trim(),
      description: String(fields.description ?? ""),
    };

    const result = CreateQuestionBankSchema.safeParse(normalizedPayload);
    const fieldErrors = result.success
      ? {}
      : result.error.flatten().fieldErrors;

    const nextErrors = {
      name: !normalizedPayload.name ? "Tên ngân hàng câu hỏi là bắt buộc" : (fieldErrors.name?.[0] ?? ""),
      gradeLevel: fieldErrors.gradeLevel?.[0] ?? "",
      customGradeLevel:
        fields.gradeLevel === "other" && !normalizedPayload.gradeLevel
          ? MSG02
          : "",
      subject: fieldErrors.subject?.[0] ?? "",
      customSubject:
        fields.subject === "other" && !normalizedPayload.subject ? MSG02 : "",
      description: fieldErrors.description?.[0] ?? "",
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      setStatus("missing");
      const errorMessage = nextErrors.name || MSG02;
      toast.error(errorMessage, { id: "create-resource-bank-msg02" });
      return;
    }

    setErrors(INITIAL_ERRORS);

    try {
      await onSubmit?.(normalizedPayload);
      onClose?.();
    } catch (err) {
      const message =
        err.response?.data?.message ??
        "Tạo ngân hàng câu hỏi thất bại. Vui lòng thử lại.";

      const isDuplicate = /ton tai|tồn tại|exist|duplicate|trung|trùng/i.test(
        message,
      );
      const isValidation =
        /invalid|validation|required|bad request|khong hop le|không hợp lệ|bat buoc|bắt buộc|empty|trong/i.test(
          message,
        ) ||
        Number(err?.response?.status) === 400 ||
        Number(err?.response?.status) === 422;

      if (isDuplicate) {
        setServerError("");
        setStatus(null);
        return;
      }

      if (isValidation) {
        setServerError("");
        setStatus(null);
        return;
      }

      setServerError(message);
      setStatus("failed");
    }
  };

  const handleCancel = () => {
    setFields(INITIAL_FIELDS);
    setErrors(INITIAL_ERRORS);
    setServerError("");
    setStatus(null);
    onClose?.();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal-container qb-create-modal">
        <div className="modal-header">
          <div className="qb-create-header-title">
            <div className="qb-create-header-icon">
              <FolderPlus size={18} />
            </div>
            <h2 className="modal-title">Tạo ngân hàng câu hỏi mới</h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form qb-create-form">
          {status === "failed" && serverError && (
            <div className="qb-create-alert qb-create-alert-error">
              <XCircle size={18} />
              <div>
                <strong>Tạo thất bại</strong>
                <p>{serverError}</p>
              </div>
            </div>
          )}

          <div className="qb-create-info-box">
            <Info size={16} />
            <div>
              <div className="qb-create-info-title">Về Ngân Hàng Câu Hỏi</div>
              <p>
                Ngân hàng câu hỏi giúp bạn tổ chức và quản lý câu hỏi theo môn học và
                khối lớp để tái sử dụng khi ra đề.
              </p>
            </div>
          </div>

          <div className="qb-create-tips-box">
            <div className="qb-create-tips-title">Gợi ý đặt tên ngân hàng câu hỏi</div>
            <ul>
              {CREATE_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="qb-create-section-title">Thông tin cơ bản</div>

          <div className="form-group">
            <label className="form-label">
              Tên ngân hàng <span className="form-label-required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={fields.name}
              onChange={handleFieldChange}
              placeholder="Ví dụ: Toán 10 - Chương 1"
              className={`form-input ${errors.name ? "has-error" : ""}`}
            />
            {errors.name ? (
              <p className="form-hint-text qb-create-hint-text" style={{ color: "var(--rd)" }}>
                {errors.name}
              </p>
            ) : (
              <p className="form-hint-text qb-create-hint-text">
                Tên nên phản ánh nội dung để dễ tìm lại trong danh sách ngân
                hàng.
              </p>
            )}
          </div>

          <div className="qb-create-grid-2">
            <div className="form-group">
              <label className="form-label">
                Khối lớp <span className="form-label-required">*</span>
              </label>
              <select
                name="gradeLevel"
                value={fields.gradeLevel}
                onChange={handleFieldChange}
                className={`form-input ${errors.gradeLevel ? "has-error" : ""}`}
              >
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {fields.gradeLevel === "other" && (
                <input
                  type="text"
                  name="customGradeLevel"
                  value={fields.customGradeLevel}
                  onChange={handleFieldChange}
                  placeholder="Nhập khối lớp tùy chỉnh"
                  className={`form-input qb-create-custom-input ${
                    errors.customGradeLevel ? "has-error" : ""
                  }`}
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Môn học <span className="form-label-required">*</span>
              </label>
              <select
                name="subject"
                value={fields.subject}
                onChange={handleFieldChange}
                className={`form-input ${errors.subject ? "has-error" : ""}`}
              >
                {subjectOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {fields.subject === "other" && (
                <input
                  type="text"
                  name="customSubject"
                  value={fields.customSubject}
                  onChange={handleFieldChange}
                  placeholder="Nhập môn học tùy chỉnh"
                  className={`form-input qb-create-custom-input ${
                    errors.customSubject ? "has-error" : ""
                  }`}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Mô tả <span className="form-label-optional">(tuỳ chọn)</span>
            </label>
            <textarea
              rows={3}
              name="description"
              value={fields.description}
              onChange={handleFieldChange}
              placeholder="Mô tả ngắn về ngân hàng câu hỏi..."
              className={`form-textarea ${errors.description ? "has-error" : ""}`}
            />
            {!errors.description && (
              <p className="form-hint-text qb-create-hint-text">
                {fields.description.length}/500 ký tự
              </p>
            )}
          </div>

          <div className="modal-actions with-padding-top">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="btn-cancel"
            >
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Đang tạo..." : "Tạo ngân hàng câu hỏi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestionBankDialog;
