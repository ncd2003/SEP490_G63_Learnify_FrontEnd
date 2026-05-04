import React, { useEffect, useState } from "react";
import { Eye, EyeOff, BookOpen, Sparkles } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import AppLogo from "@/components/AppLogo";
import { isAdminRole, isStudentRole, isTeacherRole } from "@/lib/auth-role";
import { PATH_ADMIN, PATH_AUTH } from "../routes/paths";

const MSG06 = "Email hoặc mật khẩu bạn nhập không chính xác. Vui lòng thử lại.";
const MSG07 = "Tài khoản của bạn chưa được xác minh.";
const MSG08 =
  "Tài khoản của bạn đã bị khóa hoặc không hoạt động. Vui lòng liên hệ bộ phận hỗ trợ để được giúp đỡ.";

const TOAST_ID_LOGIN_MSG06 = "login-msg06";
const TOAST_ID_LOGIN_MSG07 = "login-msg07";
const TOAST_ID_LOGIN_MSG08 = "login-msg08";
const TOAST_ID_LOGIN_GENERIC = "login-msg-generic";
const TOAST_ID_LOGIN_RESEND = "login-msg-resend";

const getLoginErrorType = (message = "", status) => {
  const normalized = String(message).toLowerCase();

  if (
    normalized.includes("not verified") ||
    normalized.includes("unverified") ||
    normalized.includes("chưa được xác minh") ||
    normalized.includes("chưa được kích hoạt") ||
    normalized.includes("xác thực otp")
  ) {
    return "not_verified";
  }

  if (
    normalized.includes("locked") ||
    normalized.includes("inactive") ||
    normalized.includes("disabled") ||
    normalized.includes("bị khóa") ||
    normalized.includes("không hoạt động")
  ) {
    return "locked_or_inactive";
  }

  if (
    status === 401 ||
    normalized.includes("invalid credential") ||
    normalized.includes("bad credentials") ||
    normalized.includes("incorrect") ||
    normalized.includes("không chính xác")
  ) {
    return "invalid_credentials";
  }

  return "unknown";
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendOtp } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [successMessage] = useState(location.state?.message || "");

  useEffect(() => {
    const lockedMessage = sessionStorage.getItem("account_locked_message");
    if (!lockedMessage) {
      return;
    }

    toast.error(lockedMessage, { id: TOAST_ID_LOGIN_MSG08 });
    sessionStorage.removeItem("account_locked_message");
    sessionStorage.removeItem("account_locked_realtime");
  }, []);

  const handleResendVerification = async () => {
    if (!email.trim()) {
      toast.error("Vui lòng nhập email để gửi lại mã xác minh.", {
        id: TOAST_ID_LOGIN_RESEND,
      });
      return;
    }

    setIsResendingVerification(true);
    try {
      await resendOtp(email.trim(), null);
      toast.success(
        "Đã gửi lại mã xác minh. Vui lòng kiểm tra email của bạn.",
        {
          id: TOAST_ID_LOGIN_RESEND,
        },
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể gửi lại mã xác minh. Vui lòng thử lại.";
      toast.error(errorMessage, { id: TOAST_ID_LOGIN_RESEND });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowResendVerification(false);

    try {
      const userData = await login({ email, password });

      const userRole = userData?.role;

      if (isAdminRole(userRole)) {
        navigate(PATH_ADMIN.dashboard, { replace: true });
      } else if (isTeacherRole(userRole) || isStudentRole(userRole)) {
        const fromState = location.state?.from;
        const fromPath = fromState?.pathname ? (fromState.pathname + (fromState.search || "")) : null;
        if (fromPath && fromPath.includes("code=")) {
          navigate(fromPath, { replace: true });
        } else {
          navigate("/classrooms", { replace: true });
        }
      } else {
        // Fallback to home if role is not recognized
        navigate("/home", { replace: true });
      }
    } catch (err) {
      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";

      const errorType = getLoginErrorType(backendMessage, status);

      if (errorType === "invalid_credentials") {
        toast.error(MSG06, { id: TOAST_ID_LOGIN_MSG06 });
      } else if (errorType === "not_verified") {
        toast.error(MSG07, { id: TOAST_ID_LOGIN_MSG07 });
        setShowResendVerification(true);
      } else if (errorType === "locked_or_inactive") {
        toast.error(MSG08, { id: TOAST_ID_LOGIN_MSG08 });
      } else {
        toast.error(backendMessage, { id: TOAST_ID_LOGIN_GENERIC });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background decoration */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="floating-book floating-book-1">
          <BookOpen size={24} />
        </div>
        <div className="floating-book floating-book-2">
          <Sparkles size={20} />
        </div>
      </div>

      <div className="login-content">
        {/* Left side - Branding */}
        <div className="brand-section">
          <div className="brand-content">
            <div className="logo-wrapper">
              <div className="logo-icon">
                <AppLogo size={42} showFallbackBackground={false} />
              </div>
              <h1 className="brand-name">Learnify</h1>
            </div>
            <p className="tagline">Học tập thông minh — Tiến bộ mỗi ngày</p>
            <p className="brand-desc">Nền tảng quản lý lớp học trực tuyến: tạo lớp, lên lịch, giao bài và theo dõi tiến độ học tập cho giáo viên và học sinh.</p>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Học trực tuyến & tương tác</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Theo dõi tiến độ & báo cáo</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Quản lý lớp & tài liệu</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot"></div>
                <span>Lịch học & điểm danh</span>
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <Link to="/register" className="brand-cta">Đăng ký miễn phí</Link>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Chào mừng trở lại!</h2>
              <p>Đăng nhập để tiếp tục hành trình học tập</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <label
                  htmlFor="email"
                  className={focusedInput === "email" || email ? "active" : ""}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className={focusedInput === "email" ? "focused" : ""}
                />
              </div>

              <div className="input-group">
                <label
                  htmlFor="password"
                  className={
                    focusedInput === "password" || password ? "active" : ""
                  }
                >
                  Mật khẩu
                </label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    required
                    className={focusedInput === "password" ? "focused" : ""}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">Ghi nhớ đăng nhập</span>
                </label>
                <Link to={PATH_AUTH.forgotPassword} className="forgot-link">
                  Quên mật khẩu?
                </Link>
              </div>

              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}

              {showResendVerification && (
                <button
                  type="button"
                  className="resend-verification-btn"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                >
                  {isResendingVerification
                    ? "Đang gửi lại mã..."
                    : "Gửi lại mã xác minh"}
                </button>
              )}

              <button
                type="submit"
                className={`login-button ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? <span className="spinner"></span> : "Đăng nhập"}
              </button>

              <div className="divider">
                <span>hoặc</span>
              </div>

              <div className="social-login">
                <a
                  href="http://localhost:8081/oauth2/authorization/google"
                  className="social-button google"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Đăng nhập bằng Google
                </a>
              </div>

              <div className="signup-link">
                Chưa có tài khoản? <Link to="/register" state={{ from: location.state?.from }}>Đăng ký ngay</Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f9fc;
          position: relative;
          overflow: hidden;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .background-shapes {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }

        .shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(79, 70, 229, 0.03);
          backdrop-filter: blur(20px);
          animation: float 20s infinite ease-in-out;
        }

        .shape-1 {
          width: 400px;
          height: 400px;
          top: -100px;
          left: -100px;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 300px;
          height: 300px;
          bottom: -80px;
          right: -80px;
          animation-delay: -7s;
        }

        .shape-3 {
          width: 250px;
          height: 250px;
          top: 50%;
          left: 20%;
          animation-delay: -14s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        .floating-book {
          position: absolute;
          color: rgba(79, 70, 229, 0.08);
          animation: floatBook 15s infinite ease-in-out;
        }

        .floating-book-1 {
          top: 15%;
          right: 10%;
          animation-delay: -3s;
        }

        .floating-book-2 {
          bottom: 20%;
          left: 15%;
          animation-delay: -8s;
        }

        @keyframes floatBook {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }

        .login-content {
          position: relative;
          z-index: 1;
          display: flex;
          width: 95%;
          max-width: 1000px;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.8s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .brand-section {
          flex: 1;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .brand-section::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          top: -250px;
          right: -250px;
          border-radius: 50%;
        }

        .brand-content {
          position: relative;
          z-index: 1;
          color: white;
        }

        .brand-desc {
          max-width: 420px;
          font-size: 14px;
          opacity: 0.95;
          margin-bottom: 18px;
          color: rgba(255,255,255,0.92);
        }

        .brand-cta {
          display: inline-block;
          padding: 10px 16px;
          background: rgba(255,255,255,0.12);
          color: white;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
        }
        .brand-cta:hover { background: rgba(255,255,255,0.18); }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .brand-name {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .tagline {
          font-size: 18px;
          opacity: 0.95;
          margin-bottom: 24px;
          font-weight: 300;
        }

        .feature-list {
          margin-bottom: 24px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 15px;
          opacity: 0.9;
        }

        .feature-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 40px;
        }

        .stat-card {
          text-align: center;
        }

        .stat-number {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          opacity: 0.85;
          font-weight: 300;
        }

        .form-section {
          flex: 1;
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }

        .form-container {
          width: 100%;
          max-width: 380px;
        }

        .form-header {
          margin-bottom: 24px;
        }

        .form-header h2 {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .form-header p {
          font-size: 15px;
          color: #666;
          font-weight: 400;
        }

        .login-form {
          animation: fadeIn 0.6s ease-out 0.2s both;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .input-group {
          margin-bottom: 16px;
          position: relative;
        }

        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #666;
          margin-bottom: 8px;
          transition: color 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-group label.active {
          color: #3b82f6;
        }

        .input-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
          color: #1a1a1a;
        }

        .input-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .input-group input.focused {
          border-color: #3b82f6;
        }

        .password-wrapper {
          position: relative;
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s;
        }

        .toggle-password:hover {
          color: #3b82f6;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-label input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          position: relative;
        }

        .checkbox-label input:checked + .checkbox-custom {
          background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
          border-color: #3b82f6;
        }

        .checkbox-label input:checked + .checkbox-custom::after {
          content: '✓';
          color: white;
          font-size: 14px;
          font-weight: bold;
        }

        .checkbox-text {
          font-size: 14px;
          color: #666;
        }

        .forgot-link {
          font-size: 14px;
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.3s;
        }

        .forgot-link:hover {
          opacity: 0.8;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
          text-align: center;
        }

        .resend-verification-btn {
          width: 100%;
          margin-bottom: 16px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .resend-verification-btn:hover:not(:disabled) {
          background: #dbeafe;
        }

        .resend-verification-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success-message {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #16a34a;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
          text-align: center;
        }

        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .login-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .login-button:hover::before {
          left: 100%;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          text-align: center;
          margin: 20px 0;
          position: relative;
        }

        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #e0e0e0;
        }

        .divider::before { left: 0; }
        .divider::after { right: 0; }

        .divider span {
          background: white;
          padding: 0 16px;
          color: #999;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .social-login {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .social-button {
          flex: 1;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          transition: all 0.3s;
          text-decoration: none;
        }

        .social-button:hover {
          border-color: #ccc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .signup-link {
          text-align: center;
          font-size: 14px;
          color: #666;
        }

        .signup-link a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.3s;
        }

        .signup-link a:hover {
          opacity: 0.8;
        }

        @media (max-width: 968px) {
          .brand-section {
            display: none;
          }

          .form-section {
            padding: 40px 24px;
          }

          .login-content {
            width: 100%;
            max-width: 500px;
            margin: 20px;
          }
        }

        @media (max-width: 480px) {
          .form-header h2 {
            font-size: 26px;
          }

          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .social-login {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
