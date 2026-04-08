import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import "@/assets/css/components/centeredConfirmModal.css";

const CenteredConfirmModal = ({
  isOpen,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  confirmVariant = "primary",
  onConfirm,
  onClose,
  confirmDisabled = false,
  loading = false,
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantClass = confirmVariant === "danger" ? "danger" : "primary";
  const icon = variantClass === "danger" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />;
  const titleId = "centered-confirm-modal-title";
  const descriptionId = "centered-confirm-modal-description";

  return (
    <div className="centered-confirm-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="centered-confirm-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="centered-confirm-modal-header">
          <div className="centered-confirm-modal-heading">
            <span className={`modal-tone-icon ${variantClass}`}>{icon}</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            type="button"
            className="centered-confirm-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {description && (
          <p id={descriptionId} className="centered-confirm-modal-description">
            {description}
          </p>
        )}

        {children && <div className="centered-confirm-modal-body">{children}</div>}

        <div className="centered-confirm-modal-actions">
          <button type="button" className="modal-btn secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`modal-btn ${variantClass}`}
            onClick={onConfirm}
            disabled={confirmDisabled || loading}
          >
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenteredConfirmModal;
