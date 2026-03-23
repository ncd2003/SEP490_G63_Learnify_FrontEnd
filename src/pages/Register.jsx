import React, { useState } from "react";
import { Eye, EyeOff, BookOpen, Check, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const MSG02 =
  "Các trường bắt buộc phải được điền đầy đủ và tất cả giá trị nhập vào phải hợp lệ.";
const MSG03 = "Email đã tồn tại trong hệ thống";
const MSG05 =
  "Mật khẩu không khớp. Vui lòng đảm bảo cả hai trường mật khẩu đều giống nhau.";
const TOAST_ID_MSG02 = "register-msg02";
const TOAST_ID_MSG05 = "register-msg05";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isPasswordValid = (password = "") => {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password)
  );
};

const isEmailExistsError = (message = "") => {
  const normalized = String(message).toLowerCase();
  return (
    normalized.includes("email") &&
    (normalized.includes("exist") || normalized.includes("tồn tại"))
  );
};

const shouldShowInlineError = (message = "") =>
  message && message !== MSG02 && message !== MSG05;

const RegisterScreen = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    agreeTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

    if (field === "password") {
      calculatePasswordStrength(value);
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: MSG05 }));
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }

    if (field === "confirmPassword") {
      if (value && formData.password !== value) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: MSG05 }));
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.role) errors.role = MSG02;
    if (!formData.fullName.trim()) errors.fullName = MSG02;
    if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = MSG02;
    }
    if (!isPasswordValid(formData.password)) errors.password = MSG02;

    if (
      !formData.confirmPassword ||
      formData.password !== formData.confirmPassword
    ) {
      errors.confirmPassword = MSG05;
    }

    if (!formData.agreeTerms) errors.agreeTerms = MSG02;

    return errors;
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthText = () => {
    const texts = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
    return texts[passwordStrength] || "";
  };

  const getPasswordStrengthColor = () => {
    const colors = ["#ef4444", "#f59e0b", "#eab308", "#3b82f6", "#10b981"];
    return colors[passwordStrength] || "#e5e7eb";
  };

  const passwordRequirements = [
    { text: "Ít nhất 8 ký tự", met: formData.password.length >= 8 },
    {
      text: "Chữ hoa và chữ thường",
      met: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password),
    },
    { text: "Ít nhất 1 số", met: /[0-9]/.test(formData.password) },
    { text: "Ký tự đặc biệt", met: /[^a-zA-Z0-9]/.test(formData.password) },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    const priority = [
      "role",
      "fullName",
      "email",
      "password",
      "confirmPassword",
      "agreeTerms",
    ];

    const firstErrorKey = priority.find((key) => errors[key]);
    const firstErrorMessage = firstErrorKey ? errors[firstErrorKey] : "";

    if (firstErrorMessage === MSG02) {
      toast.error(MSG02, { id: TOAST_ID_MSG02 });
      setFieldErrors({});
    } else if (firstErrorMessage === MSG05) {
      toast.error(MSG05, { id: TOAST_ID_MSG05 });
      setFieldErrors({});
    } else {
      setFieldErrors(
        firstErrorKey ? { [firstErrorKey]: errors[firstErrorKey] } : {},
      );
    }

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // Extract userId from response
      const userId = response.result?.id;

      // Redirect immediately to OTP verification page
      navigate("/verify-otp", {
        state: {
          email: formData.email,
          userId: userId,
          message: "Đăng ký thành công! Vui lòng kiểm tra email và nhập OTP.",
        },
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Đăng ký thất bại. Vui lòng thử lại.";

      if (isEmailExistsError(errorMessage)) {
        toast.error(MSG03);
        setFieldErrors((prev) => ({ ...prev, email: MSG03 }));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Background decoration */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="floating-icon floating-icon-1">
          <BookOpen size={24} />
        </div>
        <div className="floating-icon floating-icon-2">
          <BookOpen size={20} />
        </div>
      </div>

      <div className="register-content">
        {/* Left side - Branding */}
        <div className="brand-section">
          <div className="brand-content">
            <div className="logo-wrapper">
              <div className="logo-icon">
                <BookOpen size={36} strokeWidth={2.5} />
              </div>
              <h1 className="brand-name">Learnify</h1>
            </div>
            <p className="tagline">Bắt đầu hành trình học tập của bạn</p>

            <div className="benefits-list">
              <h3 className="benefits-title">Những gì bạn nhận được:</h3>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <Check size={18} />
                </div>
                <div>
                  <div className="benefit-name">Khóa học chất lượng cao</div>
                  <div className="benefit-desc">
                    Hơn 1000+ khóa học từ các chuyên gia
                  </div>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <Check size={18} />
                </div>
                <div>
                  <div className="benefit-name">Chứng chỉ được công nhận</div>
                  <div className="benefit-desc">
                    Nâng cao CV và cơ hội nghề nghiệp
                  </div>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">
                  <Check size={18} />
                </div>
                <div>
                  <div className="benefit-name">Học mọi lúc, mọi nơi</div>
                  <div className="benefit-desc">
                    Trên mọi thiết bị, tiến độ được đồng bộ
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial">
              <div className="quote-mark">"</div>
              <p className="testimonial-text">
                Nền tảng tuyệt vời! Tôi đã học được rất nhiều kỹ năng mới và
                phát triển sự nghiệp.
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">NT</div>
                <div>
                  <div className="author-name">Nguyễn Thị Mai</div>
                  <div className="author-role">Học viên xuất sắc 2024</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Register form */}
        <div className="form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Tạo tài khoản</h2>
              <p>Miễn phí và chỉ mất vài phút</p>
            </div>

            <form
              onSubmit={handleRegister}
              className="register-form"
              noValidate
            >
              {/* Role Selection */}
              <div className="role-selection">
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="ROLE_STUDENT"
                    checked={formData.role === "ROLE_STUDENT"}
                    onChange={(e) => handleChange("role", e.target.value)}
                  />
                  <div
                    className={`role-card ${formData.role === "ROLE_STUDENT" ? "selected" : ""}`}
                  >
                    <div className="role-icon">🎓</div>
                    <div className="role-name">Học sinh</div>
                    <div className="role-desc">
                      Tìm kiếm và học các khóa học
                    </div>
                  </div>
                </label>

                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="ROLE_TEACHER"
                    checked={formData.role === "ROLE_TEACHER"}
                    onChange={(e) => handleChange("role", e.target.value)}
                  />
                  <div
                    className={`role-card ${formData.role === "ROLE_TEACHER" ? "selected" : ""}`}
                  >
                    <div className="role-icon">👨‍🏫</div>
                    <div className="role-name">Giáo viên</div>
                    <div className="role-desc">Tạo và quản lý khóa học</div>
                  </div>
                </label>
              </div>
              {shouldShowInlineError(fieldErrors.role) && (
                <div className="error-text">{fieldErrors.role}</div>
              )}

              <div className="input-group">
                <label
                  htmlFor="fullName"
                  className={
                    focusedInput === "fullName" || formData.fullName
                      ? "active"
                      : ""
                  }
                >
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  onFocus={() => setFocusedInput("fullName")}
                  onBlur={() => setFocusedInput(null)}
                  className={focusedInput === "fullName" ? "focused" : ""}
                />
                {shouldShowInlineError(fieldErrors.fullName) && (
                  <div className="error-text">{fieldErrors.fullName}</div>
                )}
              </div>

              <div className="input-group">
                <label
                  htmlFor="email"
                  className={
                    focusedInput === "email" || formData.email ? "active" : ""
                  }
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  className={focusedInput === "email" ? "focused" : ""}
                />
                {shouldShowInlineError(fieldErrors.email) && (
                  <div className="error-text">{fieldErrors.email}</div>
                )}
              </div>

              <div className="input-group">
                <label
                  htmlFor="password"
                  className={
                    focusedInput === "password" || formData.password
                      ? "active"
                      : ""
                  }
                >
                  Mật khẩu
                </label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
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

                {formData.password && (
                  <>
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          backgroundColor: getPasswordStrengthColor(),
                        }}
                      ></div>
                    </div>
                    <div
                      className="password-strength-text"
                      style={{ color: getPasswordStrengthColor() }}
                    >
                      {getPasswordStrengthText()}
                    </div>

                    <div className="password-requirements">
                      {passwordRequirements.map((req, index) => (
                        <div
                          key={index}
                          className={`requirement ${req.met ? "met" : ""}`}
                        >
                          {req.met ? <Check size={14} /> : <X size={14} />}
                          <span>{req.text}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {shouldShowInlineError(fieldErrors.password) && (
                  <div className="error-text">{fieldErrors.password}</div>
                )}
              </div>

              <div className="input-group">
                <label
                  htmlFor="confirmPassword"
                  className={
                    focusedInput === "confirmPassword" ||
                    formData.confirmPassword
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
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleChange("confirmPassword", e.target.value)
                    }
                    onFocus={() => setFocusedInput("confirmPassword")}
                    onBlur={() => setFocusedInput(null)}
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

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => handleChange("agreeTerms", e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">
                  Tôi đồng ý với <a href="#">Điều khoản dịch vụ</a> và{" "}
                  <a href="#">Chính sách bảo mật</a>
                </span>
              </label>
              {shouldShowInlineError(fieldErrors.agreeTerms) && (
                <div className="error-text">{fieldErrors.agreeTerms}</div>
              )}

              <button
                type="submit"
                className={`register-button ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner"></span>
                ) : (
                  "Tạo tài khoản"
                )}
              </button>

              <div className="divider">
                <span>hoặc đăng ký với</span>
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
                  Đăng ký bằng Google
                </a>
              </div>

              <div className="login-link">
                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
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

        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7f9fc;
          position: relative;
          overflow: hidden;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 40px 20px;
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

        .floating-icon {
          position: absolute;
          color: rgba(79, 70, 229, 0.08);
          animation: floatBook 15s infinite ease-in-out;
        }

        .floating-icon-1 {
          top: 15%;
          right: 10%;
          animation-delay: -3s;
        }

        .floating-icon-2 {
          bottom: 20%;
          left: 15%;
          animation-delay: -8s;
        }

        @keyframes floatBook {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }

        .register-content {
          position: relative;
          z-index: 1;
          display: flex;
          width: 95%;
          max-width: 1300px;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.1);
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
          padding: 60px;
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
          max-width: 500px;
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .logo-icon {
          width: 56px;
          height: 56px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .brand-name {
          font-size: 42px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .tagline {
          font-size: 18px;
          opacity: 0.95;
          margin-bottom: 48px;
          font-weight: 300;
        }

        .benefits-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 24px;
          opacity: 0.95;
        }

        .benefits-list {
          margin-bottom: 48px;
        }

        .benefit-item {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          animation: fadeIn 0.6s ease-out backwards;
        }

        .benefit-item:nth-child(2) { animation-delay: 0.1s; }
        .benefit-item:nth-child(3) { animation-delay: 0.2s; }
        .benefit-item:nth-child(4) { animation-delay: 0.3s; }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .benefit-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .benefit-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .benefit-desc {
          font-size: 14px;
          opacity: 0.85;
          line-height: 1.5;
        }

        .testimonial {
          background: rgba(255, 255, 255, 0.1);
          padding: 24px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .quote-mark {
          font-size: 48px;
          line-height: 1;
          opacity: 0.3;
          margin-bottom: 8px;
        }

        .testimonial-text {
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 20px;
          opacity: 0.95;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .author-name {
          font-size: 14px;
          font-weight: 600;
        }

        .author-role {
          font-size: 13px;
          opacity: 0.8;
        }

        .form-section {
          flex: 1.2;
          padding: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          overflow-y: auto;
        }

        .form-container {
          width: 100%;
          max-width: 480px;
        }

        .form-header {
          margin-bottom: 32px;
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

        .register-form {
          animation: fadeInForm 0.6s ease-out 0.2s both;
        }

        @keyframes fadeInForm {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .role-selection {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .role-option {
          cursor: pointer;
        }

        .role-option input {
          display: none;
        }

        .role-card {
          padding: 20px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s;
          background: white;
        }

        .role-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .role-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .role-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .role-name {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .role-desc {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
        }

        .input-group {
          margin-bottom: 20px;
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
          padding: 14px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 15px;
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

        .password-strength-bar {
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }

        .password-strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .password-strength-text {
          font-size: 12px;
          margin-top: 4px;
          font-weight: 600;
        }

        .password-requirements {
          margin-top: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .requirement {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
          transition: color 0.3s;
        }

        .requirement.met {
          color: #10b981;
        }

        .requirement svg {
          flex-shrink: 0;
        }

        .error-text {
          color: #ef4444;
          font-size: 13px;
          margin-top: 6px;
          font-weight: 500;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          margin-bottom: 24px;
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
          flex-shrink: 0;
          margin-top: 2px;
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
          line-height: 1.5;
        }

        .checkbox-text a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
        }

        .checkbox-text a:hover {
          text-decoration: underline;
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

        .success-message {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
          text-align: center;
        }

        .register-button {
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

        .register-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .register-button:hover:not(:disabled)::before {
          left: 100%;
        }

        .register-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .register-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .register-button:disabled {
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

        .divider {
          text-align: center;
          margin: 24px 0;
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
          margin-bottom: 24px;
        }

        .social-button {
          flex: 1;
          padding: 14px;
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

        .login-link {
          text-align: center;
          font-size: 14px;
          color: #666;
        }

        .login-link a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.3s;
        }

        .login-link a:hover {
          opacity: 0.8;
        }

        @media (max-width: 1100px) {
          .brand-section {
            display: none;
          }

          .form-section {
            padding: 40px 24px;
          }
        }

        @media (max-width: 480px) {
          .register-container {
            padding: 20px 12px;
          }

          .form-section {
            padding: 32px 20px;
          }

          .form-header h2 {
            font-size: 26px;
          }

          .role-selection {
            grid-template-columns: 1fr;
          }

          .social-login {
            flex-direction: column;
          }

          .password-requirements {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterScreen;
