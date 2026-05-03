import '@/assets/css/pages/classroom/modals.css';

const RemoveStudentModal = ({ studentName, onConfirm, onCancel, loading }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Xóa học sinh khỏi lớp</h2>
        </div>
        <div className="modal-body">
          <p>
            Bạn có chắc chắn muốn xóa <strong>{studentName}</strong> khỏi lớp học này?
          </p>
          <p className="modal-note modal-note-warning">
            Học sinh này sẽ mất quyền truy cập vào toàn bộ tài liệu của lớp.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="modal-btn-secondary" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
          <button type="button" className="modal-btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveStudentModal;
