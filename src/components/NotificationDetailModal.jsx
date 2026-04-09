import "@/assets/css/components/notificationDetailModal.css";

const formatDateTime = (iso) => {
  if (!iso) return "-";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const NotificationDetailModal = ({ isOpen, notification, onClose }) => {
  if (!isOpen || !notification) return null;

  return (
    <div className="notification-detail-overlay" onClick={onClose}>
      <div className="notification-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="notification-detail-header">
          <h3>{notification.title || "Thông báo"}</h3>
          <button type="button" className="notification-detail-close" onClick={onClose}>
            Đóng
          </button>
        </div>

        <div className="notification-detail-meta">
          <span>
            <strong>Người gửi:</strong> {notification.senderName || "Hệ thống"}
          </span>
          <span>
            <strong>Thời gian:</strong> {formatDateTime(notification.createdAt)}
          </span>
        </div>

        <div className="notification-detail-content">
          {notification.detailContent || notification.shortDescription || "Không có nội dung chi tiết."}
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailModal;
