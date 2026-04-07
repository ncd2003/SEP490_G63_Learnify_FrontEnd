import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  CreateBenefitSchema,
  UpdateBenefitSchema,
} from "@/schema/benefit.schema";

/**
 * @typedef {import("@/schema/benefit.schema").TBenefit} TBenefit
 */

/**
 * @typedef {import("@/schema/benefit.schema").TCreateBenefit} TBenefitRequest
 */

/** @typedef {import("@/schema/type.schema").ApiResponse<TBenefit[]>} BenefitListResponse */
/** @typedef {import("@/schema/type.schema").ApiResponse<TBenefit>} BenefitResponse */

const BASE = API_SUFFIX.BENEFIT;

/**
 * @param {number|string} id
 * @returns {number}
 */
const normalizeBenefitId = (id) => {
  const parsed = Number(id);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("benefitId không hợp lệ.");
  }
  return parsed;
};

/* ─── Benefit CRUD ───────────────────────────────────────────────────────── */

/**
 * GET /api/benefits
 * @returns {Promise<import("axios").AxiosResponse<BenefitListResponse>>}
 */
const getBenefits = () => apiRequest.get(BASE);

/**
 * POST /api/benefits
 * @param {TBenefitRequest} data
 * @returns {Promise<import("axios").AxiosResponse<BenefitResponse>>}
 */
const createBenefit = (data) => {
  const parsed = CreateBenefitSchema.parse(data);
  return apiRequest.post(BASE, parsed);
};

/**
 * PUT /api/benefits/{id}
 * @param {number|string} id
 * @param {import("@/schema/benefit.schema").TUpdateBenefit} data
 * @returns {Promise<import("axios").AxiosResponse<BenefitResponse>>}
 */
const updateBenefit = (id, data) => {
  const safeId = normalizeBenefitId(id);
  const parsed = UpdateBenefitSchema.parse(data);
  return apiRequest.put(`${BASE}/${safeId}`, parsed);
};

/**
 * DELETE /api/benefits/{id}
 * @param {number|string} id
 * @returns {Promise<import("axios").AxiosResponse<import("@/schema/type.schema").ApiResponse<void>>}
 */
const deleteBenefit = (id) => {
  const safeId = normalizeBenefitId(id);
  return apiRequest.delete(`${BASE}/${safeId}`);
};

/* ─── Export ─────────────────────────────────────────────────────────────── */
export const benefitApi = {
  getBenefits,
  createBenefit,
  updateBenefit,
  deleteBenefit,
};
