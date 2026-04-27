import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_TEACHER } from "@/routes/paths";

const COG = [
  { v: "REMEMBER", l: "Nhớ", d: "Nhận biết, ghi nhớ", c: "#10B981" },
  { v: "UNDERSTAND", l: "Hiểu", d: "Giải thích, diễn giải", c: "#0EA5E9" },
  { v: "APPLY", l: "Vận dụng", d: "Áp dụng tình huống", c: "#2563EB" },
  { v: "ANALYZE", l: "Phân tích", d: "So sánh, phân biệt", c: "#8B5CF6" },
  { v: "EVALUATE", l: "Đánh giá", d: "Phán xét, nhận định", c: "#F59E0B" },
  { v: "CREATE", l: "Sáng tạo", d: "Tạo mới, thiết kế", c: "#EF4444" },
];
const QT = [
  { v: "MULTIPLE_CHOICE", l: "Trắc nghiệm", ic: "MC" },
  { v: "TRUE_FALSE", l: "Đúng / Sai", ic: "TF" },
  { v: "FILL_IN_BLANK", l: "Điền khuyết", ic: "FB" },
  { v: "ESSAY", l: "Tự luận", ic: "ES" },
];

const API_COG_MAP = {
  REMEMBER: "REMEMBERING",
  UNDERSTAND: "UNDERSTANDING",
  APPLY: "APPLYING",
  ANALYZE: "ANALYZING",
  EVALUATE: "EVALUATING",
  CREATE: "CREATING",
};

const API_QT_MAP = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  FILL_IN_BLANK: "FILL_IN_THE_BLANK",
  ESSAY: "ESSAY",
};

const UI_QT_MAP = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  FILL_IN_THE_BLANK: "FILL_IN_BLANK",
  FILL_IN_BLANK: "FILL_IN_BLANK",
  ESSAY: "ESSAY",
};

const API_COGNITIVE_ALIAS_MAP = {
  REMEMBER: "REMEMBERING",
  REMEMBERING: "REMEMBERING",
  UNDERSTAND: "UNDERSTANDING",
  UNDERSTANDING: "UNDERSTANDING",
  APPLY: "APPLYING",
  APPLYING: "APPLYING",
  ANALYZE: "ANALYZING",
  ANALYZING: "ANALYZING",
  EVALUATE: "EVALUATING",
  EVALUATING: "EVALUATING",
  CREATE: "CREATING",
  CREATING: "CREATING",
};

const COGNITIVE_LEVEL_UI = {
  REMEMBERING: {
    label: "Nhớ",
    bg: "#ECFDF5",
    border: "#86EFAC",
    text: "#047857",
  },
  UNDERSTANDING: {
    label: "Hiểu",
    bg: "#ECFEFF",
    border: "#67E8F9",
    text: "#0E7490",
  },
  APPLYING: {
    label: "Vận dụng",
    bg: "#EFF6FF",
    border: "#93C5FD",
    text: "#1D4ED8",
  },
  ANALYZING: {
    label: "Phân tích",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    text: "#6D28D9",
  },
  EVALUATING: {
    label: "Đánh giá",
    bg: "#FFFBEB",
    border: "#FCD34D",
    text: "#B45309",
  },
  CREATING: {
    label: "Sáng tạo",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    text: "#B91C1C",
  },
};

const normalizeCognitiveLevelFromApi = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  return API_COGNITIVE_ALIAS_MAP[normalized] || "";
};

const getCognitiveLevelUi = (value) => {
  const normalized = normalizeCognitiveLevelFromApi(value);
  return (
    COGNITIVE_LEVEL_UI[normalized] || {
      label: "Chưa xác định",
      bg: "#F8FAFC",
      border: "#CBD5E1",
      text: "#475569",
    }
  );
};

const SECTION_TYPE = {
  OBJECTIVE: "OBJECTIVE",
  ESSAY: "ESSAY",
  MIXED: "MIXED",
};

const DRAFT_SESSION_TYPE = {
  AI_GENERATION: "AI_GENERATION",
  EXCEL_IMPORT: "EXCEL_IMPORT",
  MANUAL_CREATION: "MANUAL_CREATION",
};

const normalizeSectionType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (normalized === SECTION_TYPE.ESSAY) return SECTION_TYPE.ESSAY;
  if (normalized === SECTION_TYPE.MIXED) return SECTION_TYPE.MIXED;
  if (
    normalized === SECTION_TYPE.OBJECTIVE ||
    normalized === "MULTIPLE_CHOICE"
  ) {
    return SECTION_TYPE.OBJECTIVE;
  }
  return SECTION_TYPE.OBJECTIVE;
};

const getAllowedQuestionTypesBySectionType = (sectionType) => {
  if (sectionType === SECTION_TYPE.ESSAY) {
    return ["ESSAY"];
  }

  if (sectionType === SECTION_TYPE.OBJECTIVE) {
    return ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"];
  }

  return ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK", "ESSAY"];
};

const toPositiveId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const isOptionCorrect = (option) =>
  Boolean(option?.correct ?? option?.isCorrect);

const normalizeQuestionTypeFromApi = (rawType) =>
  UI_QT_MAP[String(rawType || "").toUpperCase()] || "MULTIPLE_CHOICE";

const SECTION_TYPE_LABEL = {
  OBJECTIVE: "Trắc nghiệm",
  ESSAY: "Tự luận",
  MIXED: "Hỗn hợp",
};

const SECTION_TYPE_OPTIONS = [
  { value: SECTION_TYPE.OBJECTIVE, label: "Phần trắc nghiệm" },
  { value: SECTION_TYPE.ESSAY, label: "Phần tự luận" },
  { value: SECTION_TYPE.MIXED, label: "Phần hỗn hợp" },
];

const normalizeFormat = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (normalized === "MC") return "MULTIPLE_CHOICE";
  if (
    normalized === "MULTIPLE_CHOICE" ||
    normalized === "ESSAY" ||
    normalized === "MIXED"
  ) {
    return normalized;
  }

  return "MIXED";
};

const mapSectionSummaries = (sections = []) =>
  (Array.isArray(sections) ? sections : [])
    .map((section, index) => {
      const id = toPositiveId(section?.id || section?.sectionId);
      if (!id) return null;

      return {
        id,
        title: String(section?.title || "").trim() || `Phần ${index + 1}`,
        sectionType: normalizeSectionType(section?.sectionType),
        orderIndex: Number(section?.orderIndex ?? index + 1),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map(({ id, title, sectionType }) => ({ id, title, sectionType }));

const toSectionTypeLabel = (sectionType) =>
  SECTION_TYPE_LABEL[normalizeSectionType(sectionType)] || "Trắc nghiệm";

const DEFAULT_REQUIREMENT_COGNITIVE = "APPLY";
const DEFAULT_REQUIREMENT_QUANTITY = 1;

const clampRequirementQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_REQUIREMENT_QUANTITY;
  return Math.min(50, Math.max(1, Math.round(parsed)));
};

const buildRequirementConfig = (config = {}) => {
  const safeCognitiveLevel = COG.some(
    (level) => level.v === config.cognitiveLevel,
  )
    ? config.cognitiveLevel
    : DEFAULT_REQUIREMENT_COGNITIVE;

  return {
    quantity: clampRequirementQuantity(config.quantity),
    cognitiveLevel: safeCognitiveLevel,
  };
};

const toSectionConfigKey = (sectionId) => {
  const safeSectionId = toPositiveId(sectionId);
  return safeSectionId ? `section-${safeSectionId}` : "section-default";
};

const normalizeQuestionTypesBySection = (types = [], allowedTypes = []) => {
  if (!Array.isArray(allowedTypes) || allowedTypes.length === 0) return [];

  const source = Array.isArray(types) ? types : [];
  const normalized = source
    .map((type) => String(type || "").trim())
    .filter(
      (type, index, self) =>
        type && self.indexOf(type) === index && allowedTypes.includes(type),
    );

  return normalized;
};

const buildTypeRequirementsByQuestionTypes = (
  questionTypes = [],
  requirementMap = {},
) => {
  const next = {};

  questionTypes.forEach((type) => {
    next[type] = buildRequirementConfig(requirementMap?.[type]);
  });

  return next;
};

const workspacePreviewRequestCache = new Map();

const toSafeOrderIndex = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : Math.floor(fallback);
};

const sortQuestionsByOrderIndex = (questions = []) =>
  [...questions].sort((a, b) => {
    const orderA = toSafeOrderIndex(a?.orderIndex, Number.MAX_SAFE_INTEGER);
    const orderB = toSafeOrderIndex(b?.orderIndex, Number.MAX_SAFE_INTEGER);
    if (orderA !== orderB) return orderA - orderB;

    const idA = toPositiveId(a?.id) || 0;
    const idB = toPositiveId(b?.id) || 0;
    return idA - idB;
  });

const flattenQuestionsBySections = (sections = []) =>
  sections.flatMap((section) =>
    sortQuestionsByOrderIndex(
      Array.isArray(section?.questions) ? section.questions : [],
    ),
  );

const buildAutoSaveOptionsFromQuestion = (question = {}) => {
  if (question?.type === "MULTIPLE_CHOICE") {
    const rawOptions = Array.isArray(question?.opts) ? question.opts : [];
    if (!rawOptions.length) return undefined;

    const correctIndex = Number(question?.cor);
    const options = rawOptions.map((option, index) => ({
      content: normalizeRichText(option || ""),
      correct: correctIndex === index,
    }));

    if (options.some((option) => !String(option.content || "").trim())) {
      return undefined;
    }

    return options;
  }

  if (question?.type === "TRUE_FALSE") {
    const isTrue = Boolean(question?.cor);
    return [
      { content: "Đúng", correct: isTrue },
      { content: "Sai", correct: !isTrue },
    ];
  }

  if (question?.type === "FILL_IN_BLANK") {
    const answer = normalizeRichText(question?.ans || "");
    if (!answer) return undefined;

    return [{ content: answer, correct: true }];
  }

  return undefined;
};

const buildAutoSaveItemPayload = (question = {}, fallback = {}) => {
  const normalizedQuestionType =
    API_QT_MAP[question?.type] || "MULTIPLE_CHOICE";
  const normalizedCognitiveLevel =
    normalizeCognitiveLevelFromApi(question?.cognitiveLevel) || "APPLYING";
  const sectionId =
    toPositiveId(question?.sectionId) || toPositiveId(fallback?.sectionId);
  const orderIndex = toSafeOrderIndex(
    question?.orderIndex ?? fallback?.orderIndex,
    1,
  );
  const defaultPoints = Number(question?.defaultPoints);
  const sampleAnswer = normalizeRichText(
    question?.sampleAnswer ||
      (question?.type === "FILL_IN_BLANK" ? question?.ans || "" : ""),
  );

  const payload = {
    itemId: toPositiveId(question?.id) || null,
    content: normalizeRichText(question?.prompt || ""),
    questionType: normalizedQuestionType,
    cognitiveLevel: normalizedCognitiveLevel,
    defaultPoints: Number.isFinite(defaultPoints) ? defaultPoints : undefined,
    sampleAnswer: sampleAnswer || undefined,
    sectionId: sectionId || undefined,
    orderIndex,
  };

  const options = buildAutoSaveOptionsFromQuestion(question);
  if (Array.isArray(options) && options.length > 0) {
    payload.options = options;
  }

  return payload;
};

const applyQuestionDropToSections = (
  sections = [],
  sourceSectionId,
  targetSectionId,
  sourceQuestionId,
  targetQuestionId,
) => {
  const safeSourceSectionId = toPositiveId(sourceSectionId);
  const safeTargetSectionId = toPositiveId(targetSectionId);
  if (!safeSourceSectionId || !safeTargetSectionId) {
    return {
      didReorder: false,
      nextSections: sections,
      affectedSectionIds: [],
    };
  }

  const sourceSection = sections.find(
    (section) => section.id === safeSourceSectionId,
  );
  const targetSection = sections.find(
    (section) => section.id === safeTargetSectionId,
  );

  if (!sourceSection || !targetSection) {
    return {
      didReorder: false,
      nextSections: sections,
      affectedSectionIds: [],
    };
  }

  const sourceQuestions = [...sourceSection.questions];
  const targetQuestions =
    safeSourceSectionId === safeTargetSectionId
      ? sourceQuestions
      : [...targetSection.questions];

  const fromIndex = sourceQuestions.findIndex(
    (question) => question.id === sourceQuestionId,
  );
  const toIndex = targetQuestions.findIndex(
    (question) => question.id === targetQuestionId,
  );

  if (fromIndex < 0 || toIndex < 0) {
    return {
      didReorder: false,
      nextSections: sections,
      affectedSectionIds: [],
    };
  }

  if (safeSourceSectionId === safeTargetSectionId && fromIndex === toIndex) {
    return {
      didReorder: false,
      nextSections: sections,
      affectedSectionIds: [],
    };
  }

  const [movedQuestion] = sourceQuestions.splice(fromIndex, 1);
  targetQuestions.splice(toIndex, 0, {
    ...movedQuestion,
    sectionId: safeTargetSectionId,
  });

  const nextSections = sections.map((section) => {
    if (
      section.id === safeSourceSectionId &&
      section.id === safeTargetSectionId
    ) {
      return {
        ...section,
        questions: sourceQuestions.map((question, index) => ({
          ...question,
          sectionId: section.id,
          orderIndex: index + 1,
        })),
      };
    }

    if (section.id === safeSourceSectionId) {
      return {
        ...section,
        questions: sourceQuestions.map((question, index) => ({
          ...question,
          sectionId: section.id,
          orderIndex: index + 1,
        })),
      };
    }

    if (section.id === safeTargetSectionId) {
      return {
        ...section,
        questions: targetQuestions.map((question, index) => ({
          ...question,
          sectionId: section.id,
          orderIndex: index + 1,
        })),
      };
    }

    return section;
  });

  return {
    didReorder: true,
    nextSections,
    affectedSectionIds:
      safeSourceSectionId === safeTargetSectionId
        ? [safeSourceSectionId]
        : [safeSourceSectionId, safeTargetSectionId],
  };
};

const extractQuestionsFromDraftSessionResult = (result) => {
  const aiExcelQuestions = Array.isArray(result?.aiExcelData?.questions)
    ? result.aiExcelData.questions
    : [];

  if (aiExcelQuestions.length > 0) {
    return aiExcelQuestions;
  }

  const manualQuestions = Array.isArray(result?.manualData?.questions)
    ? result.manualData.questions
    : [];

  if (manualQuestions.length > 0) {
    return manualQuestions;
  }

  return Array.isArray(result?.questions) ? result.questions : [];
};

const inferSectionTypeFromQuestions = (questions = []) => {
  const list = Array.isArray(questions) ? questions : [];
  if (!list.length) return SECTION_TYPE.MIXED;

  const hasEssay = list.some((question) => question?.type === "ESSAY");
  const hasObjective = list.some((question) => question?.type !== "ESSAY");

  if (hasEssay && hasObjective) return SECTION_TYPE.MIXED;
  if (hasEssay) return SECTION_TYPE.ESSAY;
  return SECTION_TYPE.OBJECTIVE;
};

const mapDraftSessionQuestionsToSections = (
  questions = [],
  preferredSectionId = null,
) => {
  const mappedQuestions = (Array.isArray(questions) ? questions : []).map(
    (item, index) => toQuestionFromDraft(item, index),
  );

  if (mappedQuestions.length === 0) {
    return [];
  }

  const fallbackSectionId = toPositiveId(preferredSectionId) || 1;
  const sectionMap = new Map();

  mappedQuestions.forEach((question, index) => {
    const safeSectionId = toPositiveId(question?.sectionId) || fallbackSectionId;
    const existingSection = sectionMap.get(safeSectionId);

    if (!existingSection) {
      sectionMap.set(safeSectionId, {
        id: safeSectionId,
        title: sectionMap.size === 0 ? "Danh sách câu hỏi" : `Phần ${sectionMap.size + 1}`,
        sectionType: SECTION_TYPE.MIXED,
        orderIndex: sectionMap.size + 1,
        questions: [
          {
            ...question,
            sectionId: safeSectionId,
            orderIndex: toSafeOrderIndex(question?.orderIndex, index + 1),
          },
        ],
      });
      return;
    }

    existingSection.questions.push({
      ...question,
      sectionId: safeSectionId,
      orderIndex: toSafeOrderIndex(
        question?.orderIndex,
        existingSection.questions.length + 1,
      ),
    });
  });

  return [...sectionMap.values()]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((section) => {
      const sortedQuestions = sortQuestionsByOrderIndex(section.questions).map(
        (question, questionIndex) => ({
          ...question,
          sectionId: section.id,
          orderIndex: toSafeOrderIndex(question?.orderIndex, questionIndex + 1),
        }),
      );

      return {
        ...section,
        questions: sortedQuestions,
        sectionType: inferSectionTypeFromQuestions(sortedQuestions),
      };
    });
};

const loadDraftSessionSections = async (
  sessionId,
  scope = {},
  preferredSectionId = null,
) => {
  const pageSize = 200;
  let page = 1;
  let totalPages = 1;
  const allQuestions = [];

  while (page <= totalPages) {
    const response = await assignmentApi.getDraftSession(sessionId, scope, {
      page,
      size: pageSize,
    });

    const result = response?.result || {};
    const pageQuestions = extractQuestionsFromDraftSessionResult(result);
    if (pageQuestions.length > 0) {
      allQuestions.push(...pageQuestions);
    }

    const paginationSource =
      result?.aiExcelData || result?.manualData || result || {};
    const parsedTotalPages = Number(paginationSource?.totalPages);
    totalPages =
      Number.isFinite(parsedTotalPages) && parsedTotalPages > 0
        ? parsedTotalPages
        : page;

    if (page >= totalPages) {
      break;
    }

    page += 1;
  }

  return mapDraftSessionQuestionsToSections(allQuestions, preferredSectionId);
};

const getDraftWorkspaceCached = (
  sessionId,
  refreshTick,
  {
    isBankMode = false,
    scope = {},
    preferredSectionId = null,
  } = {},
) => {
  const scopeKey = `${scope?.bankId || ""}:${scope?.assignmentId || ""}`;
  const cacheKey = `${sessionId}:${refreshTick}:${isBankMode ? "bank" : "assignment"}:${scopeKey}:${preferredSectionId || ""}`;
  const cached = workspacePreviewRequestCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const requestPromise = (isBankMode
    ? loadDraftSessionSections(sessionId, scope, preferredSectionId).then(
        (sections) => ({
          result: {
            sections,
          },
        }),
      )
    : assignmentApi.getDraftWorkspace(sessionId)
  )
    .catch((error) => {
      workspacePreviewRequestCache.delete(cacheKey);
      throw error;
    });

  workspacePreviewRequestCache.set(cacheKey, requestPromise);

  if (workspacePreviewRequestCache.size > 30) {
    const oldestKey = workspacePreviewRequestCache.keys().next().value;
    workspacePreviewRequestCache.delete(oldestKey);
  }

  return requestPromise;
};

const normalizeRichText = (value) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const toQuestionFromDraft = (item, index) => {
  // If item is already normalized (has `prompt` field), return it as-is to
  // avoid double-normalization when this function is called a second time in
  // bank mode (loadWorkspacePreview calls it again on already-mapped data).
  if (item && typeof item.prompt === "string" && item.type) {
    return {
      id:
        toPositiveId(item?.id) ||
        toPositiveId(item?.itemId) ||
        Date.now() + Math.random() + index,
      type: item.type,
      prompt: item.prompt,
      opts: Array.isArray(item.opts) ? item.opts : undefined,
      cor: item.cor,
      ans: item.ans,
      sampleAnswer: item.sampleAnswer || "",
      cognitiveLevel: item.cognitiveLevel || "",
      sectionId: toPositiveId(item?.sectionId),
      orderIndex: toSafeOrderIndex(item?.orderIndex, index + 1),
      status: String(item?.status || "").toUpperCase(),
      errors: Array.isArray(item?.errors) ? item.errors : [],
    };
  }

  const questionData = item?.questionData || item || {};
  // Support both raw API shape (questionType) and already-normalized shape (type)
  const type = normalizeQuestionTypeFromApi(
    questionData?.questionType ?? item?.type ?? "",
  );
  const rawOptions = Array.isArray(questionData?.options)
    ? questionData.options
    : [];
  const sectionId = toPositiveId(item?.sectionId);
  const cognitiveLevel = normalizeCognitiveLevelFromApi(
    questionData?.cognitiveLevel ?? item?.cognitiveLevel,
  );
  const sampleAnswer = normalizeRichText(
    questionData?.sampleAnswer ?? item?.sampleAnswer ?? "",
  );
  const orderIndex = toSafeOrderIndex(
    item?.orderIndex ?? questionData?.orderIndex,
    index + 1,
  );

  const id =
    toPositiveId(item?.id) ||
    toPositiveId(item?.itemId) ||
    toPositiveId(item?.rowNumber) ||
    Date.now() + Math.random() + index;

  // Support both raw API `content` and already-normalized `prompt`
  const contentText = questionData?.content || item?.prompt || "";

  if (type === "MULTIPLE_CHOICE") {
    const options =
      rawOptions.length > 0
        ? rawOptions.map((option) => normalizeRichText(option?.content || ""))
        : ["", "", "", ""];
    const correctIndex = rawOptions.findIndex((option) =>
      isOptionCorrect(option),
    );

    return {
      id,
      type,
      prompt: normalizeRichText(contentText),
      opts: options,
      cor: correctIndex >= 0 ? correctIndex : 0,
      sampleAnswer,
      cognitiveLevel,
      sectionId,
      orderIndex,
      status: String(item?.status || "").toUpperCase(),
      errors: Array.isArray(item?.errors) ? item.errors : [],
    };
  }

  if (type === "TRUE_FALSE") {
    const correctOption = rawOptions.find((option) => isOptionCorrect(option));
    const normalizedText = String(correctOption?.content || "")
      .trim()
      .toLowerCase();
    const isTrue =
      normalizedText === "đúng" ||
      normalizedText === "dung" ||
      normalizedText === "true";

    return {
      id,
      type,
      prompt: normalizeRichText(contentText),
      cor: isTrue,
      sampleAnswer,
      cognitiveLevel,
      sectionId,
      orderIndex,
      status: String(item?.status || "").toUpperCase(),
      errors: Array.isArray(item?.errors) ? item.errors : [],
    };
  }

  if (type === "FILL_IN_BLANK") {
    const answerOption = rawOptions.find((option) => isOptionCorrect(option));

    return {
      id,
      type,
      prompt: normalizeRichText(contentText),
      ans: normalizeRichText(
        answerOption?.content ?? questionData?.sampleAnswer ?? "",
      ),
      sampleAnswer,
      cognitiveLevel,
      sectionId,
      orderIndex,
      status: String(item?.status || "").toUpperCase(),
      errors: Array.isArray(item?.errors) ? item.errors : [],
    };
  }

  return {
    id,
    type: "ESSAY",
    prompt: normalizeRichText(contentText),
    sampleAnswer,
    cognitiveLevel,
    sectionId,
    orderIndex,
    status: String(item?.status || "").toUpperCase(),
    errors: Array.isArray(item?.errors) ? item.errors : [],
  };
};

const I = {
  Sparkles: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z" />
    </svg>
  ),
  Send: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Upload: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  File: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  X: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Check: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowL: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Trash: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  Edit: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Save: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
    </svg>
  ),
  Bot: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="11" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  User: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Refresh: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  ),
  Copy: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  ChevL: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevR: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Zap: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Undo: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  ),
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap');:root{--p:#2563EB;--pd:#1D4ED8;--pl:#EFF6FF;--plr:#F8FAFF;--pg:rgba(37,99,235,.10);--ps:rgba(37,99,235,.22);--gr:linear-gradient(135deg,#3B82F6,#2563EB 50%,#1D4ED8);--bg:#F7F8FC;--card:#FFF;--inp:#F5F7FB;--hov:#EDF2FF;--t:#1E293B;--t2:#475569;--t3:#94A3B8;--inv:#FFF;--gn:#10B981;--gnl:#ECFDF5;--or:#F59E0B;--orl:#FFFBEB;--rd:#EF4444;--rdl:#FEF2F2;--pu:#8B5CF6;--pul:#F5F3FF;--b:#E2E8F0;--bl:#F1F5F9;--ss:0 1px 3px rgba(30,41,59,.04);--sm:0 4px 14px rgba(30,41,59,.07);--rs:10px;--rm:12px;--rl:16px;--rxl:20px;--f:'Be Vietnam Pro',sans-serif;--fd:'Be Vietnam Pro',sans-serif;--fm:'JetBrains Mono',monospace;--e:cubic-bezier(.4,0,.2,1)}*{box-sizing:border-box;margin:0;padding:0}body{font-family:var(--f);background:var(--bg);color:var(--t);-webkit-font-smoothing:antialiased}.app{display:flex;height:100vh;overflow:hidden}.left{flex:1;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--b)}.right{width:380px;display:flex;flex-direction:column;background:var(--card);flex-shrink:0}.top{height:54px;background:var(--card);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex-shrink:0}.top-l{display:flex;align-items:center;gap:12px}.bk{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid var(--b);border-radius:var(--rs);background:var(--card);font-size:11px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;transition:all .15s var(--e)}.bk:hover{border-color:var(--p);color:var(--p)}.top-t{font-family:var(--fd);font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px}.top-t svg{color:var(--p)}.top-r{display:flex;gap:6px}.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 16px;border-radius:var(--rm);font-size:11px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;transition:all .2s var(--e)}.btn-p{background:var(--gr);color:var(--inv);box-shadow:0 2px 10px var(--ps)}.btn-p:hover{transform:translateY(-1px)}.btn-g{background:var(--card);color:var(--t2);border:1.5px solid var(--b)}.btn-g:hover{border-color:var(--p);color:var(--p);background:var(--hov)}.scroll{flex:1;overflow-y:auto;padding:22px;background:var(--bg)}.cfg{background:var(--card);border:1px solid var(--b);border-radius:var(--rxl);padding:24px;box-shadow:var(--ss);margin-bottom:18px;animation:fu .35s ease both}@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.cfg-t{font-family:var(--fd);font-size:17px;font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:7px}.cfg-d{font-size:12px;color:var(--t3);margin-bottom:18px;line-height:1.5}.fl{display:block;font-size:11px;font-weight:700;color:var(--t2);margin-bottom:6px}.fl .rq{color:var(--rd)}.fg{margin-bottom:16px}.cg{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.cp{padding:10px 12px;border:1.5px solid var(--b);border-radius:var(--rm);cursor:pointer;transition:all .2s var(--e);background:var(--card);text-align:left}.cp:hover{border-color:var(--p);background:var(--hov)}.cp.on{border-color:var(--p);background:var(--pl);box-shadow:0 0 0 3px var(--pg)}.cp-n{font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px;margin-bottom:1px}.cp-dot{width:7px;height:7px;border-radius:50%}.cp-d{font-size:9px;color:var(--t3);font-weight:500}.qr{display:flex;align-items:center;gap:10px}.qb{width:34px;height:34px;border-radius:var(--rs);border:1.5px solid var(--b);background:var(--card);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;transition:all .15s var(--e)}.qb:hover{border-color:var(--p);color:var(--p)}.qv{font-size:22px;font-weight:800;font-family:var(--fm);min-width:36px;text-align:center}.qtg{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.qtp{padding:9px;border:1.5px solid var(--b);border-radius:var(--rm);cursor:pointer;transition:all .2s var(--e);background:var(--card);text-align:center}.qtp:hover{border-color:var(--p);background:var(--hov)}.qtp.on{border-color:var(--p);background:var(--pl);box-shadow:0 0 0 3px var(--pg)}.qti{font-size:10px;font-weight:800;color:var(--t3);background:var(--bl);width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 5px}.qtp.on .qti{background:var(--p);color:var(--inv)}.qtl{font-size:10px;font-weight:700;color:var(--t2)}.ta{width:100%;padding:9px 12px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp);resize:vertical;min-height:60px;line-height:1.6;transition:all .2s var(--e)}.ta:focus{outline:none;border-color:var(--p);background:var(--card);box-shadow:0 0 0 3px var(--pg)}.uz{border:2px dashed var(--b);border-radius:var(--rm);padding:24px;text-align:center;cursor:pointer;transition:all .2s var(--e);background:var(--inp)}.uz:hover{border-color:var(--p);background:var(--hov)}.uz.has{border-color:var(--gn);background:var(--gnl);border-style:solid}.uz-fi{display:flex;align-items:center;gap:8px;justify-content:center}.uz-fn{font-size:13px;font-weight:600;color:var(--gn)}.uz-rm{background:none;border:none;color:var(--rd);cursor:pointer}.uz-t{font-size:11px;color:var(--t3);font-weight:500}.uz-t strong{color:var(--p);font-weight:700}.st{display:flex;margin-bottom:12px;background:var(--inp);border-radius:var(--rm);padding:3px;border:1px solid var(--b)}.stb{flex:1;padding:7px;border-radius:var(--rs);font-size:11px;font-weight:700;font-family:var(--f);color:var(--t3);cursor:pointer;border:none;background:none;text-align:center;transition:all .15s var(--e)}.stb.on{background:var(--card);color:var(--p);box-shadow:var(--ss)}.gbtn{width:100%;padding:13px;border:none;border-radius:var(--rm);background:var(--gr);color:var(--inv);font-size:13px;font-weight:700;font-family:var(--f);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .25s var(--e);box-shadow:0 4px 16px var(--ps);overflow:hidden;position:relative}.gbtn:hover{transform:translateY(-2px)}.gbtn:disabled{opacity:.5;cursor:not-allowed;transform:none}.gbtn .shim{position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);animation:sh 2s infinite}@keyframes sh{to{left:100%}}.qc{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:12px;transition:all .2s var(--e);animation:fu .25s ease both;overflow:hidden}.qc:hover{border-color:var(--p);box-shadow:var(--sm)}.qc.editing{border-color:var(--or);box-shadow:0 0 0 3px rgba(245,158,11,.1),var(--sm)}.qc-main{padding:18px 20px}.qc-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}.qc-n{min-width:28px;height:28px;border-radius:50%;background:var(--p);color:var(--inv);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}.qc.editing .qc-n{background:var(--or)}.qc-body{flex:1}.qc-tb{padding:2px 7px;border-radius:10px;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;display:inline-block;margin-bottom:4px}.qc-tb.mc{background:var(--pl);color:var(--p)}.qc-tb.tf{background:var(--gnl);color:var(--gn)}.qc-tb.fb{background:var(--orl);color:var(--or)}.qc-tb.es{background:var(--pul);color:var(--pu)}.qc-pr{font-size:13px;font-weight:600;line-height:1.65;white-space:pre-line}.qc-opts{margin-top:8px;display:flex;flex-direction:column;gap:5px;margin-left:38px}.qc-opt{display:flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid var(--bl);border-radius:var(--rs);font-size:12px;color:var(--t2);font-weight:500;transition:all .15s var(--e)}.qc-opt.ok{border-color:var(--gn);background:var(--gnl);color:var(--gn);font-weight:600}.qc-ol{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--b);font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--t3);flex-shrink:0}.qc-opt.ok .qc-ol{border-color:var(--gn);background:var(--gn);color:var(--inv)}.qc-tf{margin-top:8px;margin-left:38px;font-size:12px;font-weight:600}.ctag{color:var(--gn);background:var(--gnl);padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700}.qc-fb{margin-top:6px;margin-left:38px;font-size:11px;color:var(--t3);font-weight:600}.qc-fb span{color:var(--p);font-weight:700;background:var(--pl);padding:1px 7px;border-radius:5px;margin-left:3px}.qc-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 20px;border-top:1px solid var(--bl);background:var(--bg)}.qc-bar-l,.qc-bar-r{display:flex;gap:4px}.ab{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:var(--rs);border:none;background:none;font-size:10px;font-weight:600;font-family:var(--f);color:var(--t3);cursor:pointer;transition:all .15s var(--e)}.ab:hover{background:var(--hov);color:var(--p)}.ab.ed{color:var(--or)}.ab.ed:hover{background:var(--orl)}.ab.dng:hover{background:var(--rdl);color:var(--rd)}.ab.sv{color:var(--gn)}.ab.sv:hover{background:var(--gnl)}.ed-prompt{width:100%;padding:8px 12px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:13px;font-family:var(--f);font-weight:600;color:var(--t);background:#FFFDF7;min-height:48px;resize:vertical;line-height:1.6}.ed-prompt:focus{outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.1)}.ed-opt-row{display:flex;align-items:center;gap:7px;margin-bottom:5px}.ed-opt-input{flex:1;padding:7px 10px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp)}.ed-opt-input:focus{outline:none;border-color:var(--or)}.ed-opt-radio{width:20px;height:20px;border-radius:50%;border:2px solid var(--b);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s var(--e)}.ed-opt-radio.on{border-color:var(--gn);background:var(--gn);color:var(--inv)}.ed-opt-radio:hover{border-color:var(--gn)}.ed-lbl{font-size:10px;font-weight:700;color:var(--t3);margin:8px 0 5px 38px;text-transform:uppercase;letter-spacing:.04em}.ed-tf{display:flex;gap:8px;margin-left:38px}.ed-tfb{flex:1;padding:9px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:12px;font-weight:700;text-align:center;cursor:pointer;background:var(--card);color:var(--t3);font-family:var(--f);transition:all .15s var(--e)}.ed-tfb:hover{border-color:var(--gn)}.ed-tfb.on{border-color:var(--gn);background:var(--gnl);color:var(--gn)}.ed-ans{margin-left:38px;width:calc(100% - 38px);padding:7px 10px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:12px;font-family:var(--fm);color:var(--t);background:#FFFDF7}.ed-ans:focus{outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.1)}.pag{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:14px}.pg{width:32px;height:32px;border-radius:var(--rs);border:1.5px solid var(--b);background:var(--card);font-size:11px;font-weight:700;font-family:var(--f);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--e)}.pg:hover{border-color:var(--p);color:var(--p)}.pg.on{background:var(--p);color:var(--inv);border-color:var(--p);box-shadow:0 2px 8px var(--ps)}.pg:disabled{opacity:.3;cursor:not-allowed}.rh{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.rt{font-family:var(--fd);font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px}.rc{font-size:11px;font-weight:700;color:var(--p);background:var(--pl);padding:2px 9px;border-radius:16px}.skel{background:linear-gradient(90deg,var(--bl) 25%,var(--bg) 50%,var(--bl) 75%);background-size:200% 100%;animation:skl 1.5s infinite;border-radius:var(--rm);height:70px;margin-bottom:10px}@keyframes skl{to{background-position:-200% 0}}.ch-h{height:54px;border-bottom:1px solid var(--b);display:flex;align-items:center;padding:0 18px;gap:9px;flex-shrink:0;background:var(--plr)}.ch-ic{width:30px;height:30px;border-radius:50%;background:var(--gr);color:var(--inv);display:flex;align-items:center;justify-content:center}.ch-hi h3{font-size:13px;font-weight:700}.ch-hi p{font-size:9px;color:var(--t3)}.ch-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px;background:var(--bg)}.ch-m{display:flex;gap:8px;max-width:90%;animation:fu .2s ease both}.ch-m.usr{align-self:flex-end;flex-direction:row-reverse}.ch-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}.ch-av.bt{background:var(--gr);color:var(--inv)}.ch-av.hm{background:var(--b);color:var(--t2)}.ch-bb{padding:9px 12px;border-radius:var(--rm);font-size:12px;line-height:1.6;font-weight:500}.ch-m.bot .ch-bb{background:var(--card);border:1px solid var(--b);border-top-left-radius:3px}.ch-m.usr .ch-bb{background:var(--p);color:var(--inv);border-top-right-radius:3px}.ch-tm{font-size:8px;color:var(--t3);margin-top:3px}.ch-m.usr .ch-tm{text-align:right}.ch-sug{display:flex;flex-wrap:wrap;gap:5px;padding:0 16px 8px}.ch-sg{padding:5px 10px;border:1.5px solid var(--b);border-radius:16px;font-size:10px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;background:var(--card);transition:all .15s var(--e)}.ch-sg:hover{border-color:var(--p);color:var(--p);background:var(--hov)}.ch-inp{padding:10px 14px;border-top:1px solid var(--b);background:var(--card);flex-shrink:0}.ch-ir{display:flex;gap:6px;align-items:flex-end}.ch-ta{flex:1;padding:8px 12px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp);resize:none;min-height:36px;max-height:80px;line-height:1.5}.ch-ta:focus{outline:none;border-color:var(--p);box-shadow:0 0 0 3px var(--pg)}.ch-sd{width:36px;height:36px;border-radius:var(--rm);border:none;background:var(--gr);color:var(--inv);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px var(--ps);transition:all .2s var(--e)}.ch-sd:hover{transform:translateY(-1px)}.ch-sd:disabled{opacity:.4;cursor:not-allowed;transform:none}.ch-ht{font-size:9px;color:var(--t3);margin-top:4px;text-align:center}.typing{display:flex;gap:3px;padding:6px 12px}.td{width:5px;height:5px;border-radius:50%;background:var(--t3);animation:tb 1.4s infinite both}.td:nth-child(2){animation-delay:.15s}.td:nth-child(3){animation-delay:.3s}@keyframes tb{0%,80%,100%{transform:scale(0);opacity:.4}40%{transform:scale(1);opacity:1}}@media(max-width:900px){.right{display:none}.left{border:none}}`;

const PP = 5,
  LT = "ABCDEFGH",
  TC = {
    MULTIPLE_CHOICE: "mc",
    TRUE_FALSE: "tf",
    FILL_IN_BLANK: "fb",
    ESSAY: "es",
  },
  TL = {
    MULTIPLE_CHOICE: "Trắc nghiệm",
    TRUE_FALSE: "Đúng/Sai",
    FILL_IN_BLANK: "Điền khuyết",
    ESSAY: "Tự luận",
  };

const CreateAssignmentAiPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { adjustAiRequestUsage } = useAuth();

  const bankId = toPositiveId(searchParams.get("bankId"));
  const assignmentId = toPositiveId(searchParams.get("assignmentId"));
  const isBankMode = Boolean(bankId) && !assignmentId;
  const initialFormat = String(searchParams.get("format") || "")
    .trim()
    .toUpperCase();
  const initialSectionId = toPositiveId(searchParams.get("sectionId"));
  const initialSessionId = toPositiveId(searchParams.get("sessionId"));
  const draftSessionStorageKey = assignmentId
    ? `learnify:assignment-ai:session:${assignmentId}`
    : null;
  const assignmentSectionsStorageKey = assignmentId
    ? `learnify:assignment-ai:sections:${assignmentId}`
    : null;

  const storedDraftSessionId = (() => {
    if (!draftSessionStorageKey || typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(draftSessionStorageKey);
    return toPositiveId(raw);
  })();

  const storedAssignmentSections = (() => {
    if (!assignmentSectionsStorageKey || typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.sessionStorage.getItem(assignmentSectionsStorageKey);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((section, index) => {
          const id = toPositiveId(section?.id || section?.sectionId);
          if (!id) return null;

          return {
            id,
            title: String(section?.title || "").trim() || `Phần ${index + 1}`,
            sectionType: normalizeSectionType(section?.sectionType),
          };
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  })();

  const [sectionConfigs, setSectionConfigs] = useState({});
  const assignmentFormat = normalizeFormat(initialFormat);
  const [addP, setAddP] = useState("");
  const [srcT, setSrcT] = useState("file");
  const [aiF, setAiF] = useState(null);
  const [raw, setRaw] = useState("");
  const [phase, setPhase] = useState("config");
  const [draftSessionId, setDraftSessionId] = useState(
    initialSessionId || storedDraftSessionId,
  );
  const [assignmentSections, setAssignmentSections] = useState(
    storedAssignmentSections,
  );
  const [workspaceSections, setWorkspaceSections] = useState([]);
  const [workspaceRefreshTick, setWorkspaceRefreshTick] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState(
    initialSectionId || toPositiveId(storedAssignmentSections?.[0]?.id),
  );
  const [qs, setQs] = useState([]);
  const [requestError, setRequestError] = useState("");
  const [pg, setPg] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [draggingQuestion, setDraggingQuestion] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [reorderSaving, setReorderSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionType, setNewSectionType] = useState(SECTION_TYPE.OBJECTIVE);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [editingSectionType, setEditingSectionType] = useState(
    SECTION_TYPE.OBJECTIVE,
  );
  const [sectionSaving, setSectionSaving] = useState(false);
  const [msgs, setMsgs] = useState([
    {
      role: "bot",
      text: "Chào thầy/cô! Tôi là trợ lý AI Learnify. Sau khi tạo câu hỏi, thầy/cô có thể nhờ tôi chỉnh sửa hoặc bấm ✏️ để sửa thủ công.",
      time: "Bây giờ",
    },
  ]);
  const [chatIn, setChatIn] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEnd = useRef(null);
  const fRef = useRef(null);
  const toastTimerRef = useRef(null);
  const publishNavigateTimerRef = useRef(null);
  const editSaveTimerRef = useRef(null);
  const editAutoSaveSnapshotRef = useRef("");

  const showToast = (msg, type = "success") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ msg, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  const selectedSection = assignmentSections.find(
    (section) => toPositiveId(section?.id) === toPositiveId(selectedSectionId),
  );
  const canManageSections = Boolean(assignmentId) && !isBankMode;
  const requiresMixedSectionSetup =
    canManageSections && assignmentFormat === "MIXED";
  const sectionSetupReadyForConfig =
    !requiresMixedSectionSetup || assignmentSections.length > 0;
  const allowedQuestionTypes = getAllowedQuestionTypesBySectionType(
    normalizeSectionType(selectedSection?.sectionType),
  );
  const allowedQuestionTypesKey = allowedQuestionTypes.join("|");
  const activeSectionConfigKey = toSectionConfigKey(selectedSectionId);
  const activeSectionConfig = sectionConfigs?.[activeSectionConfigKey] || {};
  const qts = normalizeQuestionTypesBySection(
    activeSectionConfig.qts,
    allowedQuestionTypes,
  );
  const typeRequirements = buildTypeRequirementsByQuestionTypes(
    qts,
    activeSectionConfig.typeRequirements,
  );

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (publishNavigateTimerRef.current) {
        clearTimeout(publishNavigateTimerRef.current);
      }
      if (editSaveTimerRef.current) {
        clearTimeout(editSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const validQuestionIdSet = new Set(
      qs.map((question) => toPositiveId(question?.id)).filter(Boolean),
    );

    setSelectedQuestionIds((prev) => {
      const next = prev.filter((id) => validQuestionIdSet.has(id));

      if (next.length === prev.length) {
        let same = true;
        for (let index = 0; index < next.length; index += 1) {
          if (next[index] !== prev[index]) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }

      return next;
    });
  }, [qs]);

  useEffect(() => {
    if (!draftSessionStorageKey || typeof window === "undefined") return;

    const safeSessionId = toPositiveId(draftSessionId);
    if (!safeSessionId) {
      window.sessionStorage.removeItem(draftSessionStorageKey);
      return;
    }

    window.sessionStorage.setItem(
      draftSessionStorageKey,
      String(safeSessionId),
    );
  }, [draftSessionId, draftSessionStorageKey]);

  useEffect(() => {
    if (!assignmentSectionsStorageKey || typeof window === "undefined") return;

    const payload = assignmentSections
      .map((section) => {
        const id = toPositiveId(section?.id);
        if (!id) return null;

        return {
          id,
          title: String(section?.title || "").trim() || `Phần ${id}`,
          sectionType: normalizeSectionType(section?.sectionType),
        };
      })
      .filter(Boolean);

    if (payload.length > 0) {
      window.sessionStorage.setItem(
        assignmentSectionsStorageKey,
        JSON.stringify(payload),
      );
      return;
    }

    window.sessionStorage.removeItem(assignmentSectionsStorageKey);
  }, [assignmentSections, assignmentSectionsStorageKey]);

  const applyAssignmentSectionsState = (
    sectionsInput = [],
    preferredSectionId = null,
  ) => {
    const mappedSections = mapSectionSummaries(sectionsInput);
    setAssignmentSections(mappedSections);
    setSelectedSectionId((prev) => {
      const safePreferred =
        toPositiveId(preferredSectionId) ||
        toPositiveId(prev) ||
        toPositiveId(initialSectionId);

      if (mappedSections.length === 0) return null;

      const matched = mappedSections.find(
        (section) => section.id === safePreferred,
      );

      return matched ? matched.id : mappedSections[0].id;
    });

    return mappedSections;
  };

  const refreshSectionsFromWorkspace = async (preferredSectionId = null) => {
    const safeSessionId = toPositiveId(draftSessionId);
    if (!safeSessionId) return [];

    const response = await assignmentApi.getDraftWorkspace(safeSessionId);
    const sections = Array.isArray(response?.result?.sections)
      ? response.result.sections
      : [];

    return applyAssignmentSectionsState(sections, preferredSectionId);
  };

  useEffect(() => {
    if (toPositiveId(draftSessionId) || isBankMode || !assignmentId) return;

    let alive = true;

    const loadPendingSession = async () => {
      try {
        const response = await assignmentApi.getPendingSession({
          assignmentId,
          bankId,
          sessionType: DRAFT_SESSION_TYPE.AI_GENERATION,
        });
        if (!alive) return;

        const safeSessionId = toPositiveId(
          response?.result?.id ||
            response?.result?.sessionId ||
            response?.result,
        );

        if (safeSessionId) {
          setDraftSessionId(safeSessionId);
        }
      } catch {
        // Keep existing fallback data from sessionStorage/query when pending session is not found.
      }
    };

    loadPendingSession();

    return () => {
      alive = false;
    };
  }, [draftSessionId, isBankMode, assignmentId, bankId]);

  useEffect(() => {
    if (workspaceSections.length > 0) return;

    if (assignmentSections.length > 0) {
      setSelectedSectionId((prev) => {
        const safePrev = toPositiveId(prev) || toPositiveId(initialSectionId);
        const matched = assignmentSections.find(
          (section) => section.id === safePrev,
        );

        return matched ? matched.id : assignmentSections[0].id;
      });
      return;
    }

    const safeSectionId = toPositiveId(initialSectionId);
    if (!safeSectionId) return;

    const fallbackType =
      initialFormat === "ESSAY"
        ? "ESSAY"
        : initialFormat === "MULTIPLE_CHOICE"
          ? "OBJECTIVE"
          : "MIXED";

    setAssignmentSections((prev) => {
      const current = Array.isArray(prev)
        ? prev.find((section) => toPositiveId(section?.id) === safeSectionId)
        : null;

      return [
        {
          id: safeSectionId,
          title: String(current?.title || "").trim() || "Phần áp dụng",
          sectionType: normalizeSectionType(
            current?.sectionType || fallbackType,
          ),
        },
      ];
    });
    setSelectedSectionId(safeSectionId);
  }, [workspaceSections, initialSectionId, assignmentSections, initialFormat]);

  useEffect(() => {
    if (!allowedQuestionTypes.length) return;

    setSectionConfigs((prev) => {
      const current = prev?.[activeSectionConfigKey] || {};
      const normalizedQts = normalizeQuestionTypesBySection(
        current.qts,
        allowedQuestionTypes,
      );
      const normalizedRequirements = buildTypeRequirementsByQuestionTypes(
        normalizedQts,
        current.typeRequirements,
      );

      const sameQts =
        Array.isArray(current.qts) &&
        current.qts.length === normalizedQts.length &&
        current.qts.every((type, index) => type === normalizedQts[index]);

      const sameRequirements = normalizedQts.every((type) => {
        const prevRequirement = buildRequirementConfig(
          current.typeRequirements?.[type],
        );
        const nextRequirement = normalizedRequirements[type];
        return (
          prevRequirement.quantity === nextRequirement.quantity &&
          prevRequirement.cognitiveLevel === nextRequirement.cognitiveLevel
        );
      });

      if (sameQts && sameRequirements) {
        return prev;
      }

      return {
        ...prev,
        [activeSectionConfigKey]: {
          qts: normalizedQts,
          typeRequirements: normalizedRequirements,
        },
      };
    });
  }, [activeSectionConfigKey, allowedQuestionTypesKey]);

  useEffect(() => {
    const safeSessionId = toPositiveId(draftSessionId);
    if (!safeSessionId) {
      setWorkspaceSections([]);
      return;
    }

    let alive = true;

    const loadWorkspacePreview = async () => {
      try {
        const response = await getDraftWorkspaceCached(
          safeSessionId,
          workspaceRefreshTick,
          {
            isBankMode,
            scope: {
              bankId,
              assignmentId,
            },
            preferredSectionId: initialSectionId,
          },
        );
        if (!alive) return;

        const sections = Array.isArray(response?.result?.sections)
          ? response.result.sections
          : [];

        const normalizedSections = sections
          .map((section, sectionIndex) => {
            const safeSectionId = toPositiveId(
              section?.id || section?.sectionId,
            );
            if (!safeSectionId) return null;

            const draftQuestions = Array.isArray(section?.draftQuestions)
              ? section.draftQuestions
              : Array.isArray(section?.questions)
                ? section.questions
                : [];

            const questions = sortQuestionsByOrderIndex(
              draftQuestions.map((question, questionIndex) =>
                toQuestionFromDraft(
                  {
                    ...question,
                    sectionId: safeSectionId,
                  },
                  questionIndex,
                ),
              ),
            );

            return {
              id: safeSectionId,
              title:
                String(section?.title || "").trim() ||
                `Phần ${sectionIndex + 1}`,
              sectionType: normalizeSectionType(section?.sectionType),
              orderIndex: Number(section?.orderIndex ?? sectionIndex + 1),
              questions,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        setWorkspaceSections(normalizedSections);
        setAssignmentSections(
          normalizedSections.map(({ id, title, sectionType }) => ({
            id,
            title,
            sectionType,
          })),
        );

        if (normalizedSections.length > 0) {
          setSelectedSectionId((prev) => {
            const safePrev =
              toPositiveId(prev) || toPositiveId(initialSectionId);
            const matched = normalizedSections.find(
              (section) => section.id === safePrev,
            );

            return matched ? matched.id : normalizedSections[0].id;
          });
        }

        if (normalizedSections.length > 0) {
          const flatQuestions = flattenQuestionsBySections(normalizedSections);
          setQs(flatQuestions);
          setPg(1);
          setPhase("results");
        } else {
          setQs([]);
          setSelectedQuestionIds([]);
        }
      } catch {
        if (alive) {
          setWorkspaceSections([]);
        }
      }
    };

    loadWorkspacePreview();

    return () => {
      alive = false;
    };
  }, [
    assignmentId,
    bankId,
    draftSessionId,
    initialSectionId,
    isBankMode,
    workspaceRefreshTick,
  ]);

  const togQT = (v) => {
    if (!allowedQuestionTypes.includes(v)) return;

    setSectionConfigs((prev) => {
      const current = prev?.[activeSectionConfigKey] || {};
      const currentQts = normalizeQuestionTypesBySection(
        current.qts,
        allowedQuestionTypes,
      );
      const toggled = currentQts.includes(v)
        ? currentQts.filter((item) => item !== v)
        : [...currentQts, v];
      const normalizedQts = normalizeQuestionTypesBySection(
        toggled,
        allowedQuestionTypes,
      );

      return {
        ...prev,
        [activeSectionConfigKey]: {
          qts: normalizedQts,
          typeRequirements: buildTypeRequirementsByQuestionTypes(
            normalizedQts,
            current.typeRequirements,
          ),
        },
      };
    });
  };

  const setRequirementQuantity = (type, value) => {
    setSectionConfigs((prev) => {
      const current = prev?.[activeSectionConfigKey] || {};
      const currentQts = normalizeQuestionTypesBySection(
        current.qts,
        allowedQuestionTypes,
      );
      if (!currentQts.includes(type)) return prev;

      const nextRequirements = buildTypeRequirementsByQuestionTypes(
        currentQts,
        current.typeRequirements,
      );

      nextRequirements[type] = {
        ...nextRequirements[type],
        quantity: clampRequirementQuantity(value),
      };

      return {
        ...prev,
        [activeSectionConfigKey]: {
          qts: currentQts,
          typeRequirements: nextRequirements,
        },
      };
    });
  };

  const setRequirementCognitive = (type, value) => {
    setSectionConfigs((prev) => {
      const current = prev?.[activeSectionConfigKey] || {};
      const currentQts = normalizeQuestionTypesBySection(
        current.qts,
        allowedQuestionTypes,
      );
      if (!currentQts.includes(type)) return prev;

      const nextRequirements = buildTypeRequirementsByQuestionTypes(
        currentQts,
        current.typeRequirements,
      );

      nextRequirements[type] = {
        ...nextRequirements[type],
        cognitiveLevel: COG.some((level) => level.v === value)
          ? value
          : DEFAULT_REQUIREMENT_COGNITIVE,
      };

      return {
        ...prev,
        [activeSectionConfigKey]: {
          qts: currentQts,
          typeRequirements: nextRequirements,
        },
      };
    });
  };

  const selectedRequirements = qts
    .filter((type) => allowedQuestionTypes.includes(type))
    .map((type) => ({
      type,
      ...buildRequirementConfig(typeRequirements?.[type]),
    }));

  const startEditSection = (section) => {
    const safeSectionId = toPositiveId(section?.id);
    if (!safeSectionId) return;

    setEditingSectionId(safeSectionId);
    setEditingSectionTitle(String(section?.title || "").trim());
    setEditingSectionType(
      normalizeSectionType(section?.sectionType || SECTION_TYPE.OBJECTIVE),
    );
  };

  const cancelEditSection = () => {
    setEditingSectionId(null);
    setEditingSectionTitle("");
    setEditingSectionType(SECTION_TYPE.OBJECTIVE);
  };

  const handleCreateSection = async () => {
    if (sectionSaving) return;

    const safeAssignmentId = toPositiveId(assignmentId);
    if (!safeAssignmentId) {
      setRequestError("Thiếu assignmentId để tạo phần.");
      return;
    }

    const safeTitle = String(newSectionTitle || "").trim();
    if (!safeTitle) {
      setRequestError("Vui lòng nhập tiêu đề phần.");
      return;
    }

    setSectionSaving(true);
    try {
      const response = await assignmentApi.createSection(safeAssignmentId, {
        title: safeTitle,
        sectionType: newSectionType,
      });

      const createdSectionId = toPositiveId(
        response?.result?.id || response?.result?.sectionId,
      );

      const safeSessionId = toPositiveId(draftSessionId);
      if (safeSessionId) {
        await refreshSectionsFromWorkspace(createdSectionId);
        setWorkspaceRefreshTick((prev) => prev + 1);
      } else {
        const createdSection = mapSectionSummaries([response?.result])[0];
        if (createdSection) {
          setAssignmentSections((prev) => {
            const current = Array.isArray(prev) ? prev : [];
            const existingIndex = current.findIndex(
              (section) => section.id === createdSection.id,
            );

            if (existingIndex >= 0) {
              const next = [...current];
              next[existingIndex] = createdSection;
              return next;
            }

            return [...current, createdSection];
          });
          setSelectedSectionId(createdSection.id);
        }
      }

      setNewSectionTitle("");
      setNewSectionType(SECTION_TYPE.OBJECTIVE);
      setRequestError("");
      showToast(response?.message || "Đã tạo phần.");
    } catch (error) {
      setRequestError(
        error?.response?.data?.message || "Không thể tạo phần lúc này.",
      );
    } finally {
      setSectionSaving(false);
    }
  };

  const handleSaveSectionEdit = async () => {
    if (sectionSaving) return;

    const safeAssignmentId = toPositiveId(assignmentId);
    const safeSectionId = toPositiveId(editingSectionId);
    const safeTitle = String(editingSectionTitle || "").trim();

    if (!safeAssignmentId || !safeSectionId) {
      setRequestError("Thiếu assignmentId hoặc mã phần để cập nhật.");
      return;
    }

    if (!safeTitle) {
      setRequestError("Vui lòng nhập tiêu đề phần.");
      return;
    }

    setSectionSaving(true);
    try {
      const response = await assignmentApi.updateSection(
        safeAssignmentId,
        safeSectionId,
        {
          title: safeTitle,
          sectionType: editingSectionType,
          questions: [],
        },
      );

      const safeSessionId = toPositiveId(draftSessionId);
      if (safeSessionId) {
        await refreshSectionsFromWorkspace(safeSectionId);
        setWorkspaceRefreshTick((prev) => prev + 1);
      } else {
        const updatedSection = mapSectionSummaries([response?.result])[0];
        if (updatedSection) {
          setAssignmentSections((prev) =>
            (Array.isArray(prev) ? prev : []).map((section) =>
              section.id === updatedSection.id ? updatedSection : section,
            ),
          );
          setSelectedSectionId(updatedSection.id);
        }
      }

      cancelEditSection();
      setRequestError("");
      showToast(response?.message || "Đã cập nhật phần.");
    } catch (error) {
      setRequestError(
        error?.response?.data?.message || "Không thể cập nhật phần.",
      );
    } finally {
      setSectionSaving(false);
    }
  };

  const handleDeleteSection = async (section) => {
    if (sectionSaving) return;

    const safeAssignmentId = toPositiveId(assignmentId);
    const safeSectionId = toPositiveId(section?.id);
    if (!safeAssignmentId || !safeSectionId) {
      setRequestError("Thiếu assignmentId hoặc mã phần để xóa.");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa phần "${String(section?.title || "").trim() || `#${safeSectionId}`}"?`,
    );

    if (!confirmed) return;

    setSectionSaving(true);
    try {
      const response = await assignmentApi.deleteSection(
        safeAssignmentId,
        safeSectionId,
      );

      if (toPositiveId(editingSectionId) === safeSectionId) {
        cancelEditSection();
      }

      const safeSessionId = toPositiveId(draftSessionId);
      if (safeSessionId) {
        await refreshSectionsFromWorkspace();
        setWorkspaceRefreshTick((prev) => prev + 1);
      } else {
        setAssignmentSections((prev) =>
          (Array.isArray(prev) ? prev : []).filter(
            (item) => toPositiveId(item?.id) !== safeSectionId,
          ),
        );
        setSelectedSectionId((prev) =>
          toPositiveId(prev) === safeSectionId ? null : prev,
        );
      }

      setRequestError("");
      showToast(response?.message || "Đã xóa phần.");
    } catch (error) {
      setRequestError(error?.response?.data?.message || "Không thể xóa phần.");
    } finally {
      setSectionSaving(false);
    }
  };

  const buildApiRequirementsFromSectionConfig = (
    sectionConfig,
    allowedTypes,
  ) => {
    const configuredTypes = Array.isArray(sectionConfig?.qts)
      ? sectionConfig.qts
          .map((type) => String(type || "").trim())
          .filter((type, index, self) => {
            return (
              type &&
              self.indexOf(type) === index &&
              Array.isArray(allowedTypes) &&
              allowedTypes.includes(type)
            );
          })
      : [];

    if (!configuredTypes.length) return [];

    const normalizedRequirements = buildTypeRequirementsByQuestionTypes(
      configuredTypes,
      sectionConfig?.typeRequirements,
    );

    return configuredTypes
      .map((type) => {
        const requirement = buildRequirementConfig(
          normalizedRequirements[type],
        );
        return {
          type: API_QT_MAP[type] || type,
          quantity: clampRequirementQuantity(requirement.quantity),
          cognitiveLevel: API_COG_MAP[requirement.cognitiveLevel] || "APPLYING",
        };
      })
      .filter(
        (requirement) =>
          requirement.type &&
          requirement.cognitiveLevel &&
          Number.isFinite(requirement.quantity) &&
          requirement.quantity >= 1,
      );
  };

  const configuredGenerationTargets =
    assignmentSections.length > 0
      ? assignmentSections
          .map((section) => {
            const sectionId = toPositiveId(section?.id);
            if (!sectionId) return null;

            const sectionConfig =
              sectionConfigs[toSectionConfigKey(sectionId)] || {};
            const allowedTypes = getAllowedQuestionTypesBySectionType(
              normalizeSectionType(section?.sectionType),
            );
            const requirements = buildApiRequirementsFromSectionConfig(
              sectionConfig,
              allowedTypes,
            );

            if (!requirements.length) return null;

            return {
              sectionId,
              sectionTitle: String(section?.title || "").trim() || null,
              requirements,
            };
          })
          .filter(Boolean)
      : (() => {
          const requirements = selectedRequirements
            .map((requirement) => ({
              type: API_QT_MAP[requirement.type] || requirement.type,
              quantity: clampRequirementQuantity(requirement.quantity),
              cognitiveLevel:
                API_COG_MAP[requirement.cognitiveLevel] || "APPLYING",
            }))
            .filter(
              (requirement) =>
                requirement.type &&
                requirement.cognitiveLevel &&
                Number.isFinite(requirement.quantity) &&
                requirement.quantity >= 1,
            );

          if (!requirements.length) return [];

          return [
            {
              sectionId: toPositiveId(selectedSectionId) || undefined,
              sectionTitle: null,
              requirements,
            },
          ];
        })();

  const totalConfiguredQuestions = configuredGenerationTargets.reduce(
    (sum, target) =>
      sum +
      target.requirements.reduce(
        (innerSum, requirement) => innerSum + requirement.quantity,
        0,
      ),
    0,
  );

  const canGen =
    sectionSetupReadyForConfig &&
    configuredGenerationTargets.length > 0 &&
    totalConfiguredQuestions > 0 &&
    (aiF || raw.trim()) &&
    (!assignmentSections.length || toPositiveId(selectedSectionId));

  const doGen = async () => {
    if (phase === "loading") return;

    if (requiresMixedSectionSetup && assignmentSections.length === 0) {
      setRequestError(
        "Vui lòng tạo ít nhất một phần cho đề hỗn hợp trước khi sinh câu hỏi.",
      );
      return;
    }

    if (!configuredGenerationTargets.length) {
      setRequestError(
        "Vui lòng cấu hình ít nhất một loại câu hỏi cho ít nhất một phần.",
      );
      return;
    }

    if (totalConfiguredQuestions < 1) {
      setRequestError("Tổng số lượng câu hỏi phải lớn hơn hoặc bằng 1.");
      return;
    }

    if (assignmentSections.length > 0 && !toPositiveId(selectedSectionId)) {
      setRequestError("Vui lòng chọn phần để AI thêm câu hỏi vào.");
      return;
    }

    setRequestError("");
    setPhase("loading");

    try {
      let currentSessionId = toPositiveId(draftSessionId);
      let totalGenerated = 0;
      let successfulSections = 0;
      const warningMessages = [];
      const failedSections = [];

      const isSingleGenerationTarget = configuredGenerationTargets.length === 1;

      for (const target of configuredGenerationTargets) {
        adjustAiRequestUsage(1);

        try {
          const response = await assignmentApi.generateAiDraftSession(
            {
              requirements: target.requirements,
              sectionId: target.sectionId || undefined,
              additionalPrompt: addP,
              rawText: raw,
              file: aiF,
              sessionId: currentSessionId || undefined,
            },
            {
              bankId,
              assignmentId,
            },
          );

          const result = response?.result || {};
          const mappedQuestions = Array.isArray(result?.questions)
            ? result.questions.map((item, index) =>
                toQuestionFromDraft(item, index),
              )
            : [];
          const warnings = Array.isArray(result?.warnings)
            ? result.warnings.filter(Boolean)
            : [];
          const nextSessionId = toPositiveId(result?.sessionId);

          if (nextSessionId) {
            currentSessionId = nextSessionId;
          }

          successfulSections += 1;
          totalGenerated += mappedQuestions.length;
          if (warnings.length > 0) {
            warningMessages.push(...warnings);
          }
        } catch (error) {
          adjustAiRequestUsage(-1);

          const sectionLabel =
            target.sectionTitle ||
            `Phần ${String(target.sectionId || "").trim() || "?"}`;
          const message =
            error?.response?.data?.message ||
            "Không thể tạo câu hỏi cho phần này.";
          failedSections.push(
            isSingleGenerationTarget ? message : `${sectionLabel}: ${message}`,
          );
        }
      }

      if (successfulSections === 0) {
        const failMessage = failedSections.length
          ? failedSections.join(" | ")
          : "Không thể tạo câu hỏi với AI. Vui lòng thử lại.";

        setRequestError(failMessage);
        setPhase("config");
        setMsgs((p) => [
          ...p,
          {
            role: "bot",
            text: `Tạo câu hỏi thất bại: ${failMessage}`,
            time: "Vừa xong",
          },
        ]);
        return;
      }

      if (!currentSessionId) {
        setRequestError("Không thể khởi tạo phiên nháp AI.");
        setPhase("config");
        return;
      }

      setDraftSessionId(currentSessionId);
      setPhase("results");
      setWorkspaceRefreshTick((prev) => prev + 1);
      setPg(1);
      setEditId(null);
      setEditData(null);
      setSelectedQuestionIds([]);
      setSectionConfigs({});

      setMsgs((p) => [
        ...p,
        {
          role: "bot",
          text: `Đã xử lý tạo câu hỏi cho ${configuredGenerationTargets.length} phần.${totalGenerated ? `\nSinh mới ${totalGenerated} câu hỏi.` : ""}${warningMessages.length ? `\nCảnh báo: ${warningMessages.join("; ")}` : ""}${failedSections.length ? `\nPhần lỗi: ${failedSections.join(" | ")}` : ""}\nBạn có thể tiếp tục chọn format mới để tạo thêm.`,
          time: "Vừa xong",
        },
      ]);

      if (failedSections.length > 0) {
        setRequestError(failedSections.join(" | "));
      } else {
        setRequestError("");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        "Không thể tạo câu hỏi với AI. Vui lòng thử lại.";

      setRequestError(message);
      setPhase("config");
      setMsgs((p) => [
        ...p,
        {
          role: "bot",
          text: `Tạo câu hỏi thất bại: ${message}`,
          time: "Vừa xong",
        },
      ]);
    }
  };
  const getQuestionEditSnapshot = (question = {}) =>
    JSON.stringify({
      id: toPositiveId(question?.id) || null,
      type: String(question?.type || ""),
      prompt: String(question?.prompt || ""),
      opts: Array.isArray(question?.opts)
        ? question.opts.map((option) => String(option || ""))
        : [],
      cor:
        question?.cor === true || question?.cor === false
          ? question.cor
          : Number.isFinite(Number(question?.cor))
            ? Number(question.cor)
            : null,
      ans: String(question?.ans || ""),
      sampleAnswer: String(question?.sampleAnswer || ""),
      cognitiveLevel: String(question?.cognitiveLevel || ""),
      sectionId: toPositiveId(question?.sectionId) || null,
      defaultPoints: Number.isFinite(Number(question?.defaultPoints))
        ? Number(question.defaultPoints)
        : null,
    });

  const applyEditedQuestionToLocalState = (sourceQuestionId, nextQuestion) => {
    const safeSourceId = toPositiveId(sourceQuestionId);
    const safeNextId = toPositiveId(nextQuestion?.id);

    const isMatchedQuestion = (question) => {
      const safeQuestionId = toPositiveId(question?.id);
      if (safeSourceId && safeQuestionId === safeSourceId) return true;
      if (safeNextId && safeQuestionId === safeNextId) return true;
      return false;
    };

    setQs((prev) =>
      (Array.isArray(prev) ? prev : []).map((question) =>
        isMatchedQuestion(question) ? nextQuestion : question,
      ),
    );

    setWorkspaceSections((prev) =>
      (Array.isArray(prev) ? prev : []).map((section) => ({
        ...section,
        questions: (Array.isArray(section?.questions)
          ? section.questions
          : []
        ).map((question) =>
          isMatchedQuestion(question) ? nextQuestion : question,
        ),
      })),
    );

    if (safeSourceId && safeNextId && safeSourceId !== safeNextId) {
      setSelectedQuestionIds((prev) =>
        prev.map((id) => (id === safeSourceId ? safeNextId : id)),
      );
    }
  };

  const persistEditedQuestion = async (
    questionInput,
    { showErrorToast = true } = {},
  ) => {
    if (!questionInput) return false;

    const safeSessionId = toPositiveId(draftSessionId);
    const sourceQuestionId =
      toPositiveId(editId) || toPositiveId(questionInput?.id);
    const nextQuestion = {
      ...questionInput,
      opts: Array.isArray(questionInput?.opts)
        ? [...questionInput.opts]
        : questionInput?.opts,
    };

    if (safeSessionId) {
      const location =
        resolveQuestionLocation(sourceQuestionId || nextQuestion?.id) ||
        resolveQuestionLocation(nextQuestion?.id);

      try {
        const response = await assignmentApi.autoSaveDraftItem(
          safeSessionId,
          buildAutoSaveItemPayload(nextQuestion, {
            sectionId: location?.sectionId,
            orderIndex: location?.orderIndex,
          }),
          {
            bankId,
            assignmentId,
          },
        );

        const savedItemId = toPositiveId(response?.result);
        if (!toPositiveId(nextQuestion?.id) && savedItemId) {
          nextQuestion.id = savedItemId;
        }
      } catch (error) {
        if (showErrorToast) {
          showToast(
            error?.response?.data?.message ||
              "Không thể lưu tự động câu hỏi này.",
            "error",
          );
        }
        return false;
      }
    }

    applyEditedQuestionToLocalState(sourceQuestionId, nextQuestion);

    const safeNextId = toPositiveId(nextQuestion?.id);
    if (safeNextId && safeNextId !== toPositiveId(editId)) {
      setEditId(safeNextId);
    }

    setEditData(nextQuestion);
    editAutoSaveSnapshotRef.current = getQuestionEditSnapshot(nextQuestion);

    return true;
  };

  const startEdit = (q) => {
    const nextEditData = { ...q, opts: q.opts ? [...q.opts] : undefined };

    if (editSaveTimerRef.current) {
      clearTimeout(editSaveTimerRef.current);
      editSaveTimerRef.current = null;
    }

    setEditId(q.id);
    setEditData(nextEditData);
    editAutoSaveSnapshotRef.current = getQuestionEditSnapshot(nextEditData);
  };

  const resolveQuestionLocation = (questionId) => {
    const safeQuestionId = toPositiveId(questionId);
    if (!safeQuestionId) return null;

    for (const section of workspaceSections) {
      const questions = Array.isArray(section?.questions)
        ? section.questions
        : [];
      const matchedIndex = questions.findIndex(
        (question) => toPositiveId(question?.id) === safeQuestionId,
      );

      if (matchedIndex >= 0) {
        return {
          sectionId: toPositiveId(section?.id),
          orderIndex: matchedIndex + 1,
        };
      }
    }

    return null;
  };

  const cancelEdit = () => {
    if (editSaveTimerRef.current) {
      clearTimeout(editSaveTimerRef.current);
      editSaveTimerRef.current = null;
    }

    setEditId(null);
    setEditData(null);
    editAutoSaveSnapshotRef.current = "";
  };

  const saveEdit = async () => {
    if (!editData) return;

    if (editSaveTimerRef.current) {
      clearTimeout(editSaveTimerRef.current);
      editSaveTimerRef.current = null;
    }

    const saved = await persistEditedQuestion(editData, {
      showErrorToast: true,
    });

    if (!saved) return;

    cancelEdit();
  };

  useEffect(() => {
    const safeSessionId = toPositiveId(draftSessionId);
    const safeEditId = toPositiveId(editId);

    if (!safeSessionId || !safeEditId || !editData) return;

    const currentSnapshot = getQuestionEditSnapshot(editData);
    if (
      !currentSnapshot ||
      currentSnapshot === editAutoSaveSnapshotRef.current
    ) {
      return;
    }

    if (editSaveTimerRef.current) {
      clearTimeout(editSaveTimerRef.current);
    }

    editSaveTimerRef.current = window.setTimeout(async () => {
      await persistEditedQuestion(editData, {
        showErrorToast: false,
      });
    }, 900);

    return () => {
      if (editSaveTimerRef.current) {
        clearTimeout(editSaveTimerRef.current);
        editSaveTimerRef.current = null;
      }
    };
  }, [editData, editId, draftSessionId]);

  const deleteQ = async (id) => {
    const safeSessionId = toPositiveId(draftSessionId);
    const safeItemId = toPositiveId(id);

    if (safeSessionId && safeItemId) {
      try {
        await assignmentApi.deleteDraftItem(safeSessionId, safeItemId);
      } catch (error) {
        showToast(
          error?.response?.data?.message ||
            "Không thể xóa câu hỏi nháp lúc này.",
          "error",
        );
        return;
      }
    }

    setQs((p) => p.filter((q) => q.id !== id));
    setWorkspaceSections((prev) =>
      prev.map((section) => ({
        ...section,
        questions: section.questions.filter((question) => question.id !== id),
      })),
    );
    if (safeItemId) {
      setSelectedQuestionIds((prev) =>
        prev.filter((itemId) => itemId !== safeItemId),
      );
    }
    if (editId === id) cancelEdit();
  };

  const reorderQuestionsInSection = (
    sourceSectionId,
    targetSectionId,
    sourceQuestionId,
    targetQuestionId,
  ) => {
    const safeSourceSectionId = toPositiveId(sourceSectionId);
    const safeTargetSectionId = toPositiveId(targetSectionId);
    const safeSessionId = toPositiveId(draftSessionId);

    if (
      !safeSourceSectionId ||
      !safeTargetSectionId ||
      sourceQuestionId === targetQuestionId ||
      reorderSaving
    ) {
      return;
    }

    const previousSections = workspaceSections;
    const { didReorder, nextSections, affectedSectionIds } =
      applyQuestionDropToSections(
        previousSections,
        safeSourceSectionId,
        safeTargetSectionId,
        sourceQuestionId,
        targetQuestionId,
      );

    if (!didReorder) return;

    setWorkspaceSections(nextSections);
    setQs(flattenQuestionsBySections(nextSections));
    setPg(1);

    if (!safeSessionId) {
      setMsgs((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Đổi vị trí tạm thời trên giao diện. Chưa có draft session để lưu thứ tự lên server.",
          time: "Vừa xong",
        },
      ]);
      return;
    }

    const reorderItems = nextSections
      .filter((section) => affectedSectionIds.includes(section.id))
      .flatMap((section) =>
        section.questions.map((question, index) => {
          const safeItemId = toPositiveId(question?.id);
          if (!safeItemId) return null;

          return {
            itemId: safeItemId,
            sectionId: section.id,
            orderIndex: index + 1,
          };
        }),
      )
      .filter(Boolean);

    if (!reorderItems.length) return;

    setReorderSaving(true);

    assignmentApi
      .batchAutoSaveDraftItems(safeSessionId, reorderItems, {
        bankId,
        assignmentId,
      })
      .catch(() => {
        setWorkspaceSections(previousSections);
        setQs(flattenQuestionsBySections(previousSections));
        setMsgs((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Không thể lưu thứ tự mới lên server. Đã hoàn tác về thứ tự cũ.",
            time: "Vừa xong",
          },
        ]);
      })
      .finally(() => {
        setReorderSaving(false);
      });
  };

  const sendChat = async () => {
    const message = String(chatIn || "").trim();
    if (!message || typing) return;

    setMsgs((p) => [...p, { role: "user", text: message, time: "Vừa xong" }]);

    setChatIn("");
    setTyping(true);

    try {
      const safeSessionId = toPositiveId(draftSessionId);
      const safeSectionId = toPositiveId(selectedSectionId);

      if (!safeSessionId) {
        setMsgs((p) => [
          ...p,
          {
            role: "bot",
            text: "Vui lòng tạo câu hỏi AI trước, rồi tôi sẽ refine theo yêu cầu của thầy/cô.",
            time: "Vừa xong",
          },
        ]);
        return;
      }

      const normalizedSelectedQuestionIds = selectedQuestionIds
        .map((id) => toPositiveId(id))
        .filter(Boolean);

      const response = await assignmentApi.refineAiQuestions(
        safeSessionId,
        {
          prompt: message,
          sectionId: safeSectionId || undefined,
          selectQuestionIds:
            normalizedSelectedQuestionIds.length > 0
              ? normalizedSelectedQuestionIds
              : undefined,
        },
        {
          bankId,
          assignmentId,
        },
      );

      const result = response?.result || {};
      const mappedQuestions = Array.isArray(result?.questions)
        ? result.questions.map((item, index) =>
            toQuestionFromDraft(item, index),
          )
        : [];
      const warnings = Array.isArray(result?.warnings)
        ? result.warnings.filter(Boolean)
        : [];
      const nextSessionId = toPositiveId(result?.sessionId);

      if (nextSessionId) {
        setDraftSessionId(nextSessionId);
      }

      if (mappedQuestions.length > 0) {
        setQs(mappedQuestions);
        setPhase("results");
        setWorkspaceRefreshTick((prev) => prev + 1);
        setPg(1);
        setEditId(null);
        setEditData(null);
      } else {
        setWorkspaceRefreshTick((prev) => prev + 1);
      }

      setMsgs((p) => [
        ...p,
        {
          role: "bot",
          text: `Đã refine theo yêu cầu của thầy/cô.${normalizedSelectedQuestionIds.length ? `\nPhạm vi: ${normalizedSelectedQuestionIds.length} câu được chọn.` : "\nPhạm vi: toàn bộ câu hỏi."}${mappedQuestions.length ? `\nCập nhật ${mappedQuestions.length} câu hỏi.` : ""}${warnings.length ? `\nCảnh báo: ${warnings.join("; ")}` : ""}`,
          time: "Vừa xong",
        },
      ]);
    } catch (error) {
      const messageError =
        error?.response?.data?.message ||
        "Không thể refine câu hỏi lúc này. Vui lòng thử lại.";

      setMsgs((p) => [
        ...p,
        {
          role: "bot",
          text: `Refine thất bại: ${messageError}`,
          time: "Vừa xong",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const collectConfirmQuestionIds = () => {
    const allQuestionIds = [
      ...new Set(
        qs.map((question) => toPositiveId(question?.id)).filter(Boolean),
      ),
    ];

    if (selectedQuestionIds.length > 0) {
      const selectedIds = selectedQuestionIds.filter((id) =>
        allQuestionIds.includes(id),
      );
      return selectedIds.length > 0 ? selectedIds : allQuestionIds;
    }

    return allQuestionIds;
  };

  const handlePublish = async () => {
    if (publishing) return;

    const safeAssignmentId = toPositiveId(assignmentId);
    if (!isBankMode && !safeAssignmentId) {
      setRequestError("Thiếu assignmentId để xuất bản bài tập.");
      return;
    }

    const safeSessionId = toPositiveId(draftSessionId);
    if (!safeSessionId) {
      setRequestError(
        "Chưa có phiên nháp để xuất bản. Vui lòng tạo câu hỏi trước.",
      );
      return;
    }

    const selectedIds = collectConfirmQuestionIds();
    if (!selectedIds.length) {
      setRequestError(
        isBankMode
          ? "Không có câu hỏi hợp lệ để lưu vào ngân hàng đề."
          : "Không có câu hỏi hợp lệ để xuất bản.",
      );
      return;
    }

    setPublishing(true);
    setRequestError("");

    try {
      if (isBankMode) {
        await assignmentApi.confirmDraftSession(safeSessionId, selectedIds, {
          bankId,
        });
      } else {
        await assignmentApi.confirmAndPublishAssignment(safeAssignmentId, {
          sessionId: safeSessionId,
          bankId: bankId || null,
          selectedQuestionIds: selectedIds,
        });
      }

      const successMessage = isBankMode
        ? "Đã lưu câu hỏi vào ngân hàng đề thành công."
        : "Bài tập đã được xuất bản thành công.";

      showToast(successMessage);

      setMsgs((prev) => [
        ...prev,
        {
          role: "bot",
          text: isBankMode
            ? `${successMessage} Đang chuyển về chi tiết ngân hàng.`
            : `${successMessage} Đang chuyển sang màn hình gán lớp học.`,
          time: "Vừa xong",
        },
      ]);

      if (publishNavigateTimerRef.current) {
        clearTimeout(publishNavigateTimerRef.current);
      }

      publishNavigateTimerRef.current = window.setTimeout(() => {
        if (isBankMode) {
          navigate(PATH_TEACHER.questionBankDetail(bankId));
        } else {
          navigate(PATH_TEACHER.assignmentAssignClasses(safeAssignmentId));
        }
      }, 900);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (isBankMode
          ? "Bạn không thể lưu ngân hàng vì có câu hỏi chưa hoàn thiện. Vui lòng kiểm tra lại."
          : "Bạn không thể xuất bản vì có câu hỏi chưa hoàn thiện. Vui lòng kiểm tra lại.");
      setRequestError(message);
      setMsgs((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Xuất bản thất bại: ${message}`,
          time: "Vừa xong",
        },
      ]);
    } finally {
      setPublishing(false);
    }
  };
  const totalPg = Math.ceil(qs.length / PP);
  const vis = qs.slice((pg - 1) * PP, (pg - 1) * PP + PP);
  const selectedQuestionIdSet = new Set(selectedQuestionIds);
  const getGlobalQuestionNumber = (sectionIndex, questionIndex) => {
    let count = questionIndex + 1;

    for (let idx = 0; idx < sectionIndex; idx += 1) {
      const sectionQuestions = Array.isArray(workspaceSections[idx]?.questions)
        ? workspaceSections[idx].questions
        : [];
      count += sectionQuestions.length;
    }

    return count;
  };
  const sugs =
    phase === "results"
      ? [
          "Sửa câu 1 cho khó hơn",
          "Thêm 3 câu nữa",
          "Đổi câu 3 sang tự luận",
          "Xóa câu cuối",
        ]
      : ["Gợi ý chủ đề", "Giải thích cách dùng"];

  const renderQuestionCard = (
    q,
    num,
    key,
    animationIndex = 0,
    dragOptions = {},
  ) => {
    const isEd = editId === q.id;
    const d = isEd ? editData : q;
    const safeQuestionId = toPositiveId(q?.id);
    const isQuestionSelected = safeQuestionId
      ? selectedQuestionIdSet.has(safeQuestionId)
      : false;
    const cognitiveUi = getCognitiveLevelUi(d?.cognitiveLevel);
    const isDragging = Boolean(dragOptions?.isDragging);
    const isDropTarget = Boolean(dragOptions?.isDropTarget);
    const isDraggable = Boolean(dragOptions?.draggable);

    return (
      <div
        key={key}
        className={`qc${isEd ? " editing" : ""}`}
        draggable={isDraggable}
        onDragStart={dragOptions?.onDragStart}
        onDragOver={dragOptions?.onDragOver}
        onDrop={dragOptions?.onDrop}
        onDragEnd={dragOptions?.onDragEnd}
        style={{
          animationDelay: `${animationIndex * 0.04}s`,
          cursor: isDraggable ? "grab" : "default",
          opacity: isDragging ? 0.55 : 1,
          outline: isDropTarget ? "2px dashed var(--p)" : "none",
        }}
      >
        <div className="qc-main">
          <div className="qc-top">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <input
                type="checkbox"
                checked={isQuestionSelected}
                disabled={!safeQuestionId || typing}
                draggable={false}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onChange={() => {
                  if (!safeQuestionId) return;
                  setSelectedQuestionIds((prev) => {
                    if (prev.includes(safeQuestionId)) {
                      return prev.filter((id) => id !== safeQuestionId);
                    }
                    return [...prev, safeQuestionId];
                  });
                }}
                style={{ width: 14, height: 14, cursor: "pointer" }}
              />
              <div className="qc-n">{num}</div>
            </div>
            <div className="qc-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 4,
                }}
              >
                <span className={`qc-tb ${TC[d.type]}`}>{TL[d.type]}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 9,
                    fontWeight: 700,
                    background: cognitiveUi.bg,
                    border: `1px solid ${cognitiveUi.border}`,
                    color: cognitiveUi.text,
                    letterSpacing: ".02em",
                  }}
                >
                  Mức độ: {cognitiveUi.label}
                </span>
              </div>
              {isEd ? (
                <textarea
                  className="ed-prompt"
                  value={d.prompt}
                  onChange={(e) =>
                    setEditData({ ...d, prompt: e.target.value })
                  }
                />
              ) : (
                <div className="qc-pr">{d.prompt}</div>
              )}
            </div>
          </div>
          {d.type === "MULTIPLE_CHOICE" &&
            d.opts &&
            (isEd ? (
              <div style={{ marginLeft: 38 }}>
                <div className="ed-lbl">Đáp án (bấm ○ chọn đúng)</div>
                {d.opts.map((o, oi) => (
                  <div key={oi} className="ed-opt-row">
                    <div
                      className={`ed-opt-radio${d.cor === oi ? " on" : ""}`}
                      onClick={() => setEditData({ ...d, cor: oi })}
                    >
                      {d.cor === oi && <I.Check />}
                    </div>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: "var(--bl)",
                        fontSize: 9,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--t3)",
                        flexShrink: 0,
                      }}
                    >
                      {LT[oi]}
                    </div>
                    <input
                      className="ed-opt-input"
                      value={o}
                      onChange={(e) => {
                        const nw = [...d.opts];
                        nw[oi] = e.target.value;
                        setEditData({ ...d, opts: nw });
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="qc-opts">
                {d.opts.map((o, oi) => (
                  <div
                    key={oi}
                    className={`qc-opt${oi === d.cor ? " ok" : ""}`}
                  >
                    <div className="qc-ol">{LT[oi]}</div>
                    {o}
                  </div>
                ))}
              </div>
            ))}
          {d.type === "TRUE_FALSE" &&
            (isEd ? (
              <>
                <div className="ed-lbl">Đáp án</div>
                <div className="ed-tf">
                  <div
                    className={`ed-tfb${d.cor === true ? " on" : ""}`}
                    onClick={() => setEditData({ ...d, cor: true })}
                  >
                    Đúng
                  </div>
                  <div
                    className={`ed-tfb${d.cor === false ? " on" : ""}`}
                    onClick={() => setEditData({ ...d, cor: false })}
                  >
                    Sai
                  </div>
                </div>
              </>
            ) : (
              <div className="qc-tf">
                Đáp án: <span className="ctag">{d.cor ? "Đúng" : "Sai"}</span>
              </div>
            ))}
          {d.type === "FILL_IN_BLANK" &&
            (isEd ? (
              <>
                <div className="ed-lbl">Đáp án</div>
                <input
                  className="ed-ans"
                  value={d.ans || ""}
                  onChange={(e) => setEditData({ ...d, ans: e.target.value })}
                />
              </>
            ) : (
              <div className="qc-fb">
                Đáp án: <span>{d.ans}</span>
              </div>
            ))}
          {d.type === "ESSAY" && !isEd && (
            <>
              <div className="qc-fb" style={{ fontStyle: "italic" }}>
                Tự luận - chấm thủ công
              </div>
              {String(d.sampleAnswer || "").trim() && (
                <div className="qc-fb" style={{ whiteSpace: "pre-line" }}>
                  Gợi ý trả lời: <span>{d.sampleAnswer}</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className="qc-bar">
          <div className="qc-bar-l">
            {isEd ? (
              <>
                <button className="ab sv" onClick={saveEdit}>
                  <I.Check /> Lưu
                </button>
                <button className="ab" onClick={cancelEdit}>
                  <I.Undo /> Hủy
                </button>
              </>
            ) : (
              <>
                <button className="ab ed" onClick={() => startEdit(q)}>
                  <I.Edit /> Sửa
                </button>
                <button className="ab">
                  <I.Copy /> Nhân bản
                </button>
              </>
            )}
          </div>
          <div className="qc-bar-r">
            <button className="ab dng" onClick={() => deleteQ(q.id)}>
              <I.Trash /> Xóa
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="left">
        <div className="top">
          <div className="top-l">
            <button
              type="button"
              className="bk"
              onClick={() =>
                navigate(
                  isBankMode
                    ? PATH_TEACHER.questionBankMethod(bankId)
                    : PATH_TEACHER.assignmentCreateMethod,
                )
              }
            >
              <I.ArrowL /> Quay lại
            </button>
            <div className="top-t">
              <I.Sparkles /> Tạo câu hỏi với AI
            </div>
          </div>
          <div className="top-r">
            {phase === "results" && (
              <>
                <button
                  className="btn btn-g"
                  onClick={() => {
                    setPhase("config");
                    setPg(1);
                  }}
                >
                  <I.Refresh /> Tạo lại
                </button>
                <button
                  className="btn btn-p"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  <I.Save />
                  {publishing
                    ? isBankMode
                      ? "Đang lưu..."
                      : "Đang xuất bản..."
                    : isBankMode
                      ? "Lưu ngân hàng"
                      : "Xuất bản"}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="scroll">
          <div className="cfg">
            <div className="cfg-t">
              <I.Zap /> Cấu hình sinh câu hỏi
            </div>
            <div
              className="cfg-d"
              style={{
                fontSize: 10,
                fontStyle: "italic",
                fontWeight: 500,
                lineHeight: 1.5,
                fontFamily: "var(--f)",
              }}
            >
              Thiết lập thông số để AI sinh câu hỏi phù hợp.
            </div>

            {requiresMixedSectionSetup && (
              <div
                className="fg"
                style={{
                  border: "1px solid var(--b)",
                  borderRadius: "var(--rm)",
                  background: "var(--plr)",
                  padding: 12,
                }}
              >
                <label className="fl">
                  Quản lý phần đề hỗn hợp <span className="rq">*</span>
                </label>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  {assignmentSections.length === 0 ? (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--gn)",
                        background: "var(--gnl)",
                        border: "1px solid rgba(16,185,129,.28)",
                        borderRadius: "var(--rs)",
                        padding: "8px 10px",
                        fontWeight: 600,
                      }}
                    >
                      Bạn chưa có phần nào. Hãy tạo ít nhất một phần trước khi
                      bấm "Tạo câu hỏi với AI".
                    </div>
                  ) : (
                    assignmentSections.map((section) => {
                      const isEditing =
                        toPositiveId(editingSectionId) ===
                        toPositiveId(section.id);

                      return (
                        <div
                          key={`cfg-section-${section.id}`}
                          style={{
                            border: "1px solid var(--b)",
                            borderRadius: "var(--rs)",
                            background: "var(--card)",
                            padding: 8,
                          }}
                        >
                          {isEditing ? (
                            <>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "minmax(0,1fr) minmax(140px,170px)",
                                  gap: 8,
                                }}
                              >
                                <input
                                  className="ta"
                                  style={{ minHeight: 36, resize: "none" }}
                                  value={editingSectionTitle}
                                  onChange={(event) =>
                                    setEditingSectionTitle(event.target.value)
                                  }
                                  disabled={sectionSaving}
                                  placeholder="Tên phần"
                                />
                                <select
                                  className="ta"
                                  style={{ minHeight: 36, resize: "none" }}
                                  value={editingSectionType}
                                  onChange={(event) =>
                                    setEditingSectionType(
                                      normalizeSectionType(event.target.value),
                                    )
                                  }
                                  disabled={sectionSaving}
                                >
                                  {SECTION_TYPE_OPTIONS.map((option) => (
                                    <option
                                      key={`edit-${section.id}-${option.value}`}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: 6,
                                  marginTop: 8,
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn btn-g"
                                  style={{ padding: "6px 12px" }}
                                  onClick={cancelEditSection}
                                  disabled={sectionSaving}
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-p"
                                  style={{ padding: "6px 12px" }}
                                  onClick={handleSaveSectionEdit}
                                  disabled={sectionSaving}
                                >
                                  {sectionSaving ? "Đang lưu..." : "Lưu"}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "var(--t)",
                                  }}
                                >
                                  {section.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: "var(--t3)",
                                    marginTop: 2,
                                  }}
                                >
                                  {toSectionTypeLabel(section.sectionType)}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn btn-g"
                                  style={{ padding: "6px 12px" }}
                                  onClick={() => startEditSection(section)}
                                  disabled={sectionSaving}
                                >
                                  Sửa
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-g"
                                  style={{
                                    padding: "6px 12px",
                                    borderColor: "rgba(239,68,68,.45)",
                                    color: "var(--rd)",
                                  }}
                                  onClick={() => handleDeleteSection(section)}
                                  disabled={sectionSaving}
                                >
                                  Xóa
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0,1fr) minmax(140px,170px) auto",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <input
                    className="ta"
                    style={{ minHeight: 36, resize: "none" }}
                    value={newSectionTitle}
                    onChange={(event) => setNewSectionTitle(event.target.value)}
                    placeholder="Nhập tiêu đề phần mới"
                    disabled={sectionSaving}
                  />
                  <select
                    className="ta"
                    style={{ minHeight: 36, resize: "none" }}
                    value={newSectionType}
                    onChange={(event) =>
                      setNewSectionType(
                        normalizeSectionType(event.target.value),
                      )
                    }
                    disabled={sectionSaving}
                  >
                    {SECTION_TYPE_OPTIONS.map((option) => (
                      <option key={`new-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-p"
                    style={{ padding: "6px 12px", justifyContent: "center" }}
                    onClick={handleCreateSection}
                    disabled={sectionSaving}
                  >
                    {sectionSaving ? "Đang xử lý..." : "+ Thêm phần"}
                  </button>
                </div>

                <p
                  style={{
                    marginTop: 8,
                    fontSize: 10,
                    color: "var(--t3)",
                    fontStyle: "italic",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    fontFamily: "var(--f)",
                  }}
                >
                  Mỗi phần có cấu hình loại câu hỏi riêng. Chọn phần ở bên dưới
                  để cấu hình trước khi sinh đề.
                </p>
              </div>
            )}

            {assignmentSections.length > 0 && (
              <div className="fg">
                <label className="fl">
                  Phần áp dụng <span className="rq">*</span>
                </label>
                <select
                  value={selectedSectionId || ""}
                  onChange={(event) =>
                    setSelectedSectionId(toPositiveId(event.target.value))
                  }
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1.5px solid var(--b)",
                    borderRadius: "var(--rm)",
                    fontSize: 12,
                    fontFamily: "var(--f)",
                    color: "var(--t)",
                    background: "var(--inp)",
                    outline: "none",
                  }}
                >
                  {assignmentSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title} -{" "}
                      {toSectionTypeLabel(section.sectionType)}
                    </option>
                  ))}
                </select>
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    color: "var(--t3)",
                    fontStyle: "italic",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    fontFamily: "var(--f)",
                  }}
                >
                  Câu hỏi AI sinh ra sẽ được gán vào phần đã chọn.
                </p>
              </div>
            )}

            <div className="fg">
              <label className="fl">
                Loại câu hỏi <span className="rq">*</span>
              </label>
              <div className="qtg">
                {QT.map((q) => {
                  const disabled =
                    !sectionSetupReadyForConfig ||
                    !allowedQuestionTypes.includes(q.v);

                  return (
                    <div
                      key={q.v}
                      className={`qtp${qts.includes(q.v) ? " on" : ""}`}
                      onClick={() => !disabled && togQT(q.v)}
                      style={{
                        opacity: disabled ? 0.45 : 1,
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="qti">{q.ic}</div>
                      <div className="qtl">{q.l}</div>
                    </div>
                  );
                })}
              </div>
              {!sectionSetupReadyForConfig && (
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 10,
                    color: "var(--gn)",
                    fontWeight: 600,
                  }}
                >
                  Tạo phần trước để bật cấu hình loại câu hỏi.
                </p>
              )}
            </div>

            {sectionSetupReadyForConfig && qts.length > 0 && (
              <div className="fg">
                <label className="fl">
                  Cấu hình chi tiết theo loại <span className="rq">*</span>
                </label>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {qts.map((type) => {
                    const questionType = QT.find((item) => item.v === type);
                    const requirement = buildRequirementConfig(
                      typeRequirements?.[type],
                    );

                    return (
                      <div
                        key={type}
                        style={{
                          border: "1px solid var(--b)",
                          borderRadius: "var(--rm)",
                          padding: "8px 10px",
                          background: "var(--plr)",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(150px,1fr) minmax(230px,1fr) minmax(250px,1.2fr)",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                color: "var(--t2)",
                              }}
                            >
                              <span className="qti" style={{ margin: 0 }}>
                                {questionType?.ic || "QT"}
                              </span>
                              {questionType?.l || type}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "var(--t3)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Số lượng
                            </span>
                            <div className="qr" style={{ gap: 6 }}>
                              <button
                                className="qb"
                                onClick={() =>
                                  setRequirementQuantity(
                                    type,
                                    Math.max(1, requirement.quantity - 1),
                                  )
                                }
                                style={{ width: 30, height: 30, fontSize: 14 }}
                              >
                                −
                              </button>
                              <input
                                className="qv"
                                type="number"
                                min="1"
                                max="50"
                                step="1"
                                value={requirement.quantity}
                                onChange={(event) => {
                                  const parsed = Number(event.target.value);
                                  if (!Number.isFinite(parsed)) return;
                                  setRequirementQuantity(type, parsed);
                                }}
                                style={{
                                  width: 52,
                                  minWidth: 52,
                                  height: 30,
                                  border: "1.5px solid var(--b)",
                                  borderRadius: "var(--rs)",
                                  background: "var(--card)",
                                  color: "var(--t)",
                                  outline: "none",
                                  lineHeight: "30px",
                                  textAlign: "center",
                                  padding: 0,
                                  fontSize: 14,
                                  fontFamily: "var(--fm)",
                                  fontWeight: 700,
                                }}
                              />
                              <button
                                className="qb"
                                onClick={() =>
                                  setRequirementQuantity(
                                    type,
                                    Math.min(50, requirement.quantity + 1),
                                  )
                                }
                                style={{ width: 30, height: 30, fontSize: 14 }}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "var(--t3)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Mức độ câu hỏi
                            </span>
                            <select
                              value={requirement.cognitiveLevel}
                              onChange={(event) =>
                                setRequirementCognitive(
                                  type,
                                  event.target.value,
                                )
                              }
                              style={{
                                flex: 1,
                                height: 30,
                                border: "1.5px solid var(--b)",
                                borderRadius: "var(--rs)",
                                padding: "0 10px",
                                fontSize: 11,
                                fontWeight: 600,
                                fontFamily: "var(--f)",
                                color: "var(--t)",
                                background: "var(--card)",
                                outline: "none",
                              }}
                            >
                              {COG.map((level) => (
                                <option
                                  key={`${type}-${level.v}`}
                                  value={level.v}
                                >
                                  {level.l}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="fg">
              <label className="fl">Tài liệu nguồn</label>
              <div className="st">
                <button
                  className={`stb${srcT === "file" ? " on" : ""}`}
                  onClick={() => setSrcT("file")}
                >
                  📎 Upload file
                </button>
                <button
                  className={`stb${srcT === "text" ? " on" : ""}`}
                  onClick={() => setSrcT("text")}
                >
                  📝 Nhập văn bản
                </button>
              </div>
              {srcT === "file" ? (
                <>
                  <input
                    ref={fRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAiF(file);
                    }}
                  />
                  <div
                    className={`uz${aiF ? " has" : ""}`}
                    onClick={() => !aiF && fRef.current?.click()}
                  >
                    {aiF ? (
                      <div className="uz-fi">
                        <I.File />
                        <span className="uz-fn">{aiF.name}</span>
                        <button
                          className="uz-rm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiF(null);
                            if (fRef.current) {
                              fRef.current.value = "";
                            }
                          }}
                        >
                          <I.X />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: "var(--t3)", marginBottom: 6 }}>
                          <I.Upload />
                        </div>
                        <div className="uz-t">
                          Kéo thả hoặc <strong>chọn file</strong>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <textarea
                  className="ta"
                  placeholder="Dán nội dung bài học..."
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  style={{ minHeight: 90 }}
                />
              )}
            </div>
            <div className="fg">
              <label className="fl">Yêu cầu thêm</label>
              <textarea
                className="ta"
                placeholder='VD: "Tập trung hình học không gian"...'
                value={addP}
                onChange={(e) => setAddP(e.target.value)}
              />
            </div>
            <button className="gbtn" disabled={!canGen} onClick={doGen}>
              <div className="shim" />
              <I.Sparkles /> Tạo câu hỏi với AI
            </button>
            {!canGen && (
              <p
                style={{
                  fontSize: 10,
                  color: "var(--t3)",
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                {requiresMixedSectionSetup && assignmentSections.length === 0
                  ? "Bạn cần tạo phần cho đề hỗn hợp trước khi sinh câu hỏi."
                  : "Chọn ít nhất 1 loại câu hỏi, cấu hình chi tiết và tài liệu"}
              </p>
            )}
            {requestError && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--rd)",
                  marginTop: 8,
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {requestError}
              </p>
            )}
          </div>
          {phase === "loading" && (
            <div className="cfg" style={{ textAlign: "center", padding: 36 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--pl)",
                  color: "var(--p)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  animation: "pulse 1.5s ease infinite",
                }}
              >
                <I.Sparkles />
              </div>
              <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1);opacity:.7}}`}</style>
              <div
                style={{
                  fontFamily: "var(--fd)",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 5,
                }}
              >
                AI đang tạo...
              </div>
              <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 20 }}>
                Đang sinh {totalConfiguredQuestions} câu hỏi
              </p>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skel"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}
          {phase === "results" && (
            <>
              <div className="rh">
                <div className="rt">
                  <I.Sparkles /> Câu hỏi đã tạo{" "}
                  <span className="rc">{qs.length}</span>
                </div>
              </div>

              {workspaceSections.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  {workspaceSections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="cfg"
                      style={{ padding: 12 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700 }}>
                          Phần {sectionIndex + 1}: {section.title}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--t3)",
                            fontWeight: 700,
                          }}
                        >
                          {toSectionTypeLabel(section.sectionType)} •{" "}
                          {section.questions.length} câu
                        </div>
                      </div>
                      {section.questions.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {section.questions.map((question, questionIndex) =>
                            renderQuestionCard(
                              question,
                              getGlobalQuestionNumber(
                                sectionIndex,
                                questionIndex,
                              ),
                              `section-${section.id}-${question.id}-${questionIndex}`,
                              questionIndex,
                              {
                                draggable: !reorderSaving,
                                isDragging:
                                  draggingQuestion?.sectionId === section.id &&
                                  draggingQuestion?.questionId === question.id,
                                isDropTarget:
                                  dragOverTarget?.sectionId === section.id &&
                                  dragOverTarget?.questionId === question.id,
                                onDragStart: (event) => {
                                  if (reorderSaving) return;
                                  event.dataTransfer.effectAllowed = "move";
                                  setDraggingQuestion({
                                    sectionId: section.id,
                                    questionId: question.id,
                                  });
                                  setDragOverTarget({
                                    sectionId: section.id,
                                    questionId: question.id,
                                  });
                                },
                                onDragOver: (event) => {
                                  event.preventDefault();
                                  event.dataTransfer.dropEffect = "move";
                                  if (
                                    dragOverTarget?.sectionId !== section.id ||
                                    dragOverTarget?.questionId !== question.id
                                  ) {
                                    setDragOverTarget({
                                      sectionId: section.id,
                                      questionId: question.id,
                                    });
                                  }
                                },
                                onDrop: (event) => {
                                  event.preventDefault();
                                  if (reorderSaving) return;
                                  if (
                                    draggingQuestion?.questionId !== question.id
                                  ) {
                                    reorderQuestionsInSection(
                                      draggingQuestion.sectionId,
                                      section.id,
                                      draggingQuestion.questionId,
                                      question.id,
                                    );
                                  }
                                  setDraggingQuestion(null);
                                  setDragOverTarget(null);
                                },
                                onDragEnd: () => {
                                  setDraggingQuestion(null);
                                  setDragOverTarget(null);
                                },
                              },
                            ),
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--t3)" }}>
                          Phần này chưa có câu hỏi.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {vis.map((q, i) => {
                    return renderQuestionCard(
                      q,
                      (pg - 1) * PP + i + 1,
                      `flat-${q.id}-${i}`,
                      i,
                    );
                  })}
                  {totalPg > 1 && (
                    <div className="pag">
                      <button
                        className="pg"
                        disabled={pg <= 1}
                        onClick={() => setPg(pg - 1)}
                      >
                        <I.ChevL />
                      </button>
                      {Array.from({ length: totalPg }, (_, i) => i + 1).map(
                        (p) => (
                          <button
                            key={p}
                            className={`pg${p === pg ? " on" : ""}`}
                            onClick={() => setPg(p)}
                          >
                            {p}
                          </button>
                        ),
                      )}
                      <button
                        className="pg"
                        disabled={pg >= totalPg}
                        onClick={() => setPg(pg + 1)}
                      >
                        <I.ChevR />
                      </button>
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--t3)",
                          fontWeight: 600,
                          marginLeft: 6,
                        }}
                      >
                        {qs.length} câu
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div className="right">
        <div className="ch-h">
          <div className="ch-ic">
            <I.Bot />
          </div>
          <div className="ch-hi">
            <h3>Trợ lý AI</h3>
            <p>Chỉnh sửa câu hỏi qua chat</p>
          </div>
        </div>
        <div className="ch-msgs">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`ch-m ${m.role === "user" ? "usr" : "bot"}`}
            >
              <div className={`ch-av ${m.role === "user" ? "hm" : "bt"}`}>
                {m.role === "user" ? <I.User /> : <I.Bot />}
              </div>
              <div>
                <div className="ch-bb" style={{ whiteSpace: "pre-line" }}>
                  {m.text}
                </div>
                <div className="ch-tm">{m.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="ch-m bot">
              <div className="ch-av bt">
                <I.Bot />
              </div>
              <div className="ch-bb">
                <div className="typing">
                  <div className="td" />
                  <div className="td" />
                  <div className="td" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>
        <div className="ch-sug">
          {sugs.map((s, i) => (
            <button key={i} className="ch-sg" onClick={() => setChatIn(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="ch-inp">
          {assignmentSections.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "var(--t3)",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Phần tinh chỉnh
              </label>
              <select
                value={selectedSectionId || ""}
                onChange={(event) =>
                  setSelectedSectionId(toPositiveId(event.target.value))
                }
                style={{
                  width: "100%",
                  height: 32,
                  border: "1.5px solid var(--b)",
                  borderRadius: "var(--rs)",
                  padding: "0 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--f)",
                  color: "var(--t)",
                  background: "var(--card)",
                  outline: "none",
                }}
              >
                {assignmentSections.map((section) => (
                  <option key={`chat-section-${section.id}`} value={section.id}>
                    {section.title} - {toSectionTypeLabel(section.sectionType)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="ch-ht">
            {selectedQuestionIds.length > 0
              ? `Đang chọn ${selectedQuestionIds.length} câu để tinh chỉnh.`
              : "Chưa chọn câu hỏi: AI sẽ tinh chỉnh toàn bộ."}
          </div>
          <div className="ch-ir">
            <textarea
              className="ch-ta"
              placeholder="Nhập yêu cầu chỉnh sửa..."
              value={chatIn}
              onChange={(e) => setChatIn(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChat();
                }
              }}
              rows={1}
            />
            <button
              className="ch-sd"
              onClick={sendChat}
              disabled={!chatIn.trim() || typing}
            >
              <I.Send />
            </button>
          </div>
          <div className="ch-ht">Enter gửi · Shift+Enter xuống dòng</div>
        </div>
      </div>

      {toast ? (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            maxWidth: "min(420px, calc(100vw - 40px))",
            padding: "12px 20px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--f)",
            boxShadow: "0 12px 40px rgba(30,41,59,.11)",
            zIndex: 2200,
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: toast.type === "error" ? "#EF4444" : "#10B981",
            color: "#FFFFFF",
          }}
          role="status"
          aria-live="polite"
        >
          {toast.type === "error" ? <I.X /> : <I.Check />} {toast.msg}
        </div>
      ) : null}
    </div>
  );
};

export default CreateAssignmentAiPage;
