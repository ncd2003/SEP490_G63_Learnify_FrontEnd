import { CreditCard, Loader2, RotateCcw } from "lucide-react";
import useCreatePayment from "@/hooks/use-create-payment";
import "@/assets/css/components/paymentButton.css";

const isValidPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
};

const PaymentButton = ({
  userId,
  planId,
  amount,
  label = "Thanh toán với PayOS",
  className = "",
  disabled = false,
  showInvalidStateMessage = false,
  beforePay,
}) => {
  const {
    error,
    hasError,
    isLoading,
    canRetry,
    createPayment,
    retryCreatePayment,
  } = useCreatePayment();

  const isPayloadValid =
    isValidPositiveInteger(userId) &&
    isValidPositiveInteger(planId) &&
    isValidPositiveInteger(amount);

  const isDisabled = disabled || isLoading || !isPayloadValid;

  const buttonStateClass = hasError
    ? "payment-btn--error"
    : isLoading
      ? "payment-btn--loading"
      : "payment-btn--idle";

  const combinedClassName = ["payment-btn", buttonStateClass, className]
    .filter(Boolean)
    .join(" ");

  const handlePayment = async () => {
    if (isDisabled) return;

    if (typeof beforePay === "function") {
      const shouldContinue = await beforePay({
        userId: Number(userId),
        planId: Number(planId),
        amount: Number(amount),
      });

      if (!shouldContinue) {
        return;
      }
    }

    if (hasError && canRetry) {
      await retryCreatePayment();
      return;
    }

    await createPayment({
      userId: Number(userId),
      planId: Number(planId),
      amount: Number(amount),
    });
  };

  const getButtonLabel = () => {
    if (isLoading) return "Đang chuyển sang PayOS...";
    if (hasError) return "Thử lại thanh toán";
    return label;
  };

  const Icon = isLoading ? Loader2 : hasError ? RotateCcw : CreditCard;

  return (
    <div className="payment-btn-wrap">
      <button
        type="button"
        className={combinedClassName}
        onClick={handlePayment}
        disabled={isDisabled}
      >
        <span className="payment-btn__content">
          <Icon
            size={16}
            className={isLoading ? "payment-btn__icon-spin" : ""}
            aria-hidden="true"
          />
          <span>{getButtonLabel()}</span>
        </span>
      </button>

      {hasError && <p className="payment-btn__message">{error}</p>}

      {!hasError && showInvalidStateMessage && !isPayloadValid && (
        <p className="payment-btn__message">
          Thông tin thanh toán không hợp lệ, vui lòng tải lại trang.
        </p>
      )}
    </div>
  );
};

export default PaymentButton;
