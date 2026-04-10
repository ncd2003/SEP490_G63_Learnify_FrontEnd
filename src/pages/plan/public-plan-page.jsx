import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Clock3,
  Sparkles,
} from "lucide-react";
import CenteredConfirmModal from "@/components/CenteredConfirmModal";
import Header from "@/components/Header";
import PaymentButton from "@/components/payment/PaymentButton";
import { subscriptionApi } from "@/apis/subscription.api";
import { useAuth } from "@/contexts/AuthContext";
import { planApi } from "@/apis/plan.api";
import { getPlanStatusLabel } from "@/schema/plan.schema";
import { formatCurrency } from "@/lib/utils";
import { PATH_AUTH } from "@/routes/paths";
import "@/assets/css/pages/plan/publicPlanPage.css";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["ACTIVE"]);

const isFreePlan = (plan) => {
  const price = Number(plan?.price);
  if (Number.isFinite(price)) {
    return price <= 0;
  }

  const normalizedName = String(plan?.name || "").toLowerCase();
  return normalizedName.includes("free");
};

const getLatestActiveSubscription = (subscriptions, userId) => {
  const normalizedUserId = Number(userId);
  const source = Array.isArray(subscriptions) ? subscriptions : [];

  if (source.length === 0) {
    return null;
  }

  let ownedSubscriptions = source;
  if (Number.isFinite(normalizedUserId) && normalizedUserId > 0) {
    const filtered = source.filter((subscription) => {
      const subscriptionUserId = Number(subscription?.user?.id ?? subscription?.userId);
      return Number.isFinite(subscriptionUserId) && subscriptionUserId === normalizedUserId;
    });

    if (filtered.length > 0) {
      ownedSubscriptions = filtered;
    }
  }

  const activeSubscriptions = ownedSubscriptions.filter((subscription) =>
    ACTIVE_SUBSCRIPTION_STATUSES.has(
      String(subscription?.subscriptionStatus || "").toUpperCase(),
    )
  );

  if (activeSubscriptions.length === 0) {
    return null;
  }

  return [...activeSubscriptions].sort((a, b) => {
    const bTime = Date.parse(b?.startAt || "") || 0;
    const aTime = Date.parse(a?.startAt || "") || 0;
    return bTime - aTime;
  })[0];
};

const DURATION_UNIT_LABELS = {
  HOUR: "giờ",
  DAY: "ngày",
  WEEK: "tuần",
  MONTH: "tháng",
  YEAR: "năm",
};

const PUBLIC_PLAN_NAV_ITEMS = [
  { key: "home", label: "Trang chủ", to: PATH_AUTH.home },
  { key: "plans", label: "Gói dịch vụ", to: PATH_AUTH.plans },
];

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "PUBLIC", label: getPlanStatusLabel("PUBLIC") },
  { value: "HIDE", label: getPlanStatusLabel("HIDE") },
];

const comparePlanByIdAsc = (firstPlan, secondPlan) => {
  const firstId = Number(firstPlan?.id);
  const secondId = Number(secondPlan?.id);

  const hasFirstId = Number.isFinite(firstId);
  const hasSecondId = Number.isFinite(secondId);

  if (hasFirstId && hasSecondId) {
    return firstId - secondId;
  }

  if (hasFirstId) {
    return -1;
  }

  if (hasSecondId) {
    return 1;
  }

  return 0;
};

const PublicPlanPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingCurrentSubscription, setLoadingCurrentSubscription] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    description: "",
  });
  const confirmResolverRef = useRef(null);

  useEffect(() => {
    const fetchPublicPlans = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await planApi.getPublicPlans();
        const result = Array.isArray(response?.result) ? response.result : [];
        setPlans(result);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Không thể tải danh sách gói dịch vụ.",
        );
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPlans();
  }, []);

  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredPlans = useMemo(() => {
    const source = Array.isArray(plans) ? plans : [];
    const getStatus = (plan) => String(plan?.planStatus || "").toUpperCase();

    const allowedFor = (filter) => {
      const f = String(filter || "").toUpperCase();
      if (f === "ALL" || f === "PUBLIC") return new Set(["PUBLIC", "ACTIVE"]);
      if (f === "HIDE") return new Set(["HIDE", "INACTIVE"]);
      return new Set([f]);
    };

    const allowed = allowedFor(statusFilter);

    return source.filter((plan) => allowed.has(getStatus(plan))).sort(comparePlanByIdAsc);
  }, [plans, statusFilter]);

  const normalizedUserId = Number(user?.id);

  const currentPaidPlan = useMemo(() => {
    const plan = currentSubscription?.plan;

    if (!plan || isFreePlan(plan)) {
      return null;
    }

    return plan;
  }, [currentSubscription]);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentSubscription = async () => {
      if (!isAuthenticated || !Number.isFinite(normalizedUserId) || normalizedUserId <= 0) {
        setCurrentSubscription(null);
        return;
      }

      setLoadingCurrentSubscription(true);
      try {
        const response = await subscriptionApi.getSubscriptions({
          page: 1,
          size: 50,
          sortBy: "createdAt",
          sortDirection: "DESC",
        });

        const content = Array.isArray(response?.result?.content)
          ? response.result.content
          : [];
        const latestActiveSubscription = getLatestActiveSubscription(content, normalizedUserId);

        if (isMounted) {
          setCurrentSubscription(latestActiveSubscription);
        }
      } catch {
        if (isMounted) {
          setCurrentSubscription(null);
        }
      } finally {
        if (isMounted) {
          setLoadingCurrentSubscription(false);
        }
      }
    };

    fetchCurrentSubscription();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, normalizedUserId]);

  useEffect(() => () => {
    if (typeof confirmResolverRef.current === "function") {
      confirmResolverRef.current(false);
      confirmResolverRef.current = null;
    }
  }, []);

  const handleNavigateRegister = (plan) => {
    navigate(PATH_AUTH.register, {
      state: {
        from: PATH_AUTH.plans,
        selectedPlanId: plan?.id,
        selectedPlanName: plan?.name,
      },
    });
  };

  const openConfirmModal = ({ title, description }) =>
    new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmModal({
        isOpen: true,
        title,
        description,
      });
    });

  const closeConfirmModal = (confirmed) => {
    setConfirmModal((prev) => ({
      ...prev,
      isOpen: false,
    }));

    if (typeof confirmResolverRef.current === "function") {
      confirmResolverRef.current(confirmed);
      confirmResolverRef.current = null;
    }
  };

  const handleBeforePayment = async (targetPlan) => {
    if (!isAuthenticated || !currentPaidPlan) {
      return true;
    }

    const currentPlanName = currentPaidPlan?.name || "gói hiện tại";
    const targetPlanName = targetPlan?.name || "gói mới";

    const currentPlanId = Number(currentPaidPlan?.id);
    const targetPlanId = Number(targetPlan?.id);
    const isSamePlan =
      Number.isFinite(currentPlanId)
      && Number.isFinite(targetPlanId)
      && currentPlanId === targetPlanId;

    if (isSamePlan) {
      return openConfirmModal({
        title: "Xác nhận gia hạn gói",
        description: `Bạn đang sở hữu gói ${currentPlanName}. Nếu tiếp tục thanh toán lại gói này, thời hạn sử dụng sẽ được gia hạn thêm tương ứng.`,
      });
    }

    return openConfirmModal({
      title: "Xác nhận chuyển gói dịch vụ",
      description: `Bạn đang sở hữu gói ${currentPlanName}. Khi đăng ký gói ${targetPlanName}, gói hiện tại sẽ kết thúc nhưng dữ liệu sẽ được giữ lại và được thay bằng gói mới. Bạn có muốn tiếp tục không?`,
    });
  };

  return (
    <>
      <Header navItems={PUBLIC_PLAN_NAV_ITEMS} activeNavKey="plans" />

      <div className="public-plan-page">
        <section className="plan-hero">
          <div>
            <p className="hero-tag">
              <Sparkles size={14} />
              Chọn gói phù hợp với bạn
            </p>
            <h1>Gói dịch vụ Learnify</h1>
            <p>
              Bắt đầu với gói phù hợp để mở khóa tính năng học tập, lưu trữ tài
              liệu và công cụ AI cho lớp học của bạn.
            </p>
          </div>
{/* 
          <button
            type="button"
            className="hero-cta"
            onClick={() =>
              navigate(isAuthenticated ? "/classrooms" : PATH_AUTH.register)
            }
          >
            {isAuthenticated ? "Vào lớp học" : "Đăng ký ngay"}
            <ArrowRight size={16} />
          </button> */}
        </section>

        <div className="plan-controls">
          <div className="plan-controls-inner">
            <label htmlFor="plan-status-select">Trạng thái:</label>
            <select
              id="plan-status-select"
              className="plan-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="plan-state">Đang tải danh sách gói...</div>
        ) : error ? (
          <div className="plan-state error">{error}</div>
        ) : filteredPlans.length === 0 ? (
          <div className="plan-state">Hiện chưa có gói dịch vụ khả dụng.</div>
        ) : (
          <section className="plan-grid">
            {filteredPlans.map((plan) => {
              const parsedPrice = Number(plan?.price);
              const normalizedPrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
              const isFreePlan = normalizedPrice <= 0;
              const planId = Number(plan?.id);

              return (
                <article className="plan-card" key={plan?.id || plan?.name}>
                  <div className="plan-card-top">
                    <div className="plan-name-wrap">
                      <BadgeCheck size={16} />
                      <h3>{plan?.name || "Gói"}</h3>
                    </div>
                    <span className="plan-status">{getPlanStatusLabel(plan?.planStatus)}</span>
                  </div>

                  {!isFreePlan && (
                    <p className="plan-price">
                      {formatCurrency(normalizedPrice)}
                      <span>
                        /{plan?.durationValue || 1} {DURATION_UNIT_LABELS[plan?.durationUnit] || "kỳ"}
                      </span>
                    </p>
                  )}

                  <p className="plan-description">
                    {plan?.description || "Gói dịch vụ phù hợp để bắt đầu sử dụng Learnify."}
                  </p>

                  {!isFreePlan && (
                    <div className="plan-meta">
                      <Clock3 size={14} />
                      <span>
                        Chu kỳ: {plan?.durationValue || 1} {DURATION_UNIT_LABELS[plan?.durationUnit] || "kỳ"}
                      </span>
                    </div>
                  )}

                  {!isFreePlan && (
                    !isAuthenticated ? (
                      <button
                        type="button"
                        className="plan-select-btn"
                        onClick={() => handleNavigateRegister(plan)}
                      >
                        Đăng ký gói
                      </button>
                    ) : (
                      <PaymentButton
                        userId={normalizedUserId}
                        planId={planId}
                        amount={normalizedPrice}
                        label="Thanh toán với PayOS"
                        className="plan-payment-btn"
                        disabled={loadingCurrentSubscription}
                        beforePay={() => handleBeforePayment(plan)}
                        showInvalidStateMessage
                      />
                    )
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>

      <CenteredConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText="Tiếp tục thanh toán"
        cancelText="Để sau"
        onConfirm={() => closeConfirmModal(true)}
        onClose={() => closeConfirmModal(false)}
      />
    </>
  );
};

export default PublicPlanPage;
