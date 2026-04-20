import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  Check,
  CheckSquare,
  ChevronRight,
  Database,
  Download,
  Eye,
  Filter,
  FileText,
  Hash,
  Printer,
  Search,
  ToggleLeft,
  AlignLeft,
} from "lucide-react";
import { PATH_TEACHER } from "@/routes/paths";
import { questionBankApi } from "@/apis/question-bank.api";
import useDebounce from "@/hooks/use-debounce";
import {
  getLabelFromOptions,
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";
import "@/assets/css/pages/question-bank/resourceBankDetailPage.css";

const LABELS = ["A", "B", "C", "D"];

const diffClassMap = {
  EASY: "is-easy",
  MEDIUM: "is-medium",
  HARD: "is-hard",
  Dễ: "is-easy",
  "Trung bình": "is-medium",
  Khó: "is-hard",
};

const typeClassMap = {
  MULTIPLE_CHOICE: "is-mc",
  TRUE_FALSE: "is-tf",
  ESSAY: "is-essay",
  FILL_IN_THE_BLANK: "is-fill",
  mc: "is-mc",
  tf: "is-tf",
  essay: "is-essay",
};

const typeIconMap = {
  MULTIPLE_CHOICE: CheckSquare,
  TRUE_FALSE: ToggleLeft,
  ESSAY: AlignLeft,
  FILL_IN_THE_BLANK: FileText,
  mc: CheckSquare,
  tf: ToggleLeft,
  essay: AlignLeft,
};

const typeLabelMap = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  TRUE_FALSE: "Đúng / Sai",
  ESSAY: "Tự luận",
  FILL_IN_THE_BLANK: "Điền khuyết",
};

const difficultyLabelMap = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const TypeBadge = ({ type, name }) => {
  const Icon = typeIconMap[type] ?? Hash;
  return (
    <span className={`rb-type-badge ${typeClassMap[type] ?? ""}`}>
      <Icon size={11} />
      {name}
    </span>
  );
};

const ResourceBankDetailPage = () => {
  const { bankId } = useParams();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionsPage, setQuestionsPage] = useState({
    content: [],
    pageNumber: 1,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });
  const [bankData, setBankData] = useState(location.state?.bank ?? null);

  const safeBankId = Number(bankId);
  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      setError("ID ngân hàng không hợp lệ.");
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await questionBankApi.getQuestions(safeBankId, {
          keyword: debouncedSearch,
          type: filterType,
          difficulty: filterDiff,
          page: currentPage,
          size: 10,
          sortBy: "createdAt",
          sortDirection: "DESC",
        });

        const result = response?.result ?? {};
        setQuestionsPage({
          content: Array.isArray(result.content) ? result.content : [],
          pageNumber: result.pageNumber ?? currentPage,
          pageSize: result.pageSize ?? 10,
          totalElements: result.totalElements ?? 0,
          totalPages: result.totalPages ?? 0,
          last: result.last ?? true,
        });
      } catch (err) {
        setQuestionsPage({
          content: [],
          pageNumber: 1,
          pageSize: 10,
          totalElements: 0,
          totalPages: 0,
          last: true,
        });
        setError(
          err.response?.data?.message ?? "Không thể tải danh sách câu hỏi.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [currentPage, debouncedSearch, filterDiff, filterType, safeBankId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterDiff, filterType]);

  useEffect(() => {
    if (bankData || !Number.isFinite(safeBankId) || safeBankId <= 0) {
      return;
    }

    const hydrateBankInfo = async () => {
      try {
        const response = await questionBankApi.getQuestionBanks({
          page: 1,
          size: 100,
          sortBy: "createdAt",
          sortDirection: "DESC",
        });
        const banks = response?.result?.content ?? [];
        const matched = banks.find((item) => Number(item.id) === safeBankId);
        if (matched) {
          setBankData(matched);
        }
      } catch {
        // Keep fallback header information when no bank metadata found.
      }
    };

    hydrateBankInfo();
  }, [bankData, safeBankId]);

  const stats = useMemo(() => {
    const pageItems = Array.isArray(questionsPage.content)
      ? questionsPage.content
      : [];
    return {
      total: questionsPage.totalElements,
      mc: pageItems.filter((q) => q.questionType === "MULTIPLE_CHOICE").length,
      essay: pageItems.filter((q) => q.questionType === "ESSAY").length,
      tf: pageItems.filter((q) => q.questionType === "TRUE_FALSE").length,
      fill: pageItems.filter((q) => q.questionType === "FILL_IN_THE_BLANK")
        .length,
    };
  }, [questionsPage.content, questionsPage.totalElements]);

  const totalPages = Math.max(questionsPage.totalPages, 1);
  const subjectLabel = bankData
    ? getLabelFromOptions(subjectOptions, bankData.subject)
    : "Toán học";
  const gradeLabel = bankData
    ? getLabelFromOptions(gradeOptions, bankData.gradeLevel)
    : "Khối 10";

  return (
    <div className="resource-bank-detail-page">
      <nav className="rb-crumb">
        <Link to={PATH_TEACHER.questionBank} className="rb-crumb-link">
          Ngân hàng câu hỏi
        </Link>
        <ChevronRight size={12} />
        <span>Xem chi tiết</span>
      </nav>

      <div className="rb-page-header">
        <div className="rb-page-icon">
          <Database size={22} />
        </div>
        <div>
          <div className="rb-title-row">
            <h1>{bankData?.name ?? `Ngân hàng #${safeBankId || "-"}`}</h1>
            <span className="rb-view-badge">CHẾ ĐỘ XEM</span>
          </div>
          <p>
            Ngân hàng câu hỏi · {gradeLabel} · {subjectLabel}
          </p>
        </div>
      </div>

      {!bankData && (
        <div className="rb-warning-box">
          Không có đầy đủ thông tin ngân hàng từ trang danh sách. Hệ thống đang
          hiển thị theo bankId hiện tại.
        </div>
      )}

      <section className="rb-card">
        <div className="rb-section-title">
          <BookOpen size={15} />
          <span>Thông tin ngân hàng câu hỏi</span>
        </div>

        <div className="rb-info-grid">
          <div className="rb-info-item rb-full-width">
            <span>Tên ngân hàng</span>
            <strong>
              {bankData?.name ?? `Ngân hàng #${safeBankId || "-"}`}
            </strong>
          </div>

          <div className="rb-info-item rb-full-width">
            <span>Mô tả</span>
            <strong>
              {bankData?.description || "Chưa có mô tả cho ngân hàng này."}
            </strong>
          </div>

          <div className="rb-info-item">
            <span>Khối lớp</span>
            <strong>{gradeLabel}</strong>
          </div>
          <div className="rb-info-item">
            <span>Môn học</span>
            <strong>{subjectLabel}</strong>
          </div>
          <div className="rb-info-item">
            <span>Mã ngân hàng</span>
            <strong>#{String(safeBankId || 0).padStart(5, "0")}</strong>
          </div>
        </div>
      </section>

      <section className="rb-stats-panel">
        <div className="rb-section-title rb-stats-title">
          <BarChart2 size={15} />
          <span>Thống kê câu hỏi</span>
        </div>
        <div className="rb-stats-grid">
          {[
            { label: "Tổng câu hỏi", value: stats.total, style: "is-total" },
            { label: "Trắc nghiệm", value: stats.mc, style: "is-mc" },
            { label: "Tự luận", value: stats.essay, style: "is-essay" },
            { label: "Đúng / Sai", value: stats.tf, style: "is-tf" },
            { label: "Điền khuyết", value: stats.fill, style: "is-used" },
          ].map((item) => (
            <div key={item.label} className="rb-stat-item">
              <div className={`rb-stat-value ${item.style}`}>{item.value}</div>
              <div className="rb-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rb-filter-bar">
        <div className="rb-search-wrap">
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm câu hỏi theo nội dung hoặc chủ đề..."
          />
        </div>

        <div className="rb-select-wrap">
          <Filter size={13} />
          <select
            value={filterDiff}
            onChange={(e) => setFilterDiff(e.target.value)}
          >
            <option value="">Độ khó: Tất cả</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>

        <div className="rb-select-wrap">
          <Filter size={13} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Loại: Tất cả</option>
            <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
            <option value="ESSAY">Tự luận</option>
            <option value="TRUE_FALSE">Đúng / Sai</option>
            <option value="FILL_IN_THE_BLANK">Điền khuyết</option>
          </select>
        </div>

        <button type="button" className="rb-btn-search" disabled>
          <Search size={14} />
          Tìm kiếm
        </button>
      </section>

      <section className="rb-card">
        <div className="rb-question-header">
          <h2>
            Danh sách câu hỏi
            <span>
              (Hiển thị {questionsPage.content.length} /{" "}
              {questionsPage.totalElements})
            </span>
          </h2>

          <div className="rb-question-actions">
            <button type="button" className="rb-btn">
              <Download size={13} />
              Xuất file
            </button>
            <button type="button" className="rb-btn">
              <Printer size={13} />
              In danh sách
            </button>
          </div>
        </div>

        <div className="rb-info-note">
          Trang đang ở chế độ chỉ xem. Hãy chọn hành động khác để chỉnh sửa nội
          dung ngân hàng câu hỏi.
        </div>

        <div className="rb-question-list">
          {loading ? (
            <div className="rb-empty">Đang tải danh sách câu hỏi...</div>
          ) : error ? (
            <div className="rb-empty rb-empty-error">{error}</div>
          ) : questionsPage.content.length === 0 ? (
            <div className="rb-empty">Không tìm thấy câu hỏi phù hợp</div>
          ) : (
            questionsPage.content.map((q, idx) => {
              const isExpanded = expandedId === q.id;
              const typeLabel =
                typeLabelMap[q.questionType] ?? q.questionType ?? "Không rõ";
              const diffLabel =
                difficultyLabelMap[q.difficulty] ?? q.difficulty ?? "-";
              return (
                <article key={q.id} className="rb-question-card">
                  <div className="rb-q-head">
                    <div className="rb-q-left">
                      <div className="rb-q-number">
                        {(questionsPage.pageNumber - 1) *
                          questionsPage.pageSize +
                          idx +
                          1}
                      </div>
                      <TypeBadge type={q.questionType} name={typeLabel} />
                      <span
                        className={`rb-diff-pill ${diffClassMap[q.difficulty] || ""}`}
                      >
                        {diffLabel}
                      </span>
                      <span className="rb-code-pill">Q-{q.id}</span>
                    </div>
                    <div className="rb-q-actions">
                      <button
                        type="button"
                        className="rb-q-action"
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      >
                        <Eye size={12} />
                        {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                      </button>
                    </div>
                  </div>

                  <p className="rb-q-text">{q.content}</p>

                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="rb-answers-box">
                      {q.options.map((opt, ai) => {
                        const correct = Boolean(opt.correct ?? opt.isCorrect);
                        return (
                          <div
                            key={`${q.id}-${opt.id ?? ai}`}
                            className={`rb-answer-row ${correct ? "is-correct" : ""}`}
                          >
                            <span className="rb-answer-label">
                              {LABELS[ai] ?? "-"}.
                            </span>
                            <span className="rb-answer-text">
                              {opt.content}
                            </span>
                            {correct && (
                              <span className="rb-correct-mark">
                                <Check size={11} strokeWidth={3} />
                                Đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === "ESSAY" && isExpanded && (
                    <div className="rb-answers-box is-essay-box">
                      <div className="rb-essay-title">Đáp án tham khảo:</div>
                      <div className="rb-answer-text">
                        {q.sampleAnswer || "Chưa có đáp án tham khảo."}
                      </div>
                    </div>
                  )}

                  <div className="rb-q-meta">
                    <span>
                      <strong>Độ khó:</strong> {diffLabel}
                    </span>
                    <span>
                      <strong>Điểm:</strong> {q.defaultPoints}
                    </span>
                    <span>
                      <strong>Loại:</strong> {typeLabel}
                    </span>
                    <span>
                      <strong>Mã:</strong> Q-{q.id}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {questionsPage.totalElements > questionsPage.content.length && (
          <div className="rb-more-hint">
            ... và {questionsPage.totalElements - questionsPage.content.length}{" "}
            câu hỏi khác trong ngân hàng ...
          </div>
        )}

        <div className="rb-pagination">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={loading || currentPage === 1}
          >
            ← Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              type="button"
              key={p}
              className={p === currentPage ? "is-active" : ""}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={loading || currentPage === totalPages}
          >
            Sau →
          </button>
        </div>
      </section>

      <div className="rb-bottom-actions">
        <Link to={PATH_TEACHER.questionBank} className="rb-btn">
          <ArrowLeft size={14} />
          Quay lại danh sách
        </Link>

        <div className="rb-bottom-right">
          <button type="button" className="rb-btn">
            <Download size={13} />
            Xuất Excel
          </button>
          <button type="button" className="rb-btn">
            <Printer size={13} />
            In ngân hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceBankDetailPage;
