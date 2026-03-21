import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "@/assets/css/components/dashboardLayout.css";
import {
  BookOpen,
  Home,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Database,
  BarChart2,
} from "lucide-react";
import { PATH_AUTH, PATH_TEACHER, PATH_STUDENT } from "@/routes/paths";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isTeacher = user?.role === "ROLE_TEACHER";
  const isStudent = user?.role === "ROLE_STUDENT";

  const handleLogout = async () => {
    try {
      await logout();
      navigate(PATH_AUTH.login);
    } catch (error) {
      console.error("Logout failed:", error);
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
      icon: Users,
      label: "Học sinh",
      path: PATH_TEACHER.students,
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
    {
      icon: BarChart2,
      label: "Báo cáo",
      path: PATH_TEACHER.reports,
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
  ];

  const menuItems = isTeacher ? teacherMenuItems : studentMenuItems;
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

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo" onClick={() => navigate(PATH_AUTH.home)}>
            <BookOpen size={28} strokeWidth={2.5} />
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

        {isSidebarOpen && <div className="sidebar-role-chip">Giao vien</div>}

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
          <button
            className="nav-item"
            onClick={() =>
              navigate(isTeacher ? PATH_TEACHER.profile : PATH_STUDENT.profile)
            }
            title={!isSidebarOpen ? "Cài đặt" : ""}
          >
            <Settings size={20} />
            <span className={`nav-label ${!isSidebarOpen ? "hidden" : ""}`}>
              Cài đặt
            </span>
          </button>
          <button
            className="nav-item logout"
            onClick={handleLogout}
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
                {activeMenuItem?.label ||
                  (isTeacher ? "Giáo viên" : "Học sinh")}
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="user-menu-wrapper">
              <button
                className="user-menu-trigger"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                  <span className="user-role">
                    {isTeacher ? "Giáo viên" : "Học sinh"}
                  </span>
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
                        navigate(
                          isTeacher
                            ? PATH_TEACHER.profile
                            : PATH_STUDENT.profile,
                        );
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
                      onClick={handleLogout}
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
    </div>
  );
};

export default DashboardLayout;
