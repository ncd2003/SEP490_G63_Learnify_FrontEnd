import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "@/apis/util.api";

const ASSIGNMENT_BASE = API_SUFFIX.ASSIGNMENT;
const DRAFT_SESSION_BASE = API_SUFFIX.DRAFT_SESSION;
const TEACHER_GRADING_BASE = "/teacher";
const STUDENT_START_ASSIGNMENT_CACHE_TTL_MS = 1500;

const startStudentAssignmentInFlight = new Map();
const startStudentAssignmentRecentResult = new Map();

const DEFAULT_ASSIGNMENT_LIST_PARAMS = {
  page: 1,
  size: 10,
};

const DRAFT_SESSION_TYPE = {
  AI_GENERATION: "AI_GENERATION",
  EXCEL_IMPORT: "EXCEL_IMPORT",
  MANUAL_CREATION: "MANUAL_CREATION",
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

const normalizeDraftSessionType = (
  value = DRAFT_SESSION_TYPE.MANUAL_CREATION,
) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (normalized === DRAFT_SESSION_TYPE.AI_GENERATION) {
    return DRAFT_SESSION_TYPE.AI_GENERATION;
  }

  if (normalized === DRAFT_SESSION_TYPE.EXCEL_IMPORT) {
    return DRAFT_SESSION_TYPE.EXCEL_IMPORT;
  }

  if (normalized === DRAFT_SESSION_TYPE.MANUAL_CREATION) {
    return DRAFT_SESSION_TYPE.MANUAL_CREATION;
  }

  return DRAFT_SESSION_TYPE.MANUAL_CREATION;
};

const normalizeSaveAnswerItems = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item) => {
          const assignmentQuestionId = Number(item?.assignmentQuestionId);

          if (
            !Number.isFinite(assignmentQuestionId) ||
            assignmentQuestionId <= 0
          ) {
            return null;
          }

          return {
            assignmentQuestionId: Math.round(assignmentQuestionId),
            answerContent:
              item?.answerContent === undefined || item?.answerContent === null
                ? ""
                : String(item.answerContent),
          };
        })
        .filter(Boolean)
    : [];

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

const getStudentAssignments = (params = {}) =>
  apiRequest.get("/student/assignments", { params });

const getInProgressSubmissions = (classroomId) => {
  const safeClassroomId = normalizeId(classroomId, "classroomId");
  return apiRequest.get("/student/assignments/submissions/in-progress", {
    params: { classroomId: safeClassroomId },
  });
};

const getAssignmentsForClassroom = (classroomId) => {
  const safeClassroomId = normalizeId(classroomId, "classroomId");
  return apiRequest.get(`${ASSIGNMENT_BASE}/classrooms/${safeClassroomId}`);
};

const startStudentAssignment = (assignmentId, classroomId, password = null) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeClassroomId = normalizeId(classroomId, "classroomId");
  const normalizedPassword =
    password === undefined || password === null || password === ""
      ? null
      : String(password);
  const dedupeKey = `${safeAssignmentId}:${safeClassroomId}:${normalizedPassword || ""}`;

  const cached = startStudentAssignmentRecentResult.get(dedupeKey);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }

  const inFlight = startStudentAssignmentInFlight.get(dedupeKey);
  if (inFlight) {
    return inFlight;
  }

  const requestPromise = apiRequest
    .post(`/student/assignments/${safeAssignmentId}/start`, {
      classroomId: safeClassroomId,
      password: normalizedPassword,
    })
    .then((response) => {
      startStudentAssignmentRecentResult.set(dedupeKey, {
        data: response,
        expiresAt: Date.now() + STUDENT_START_ASSIGNMENT_CACHE_TTL_MS,
      });

      return response;
    })
    .finally(() => {
      startStudentAssignmentInFlight.delete(dedupeKey);
    });

  startStudentAssignmentInFlight.set(dedupeKey, requestPromise);

  return requestPromise;
};

const saveStudentAssignmentDraft = (submissionId, payload = {}) => {
  const safeSubmissionId = normalizeId(submissionId, "submissionId");
  const answers = normalizeSaveAnswerItems(payload?.answers);

  return apiRequest.put(
    `/student/assignments/submissions/${safeSubmissionId}/draft`,
    {
      answers,
    },
  );
};

const recordStudentAssignmentViolation = (submissionId, payload = {}) => {
  const safeSubmissionId = normalizeId(submissionId, "submissionId");

  return apiRequest.post(
    `/student/assignments/submissions/${safeSubmissionId}/violation`,
    {
      eventType: String(payload?.eventType || "").trim(),
      metadata:
        payload?.metadata === undefined || payload?.metadata === null
          ? ""
          : String(payload.metadata),
      answers: normalizeSaveAnswerItems(payload?.answers),
    },
  );
};

const submitStudentAssignment = (submissionId, payload = {}) => {
  const safeSubmissionId = normalizeId(submissionId, "submissionId");

  return apiRequest.post(
    `/student/assignments/submissions/${safeSubmissionId}/submit`,
    {
      finalAnswers: normalizeSaveAnswerItems(payload?.finalAnswers),
    },
  );
};

const getSubmissionResult = (submissionId) => {
  const safeSubmissionId = normalizeId(submissionId, "submissionId");

  return apiRequest.get(
    `/student/assignments/submissions/${safeSubmissionId}/result`,
  );
};

const getAssignment = (assignmentId) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.get(`${ASSIGNMENT_BASE}/${safeAssignmentId}`);
};

const getAvailableClassroomsForAssignment = (assignmentId) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.get(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/available-classrooms`,
  );
};

const getClassroomAssignments = (assignmentId) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.get(`${ASSIGNMENT_BASE}/${safeAssignmentId}/classrooms`);
};

const getSubmissions = (assignmentId, params = {}) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const normalized = {
    page: 1,
    size: 10,
    sortBy: "submitTime",
    sortDirection: "DESC",
    ...params,
  };

  if (normalized.keyword !== undefined) {
    const trimmedKeyword = String(normalized.keyword || "").trim();
    normalized.keyword = trimmedKeyword || undefined;
  }

  return apiRequest.get(
    `${TEACHER_GRADING_BASE}/assignments/${safeAssignmentId}/submissions`,
    {
      params: normalized,
    },
  );
};

const getSubmissionDetail = (submissionId) => {
  const safeSubmissionId = normalizeId(submissionId, "submissionId");
  return apiRequest.get(
    `${TEACHER_GRADING_BASE}/submissions/${safeSubmissionId}`,
  );
};

const gradeSubmission = (submissionId, payload = {}) => {
  const safeSubmissionId = normalizeId(submissionId, "submissionId");
  return apiRequest.put(
    `${TEACHER_GRADING_BASE}/submissions/${safeSubmissionId}/grade-essay`,
    payload,
  );
};

const getAssignmentById = (assignmentId) => getAssignment(assignmentId);

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
const publishAssignment = (assignmentId) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  return apiRequest.post(`${ASSIGNMENT_BASE}/${safeAssignmentId}/publish`);
};

/**
 * @param {number|string} assignmentId
 * @param {{
 *   classrooms: Array<{
 *     classroomId: number | string,
 *     settingOverride?: object,
 *   }>
 * }} payload
 */
const assignToClassrooms = (assignmentId, payload = {}) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");

  const classrooms = Array.isArray(payload?.classrooms)
    ? payload.classrooms
        .map((item) => {
          const classroomId = Number(item?.classroomId);
          if (!Number.isFinite(classroomId) || classroomId <= 0) {
            return null;
          }

          const normalizedItem = {
            classroomId: Math.round(classroomId),
          };

          if (
            item?.settingOverride &&
            typeof item.settingOverride === "object"
          ) {
            normalizedItem.settingOverride = item.settingOverride;
          }

          return normalizedItem;
        })
        .filter(Boolean)
    : [];

  return apiRequest.post(`${ASSIGNMENT_BASE}/${safeAssignmentId}/assign`, {
    classrooms,
  });
};

/**
 * @param {number|string} assignmentId
 * @param {number|string} classroomId
 * @param {{
 *   password?: string | null,
 *   durationMinutes?: number | null,
 *   startTime?: string | null,
 *   deadline?: string | null,
 *   allowLateSubmission?: boolean,
 *   shuffleQuestions?: boolean,
 *   limitTabs?: number | null,
 *   requireFullScreen?: boolean,
 * }} payload
 */
const updateClassroomOverride = (assignmentId, classroomId, payload = {}) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const safeClassroomId = normalizeId(classroomId, "classroomId");

  return apiRequest.put(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/assign/${safeClassroomId}`,
    payload,
  );
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
 * @param {{ itemIds: Array<number|string> }} payload
 */
const addQuestionsFromBank = (assignmentId, payload = {}) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const normalizedItemIds = Array.isArray(payload?.itemIds)
    ? payload.itemIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    : [];

  return apiRequest.post(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/items/from-bank`,
    { itemIds: normalizedItemIds },
  );
};

/**
 * @param {number|string} assignmentId
 * @param {{
 *   questionIds: Array<number|string>,
 *   pointOverride?: number,
 *   sectionId?: number|string,
 * }} payload
 */
const importQuestionsFromBank = (assignmentId, payload = {}) => {
  const safeAssignmentId = normalizeId(assignmentId, "assignmentId");
  const normalizedQuestionIds = Array.isArray(payload?.questionIds)
    ? payload.questionIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    : [];

  const body = {
    questionIds: normalizedQuestionIds,
  };

  const pointOverride = Number(payload?.pointOverride);
  if (Number.isFinite(pointOverride) && pointOverride > 0) {
    body.pointOverride = pointOverride;
  }

  const safeSectionId = normalizeOptionalId(payload?.sectionId, "sectionId");
  if (safeSectionId !== undefined) {
    body.sectionId = safeSectionId;
  }

  return apiRequest.post(
    `${ASSIGNMENT_BASE}/${safeAssignmentId}/import-from-bank`,
    body,
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

const getPendingSession = (
  scope = {},
  sessionType = DRAFT_SESSION_TYPE.MANUAL_CREATION,
) => {
  const params = {
    ...normalizeDraftScope(scope),
    sessionType: normalizeDraftSessionType(scope?.sessionType || sessionType),
  };
  return apiRequest.get(`${DRAFT_SESSION_BASE}/pending`, { params });
};

const getPendingSessionsSummary = (targetType = null) => {
  const params = {};
  if (targetType) {
    params.targetType = targetType;
  }
  return apiRequest.get(`${DRAFT_SESSION_BASE}/pending/summary`, { params });
};

const initManualDraftSession = (
  scope = {},
  sessionType = DRAFT_SESSION_TYPE.MANUAL_CREATION,
) => {
  const params = {
    ...normalizeDraftScope(scope),
    sessionType: normalizeDraftSessionType(sessionType),
  };
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

/**
 * @param {{
 *   cognitiveLevel?: string,
 *   cognitiveLevels?: string[],
 *   quantity?: number,
 *   questionTypes?: string[],
 *   requirements?: Array<{
 *     type: string,
 *     quantity: number,
 *     cognitiveLevel: string,
 *   }>,
 *   additionalPrompt?: string,
 *   rawText?: string,
 *   file?: File | null,
 *   sessionId?: number | null,
 *   sectionId?: number | null,
 * }} payload
 * @param {{ assignmentId?: number|string, bankId?: number|string }} scope
 */
const generateAiDraftSession = (payload = {}, scope = {}) => {
  const params = normalizeDraftScope(scope);
  const formData = new FormData();

  const normalizedRequirements = Array.isArray(payload?.requirements)
    ? payload.requirements
        .map((requirement) => {
          const type = String(requirement?.type || "").trim();
          const cognitiveLevel = String(
            requirement?.cognitiveLevel || "",
          ).trim();
          const quantity = Number(requirement?.quantity);

          if (!type || !cognitiveLevel || !Number.isFinite(quantity)) {
            return null;
          }

          return {
            type,
            cognitiveLevel,
            quantity: Math.max(1, Math.round(quantity)),
          };
        })
        .filter(Boolean)
    : [];

  if (normalizedRequirements.length > 0) {
    normalizedRequirements.forEach((requirement, index) => {
      formData.append(`requirements[${index}].type`, requirement.type);
      formData.append(
        `requirements[${index}].quantity`,
        String(requirement.quantity),
      );
      formData.append(
        `requirements[${index}].cognitiveLevel`,
        requirement.cognitiveLevel,
      );
    });
  } else {
    const cognitiveLevels = Array.isArray(payload?.cognitiveLevels)
      ? payload.cognitiveLevels
          .map((level) => String(level || "").trim())
          .filter(Boolean)
      : [];

    if (cognitiveLevels.length > 0) {
      cognitiveLevels.forEach((level) => {
        formData.append("cognitiveLevels", level);
      });
      formData.append("cognitiveLevel", cognitiveLevels[0]);
    } else {
      formData.append(
        "cognitiveLevel",
        String(payload?.cognitiveLevel || "").trim(),
      );
    }

    formData.append("quantity", String(payload?.quantity ?? 1));

    if (Array.isArray(payload?.questionTypes)) {
      payload.questionTypes
        .map((type) => String(type || "").trim())
        .filter(Boolean)
        .forEach((type) => {
          formData.append("questionTypes", type);
        });
    }
  }

  const additionalPrompt = String(payload?.additionalPrompt || "").trim();
  if (additionalPrompt) {
    formData.append("additionalPrompt", additionalPrompt);
  }

  const rawText = String(payload?.rawText || "").trim();
  if (rawText) {
    formData.append("rawText", rawText);
  }

  if (payload?.sessionId !== undefined && payload?.sessionId !== null) {
    formData.append("sessionId", String(payload.sessionId));
  }

  if (payload?.sectionId !== undefined && payload?.sectionId !== null) {
    formData.append("sectionId", String(payload.sectionId));
  }

  if (payload?.file) {
    formData.append("file", payload.file);
  }

  return apiRequest.post(`${DRAFT_SESSION_BASE}/ai/generate`, formData, {
    params,
  });
};

/**
 * @param {number|string} sessionId
 * @param {{
 *   prompt: string,
 *   sectionId?: number | string,
 *   selectQuestionIds?: Array<number|string>,
 * }} payload
 * @param {{ assignmentId?: number|string, bankId?: number|string }} scope
 */
const refineAiQuestions = (sessionId, payload = {}, scope = {}) => {
  const safeSessionId = normalizeId(sessionId, "sessionId");
  const params = normalizeDraftScope(scope);

  const prompt = String(payload?.prompt || "").trim();
  const normalizedQuestionIds = Array.isArray(payload?.selectQuestionIds)
    ? payload.selectQuestionIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    : [];

  const body = {
    prompt,
  };

  const safeSectionId = normalizeOptionalId(payload?.sectionId, "sectionId");
  if (safeSectionId !== undefined) {
    body.sectionId = safeSectionId;
  }

  if (normalizedQuestionIds.length > 0) {
    body.selectQuestionIds = normalizedQuestionIds;
  }

  return apiRequest.post(
    `${DRAFT_SESSION_BASE}/${safeSessionId}/refine`,
    body,
    {
      params,
    },
  );
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
 */
const getDraftSessionChatHistory = (sessionId) => {
  const safeSessionId = normalizeId(sessionId, "sessionId");
  return apiRequest.get(`${DRAFT_SESSION_BASE}/${safeSessionId}/chat-history`);
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
 *   orderIndex?: number | null,
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
 *   orderIndex?: number | null,
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
  getStudentAssignments,
  getInProgressSubmissions,
  getAssignmentsForClassroom,
  startStudentAssignment,
  saveStudentAssignmentDraft,
  recordStudentAssignmentViolation,
  submitStudentAssignment,
  getSubmissionResult,
  getAssignment,
  getAvailableClassroomsForAssignment,
  getClassroomAssignments,
  getSubmissions,
  getSubmissionDetail,
  gradeSubmission,
  getAssignmentById,
  deleteAssignment,
  updateAssignment,
  publishAssignment,
  assignToClassrooms,
  updateClassroomOverride,
  confirmAndPublishAssignment,
  addQuestionsFromBank,
  importQuestionsFromBank,
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
  generateAiDraftSession,
  refineAiQuestions,
  getDraftSession,
  getDraftWorkspace,
  getDraftSessionChatHistory,
  autoSaveDraftItem,
  batchAutoSaveDraftItems,
  deleteDraftItem,
  confirmDraftSession,
};
