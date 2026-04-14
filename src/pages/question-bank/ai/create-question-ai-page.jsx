import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Send,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { questionBankApi } from "@/apis/question-bank.api";
import { PATH_TEACHER } from "@/routes/paths";

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

const QUICK_PROMPTS = [
  "Làm khó hơn câu hỏi số 1",
  "Đổi câu 2 sang dạng tự luận",
  "Sinh thêm 3 câu về chủ đề này",
  "Viết lại đáp án rõ ràng hơn",
];

const isValidStatus = (status) =>
  String(status || "").toUpperCase() === "VALID";
const isValidId = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0;
const isOptionsRequired = (questionType) =>
  OPTIONS_REQUIRED_TYPES.includes(String(questionType || "").toUpperCase());

const createDefaultOptions = (questionType) => {
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

const normalizeQuestion = (questionData = {}) => {
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

  const options =
    normalizedOptions.length > 0
      ? normalizedOptions
      : createDefaultOptions(questionType);
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

const toSnippet = (content) => {
  const normalized = String(content ?? "").trim();
  if (!normalized) {
    return "-";
  }
  if (normalized.length <= 90) {
    return normalized;
  }
  return `${normalized.slice(0, 140)}...`;
};

const getDiffLabel = (value) =>
  AI_DIFFICULTIES.find((item) => item.value === value)?.label ?? value;

const getTypeLabel = (value) =>
  QUESTION_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;

const draftKey = (bankId) => `qb-ai-draft:${bankId}`;
const CHAT_TOP_ALIGN_ADJUST = 12;

const ChatPanel = ({ previewCount, selectedCount, onSendPrompt, disabled }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Xin chào! Tôi có thể giúp bạn tinh chỉnh các câu hỏi AI vừa tạo. Hãy sinh câu hỏi trước, sau đó yêu cầu tôi chỉnh sửa theo ý muốn!",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text) => {
    const message = String(text || input).trim();
    if (!message || disabled) {
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setIsTyping(true);
    try {
      await new Promise((resolve) =>
        setTimeout(resolve, 900 + Math.random() * 600),
      );
      const reply = await onSendPrompt(message);
      setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div style={cs.panel}>
      <div style={cs.panelHeader}>
        <div style={cs.panelHeaderRow}>
          <div style={cs.aiAvatarLg}>
            <Star size={18} style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={cs.panelTitle}>AI Tinh chỉnh câu hỏi</div>
            <div style={cs.panelStatus}>
              <span style={cs.statusDot} />
              Sẵn sàng hỗ trợ ({previewCount} câu)
            </div>
            {selectedCount > 0 && (
              <div style={cs.selectionHint}>
                Đang chọn {selectedCount} câu để tinh chỉnh theo yêu cầu.
              </div>
            )}
          </div>
        </div>

        <div style={cs.quickRow}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              style={cs.quickBtn}
              disabled={disabled}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div style={cs.messagesArea}>
        {messages.map((message, index) =>
          message.role === "user" ? (
            <div
              key={`${message.role}-${index}`}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                animation: "msgIn .3s ease both",
              }}
            >
              <div style={{ maxWidth: 220 }}>
                <div style={cs.userBubble}>{message.text}</div>
                <div style={cs.timeLabel}>vừa xong</div>
              </div>
            </div>
          ) : (
            <div
              key={`${message.role}-${index}`}
              style={{ animation: "msgIn .3s ease both" }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <div style={cs.aiAvatarSm}>
                  <Sparkles size={12} style={{ color: "#fff" }} />
                </div>
                <div style={cs.aiBubble}>
                  <div style={cs.aiBubbleLabel}>AI Assistant</div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
              <div style={{ ...cs.timeLabel, marginLeft: 36 }}>vừa xong</div>
            </div>
          ),
        )}

        {isTyping && (
          <div style={{ animation: "msgIn .3s ease both" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={cs.aiAvatarSm}>
                <Sparkles size={12} style={{ color: "#fff" }} />
              </div>
              <div style={cs.aiBubble}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map((item) => (
                    <span
                      key={item}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#7c3aed",
                        display: "inline-block",
                        animation: `pulse 1s ${item * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={cs.inputArea}>
        <div style={cs.inputBox}>
          <textarea
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Yêu cầu AI tinh chỉnh... VD: Làm khó hơn câu 1, đổi câu 2 sang tự luận..."
            style={cs.textarea}
          />
          <div style={cs.inputFooter}>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>
              Enter gửi · Shift+Enter xuống dòng
            </span>
            <button
              onClick={() => send()}
              style={cs.sendBtn}
              disabled={!input.trim() || disabled}
            >
              <Send size={13} /> Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateQuestionAiPage = () => {
  const navigate = useNavigate();
  const { bankId } = useParams();
  const safeBankId = Number(bankId);
  const hasValidBankId = isValidId(safeBankId);

  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [quantity, setQuantity] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState(["MULTIPLE_CHOICE"]);
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [rawText, setRawText] = useState("");
  const [referenceFile, setReferenceFile] = useState(null);

  const [draftSessionId, setDraftSessionId] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [savingIds, setSavingIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [chatTopOffset, setChatTopOffset] = useState(24);

  const introRef = useRef(null);

  useLayoutEffect(() => {
    const updateOffset = () => {
      const introHeight = introRef.current?.offsetHeight ?? 0;
      setChatTopOffset(24 + introHeight + CHAT_TOP_ALIGN_ADJUST);
    };

    updateOffset();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateOffset);
      return () => {
        window.removeEventListener("resize", updateOffset);
      };
    }

    const observer = new ResizeObserver(() => {
      updateOffset();
    });

    if (introRef.current) {
      observer.observe(introRef.current);
    }

    window.addEventListener("resize", updateOffset);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOffset);
    };
  }, []);

  const validCount = useMemo(
    () => previewItems.filter((item) => isValidStatus(item.status)).length,
    [previewItems],
  );

  const invalidCount = previewItems.length - validCount;

  const confirmPayload = useMemo(() => {
    const validDraftIds = previewItems
      .filter((item) => isValidStatus(item.status) && isValidId(item.id))
      .map((item) => Number(item.id));

    return selectedIds.filter((id) => validDraftIds.includes(Number(id)));
  }, [previewItems, selectedIds]);

  const persistDraft = useCallback(
    (sessionId) => {
      if (!hasValidBankId) {
        return;
      }

      try {
        if (isValidId(sessionId)) {
          localStorage.setItem(draftKey(safeBankId), String(sessionId));
        } else {
          localStorage.removeItem(draftKey(safeBankId));
        }
      } catch {
        // Ignore storage failures.
      }
    },
    [hasValidBankId, safeBankId],
  );

  const applyDraft = useCallback(
    (response) => {
      const sessionId = Number(response?.result?.sessionId);
      const questions = Array.isArray(response?.result?.questions)
        ? response.result.questions.map((item) => ({
            ...item,
            questionData: normalizeQuestion(item?.questionData),
          }))
        : [];

      const safeSessionId = isValidId(sessionId) ? sessionId : null;
      setDraftSessionId(safeSessionId);
      setPreviewItems(questions);
      setSelectedIds(
        questions
          .filter((item) => isValidStatus(item.status) && isValidId(item.id))
          .map((item) => Number(item.id)),
      );
      persistDraft(safeSessionId);
    },
    [persistDraft],
  );

  const resetPreview = useCallback(() => {
    setPreviewItems([]);
    setSelectedIds([]);
    setDraftSessionId(null);
    setExpandedId(null);
    persistDraft(null);
  }, [persistDraft]);

  useEffect(() => {
    if (!hasValidBankId) {
      return;
    }

    let storedSessionId = null;
    try {
      storedSessionId = Number(localStorage.getItem(draftKey(safeBankId)));
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
        applyDraft(response);
      } catch {
        persistDraft(null);
      } finally {
        setIsLoadingDraft(false);
      }
    };

    hydrateDraft();
  }, [applyDraft, hasValidBankId, persistDraft, safeBankId]);

  const handleGenerate = async () => {
    if (!hasValidBankId) {
      setError("Không tìm thấy ngân hàng đề hợp lệ.");
      return;
    }

    const normalizedQuantity = Number(quantity);
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 1) {
      setError("Số lượng câu hỏi phải >= 1.");
      return;
    }

    if (selectedTypes.length === 0) {
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
          questionTypes: selectedTypes,
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
          applyDraft(hydratedResponse);
        } catch {
          applyDraft(response);
        }
      } else {
        applyDraft(response);
      }

      toast.success(response?.message ?? "AI đã sinh câu hỏi thành công.");
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Không thể sinh câu hỏi bằng AI.";
      setError(message);
      resetPreview();
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!isValidId(draftSessionId)) {
      setError("Không tìm thấy phiên nháp hợp lệ.");
      return;
    }

    if (confirmPayload.length === 0) {
      setError("Không có câu hỏi hợp lệ để lưu.");
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
      toast.success(response?.message ?? "Đã lưu câu hỏi thành công.");
      resetPreview();
      navigate(PATH_TEACHER.questionBank);
    } catch (err) {
      const message = err.response?.data?.message ?? "Xác nhận thất bại.";
      setError(message);
      toast.error(message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async (shouldNavigate = true) => {
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
      await questionBankApi.cancelAiSession(safeBankId, draftSessionId);
      resetPreview();
      if (shouldNavigate) {
        navigate(PATH_TEACHER.questionBank);
      }
    } catch (err) {
      const message = err.response?.data?.message ?? "Huỷ phiên nháp thất bại.";
      setError(message);
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveQuestionById = async (questionId) => {
    const normalizedId = Number(questionId);
    if (!isValidId(normalizedId)) {
      return;
    }

    const target = previewItems.find(
      (item) => Number(item.id) === normalizedId,
    );
    if (!target) {
      return;
    }

    setSavingIds((prev) =>
      prev.includes(normalizedId) ? prev : [...prev, normalizedId],
    );
    try {
      const response = await questionBankApi.updateQuestion(
        safeBankId,
        normalizedId,
        mapToQuestionUpdatePayload(target.questionData),
      );
      toast.success(response?.message ?? "Đã lưu thay đổi câu hỏi.");
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Không thể lưu thay đổi câu hỏi.";
      toast.error(message);
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== normalizedId));
    }
  };

  const toggleType = (questionType) => {
    const normalizedType = String(questionType || "").toUpperCase();
    if (!normalizedType) {
      return;
    }

    setSelectedTypes((prev) =>
      prev.includes(normalizedType)
        ? prev.filter((item) => item !== normalizedType)
        : [...prev, normalizedType],
    );
    if (error) {
      setError("");
    }
  };

  const toggleSelect = (questionId) => {
    const normalizedId = Number(questionId);
    if (!isValidId(normalizedId)) {
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((item) => item !== normalizedId)
        : [...prev, normalizedId],
    );
  };

  const handleChatPrompt = async (prompt) => {
    const normalizedPrompt = String(prompt || "").trim();
    if (!normalizedPrompt) {
      return "Vui lòng nhập yêu cầu trước khi gửi cho AI.";
    }

    if (!isValidId(draftSessionId)) {
      return "Bạn cần sinh câu hỏi AI trước khi tinh chỉnh bằng chat.";
    }

    setIsRefining(true);
    try {
      const validDraftIds = previewItems
        .filter((item) => isValidStatus(item.status) && isValidId(item.id))
        .map((item) => Number(item.id));

      const selectedValidIds = selectedIds
        .map((id) => Number(id))
        .filter((id) => isValidId(id) && validDraftIds.includes(id));

      const shouldSendSelectedSubset =
        selectedValidIds.length > 0 &&
        selectedValidIds.length < validDraftIds.length;

      const refinePayload = {
        prompt: normalizedPrompt,
      };

      if (shouldSendSelectedSubset) {
        refinePayload.selectQuestionIds = selectedValidIds;
      }

      const response = await questionBankApi.refineAiQuestions(
        safeBankId,
        draftSessionId,
        refinePayload,
      );

      applyDraft(response);
      const warnings = Array.isArray(response?.result?.warnings)
        ? response.result.warnings.filter(Boolean)
        : [];

      if (warnings.length > 0) {
        toast.warning(warnings.join("; "));
      }

      const targetScopeText = shouldSendSelectedSubset
        ? `Đã tinh chỉnh ${selectedValidIds.length} câu bạn đang chọn.`
        : "Đã tinh chỉnh toàn bộ câu hỏi trong phiên nháp.";

      return `${targetScopeText} ${response?.message ?? "Bạn có thể kiểm tra lại bảng Preview."}${warnings.length > 0 ? ` Cảnh báo: ${warnings.join(" ")}` : ""}`;
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Không thể tinh chỉnh câu hỏi bằng AI.";
      toast.error(message);
      return message;
    } finally {
      setIsRefining(false);
    }
  };

  const busy =
    isGenerating ||
    isConfirming ||
    isCancelling ||
    isLoadingDraft ||
    isRefining;

  return (
    <div style={s.root}>
      <div style={s.body}>
        <div style={s.left}>
          <div style={s.leftInner}>
            <div ref={introRef}>
              <button
                onClick={() =>
                  navigate(
                    hasValidBankId
                      ? PATH_TEACHER.questionBankMethod(safeBankId)
                      : PATH_TEACHER.questionBank,
                  )
                }
                style={s.backBtn}
              >
                <ArrowLeft size={15} /> Quay lại chọn phương thức
              </button>

              <div style={s.pgHead}>
                <div style={s.pgIcon}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h1 style={s.pgTitle}>Tạo câu hỏi bằng AI</h1>
                  <p style={s.pgSub}>
                    Ngân hàng đề ID #{hasValidBankId ? safeBankId : "-"}
                  </p>
                </div>
              </div>

              {error && (
                <div style={s.errBox}>
                  <CircleAlert size={15} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>{error}</span>
                  <button
                    onClick={() => setError("")}
                    style={s.errorCloseBtn}
                    aria-label="Đóng lỗi"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            <div style={s.card}>
              <div style={s.sectionTitle}>Cấu hình sinh câu hỏi</div>
              <div style={s.configGrid}>
                <div style={s.field}>
                  <label style={s.lbl}>Độ khó</label>
                  <div style={s.selWrap}>
                    <select
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                      disabled={busy}
                      style={s.select}
                    >
                      {AI_DIFFICULTIES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.value})
                        </option>
                      ))}
                    </select>
                    <span style={s.selArrow}>▾</span>
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.lbl}>Số lượng câu hỏi</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    disabled={busy}
                    style={s.input}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.lbl}>Tải file tài liệu</label>
                  <input
                    type="file"
                    onChange={(event) =>
                      setReferenceFile(event.target.files?.[0] ?? null)
                    }
                    disabled={busy}
                    style={{ ...s.input, padding: "7px 10px", fontSize: 12 }}
                  />
                </div>

                <div style={s.field}>
                  <label style={s.lbl}>Loại câu hỏi</label>
                  <div style={s.questionTypesWrap}>
                    {QUESTION_TYPE_OPTIONS.map((option) => {
                      const isActive = selectedTypes.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          style={s.questionTypeItem(isActive)}
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleType(option.value)}
                            disabled={busy}
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ ...s.field, gridColumn: "1/-1" }}>
                  <label style={s.lbl}>
                    Nội dung văn bản tham chiếu
                    <span style={s.optionalLabel}> (tuỳ chọn)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rawText}
                    onChange={(event) => setRawText(event.target.value)}
                    disabled={busy}
                    placeholder="Dán nội dung tài liệu, ghi chú bài học..."
                    style={s.textarea}
                  />
                </div>

                <div style={{ ...s.field, gridColumn: "1/-1" }}>
                  <label style={s.lbl}>
                    Gợi ý thêm cho AI
                    <span style={s.optionalLabel}> (tuỳ chọn)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={additionalPrompt}
                    onChange={(event) =>
                      setAdditionalPrompt(event.target.value)
                    }
                    disabled={busy}
                    placeholder="Ưu tiên câu hỏi bám sát chương Hàm số bậc nhất, có tính phân hoá..."
                    style={s.textarea}
                  />
                </div>
              </div>

              <div style={s.configActions}>
                <button
                  onClick={() => handleCancel(false)}
                  disabled={busy}
                  style={s.btnSecondary}
                >
                  {isCancelling ? "Đang huỷ..." : "Xoá kết quả"}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={busy}
                  style={s.btnPrimaryAccent}
                >
                  {isGenerating ? (
                    "Đang sinh..."
                  ) : (
                    <>
                      <Sparkles size={14} /> AI sinh câu hỏi
                    </>
                  )}
                </button>
              </div>

              {isLoadingDraft && (
                <div style={s.readyRow}>
                  <CheckCircle2 size={14} />
                  <span>Đang tải lại phiên nháp...</span>
                </div>
              )}
            </div>

            <div style={s.card}>
              <div style={s.previewHeader}>
                <h2 style={s.previewTitle}>Preview câu hỏi AI</h2>
                <div style={s.previewStats}>
                  <span style={s.validBadge}>VALID: {validCount}</span>
                  <span style={s.invalidBadge}>INVALID: {invalidCount}</span>
                </div>
              </div>

              {previewItems.length === 0 ? (
                <p style={s.emptyText}>
                  Chưa có dữ liệu preview từ AI. Nhấn "AI sinh câu hỏi" để bắt
                  đầu.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={s.table}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {[
                          "Chọn",
                          "STT",
                          "Trạng thái",
                          "Nội dung",
                          "Loại",
                          "Độ khó",
                          "Điểm",
                          "Thao tác",
                          "Lỗi",
                        ].map((header) => (
                          <th key={header} style={s.tableHeadCell}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewItems.map((item) => {
                        const questionId = Number(item.id);
                        const isExpanded = expandedId === questionId;
                        const isSaving = savingIds.includes(questionId);
                        const isValid = isValidStatus(item.status);

                        return (
                          <Fragment key={`row-${item.id ?? item.rowNumber}`}>
                            <tr style={s.summaryRow(isValid)}>
                              <td style={s.tableCell}>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(questionId)}
                                  onChange={() => toggleSelect(questionId)}
                                  disabled={
                                    !isValid || !isValidId(questionId) || busy
                                  }
                                />
                              </td>
                              <td style={s.rowNumberCell}>{item.rowNumber}</td>
                              <td style={s.tableCell}>
                                <span style={s.statusChip(isValid)}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={s.contentCell}>
                                {toSnippet(item.questionData?.content)}
                              </td>
                              <td style={s.dimCell}>
                                {getTypeLabel(item.questionData?.questionType)}
                              </td>
                              <td style={s.dimCell}>
                                {getDiffLabel(item.questionData?.difficulty)}
                              </td>
                              <td style={s.tableCell}>
                                {Number(item.questionData?.defaultPoints ?? 0)}
                              </td>
                              <td style={s.tableCell}>
                                <button
                                  onClick={() =>
                                    setExpandedId((prev) =>
                                      prev === questionId ? null : questionId,
                                    )
                                  }
                                  disabled={!isValidId(questionId)}
                                  style={s.expandBtn}
                                >
                                  {isExpanded ? "Ẩn" : "Xem"}
                                </button>
                              </td>
                              <td style={s.errorCell}>
                                {Array.isArray(item.errors) &&
                                item.errors.length > 0
                                  ? item.errors.join("; ")
                                  : "-"}
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr style={{ background: "#fafafa" }}>
                                <td
                                  colSpan={9}
                                  style={{ padding: "16px 20px" }}
                                >
                                  <div style={s.detailCard}>
                                    <div style={s.detailGrid}>
                                      <div style={{ gridColumn: "1/-1" }}>
                                        <label style={s.lbl}>
                                          Nội dung câu hỏi
                                        </label>
                                        <textarea
                                          rows={4}
                                          value={
                                            item.questionData?.content || ""
                                          }
                                          disabled={busy || isSaving}
                                          style={{
                                            ...s.textarea,
                                            marginTop: 6,
                                          }}
                                          onChange={(event) =>
                                            setPreviewItems((prev) =>
                                              prev.map((current) =>
                                                current.rowNumber ===
                                                item.rowNumber
                                                  ? {
                                                      ...current,
                                                      questionData: {
                                                        ...current.questionData,
                                                        content:
                                                          event.target.value,
                                                      },
                                                    }
                                                  : current,
                                              ),
                                            )
                                          }
                                        />
                                      </div>

                                      <div>
                                        <label style={s.lbl}>
                                          Loại câu hỏi
                                        </label>
                                        <div style={s.selWrap}>
                                          <select
                                            value={
                                              item.questionData?.questionType ||
                                              "MULTIPLE_CHOICE"
                                            }
                                            disabled={busy || isSaving}
                                            style={s.select}
                                            onChange={(event) =>
                                              setPreviewItems((prev) =>
                                                prev.map((current) =>
                                                  current.rowNumber ===
                                                  item.rowNumber
                                                    ? {
                                                        ...current,
                                                        questionData:
                                                          normalizeQuestion({
                                                            ...current.questionData,
                                                            questionType:
                                                              event.target
                                                                .value,
                                                          }),
                                                      }
                                                    : current,
                                                ),
                                              )
                                            }
                                          >
                                            {QUESTION_TYPE_OPTIONS.map(
                                              (option) => (
                                                <option
                                                  key={option.value}
                                                  value={option.value}
                                                >
                                                  {option.label}
                                                </option>
                                              ),
                                            )}
                                          </select>
                                          <span style={s.selArrow}>▾</span>
                                        </div>
                                      </div>

                                      <div>
                                        <label style={s.lbl}>
                                          Điểm mặc định
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step={0.5}
                                          value={Number(
                                            item.questionData?.defaultPoints ??
                                              0,
                                          )}
                                          disabled={busy || isSaving}
                                          style={s.input}
                                          onChange={(event) =>
                                            setPreviewItems((prev) =>
                                              prev.map((current) =>
                                                current.rowNumber ===
                                                item.rowNumber
                                                  ? {
                                                      ...current,
                                                      questionData: {
                                                        ...current.questionData,
                                                        defaultPoints: Number(
                                                          event.target.value,
                                                        ),
                                                      },
                                                    }
                                                  : current,
                                              ),
                                            )
                                          }
                                        />
                                      </div>

                                      {item.questionData?.questionType ===
                                        "ESSAY" && (
                                        <div style={{ gridColumn: "1/-1" }}>
                                          <label style={s.lbl}>
                                            Đáp án tham khảo
                                          </label>
                                          <textarea
                                            rows={3}
                                            value={
                                              item.questionData?.sampleAnswer ||
                                              ""
                                            }
                                            disabled={busy || isSaving}
                                            style={{
                                              ...s.textarea,
                                              marginTop: 6,
                                            }}
                                            onChange={(event) =>
                                              setPreviewItems((prev) =>
                                                prev.map((current) =>
                                                  current.rowNumber ===
                                                  item.rowNumber
                                                    ? {
                                                        ...current,
                                                        questionData: {
                                                          ...current.questionData,
                                                          sampleAnswer:
                                                            event.target.value,
                                                        },
                                                      }
                                                    : current,
                                                ),
                                              )
                                            }
                                          />
                                        </div>
                                      )}

                                      {isOptionsRequired(
                                        item.questionData?.questionType,
                                      ) && (
                                        <div style={{ gridColumn: "1/-1" }}>
                                          <label style={s.lbl}>Đáp án</label>
                                          <div style={s.optionList}>
                                            {(
                                              item.questionData?.options ?? []
                                            ).map((option, optionIndex) => {
                                              const isCorrect = Boolean(
                                                option?.isCorrect ??
                                                option?.correct,
                                              );

                                              return (
                                                <div
                                                  key={`${item.id}-${optionIndex}`}
                                                  style={s.optionRow}
                                                >
                                                  <button
                                                    type="button"
                                                    style={s.correctBtn(
                                                      isCorrect,
                                                    )}
                                                    disabled={busy || isSaving}
                                                    onClick={() =>
                                                      setPreviewItems((prev) =>
                                                        prev.map((current) => {
                                                          if (
                                                            current.rowNumber !==
                                                            item.rowNumber
                                                          ) {
                                                            return current;
                                                          }

                                                          const options =
                                                            Array.isArray(
                                                              current
                                                                .questionData
                                                                ?.options,
                                                            )
                                                              ? current
                                                                  .questionData
                                                                  .options
                                                              : [];

                                                          return {
                                                            ...current,
                                                            questionData: {
                                                              ...current.questionData,
                                                              options:
                                                                options.map(
                                                                  (
                                                                    currentOption,
                                                                    index,
                                                                  ) => ({
                                                                    ...currentOption,
                                                                    isCorrect:
                                                                      index ===
                                                                      optionIndex,
                                                                  }),
                                                                ),
                                                            },
                                                          };
                                                        }),
                                                      )
                                                    }
                                                  >
                                                    {isCorrect ? "Đúng" : "Sai"}
                                                  </button>

                                                  <input
                                                    type="text"
                                                    value={
                                                      option?.content ?? ""
                                                    }
                                                    disabled={busy || isSaving}
                                                    style={s.input}
                                                    onChange={(event) =>
                                                      setPreviewItems((prev) =>
                                                        prev.map((current) => {
                                                          if (
                                                            current.rowNumber !==
                                                            item.rowNumber
                                                          ) {
                                                            return current;
                                                          }

                                                          const options =
                                                            Array.isArray(
                                                              current
                                                                .questionData
                                                                ?.options,
                                                            )
                                                              ? current
                                                                  .questionData
                                                                  .options
                                                              : [];

                                                          return {
                                                            ...current,
                                                            questionData: {
                                                              ...current.questionData,
                                                              options:
                                                                options.map(
                                                                  (
                                                                    currentOption,
                                                                    index,
                                                                  ) =>
                                                                    index ===
                                                                    optionIndex
                                                                      ? {
                                                                          ...currentOption,
                                                                          content:
                                                                            event
                                                                              .target
                                                                              .value,
                                                                        }
                                                                      : currentOption,
                                                                ),
                                                            },
                                                          };
                                                        }),
                                                      )
                                                    }
                                                  />
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div style={s.detailFooter}>
                                      {isSaving && (
                                        <span style={s.savingText}>
                                          Đang lưu...
                                        </span>
                                      )}
                                      <button
                                        disabled={
                                          busy ||
                                          isSaving ||
                                          !isValidId(questionId)
                                        }
                                        style={s.saveBtn}
                                        onClick={() =>
                                          handleSaveQuestionById(questionId)
                                        }
                                      >
                                        Lưu thay đổi
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

              {previewItems.length > 0 && (
                <div style={s.previewActions}>
                  {confirmPayload.length > 0 && (
                    <div style={s.readyRow}>
                      <CheckCircle2 size={14} />
                      <span>
                        {confirmPayload.length} câu hợp lệ sẵn sàng lưu
                      </span>
                    </div>
                  )}

                  <div style={s.actionRight}>
                    <button
                      onClick={() => handleCancel(true)}
                      disabled={busy}
                      style={s.btnSecondary}
                    >
                      {isCancelling ? "Đang huỷ..." : "Huỷ"}
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={
                        busy ||
                        !isValidId(draftSessionId) ||
                        confirmPayload.length === 0
                      }
                      style={s.confirmBtn(
                        !isValidId(draftSessionId) ||
                          confirmPayload.length === 0,
                      )}
                    >
                      {isConfirming ? "Đang lưu..." : "Lưu vào ngân hàng"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={s.right(chatTopOffset)}>
          <ChatPanel
            previewCount={previewItems.length}
            selectedCount={selectedIds.length}
            onSendPrompt={handleChatPrompt}
            disabled={busy}
          />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',sans-serif!important}
        select{appearance:none;-webkit-appearance:none}
        input::placeholder,textarea::placeholder{color:#c4cdd8}
        @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
      `}</style>
    </div>
  );
};

export default CreateQuestionAiPage;

const s = {
  root: {
    fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
    background: "#f1f4f9",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "#111",
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "#fff",
    borderBottom: "2px solid #000",
    height: 60,
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
    flexShrink: 0,
  },
  headerInner: {
    height: "100%",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 9 },
  logoBox: {
    width: 34,
    height: 34,
    background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoTxt: {
    fontSize: 18,
    fontWeight: 800,
    color: "#111",
    letterSpacing: "-.4px",
  },
  avatarChip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: 20,
    padding: "5px 14px 5px 5px",
  },
  avatar: {
    width: 26,
    height: 26,
    background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
    borderRadius: "50%",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarName: { fontSize: 12, fontWeight: 600, color: "#1e3a8a" },
  body: {
    display: "flex",
    flex: 1,
    height: "100vh",
    overflow: "hidden",
  },
  right: (topOffset) => ({
    width: 352,
    flexShrink: 0,
    padding: `${topOffset}px 16px 36px 0`,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  }),
  left: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px",
    minWidth: 0,
  },
  leftInner: { maxWidth: 1080, margin: "0 auto" },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#3b82f6",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
    marginBottom: 12,
  },
  pgHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  pgIcon: {
    width: 44,
    height: 44,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(124,58,237,.3)",
    flexShrink: 0,
  },
  pgTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-.4px",
  },
  pgSub: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  errBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 14,
    color: "#b91c1c",
    fontSize: 13,
  },
  errorCloseBtn: {
    marginLeft: "auto",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#b91c1c",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#fff",
    border: "2px solid #000",
    borderRadius: 14,
    padding: "20px 22px",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "1px solid #e5e7eb",
  },
  configGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  field: { marginBottom: 0 },
  lbl: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 5,
  },
  optionalLabel: { fontWeight: 400, color: "#9ca3af" },
  selWrap: { position: "relative" },
  select: {
    width: "100%",
    padding: "9px 28px 9px 11px",
    border: "1px solid #000",
    borderRadius: 8,
    fontSize: 13,
    color: "#111",
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  selArrow: {
    position: "absolute",
    right: 9,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#9ca3af",
    fontSize: 11,
  },
  input: {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid #000",
    borderRadius: 8,
    fontSize: 13,
    color: "#111",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
  },
  textarea: {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid #000",
    borderRadius: 8,
    fontSize: 13,
    color: "#111",
    background: "#fff",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.6,
  },
  questionTypesWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  questionTypeItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: active ? 600 : 400,
    color: active ? "#7c3aed" : "#374151",
  }),
  configActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 16,
    paddingTop: 14,
    borderTop: "1px solid #e5e7eb",
  },
  readyRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#7c3aed",
    fontWeight: 600,
    marginTop: 10,
  },
  btnSecondary: {
    padding: "9px 18px",
    border: "1px solid #000",
    borderRadius: 8,
    background: "#fff",
    color: "#111",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnPrimaryAccent: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 20px",
    border: "none",
    borderRadius: 8,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    boxShadow: "0 3px 12px rgba(124,58,237,.3)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: "2px solid #000",
    flexWrap: "wrap",
    gap: 10,
  },
  previewTitle: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  previewStats: { display: "flex", gap: 8 },
  validBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: "#15803d",
    background: "#ecfdf5",
    border: "1px solid #6ee7b7",
    borderRadius: 6,
    padding: "5px 12px",
  },
  invalidBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: 6,
    padding: "5px 12px",
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 14,
    padding: "32px 0",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  tableHeadCell: {
    padding: "11px 12px",
    textAlign: "left",
    fontWeight: 700,
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  summaryRow: (valid) => ({
    borderBottom: "1px solid #f1f5f9",
    opacity: valid ? 1 : 0.6,
  }),
  tableCell: { padding: "11px 12px" },
  rowNumberCell: { padding: "11px 12px", fontWeight: 700 },
  contentCell: { padding: "11px 12px", maxWidth: 340, color: "#1f2937" },
  dimCell: {
    padding: "11px 12px",
    color: "#4b5563",
    whiteSpace: "nowrap",
    fontWeight: 600,
  },
  statusChip: (valid) => ({
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 5,
    background: valid ? "#ecfdf5" : "#fef2f2",
    color: valid ? "#15803d" : "#b91c1c",
    border: `1px solid ${valid ? "#6ee7b7" : "#fca5a5"}`,
  }),
  expandBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: "#7c3aed",
    background: "#f5f3ff",
    border: "1px solid #ddd6fe",
    borderRadius: 6,
    padding: "4px 10px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  errorCell: { padding: "11px 12px", color: "#dc2626", fontSize: 12 },
  detailCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 18,
  },
  detailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  optionList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 6,
  },
  optionRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 8,
    alignItems: "center",
  },
  correctBtn: (active) => ({
    height: 36,
    minWidth: 64,
    padding: "0 10px",
    borderRadius: 8,
    border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
    background: active ? "#dbeafe" : "#fff",
    color: active ? "#1d4ed8" : "#475569",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  }),
  detailFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid #f1f5f9",
  },
  savingText: {
    fontSize: 12,
    color: "#7c3aed",
    marginRight: "auto",
  },
  saveBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 20px",
    border: "none",
    borderRadius: 8,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  previewActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTop: "1px solid #e5e7eb",
    marginTop: 12,
    flexWrap: "wrap",
    gap: 10,
  },
  actionRight: { display: "flex", gap: 8, marginLeft: "auto" },
  confirmBtn: (disabled) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 20px",
    border: "none",
    borderRadius: 8,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    opacity: disabled ? 0.5 : 1,
  }),
};

const cs = {
  panel: {
    width: "100%",
    maxWidth: 376,
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    border: "1px solid #d9e0ea",
    borderRadius: 14,
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "16px 16px 12px",
    borderBottom: "1px solid #e5e7eb",
    background: "linear-gradient(135deg,#f5f3ff,#eff6ff)",
    flexShrink: 0,
  },
  panelHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  aiAvatarLg: {
    width: 36,
    height: 36,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  panelTitle: { fontSize: 14, fontWeight: 800, color: "#0f172a" },
  panelStatus: {
    fontSize: 11,
    color: "#7c3aed",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  selectionHint: {
    marginTop: 4,
    fontSize: 11,
    color: "#4338ca",
    fontWeight: 600,
  },
  statusDot: {
    width: 7,
    height: 7,
    background: "#10b981",
    borderRadius: "50%",
    display: "inline-block",
    animation: "pulse 2s infinite",
  },
  quickRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  quickBtn: {
    fontSize: 11,
    padding: "4px 10px",
    border: "1px solid #ddd6fe",
    borderRadius: 20,
    background: "#f5f3ff",
    color: "#6d28d9",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "inherit",
  },
  messagesArea: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  userBubble: {
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    borderRadius: "12px 0 12px 12px",
    padding: "9px 12px",
    fontSize: 13,
    color: "#fff",
    lineHeight: 1.65,
  },
  aiBubble: {
    background: "#f5f3ff",
    border: "1px solid #ddd6fe",
    borderRadius: "0 12px 12px 12px",
    padding: "9px 12px",
    maxWidth: 240,
  },
  aiBubbleLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#6d28d9",
    marginBottom: 3,
  },
  aiAvatarSm: {
    width: 28,
    height: 28,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  timeLabel: { fontSize: 10, color: "#9ca3af", marginTop: 3 },
  inputArea: {
    padding: "10px 12px",
    borderTop: "1px solid #e5e7eb",
    flexShrink: 0,
    background: "#fafafa",
  },
  inputBox: {
    background: "#fff",
    border: "1.5px solid #ddd6fe",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(124,58,237,.08)",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    fontSize: 13,
    color: "#111",
    background: "transparent",
    outline: "none",
    resize: "none",
    lineHeight: 1.6,
    fontFamily: "inherit",
  },
  inputFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 10px 8px",
  },
  sendBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "6px 14px",
    border: "none",
    borderRadius: 8,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
