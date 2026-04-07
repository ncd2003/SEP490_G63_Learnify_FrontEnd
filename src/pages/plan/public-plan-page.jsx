import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BadgeCheck,
  Clock3,
  Sparkles,
} from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { planApi } from "@/apis/plan.api";
import { subscriptionApi } from "@/apis/subscription.api";
import { getPlanStatusLabel } from "@/schema/plan.schema";
import { formatCurrency } from "@/lib/utils";
import { PATH_AUTH } from "@/routes/paths";
import "@/assets/css/pages/plan/publicPlanPage.css";

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

const PublicPlanPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);

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

  const activePlans = useMemo(
    () => plans.filter((plan) => {
      const normalizedStatus = String(plan?.planStatus || "").toUpperCase();
      return normalizedStatus === "PUBLIC" || normalizedStatus === "ACTIVE";
    }),
    [plans],
  );

  const handleSelectPlan = async (plan) => {
    if (!isAuthenticated) {
      navigate(PATH_AUTH.register, {
        state: {
          from: PATH_AUTH.plans,
          selectedPlanId: plan?.id,
          selectedPlanName: plan?.name,
        },
      });
      return;
    }

    const planId = Number(plan?.id);
    if (!Number.isFinite(planId) || planId <= 0) {
      toast.error("Không thể đăng ký gói do planId không hợp lệ.");
      return;
    }

    setSubscribingPlanId(planId);
    try {
      await subscriptionApi.createSubscription(planId);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể đăng ký gói. Vui lòng thử lại.");
      setSubscribingPlanId(null);
      return;
    }

    navigate("/classrooms", {
      state: {
        selectedPlanId: planId,
        selectedPlanName: plan?.name,
      },
    });

    setSubscribingPlanId(null);
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

        {loading ? (
          <div className="plan-state">Đang tải danh sách gói...</div>
        ) : error ? (
          <div className="plan-state error">{error}</div>
        ) : activePlans.length === 0 ? (
          <div className="plan-state">Hiện chưa có gói dịch vụ khả dụng.</div>
        ) : (
          <section className="plan-grid">
            {activePlans.map((plan) => {
              const parsedPrice = Number(plan?.price);
              const normalizedPrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
              const isFreePlan = normalizedPrice <= 0;
              const planId = Number(plan?.id);
              const isSubscribingThisPlan = subscribingPlanId === planId;

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
                    <button
                      type="button"
                      className="plan-select-btn"
                      onClick={() => handleSelectPlan(plan)}
                      disabled={subscribingPlanId !== null}
                    >
                      {isSubscribingThisPlan
                        ? "Đang xử lý..."
                        : isAuthenticated
                          ? "Chọn gói này"
                          : "Đăng ký gói"}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </>
  );
};

export default PublicPlanPage;
