import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  CreatePlanSchema,
  PlanStatusSchema,
  UpdatePlanSchema,
} from "@/schema/plan.schema";

/** @typedef {import("@/schema/plan.schema").TPlan} TPlan */
/** @typedef {import("@/schema/type.schema").ApiResponse<TPlan[]>} PlanListResponse */
/**
 * @typedef {Object} PlanPagingResult
 * @property {TPlan[]} content
 * @property {number} pageNumber
 * @property {number} pageSize
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {boolean} last
 */
/** @typedef {import("@/schema/type.schema").ApiResponse<PlanPagingResult>} PlanPagingResponse */
/** @typedef {import("@/schema/type.schema").ApiResponse<TPlan>} PlanResponse */

const BASE = API_SUFFIX.PLAN;
const BYTES_PER_GB = 1024 * 1024 * 1024;

const normalizeStorageLimitToGb = (limitValue) => {
  const numericLimit = Number(limitValue);
  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    return 0;
  }

  const gbValue = numericLimit / BYTES_PER_GB;
  return Number.isInteger(gbValue) ? gbValue : Number(gbValue.toFixed(2));
};

const normalizePlanStorageBenefitsToGb = (plan) => {
  if (!plan || typeof plan !== "object") {
    return plan;
  }

  const normalizedBenefits = Array.isArray(plan.benefits)
    ? plan.benefits.map((benefitItem) => {
      const benefitCode = String(benefitItem?.benefit?.code || "").toUpperCase();

      if (benefitCode !== "STORAGE") {
        return benefitItem;
      }

      return {
        ...benefitItem,
        limitValue: normalizeStorageLimitToGb(benefitItem?.limitValue),
      };
    })
    : [];

  return {
    ...plan,
    benefits: normalizedBenefits,
  };
};

/**
 * @param {number|string} id
 * @returns {number}
 */
const normalizePlanId = (id) => {
  const parsed = Number(id);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("planId không hợp lệ.");
  }
  return parsed;
};

/* ─── Plan CRUD ──────────────────────────────────────────────────────────── */

/**
 * GET /api/plans
 * @param {{ page?: number, size?: number }} [params]
 * @returns {Promise<import("axios").AxiosResponse<PlanPagingResponse>>}
 */
const getPlans = async (params = {}) => {
  const response = await apiRequest.get(BASE, { params });

  if (!Array.isArray(response?.result?.content)) {
    return response;
  }

  return {
    ...response,
    result: {
      ...response.result,
      content: response.result.content.map((plan) => normalizePlanStorageBenefitsToGb(plan)),
    },
  };
};

/**
 * GET /api/plans/public
 * @returns {Promise<import("axios").AxiosResponse<PlanListResponse>>}
 */
const getPublicPlans = () => apiRequest.get(`${BASE}/public`);

/**
 * POST /api/plans
 * @param {import("@/schema/plan.schema").TCreatePlan} data
 * @returns {Promise<import("axios").AxiosResponse<PlanResponse>>}
 */
const createPlan = (data) => {
  const parsed = CreatePlanSchema.parse(data);
  return apiRequest.post(BASE, parsed);
};

/**
 * PUT /api/plans/{id}
 * @param {number|string} id
 * @param {import("@/schema/plan.schema").TUpdatePlan} data
 * @returns {Promise<import("axios").AxiosResponse<PlanResponse>>}
 */
const updatePlan = (id, data) => {
  const safeId = normalizePlanId(id);
  const parsed = UpdatePlanSchema.parse(data);
  return apiRequest.put(`${BASE}/${safeId}`, parsed);
};

/**
 * PATCH /api/plans/{id}
 * @param {number|string} id
 * @param {import("@/schema/plan.schema").TPlan["planStatus"]} planStatus
 * @returns {Promise<import("axios").AxiosResponse<PlanResponse>>}
 */
const updatePlanStatus = (id, planStatus) => {
  const safeId = normalizePlanId(id);
  const parsedStatus = PlanStatusSchema.parse(planStatus);

  // Backend expects enum value in raw JSON body (e.g. "PUBLIC").
  return apiRequest.patch(`${BASE}/${safeId}`, JSON.stringify(parsedStatus), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * DELETE /api/plans/{id}
 * @param {number|string} id
 * @returns {Promise<import("axios").AxiosResponse<import("@/schema/type.schema").ApiResponse<void>>}
 */
const deletePlan = (id) => {
  const safeId = normalizePlanId(id);
  return apiRequest.delete(`${BASE}/${safeId}`);
};

/* ─── Export ─────────────────────────────────────────────────────────────── */
export const planApi = {
  getPlans,
  getPublicPlans,
  createPlan,
  updatePlan,
  updatePlanStatus,
  deletePlan,
};
