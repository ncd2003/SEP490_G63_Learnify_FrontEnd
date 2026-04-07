import { X, Calendar, Mail, User, Zap, Package, CheckCircle } from "lucide-react";
import { getBenefitCodeLabel, getBenefitTypeLabel } from "@/schema/benefit.schema";
import { getPlanStatusLabel } from "@/schema/plan.schema";
import { formatCurrency } from "@/lib/utils";

const SUBSCRIPTION_STATUS_LABELS = {
  ACTIVE: "Đang hoạt động",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const getSubscriptionStatusLabel = (status) => {
  const normalizedStatus = String(status || "").toUpperCase();
  return SUBSCRIPTION_STATUS_LABELS[normalizedStatus] || status || "N/A";
};

const DURATION_UNIT_LABELS = {
  HOUR: "giờ",
  DAY: "ngày",
  WEEK: "tuần",
  MONTH: "tháng",
  YEAR: "năm",
};

const SubscriptionDetailModal = ({ subscription, onClose }) => {
  if (!subscription) return null;

  const { plan, user, subscriptionStatus, startAt, endAt } = subscription;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getDurationText = () => {
    if (!plan) return "N/A";

    const durationValue = Number(plan.durationValue);
    const durationUnit = String(plan.durationUnit || "").toUpperCase();

    if (!durationUnit || !Number.isFinite(durationValue) || durationValue <= 0) {
      return "Không giới hạn";
    }

    return `${durationValue} ${DURATION_UNIT_LABELS[durationUnit] || durationUnit}`;
  };

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="subscription-modal-header">
          <h2>Chi tiết Subscription</h2>
          <button className="subscription-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="subscription-modal-body">
          {/* User Info */}
          <div className="subscription-section">
            <h3 className="subscription-section-title">
              <User size={16} />
              Thông tin người dùng
            </h3>
            <div className="subscription-info-grid">
              <div className="subscription-info-item">
                <span className="label">Tên người dùng</span>
                <span className="value">{user?.fullName || "N/A"}</span>
              </div>
              <div className="subscription-info-item">
                <span className="label">Email</span>
                <span className="value">{user?.email || "N/A"}</span>
              </div>
              <div className="subscription-info-item">
                <span className="label">Vai trò</span>
                <span className="value">{user?.role || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Plan Info */}
          <div className="subscription-section">
            <h3 className="subscription-section-title">
              <Package size={16} />
              Thông tin gói
            </h3>
            <div className="subscription-info-grid">
              <div className="subscription-info-item">
                <span className="label">Tên gói</span>
                <span className="value">{plan?.name || "N/A"}</span>
              </div>
              <div className="subscription-info-item">
                <span className="label">Giá</span>
                <span className="value">{formatCurrency(Number(plan?.price ?? 0))}</span>
              </div>
              <div className="subscription-info-item">
                <span className="label">Thời hạn</span>
                <span className="value">{getDurationText()}</span>
              </div>
              <div className="subscription-info-item">
                <span className="label">Trạng thái gói</span>
                <span className={`value status ${plan?.planStatus?.toLowerCase() || ""}`}>
                  {getPlanStatusLabel(plan?.planStatus)}
                </span>
              </div>
            </div>
            {plan?.description && (
              <div className="subscription-description">
                <span className="label">Mô tả</span>
                <p>{plan.description}</p>
              </div>
            )}
          </div>

          {/* Subscription Status */}
          <div className="subscription-section">
            <h3 className="subscription-section-title">
              <Zap size={16} />
              Trạng thái đăng ký
            </h3>
            <div className="subscription-info-grid">
              <div className="subscription-info-item">
                <span className="label">Trạng thái</span>
                <span className={`value status ${subscriptionStatus?.toLowerCase() || ""}`}>
                  {getSubscriptionStatusLabel(subscriptionStatus)}
                </span>
              </div>
              <div className="subscription-info-item">
                <span className="label">Ngày bắt đầu</span>
                <span className="value">
                  <Calendar size={14} />
                  {formatDate(startAt)}
                </span>
              </div>
              <div className="subscription-info-item">
                <span className="label">Ngày kết thúc</span>
                <span className="value">
                  <Calendar size={14} />
                  {endAt ? formatDate(endAt) : "Không giới hạn"}
                </span>
              </div>
            </div>
          </div>

          {/* Benefits */}
          {plan?.benefits && plan.benefits.length > 0 && (
            <div className="subscription-section">
              <h3 className="subscription-section-title">
                <CheckCircle size={16} />
                Lợi ích
              </h3>
              <div className="subscription-benefits">
                {plan.benefits.map((benefit, idx) => (
                  <div key={idx} className="subscription-benefit-item">
                    <span className="benefit-name">
                      {getBenefitCodeLabel(benefit.benefit?.code)} - {getBenefitTypeLabel(benefit.type)}
                    </span>
                    <span className="benefit-value">{benefit.limitValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="subscription-modal-footer">
          <button className="subscription-modal-btn-close" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetailModal;
