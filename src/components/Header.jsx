import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LogoutDialog from "@/components/LogoutDialog";
import "@/assets/css/components/header.css";
import { BookOpen, Menu, X, LogOut, User } from "lucide-react";
import { PATH_AUTH, PATH_COMMON } from "@/routes/paths";

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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

  const handleDashboardClick = () => {
    const userRole = user?.role?.toUpperCase();
    if (
      userRole === "ROLE_TEACHER" ||
      userRole === "ROLE_STUDENT" ||
      userRole === "ROLE_ADMIN"
    ) {
      navigate("/classrooms");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest(".user-menu-wrapper")) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo" onClick={() => navigate(PATH_AUTH.home)}>
            <BookOpen size={32} strokeWidth={2.5} />
            <span className="logo-text">Learnify</span>
          </div>

          <nav className={`nav ${isMobileMenuOpen ? "open" : ""}`}>
            <a href="#" className="nav-link active">
              Trang chủ
            </a>
            <a href="#features" className="nav-link">
              Tính năng
            </a>
            <a href="#pricing" className="nav-link">
              Bảng giá
            </a>
            <a href="#support" className="nav-link">
              Hỗ trợ
            </a>
          </nav>

          <div className="header-actions">
            {!isAuthenticated ? (
              <>
                <button
                  className="btn-text"
                  onClick={() => navigate(PATH_AUTH.login)}
                >
                  Đăng nhập
                </button>
                <button
                  className="btn-primary"
                  onClick={() => navigate(PATH_AUTH.register)}
                >
                  Đăng ký
                </button>
              </>
            ) : (
              <>
                <button className="btn-text" onClick={handleDashboardClick}>
                  Dashboard
                </button>
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
                    <span className="user-name">
                      {user?.fullName || "User"}
                    </span>
                  </button>

                  {isUserMenuOpen && (
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
                            <div className="dropdown-name">
                              {user?.fullName}
                            </div>
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
                        <User size={16} />
                        <span>Tài khoản</span>
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
                  )}
                </div>
              </>
            )}

            <button
              className="mobile-menu-btn"
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
