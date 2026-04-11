import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis/util.api";

const ASSIGNMENT_BASE = API_SUFFIX.ASSIGNMENT;
const DRAFT_SESSION_BASE = API_SUFFIX.DRAFT_SESSION;

const DEFAULT_ASSIGNMENT_LIST_PARAMS = {
  page: 1,
  size: 10,
};

const normalizeId = (value, label = "id") => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} không hợp lệ.`);
  }
  return parsed;
};

const normalizeOptionalId = (value, label = "id") => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return normalizeId(value, label);
};

const normalizeDraftScope = (scope = {}) => {
  const assignmentId = normalizeOptionalId(scope?.assignmentId, "assignmentId");
  const bankId = normalizeOptionalId(scope?.bankId, "bankId");

  return {
    assignmentId,
    bankId,
  };
};

/**
 * @param {{
 *   title: string,
 *   description?: string,
 *   category: string,
 *   format: string,
 *   status: string,
 *   totalScore: number,
 *   setting?: {
 *     password?: string,
 *     durationMinutes?: number,
 *     startTime?: string | null,
 *     deadline?: string | null,
 *     allowLateSubmission?: boolean,
 *     resultVisibility?: string | null,
 *     resultReleaseTime?: string | null,
 *     submissionFormats?: string[],
 *     shuffleQuestions?: boolean,
 *     limitTabs?: number | null,
 *     requireFullScreen?: boolean,
 *   },
 *   sections?: Array<{
 *     id?: number,
 *     title: string,
 *     sectionType: string,
 *     questions?: Array<{
 *       id?: number,
 *       questionId: number,
 *       points: number,
 *     }>,
 *   }>,
 * }} payload
 */
const createAssignment = (payload) => apiRequest.post(ASSIGNMENT_BASE, payload);

const getAssignments = (params = {}) => {
  const normalized = {
    ...DEFAULT_ASSIGNMENT_LIST_PARAMS,
    ...params,
  };

  if (normalized.keyword !== undefined) {
    const trimmed = String(normalized.keyword).trim();
    normalized.keyword = trimmed || undefined;
  }

  if (normalized.category !== undefined) {
    const trimmed = String(normalized.category).trim();
    normalized.category = trimmed || undefined;
  }

  if (normalized.status !== undefined) {
    const trimmed = String(normalized.status).trim();
    normalized.status = trimmed || undefined;
  }

  return apiRequest.get(ASSIGNMENT_BASE, { params: normalized });
};

const getAssignment = (assignmentId) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.get(`${ASSIGNMENT_BASE}/${safeAssignmentId}`);
};

const deleteAssignment = (assignmentId) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.delete(`${ASSIGNMENT_BASE}/${safeAssignmentId}`);
};

/**
 * @param {number|string} assignmentId
 * @param {{
 *   title: string,
 *   description?: string,
 *   totalScore: number,
 *   setting?: object,
 *   sections?: Array<object>,
 * }} payload
 */
const updateAssignment = (assignmentId, payload) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.put(`${ASSIGNMENT_BASE}/${safeAssignmentId}`, payload);
};

/**
 * @param {number|string} assignmentId
 */
const publishAssignment = (assignmentId, classroomIds = []) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.post(`${ASSIGNMENT_BASE}/${safeAssignmentId}/publish`, {
    classroomIds,
  });
};

/**
 * @param {number|string} assignmentId
 * @param {{
 *   sessionId: number,
 *   bankId?: number | null,
 *   selectedQuestionIds: number[],
 * }} payload
 */
const confirmAndPublishAssignment = (assignmentId, payload) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.post(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/confirm-and-publish`,
    payload,
  );
};

/**
 * @param {number|string} assignmentId
 * @param {{ title: string, sectionType: string, questions?: Array<object> }} payload
 */
const createSection = (assignmentId, payload) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.post(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/sections`,
    payload,
  );
};

/**
 * @param {number|string} assignmentId
 * @param {number|string} sectionId
 * @param {{ title: string, sectionType: string, questions?: Array<object> }} payload
 */
const updateSection = (assignmentId, sectionId, payload) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeSectionId = normalizeId(sectionId, "sectionId");
  return apiRequest.put(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/sections/${safeSectionId}`,
    payload,
  );
};

/**
 * @param {number|string} assignmentId
 * @param {number|string} sectionId
 */
const deleteSection = (assignmentId, sectionId) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeSectionId = normalizeId(sectionId, "sectionId");
  return apiRequest.delete(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/sections/${safeSectionId}`,
  );
};

/**
 * @param {number|string} assignmentId
 * @param {number|string} sectionId
 * @param {import("@/schema/type.schema").QuestionRequest} payload
 */
const createAssignmentQuestion = (assignmentId, sectionId, payload) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeSectionId = normalizeId(sectionId, "sectionId");
  return apiRequest.post(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/sections/${safeSectionId}/questions`,
    payload,
  );
};

/**
 * @param {number|string} assignmentId
 * @param {number|string} sectionId
 * @param {Array<import("@/schema/type.schema").QuestionRequest>} payload
 */
const createAssignmentQuestionsBatch = (assignmentId, sectionId, payload) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeSectionId = normalizeId(sectionId, "sectionId");
  return apiRequest.post(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/sections/${safeSectionId}/questions/batch`,
    payload,
  );
};

/**
 * @param {number|string} assignmentId
 * @param {number|string} sectionId
 * @param {number|string} questionId
 * @param {import("@/schema/type.schema").QuestionRequest} payload
 */
const updateAssignmentQuestion = (
  assignmentId,
  sectionId,
  questionId,
  payload,
) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeSectionId = normalizeId(sectionId, "sectionId");
  const safeQuestionId = normalizeId(questionId, "questionId");
  return apiRequest.put(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/sections/${safeSectionId}/questions/${safeQuestionId}`,
    payload,
  );
};

/**
 * @param {number|string} assignmentId
 * @param {number|string} sectionId
 * @param {number|string} questionId
 */
const deleteAssignmentQuestion = (assignmentId, sectionId, questionId) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeSectionId = normalizeId(sectionId, "sectionId");
  const safeQuestionId = normalizeId(questionId, "questionId");
  return apiRequest.delete(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/sections/${safeSectionId}/questions/${safeQuestionId}`,
  );
};

const getAssignmentQuestions = (assignmentId, sectionId, params = {}) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeSectionId = normalizeId(sectionId, "sectionId");

  const normalized = {
    ...DEFAULT_ASSIGNMENT_LIST_PARAMS,
    ...params,
  };

  if (normalized.keyword !== undefined) {
    const trimmed = String(normalized.keyword).trim();
    normalized.keyword = trimmed || undefined;
  }

  if (normalized.type !== undefined) {
    const trimmed = String(normalized.type).trim();
    normalized.type = trimmed || undefined;
  }

  if (normalized.cognitiveLevel !== undefined) {
    const trimmed = String(normalized.cognitiveLevel).trim();
    normalized.cognitiveLevel = trimmed || undefined;
  }

  return apiRequest.get(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/sections/${safeSectionId}/questions`,
    {
      params: normalized,
    },
  );
};

const getPendingSession = (scope = {}) => {
  const params = normalizeDraftScope(scope);
  return apiRequest.get(`${DRAFT_SESSION_BASE}/pending`, { params });
};

const getPendingSessionsSummary = (targetType = null) => {
  const params = {};
  if (targetType) {
    params.targetType = targetType;
  }
  return apiRequest.get(`${DRAFT_SESSION_BASE}/pending/summary`, { params });
};

const initManualDraftSession = (scope = {}) => {
  const params = normalizeDraftScope(scope);
  return apiRequest.post(`${DRAFT_SESSION_BASE}/manual/init`, null, {
    params,
  });
};

const createFreshManualDraftSession = (scope = {}) => {
  const params = normalizeDraftScope(scope);
  return apiRequest.post(`${DRAFT_SESSION_BASE}/manual/fresh`, null, {
    params,
  });
};

const getDraftSession = (sessionId, scope = {}, query = {}) => {
  const safeSessionId = normalizeId(sessionId, "sessionId");
  const params = {
    ...normalizeDraftScope(scope),
    ...query,
  };

  if (params.keyword !== undefined) {
    const trimmed = String(params.keyword).trim();
    params.keyword = trimmed || undefined;
  }

  if (params.type !== undefined) {
    const trimmed = String(params.type).trim();
    params.type = trimmed || undefined;
  }

  if (params.cognitive !== undefined) {
    const trimmed = String(params.cognitive).trim();
    params.cognitive = trimmed || undefined;
  }

  if (params.status !== undefined) {
    const trimmed = String(params.status).trim();
    params.status = trimmed || undefined;
  }

  return apiRequest.get(`${DRAFT_SESSION_BASE}/${safeSessionId}`, { params });
};

const getDraftWorkspace = (sessionId) => {
  const safeSessionId = normalizeId(sessionId, "sessionId");
  return apiRequest.get(`${DRAFT_SESSION_BASE}/${safeSessionId}/workspace`);
};

/**
 * @param {number|string} sessionId
 * @param {{
 *   itemId?: number | null,
 *   content?: string,
 *   questionType?: string,
 *   cognitiveLevel?: string,
 *   defaultPoints?: number,
 *   sampleAnswer?: string,
 *   options?: Array<{ content: string, correct: boolean }>,
 *   sectionId?: number | null,
 * }} payload
 */
const autoSaveDraftItem = (sessionId, payload, scope = {}) => {
  const safeSessionId = normalizeId(sessionId, "sessionId");
  const params = normalizeDraftScope(scope);
  return apiRequest.put(
    `${DRAFT_SESSION_BASE}/${safeSessionId}/items/auto-save`,
    payload,
    { params },
  );
};

/**
 * @param {number|string} sessionId
 * @param {Array<{
 *   itemId?: number | null,
 *   content?: string | null,
 *   questionType?: string,
 *   cognitiveLevel?: string,
 *   defaultPoints?: number,
 *   sampleAnswer?: string | null,
 *   options?: Array<{ content: string, correct: boolean }> | null,
 *   sectionId?: number | null,
 * }>} items
 */
const batchAutoSaveDraftItems = (sessionId, items = [], scope = {}) => {
  const safeSessionId = normalizeId(sessionId, "sessionId");
  const params = normalizeDraftScope(scope);
  return apiRequest.put(
    `${DRAFT_SESSION_BASE}/${safeSessionId}/items/batch-save`,
    {
      items: Array.isArray(items) ? items : [],
    },
    { params },
  );
};

const deleteDraftItem = (sessionId, itemId) => {
  const safeSessionId = normalizeId(sessionId, "sessionId");
  const safeItemId = normalizeId(itemId, "itemId");
  return apiRequest.delete(
    `${DRAFT_SESSION_BASE}/${safeSessionId}/items/${safeItemId}`,
  );
};

const confirmDraftSession = (
  sessionId,
  selectedQuestionIds = [],
  scope = {},
) => {
  const safeSessionId = normalizeId(sessionId, "sessionId");
  const params = normalizeDraftScope(scope);
  return apiRequest.post(
    `${DRAFT_SESSION_BASE}/${safeSessionId}/confirm`,
    Array.isArray(selectedQuestionIds) ? selectedQuestionIds : [],
    {
      params,
    },
  );
};

export const assignmentApi = {
  createAssignment,
  getAssignments,
  getAssignment,
  deleteAssignment,
  updateAssignment,
  publishAssignment,
  confirmAndPublishAssignment,
  createSection,
  updateSection,
  deleteSection,
  createAssignmentQuestion,
  createAssignmentQuestionsBatch,
  updateAssignmentQuestion,
  deleteAssignmentQuestion,
  getAssignmentQuestions,
  getPendingSession,
  getPendingSessionsSummary,
  initManualDraftSession,
  createFreshManualDraftSession,
  getDraftSession,
  getDraftWorkspace,
  autoSaveDraftItem,
  batchAutoSaveDraftItems,
  deleteDraftItem,
  confirmDraftSession,
};
