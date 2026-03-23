import React, { useState, useRef, useEffect } from "react";
import { KeyRound, ArrowLeft } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "@/apis/auth.api";
import { PATH_AUTH } from "@/routes/paths";

const MSG04 = "Mã OTP đã nhập không chính xác hoặc đã hết hạn.";
const TOAST_ID_MSG04 = "forgot-otp-msg04";
const TOAST_ID_FORGOT_OTP_GENERIC = "forgot-otp-generic";

const isInvalidOrExpiredOtp = (message = "") => {
  const normalized = String(message).toLowerCase();
  return (
    normalized.includes("otp") &&
    (normalized.includes("invalid") ||
      normalized.includes("expired") ||
      normalized.includes("không hợp lệ") ||
      normalized.includes("không chính xác") ||
      normalized.includes("hết hạn"))
  );
};

const ForgotPasswordOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate(PATH_AUTH.forgotPassword);
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleChange = (index, value) => {
    if (value.match(/[^0-9]/)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (pastedData.match(/^[0-9]+$/)) {
      const newOtp = pastedData.split("");
      setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")]);

      const lastIndex = Math.min(pastedData.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    setSuccessMessage("");

    try {
      const payload = { email, otp: otpCode };
      //console.log("[ForgotPasswordOtp] Sending payload:", payload);
      const response = await authApi.verifyForgotPasswordOtp(payload);
      const resetToken = response.result;

      navigate(PATH_AUTH.resetPassword, {
        state: { resetToken, email },
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || MSG04;
      if (isInvalidOrExpiredOtp(errorMessage)) {
        toast.error(MSG04, { id: TOAST_ID_MSG04 });
      } else {
        toast.error(errorMessage, { id: TOAST_ID_FORGOT_OTP_GENERIC });
      }
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setSuccessMessage("");
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();

    try {
      await authApi.forgotPassword(email);
      setCountdown(60);
      setCanResend(false);
      setSuccessMessage("Gửi lại mã OTP thành công. Vui lòng kiểm tra email.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể gửi lại mã. Vui lòng thử lại.";
      toast.error(errorMessage, { id: TOAST_ID_FORGOT_OTP_GENERIC });
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <div className="fp-otp-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="fp-otp-content">
        {/* Header */}
        <div className="fp-otp-header">
          <Link to={PATH_AUTH.forgotPassword} className="back-button">
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </Link>
        </div>

        {/* Main content */}
        <div className="fp-otp-main">
          <div className="icon-wrapper">
            <div className="key-icon">
              <KeyRound size={40} strokeWidth={2} />
            </div>
          </div>

          <h1 className="fp-otp-title">Nhập mã OTP</h1>
          <p className="fp-otp-description">
            Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến
            <span className="email-highlight"> {email}</span>.<br />
            Mã có hiệu lực trong vòng 5 phút.
          </p>

          <form onSubmit={handleVerify} className="fp-otp-form">
            {successMessage && (
              <div className="success-message">{successMessage}</div>
            )}

            <div className="otp-inputs" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`otp-input ${digit ? "filled" : ""}`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              className={`verify-button ${isLoading ? "loading" : ""}`}
              disabled={!isOtpComplete || isLoading}
            >
              {isLoading ? <span className="spinner"></span> : "Xác thực"}
            </button>

            <Link to={PATH_AUTH.login} className="cancel-link">
              Hủy
            </Link>
          </form>

          <div className="resend-section">
            <p className="resend-text">Không nhận được mã?</p>
            {canResend ? (
              <button
                className="resend-button"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? "Đang gửi..." : "Gửi lại mã OTP"}
              </button>
            ) : (
              <p className="countdown-text">
                Gửi lại sau{" "}
                <span className="countdown-number">{countdown}s</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .fp-otp-container {
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
          right: 20%;
          animation-delay: -14s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        .fp-otp-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 520px;
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

        .fp-otp-header {
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

        .fp-otp-main {
          text-align: center;
        }

        .error-text {
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          margin-bottom: 16px;
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

        .key-icon {
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

        .fp-otp-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
          animation: fadeIn 0.6s ease-out 0.2s backwards;
        }

        .fp-otp-description {
          font-size: 15px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 40px;
          animation: fadeIn 0.6s ease-out 0.3s backwards;
        }

        .email-highlight {
          color: #3b82f6;
          font-weight: 600;
        }

        .fp-otp-form {
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

        .success-message {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #16a34a;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
          text-align: center;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .otp-inputs {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 32px;
        }

        .otp-input {
          width: 56px;
          height: 64px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 24px;
          font-weight: 600;
          text-align: center;
          color: #1a1a1a;
          transition: all 0.3s ease;
          background: white;
          outline: none;
        }

        .otp-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .otp-input.filled {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .verify-button {
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
          margin-bottom: 12px;
        }

        .verify-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        .verify-button:disabled {
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
          text-align: center;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cancel-link:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          background: #eff6ff;
        }

        .resend-section {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .resend-text {
          font-size: 14px;
          color: #888;
        }

        .resend-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.3s;
        }

        .resend-button:hover:not(:disabled) {
          background: #eff6ff;
          text-decoration: underline;
        }

        .resend-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .countdown-text {
          font-size: 14px;
          color: #888;
        }

        .countdown-number {
          color: #3b82f6;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ForgotPasswordOtpPage;
