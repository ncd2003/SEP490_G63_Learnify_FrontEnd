import { useCallback, useRef, useState } from "react";
import { paymentService } from "@/apis/payment.api";

const PAYMENT_STATUS = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  ERROR: "error",
});

const getCreatePaymentErrorMessage = (error) => {
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return "Không thể kết nối máy chủ thanh toán. Vui lòng thử lại.";
  }

  const responseMessage = error?.response?.data?.message;
  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Không thể tạo liên kết thanh toán. Vui lòng thử lại.";
};

const useCreatePayment = () => {
  const [status, setStatus] = useState(PAYMENT_STATUS.IDLE);
  const [error, setError] = useState("");
  const [lastPayload, setLastPayload] = useState(null);
  const inFlightRef = useRef(false);

  const createPayment = useCallback(async (payload) => {
    if (inFlightRef.current) {
      return { ok: false, blocked: true };
    }

    inFlightRef.current = true;
    setStatus(PAYMENT_STATUS.LOADING);
    setError("");
    setLastPayload(payload);

    try {
      const result = await paymentService.createPayment(payload);
      const checkoutUrl = result?.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error("Không nhận được checkoutUrl từ hệ thống thanh toán.");
      }

      window.location.assign(checkoutUrl);
      return { ok: true, checkoutUrl };
    } catch (err) {
      const message = getCreatePaymentErrorMessage(err);
      setStatus(PAYMENT_STATUS.ERROR);
      setError(message);
      return { ok: false, blocked: false, error: message };
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const retryCreatePayment = useCallback(async () => {
    if (!lastPayload) {
      const message = "Không có dữ liệu thanh toán để thử lại.";
      setStatus(PAYMENT_STATUS.ERROR);
      setError(message);
      return { ok: false, blocked: false, error: message };
    }

    return createPayment(lastPayload);
  }, [createPayment, lastPayload]);

  const resetState = useCallback(() => {
    setStatus(PAYMENT_STATUS.IDLE);
    setError("");
  }, []);

  return {
    status,
    error,
    isLoading: status === PAYMENT_STATUS.LOADING,
    hasError: status === PAYMENT_STATUS.ERROR,
    canRetry: Boolean(lastPayload),
    createPayment,
    retryCreatePayment,
    resetState,
  };
};

export default useCreatePayment;
