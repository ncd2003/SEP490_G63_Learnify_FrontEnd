import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  MessageSquare,
  Users,
  FileText,
  FolderOpen,
  BarChart3,
  ClipboardCheck,
  ChevronLeft,
  Calendar,
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
  { key: "grades", label: "Bảng điểm", icon: BarChart3, path: "/grades" },
  {
    key: "attendance",
    label: "Điểm danh",
    icon: ClipboardCheck,
    path: "/attendance",
  },
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".classroom-workspace-user-menu")) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await notificationApi.getUnreadCount();
        if (!isMounted) return;
        setUnreadCount(Number(response?.result || 0));
      } catch (err) {
        console.error("Failed to fetch unread notifications:", err);
      }
    };

    fetchUnreadCount();
    const timer = window.setInterval(fetchUnreadCount, 30000);
    const token = localStorage.getItem("accessToken");
    const disconnect = createNotificationSocket({
      token,
      onConnected: fetchUnreadCount,
      onNotification: fetchUnreadCount,
      onError: (error) => {
        console.error("Notification socket error:", error);
      },
    });

    return () => {
      isMounted = false;
      window.clearInterval(timer);
      disconnect();
    };
  }, []);

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

  const handleOpenNotifications = () => {
    navigate(PATH_COMMON.notifications);
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

  const roleLabel = (() => {
    if (normalizedRole === "TEACHER") return "Giáo viên";
    if (normalizedRole === "STUDENT") return "Học sinh";
    if (normalizedRole === "ADMIN") return "Quản trị viên";
    return "Người dùng";
  })();

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
                {user?.fullName || user?.username}
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
          {MENU_ITEMS.map((item) => {
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
                <Icon size={20} />
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
            <div className="classroom-workspace-label">KHU VỰC LÀM VIỆC</div>
            <div className="classroom-workspace-title-row">
              <div className="classroom-workspace-title">{activeMenuLabel}</div>
            </div>
          </div>

          <div className="classroom-workspace-right">
            <button
              type="button"
              className="classroom-workspace-notification"
              onClick={handleOpenNotifications}
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

            <div className="classroom-workspace-user-menu">
              <button
                type="button"
                className="classroom-workspace-user-trigger"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
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
