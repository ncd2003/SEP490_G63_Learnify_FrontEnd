import { useState } from "react";
import { X } from "lucide-react";
import { classroomApi } from "@/apis/classroom.api";
import "@/assets/css/pages/classroom/modals.css";

const DeleteClassroomDialog = ({ classroom, onClose, onSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    
    setDeleting(true);
    setServerError("");
    try {
      if (!classroom?.id) {
        throw new Error("Lớp học không tồn tại.");
      }
      await classroomApi.deleteClassroom(classroom.id);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setServerError(
        err.response?.data?.message ?? "Xóa lớp học thất bại. Vui lòng thử lại."
      );
      setDeleting(false);
    }
  };

  if (!classroom) return null;

  const isDeleteDisabled = confirmText !== "DELETE" || deleting;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal-container modal-small">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Xóa lớp học</h2>
          <button
            onClick={onClose}
            disabled={deleting}
            className="modal-close-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="delete-modal-body" style={{ padding: '0' }}>
             
             <h3 className="warning-title" style={{ marginTop: '0', textAlign: 'center' }}>CẢNH BÁO: Hành động này không thể hoàn tác!</h3>
             
             <p className="warning-desc" style={{ textAlign: 'center' }}>Toàn bộ dữ liệu của lớp học sẽ bị xóa vĩnh viễn, bao gồm:</p>
             <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ul className="warning-list" style={{ textAlign: 'left', marginBottom: '16px' }}>
                    <li>Danh sách học sinh</li>
                    <li>Bài tập và điểm số</li>
                    <li>Tài liệu và bài đăng</li>
                </ul>
             </div>

             <div className="confirmation-box" style={{ backgroundColor: '#f3f4f6', borderStyle: 'dashed' }}>
                <span className="confirmation-label">Xác nhận xóa lớp học</span>
                <p className="confirmation-subtext">Để xác nhận, vui lòng nhập chữ "DELETE" vào ô bên dưới:</p>
                <div className="confirmation-input-wrapper">
                   <input
                       type="text"
                       className="confirmation-input"
                       placeholder="Nhập DELETE để xác nhận"
                       value={confirmText}
                       onChange={(e) => setConfirmText(e.target.value)}
                       disabled={deleting}
                   />
                </div>
             </div>

             {serverError && (
               <div className="modal-error-alert" style={{ width: '100%' }}>{serverError}</div>
             )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-actions">
          <button
            onClick={onClose}
            disabled={deleting}
            className="btn-cancel"
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleteDisabled}
            className="btn-danger"
          >
            {deleting ? "Đang xóa..." : "Xóa lớp học"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteClassroomDialog;
