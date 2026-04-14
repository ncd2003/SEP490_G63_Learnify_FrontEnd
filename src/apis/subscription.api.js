import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

/** @typedef {Object} TSubscription
 * @property {number} id
 * @property {Object} plan
 * @property {Object} user
 * @property {string} subscriptionStatus
 * @property {string} startAt
 * @property {string|null} endAt
 */

/**
 * @typedef {Object} SubscriptionPagingResult
 * @property {TSubscription[]} content
 * @property {number} pageNumber
 * @property {number} pageSize
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {boolean} last
 */

/** @typedef {import("@/schema/type.schema").ApiResponse<SubscriptionPagingResult>} SubscriptionPagingResponse */
/** @typedef {import("@/schema/type.schema").ApiResponse<void>} SubscriptionMutationResponse */

const BASE = API_SUFFIX.SUBSCRIPTION;

/* ─── Subscription Read ──────────────────────────────────────────────────── */

/**
 * Get all subscriptions with pagination and filtering
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.size=10]
 * @param {string} [params.sortBy="createdAt"]
 * @param {string} [params.sortDirection="DESC"]
 * @returns {Promise<import("axios").AxiosResponse<SubscriptionPagingResponse>>}
 */
const getSubscriptions = (params = {}) => {
  const defaultParams = {
    page: 1,
    size: 10,
    sortBy: "createdAt",
    sortDirection: "DESC",
  };
  const queryParams = { ...defaultParams, ...params };
  return apiRequest.get(BASE, { params: queryParams });
};

/* ─── Subscription Mutations ────────────────────────────────────────────── */

/**
 * PUT /api/subscriptions
 * Backend expects a raw numeric planId in the JSON body (e.g. 123)
 * @param {number|string} planId
 * @returns {Promise<import("axios").AxiosResponse<import("@/schema/type.schema").ApiResponse<object>>>}
 */
const createSubscription = (planId) => {
  const safePlanId = Number(planId);
  if (!Number.isFinite(safePlanId) || safePlanId <= 0) {
    throw new Error("planId không hợp lệ.");
  }

  return apiRequest.put(BASE, JSON.stringify(safePlanId), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/* ─── Export ─────────────────────────────────────────────────────────────── */
export const subscriptionApi = {
  getSubscriptions,
  createSubscription,
};
