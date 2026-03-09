import React, { useState } from "react";
import { Mail, BookOpen, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "@/apis/authApi";
import { PATH_AUTH } from "@/routes/paths";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    try {
      await authApi.forgotPassword(normalizedEmail);
      navigate(PATH_AUTH.forgotPasswordOtp, {
        state: { email: normalizedEmail },
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể gửi mã OTP. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="forgot-content">
        {/* Header */}
        <div className="forgot-header">
          <Link to={PATH_AUTH.login} className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại đăng nhập</span>
          </Link>
        </div>

        {/* Main content */}
        <div className="forgot-main">
          <div className="icon-wrapper">
            <div className="lock-icon">
              <Mail size={40} strokeWidth={2} />
            </div>
          </div>

          <h1 className="forgot-title">Quên mật khẩu?</h1>
          <p className="forgot-description">
            Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi mã OTP gồm 6 chữ số
            để xác thực danh tính của bạn.
          </p>

          <form onSubmit={handleSubmit} className="forgot-form">
            {error && <div className="error-message">{error}</div>}

            <div className="input-group">
              <label
                htmlFor="email"
                className={focusedInput === "email" || email ? "active" : ""}
              >
                Địa chỉ Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                required
                className={focusedInput === "email" ? "focused" : ""}
                placeholder="example@email.com"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className={`submit-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading || !email}
            >
              {isLoading ? <span className="spinner"></span> : "Gửi mã OTP"}
            </button>

            <Link to={PATH_AUTH.login} className="cancel-link">
              Hủy
            </Link>
          </form>
        </div>

        {/* Footer branding */}
        <div className="forgot-footer">
          <div className="brand-logo">
            <BookOpen size={20} />
            <span>Learnify</span>
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .forgot-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f9fc;
          position: relative;
          overflow: hidden;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 20px;
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

        .forgot-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 480px;
          background: white;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          animation: slideUp 0.6s ease-out;
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

        .forgot-header {
          margin-bottom: 32px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #666;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.3s;
          text-decoration: none;
        }

        .back-button:hover {
          background: #f3f4f6;
          color: #3b82f6;
        }

        .forgot-main {
          text-align: center;
        }

        .icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
          animation: fadeIn 0.6s ease-out 0.1s backwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .lock-icon {
          width: 96px;
          height: 96px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
        }

        .forgot-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
          animation: fadeIn 0.6s ease-out 0.2s backwards;
        }

        .forgot-description {
          font-size: 15px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 40px;
          animation: fadeIn 0.6s ease-out 0.3s backwards;
        }

        .forgot-form {
          animation: fadeIn 0.6s ease-out 0.4s backwards;
          text-align: left;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
          text-align: center;
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-group label {
          position: absolute;
          top: 50%;
          left: 16px;
          transform: translateY(-50%);
          font-size: 15px;
          color: #999;
          pointer-events: none;
          transition: all 0.3s ease;
          background: white;
          padding: 0 4px;
        }

        .input-group label.active,
        .input-group input:focus + label {
          top: 0;
          font-size: 12px;
          color: #3b82f6;
        }

        .input-group input {
          width: 100%;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 15px;
          color: #1a1a1a;
          transition: all 0.3s ease;
          background: white;
          outline: none;
        }

        .input-group input::placeholder {
          color: transparent;
        }

        .input-group input:focus,
        .input-group input.focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .submit-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .submit-button.loading {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .cancel-link {
          display: block;
          width: 100%;
          padding: 14px;
          background: transparent;
          color: #666;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cancel-link:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          background: #eff6ff;
        }

        .forgot-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          justify-content: center;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #3b82f6;
          font-weight: 700;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default ForgotPasswordPage;
