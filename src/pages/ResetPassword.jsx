import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck, Check, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/apis/auth.api";
import { PATH_AUTH } from "@/routes/paths";

const MSG05 =
  "Mật khẩu không khớp. Vui lòng đảm bảo cả hai trường mật khẩu đều giống nhau.";
const TOAST_ID_MSG05 = "reset-msg05";
const TOAST_ID_RESET_GENERIC = "reset-msg-generic";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const resetToken = location.state?.resetToken || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!resetToken) {
      navigate(PATH_AUTH.forgotPassword);
    }
  }, [resetToken, navigate]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    calculatePasswordStrength(value);
  };

  const passwordRequirements = [
    { text: "Ít nhất 8 ký tự", met: newPassword.length >= 8 },
    {
      text: "Chữ hoa và chữ thường",
      met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    },
    { text: "Ít nhất 1 số", met: /[0-9]/.test(newPassword) },
    { text: "Ký tự đặc biệt", met: /[^a-zA-Z0-9]/.test(newPassword) },
  ];

  const getStrengthLabel = () => {
    const labels = ["", "Rất yếu", "Yếu", "Trung bình", "Mạnh"];
    return labels[passwordStrength] || "";
  };

  const getStrengthColor = () => {
    const colors = ["#e5e7eb", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
    return colors[passwordStrength] || "#e5e7eb";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error(MSG05, { id: TOAST_ID_MSG05 });
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });

      navigate(PATH_AUTH.login, {
        state: {
          message: "Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại.",
        },
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Cập nhật mật khẩu thất bại. Vui lòng thử lại.";
      toast.error(errorMessage, { id: TOAST_ID_RESET_GENERIC });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="reset-content">
        {/* Icon */}
        <div className="reset-main">
          <div className="icon-wrapper">
            <div className="shield-icon">
              <ShieldCheck size={40} strokeWidth={2} />
            </div>
          </div>

          <h1 className="reset-title">Đặt mật khẩu mới</h1>
          <p className="reset-description">
            Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn.
          </p>

          <form onSubmit={handleSubmit} className="reset-form">
            {/* New Password */}
            <div className="input-group">
              <label
                htmlFor="newPassword"
                className={
                  focusedInput === "newPassword" || newPassword ? "active" : ""
                }
              >
                Mật khẩu mới
              </label>
              <div className="password-wrapper">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  onFocus={() => setFocusedInput("newPassword")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className={focusedInput === "newPassword" ? "focused" : ""}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password strength */}
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="strength-bar"
                      style={{
                        background:
                          passwordStrength >= level
                            ? getStrengthColor()
                            : "#e5e7eb",
                      }}
                    />
                  ))}
                </div>
                {getStrengthLabel() && (
                  <span
                    className="strength-label"
                    style={{ color: getStrengthColor() }}
                  >
                    {getStrengthLabel()}
                  </span>
                )}
              </div>
            )}

            {/* Password requirements */}
            {newPassword && (
              <div className="password-requirements">
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`requirement-item ${req.met ? "met" : "unmet"}`}
                  >
                    {req.met ? <Check size={14} /> : <X size={14} />}
                    <span>{req.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Confirm Password */}
            <div className="input-group">
              <label
                htmlFor="confirmPassword"
                className={
                  focusedInput === "confirmPassword" || confirmPassword
                    ? "active"
                    : ""
                }
              >
                Xác nhận mật khẩu
              </label>
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedInput("confirmPassword")}
                  onBlur={() => setFocusedInput(null)}
                  required
                  className={
                    focusedInput === "confirmPassword" ? "focused" : ""
                  }
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Password match indicator */}
            {confirmPassword && (
              <div
                className={`match-indicator ${
                  newPassword === confirmPassword ? "match" : "no-match"
                }`}
              >
                {newPassword === confirmPassword ? (
                  <>
                    <Check size={14} />
                    <span>Mật khẩu khớp</span>
                  </>
                ) : (
                  <>
                    <X size={14} />
                    <span>Mật khẩu không khớp</span>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              className={`submit-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading || !newPassword || !confirmPassword}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                "Cập nhật mật khẩu"
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .reset-container {
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

        .reset-content {
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
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .reset-main {
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

        .shield-icon {
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

        .reset-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
          animation: fadeIn 0.6s ease-out 0.2s backwards;
        }

        .reset-description {
          font-size: 15px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 40px;
          animation: fadeIn 0.6s ease-out 0.3s backwards;
        }

        .reset-form {
          text-align: left;
          animation: fadeIn 0.6s ease-out 0.4s backwards;
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
          z-index: 1;
        }

        .input-group label.active {
          top: 0;
          font-size: 12px;
          color: #3b82f6;
        }

        .input-group input {
          width: 100%;
          padding: 16px;
          padding-right: 52px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 15px;
          color: #1a1a1a;
          transition: all 0.3s ease;
          background: white;
          outline: none;
        }

        .input-group input:focus,
        .input-group input.focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .password-wrapper {
          position: relative;
        }

        .toggle-password {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s;
        }

        .toggle-password:hover {
          color: #3b82f6;
        }

        .password-strength {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          margin-top: -12px;
        }

        .strength-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .strength-bar {
          height: 4px;
          flex: 1;
          border-radius: 2px;
          transition: background 0.3s;
        }

        .strength-label {
          font-size: 12px;
          font-weight: 600;
          min-width: 70px;
          text-align: right;
        }

        .password-requirements {
          background: #f9fafb;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .requirement-item.met {
          color: #10b981;
        }

        .requirement-item.unmet {
          color: #9ca3af;
        }

        .match-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          margin-bottom: 20px;
          margin-top: -12px;
          padding: 6px 12px;
          border-radius: 8px;
        }

        .match-indicator.match {
          color: #10b981;
          background: #f0fdf4;
        }

        .match-indicator.no-match {
          color: #ef4444;
          background: #fef2f2;
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
          margin-top: 8px;
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
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;
