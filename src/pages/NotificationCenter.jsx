import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, RefreshCw, Trash2 } from "lucide-react";
import { notificationApi } from "@/apis/notification.api";
import Pagination from "@/components/Pagination";
import NotificationDetailModal from "@/components/NotificationDetailModal";
import "@/assets/css/pages/notificationCenter.css";

const formatTimeAgo = (createdAt) => {
  if (!createdAt) return "";

  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} tháng trước`;
};

const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);

  const pageSize = 10;

  const selectedNotification = useMemo(
    () => notifications.find((item) => item.id === selectedNotificationId) || null,
    [notifications, selectedNotificationId],
  );

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        const response = await notificationApi.getMyNotificationsPage({
          page,
          size: pageSize,
          unreadOnly: filterUnreadOnly,
        });

        if (!mounted) return;

        const result = response?.result || {};
        setNotifications(Array.isArray(result.content) ? result.content : []);
        setTotalPages(Math.max(1, Number(result.totalPages || 1)));
        setTotalElements(Number(result.totalElements || 0));
      } catch (error) {
        if (!mounted) return;
        console.error("Failed to load notifications page:", error);
        setNotifications([]);
        setTotalPages(1);
        setTotalElements(0);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [page, filterUnreadOnly, refreshKey]);

  const handleOpenDetail = async (notification) => {
    if (!notification?.id) return;

    try {
      let nextNotification = notification;

      if (!notification.read) {
        const response = await notificationApi.markAsRead(notification.id);
        const marked = response?.result;

        nextNotification = {
          ...notification,
          ...(marked || {}),
          read: true,
        };

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, ...nextNotification } : item,
          ),
        );
      }

      const redirectUrl =
        typeof nextNotification?.redirectUrl === "string"
          ? nextNotification.redirectUrl.trim()
          : "";

      if (redirectUrl) {
        setSelectedNotificationId(null);
        navigate(redirectUrl);
        return;
      }

      setSelectedNotificationId(nextNotification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleDelete = async (notificationId) => {
    if (!notificationId) return;

    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));

      if (notifications.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleFilterChange = (unreadOnly) => {
    setFilterUnreadOnly(unreadOnly);
    setPage(1);
  };

  return (
    <section className="notification-center-page">
      <div className="notification-center-header">
        <div className="notification-center-title">
          <Bell size={24} />
          <h1>Thông báo</h1>
        </div>

        <div className="notification-center-actions">
          <button
            type="button"
            className={`filter-btn ${!filterUnreadOnly ? "active" : ""}`}
            onClick={() => handleFilterChange(false)}
            disabled={loading}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`filter-btn ${filterUnreadOnly ? "active" : ""}`}
            onClick={() => handleFilterChange(true)}
            disabled={loading}
          >
            Chưa đọc
          </button>
          <button
            type="button"
            className="refresh-btn"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="notification-center-list">
        {loading ? (
          <div className="notification-center-empty">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-center-empty">Bạn chưa có thông báo nào.</div>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-center-item ${notification.read ? "read" : "unread"}`}
              onClick={() => handleOpenDetail(notification)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleOpenDetail(notification);
                }
              }}
            >
              <div className="notification-center-item-main">
                <div className="notification-center-item-head">
                  <h3>{notification.title || "Thông báo"}</h3>
                  {!notification.read && <span className="item-status">Chưa đọc</span>}
                </div>

                <p
                  className="notification-center-item-content"
                  title={notification.shortDescription || notification.detailContent || ""}
                >
                  {notification.shortDescription || notification.detailContent || "Không có mô tả"}
                </p>

                <div className="notification-center-item-meta">
                  <span>Người gửi: {notification.senderName || "Hệ thống"}</span>
                  <span>{formatTimeAgo(notification.createdAt)}</span>
                </div>
              </div>

              <button
                type="button"
                className="notification-delete-btn"
                aria-label="Xóa thông báo"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(notification.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))
        )}
      </div>

      <div className="notification-center-footer">
        <span className="notification-center-total">Tổng cộng: {totalElements} thông báo</span>
        <Pagination
          page={page}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setPage}
          className="notification-pagination"
        />
      </div>

      <NotificationDetailModal
        isOpen={Boolean(selectedNotification)}
        notification={selectedNotification}
        onClose={() => setSelectedNotificationId(null)}
      />
    </section>
  );
};

export default NotificationCenterPage;
