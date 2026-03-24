import { useState } from "react";
import { X, XCircle, Info, FolderPlus } from "lucide-react";
import { CreateQuestionBankSchema } from "@/schema/question-bank.schema";
import {
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";
import "@/assets/css/pages/classroom/modals.css";
import "@/assets/css/pages/question-bank/createQuestionBankDialog.css";

const MSG02 =
  "Các trường bắt buộc phải được điền đầy đủ và tất cả giá trị nhập vào phải hợp lệ.";
const MSG40 =
  "Tên ngân hàng đề bị trùng trong Khối lớp/Môn học này. Vui lòng đổi tên khác.";

const INITIAL_FIELDS = {
  name: "",
  gradeLevel: "",
  subject: "",
  description: "",
};

const INITIAL_ERRORS = {
  name: "",
  gradeLevel: "",
  subject: "",
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
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setServerError("");

    const result = CreateQuestionBankSchema.safeParse(fields);
    const fieldErrors = result.success
      ? {}
      : result.error.flatten().fieldErrors;

    const nextErrors = {
      name: fieldErrors.name?.[0] ?? "",
      gradeLevel: fieldErrors.gradeLevel?.[0] ?? "",
      subject: fieldErrors.subject?.[0] ?? "",
      description: fieldErrors.description?.[0] ?? "",
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      setStatus("missing");
      return;
    }

    setErrors(INITIAL_ERRORS);

    try {
      await onSubmit?.({
        name: fields.name,
        gradeLevel: fields.gradeLevel,
        subject: fields.subject,
        description: fields.description || "",
      });
      onClose?.();
    } catch (err) {
      const message =
        err.response?.data?.message ??
        "Tạo ngân hàng câu hỏi thất bại. Vui lòng thử lại.";
      setServerError(message);
      setStatus(
        /ton tai|tồn tại|exist|duplicate|trung|trùng/i.test(message)
          ? "duplicate"
          : "failed",
      );
    }
  };

  const handleReset = () => {
    setFields(INITIAL_FIELDS);
    setErrors(INITIAL_ERRORS);
    setServerError("");
    setStatus(null);
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
            <h2 className="modal-title">Tạo ngân hàng đề mới</h2>
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
          {status === "missing" && (
            <div className="qb-create-alert qb-create-alert-error">
              <XCircle size={18} />
              <div>
                <strong>MSG02: Thông tin không hợp lệ!</strong>
                <p>{MSG02}</p>
              </div>
            </div>
          )}

          {status === "duplicate" && (
            <div className="qb-create-alert qb-create-alert-error">
              <XCircle size={18} />
              <div>
                <p>{MSG40}</p>
              </div>
            </div>
          )}

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
              <div className="qb-create-info-title">Về Ngân Hàng Đề</div>
              <p>
                Ngân hàng đề giúp bạn tổ chức và quản lý câu hỏi theo môn học và
                khối lớp để tái sử dụng khi ra đề.
              </p>
            </div>
          </div>

          <div className="qb-create-tips-box">
            <div className="qb-create-tips-title">Gợi ý đặt ngân hàng đề</div>
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
            {errors.name && <p className="form-error-text">{errors.name}</p>}
            {status === "missing" && !errors.name && (
              <p className="form-error-text">{MSG02}</p>
            )}
            {!errors.name && (
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
              {errors.gradeLevel && (
                <p className="form-error-text">{errors.gradeLevel}</p>
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
              {errors.subject && (
                <p className="form-error-text">{errors.subject}</p>
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
            {errors.description && (
              <p className="form-error-text">{errors.description}</p>
            )}
            {!errors.description && (
              <p className="form-hint-text qb-create-hint-text">
                {fields.description.length}/500 ký tự
              </p>
            )}
          </div>

          <div className="modal-actions with-padding-top">
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="btn-cancel"
            >
              Làm Mới
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Đang tạo..." : "Tạo ngân hàng đề"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestionBankDialog;
