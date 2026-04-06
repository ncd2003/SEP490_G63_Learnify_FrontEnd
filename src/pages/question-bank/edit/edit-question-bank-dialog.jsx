import { useEffect, useState } from "react";
import { AlertCircle, Clock3, Info, Lock, PencilLine, X } from "lucide-react";
import { UpdateQuestionBankSchema } from "@/schema/question-bank.schema";
import {
  getLabelFromOptions,
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";
import "@/assets/css/pages/classroom/modals.css";
import "@/assets/css/pages/question-bank/editQuestionBankDialog.css";

const MSG82 = "Vui lòng nhập tên hợp lệ cho Ngân hàng đề trước khi lưu.";

const INITIAL_ERRORS = {
  name: "",
  description: "",
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const EditQuestionBankDialog = ({
  questionBank,
  onClose,
  onSubmit,
  submitting,
}) => {
  const [fields, setFields] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [serverError, setServerError] = useState("");
  const [initialFields, setInitialFields] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (questionBank) {
      const next = {
        name: questionBank.name ?? "",
        description: questionBank.description ?? "",
      };
      setFields(next);
      setInitialFields(next);
      setErrors(INITIAL_ERRORS);
      setServerError("");
    }
  }, [questionBank]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const trimmedName = String(fields.name ?? "").trim();
    if (trimmedName.length < 3) {
      setErrors((prev) => ({
        ...prev,
        name: MSG82,
      }));
      return;
    }

    const result = UpdateQuestionBankSchema.safeParse({
      name: trimmedName,
      description: fields.description,
    });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0] ? MSG82 : "",
        description: fieldErrors.description?.[0] ?? "",
      });
      return;
    }

    try {
      await onSubmit?.(questionBank.id, {
        name: trimmedName,
        description: result.data.description || "",
      });
      onClose?.();
    } catch (err) {
      setServerError(
        err.response?.data?.message ??
          "Cập nhật ngân hàng câu hỏi thất bại. Vui lòng thử lại.",
      );
    }
  };

  const handleCancel = () => {
    setFields(initialFields);
    setErrors(INITIAL_ERRORS);
    setServerError("");
    onClose?.();
  };

  if (!questionBank) return null;

  const gradeLabel = getLabelFromOptions(gradeOptions, questionBank.gradeLevel);
  const subjectLabel = getLabelFromOptions(
    subjectOptions,
    questionBank.subject,
  );
  const hasValidationError = Boolean(errors.name);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal-container qb-edit-modal">
        <div className="modal-header">
          <div className="qb-edit-header-title">
            <div className="qb-edit-header-icon">
              <PencilLine size={16} />
            </div>
            <h2 className="modal-title">Chỉnh sửa ngân hàng đề</h2>
          </div>
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form qb-edit-form">
          <div className="qb-edit-info-box">
            <Info size={16} />
            <div>
              <div className="qb-edit-info-title">Lưu ý khi chỉnh sửa</div>
              <p>
                Bạn có thể cập nhật Tên ngân hàng và Mô tả. Khối lớp và Môn học
                được khóa để đảm bảo tính nhất quán dữ liệu.
              </p>
            </div>
          </div>

          {hasValidationError && (
            <div className="qb-edit-alert qb-edit-alert-error">
              <AlertCircle size={17} />
              <div>
                <strong>MSG82: Thông tin không hợp lệ!</strong>
                <p>{MSG82}</p>
              </div>
            </div>
          )}

          {serverError && <p className="modal-error-alert">{serverError}</p>}

          <div className="qb-edit-meta-bar">
            <div className="qb-edit-meta-item">
              <span>ID:</span>
              <strong>{questionBank.id}</strong>
            </div>
            <div className="qb-edit-meta-item">
              <span>Khối lớp:</span>
              <strong>{gradeLabel}</strong>
            </div>
            <div className="qb-edit-meta-item">
              <span>Môn học:</span>
              <strong>{subjectLabel}</strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Tên ngân hàng <span className="form-label-required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={fields.name}
              onChange={handleFieldChange}
              className={`form-input ${errors.name ? "has-error" : ""}`}
            />
            {errors.name && <p className="form-error-text">{errors.name}</p>}
          </div>

          <div className="qb-edit-grid-2">
            <div className="form-group">
              <label className="form-label qb-edit-lock-label">
                Khối lớp
                <span className="qb-edit-lock-chip">
                  <Lock size={10} /> Khóa
                </span>
              </label>
              <input
                type="text"
                value={gradeLabel}
                disabled
                className="form-input"
              />
              <p className="form-hint-text qb-edit-hint-text">
                Trường này bị khóa sau khi tạo ngân hàng đề.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label qb-edit-lock-label">
                Môn học
                <span className="qb-edit-lock-chip">
                  <Lock size={10} /> Khóa
                </span>
              </label>
              <input
                type="text"
                value={subjectLabel}
                disabled
                className="form-input"
              />
              <p className="form-hint-text qb-edit-hint-text">
                Trường này bị khóa sau khi tạo ngân hàng đề.
              </p>
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
              className={`form-textarea ${errors.description ? "has-error" : ""}`}
            />
            {errors.description && (
              <p className="form-error-text">{errors.description}</p>
            )}
            {!errors.description && (
              <p className="form-hint-text qb-edit-hint-text">
                {fields.description.length}/500 ký tự
              </p>
            )}
          </div>

          <div className="qb-edit-history-box">
            <div className="qb-edit-history-title">
              <Clock3 size={13} />
              Lịch sử cập nhật
            </div>
            <div className="qb-edit-history-row">
              <span>Ngày tạo</span>
              <strong>{formatDateTime(questionBank.createdAt)}</strong>
            </div>
            <div className="qb-edit-history-row">
              <span>Cập nhật gần nhất</span>
              <strong>
                {formatDateTime(
                  questionBank.updatedAt ?? questionBank.updateAt,
                )}
              </strong>
            </div>
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
              {submitting ? "Đang cập nhật..." : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuestionBankDialog;
