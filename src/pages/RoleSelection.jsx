import { useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const RoleSelection = () => {
  const navigate = useNavigate();
  const { updateUserRole } = useAuth();

  const [selectedRole, setSelectedRole] = useState(null);
  const [isHovered, setIsHovered] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    setError("");

    try {
      await updateUserRole(selectedRole);

      navigate("/home", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Không thể cập nhật vai trò. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="role-selection-container">
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

      <div className="role-content">
        {/* Logo */}
        <div className="logo-wrapper">
          <div className="logo-icon">
            <BookOpen size={28} strokeWidth={2.5} />
          </div>
          <span className="brand-name">Learnify</span>
        </div>

        {/* Heading */}
        <div className="heading-block">
          <h1 className="title">Bạn là ai?</h1>
          <p className="subtitle">
            Chọn vai trò phù hợp để bắt đầu hành trình của bạn
          </p>
        </div>

        {/* Error */}
        {error && <div className="error-banner">{error}</div>}

        {/* Role Cards */}
        <div className="cards-grid">
          {/* Student Card */}
          <button
            className={`role-card ${selectedRole === "ROLE_STUDENT" ? "selected" : ""} ${isHovered === "ROLE_STUDENT" ? "hovered" : ""}`}
            onClick={() => setSelectedRole("ROLE_STUDENT")}
            onMouseEnter={() => setIsHovered("ROLE_STUDENT")}
            onMouseLeave={() => setIsHovered(null)}
            aria-pressed={selectedRole === "ROLE_STUDENT"}
          >
            <div className="card-glow student-glow"></div>
            <div className="card-inner">
              <div className="icon-wrapper student-icon">
                <span className="role-emoji">🎓</span>
              </div>
              <div className="card-text">
                <h2 className="role-name">Học viên</h2>
                <p className="role-desc">
                  Tham gia các lớp học tương tác, hoàn thành bài tập và theo dõi tiến độ cá nhân hàng ngày
                </p>
              </div>
              <ul className="role-features">
                <li>
                  <span className="dot student-dot"></span>Tham gia lớp học tương tác
                </li>
                <li>
                  <span className="dot student-dot"></span>Làm bài tập & nhận phản hồi nhanh
                </li>
                <li>
                  <span className="dot student-dot"></span>Theo dõi kết quả học tập chi tiết
                </li>
              </ul>
              <div
                className={`check-circle ${selectedRole === "ROLE_STUDENT" ? "visible" : ""}`}
              >
                ✓
              </div>
            </div>
            <div
              className={`selected-bar student-bar ${selectedRole === "ROLE_STUDENT" ? "active" : ""}`}
            ></div>
          </button>

          {/* Teacher Card */}
          <button
            className={`role-card ${selectedRole === "ROLE_TEACHER" ? "selected" : ""} ${isHovered === "ROLE_TEACHER" ? "hovered" : ""}`}
            onClick={() => setSelectedRole("ROLE_TEACHER")}
            onMouseEnter={() => setIsHovered("ROLE_TEACHER")}
            onMouseLeave={() => setIsHovered(null)}
            aria-pressed={selectedRole === "ROLE_TEACHER"}
          >
            <div className="card-glow teacher-glow"></div>
            <div className="card-inner">
              <div className="icon-wrapper teacher-icon">
                <span className="role-emoji">👨‍🏫</span>
              </div>
              <div className="card-text">
                <h2 className="role-name">Giáo viên</h2>
                <p className="role-desc">
                  Xây dựng môi trường giáo dục số, quản lý lớp học và tối ưu quy trình giảng dạy hiện đại
                </p>
              </div>
              <ul className="role-features">
                <li>
                  <span className="dot teacher-dot"></span>Quản lý lớp học & tài liệu thông minh
                </li>
                <li>
                  <span className="dot teacher-dot"></span>Tạo bài tập & chấm điểm tự động
                </li>
                <li>
                  <span className="dot teacher-dot"></span>Báo cáo năng lực học sinh chi tiết
                </li>
              </ul>
              <div
                className={`check-circle ${selectedRole === "ROLE_TEACHER" ? "visible" : ""}`}
              >
                ✓
              </div>
            </div>
            <div
              className={`selected-bar teacher-bar ${selectedRole === "ROLE_TEACHER" ? "active" : ""}`}
            ></div>
          </button>
        </div>

        {/* Continue Button */}
        <button
          className={`continue-button ${selectedRole && !isLoading ? "enabled" : ""}`}
          onClick={handleContinue}
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? (
            <span className="btn-spinner"></span>
          ) : selectedRole ? (
            <>
              Tiếp tục với vai trò{" "}
              {selectedRole === "ROLE_STUDENT" ? "Học viên" : "Giáo viên"}
              <ArrowRight size={20} />
            </>
          ) : (
            "Vui lòng chọn một vai trò"
          )}
        </button>

        <p className="footer-note">
          Bạn có thể thay đổi vai trò sau trong cài đặt tài khoản
        </p>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .role-selection-container {
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
          animation: float 20s infinite ease-in-out;
        }
        .shape-1 { width: 400px; height: 400px; top: -100px; left: -100px; animation-delay: 0s; }
        .shape-2 { width: 300px; height: 300px; bottom: -80px; right: -80px; animation-delay: -7s; }
        .shape-3 { width: 250px; height: 250px; top: 50%; left: 20%; animation-delay: -14s; }
        @keyframes float {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          33% { transform: translate(30px,-30px) rotate(120deg); }
          66% { transform: translate(-20px,20px) rotate(240deg); }
        }
        .floating-icon {
          position: absolute;
          color: rgba(79, 70, 229, 0.08);
          animation: floatBook 15s infinite ease-in-out;
        }
        .floating-icon-1 { top: 15%; right: 10%; animation-delay: -3s; }
        .floating-icon-2 { bottom: 20%; left: 15%; animation-delay: -8s; }
        @keyframes floatBook {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }

        .role-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 760px;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: slideUp 0.7s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
        }
        .logo-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 6px 20px rgba(59,130,246,0.35);
        }
        .brand-name {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.5px;
        }

        .heading-block {
          text-align: center;
          margin-bottom: 32px;
        }
        .title {
          font-size: 38px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -1px;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          color: #666;
          font-weight: 400;
        }

        .error-banner {
          width: 100%;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          text-align: center;
          margin-bottom: 20px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
          margin-bottom: 28px;
        }

        .role-card {
          position: relative;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 20px;
          padding: 32px 28px;
          cursor: pointer;
          text-align: left;
          overflow: hidden;
          transition: border-color 0.3s, box-shadow 0.3s, transform 0.25s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        }
        .role-card:hover:not(.selected) {
          border-color: #93c5fd;
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(59,130,246,0.12);
        }
        .role-card.selected {
          border-color: #3b82f6;
          box-shadow: 0 12px 40px rgba(59,130,246,0.18);
          transform: translateY(-4px);
        }

        .card-glow {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
        }
        .student-glow { background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%); }
        .teacher-glow { background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%); }
        .role-card.selected .card-glow,
        .role-card:hover .card-glow { opacity: 1; }

        .card-inner { position: relative; z-index: 1; }

        .icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          transition: transform 0.3s;
        }
        .role-card:hover .icon-wrapper,
        .role-card.selected .icon-wrapper { transform: scale(1.08); }
        .student-icon { background: #eff6ff; }
        .teacher-icon { background: #ecfdf5; }
        .role-emoji { font-size: 36px; line-height: 1; }

        .card-text { margin-bottom: 20px; }
        .role-name {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .role-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.6;
        }

        .role-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .role-features li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #374151;
          font-weight: 500;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .student-dot { background: #3b82f6; }
        .teacher-dot { background: #10b981; }

        .check-circle {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #3b82f6, #1e3a8a);
          border-radius: 50%;
          color: white;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.5);
          transition: opacity 0.3s, transform 0.3s;
          font-weight: 700;
        }
        .check-circle.visible {
          opacity: 1;
          transform: scale(1);
        }

        .selected-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 3px;
          border-radius: 0 0 20px 20px;
          transition: width 0.4s ease;
        }
        .student-bar { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .teacher-bar { background: linear-gradient(90deg, #10b981, #34d399); }
        .selected-bar.active { width: 100%; }

        .continue-button {
          width: 100%;
          max-width: 420px;
          padding: 16px 28px;
          background: #e5e7eb;
          color: #9ca3af;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: not-allowed;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.35s;
          letter-spacing: 0.1px;
        }
        .continue-button.enabled {
          background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
          color: white;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(59,130,246,0.3);
        }
        .continue-button.enabled:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(59,130,246,0.4);
        }
        .continue-button.enabled:active { transform: translateY(0); }

        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer-note {
          margin-top: 16px;
          font-size: 13px;
          color: #9ca3af;
          text-align: center;
        }

        @media (max-width: 600px) {
          .cards-grid { grid-template-columns: 1fr; }
          .title { font-size: 28px; }
          .role-card { padding: 24px 20px; }
          .role-name { font-size: 19px; }
        }
      `}</style>
    </div>
  );
};

export default RoleSelection;
