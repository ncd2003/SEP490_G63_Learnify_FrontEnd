import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { questionBankApi } from "@/apis/question-bank.api";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/question-bank/createQuestionManualPage.css";

const DEFAULT_MULTIPLE_CHOICE_OPTIONS = [
  { content: "", isCorrect: false },
  { content: "", isCorrect: false },
  { content: "", isCorrect: false },
  { content: "", isCorrect: false },
];

const DEFAULT_TRUE_FALSE_OPTIONS = [
  { content: "Đúng", isCorrect: true },
  { content: "Sai", isCorrect: false },
];

const DEFAULT_FILL_BLANK_OPTIONS = [{ content: "", isCorrect: true }];

const QUESTION_TYPES_REQUIRE_OPTIONS = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_IN_THE_BLANK",
];

const DEFAULT_QUESTION_COUNT = 5;

let localQuestionCounter = 0;

const getDefaultOptionsByType = (type) => {
  if (type === "TRUE_FALSE") {
    return DEFAULT_TRUE_FALSE_OPTIONS.map((option) => ({ ...option }));
  }

  if (type === "FILL_IN_THE_BLANK") {
    return DEFAULT_FILL_BLANK_OPTIONS.map((option) => ({ ...option }));
  }

  if (type === "MULTIPLE_CHOICE") {
    return DEFAULT_MULTIPLE_CHOICE_OPTIONS.map((option) => ({ ...option }));
  }

  return [];
};

const isOptionsRequired = (type) =>
  QUESTION_TYPES_REQUIRE_OPTIONS.includes(type);

const createEmptyQuestion = () => ({
  localId: `manual-${++localQuestionCounter}`,
  questionType: "MULTIPLE_CHOICE",
  content: "",
  difficulty: "MEDIUM",
  defaultPoints: 1,
  sampleAnswer: "",
  options: getDefaultOptionsByType("MULTIPLE_CHOICE"),
});

const isFilledQuestion = (question) =>
  String(question.content || "").trim().length > 0;

const normalizeOptions = (options) =>
  options.map((option) => ({
    content: String(option.content || "").trim(),
    correct: Boolean(option.isCorrect),
  }));

const buildPayload = (question) => {
  const payload = {
    content: String(question.content || "").trim(),
    questionType: question.questionType,
    difficulty: question.difficulty,
    defaultPoints: Number(question.defaultPoints),
    sampleAnswer: null,
    options: [],
  };

  if (question.questionType === "ESSAY") {
    payload.sampleAnswer = String(question.sampleAnswer || "").trim() || null;
    return payload;
  }

  payload.options = normalizeOptions(question.options);
  return payload;
};

const validateQuestion = (question, index) => {
  const label = `Câu ${index + 1}`;
  const trimmedContent = String(question.content || "").trim();
  if (!trimmedContent) {
    return `${label}: Vui lòng nhập nội dung câu hỏi.`;
  }

  const numericPoints = Number(question.defaultPoints);
  if (!Number.isFinite(numericPoints) || numericPoints < 0) {
    return `${label}: Điểm mặc định phải là số không âm.`;
  }

  if (!isOptionsRequired(question.questionType)) {
    return null;
  }

  const normalizedOptions = normalizeOptions(question.options);
  if (normalizedOptions.length === 0) {
    return `${label}: Vui lòng nhập ít nhất một đáp án.`;
  }

  if (
    question.questionType === "TRUE_FALSE" &&
    normalizedOptions.length !== 2
  ) {
    return `${label}: Câu đúng/sai cần đúng 2 đáp án.`;
  }

  const hasEmptyOption = normalizedOptions.some((option) => !option.content);
  if (hasEmptyOption) {
    return `${label}: Nội dung đáp án không được để trống.`;
  }

  const correctCount = normalizedOptions.filter(
    (option) => option.isCorrect,
  ).length;
  if (correctCount !== 1) {
    return `${label}: Vui lòng chọn đúng 1 đáp án đúng.`;
  }

  return null;
};

const CreateQuestionManualPage = () => {
  const navigate = useNavigate();
  const { bankId } = useParams();
  const safeBankId = Number(bankId);
  const hasValidBankId = Number.isFinite(safeBankId) && safeBankId > 0;

  const [questions, setQuestions] = useState(() =>
    Array.from({ length: DEFAULT_QUESTION_COUNT }, createEmptyQuestion),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuestion = (localId, updater) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.localId !== localId) {
          return question;
        }

        const nextQuestion =
          typeof updater === "function" ? updater(question) : updater;
        return nextQuestion;
      }),
    );
  };

  const handleQuestionTypeChange = (localId, nextType) => {
    updateQuestion(localId, (question) => ({
      ...question,
      questionType: nextType,
      sampleAnswer: nextType === "ESSAY" ? question.sampleAnswer : "",
      options: getDefaultOptionsByType(nextType),
    }));
  };

  const toggleCorrect = (localId, optionIndex) => {
    updateQuestion(localId, (question) => ({
      ...question,
      options: question.options.map((option, currentIndex) => ({
        ...option,
        isCorrect: currentIndex === optionIndex,
      })),
    }));
  };

  const updateOption = (localId, optionIndex, value) => {
    updateQuestion(localId, (question) => ({
      ...question,
      options: question.options.map((option, currentIndex) =>
        currentIndex === optionIndex ? { ...option, content: value } : option,
      ),
    }));
  };

  const addOption = (localId) => {
    updateQuestion(localId, (question) => {
      if (
        !isOptionsRequired(question.questionType) ||
        question.questionType === "TRUE_FALSE"
      ) {
        return question;
      }

      if (question.options.length >= 6) {
        return question;
      }

      return {
        ...question,
        options: [...question.options, { content: "", isCorrect: false }],
      };
    });
  };

  const removeOption = (localId, optionIndex) => {
    updateQuestion(localId, (question) => {
      if (
        !isOptionsRequired(question.questionType) ||
        question.questionType === "TRUE_FALSE"
      ) {
        return question;
      }

      if (question.options.length <= 1) {
        return question;
      }

      const nextOptions = question.options.filter(
        (_, currentIndex) => currentIndex !== optionIndex,
      );
      const hasCorrect = nextOptions.some((option) => option.isCorrect);

      return {
        ...question,
        options: hasCorrect
          ? nextOptions
          : nextOptions.map((option, currentIndex) => ({
              ...option,
              isCorrect: currentIndex === 0,
            })),
      };
    });
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  };

  const handleRemoveQuestion = (localId) => {
    setQuestions((prev) => {
      if (prev.length <= 1) {
        return prev;
      }
      return prev.filter((question) => question.localId !== localId);
    });
  };

  const resetQuestions = () => {
    setQuestions(
      Array.from({ length: DEFAULT_QUESTION_COUNT }, createEmptyQuestion),
    );
  };

  const handleSave = async () => {
    if (!hasValidBankId) {
      toast.error("Không tìm thấy ngân hàng đề hợp lệ.");
      return;
    }

    const filledQuestions = questions.filter(isFilledQuestion);
    if (filledQuestions.length === 0) {
      toast.error("Vui lòng nhập ít nhất một câu hỏi trước khi lưu.");
      return;
    }

    for (const question of filledQuestions) {
      const index = questions.findIndex(
        (item) => item.localId === question.localId,
      );
      const validationMessage = validateQuestion(question, index);
      if (validationMessage) {
        toast.error(validationMessage);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = filledQuestions.map(buildPayload);
      const response = await questionBankApi.createQuestionsBatch(
        safeBankId,
        payload,
      );
      const resultCount = Array.isArray(response?.result)
        ? response.result.length
        : payload.length;
      toast.success(
        response?.message || `Lưu thành công ${resultCount} câu hỏi.`,
      );
      resetQuestions();
    } catch (error) {
      const fallbackMessage = "Tạo danh sách câu hỏi thủ công thất bại.";
      const message =
        error?.response?.data?.message ?? error?.message ?? fallbackMessage;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-question-manual-page">
      <section className="manual-card">
        <button
          type="button"
          className="manual-back-btn"
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

        <h1>Tạo câu hỏi thủ công</h1>
        <p>Ngân hàng đề ID #{Number.isFinite(safeBankId) ? safeBankId : "-"}</p>

        <div className="manual-question-list">
          {questions.map((question, index) => (
            <article key={question.localId} className="manual-question-card">
              <div className="manual-question-head">
                <h2>Câu hỏi {index + 1}</h2>
                <button
                  type="button"
                  className="manual-remove-question-btn"
                  onClick={() => handleRemoveQuestion(question.localId)}
                  disabled={isSubmitting || questions.length <= 1}
                >
                  <Trash2 size={14} />
                  Xóa câu
                </button>
              </div>

              <div className="manual-grid">
                <div>
                  <label>Loại câu hỏi</label>
                  <select
                    value={question.questionType}
                    onChange={(event) =>
                      handleQuestionTypeChange(
                        question.localId,
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
                    <option value="ESSAY">ESSAY</option>
                    <option value="TRUE_FALSE">TRUE_FALSE</option>
                    <option value="FILL_IN_THE_BLANK">FILL_IN_THE_BLANK</option>
                  </select>
                </div>
                <div>
                  <label>Độ khó</label>
                  <select
                    value={question.difficulty}
                    onChange={(event) =>
                      updateQuestion(question.localId, {
                        ...question,
                        difficulty: event.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div>
                  <label>Điểm mặc định</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={question.defaultPoints}
                    onChange={(event) =>
                      updateQuestion(question.localId, {
                        ...question,
                        defaultPoints: event.target.value,
                      })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="manual-field">
                <label>Nội dung câu hỏi</label>
                <textarea
                  rows={4}
                  value={question.content}
                  onChange={(event) =>
                    updateQuestion(question.localId, {
                      ...question,
                      content: event.target.value,
                    })
                  }
                  placeholder="Nhập nội dung câu hỏi..."
                  disabled={isSubmitting}
                />
              </div>

              {question.questionType === "ESSAY" && (
                <div className="manual-field">
                  <label>Đáp án tham khảo</label>
                  <textarea
                    rows={3}
                    value={question.sampleAnswer}
                    onChange={(event) =>
                      updateQuestion(question.localId, {
                        ...question,
                        sampleAnswer: event.target.value,
                      })
                    }
                    placeholder="Nhập đáp án tham khảo..."
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {isOptionsRequired(question.questionType) && (
                <div className="manual-options-wrap">
                  <div className="manual-options-head">
                    <h3>Đáp án</h3>
                    <button
                      type="button"
                      onClick={() => addOption(question.localId)}
                      className="manual-add-btn"
                      disabled={
                        isSubmitting || question.questionType === "TRUE_FALSE"
                      }
                    >
                      <Plus size={14} />
                      Thêm đáp án
                    </button>
                  </div>
                  <div className="manual-options-list">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={`${question.localId}-${optionIndex}`}
                        className="manual-option-row"
                      >
                        <button
                          type="button"
                          className={`manual-correct-toggle ${option.isCorrect ? "active" : ""}`}
                          onClick={() =>
                            toggleCorrect(question.localId, optionIndex)
                          }
                          disabled={isSubmitting}
                        >
                          {option.isCorrect ? "Dung" : "Sai"}
                        </button>
                        <input
                          type="text"
                          value={option.content}
                          onChange={(event) =>
                            updateOption(
                              question.localId,
                              optionIndex,
                              event.target.value,
                            )
                          }
                          placeholder={`Đáp án ${optionIndex + 1}`}
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          className="manual-remove-btn"
                          onClick={() =>
                            removeOption(question.localId, optionIndex)
                          }
                          disabled={
                            isSubmitting ||
                            question.questionType === "TRUE_FALSE"
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        <button
          type="button"
          className="manual-add-question-btn"
          onClick={handleAddQuestion}
          disabled={isSubmitting}
        >
          <Plus size={16} />
          Thêm câu hỏi mới
        </button>

        <div className="manual-actions">
          <button
            type="button"
            className="manual-secondary-btn"
            onClick={() => navigate(PATH_TEACHER.questionBank)}
            disabled={isSubmitting}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="manual-primary-btn"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu danh sách câu hỏi"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default CreateQuestionManualPage;
