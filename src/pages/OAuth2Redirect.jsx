import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BookOpen } from "lucide-react";

const OAuth2Redirect = () => {
  const navigate = useNavigate();
  const { handleOAuth2Login } = useAuth();
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const hasProcessed = useRef(false); // Prevent double execution

  useEffect(() => {
    // Prevent double execution (React StrictMode in dev)
    if (hasProcessed.current) {
      console.log("[OAuth2Redirect] Already processed, skipping");
      return;
    }

    const handleRedirect = async () => {
      try {
        hasProcessed.current = true;
        console.log("[OAuth2Redirect] Starting redirect handling");

        // Lấy token từ URL params
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const error = params.get("error");

        console.log("[OAuth2Redirect] Token present:", !!token);
        console.log("[OAuth2Redirect] Error present:", !!error);

        if (error) {
          const decodedError = decodeURIComponent(error);
          console.error("[OAuth2Redirect] OAuth2 Error:", decodedError);
          setErrorMessage(decodedError);
          setStatus("error");
          setTimeout(() => {
            navigate("/login");
          }, 5000);
          return;
        }

        if (token) {
          console.log("[OAuth2Redirect] Processing OAuth2 login");

          // Đợi handleOAuth2Login hoàn tất
          const result = await handleOAuth2Login(token);

          if (result.success) {
            console.log(
              "[OAuth2Redirect] Login completed, redirecting based on role",
            );

            // Get user role and redirect accordingly
            const userRole = result.user?.role?.toUpperCase();

            // Đợi một chút để đảm bảo state được update
            setTimeout(() => {
              if (userRole === "ROLE_TEACHER") {
                navigate("/teacher/classrooms", { replace: true });
              } else if (userRole === "ROLE_STUDENT") {
                navigate("/student/classrooms", { replace: true });
              } else {
                // New Google user — no role set yet, go to role selection
                navigate("/select-role", { replace: true });
              }
            }, 200);
          }
        } else {
          console.error("[OAuth2Redirect] No token and no error in redirect");
          setErrorMessage("Không nhận được token từ server");
          setStatus("error");
          setTimeout(() => {
            navigate("/login");
          }, 5000);
        }
      } catch (err) {
        console.error("[OAuth2Redirect] Error:", err);
        setErrorMessage(err.message || "Đã xảy ra lỗi không xác định");
        setStatus("error");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    };

    handleRedirect();
  }, [navigate, handleOAuth2Login]);

  return (
    <div className="oauth2-redirect-container">
      <div className="oauth2-content">
        {status === "processing" && (
          <>
            <div className="spinner-large"></div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="error-icon">✕</div>
            <p className="status-text error">Đăng nhập thất bại!</p>
            {errorMessage && (
              <div className="error-detail">
                <p className="error-message">{errorMessage}</p>
              </div>
            )}
            <p className="sub-text">Đang chuyển về trang đăng nhập...</p>
          </>
        )}
      </div>

      <style>{`
        .oauth2-redirect-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .oauth2-content {
          text-align: center;
          color: white;
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .spinner-large {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          margin: 0 auto;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .success-icon,
        .error-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 48px;
          font-weight: bold;
          animation: scaleIn 0.5s ease-out;
        }

        .success-icon {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 3px solid #10b981;
        }


        .status-text.success {
          color: #10b981;
        }

        .status-text.error {
          color: #ef4444;
        }

        .error-detail {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .error-message {
          font-size: 14px;
          line-height: 1.6;
          color: #fff;
          word-break: break-word;
          opacity: 0.95;
        }

        .sub-text {
          font-size: 16px;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default OAuth2Redirect;
