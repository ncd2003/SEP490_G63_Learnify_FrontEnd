import React, { useState, useRef, useEffect } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const OTPVerifyScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp } = useAuth();

  const email = location.state?.email || "";
  const userId = location.state?.userId || null;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const inputRefs = useRef([]);

  // Redirect to register if no email or userId
  useEffect(() => {
    if (!email || !userId) {
      navigate("/register");
    }
  }, [email, userId, navigate]);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value.match(/[^0-9]/)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
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

      // Focus last filled input
      const lastIndex = Math.min(pastedData.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Include userId in OTP verification if needed by backend
      await verifyOtp({ email, otp: otpCode, userId });
      setIsVerified(true);

      // Redirect immediately to login after success
      navigate("/login", {
        state: {
          message: "Xác thực thành công! Vui lòng đăng nhập.",
        },
      });
    } catch (err) {
      // Get error message from backend response
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Xác thực thất bại. Vui lòng thử lại.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError("");
    setSuccessMessage("");
    setOtp(["", "", "", "", "", ""]);
    setCountdown(60);
    setCanResend(false);
    inputRefs.current[0]?.focus();

    try {
      const response = await resendOtp(email, userId);
      // Show success message from backend
      const message =
        response?.message ||
        "Gửi lại mã OTP thành công. Vui lòng kiểm tra email.";
      setSuccessMessage(message);

      // Auto clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      // Get error message from backend response
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Không thể gửi lại mã. Vui lòng thử lại.";
      setError(errorMessage);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <div className="verify-container">
      {/* Background decoration */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="verify-content">
        {!isVerified ? (
          <>
            {/* Header */}
            <div className="verify-header">
              <button className="back-button" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
                <span>Quay lại</span>
              </button>
            </div>

            {/* Main content */}
            <div className="verify-main">
              <div className="icon-wrapper">
                <div className="email-icon">
                  <Mail size={40} strokeWidth={2} />
                </div>
              </div>

              <h1 className="verify-title">Xác thực email</h1>
              <p className="verify-description">
                Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến
                <span className="email-highlight"> {email}</span>
              </p>

              <form onSubmit={handleVerify} className="verify-form">
                {successMessage && (
                  <div className="success-message">{successMessage}</div>
                )}
                {error && <div className="error-message">{error}</div>}

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
              </form>

              <div className="resend-section">
                {!canResend ? (
                  <p className="countdown-text">
                    Gửi lại mã sau{" "}
                    <span className="countdown">{countdown}s</span>
                  </p>
                ) : (
                  <button className="resend-button" onClick={handleResend}>
                    Gửi lại mã xác thực
                  </button>
                )}
              </div>

              <div className="help-text">
                Không nhận được mã? Kiểm tra thư mục spam hoặc{" "}
                <button
                  className="link-button"
                  onClick={handleResend}
                  disabled={!canResend}
                >
                  gửi lại mã
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="success-content">
            <div className="success-icon-wrapper">
              <div className="success-icon">
                <CheckCircle size={64} strokeWidth={2} />
              </div>
            </div>

            <h1 className="success-title">Xác thực thành công!</h1>
            <p className="success-description">
              Email của bạn đã được xác thực. Bạn sẽ được chuyển đến trang chủ
              trong giây lát...
            </p>

            <div className="success-animation">
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .verify-container {
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

        .verify-content {
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
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .verify-header {
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
        }

        .back-button:hover {
          background: #f3f4f6;
          color: #3b82f6;
        }

        .verify-main {
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

        .email-icon {
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

        .verify-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
          animation: fadeIn 0.6s ease-out 0.2s backwards;
        }

        .verify-description {
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

        .verify-form {
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
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        }

        .otp-input:focus {
          outline: none;
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
          position: relative;
          overflow: hidden;
        }

        .verify-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .verify-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .verify-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .verify-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .verify-button:disabled {
          opacity: 0.5;
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

        .resend-section {
          margin-top: 24px;
          min-height: 24px;
        }

        .countdown-text {
          font-size: 14px;
          color: #666;
        }

        .countdown {
          color: #3b82f6;
          font-weight: 600;
        }

        .resend-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.3s;
        }

        .resend-button:hover {
          background: #eff6ff;
        }

        .help-text {
          margin-top: 32px;
          font-size: 14px;
          color: #999;
          padding-top: 32px;
          border-top: 1px solid #f0f0f0;
        }

        .link-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
          transition: opacity 0.3s;
        }

        .link-button:hover:not(:disabled) {
          opacity: 0.8;
          text-decoration: underline;
        }

        .link-button:disabled {
          color: #9ca3af;
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* Success State */
        .success-content {
          text-align: center;
          padding: 40px 0;
        }

        .success-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
          animation: scaleIn 0.6s ease-out;
        }

        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .success-icon {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          position: relative;
        }

        .success-title {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
          animation: fadeIn 0.6s ease-out 0.3s backwards;
        }

        .success-description {
          font-size: 15px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 32px;
          animation: fadeIn 0.6s ease-out 0.4s backwards;
        }

        .success-animation {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border: 3px solid #10b981;
          border-radius: 50%;
          opacity: 0;
          animation: pulse 2s ease-out infinite;
        }

        .pulse-ring.delay-1 {
          animation-delay: 0.5s;
        }

        .pulse-ring.delay-2 {
          animation-delay: 1s;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        @media (max-width: 480px) {
          .verify-content {
            padding: 32px 24px;
          }

          .verify-title {
            font-size: 26px;
          }

          .otp-inputs {
            gap: 8px;
          }

          .otp-input {
            width: 48px;
            height: 56px;
            font-size: 20px;
          }

          .email-icon {
            width: 80px;
            height: 80px;
          }

          .email-icon svg {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </div>
  );
};

export default OTPVerifyScreen;
