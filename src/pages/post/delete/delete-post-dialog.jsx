import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { postApi } from "@/apis/post.api";
import "@/assets/css/pages/classroom/modals.css";

const DeletePostDialog = ({ post, onClose, onSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setServerError("");
    try {
      await postApi.deletePost(post.id);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setServerError(
        err.response?.data?.message ?? "Xóa bài đăng thất bại. Vui lòng thử lại."
      );
      setDeleting(false);
    }
  };

  if (!post) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-container modal-small">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Xóa bài đăng</h2>
          <button onClick={onClose} disabled={deleting} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="delete-modal-content">
            <div className="delete-icon-wrapper warning">
              <AlertTriangle className="delete-icon" />
            </div>
            <div>
              <p className="delete-message">
                Bạn có chắc chắn muốn xóa bài đăng này không?
              </p>
              <p className="delete-description">
                Lưu ý: Bài đăng sẽ bị xóa vĩnh viễn và không thể khôi phục. Tất cả bình luận liên quan cũng sẽ bị xóa.
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
            {deleting ? "Đang xóa..." : "Xóa bài đăng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePostDialog;