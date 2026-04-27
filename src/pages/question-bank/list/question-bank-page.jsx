import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  Database,
  ChevronLeft,
  ChevronRight,
  PenLine,
  GraduationCap,
  Hash,
  Calendar,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useDebounce from "@/hooks/use-debounce";
import useQuestionBanks from "@/hooks/use-question-banks";
import CreateQuestionBankDialog from "@/pages/question-bank/create/create-question-bank-dialog";
import EditQuestionBankDialog from "@/pages/question-bank/edit/edit-question-bank-dialog";
import DeleteQuestionBankDialog from "@/pages/question-bank/delete/delete-question-bank-dialog";
import {
  getLabelFromOptions,
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/classroom/classroomList.css";
import "@/assets/css/pages/question-bank/questionBank.css";

const SORT_OPTIONS = [
  { value: "", label: "Mới nhất" },
  { value: "name_asc", label: "Tên A → Z" },
  { value: "name_desc", label: "Tên Z → A" },
  { value: "oldest", label: "Cũ nhất" },
];

const TABS = {
  ACTIVE: "active",
  HIDDEN: "hidden",
};

const subjectTone = {
  math: "qb-subject-math",
  physics: "qb-subject-physics",
  english: "qb-subject-english",
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const QuestionBankPage = () => {
  const navigate = useNavigate();
  const {
    questionBanks,
    pagination,
    loading,
    actionLoading,
    error,
    clearError,
    fetchBanks,
    createBank,
    updateBank,
    deleteBank,
  } = useQuestionBanks();

  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortValue, setSortValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState(TABS.ACTIVE);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [deletingBank, setDeletingBank] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 350);

  const sortConfig = useMemo(() => {
    if (sortValue === "name_asc") {
      return { sortBy: "name", sortDirection: "ASC" };
    }
    if (sortValue === "name_desc") {
      return { sortBy: "name", sortDirection: "DESC" };
    }
    if (sortValue === "oldest") {
      return { sortBy: "createdAt", sortDirection: "ASC" };
    }
    return { sortBy: "createdAt", sortDirection: "DESC" };
  }, [sortValue]);

  useEffect(() => {
    fetchBanks({
      keyword: debouncedSearch,
      gradeLevel: gradeFilter,
      subject: subjectFilter,
      page: currentPage,
      size: 5,
      sortBy: sortConfig.sortBy,
      sortDirection: sortConfig.sortDirection,
    }).catch(() => { });
  }, [
    currentPage,
    debouncedSearch,
    fetchBanks,
    gradeFilter,
    sortConfig.sortBy,
    sortConfig.sortDirection,
    subjectFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, gradeFilter, subjectFilter, sortValue]);

  const handleCreateSubmit = async (payload) => {
    await createBank(payload);
    setShowCreateModal(false);

    await fetchBanks({
      keyword: debouncedSearch,
      gradeLevel: gradeFilter,
      subject: subjectFilter,
      page: 1,
      size: 5,
      sortBy: sortConfig.sortBy,
      sortDirection: sortConfig.sortDirection,
    });
    setCurrentPage(1);
    clearError();
  };

  const handleDeleteSubmit = async (bankId) => {
    await deleteBank(bankId);
    await fetchBanks({
      keyword: debouncedSearch,
      gradeLevel: gradeFilter,
      subject: subjectFilter,
      page: currentPage,
      size: 5,
      sortBy: sortConfig.sortBy,
      sortDirection: sortConfig.sortDirection,
    });
    clearError();
  };

  const handleEditSubmit = async (bankId, payload) => {
    await updateBank(bankId, payload);
    await fetchBanks({
      keyword: debouncedSearch,
      gradeLevel: gradeFilter,
      subject: subjectFilter,
      page: currentPage,
      size: 5,
      sortBy: sortConfig.sortBy,
      sortDirection: sortConfig.sortDirection,
    });
    clearError();
  };

  return (
    <div className="classroom-list-container question-bank-page">
      <div className="tabs-header">
        <div className="tabs-wrapper">
          <button
            type="button"
            className={`tab-button ${activeTab === TABS.ACTIVE ? "active" : ""}`}
            onClick={() => setActiveTab(TABS.ACTIVE)}
          >
            Ngân hàng của bạn ({pagination.totalElements})
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === TABS.HIDDEN ? "active" : ""}`}
            onClick={() => setActiveTab(TABS.HIDDEN)}
          >
            Ngân hàng đã ẩn
          </button>
        </div>

        <div className="header-actions">
          <button type="button" className="btn-secondary">
            <Trash2 size={15} />
            <span>Thùng rác</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              questionBanks[0] &&
              navigate(PATH_TEACHER.questionBankMethod(questionBanks[0].id))
            }
            disabled={questionBanks.length === 0}
          >
            <PenLine size={15} />
            <span>Thêm câu hỏi</span>
          </button>
          <button
            type="button"
            className="btn-create"
            onClick={() => {
              clearError();
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} />
            Tạo ngân hàng câu hỏi
          </button>
        </div>
      </div>

      {activeTab === TABS.HIDDEN && (
        <div className="qb-state-banner">
          <AlertTriangle size={16} />
          Danh sách ngân hàng đã ẩn đang được cập nhật ở phiên bản tiếp theo.
        </div>
      )}

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm ngân hàng câu hỏi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="sort-select"
        >
          <option value="">Tất cả khối lớp</option>
          {gradeOptions
            .filter((opt) => Boolean(opt.value))
            .map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="sort-select"
        >
          <option value="">Tất cả môn học</option>
          {subjectOptions
            .filter((opt) => Boolean(opt.value))
            .map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
        </select>

        <select
          value={sortValue}
          onChange={(e) => setSortValue(e.target.value)}
          className="sort-select"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="qb-card-wrapper">
        {loading ? (
          <div className="empty-state">Đang tải ngân hàng câu hỏi...</div>
        ) : error ? (
          <div className="empty-state error">{error}</div>
        ) : activeTab === TABS.HIDDEN ? (
          <div className="empty-state">
            Chọn tab "Ngân hàng của bạn" để tiếp tục quản lý.
          </div>
        ) : questionBanks.length === 0 ? (
          <div className="empty-state">
            {debouncedSearch || gradeFilter || subjectFilter
              ? "Không tìm thấy ngân hàng phù hợp."
              : "Chưa có ngân hàng câu hỏi nào. Hãy tạo ngân hàng đầu tiên."}
          </div>
        ) : (
          <div className="qb-card-grid">
            {questionBanks.map((questionBank) => {
              const gradeLabel = getLabelFromOptions(
                gradeOptions,
                questionBank.gradeLevel,
              );
              const subjectLabel = getLabelFromOptions(
                subjectOptions,
                questionBank.subject,
              );
              const toneClass =
                subjectTone[questionBank.subject] ?? "qb-subject-default";

              return (
                <article key={questionBank.id} className="qb-bank-card">
                  <div className="qb-card-head">
                    <div className="qb-card-title-wrap">
                      <div className="qb-card-icon">
                        <Database size={16} />
                      </div>
                      <h3 className="qb-card-title">{questionBank.name}</h3>
                    </div>

                    <span className={`qb-subject-chip ${toneClass}`}>
                      {subjectLabel}
                    </span>
                  </div>

                  <div className="qb-card-meta-grid">
                    <div className="qb-meta-item">
                      <div className="qb-meta-label">
                        <GraduationCap size={13} />
                        <span>Khối lớp</span>
                      </div>
                      <strong>{gradeLabel}</strong>
                    </div>
                    <div className="qb-meta-item">
                      <div className="qb-meta-label">
                        <Hash size={13} />
                        <span>ID ngân hàng</span>
                      </div>
                      <strong>#{questionBank.id}</strong>
                    </div>
                    <div className="qb-meta-item qb-meta-item-wide">
                      <div className="qb-meta-label">
                        <Calendar size={13} />
                        <span>Ngày tạo</span>
                      </div>
                      <strong>{formatDateTime(questionBank.createdAt)}</strong>
                    </div>
                    <div className="qb-meta-item qb-meta-item-wide">
                      <div className="qb-meta-label">
                        <Clock size={13} />
                        <span>Cập nhật lúc</span>
                      </div>
                      <strong>
                        {formatDateTime(
                          questionBank.updatedAt ?? questionBank.updateAt,
                        )}
                      </strong>
                    </div>
                  </div>

                  <p className="qb-card-desc">
                    {questionBank.description ||
                      "Chưa có mô tả cho ngân hàng câu hỏi này."}
                  </p>

                  <div className="qb-card-actions">
                    <button
                      type="button"
                      className="qb-action-btn qb-action-btn-create"
                      onClick={() =>
                        navigate(
                          PATH_TEACHER.questionBankMethod(questionBank.id),
                        )
                      }
                    >
                      <Plus size={14} />
                      Tạo câu hỏi
                    </button>

                    <button
                      type="button"
                      className="qb-action-btn"
                      onClick={() =>
                        navigate(
                          PATH_TEACHER.questionBankDetail(questionBank.id),
                          {
                            state: { bank: questionBank },
                          },
                        )
                      }
                    >
                      <Eye size={14} />
                      Xem chi tiết
                    </button>

                    <button
                      type="button"
                      className="qb-action-btn"
                      onClick={() => setEditingBank(questionBank)}
                    >
                      <Pencil size={14} />
                      Chỉnh sửa
                    </button>

                    <button
                      type="button"
                      className="qb-action-btn qb-action-btn-danger"
                      onClick={() => setDeletingBank(questionBank)}
                    >
                      <Trash2 size={14} />
                      Xóa
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="qb-pagination">
        <button
          type="button"
          className="qb-pagination-btn"
          disabled={loading || currentPage <= 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          <ChevronLeft size={16} />
          Trước
        </button>

        <span className="qb-pagination-info">
          Trang {pagination.pageNumber} / {Math.max(pagination.totalPages, 1)}
        </span>

        <button
          type="button"
          className="qb-pagination-btn"
          disabled={loading || pagination.last}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Sau
          <ChevronRight size={16} />
        </button>
      </div>

      {showCreateModal && (
        <CreateQuestionBankDialog
          submitting={actionLoading}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editingBank && (
        <EditQuestionBankDialog
          questionBank={editingBank}
          submitting={actionLoading}
          onClose={() => setEditingBank(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deletingBank && (
        <DeleteQuestionBankDialog
          questionBank={deletingBank}
          onClose={() => setDeletingBank(null)}
          onSubmit={handleDeleteSubmit}
        />
      )}
    </div>
  );
};

export default QuestionBankPage;
