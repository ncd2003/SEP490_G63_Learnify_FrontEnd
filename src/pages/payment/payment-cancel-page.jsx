import { ArrowLeft, Home, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PATH_AUTH } from "@/routes/paths";
import "@/assets/css/pages/payment/paymentStatusPage.css";

const PaymentCancelPage = () => (
  <main className="payment-result-page payment-result-page--cancel">
    <section className="payment-result-card">
      <div className="payment-result-icon" aria-hidden="true">
        <XCircle size={34} />
      </div>

      <p className="payment-result-badge">PAYOS</p>
      <h1>Bạn đã hủy thanh toán</h1>
      <p className="payment-result-description">
        Không có khoản phí nào được trừ. Bạn có thể quay lại danh sách gói để
        thử lại khi sẵn sàng.
      </p>

      <div className="payment-result-actions">
        <Link className="payment-result-btn payment-result-btn--primary" to={PATH_AUTH.plans}>
          <ArrowLeft size={16} />
          Quay lại gói dịch vụ
        </Link>

        <Link className="payment-result-btn payment-result-btn--ghost" to={PATH_AUTH.home}>
          <Home size={16} />
          Về trang chủ
        </Link>
      </div>
    </section>
  </main>
);

export default PaymentCancelPage;
