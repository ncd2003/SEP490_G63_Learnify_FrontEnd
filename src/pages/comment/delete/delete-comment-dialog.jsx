import { X } from "lucide-react";
import "@/assets/css/pages/classroom/modals.css";

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: () => void,
 *   isDeleting: boolean
 * }} props
 */
const DeleteCommentDialog = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Xóa bình luận</h2>
          <button onClick={onClose} disabled={isDeleting} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-message">
            Bạn có chắc chắn muốn xóa bình luận này không? Hành động này không thể hoàn tác.
          </p>
        </div>

        <div className="modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Hủy
          </button>
          <button 
            className="btn-danger" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCommentDialog;
