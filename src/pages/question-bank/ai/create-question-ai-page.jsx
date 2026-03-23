import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, CircleAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { questionBankApi } from "@/apis/question-bank.api";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/question-bank/createQuestionAiPage.css";

const AI_DIFFICULTIES = [
  { value: "EASY", label: "Dễ" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HARD", label: "Khó" },
];

const QUESTION_TYPE_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm" },
  { value: "TRUE_FALSE", label: "Đúng / Sai" },
  { value: "FILL_IN_THE_BLANK", label: "Điền khuyết" },
  { value: "ESSAY", label: "Tự luận" },
];

const OPTIONS_REQUIRED_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_IN_THE_BLANK",
];

const isValidStatus = (status) =>
  String(status || "").toUpperCase() === "VALID";

const isValidId = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0;

const isOptionsRequired = (questionType) =>
  OPTIONS_REQUIRED_TYPES.includes(String(questionType || "").toUpperCase());

const createDefaultOptionsByType = (questionType) => {
  if (questionType === "TRUE_FALSE") {
    return [
      { content: "Đúng", isCorrect: true },
      { content: "Sai", isCorrect: false },
    ];
  }

  if (questionType === "MULTIPLE_CHOICE") {
    return [
      { content: "", isCorrect: true },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ];
  }

  if (questionType === "FILL_IN_THE_BLANK") {
    return [{ content: "", isCorrect: true }];
  }

  return [];
};

const normalizeQuestionData = (questionData = {}) => {
  const questionType = String(questionData?.questionType || "").toUpperCase();
  const normalizedOptions = Array.isArray(questionData?.options)
    ? questionData.options.map((option) => ({
        content: String(option?.content ?? ""),
        isCorrect: Boolean(option?.isCorrect ?? option?.correct),
      }))
    : [];

  if (questionType === "ESSAY") {
    return {
      ...questionData,
      questionType,
      options: null,
      sampleAnswer: questionData?.sampleAnswer ?? "",
    };
  }

  const fallbackOptions = createDefaultOptionsByType(questionType);
  const options =
    normalizedOptions.length > 0 ? normalizedOptions : fallbackOptions;
  const hasCorrect = options.some((option) => option.isCorrect);

  return {
    ...questionData,
    questionType,
    sampleAnswer: null,
    options: hasCorrect
      ? options
      : options.map((option, index) => ({
          ...option,
          isCorrect: index === 0,
        })),
  };
};

const mapToQuestionUpdatePayload = (questionData = {}) => ({
  content: questionData.content,
  questionType: questionData.questionType,
  difficulty: questionData.difficulty,
  defaultPoints: Number(questionData.defaultPoints ?? 0),
  sampleAnswer: questionData.sampleAnswer ?? null,
  options: Array.isArray(questionData.options)
    ? questionData.options.map((option) => ({
        content: option.content,
        isCorrect: Boolean(option.isCorrect ?? option.correct),
      }))
    : null,
});

const toQuestionSnippet = (content) => {
  const normalized = String(content ?? "").trim();
  if (!normalized) {
    return "-";
  }
  if (normalized.length <= 90) {
    return normalized;
  }
  return `${normalized.slice(0, 90)}...`;
};

const getDifficultyLabel = (value) =>
  AI_DIFFICULTIES.find((item) => item.value === value)?.label ?? value;

const getQuestionTypeLabel = (value) =>
  QUESTION_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;

const getDraftSessionStorageKey = (bankId) => `qb-ai-draft-session:${bankId}`;

const CreateQuestionAiPage = () => {
  const navigate = useNavigate();
  const { bankId } = useParams();
  const safeBankId = Number(bankId);
  const hasValidBankId = Number.isFinite(safeBankId) && safeBankId > 0;

  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [quantity, setQuantity] = useState(5);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState([
    "MULTIPLE_CHOICE",
  ]);
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [rawText, setRawText] = useState("");
  const [referenceFile, setReferenceFile] = useState(null);
  const [draftSessionId, setDraftSessionId] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [savingQuestionIds, setSavingQuestionIds] = useState([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  const previewRows = useMemo(() => previewItems, [previewItems]);
  const validCount = useMemo(
    () => previewItems.filter((item) => isValidStatus(item.status)).length,
    [previewItems],
  );
  const invalidCount = previewItems.length - validCount;
  const confirmPayload = useMemo(() => {
    const validDraftIds = previewItems
      .filter((item) => isValidStatus(item.status) && isValidId(item.id))
      .map((item) => Number(item.id));

    return selectedQuestionIds.filter((id) =>
      validDraftIds.includes(Number(id)),
    );
  }, [previewItems, selectedQuestionIds]);

  const persistDraftSessionId = useCallback(
    (sessionId) => {
      if (!hasValidBankId) {
        return;
      }

      const storageKey = getDraftSessionStorageKey(safeBankId);
      try {
        if (isValidId(sessionId)) {
          localStorage.setItem(storageKey, String(sessionId));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        // Ignore storage failures to avoid blocking generation flow.
      }
    },
    [hasValidBankId, safeBankId],
  );

  const applyDraftResponse = useCallback(
    (response) => {
      const sessionId = Number(response?.result?.sessionId);
      const questions = Array.isArray(response?.result?.questions)
        ? response.result.questions.map((item) => ({
            ...item,
            questionData: normalizeQuestionData(item?.questionData),
          }))
        : [];

      const safeSessionId = isValidId(sessionId) ? sessionId : null;
      setDraftSessionId(safeSessionId);
      setPreviewItems(questions);
      setSelectedQuestionIds(
        questions
          .filter((item) => isValidStatus(item.status) && isValidId(item.id))
          .map((item) => Number(item.id)),
      );
      persistDraftSessionId(safeSessionId);
    },
    [persistDraftSessionId],
  );

  const resetPreview = () => {
    setPreviewItems([]);
    setSelectedQuestionIds([]);
    setDraftSessionId(null);
    setExpandedQuestionId(null);
    persistDraftSessionId(null);
  };

  useEffect(() => {
    if (!hasValidBankId) {
      return;
    }

    const storageKey = getDraftSessionStorageKey(safeBankId);
    let storedSessionId = null;
    try {
      storedSessionId = Number(localStorage.getItem(storageKey));
    } catch {
      storedSessionId = null;
    }

    if (!isValidId(storedSessionId)) {
      return;
    }

    const hydrateDraft = async () => {
      setIsLoadingDraft(true);
      try {
        const response = await questionBankApi.getDraftAiSession(
          safeBankId,
          storedSessionId,
        );
        applyDraftResponse(response);
      } catch {
        persistDraftSessionId(null);
      } finally {
        setIsLoadingDraft(false);
      }
    };

    hydrateDraft();
  }, [applyDraftResponse, hasValidBankId, persistDraftSessionId, safeBankId]);

  const handleGenerate = async () => {
    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      setError("Không tìm thấy ngân hàng đề hợp lệ.");
      return;
    }

    const normalizedQuantity = Number(quantity);
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 1) {
      setError("Số lượng câu hỏi phải >= 1.");
      return;
    }

    const normalizedQuestionTypes = selectedQuestionTypes
      .map((type) => String(type ?? "").trim())
      .filter(Boolean);
    if (normalizedQuestionTypes.length === 0) {
      setError("Vui lòng chọn ít nhất một loại câu hỏi.");
      return;
    }

    setIsGenerating(true);
    setError("");
    try {
      const response = await questionBankApi.generateQuestionsWithAi(
        safeBankId,
        {
          difficulty,
          quantity: normalizedQuantity,
          questionTypes: normalizedQuestionTypes,
          additionalPrompt,
          rawText,
          file: referenceFile,
          sessionId: isValidId(draftSessionId) ? draftSessionId : null,
        },
      );
      const generatedSessionId = Number(response?.result?.sessionId);
      if (isValidId(generatedSessionId)) {
        try {
          const hydratedResponse = await questionBankApi.getDraftAiSession(
            safeBankId,
            generatedSessionId,
          );
          applyDraftResponse(hydratedResponse);
        } catch {
          // Fallback to generate payload if re-fetch fails unexpectedly.
          applyDraftResponse(response);
        }
      } else {
        applyDraftResponse(response);
      }
      toast.success(response?.message ?? "AI đã sinh câu hỏi thành công.");
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Không thể sinh câu hỏi bằng AI.";
      setError(message);
      resetPreview();
      toast.error(message, { id: `ai-generate-error-${Date.now()}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleQuestionType = (questionType) => {
    const normalizedType = String(questionType || "").toUpperCase();
    if (!normalizedType) {
      return;
    }

    setSelectedQuestionTypes((prev) => {
      if (prev.includes(normalizedType)) {
        return prev.filter((item) => item !== normalizedType);
      }
      return [...prev, normalizedType];
    });

    if (error) {
      setError("");
    }
  };

  const handleToggleSelectQuestion = (questionId) => {
    const normalizedId = Number(questionId);
    if (!isValidId(normalizedId)) {
      return;
    }

    setSelectedQuestionIds((prev) => {
      if (prev.includes(normalizedId)) {
        return prev.filter((id) => id !== normalizedId);
      }
      return [...prev, normalizedId];
    });
  };

  const handleEditQuestionContent = (rowNumber, content) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item.rowNumber === rowNumber
          ? {
              ...item,
              questionData: {
                ...item.questionData,
                content,
              },
            }
          : item,
      ),
    );
  };

  const handleEditQuestionField = (rowNumber, field, value) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item.rowNumber === rowNumber
          ? (() => {
              const nextQuestionData = {
                ...item.questionData,
                [field]: field === "defaultPoints" ? Number(value) : value,
              };

              if (field === "questionType") {
                nextQuestionData.questionType = String(
                  value || "",
                ).toUpperCase();
              }

              return {
                ...item,
                questionData: normalizeQuestionData(nextQuestionData),
              };
            })()
          : item,
      ),
    );
  };

  const handleEditOptionContent = (rowNumber, optionIndex, value) => {
    setPreviewItems((prev) =>
      prev.map((item) => {
        if (item.rowNumber !== rowNumber) {
          return item;
        }

        const options = Array.isArray(item.questionData?.options)
          ? item.questionData.options
          : [];

        return {
          ...item,
          questionData: {
            ...item.questionData,
            options: options.map((option, index) =>
              index === optionIndex ? { ...option, content: value } : option,
            ),
          },
        };
      }),
    );
  };

  const handleToggleCorrectOption = (rowNumber, optionIndex) => {
    setPreviewItems((prev) =>
      prev.map((item) => {
        if (item.rowNumber !== rowNumber) {
          return item;
        }

        const options = Array.isArray(item.questionData?.options)
          ? item.questionData.options
          : [];

        return {
          ...item,
          questionData: {
            ...item.questionData,
            options: options.map((option, index) => ({
              ...option,
              isCorrect: index === optionIndex,
            })),
          },
        };
      }),
    );
  };

  const addAnswerOption = (rowNumber) => {
    setPreviewItems((prev) =>
      prev.map((item) => {
        if (item.rowNumber !== rowNumber) {
          return item;
        }

        if (!isOptionsRequired(item.questionData?.questionType)) {
          return item;
        }

        const options = Array.isArray(item.questionData?.options)
          ? item.questionData.options
          : [];

        if (options.length >= 6) {
          return item;
        }

        return {
          ...item,
          questionData: {
            ...item.questionData,
            options: [...options, { content: "", isCorrect: false }],
          },
        };
      }),
    );
  };

  const removeAnswerOption = (rowNumber, optionIndex) => {
    setPreviewItems((prev) =>
      prev.map((item) => {
        if (item.rowNumber !== rowNumber) {
          return item;
        }

        const questionType = item.questionData?.questionType;
        if (!isOptionsRequired(questionType) || questionType === "TRUE_FALSE") {
          return item;
        }

        const options = Array.isArray(item.questionData?.options)
          ? item.questionData.options
          : [];

        if (options.length <= 1) {
          return item;
        }

        const nextOptions = options.filter((_, index) => index !== optionIndex);
        const hasCorrect = nextOptions.some((option) => option.isCorrect);

        return {
          ...item,
          questionData: {
            ...item.questionData,
            options: hasCorrect
              ? nextOptions
              : nextOptions.map((option, index) => ({
                  ...option,
                  isCorrect: index === 0,
                })),
          },
        };
      }),
    );
  };

  const validateQuestionBeforeSave = (item) => {
    const questionData = item?.questionData ?? {};
    const questionType = String(questionData.questionType || "").toUpperCase();
    const content = String(questionData.content ?? "").trim();
    const points = Number(questionData.defaultPoints ?? 0);

    if (!content) {
      return "Nội dung câu hỏi không được để trống.";
    }

    if (!Number.isFinite(points) || points < 0) {
      return "Điểm mặc định phải là số không âm.";
    }

    if (!isOptionsRequired(questionType)) {
      return null;
    }

    const options = Array.isArray(questionData.options)
      ? questionData.options
      : [];
    if (options.length === 0) {
      return "Câu hỏi này cần có ít nhất một đáp án.";
    }

    const hasEmptyOption = options.some(
      (option) => !String(option?.content ?? "").trim(),
    );
    if (hasEmptyOption) {
      return "Nội dung đáp án không được để trống.";
    }

    const correctCount = options.filter((option) =>
      Boolean(option?.isCorrect ?? option?.correct),
    ).length;
    if (correctCount !== 1) {
      return "Vui lòng chọn đúng một đáp án đúng.";
    }

    return null;
  };

  const handleAutosaveQuestion = async (item, options = {}) => {
    const { showSuccess = false } = options;
    const questionId = Number(item?.id);
    if (!isValidId(questionId)) {
      return false;
    }

    const validationMessage = validateQuestionBeforeSave(item);
    if (validationMessage) {
      toast.error(validationMessage, { id: `invalid-question-${questionId}` });
      return false;
    }

    setSavingQuestionIds((prev) =>
      prev.includes(questionId) ? prev : [...prev, questionId],
    );

    try {
      const response = await questionBankApi.updateQuestion(
        safeBankId,
        questionId,
        mapToQuestionUpdatePayload(item.questionData),
      );
      if (showSuccess) {
        toast.success(
          response?.message ?? `Đã lưu câu hỏi ID=${questionId} thành công.`,
          { id: `save-question-success-${questionId}` },
        );
      }
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ??
        `Không thể tự động lưu câu hỏi ID=${questionId}.`;
      toast.error(message, { id: `autosave-question-${questionId}` });
      return false;
    } finally {
      setSavingQuestionIds((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const handleSaveQuestionById = async (questionId) => {
    const target = previewItems.find(
      (item) => Number(item.id) === Number(questionId),
    );
    if (!target) {
      return;
    }
    const isSaved = await handleAutosaveQuestion(target, { showSuccess: true });
    if (isSaved) {
      setExpandedQuestionId((prev) =>
        prev === Number(questionId) ? null : prev,
      );
    }
  };

  const handleCancelDraftSession = async (shouldNavigate = true) => {
    if (!isValidId(draftSessionId)) {
      if (shouldNavigate) {
        navigate(PATH_TEACHER.questionBank);
      } else {
        resetPreview();
      }
      return;
    }

    setIsCancelling(true);
    try {
      const response = await questionBankApi.cancelAiSession(
        safeBankId,
        draftSessionId,
      );
      toast.success(response?.message ?? "Đã huỷ phiên nháp AI thành công.");
      resetPreview();
      if (shouldNavigate) {
        navigate(PATH_TEACHER.questionBank);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Huỷ phiên nháp AI thất bại.";
      setError(message);
      toast.error(message, { id: `cancel-ai-session-${Date.now()}` });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirm = async () => {
    if (!isValidId(draftSessionId)) {
      setError("Không tìm thấy phiên nháp hợp lệ để xác nhận.");
      return;
    }

    if (confirmPayload.length === 0) {
      setError("Không có câu hỏi hợp lệ để xác nhận lưu.");
      return;
    }

    setIsConfirming(true);
    setError("");
    try {
      const response = await questionBankApi.confirmAiQuestions(
        safeBankId,
        draftSessionId,
        confirmPayload,
      );
      toast.success(
        response?.message ?? "Đã lưu chính thức các câu hỏi thành công.",
      );
      resetPreview();
      navigate(PATH_TEACHER.questionBank);
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Xác nhận câu hỏi AI thất bại.";
      setError(message);
      toast.error(message, { id: `ai-confirm-error-${Date.now()}` });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="create-question-ai-page">
      <section className="ai-config-card">
        <button
          type="button"
          className="ai-back-btn"
          onClick={() =>
            navigate(
              hasValidBankId
                ? PATH_TEACHER.questionBankMethod(safeBankId)
                : PATH_TEACHER.questionBank,
            )
          }
        >
          <ArrowLeft size={16} />
          Quay lại chọn phương thức
        </button>

        <div className="ai-title-row">
          <div className="ai-title-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <h1>Tạo câu hỏi bằng AI</h1>
            <p>
              Ngân hàng đề ID #{Number.isFinite(safeBankId) ? safeBankId : "-"}
            </p>
          </div>
        </div>

        <div className="ai-config-grid">
          <div>
            <label>Độ khó</label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              disabled={isGenerating || isConfirming || isLoadingDraft}
            >
              {AI_DIFFICULTIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Số lượng câu hỏi</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={isGenerating || isConfirming || isLoadingDraft}
            />
          </div>

          <div>
            <label>Tải file tài liệu</label>
            <input
              type="file"
              onChange={(event) =>
                setReferenceFile(event.target.files?.[0] ?? null)
              }
              disabled={isGenerating || isConfirming || isLoadingDraft}
            />
          </div>

          <div className="ai-field-full">
            <label>Loại câu hỏi cần sinh</label>
            <div className="ai-question-type-list">
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="ai-check-option">
                  <input
                    type="checkbox"
                    checked={selectedQuestionTypes.includes(option.value)}
                    onChange={() => handleToggleQuestionType(option.value)}
                    disabled={isGenerating || isConfirming || isLoadingDraft}
                  />
                  <span>
                    {option.label} ({option.value})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="ai-field-full">
            <label>Gợi ý thêm cho AI (tuỳ chọn)</label>
            <textarea
              rows={3}
              value={additionalPrompt}
              onChange={(event) => setAdditionalPrompt(event.target.value)}
              placeholder="Ví dụ: ưu tiên câu hỏi bám sát chương Hàm số bậc nhất, có tính phân hoá..."
              disabled={isGenerating || isConfirming || isLoadingDraft}
            />
          </div>

          <div className="ai-field-full">
            <label>Nội dung văn bản tham chiếu (tuỳ chọn)</label>
            <textarea
              rows={5}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Dán nội dung tài liệu, ghi chú bài học hoặc yêu cầu cụ thể để AI phân tích..."
              disabled={isGenerating || isConfirming || isLoadingDraft}
            />
          </div>
        </div>

        <div className="ai-config-actions">
          <button
            type="button"
            className="ai-secondary-btn"
            onClick={() => handleCancelDraftSession(false)}
            disabled={
              isGenerating || isConfirming || isCancelling || isLoadingDraft
            }
          >
            {isCancelling ? "Đang huỷ..." : "Xoá kết quả"}
          </button>
          <button
            type="button"
            className="ai-primary-btn"
            onClick={handleGenerate}
            disabled={
              isGenerating || isConfirming || isCancelling || isLoadingDraft
            }
          >
            {isGenerating ? "Đang sinh..." : "AI sinh câu hỏi"}
          </button>
        </div>

        {isLoadingDraft && (
          <div className="ai-ready-row">
            <CheckCircle2 size={16} />
            <span>Đang tải lại phiên nháp đã lưu...</span>
          </div>
        )}

        {error && (
          <div className="ai-error-box">
            <CircleAlert size={16} />
            <span>{error}</span>
          </div>
        )}
      </section>

      <section className="ai-preview-card">
        <div className="ai-preview-head">
          <h2>Preview câu hỏi AI</h2>
          <div className="ai-preview-stats">
            <span className="ok">VALID: {validCount}</span>
            <span className="bad">INVALID: {invalidCount}</span>
          </div>
        </div>

        {previewItems.length === 0 ? (
          <p className="ai-empty">Chưa có dữ liệu preview từ AI.</p>
        ) : (
          <div className="ai-table-wrap">
            <table className="ai-table">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>Dòng</th>
                  <th>Trạng thái</th>
                  <th>Nội dung</th>
                  <th>Loại</th>
                  <th>Độ khó</th>
                  <th>Điểm</th>
                  <th>Thao tác</th>
                  <th>Lỗi</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((item) => {
                  const questionId = Number(item.id);
                  const isExpanded = expandedQuestionId === questionId;
                  const isSaving = savingQuestionIds.includes(questionId);

                  return (
                    <Fragment key={`row-${item.id ?? item.rowNumber}`}>
                      <tr key={`summary-${item.id ?? item.rowNumber}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedQuestionIds.includes(
                              Number(item.id),
                            )}
                            onChange={() => handleToggleSelectQuestion(item.id)}
                            disabled={
                              !isValidStatus(item.status) ||
                              !isValidId(item.id) ||
                              isGenerating ||
                              isConfirming ||
                              isCancelling
                            }
                          />
                        </td>
                        <td>{item.rowNumber}</td>
                        <td>
                          <span
                            className={`status-chip ${isValidStatus(item.status) ? "valid" : "invalid"}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="ai-content-cell">
                          {toQuestionSnippet(item.questionData?.content)}
                        </td>
                        <td>
                          {getQuestionTypeLabel(
                            item.questionData?.questionType || "-",
                          )}
                        </td>
                        <td>
                          {getDifficultyLabel(
                            item.questionData?.difficulty || "-",
                          )}
                        </td>
                        <td>{Number(item.questionData?.defaultPoints ?? 0)}</td>
                        <td>
                          <button
                            type="button"
                            className="ai-link-btn"
                            onClick={() =>
                              setExpandedQuestionId((prev) =>
                                prev === questionId ? null : questionId,
                              )
                            }
                            disabled={!isValidId(questionId)}
                          >
                            {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                          </button>
                        </td>
                        <td>
                          {Array.isArray(item.errors) && item.errors.length > 0
                            ? item.errors.join("; ")
                            : "-"}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr
                          key={`detail-${item.id ?? item.rowNumber}`}
                          className="ai-detail-row"
                        >
                          <td colSpan={9}>
                            <div className="ai-detail-card">
                              <div className="ai-detail-grid">
                                <div className="ai-field-full">
                                  <label>Nội dung câu hỏi</label>
                                  <textarea
                                    rows={5}
                                    value={item.questionData?.content || ""}
                                    onChange={(event) =>
                                      handleEditQuestionContent(
                                        item.rowNumber,
                                        event.target.value,
                                      )
                                    }
                                    disabled={
                                      isGenerating ||
                                      isConfirming ||
                                      isCancelling ||
                                      isSaving
                                    }
                                  />
                                </div>

                                <div>
                                  <label>Loại câu hỏi</label>
                                  <select
                                    value={
                                      item.questionData?.questionType ||
                                      "MULTIPLE_CHOICE"
                                    }
                                    onChange={(event) =>
                                      handleEditQuestionField(
                                        item.rowNumber,
                                        "questionType",
                                        event.target.value,
                                      )
                                    }
                                    disabled={
                                      isGenerating ||
                                      isConfirming ||
                                      isCancelling ||
                                      isSaving
                                    }
                                  >
                                    {QUESTION_TYPE_OPTIONS.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label} ({option.value})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label>Độ khó</label>
                                  <select
                                    value={
                                      item.questionData?.difficulty || "MEDIUM"
                                    }
                                    onChange={(event) =>
                                      handleEditQuestionField(
                                        item.rowNumber,
                                        "difficulty",
                                        event.target.value,
                                      )
                                    }
                                    disabled={
                                      isGenerating ||
                                      isConfirming ||
                                      isCancelling ||
                                      isSaving
                                    }
                                  >
                                    {AI_DIFFICULTIES.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label} ({option.value})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label>Điểm mặc định</label>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={Number(
                                      item.questionData?.defaultPoints ?? 0,
                                    )}
                                    onChange={(event) =>
                                      handleEditQuestionField(
                                        item.rowNumber,
                                        "defaultPoints",
                                        event.target.value,
                                      )
                                    }
                                    disabled={
                                      isGenerating ||
                                      isConfirming ||
                                      isCancelling ||
                                      isSaving
                                    }
                                  />
                                </div>

                                {item.questionData?.questionType ===
                                  "ESSAY" && (
                                  <div className="ai-field-full">
                                    <label>Đáp án tham khảo</label>
                                    <textarea
                                      rows={4}
                                      value={
                                        item.questionData?.sampleAnswer || ""
                                      }
                                      onChange={(event) =>
                                        handleEditQuestionField(
                                          item.rowNumber,
                                          "sampleAnswer",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Nhập đáp án tham khảo cho câu tự luận..."
                                      disabled={
                                        isGenerating ||
                                        isConfirming ||
                                        isCancelling ||
                                        isSaving
                                      }
                                    />
                                  </div>
                                )}

                                {isOptionsRequired(
                                  item.questionData?.questionType,
                                ) && (
                                  <div className="ai-field-full ai-options-block">
                                    <div className="ai-options-head">
                                      <label>Đáp án</label>
                                      {item.questionData?.questionType !==
                                        "TRUE_FALSE" && (
                                        <button
                                          type="button"
                                          className="ai-link-btn"
                                          onClick={() =>
                                            addAnswerOption(item.rowNumber)
                                          }
                                          disabled={
                                            isGenerating ||
                                            isConfirming ||
                                            isCancelling ||
                                            isSaving
                                          }
                                        >
                                          Thêm đáp án
                                        </button>
                                      )}
                                    </div>

                                    <div className="ai-options-list">
                                      {(item.questionData?.options ?? []).map(
                                        (option, optionIndex) => {
                                          const isCorrect = Boolean(
                                            option?.isCorrect ??
                                            option?.correct,
                                          );

                                          return (
                                            <div
                                              className="ai-option-row"
                                              key={`${item.id}-${optionIndex}`}
                                            >
                                              <button
                                                type="button"
                                                className={`ai-correct-toggle ${isCorrect ? "active" : ""}`}
                                                onClick={() =>
                                                  handleToggleCorrectOption(
                                                    item.rowNumber,
                                                    optionIndex,
                                                  )
                                                }
                                                disabled={
                                                  isGenerating ||
                                                  isConfirming ||
                                                  isCancelling ||
                                                  isSaving
                                                }
                                              >
                                                {isCorrect ? "Đúng" : "Sai"}
                                              </button>

                                              <input
                                                type="text"
                                                value={option?.content ?? ""}
                                                onChange={(event) =>
                                                  handleEditOptionContent(
                                                    item.rowNumber,
                                                    optionIndex,
                                                    event.target.value,
                                                  )
                                                }
                                                placeholder={`Đáp án ${optionIndex + 1}`}
                                                disabled={
                                                  isGenerating ||
                                                  isConfirming ||
                                                  isCancelling ||
                                                  isSaving
                                                }
                                              />

                                              {item.questionData
                                                ?.questionType !==
                                                "TRUE_FALSE" && (
                                                <button
                                                  type="button"
                                                  className="ai-remove-option-btn"
                                                  onClick={() =>
                                                    removeAnswerOption(
                                                      item.rowNumber,
                                                      optionIndex,
                                                    )
                                                  }
                                                  disabled={
                                                    isGenerating ||
                                                    isConfirming ||
                                                    isCancelling ||
                                                    isSaving ||
                                                    (
                                                      item.questionData
                                                        ?.options ?? []
                                                    ).length <= 1
                                                  }
                                                >
                                                  Xoá
                                                </button>
                                              )}
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="ai-detail-actions">
                                {isSaving && <span>Đang lưu thay đổi...</span>}
                                <button
                                  type="button"
                                  className="ai-primary-btn"
                                  onClick={() =>
                                    handleSaveQuestionById(questionId)
                                  }
                                  disabled={
                                    isGenerating ||
                                    isConfirming ||
                                    isCancelling ||
                                    isSaving ||
                                    !isValidId(questionId)
                                  }
                                >
                                  Lưu thay đổi câu hỏi
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="ai-preview-actions">
          <button
            type="button"
            className="ai-secondary-btn"
            onClick={() => handleCancelDraftSession(true)}
            disabled={
              isGenerating || isConfirming || isCancelling || isLoadingDraft
            }
          >
            {isCancelling ? "Đang huỷ..." : "Huỷ"}
          </button>
          <button
            type="button"
            className="ai-primary-btn"
            disabled={
              isGenerating ||
              isConfirming ||
              isCancelling ||
              isLoadingDraft ||
              !isValidId(draftSessionId) ||
              confirmPayload.length === 0
            }
            onClick={handleConfirm}
          >
            {isConfirming ? "Đang lưu..." : "Lưu câu hỏi vào ngân hàng"}
          </button>
        </div>

        {confirmPayload.length > 0 && (
          <div className="ai-ready-row">
            <CheckCircle2 size={16} />
            <span>{confirmPayload.length} câu hợp lệ sẵn sàng để lưu.</span>
          </div>
        )}
      </section>
    </div>
  );
};

export default CreateQuestionAiPage;
