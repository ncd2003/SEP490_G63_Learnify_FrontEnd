import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  CreatePlanSchema,
  UpdatePlanSchema,
} from "@/schema/plan.schema";

/** @typedef {import("@/schema/plan.schema").TPlan} TPlan */
/** @typedef {import("@/schema/type.schema").ApiResponse<TPlan[]>} PlanListResponse */
/** @typedef {import("@/schema/type.schema").ApiResponse<TPlan>} PlanResponse */

const BASE = API_SUFFIX.PLAN;

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
 * @returns {Promise<import("axios").AxiosResponse<PlanListResponse>>}
 */
const getPlans = () => apiRequest.get(BASE);

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
  deletePlan,
};
