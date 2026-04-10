import { useEffect } from "react";
import { CheckCircle2, LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { paymentService } from "@/apis/payment.api";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_AUTH } from "@/routes/paths";
import "@/assets/css/pages/payment/paymentStatusPage.css";

const LOGOUT_TIMEOUT_MS = 2500;
const STATUS_POLL_INTERVAL_MS = 1500;
const MAX_STATUS_POLL_ATTEMPTS = 8;
const PAID_STATUS = "PAID";
const FAILED_STATUS = "FAILED";

const wait = (durationMs) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

const clearClientAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  sessionStorage.clear();
};

const PaymentSuccessPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isUnmounted = false;

    const query = new URLSearchParams(location.search);
    const orderCode = query.get("orderCode");

    const redirectToPaymentPage = () => {
      if (!isUnmounted) {
        navigate(PATH_AUTH.plans, { replace: true });
      }
    };

    const resolvePaymentStatus = async (targetOrderCode) => {
      for (let attempt = 0; attempt < MAX_STATUS_POLL_ATTEMPTS; attempt += 1) {
        if (isUnmounted) {
          return null;
        }

        try {
          const status = await paymentService.getPaymentStatus(targetOrderCode);

          if (status === PAID_STATUS || status === FAILED_STATUS) {
            return status;
          }
        } catch {
          // Ignore transient errors while webhook status is being finalized.
        }

        if (attempt < MAX_STATUS_POLL_ATTEMPTS - 1) {
          await wait(STATUS_POLL_INTERVAL_MS);
        }
      }

      return null;
    };

    const handlePaymentSuccess = async () => {
      if (!orderCode) {
        redirectToPaymentPage();
        return;
      }

      const status = await resolvePaymentStatus(orderCode);

      if (isUnmounted) {
        return;
      }

      if (status !== PAID_STATUS) {
        redirectToPaymentPage();
        return;
      }

      try {
        await Promise.race([
          logout(),
          new Promise((resolve) => {
            window.setTimeout(resolve, LOGOUT_TIMEOUT_MS);
          }),
        ]);
      } finally {
        clearClientAuthData();
      }

      if (!isUnmounted) {
        window.location.replace(PATH_AUTH.login);
      }
    };

    handlePaymentSuccess();

    return () => {
      isUnmounted = true;
    };
  }, [location.search, logout, navigate]);

  return (
    <main className="payment-result-page payment-result-page--success">
      <section className="payment-result-card">
        <div className="payment-result-icon" aria-hidden="true">
          <CheckCircle2 size={34} />
        </div>

        <p className="payment-result-badge">PAYOS</p>
        <h1>Thanh toán thành công</h1>
        <p className="payment-result-description">
          Hệ thống đang xác nhận giao dịch với PayOS. Khi thanh toán được ghi
          nhận thành công, bạn sẽ được chuyển về trang đăng nhập.
        </p>

        <div className="payment-result-actions">
          <Link className="payment-result-btn payment-result-btn--primary" to={PATH_AUTH.login}>
            <LogIn size={16} />
            Đăng nhập ngay
          </Link>
        </div>
      </section>
    </main>
  );
};

export default PaymentSuccessPage;
