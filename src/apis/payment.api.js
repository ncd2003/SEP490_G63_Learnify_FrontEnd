import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  CreatePaymentRequestSchema,
  CreatePaymentResultSchema,
} from "@/schema/payment.schema";

const BASE = API_SUFFIX.PAYMENT;
const CREATE_PAYMENT_PATH = `${BASE}/create`;

const normalizeOrderCode = (orderCode) => {
  const value = String(orderCode ?? "").trim();

  if (!/^\d+$/.test(value)) {
    throw new Error("Mã đơn thanh toán không hợp lệ.");
  }

  return value;
};

const normalizePaymentStatus = (payload) => {
  const status = typeof payload === "string" ? payload.trim().toUpperCase() : "";

  if (!status) {
    throw new Error("Phản hồi trạng thái thanh toán không hợp lệ.");
  }

  return status;
};

const normalizeCreatePaymentPayload = (payload) =>
  CreatePaymentRequestSchema.parse({
    userId: Number(payload?.userId),
    planId: Number(payload?.planId),
    amount: Number(payload?.amount),
  });

/**
 * POST /api/payments/create
 * @param {import("@/schema/payment.schema").TCreatePaymentRequest} payload
 * @returns {Promise<import("@/schema/payment.schema").TCreatePaymentResult>}
 */
const createPayment = async (payload) => {
  const safePayload = normalizeCreatePaymentPayload(payload);
  const response = await apiRequest.post(CREATE_PAYMENT_PATH, safePayload);

  const resultCandidate = response?.result ?? response;
  const parsedResult = CreatePaymentResultSchema.safeParse(resultCandidate);

  if (!parsedResult.success) {
    throw new Error("Phản hồi thanh toán không hợp lệ, thiếu URL thanh toán.");
  }

  const checkoutUrl =
    typeof parsedResult.data === "string"
      ? parsedResult.data
      : parsedResult.data?.checkoutUrl;

  if (!checkoutUrl) {
    throw new Error("Không nhận được URL thanh toán từ hệ thống.");
  }

  return { checkoutUrl };
};

/**
 * GET /api/payments/{orderCode}
 * @param {string | number} orderCode
 * @returns {Promise<string>}
 */
const getPaymentStatus = async (orderCode) => {
  const safeOrderCode = normalizeOrderCode(orderCode);
  const response = await apiRequest.get(`${BASE}/${safeOrderCode}`);
  const resultCandidate = response?.result ?? response;
  return normalizePaymentStatus(resultCandidate);
};

export const paymentService = {
  createPayment,
  getPaymentStatus,
};
