import '@/assets/css/pages/classroom/modals.css';

const RejectRequestsModal = ({ count, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Xác nhận từ chối yêu cầu</h2>
        </div>
        <div className="modal-body">
          <p>
            Bạn có chắc chắn muốn từ chối <strong>{count}</strong> yêu cầu tham gia lớp học không?
          </p>
          <p className="modal-note modal-note-warning">
            Học sinh sẽ nhận được thông báo về việc yêu cầu của họ đã bị từ chối. {/* MSG53 */}
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="modal-btn-secondary" onClick={onCancel}>
            Hủy
          </button>
          <button type="button" className="modal-btn-danger" onClick={onConfirm}>
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequestsModal;
