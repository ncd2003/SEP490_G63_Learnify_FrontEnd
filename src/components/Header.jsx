import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LogoutDialog from "@/components/LogoutDialog";
import AppLogo from "@/components/AppLogo";
import "@/assets/css/components/header.css";
import { Menu, X, LogOut, User } from "lucide-react";
import { isAdminRole, isStudentRole, isTeacherRole } from "@/lib/auth-role";
import { PATH_ADMIN, PATH_AUTH, PATH_COMMON } from "@/routes/paths";

const PLAN_NAV_KEY = "plans";

const DEFAULT_NAV_ITEMS = [
  { key: "home", label: "Trang chủ", to: PATH_AUTH.home },
  { key: PLAN_NAV_KEY, label: "Gói dịch vụ", to: PATH_AUTH.plans },
];

const Header = ({ navItems = DEFAULT_NAV_ITEMS, activeNavKey = "" }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const canViewPlans = isTeacherRole(user?.role);
  const normalizedNavItems = Array.isArray(navItems) ? navItems : [];
  const visibleNavItems = normalizedNavItems.filter((item) => {
    const isPlansItem = item?.key === PLAN_NAV_KEY && item?.to === PATH_AUTH.plans;
    if (isPlansItem) {
      return canViewPlans;
    }
    return true;
  });

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    setIsLogoutDialogOpen(true);
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

  const handleNavItemClick = (item) => {
    if (!item) {
      return;
    }

    if (typeof item.onClick === "function") {
      item.onClick();
    } else if (item.to) {
      navigate(item.to);
    }

    setIsMobileMenuOpen(false);
  };

  const handleDashboardClick = () => {
    const userRole = user?.role;
    if (isAdminRole(userRole)) {
      navigate(PATH_ADMIN.dashboard);
    } else if (isTeacherRole(userRole) || isStudentRole(userRole)) {
      navigate("/classrooms");
    }
    setIsMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isUserMenuOpen &&
        !event.target.closest(".site-header-user-menu-wrapper")
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  return (
    <header className="site-header">
      <div className="site-header-container">
        <div className="site-header-content">
          <div
            className="site-header-logo"
            onClick={() => navigate(PATH_AUTH.home)}
          >
            <AppLogo
              size={42}
              imageScale={1.9}
              showFallbackBackground={false}
            />
            <span className="site-header-logo-text">Learnify</span>
          </div>

          <nav className={`site-header-nav ${isMobileMenuOpen ? "open" : ""}`}>
            {visibleNavItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`site-header-nav-link ${
                  activeNavKey === item.key ? "active" : ""
                }`}
                onClick={() => handleNavItemClick(item)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="site-header-actions">
            {!isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="site-header-btn-text"
                  onClick={() => navigate(PATH_AUTH.login)}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className="site-header-btn-primary"
                  onClick={() => navigate(PATH_AUTH.register)}
                >
                  Đăng ký
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="site-header-btn-text"
                  onClick={handleDashboardClick}
                >
                  Dashboard
                </button>
                <div className="site-header-user-menu-wrapper">
                  <button
                    type="button"
                    className="site-header-user-menu-trigger"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <div className="site-header-user-avatar">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user?.fullName || "User"}
                          className="site-header-avatar-image"
                        />
                      ) : (
                        <span>
                          {user?.fullName?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <span className="site-header-user-name">
                      {user?.fullName || "User"}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="site-header-user-dropdown">
                      <div className="site-header-dropdown-header">
                        <div className="site-header-dropdown-user-info">
                          <div className="site-header-dropdown-avatar">
                            {user?.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user?.fullName || "User"}
                                className="site-header-avatar-image"
                              />
                            ) : (
                              <span>
                                {user?.fullName?.charAt(0).toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="site-header-dropdown-name">
                              {user?.fullName}
                            </div>
                            <div className="site-header-dropdown-email">
                              {user?.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="site-header-dropdown-divider"></div>
                      <button
                        type="button"
                        className="site-header-dropdown-item"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsMobileMenuOpen(false);
                          navigate(PATH_COMMON.profile);
                        }}
                      >
                        <User size={16} />
                        <span>Tài khoản</span>
                      </button>
                      <div className="site-header-dropdown-divider"></div>
                      <button
                        type="button"
                        className="site-header-dropdown-item danger"
                        onClick={handleLogoutClick}
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              className="site-header-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </header>
  );
};

export default Header;
