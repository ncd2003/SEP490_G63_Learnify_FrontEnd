import { useState } from "react";
import { Trash2, X } from "lucide-react";
import classroomApi from "@/apis/classroomApi";
import "@/assets/css/pages/classroom/modals.css";

const DeleteConfirmModal = ({ classroom, onClose, onSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setServerError("");
    try {
      await classroomApi.deleteClassroom(classroom.id);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setServerError(
        err.response?.data?.message ?? "Xóa lớp học thất bại. Vui lòng thử lại."
      );
      setDeleting(false);
    }
  };

  if (!classroom) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-container modal-small">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Xóa lớp học</h2>
          <button onClick={onClose} disabled={deleting} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="delete-modal-content">
            <div className="delete-icon-wrapper">
              <Trash2 className="delete-icon" />
            </div>
            <div>
              <p className="delete-message">
                Bạn có chắc muốn xóa lớp{" "}
                <span className="delete-highlight">{classroom.name}</span> không? Hành động này
                không thể hoàn tác.
              </p>
              {serverError && <p className="modal-error-alert">{serverError}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button onClick={onClose} disabled={deleting} className="btn-cancel">
            Hủy
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">
            {deleting ? "Đang xóa..." : "Xóa lớp học"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
