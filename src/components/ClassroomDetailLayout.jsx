import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCheck,
  MessageSquare,
  Users,
  FileText,
  FolderOpen,
  BarChart3,
  ClipboardCheck,
  ChevronLeft,
  Calendar,
  Video,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/auth-role";
import { PATH_AUTH, PATH_COMMON, PATH_TEACHER } from "@/routes/paths";
import { classroomApi } from "@/apis/classroom.api";
import { notificationApi } from "@/apis/notification.api";
import { createNotificationSocket } from "@/lib/notification-websocket";
import "@/assets/css/components/classroomDetailLayout.css";

const MENU_ITEMS = [
  { key: "feed", label: "Bảng tin", icon: MessageSquare, path: "" },
  { key: "schedule", label: "Lịch học", icon: Calendar, path: "/schedule" },
  {
    key: "members",
    label: "Thành viên",
    icon: Users,
    path: "/pending-requests",
  },
  {
    key: "assignments",
    label: "Bài tập",
    icon: FileText,
    path: "/assignments",
  },
  { key: "folders", label: "Tài liệu", icon: FolderOpen, path: "/folders" },
  { key: "grades", label: "Bảng điểm", icon: BarChart3, path: "/gradebook" },
  {
    key: "attendance",
    label: "Điểm danh",
    icon: ClipboardCheck,
    path: "/attendance",
  },
  { key: "recordings", label: "Bài giảng", icon: Video, path: "/recordings" },
];

const ClassroomDetailLayout = ({
  children,
  classIdOverride = null,
  activeMenuKeyOverride = null,
}) => {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const resolvedClassId =
    classIdOverride !== null && classIdOverride !== undefined
      ? String(classIdOverride)
      : String(idParam || "");
  const safeResolvedClassId = resolvedClassId.trim();

  const { user, logout } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showNewNotificationToast, setShowNewNotificationToast] = useState(false);
  const toastTimerRef = useRef(null);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Vừa xong";

    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

    return past.toLocaleDateString("vi-VN");
  };

  const fetchNotificationData = useCallback(async ({ withList = false } = {}) => {
    try {
      if (withList) {
        setIsNotificationLoading(true);
      }

      const calls = [notificationApi.getUnreadCount()];
      if (withList) {
        calls.push(notificationApi.getMyNotifications());
      }

      const [unreadResponse, listResponse] = await Promise.all(calls);
      setUnreadCount(Number(unreadResponse?.result || 0));

      if (withList) {
        setNotifications(Array.isArray(listResponse?.result) ? listResponse.result : []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      if (withList) {
        setIsNotificationLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".classroom-workspace-user-menu")) {
        setIsUserMenuOpen(false);
      }

      if (!event.target.closest(".classroom-workspace-notification-wrapper")) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const refreshUnread = async () => {
      if (!isMounted) return;
      await fetchNotificationData({ withList: false });
    };

    refreshUnread();
    const timer = window.setInterval(refreshUnread, 30000);
    const token = localStorage.getItem("accessToken");
    const disconnect = createNotificationSocket({
      token,
      onConnected: refreshUnread,
      onNotification: (incomingNotification) => {
        if (!isMounted) return;
        if (!incomingNotification?.id) return;
        
        setShowNewNotificationToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setShowNewNotificationToast(false), 5000);

        setNotifications((prev) => {
          const exists = prev.some((item) => item.id === incomingNotification.id);
          if (exists) return prev;
          return [incomingNotification, ...prev];
        });
      },
      onUnreadCount: (nextUnreadCount) => {
        if (!isMounted) return;
        setUnreadCount(Math.max(0, Number(nextUnreadCount || 0)));
      },
      onError: (error) => {
        console.error("Notification socket error:", error);
      },
    });

    return () => {
      isMounted = false;
      window.clearInterval(timer);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      disconnect();
    };
  }, [fetchNotificationData]);

  const fetchClassroomInfo = useCallback(async () => {
    if (!safeResolvedClassId) {
      setClassroom(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await classroomApi.getClassroomById(safeResolvedClassId);
      //console.log('Classroom detail response:', response);
      if (response.code === 1000) {
        //console.log('Classroom data:', response.result);
        setClassroom(response.result);
      }
    } catch (err) {
      console.error("Error fetching classroom info:", err);
    } finally {
      setLoading(false);
    }
  }, [safeResolvedClassId]);

  useEffect(() => {
    fetchClassroomInfo();
  }, [fetchClassroomInfo]);

  const handleBackToClassrooms = () => {
    navigate(PATH_TEACHER.classroom.root);
  };

  const handleToggleNotifications = async () => {
    const nextState = !isNotificationOpen;
    setIsNotificationOpen(nextState);

    if (nextState) {
      setIsUserMenuOpen(false);
      await fetchNotificationData({ withList: true });
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) return;

    try {
      let nextNotification = notification;

      if (!notification.read) {
        const response = await notificationApi.markAsRead(notification.id);
        nextNotification = {
          ...notification,
          ...(response?.result || {}),
          read: true,
        };
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, ...nextNotification, read: true } : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - (notification.read ? 0 : 1)));

      const redirectUrl =
        typeof nextNotification?.redirectUrl === "string"
          ? nextNotification.redirectUrl.trim()
          : "";

      if (redirectUrl) {
        setIsNotificationOpen(false);
        navigate(redirectUrl);
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(PATH_AUTH.login, { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsUserMenuOpen(false);
    }
  };

  const getActiveMenuItem = () => {
    if (
      activeMenuKeyOverride &&
      MENU_ITEMS.some((item) => item.key === activeMenuKeyOverride)
    ) {
      return activeMenuKeyOverride;
    }

    const path = location.pathname;
    if (path.includes("/attendance")) return "attendance";
    if (path.includes("/recordings")) return "recordings";
    if (path.includes("/schedule")) return "schedule";
    if (path.includes("/pending-requests")) return "members";
    if (path.includes("/members")) return "members";
    if (path.includes("/assignments")) return "assignments";
    if (path.includes("/folders")) return "folders";
    if (path.includes("/grades")) return "grades";
    return "feed";
  };

  const activeKey = getActiveMenuItem();
  const activeMenuLabel =
    MENU_ITEMS.find((item) => item.key === activeKey)?.label || "Lop hoc";

  const normalizedRole = normalizeRole(user?.role);
  const isTeacher = normalizedRole === "TEACHER";
  const visibleMenuItems = MENU_ITEMS.filter(
    (item) =>
      !(
        normalizedRole === "STUDENT" &&
        (item.key === "attendance" || item.key === "grades")
      ),
  );

  const roleLabel = (() => {
    if (normalizedRole === "TEACHER") return "Giáo viên";
    if (normalizedRole === "STUDENT") return "Học sinh";
    if (normalizedRole === "ADMIN") return "Quản trị viên";
    return "Người dùng";
  })();

  const classroomTeacherName =
    String(
      classroom?.teacherName ||
      classroom?.teacher?.fullName ||
      classroom?.ownerName ||
      classroom?.createdByName ||
      "",
    ).trim() ||
    user?.fullName ||
    user?.username ||
    "Chưa cập nhật";

  const safeNumber = (value) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  };

  const bytesToGb = (valueInBytes) =>
    Math.max(0, safeNumber(valueInBytes)) / (1024 * 1024 * 1024);

  const formatGb = (valueInGb) => {
    const gbValue = Math.max(0, safeNumber(valueInGb));

    if (gbValue >= 100) {
      return gbValue.toFixed(0);
    }

    if (gbValue >= 10) {
      return gbValue.toFixed(1);
    }

    return gbValue.toFixed(2);
  };

  const usageItems = Array.isArray(user?.userBenefitUsageDTO)
    ? user.userBenefitUsageDTO
    : [];
  const storageUsage = usageItems.find(
    (item) => item?.benefitCode === "STORAGE",
  );
  const aiRequestUsage = usageItems.find(
    (item) => item?.benefitCode === "AI_REQUEST",
  );

  const storageUsedBytes = Math.max(0, safeNumber(storageUsage?.used));
  const storageUsedGb = bytesToGb(storageUsedBytes);
  const storageLimitBytes = Math.max(0, safeNumber(storageUsage?.limitValue));
  const storageLimitGb = bytesToGb(storageLimitBytes);
  const rawStoragePercent =
    storageLimitGb > 0 ? (storageUsedGb / storageLimitGb) * 100 : 0;
  const storagePercent = Number.isFinite(rawStoragePercent)
    ? Math.max(0, rawStoragePercent)
    : 0;
  const storagePercentLabel =
    storageUsedGb <= 0 || storageLimitGb <= 0
      ? "0%"
      : storagePercent < 0.0001
        ? "<0.0001%"
        : storagePercent < 0.01
          ? `${storagePercent.toFixed(4)}%`
          : storagePercent < 1
            ? `${storagePercent.toFixed(2)}%`
            : `${storagePercent.toFixed(1)}%`;
  const storagePercentBar =
    storagePercent > 0 ? Math.max(1, Math.min(100, storagePercent)) : 0;
  const storageUsageLabel = `${formatGb(storageUsedGb)} / ${formatGb(storageLimitGb)} GB`;

  const aiUsed = Math.max(0, Math.trunc(safeNumber(aiRequestUsage?.used)));
  const aiLimit = Math.max(
    0,
    Math.trunc(safeNumber(aiRequestUsage?.limitValue)),
  );

  const planLabel =
    typeof user?.plan === "string"
      ? user.plan.replace(/_/g, " ")
      : user?.plan?.name || "FREE";

  if (loading && safeResolvedClassId) {
    return (
      <div className="classroom-detail-loading">
        <div>Đang tải thông tin lớp học...</div>
      </div>
    );
  }

  return (
    <div
      className={`classroom-detail-layout ${collapsed ? "is-collapsed" : ""}`}
    >
      {/* Sidebar */}
      <aside className={`classroom-sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="classroom-sidebar-header">
          <button
            className="back-to-classrooms-btn"
            onClick={handleBackToClassrooms}
            aria-label="Quay lại danh sách lớp học"
          >
            <ChevronLeft size={20} />
          </button>
          {!collapsed && (
            <h2 className="classroom-sidebar-title">
              Thông tin lớp học - {classroom?.name}
            </h2>
          )}
          <div className="classroom-header-actions">
            <button
              type="button"
              className="collapse-toggle-btn"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              {collapsed ? (
                <ChevronsRight size={18} />
              ) : (
                <ChevronsLeft size={18} />
              )}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="classroom-info-card">
            <div className="classroom-info-row">
              <span className="classroom-info-label">Giảng viên:</span>
              <span className="classroom-info-value">
                {classroomTeacherName}
              </span>
            </div>
            {/* <div className="classroom-info-row">
              <span className="classroom-info-email">{user?.email}</span>
            </div> */}
            <div className="classroom-info-row">
              <span className="classroom-info-label">Mã lớp:</span>
              <span className="classroom-info-value">
                {classroom?.code || "Chưa có mã"}
              </span>
            </div>
            {classroom?.schedule && (
              <div className="classroom-info-row">
                <Calendar size={16} className="classroom-info-icon" />
                <span className="classroom-info-schedule">
                  {classroom.schedule}
                </span>
              </div>
            )}
          </div>
        )}

        <nav className="classroom-nav">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                className={`classroom-nav-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (!safeResolvedClassId) return;

                  if (item.key === "feed") {
                    navigate(
                      PATH_TEACHER.classroom.detail(safeResolvedClassId),
                    );
                  } else if (item.key === "folders") {
                    navigate(
                      PATH_TEACHER.classroom.folders(safeResolvedClassId),
                    );
                  } else {
                    navigate(
                      `${PATH_TEACHER.classroom.detail(safeResolvedClassId)}${item.path}`,
                    );
                  }
                }}
              >
                <Icon size={20} strokeWidth={1.5} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && isTeacher && (
          <div className="classroom-plan-usage-card">
            <div className="classroom-plan-usage-head">
              <span className="classroom-plan-usage-label">Gói hiện tại</span>
              <strong className="classroom-plan-usage-value">
                {planLabel}
              </strong>
            </div>

            <div className="classroom-benefit-usage-item">
              <div className="classroom-benefit-usage-row">
                <span>STORAGE</span>
                <span>{storagePercentLabel}</span>
              </div>
              <div className="classroom-storage-progress" aria-hidden="true">
                <div
                  className="classroom-storage-progress-fill"
                  style={{ width: `${storagePercentBar}%` }}
                />
              </div>
              <div className="classroom-benefit-usage-subtext">
                {storageUsageLabel}
              </div>
            </div>

            <div className="classroom-benefit-usage-item">
              <div className="classroom-benefit-usage-row">
                <span>AI_REQUEST</span>
                <span>{`${aiUsed}/${aiLimit}`}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="classroom-main-content">
        <header className="classroom-workspace-header">
          <div className="classroom-workspace-left">
            <div className="classroom-workspace-title-row">
              <div className="classroom-workspace-title" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeMenuLabel}</div>
            </div>
          </div>

          <div className="classroom-workspace-right">
            <div className="classroom-workspace-notification-wrapper">
              <button
                type="button"
                className="classroom-workspace-notification"
                onClick={handleToggleNotifications}
                aria-label="Mở thông báo"
                title="Thông báo"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="classroom-notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNewNotificationToast && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  right: "calc(100% + 16px)",
                  transform: "translateY(-50%)",
                  zIndex: 1000,
                }}>
                  <style>{`
                    @keyframes popInLeft {
                      0% { opacity: 0; transform: translateX(10px) scale(0.95); }
                      100% { opacity: 1; transform: translateX(0) scale(1); }
                    }
                  `}</style>
                  <div style={{
                    position: "relative",
                    background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                    color: "white",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 14px rgba(225, 29, 72, 0.4)",
                    animation: "popInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <span style={{ fontSize: "16px" }}>👋</span> Bạn có 1 thông báo mới!
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      right: "-5px",
                      transform: "translateY(-50%)",
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                      borderLeft: "6px solid #e11d48",
                      width: 0,
                      height: 0
                    }} />
                  </div>
                </div>
              )}

              {isNotificationOpen && (
                <div className="classroom-notification-dropdown">
                  <div className="classroom-notification-dropdown-header">
                    <h3>Thông báo</h3>
                    <button
                      type="button"
                      className="classroom-notification-mark-all"
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      <CheckCheck size={14} />
                      <span>Đánh dấu tất cả đã đọc</span>
                    </button>
                  </div>

                  <div className="classroom-notification-list">
                    {isNotificationLoading ? (
                      <div className="classroom-notification-empty">Đang tải thông báo...</div>
                    ) : notifications.length === 0 ? (
                      <div className="classroom-notification-empty">Bạn chưa có thông báo nào</div>
                    ) : (
                      notifications.slice(0, 8).map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className={`classroom-notification-item ${notification.read ? "read" : "unread"}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="classroom-notification-item-title-row">
                            <div className="classroom-notification-item-title">{notification.title}</div>
                            {!notification.read && <span className="classroom-notification-dot" />}
                          </div>
                          <div className="classroom-notification-item-desc">
                            {notification.shortDescription || "Không có mô tả"}
                          </div>
                          <div className="classroom-notification-item-time">
                            {formatTimeAgo(notification.createdAt)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="classroom-notification-footer">
                    <button
                      type="button"
                      className="classroom-notification-view-all"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        navigate(PATH_COMMON.notifications);
                      }}
                    >
                      Xem tất cả
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="classroom-workspace-user-menu">
              <button
                type="button"
                className="classroom-workspace-user-trigger"
                onClick={() => {
                  setIsNotificationOpen(false);
                  setIsUserMenuOpen((prev) => !prev);
                }}
              >
                <div className="classroom-workspace-avatar">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user?.fullName || "User"} />
                  ) : (
                    <span>
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="classroom-workspace-user-info">
                  <div className="classroom-workspace-user-name">
                    {user?.fullName || "User"}
                  </div>
                  <div className="classroom-workspace-user-role">
                    {roleLabel}
                  </div>
                </div>
                <ChevronDown size={14} />
              </button>

              {isUserMenuOpen && (
                <div className="classroom-workspace-user-dropdown">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate(PATH_COMMON.profile);
                    }}
                  >
                    <Settings size={14} />
                    <span>Tài khoản của tôi</span>
                  </button>
                  <button type="button" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="classroom-main-body">{children}</section>
      </main>
    </div>
  );
};

export default ClassroomDetailLayout;
