import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppLogo from "@/components/AppLogo";
import { isAdminRole } from "@/lib/auth-role";
import { PATH_ADMIN, PATH_AUTH } from "@/routes/paths";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userData = await adminLogin({ email, password });
      if (!isAdminRole(userData?.role)) {
        setError("Bạn không có quyền truy cập vào khu vực Quản trị.");
        return;
      }

      navigate(PATH_ADMIN.dashboard, { replace: true });
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setError(backendMessage || "Đăng nhập Admin thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-grid-overlay" />
      <div className="admin-login-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <AppLogo size={64} showFallbackBackground={false} rounded={false} />
        </div>
        <h1>Đăng nhập Quản trị</h1>
        <p>Vui lòng nhập thông tin để truy cập System Dashboard</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label htmlFor="admin-email">Email</label>
          <div className="field-wrap">
            <Mail size={18} />
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@learnify.vn"
            />
          </div>

          <label htmlFor="admin-password">Mật khẩu</label>
          <div className="field-wrap">
            <Lock size={18} />
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu quản trị"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="meta-row">
            <span className="rule-note">
              Bắt buộc tài khoản có vai trò Admin và trạng thái Hoạt động
            </span>
            <Link className="forgot-link" to={PATH_AUTH.forgotPassword}>
              Quên mật khẩu?
            </Link>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="submit-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>
      </div>

      <style>{`
        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(circle at 15% 20%, rgba(13, 148, 136, 0.2), transparent 35%),
            radial-gradient(circle at 85% 80%, rgba(30, 64, 175, 0.26), transparent 35%),
            linear-gradient(145deg, #0b1220 0%, #0f172a 55%, #111827 100%);
          color: #f9fafb;
          position: relative;
          overflow: hidden;
        }

        .admin-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: radial-gradient(circle at center, black 30%, transparent 90%);
          pointer-events: none;
        }

        .admin-login-card {
          width: 100%;
          max-width: 460px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(15, 23, 42, 0.86);
          backdrop-filter: blur(8px);
          padding: 32px;
          border-radius: 18px;
          position: relative;
          box-shadow: 0 24px 44px rgba(0, 0, 0, 0.35);
          animation: raise-in 0.35s ease-out;
        }

        @keyframes raise-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .admin-login-card h1 {
          font-size: clamp(24px, 3vw, 30px);
          margin: 0;
          line-height: 1.1;
        }

        .admin-login-card p {
          color: #cbd5e1;
          margin-top: 8px;
          margin-bottom: 24px;
          font-size: 14px;
        }

        .admin-login-form {
          display: grid;
          gap: 10px;
        }

        .admin-login-form label {
          font-size: 13px;
          color: #e2e8f0;
          font-weight: 600;
        }

        .field-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(15, 23, 42, 0.7);
          padding: 0 12px;
          border-radius: 10px;
          transition: border-color 0.2s ease;
          min-height: 46px;
        }

        .field-wrap:focus-within {
          border-color: #14b8a6;
        }

        .field-wrap input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          font-size: 14px;
          min-width: 0;
        }

        .field-wrap input::placeholder {
          color: #94a3b8;
        }

        .toggle-password {
          border: none;
          background: transparent;
          color: #cbd5e1;
          cursor: pointer;
          padding: 0;
          display: inline-flex;
          align-items: center;
        }

        .submit-btn {
          margin-top: 8px;
          border: none;
          border-radius: 10px;
          min-height: 46px;
          font-weight: 700;
          color: #062a26;
          background: linear-gradient(90deg, #2dd4bf 0%, #5eead4 100%);
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.2s ease;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .submit-btn:disabled {
          cursor: not-allowed;
          opacity: 0.75;
        }

        .error-box {
          margin-top: 4px;
          border: 1px solid rgba(248, 113, 113, 0.6);
          color: #fecaca;
          background: rgba(127, 29, 29, 0.3);
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
        }

        .meta-row {
          margin-top: 2px;
          margin-bottom: 2px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .rule-note {
          margin: 0;
          color: #cbd5e1;
          font-size: 12px;
          line-height: 1.4;
        }

        .forgot-link {
          color: #f8fafc;
          text-decoration: underline;
          text-underline-offset: 3px;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 600;
        }

        .forgot-link:hover {
          color: #99f6e4;
        }

        .hint-text {
          margin-top: 14px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.45;
        }

        @media (max-width: 560px) {
          .admin-login-card {
            padding: 22px;
            border-radius: 14px;
          }

          .meta-row {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLoginPage;
