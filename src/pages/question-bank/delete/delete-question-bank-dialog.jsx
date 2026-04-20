import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import {
  getLabelFromOptions,
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";
import "@/assets/css/pages/classroom/modals.css";
import "@/assets/css/pages/question-bank/deleteQuestionBankDialog.css";

const MSG84 = "Hiện tại không thể xóa Ngân hàng đề. Vui lòng thử lại sau.";

const getFirstValid = (...values) =>
  values.find((value) => value !== undefined && value !== null);

const getQuestionCount = (bank) => {
  const raw = getFirstValid(
    bank?.totalQuestions,
    bank?.questionCount,
    bank?.questionsCount,
    bank?.questionTotal,
    bank?.questions,
  );
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const getUsageCount = (bank) => {
  const raw = getFirstValid(
    bank?.usageCount,
    bank?.usedCount,
    bank?.uses,
    bank?.totalUses,
  );
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
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

const DeleteQuestionBankDialog = ({ questionBank, onClose, onSubmit }) => {
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setServerError("");
    try {
      await onSubmit?.(questionBank.id);
      onClose?.();
    } catch (err) {
      setServerError(err.response?.data?.message ?? MSG84);
      setDeleting(false);
    }
  };

  if (!questionBank) return null;

  const questionCount = getQuestionCount(questionBank);
  const usageCount = getUsageCount(questionBank);
  const gradeLabel = getLabelFromOptions(gradeOptions, questionBank.gradeLevel);
  const subjectLabel = getLabelFromOptions(
    subjectOptions,
    questionBank.subject,
  );
  const detailRows = [
    ["Mã ngân hàng", questionBank.code || `#${questionBank.id}`],
    ["Tên ngân hàng", questionBank.name || "--"],
    ["Khối lớp", gradeLabel || "--"],
    ["Môn học", subjectLabel || "--"],
    ["Số câu hỏi", `${questionCount} câu`],
    ["Lần sử dụng", `${usageCount} lần`],
    ["Ngày tạo", formatDateTime(questionBank.createdAt)],
  ];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal-container qb-delete-modal">
        <div className="modal-header qb-delete-header">
          <h2 className="modal-title">Xác nhận xóa ngân hàng câu hỏi</h2>
          <button
            onClick={onClose}
            disabled={deleting}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body qb-delete-body">
          <div className="qb-delete-warning">
            <div className="qb-delete-warning-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="qb-delete-warning-text">
              <strong>Cảnh báo: Hành động này không thể hoàn tác</strong>
              <p>
                Ngân hàng câu hỏi sẽ được chuyển vào trạng thái đã xóa. Nếu bạn
                không khôi phục trong vòng 30 ngày, hệ thống sẽ tự động xóa vĩnh
                viễn. Vui lòng xem xét kỹ trước khi xác nhận.
              </p>
            </div>
          </div>

          <div className="qb-delete-detail-box">
            {detailRows.map(([label, value]) => (
              <div key={label} className="qb-delete-detail-row">
                <span className="qb-delete-detail-label">{label}:</span>
                <span className="qb-delete-detail-value">{value}</span>
              </div>
            ))}
          </div>

          <div className="qb-delete-impact-box">
            <div className="qb-delete-impact-title">
              Ảnh hưởng khi xóa ngân hàng câu hỏi này:
            </div>
            <ul>
              <li>
                {questionCount} câu hỏi trong ngân hàng sẽ tạm không thể sử dụng
              </li>
              <li>Các bài tập đã tạo từ ngân hàng này sẽ không bị ảnh hưởng</li>
              <li>
                Ngân hàng có thể khôi phục trong 30 ngày trước khi bị xóa vĩnh
                viễn
              </li>
            </ul>
          </div>

          <p className="qb-delete-confirm-text">
            Bạn có chắc chắn muốn xóa ngân hàng đề này không?
          </p>

          {serverError && <p className="modal-error-alert">{serverError}</p>}
        </div>

        <div className="modal-actions qb-delete-actions">
          <button onClick={onClose} disabled={deleting} className="btn-cancel">
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger qb-delete-confirm-btn"
          >
            {deleting ? "Đang xóa..." : "Xóa ngân hàng đề"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteQuestionBankDialog;
