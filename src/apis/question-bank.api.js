import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import {
  CreateQuestionBankSchema,
  UpdateQuestionBankSchema,
} from "@/schema/question-bank.schema";

/** @typedef {import("@/schema/question-bank.schema").TQuestionBank} TQuestionBank */
/** @typedef {import("@/schema/type.schema").ApiResponse<TQuestionBank>} QuestionBankResponse */

/**
 * @typedef {Object} TQuestionPreviewItem
 * @property {number} [id]
 * @property {number} rowNumber
 * @property {string} status
 * @property {string[]} errors
 * @property {{
 *   content: string,
 *   questionType: string,
 *   difficulty: string,
 *   defaultPoints: number,
 *   sampleAnswer: string | null,
 *   options: Array<{ content: string, isCorrect?: boolean, correct?: boolean }> | null,
 * }} questionData
 */

const BASE = API_SUFFIX.QUESTION_BANK;
const DRAFT_SESSION_BASE = API_SUFFIX.DRAFT_SESSION;
const CREATE_BANK_BASE = "/banks";
const LIST_BANK_BASE = "/banks";
const DELETE_RESOURCE_BANK_TIMEOUT_MS = 4000;

const DEFAULT_LIST_PARAMS = {
  page: 1,
  size: 10,
  sortBy: "createdAt",
  sortDirection: "DESC",
};

const DEFAULT_QUESTION_LIST_PARAMS = {
  page: 1,
  size: 10,
  sortBy: "createdAt",
  sortDirection: "DESC",
};

/**
 * @param {number|string} bankId
 * @returns {number}
 */
const normalizeBankId = (bankId) => {
  const parsed = Number(bankId);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("bankId không hợp lệ.");
  }
  return parsed;
};

const normalizeListParams = (params = {}) => {
  const normalized = {
    ...DEFAULT_LIST_PARAMS,
    ...params,
  };

  if (normalized.keyword !== undefined) {
    const trimmed = String(normalized.keyword).trim();
    normalized.keyword = trimmed || undefined;
  }

  if (normalized.gradeLevel !== undefined) {
    const trimmed = String(normalized.gradeLevel).trim();
    normalized.gradeLevel = trimmed || undefined;
  }

  if (normalized.subject !== undefined) {
    const trimmed = String(normalized.subject).trim();
    normalized.subject = trimmed || undefined;
  }

  return normalized;
};

const normalizeQuestionListParams = (params = {}) => {
  const normalized = {
    ...DEFAULT_QUESTION_LIST_PARAMS,
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
  } else if (normalized.difficulty !== undefined) {
    const trimmed = String(normalized.difficulty).trim();
    normalized.cognitiveLevel = trimmed || undefined;
  }

  delete normalized.difficulty;

  return normalized;
};

const normalizeQuestionBank = (item) => {
  if (!item || typeof item !== "object") {
    return item;
  }

  const normalizedUpdatedAt = item.updatedAt ?? item.updateAt ?? null;

  return {
    ...item,
    createdAt: item.createdAt ?? null,
    updatedAt: normalizedUpdatedAt,
    updateAt: normalizedUpdatedAt,
  };
};

const normalizeQuestionBankListResult = (result) => {
  if (!result || typeof result !== "object") {
    return result;
  }

  const content = Array.isArray(result.content)
    ? result.content.map(normalizeQuestionBank)
    : result.content;

  return {
    ...result,
    content,
  };
};

/**
 * @param {{
 *   keyword?: string,
 *   gradeLevel?: string,
 *   subject?: string,
 *   page?: number,
 *   size?: number,
 *   sortBy?: string,
 *   sortDirection?: "ASC" | "DESC",
 * }} [params]
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   content: TQuestionBank[],
 *   pageNumber: number,
 *   pageSize: number,
 *   totalElements: number,
 *   totalPages: number,
 *   last: boolean,
 * }>>}
 */
const getQuestionBanks = (params) => {
  const normalizedParams = normalizeListParams(params);
  return apiRequest
    .get(LIST_BANK_BASE, { params: normalizedParams })
    .then((response) => ({
      ...response,
      result: normalizeQuestionBankListResult(response?.result),
    }));
};

/**
 * @param {number|string} bankId
 * @param {{
 *   keyword?: string,
 *   type?: string,
 *   difficulty?: string,
 *   page?: number,
 *   size?: number,
 *   sortBy?: string,
 *   sortDirection?: "ASC" | "DESC",
 * }} [params]
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   content: Array<{
 *     id: number,
 *     questionBankId: number,
 *     content: string,
 *     questionType: string,
 *     difficulty: string,
 *     defaultPoints: number,
 *     sampleAnswer: string | null,
 *     options: Array<{ id?: number, content: string, correct?: boolean, isCorrect?: boolean }> | null,
 *   }>,
 *   pageNumber: number,
 *   pageSize: number,
 *   totalElements: number,
 *   totalPages: number,
 *   last: boolean,
 * }>>}
 */
const getQuestions = (bankId, params) => {
  const safeBankId = normalizeBankId(bankId);
  const normalizedParams = normalizeQuestionListParams(params);
  return apiRequest.get(`${LIST_BANK_BASE}/${safeBankId}/questions`, {
    params: normalizedParams,
  });
};

/**
 * @param {import("@/schema/question-bank.schema").TCreateQuestionBank} data
 * @returns {Promise<QuestionBankResponse>}
 */
const createQuestionBank = (data) => {
  const parsed = CreateQuestionBankSchema.parse(data);
  return apiRequest.post(CREATE_BANK_BASE, parsed).then((response) => ({
    ...response,
    result: normalizeQuestionBank(response?.result),
  }));
};

/**
 * @param {number} bankId
 * @param {import("@/schema/question-bank.schema").TUpdateQuestionBank} data
 * @returns {Promise<QuestionBankResponse>}
 */
const updateQuestionBank = (bankId, data) => {
  const safeBankId = normalizeBankId(bankId);
  const parsed = UpdateQuestionBankSchema.parse(data);
  return apiRequest.put(`${CREATE_BANK_BASE}/${safeBankId}`, parsed).then((response) => ({
    ...response,
    result: normalizeQuestionBank(response?.result),
  }));
};

/**
 * @param {number} bankId
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<void>>}
 */
const deleteQuestionBank = (bankId) => {
  const safeBankId = normalizeBankId(bankId);
  return apiRequest.delete(`${CREATE_BANK_BASE}/${safeBankId}`, {
    timeout: DELETE_RESOURCE_BANK_TIMEOUT_MS,
  });
};

/**
 * @param {number|string} bankId
 * @param {File} file
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<Array<{
 *   rowNumber: number,
 *   status: string,
 *   errors: string[],
 *   questionData: {
 *     content: string,
 *     questionType: string,
 *     difficulty: string,
 *     defaultPoints: number,
 *     sampleAnswer: string | null,
 *     options: Array<{ content: string, isCorrect?: boolean, correct?: boolean }> | null,
 *   }
 * }>>}
 */
const previewImportQuestions = (bankId, file) => {
  const safeBankId = normalizeBankId(bankId);
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest.post(
    `${BASE}/${safeBankId}/questions/import/preview`,
    formData,
  );
};

/**
 * Import câu hỏi từ Excel vào draft session
 * @param {File} file
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @param {number|string} [sessionId]
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   questions: Array<any>,
 *   warnings: string[],
 *   currentPage?: number,
 *   pageSize?: number,
 *   totalPages?: number,
 *   totalItems?: number,
 * }>>}
 */
const importQuestionsFromExcelDraft = (
  file,
  bankId,
  assignmentId,
  sessionId,
) => {
  const formData = new FormData();
  formData.append("file", file);

  const params = {};
  if (bankId !== undefined && bankId !== null) {
    params.bankId = normalizeBankId(bankId);
  }
  if (assignmentId !== undefined && assignmentId !== null) {
    params.assignmentId = normalizeBankId(assignmentId);
  }
  if (sessionId !== undefined && sessionId !== null) {
    params.sessionId = normalizeBankId(sessionId);
  }

  return apiRequest.post("/draft-sessions/import", formData, { params });
};

/**
 * @param {number|string} bankId
 * @param {Array<{
 *   content: string,
 *   questionType: string,
 *   difficulty: string,
 *   defaultPoints: number,
 *   sampleAnswer: string | null,
 *   options: Array<{ content: string, isCorrect: boolean }> | null,
 * }>} validRequests
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<void>>}
 */
const confirmImportQuestions = (bankId, validRequests) => {
  const safeBankId = normalizeBankId(bankId);
  return apiRequest.post(
    `${BASE}/${safeBankId}/questions/import/confirm`,
    validRequests,
  );
};

/**
 * @param {number|string} bankId
 * @param {{
 *   content: string,
 *   questionType: string,
 *   cognitiveLevel: string,
 *   defaultPoints: number,
 *   sampleAnswer: string | null,
 *   options: Array<{ content: string, isCorrect: boolean }> | null,
 * }} payload
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   id: number,
 *   questionBankId: number,
 *   content: string,
 *   questionType: string,
 *   cognitiveLevel: string,
 *   defaultPoints: number,
 *   sampleAnswer: string | null,
 *   options: Array<{ id?: number, content: string, isCorrect?: boolean, correct?: boolean }> | null,
 * }>>}
 */
const createQuestion = (bankId, payload) => {
  const safeBankId = normalizeBankId(bankId);
  return apiRequest.post(`${LIST_BANK_BASE}/${safeBankId}/questions`, payload);
};

/**
 * @param {number|string} bankId
 * @param {Array<{
 *   content: string,
 *   questionType: string,
 *   difficulty: string,
 *   defaultPoints: number,
 *   sampleAnswer?: string | null,
 *   options: Array<{ content: string, correct: boolean }>,
 * }>} payload
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<Array<{
 *   id: number,
 *   questionBankId: number,
 *   content: string,
 *   questionType: string,
 *   difficulty: string,
 *   defaultPoints: number,
 *   sampleAnswer: string | null,
 *   options: Array<{ id?: number, content: string, correct?: boolean, isCorrect?: boolean }> | null,
 * }>>>}
 */
const createQuestionsBatch = (bankId, payload) => {
  const safeBankId = normalizeBankId(bankId);
  return apiRequest.post(
    `${LIST_BANK_BASE}/${safeBankId}/questions/batch`,
    payload,
  );
};

/**
 * @param {number|string} bankId
 * @param {{
 *   difficulty: string,
 *   quantity: number,
 *   questionTypes?: string[],
 *   additionalPrompt?: string,
 *   rawText?: string,
 *   file?: File | null,
 *   sessionId?: number | null,
 * }} payload
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   questions: TQuestionPreviewItem[],
 * }>>}
 */
const generateQuestionsWithAi = (bankId, payload) => {
  const safeBankId = normalizeBankId(bankId);
  const formData = new FormData();
  formData.append("difficulty", String(payload?.difficulty ?? ""));
  formData.append("quantity", String(payload?.quantity ?? 1));

  if (Array.isArray(payload?.questionTypes)) {
    payload.questionTypes
      .map((type) => String(type ?? "").trim())
      .filter(Boolean)
      .forEach((type) => {
        formData.append("questionTypes", type);
      });
  }

  const additionalPrompt = String(payload?.additionalPrompt ?? "").trim();
  if (additionalPrompt) {
    formData.append("additionalPrompt", additionalPrompt);
  }

  const rawText = String(payload?.rawText ?? "").trim();
  if (rawText) {
    formData.append("rawText", rawText);
  }

  if (payload?.sessionId !== undefined && payload?.sessionId !== null) {
    formData.append("sessionId", String(payload.sessionId));
  }
  if (payload?.file) {
    formData.append("file", payload.file);
  }
  return apiRequest.post(
    `${BASE}/${safeBankId}/questions/ai/generate`,
    formData,
  );
};

/**
 * @param {number|string} bankId
 * @param {number|string} sessionId
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   questions: TQuestionPreviewItem[],
 * }>>}
 */
const getDraftAiSession = (bankId, sessionId) => {
  const safeBankId = normalizeBankId(bankId);
  const safeSessionId = normalizeBankId(sessionId);
  return apiRequest.get(
    `${BASE}/${safeBankId}/questions/sessions/${safeSessionId}`,
  );
};

/**
 * @param {number|string} bankId
 * @param {number|string} sessionId
 * @param {{
 *   prompt: string,
 *   selectQuestionIds?: number[],
 * }} payload
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   questions: TQuestionPreviewItem[],
 *   warnings?: string[],
 * }>>}
 */
const refineAiQuestions = (bankId, sessionId, payload) => {
  const safeBankId = normalizeBankId(bankId);
  const safeSessionId = normalizeBankId(sessionId);
  return apiRequest.post(
    `${BASE}/${safeBankId}/sessions/${safeSessionId}/refine`,
    payload,
  );
};

/**
 * @param {number|string} bankId
 * @param {number|string} sessionId
 * @param {number[]} selectedQuestionIds
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<void>>}
 */
const confirmAiQuestions = (bankId, sessionId, selectedQuestionIds) => {
  const safeBankId = normalizeBankId(bankId);
  const safeSessionId = normalizeBankId(sessionId);
  return apiRequest.post(
    `${BASE}/${safeBankId}/sessions/${safeSessionId}/confirm`,
    selectedQuestionIds,
  );
};

/**
 * @param {number|string} bankId
 * @param {number|string} sessionId
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<void>>}
 */
const cancelAiSession = (bankId, sessionId) => {
  const safeBankId = normalizeBankId(bankId);
  const safeSessionId = normalizeBankId(sessionId);
  return apiRequest.delete(
    `${BASE}/${safeBankId}/sessions/${safeSessionId}/cancel`,
  );
};

/**
 * @param {number|string} bankId
 * @param {number|string} questionId
 * @param {{
 *   content: string,
 *   questionType: string,
 *   cognitiveLevel: string,
 *   defaultPoints: number,
 *   sampleAnswer: string | null,
 *   options: Array<{ content: string, isCorrect: boolean }> | null,
 * }} payload
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   id: number,
 *   questionBankId: number,
 *   content: string,
 *   questionType: string,
 *   cognitiveLevel: string,
 *   defaultPoints: number,
 *   sampleAnswer: string | null,
 *   options: Array<{ id?: number, content: string, isCorrect?: boolean, correct?: boolean }> | null,
 * }>>}
 */
const updateQuestion = (bankId, questionId, payload) => {
  const safeBankId = normalizeBankId(bankId);
  const safeQuestionId = normalizeBankId(questionId);
  return apiRequest.put(
    `${LIST_BANK_BASE}/${safeBankId}/questions/${safeQuestionId}`,
    payload,
  );
};

/**
 * @param {number|string} bankId
 * @param {number|string} questionId
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<void>>}
 */
const deleteQuestion = (bankId, questionId) => {
  const safeBankId = normalizeBankId(bankId);
  const safeQuestionId = normalizeBankId(questionId);
  return apiRequest.delete(
    `${LIST_BANK_BASE}/${safeBankId}/questions/${safeQuestionId}`,
  );
};

/**
 * Khởi tạo phiên tạo câu hỏi
 * Nếu đã có phiên nháp dở thì trả về thông tin phiên đó, nếu chưa có thì tạo mới
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @param {"MANUAL_CREATION"|"AI_GENERATION"|"EXCEL_IMPORT"} sessionType
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   hasPending: boolean,
 *   itemCount: number,
 *   lastSavedAt: string,
 *   targetId: number,
 *   targetName: string,
 *   targetType: string,
 *   sessionType: string,
 * }>>}
 */
const initSession = (bankId, assignmentId, sessionType = "MANUAL_CREATION") => {
  const params = {};
  if (bankId !== undefined && bankId !== null) {
    params.bankId = normalizeBankId(bankId);
  }
  if (assignmentId !== undefined && assignmentId !== null) {
    params.assignmentId = normalizeBankId(assignmentId);
  }
  params.sessionType = sessionType;
  return apiRequest.post("/draft-sessions/manual/init", null, { params });
};

/**
 * Khởi tạo phiên tạo câu hỏi thủ công
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<any>>}
 */
const initManualSession = (bankId, assignmentId) => {
  return initSession(bankId, assignmentId, "MANUAL_CREATION");
};

/**
 * Khởi tạo phiên tạo câu hỏi với AI
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<any>>}
 */
const initAiSession = (bankId, assignmentId) => {
  return initSession(bankId, assignmentId, "AI_GENERATION");
};

/**
 * Lấy danh sách phiên nháp đang dở theo target type
 * @param {"ASSIGNMENT"|"BANK"|null} [targetType]
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<Array<{
 *   sessionId: number,
 *   hasPending: boolean,
 *   itemCount: number,
 *   lastSavedAt: string,
 *   targetId: number,
 *   targetName: string,
 *   targetType: string,
 *   sessionType: string,
 * }>>>}
 */
const getPendingSessionsSummary = (targetType = null) => {
  const params = {};
  if (targetType) {
    params.targetType = String(targetType).trim().toUpperCase();
  }
  return apiRequest.get(`${DRAFT_SESSION_BASE}/pending/summary`, { params });
};

/**
 * Tạo phiên làm việc mới hoàn toàn, bỏ qua phiên nháp cũ
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @param {"MANUAL_CREATION"|"AI_GENERATION"|"EXCEL_IMPORT"} [sessionType]
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<number>>}
 */
const startFreshSession = (
  bankId,
  assignmentId,
  sessionType = "MANUAL_CREATION",
) => {
  const params = { sessionType };
  if (bankId !== undefined && bankId !== null) {
    params.bankId = normalizeBankId(bankId);
  }
  if (assignmentId !== undefined && assignmentId !== null) {
    params.assignmentId = normalizeBankId(assignmentId);
  }
  return apiRequest.post(`${DRAFT_SESSION_BASE}/fresh`, null, { params });
};

/**
 * Xóa tất cả câu hỏi không hợp lệ trong phiên draft
 * @param {number|string} sessionId
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<void>>}
 */
const deleteInvalidItems = (sessionId) => {
  const safeSessionId = normalizeBankId(sessionId);
  return apiRequest.delete(`${DRAFT_SESSION_BASE}/${safeSessionId}/items/invalid`);
};

/**
 * Tạo câu hỏi với AI (dành cho draft session)
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @param {{
 *   content?: string,
 *   questionType?: string,
 *   cognitiveLevel?: string,
 *   defaultPoints?: number,
 *   sampleAnswer?: string,
 *   options?: Array<{ content: string, correct: boolean }>,
 *   additionalPrompt?: string,
 * }} request
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   questions: Array<any>,
 *   warnings: string[],
 *   currentPage: number,
 *   pageSize: number,
 *   totalPages: number,
 *   totalItems: number,
 * }>>}
 */
const generateAiDraft = (bankId, assignmentId, request) => {
  const params = {};
  if (bankId !== undefined && bankId !== null) {
    params.bankId = normalizeBankId(bankId);
  }
  if (assignmentId !== undefined && assignmentId !== null) {
    params.assignmentId = normalizeBankId(assignmentId);
  }
  const formData = new FormData();
  if (request) {
    Object.keys(request).forEach((key) => {
      const value = request[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(key, JSON.stringify(item)));
        } else if (typeof value === "object" && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });
  }
  return apiRequest.post("/draft-sessions/ai/generate", formData, { params });
};

/**
 * Tinh chỉnh câu hỏi với AI (dành cho draft session)
 * @param {number|string} sessionId
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @param {{
 *   prompt: string,
 *   sectionId?: number,
 *   selectQuestionIds?: number[],
 * }} request
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   questions: Array<any>,
 *   warnings: string[],
 * }>>}
 */
const refineAiDraft = (sessionId, bankId, assignmentId, request) => {
  const safeSessionId = normalizeBankId(sessionId);
  const params = {};
  if (bankId !== undefined && bankId !== null) {
    params.bankId = normalizeBankId(bankId);
  }
  if (assignmentId !== undefined && assignmentId !== null) {
    params.assignmentId = normalizeBankId(assignmentId);
  }
  return apiRequest.post(`/draft-sessions/${safeSessionId}/refine`, request, {
    params,
  });
};

/**
 * Lấy dữ liệu bản nháp để hiển thị lại
 * @param {number|string} sessionId
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @param {{
 *   page?: number,
 *   size?: number,
 *   keyword?: string,
 *   type?: string,
 *   cognitive?: string,
 *   status?: string,
 * }} [params]
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   questions: Array<any>,
 *   warnings: string[],
 *   currentPage: number,
 *   pageSize: number,
 *   totalPages: number,
 *   totalItems: number,
 * }>>}
 */
const getDraftSession = (sessionId, bankId, assignmentId, params = {}) => {
  const safeSessionId = normalizeBankId(sessionId);
  const queryParams = {
    page: params.page || 1,
    size: params.size || 10,
  };
  if (bankId !== undefined && bankId !== null) {
    queryParams.bankId = normalizeBankId(bankId);
  }
  if (assignmentId !== undefined && assignmentId !== null) {
    queryParams.assignmentId = normalizeBankId(assignmentId);
  }
  if (params.keyword) queryParams.keyword = params.keyword;
  if (params.type) queryParams.type = params.type;
  if (params.cognitive) queryParams.cognitive = params.cognitive;
  if (params.status) queryParams.status = params.status;
  return apiRequest.get(`/draft-sessions/${safeSessionId}`, {
    params: queryParams,
  });
};

/**
 * Xác nhận phiên draft và lưu các câu hỏi đã chọn
 * @param {number|string} sessionId
 * @param {number|string} [bankId]
 * @param {number|string} [assignmentId]
 * @param {Array<number|string>} selectedQuestionIds
 * @returns {Promise<import("@/schema/type.schema").ApiResponse<{
 *   sessionId: number,
 *   confirmedCount: number,
 *   removedCount: number,
 *   status: string,
 * }>>}
 */
const confirmDraftSession = (
  sessionId,
  bankId,
  assignmentId,
  selectedQuestionIds = [],
) => {
  const safeSessionId = normalizeBankId(sessionId);
  const params = {};

  if (bankId !== undefined && bankId !== null) {
    params.bankId = normalizeBankId(bankId);
  }

  if (assignmentId !== undefined && assignmentId !== null) {
    params.assignmentId = normalizeBankId(assignmentId);
  }

  const payload = Array.isArray(selectedQuestionIds)
    ? selectedQuestionIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    : [];

  return apiRequest.post(`/draft-sessions/${safeSessionId}/confirm`, payload, {
    params,
  });
};

export const questionBankApi = {
  getQuestionBanks,
  getQuestions,
  createQuestionBank,
  updateQuestionBank,
  deleteQuestionBank,
  previewImportQuestions,
  importQuestionsFromExcelDraft,
  confirmImportQuestions,
  createQuestion,
  createQuestionsBatch,
  generateQuestionsWithAi,
  getDraftAiSession,
  refineAiQuestions,
  confirmAiQuestions,
  cancelAiSession,
  updateQuestion,
  deleteQuestion,
  initSession,
  initManualSession,
  initAiSession,
  getPendingSessionsSummary,
  startFreshSession,
  generateAiDraft,
  refineAiDraft,
  getDraftSession,
  confirmDraftSession,
  deleteInvalidItems,
};
