import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LogoutDialog from "@/components/LogoutDialog";
import NotificationDetailModal from "@/components/NotificationDetailModal";
import AppLogo from "@/components/AppLogo";
import { notificationApi } from "@/apis/notification.api";
import { createNotificationSocket } from "@/lib/notification-websocket";
import "@/assets/css/components/dashboardLayout.css";
import { normalizeRole } from "@/lib/auth-role";
import {
  BookOpen,
  BookMarked,
  Home,
  Users,
  FileText,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Database,
  Bell,
  CheckCheck,
  CreditCard,
  Package,
  Wallet,
  ReceiptText,
} from "lucide-react";
import {
  PATH_AUTH,
  PATH_COMMON,
  PATH_TEACHER,
  PATH_STUDENT,
  PATH_ADMIN,
} from "@/routes/paths";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [accountLockedNotice, setAccountLockedNotice] = useState("");
  const forcedLogoutTriggeredRef = useRef(false);

  const normalizedRole = normalizeRole(user?.role);
  const isTeacher = normalizedRole === "TEACHER";
  const isStudent = normalizedRole === "STUDENT";
  const isAdmin = normalizedRole === "ADMIN";
  const roleLabel = isTeacher
    ? "Giáo viên"
    : isStudent
      ? "Học sinh"
      : isAdmin
        ? "Quản trị viên"
        : "Người dùng";

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

  const handleLogoutClick = () => {
    setIsNotificationOpen(false);
    setIsUserMenuOpen(false);
    setIsLogoutDialogOpen(true);
  };

  const formatTimeAgo = (createdAt) => {
    if (!createdAt) return "";

    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  const fetchUnreadCountOnly = useCallback(async () => {
    try {
      const unreadResponse = await notificationApi.getUnreadCount();
      setUnreadCount(Number(unreadResponse?.result || 0));
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  const fetchNotificationData = async ({ withList = true } = {}) => {
    if (withList) {
      setIsNotificationLoading(true);
    }
    try {
      const calls = [notificationApi.getUnreadCount()];
      if (withList) {
        calls.push(notificationApi.getMyNotifications());
      }

      const [unreadResponse, listResponse] = await Promise.all(calls);

      setUnreadCount(Number(unreadResponse?.result || 0));
      if (withList && Array.isArray(listResponse?.result)) {
        setNotifications(listResponse.result);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      if (withList) {
        setIsNotificationLoading(false);
      }
    }
  };

  const handleToggleNotification = async () => {
    const nextState = !isNotificationOpen;
    setIsNotificationOpen(nextState);
    setIsUserMenuOpen(false);

    if (nextState) {
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
          item.id === notification.id
            ? { ...item, ...nextNotification, read: true }
            : item,
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
        return;
      }

      setSelectedNotification(nextNotification);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      navigate(PATH_AUTH.login);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLogoutDialogOpen(false);
    }
  };

  // Teacher menu items
  const teacherMenuItems = [
    {
      icon: Home,
      label: "Trang chủ",
      path: PATH_AUTH.home,
    },
    {
      icon: Users,
      label: "Quản lý lớp học",
      path: PATH_TEACHER.classroom.root,
    },
    {
      icon: Calendar,
      label: "Lịch học",
      path: PATH_TEACHER.schedule,
    },
    {
      icon: Users,
      label: "Học sinh",
      path: PATH_TEACHER.students,
    },
    {
      icon: FileText,
      label: "Bài tập",
      path: PATH_TEACHER.assignments,
    },
    {
      icon: FileText,
      label: "Tài liệu",
      path: PATH_TEACHER.documents,
    },
    {
      icon: Database,
      label: "Ngân hàng đề",
      path: PATH_TEACHER.questionBank,
    },
  ];

  // Student menu items
  const studentMenuItems = [
    {
      icon: Home,
      label: "Dashboard",
      path: PATH_STUDENT.root,
    },
    {
      icon: BookOpen,
      label: "Lớp học của tôi",
      path: PATH_STUDENT.classroom.root,
    },
    {
      icon: Calendar,
      label: "Lịch học",
      path: PATH_STUDENT.schedule,
    },
  ];

  // Admin menu items
  const adminMenuItems = [
    {
      icon: BookOpen,
      label: "System Dashboard",
      path: PATH_ADMIN.dashboard,
    },
    {
      icon: Wallet,
      label: "Revenue Dashboard",
      path: PATH_ADMIN.revenueDashboard,
    },
    {
      icon: ReceiptText,
      label: "Lịch sử giao dịch",
      path: PATH_ADMIN.transactionHistory,
    },
    {
      icon: Users,
      label: "Quản lý người dùng",
      path: PATH_ADMIN.users.root,
    },
    {
      icon: CreditCard,
      label: "Gói đăng ký người dùng",
      path: PATH_ADMIN.subscriptions.root,
    },
    {
      icon: Package,
      label: "Quản lý gói dịch vụ",
      path: PATH_ADMIN.plans.root,
    },
    {
      icon: Bell,
      label: "Quản lý thông báo",
      path: PATH_ADMIN.systemNotifications,
    },
    {
      icon: BookMarked,
      label: "Quản lý báo cáo",
      path: PATH_ADMIN.reports,
    },
    {
      icon: Settings,
      label: "Cài đặt",
      path: PATH_ADMIN.settings,
    },
  ];

  const menuItems = isTeacher
    ? teacherMenuItems
    : isStudent
      ? studentMenuItems
      : adminMenuItems;
  const activeMenuItem = menuItems.find(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/"),
  );

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchNotificationData({ withList: false });
    const token = localStorage.getItem("accessToken");
    const disconnect = createNotificationSocket({
      token,
      onConnected: () => {
        fetchNotificationData({ withList: false });
      },
      onNotification: (incomingNotification) => {
        if (!incomingNotification?.id) return;

        setNotifications((prev) => {
          const existingIndex = prev.findIndex(
            (item) => item.id === incomingNotification.id,
          );

          if (existingIndex >= 0) {
            return prev.map((item) =>
              item.id === incomingNotification.id
                ? { ...item, ...incomingNotification }
                : item,
            );
          }

          return [incomingNotification, ...prev];
        });
      },
      onUnreadCount: (nextUnreadCount) => {
        setUnreadCount(Math.max(0, Number(nextUnreadCount || 0)));
      },
      onAccountStatus: async (accountStatusEvent) => {
        if (
          accountStatusEvent?.status !== "BANNED" ||
          forcedLogoutTriggeredRef.current
        ) {
          return;
        }

        forcedLogoutTriggeredRef.current = true;

        const lockMessage =
          accountStatusEvent?.message ||
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.";

        setAccountLockedNotice(lockMessage);
        sessionStorage.setItem("account_locked_realtime", "1");
        sessionStorage.setItem("account_locked_message", lockMessage);

        window.setTimeout(async () => {
          sessionStorage.removeItem("account_locked_realtime");
          await logout();
          navigate(PATH_AUTH.login, { replace: true });
        }, 2500);
      },
      onError: (error) => {
        console.error("Notification socket error:", error);
      },
    });

    return () => disconnect();
  }, [logout, navigate, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".notification-wrapper")) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="dashboard-layout">
      {accountLockedNotice && (
        <div
          className="account-lock-overlay"
          role="alert"
          aria-live="assertive"
        >
          <div className="account-lock-card">
            <h3>Tài khoản của bạn đã bị khóa</h3>
            <p>{accountLockedNotice}</p>
            <span>Hệ thống sẽ đăng xuất bạn trong giây lát...</span>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo" onClick={() => navigate(PATH_AUTH.home)}>
            <AppLogo
              size={isSidebarOpen ? 56 : 34}
              imageScale={1.9}
              showFallbackBackground={false}
            />
            <span className={`logo-text ${!isSidebarOpen ? "hidden" : ""}`}>
              Learnify
            </span>
          </div>
          <button
            className="toggle-sidebar-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isSidebarOpen && <div className="sidebar-role-chip">{roleLabel}</div>}

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              title={!isSidebarOpen ? item.label : ""}
            >
              <item.icon size={20} />
              <span className={`nav-label ${!isSidebarOpen ? "hidden" : ""}`}>
                {item.label}
              </span>
              {isSidebarOpen && isActive(item.path) && (
                <ChevronRight size={14} className="nav-item-chevron" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isSidebarOpen && isTeacher && (
            <div className="sidebar-plan-usage-card">
              <div className="sidebar-plan-usage-head">
                <span className="sidebar-plan-usage-label">Gói hiện tại</span>
                <strong className="sidebar-plan-usage-value">
                  {planLabel}
                </strong>
              </div>

              <div className="sidebar-benefit-usage-item">
                <div className="sidebar-benefit-usage-row">
                  <span>STORAGE</span>
                  <span>{storagePercentLabel}</span>
                </div>
                <div className="sidebar-storage-progress" aria-hidden="true">
                  <div
                    className="sidebar-storage-progress-fill"
                    style={{ width: `${storagePercentBar}%` }}
                  />
                </div>
                <div className="sidebar-benefit-usage-subtext">
                  {storageUsageLabel}
                </div>
              </div>

              <div className="sidebar-benefit-usage-item">
                <div className="sidebar-benefit-usage-row">
                  <span>AI_REQUEST</span>
                  <span>{`${aiUsed}/${aiLimit}`}</span>
                </div>
              </div>
            </div>
          )}

          <button
            className="nav-item"
            onClick={() => navigate(PATH_COMMON.profile)}
            title={!isSidebarOpen ? "Cài đặt" : ""}
          >
            <Settings size={20} />
            <span className={`nav-label ${!isSidebarOpen ? "hidden" : ""}`}>
              Cài đặt
            </span>
          </button>
          <button
            className="nav-item logout"
            onClick={handleLogoutClick}
            title={!isSidebarOpen ? "Đăng xuất" : ""}
          >
            <LogOut size={20} />
            <span className={`nav-label ${!isSidebarOpen ? "hidden" : ""}`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="mobile-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div className="page-context">
              <div className="page-context-label">Khu vực làm việc</div>
              <div className="page-context-title">
                {activeMenuItem?.label || roleLabel}
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="notification-wrapper">
              <button
                className="notification-trigger"
                onClick={handleToggleNotification}
                aria-label="Thông báo"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Thông báo</h3>
                    <button
                      className="mark-all-btn"
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      <CheckCheck size={14} />
                      <span>Đánh dấu tất cả đã đọc</span>
                    </button>
                  </div>

                  <div className="notification-list">
                    {isNotificationLoading ? (
                      <div className="notification-empty">Đang tải thông báo...</div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-empty">Bạn chưa có thông báo nào</div>
                    ) : (
                      notifications.slice(0, 8).map((notification) => (
                        <button
                          key={notification.id}
                          className={`notification-item ${notification.read ? "read" : "unread"}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="notification-item-title-row">
                            <div className="notification-item-title">
                              {notification.title}
                            </div>
                            {!notification.read && (
                              <span className="notification-dot" />
                            )}
                          </div>
                          <div className="notification-item-desc">
                            {notification.shortDescription || "Không có mô tả"}
                          </div>
                          <div className="notification-item-time">
                            {formatTimeAgo(notification.createdAt)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="notification-footer">
                    <button
                      className="view-all-btn"
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

            <div className="user-menu-wrapper">
              <button
                className="user-menu-trigger"
                onClick={() => {
                  setIsNotificationOpen(false);
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
              >
                <div className="user-avatar">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.fullName || "User"}
                      className="avatar-image"
                    />
                  ) : (
                    <span>
                      {user?.fullName?.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="user-info-header">
                  <span className="user-name">{user?.fullName || "User"}</span>
                  <span className="user-role">{roleLabel}</span>
                </div>
                <ChevronDown size={16} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="dropdown-overlay"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-user-info">
                        <div className="dropdown-avatar">
                          {user?.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user?.fullName || "User"}
                              className="avatar-image"
                            />
                          ) : (
                            <span>
                              {user?.fullName?.charAt(0).toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="dropdown-name">{user?.fullName}</div>
                          <div className="dropdown-email">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate(PATH_COMMON.profile);
                      }}
                    >
                      <Settings size={16} />
                      <span>Tài khoản của tôi</span>
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate(PATH_AUTH.home);
                      }}
                    >
                      <BookOpen size={16} />
                      <span>Về trang chủ</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item danger"
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      <NotificationDetailModal
        isOpen={Boolean(selectedNotification)}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
};

export default DashboardLayout;
