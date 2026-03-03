import '@/assets/css/pages/classroom/modals.css';

const ApproveRequestsModal = ({ count, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Xác nhận duyệt yêu cầu</h2>
        </div>
        <div className="modal-body">
          <p>
            Bạn có chắc chắn muốn duyệt <strong>{count}</strong> yêu cầu tham gia lớp học không?
          </p>
          <p className="modal-note">
            Học sinh sẽ nhận được thông báo và có thể truy cập lớp học ngay lập tức. {/* MSG52 */}
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="modal-btn-secondary" onClick={onCancel}>
            Hủy
          </button>
          <button type="button" className="modal-btn-primary" onClick={onConfirm}>
            Xác nhận duyệt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveRequestsModal;
