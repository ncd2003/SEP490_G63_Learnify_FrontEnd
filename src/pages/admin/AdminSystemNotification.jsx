import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, AlertCircle, Trash2, Send } from "lucide-react";
import { adminApi } from "@/apis/admin.api";

const TARGET_AUDIENCE_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "TEACHER", label: "Giáo viên" },
  { value: "STUDENT", label: "Học sinh" },
];

const SYSTEM_NOTIFICATION_TEMPLATES = [
  {
    id: "maintenance",
    label: "Thông báo bảo trì hệ thống",
    title: "Thông báo bảo trì hệ thống tối nay",
    content: "Hệ thống sẽ bảo trì từ 23:00 đến 01:00. Vui lòng lưu công việc trước thời gian này.",
    targetAudience: "ALL",
  },
  {
    id: "feature-update",
    label: "Thông báo cập nhật tính năng",
    title: "Cập nhật tính năng mới cho lớp học",
    content: "Tính năng quản lý lịch học mới đã được cập nhật. Mời bạn trải nghiệm.",
    targetAudience: "TEACHER",
  },
  {
    id: "profile-reminder",
    label: "Nhắc nhở hoàn thành hồ sơ",
    title: "Nhắc nhở cập nhật thông tin tài khoản",
    content: "Vui lòng hoàn thành thông tin hồ sơ để đảm bảo trải nghiệm học tập và nhận thông báo đầy đủ.",
    targetAudience: "STUDENT",
  },
];

const formatAudience = (value) => {
  switch (value) {
    case "ALL":
      return "Tất cả";
    case "TEACHER":
      return "Giáo viên";
    case "STUDENT":
      return "Học sinh";
    default:
      return value || "-";
  }
};

const formatStatus = (value) => {
  switch (value) {
    case "SENT":
      return "Đã gửi";
    case "SCHEDULED":
      return "Đã lên lịch";
    case "REVOKED":
      return "Đã thu hồi";
    default:
      return value || "-";
  }
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const AdminSystemNotificationPage = () => {
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL");
  const [scheduledAt, setScheduledAt] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getSystemNotifications({
          keyword,
          status: statusFilter,
          page,
          size,
        });
        const result = response?.result || {};
        setItems(result.content || []);
        setTotalPages(result.totalPages || 1);
      } catch (err) {
        const backendMessage = err?.response?.data?.message;
        setError(backendMessage || "Không thể tải nội dung trang. Vui lòng làm mới hoặc thử lại sau.");
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, size, keyword, statusFilter, reloadKey]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(keywordInput.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setKeywordInput("");
    setKeyword("");
    setStatusFilter("");
    setPage(1);
  };

  const selectedNotification = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTargetAudience("ALL");
    setScheduledAt("");
    setFieldError("");
    setFormError("");
    setFieldError("");
    setFormError("");
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setIsCreateModalOpen(false);
  };

  const handleSelectTemplate = (template) => {
    setTitle(template.title);
    setContent(template.content);
    setTargetAudience(template.targetAudience);
    setScheduledAt("");
    setFieldError("");
    setFormError("");
    setFieldError("");
    setFormError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFieldError("");
    setFormError("");

    if (!title.trim() || !content.trim()) {
      setFieldError("Vui lòng điền đầy đủ tiêu đề và nội dung thông báo.");
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.createSystemNotification({
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });

      resetForm();
      setIsCreateModalOpen(false);
      setPage(1);
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      if (/tiêu đề|nội dung|đầy đủ/i.test(backendMessage || "")) {
        setFieldError(`${backendMessage}`);
      } else {
        setFormError(backendMessage || "Không thể gửi thông báo. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedNotification?.id) return;

    try {
      setRevoking(true);
      await adminApi.revokeSystemNotification(selectedNotification.id);
      setReloadKey((prev) => prev + 1);
      setSelectedId(null);
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setError(backendMessage || "Không thể thu hồi thông báo. Vui lòng thử lại.");
    } finally {
      setRevoking(false);
    }
  };

  const closeRevokeModal = () => {
    if (revoking) return;
    setSelectedId(null);
  };

  return (
    <div className="admin-system-notification-page">
      <section className="header-box">
        <div className="header-row">
          <h1>Quản lý thông báo</h1>
          <button type="button" className="btn-dark" onClick={openCreateModal}>
            Tạo thông báo mới
          </button>
        </div>
      </section>

      <section className="filter-box card">
        <form className="filter-form" onSubmit={handleSearch}>
          <div className="filter-inputs">
            <div className="input-group">
              <label>Tìm kiếm</label>
              <div className="search-input-wrap">
                <Search size={16} />
                <input
                  placeholder="Nhập tiêu đề thông báo..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Trạng thái</label>
              <select value={statusFilter} onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}>
                <option value="">Tất cả trạng thái</option>
                <option value="SENT">Đã gửi</option>
                <option value="SCHEDULED">Đã lên lịch</option>
                <option value="REVOKED">Đã thu hồi</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn-primary">
              <Search size={16} />
              Tìm kiếm
            </button>
            <button type="button" className="btn-secondary" onClick={resetFilters}>
              <RotateCcw size={16} />
              Làm mới
            </button>
          </div>
        </form>
      </section>

      <section className="content-grid">
        <div className="history-panel card">
          <div className="panel-header">
            <h2>Lịch sử thông báo</h2>
            <span className="items-count">Tổng: {items.length} bản ghi</span>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thời gian gửi / Lên lịch</th>
                  <th>Tiêu đề</th>
                  <th>Nội dung</th>
                  <th>Đối tượng nhận</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="state-cell">Đang tải dữ liệu...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="state-cell">Không có dữ liệu.</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDateTime(item.scheduledAt || item.createdAt)}</td>
                      <td>{item.title || "-"}</td>
                      <td className="content-cell" title={item.content || ""}>{item.content || "-"}</td>
                      <td>{formatAudience(item.targetAudience)}</td>
                      <td>
                        <span className={`status-pill ${item.status === "REVOKED" ? "revoked" : item.status === "SCHEDULED" ? "scheduled" : "sent"}`}>
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td>
                        {item.status === "SENT" || item.status === "SCHEDULED" ? (
                          <button
                            type="button"
                            className="btn-outline btn-revoke"
                            onClick={() => setSelectedId(item.id)}
                          >
                            {item.status === "SCHEDULED" ? "Hủy lịch" : "Thu hồi"}
                          </button>
                        ) : (
                          <span className="dash">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pager-row">
            <span>
              Trang {page}/{Math.max(totalPages, 1)}
            </span>
            <div className="pager-actions">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1}>
                Trước
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(Math.max(totalPages, 1), p + 1))}
                disabled={loading || page >= Math.max(totalPages, 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </section>

      {isCreateModalOpen && (
        <div className="create-modal-overlay" onClick={closeCreateModal}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo thông báo mới</h3>
              <p className="modal-subtitle">Gửi thông báo hệ thống đến các nhóm người dùng cụ thể.</p>
            </div>

            <div className="modal-body">
              <div className="template-section">
                <p className="section-label">Mẫu thông báo nhanh</p>
                <div className="chip-list">
                  {SYSTEM_NOTIFICATION_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`chip-item ${title === template.title ? "active" : ""}`}
                      onClick={() => handleSelectTemplate(template)}
                      disabled={submitting}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <form className="create-form" id="create-notification-form" onSubmit={handleCreate}>

              <label>
                Tiêu đề *
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFieldError("");
                    setFormError("");
                  }}
                  placeholder="Nhập tiêu đề thông báo"
                />
              </label>

              <label>
                Nội dung *
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setFieldError("");
                    setFormError("");
                  }}
                  placeholder="Nhập nội dung thông báo"
                />
              </label>

              {fieldError && <p className="field-error">{fieldError}</p>}

              <label>
                Đối tượng nhận *
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                  {TARGET_AUDIENCE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Thời gian gửi (Để trống nếu muốn gửi ngay)
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </label>

              {formError && <p className="form-error">{formError}</p>}
            </form>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={closeCreateModal} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" form="create-notification-form" className="btn-primary" disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </div>
        </div>
      </div>
      )}

      {selectedNotification && (
        <div className="revoke-modal-overlay" onClick={closeRevokeModal}>
          <div className="revoke-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Xác nhận thu hồi thông báo</h3>
            <p>Bạn có chắc chắn muốn thu hồi thông báo này khỏi tất cả người dùng?</p>
            <div className="revoke-modal-meta">
              <strong>Tiêu đề:</strong> {selectedNotification.title || "-"}
            </div>
            <div className="revoke-modal-actions">
              <button type="button" className="btn-outline" onClick={closeRevokeModal} disabled={revoking}>
                Hủy
              </button>
              <button type="button" className="btn-dark" onClick={handleRevoke} disabled={revoking}>
                {revoking ? "Đang thu hồi..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-system-notification-page {
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: #0f172a;
        }

        .header-box {
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          background: #fff;
          padding: 16px;
        }

        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .header-row h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .filter-box {
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          background: #fff;
          padding: 20px;
        }

        .filter-form {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .filter-inputs {
          display: flex;
          gap: 20px;
          flex: 1;
          flex-wrap: wrap;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 240px;
        }

        .input-group label {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 0 14px;
          min-height: 44px;
          background: #fff;
          transition: border-color 0.2s;
        }

        .search-input-wrap:focus-within {
          border-color: #0f766e;
        }

        .search-input-wrap input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          color: #0f172a;
        }

        .input-group select {
          min-height: 44px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
          cursor: pointer;
        }

        .filter-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          background: #0f766e;
          color: #fff;
          border: none;
        }

        .btn-secondary {
          background: #fff;
          color: #475569;
          border: 1px solid #cbd5e1;
        }

        .btn-dark {
          background: #0f172a;
          color: #fff;
          border: none;
        }

        .btn-primary, .btn-secondary, .btn-dark, .btn-outline {
          min-height: 40px;
          padding: 0 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-primary:hover, .btn-dark:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        .content-grid {
          display: grid;
          gap: 16px;
        }

        .card {
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          background: #fff;
          padding: 20px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .items-count {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: auto;
          max-height: 65vh;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        td {
          padding: 14px 16px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }

        .content-cell {
          max-width: 320px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #64748b;
        }

        .status-pill {
          display: inline-flex;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-pill.sent {
          background: #f0fdf4;
          color: #166534;
        }

        .status-pill.scheduled {
          background: #fffbeb;
          color: #92400e;
        }

        .status-pill.revoked {
          background: #f1f5f9;
          color: #475569;
        }

        .btn-revoke {
          color: #dc2626;
          border-color: #fecaca;
          background: transparent;
          min-height: 32px;
          padding: 0 12px;
          font-size: 12px;
        }

        .btn-revoke:hover {
          background: #fef2f2;
          border-color: #ef4444;
        }

        .pager-row {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #64748b;
          font-size: 14px;
        }

        .pager-actions {
          display: flex;
          gap: 8px;
        }

        .pager-actions button {
          min-height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .pager-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .create-modal-overlay, .revoke-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .create-modal {
          width: min(720px, 100%);
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          overflow: hidden;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }

        .modal-subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          color: #64748b;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .template-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-label {
          font-size: 12px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chip-item {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chip-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .chip-item.active {
          background: #f0fdfa;
          border-color: #0f766e;
          color: #0f766e;
        }

        .create-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .create-form label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }

        .create-form input, .create-form textarea, .create-form select {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .create-form input:focus, .create-form textarea:focus, .create-form select:focus {
          border-color: #0f766e;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #f8fafc;
        }

        .revoke-modal {
          width: min(440px, 100%);
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .revoke-modal h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .revoke-modal p {
          margin: 0;
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
        }

        .revoke-modal-meta {
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 13px;
        }

        .revoke-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .field-error, .form-error {
          color: #dc2626;
          font-size: 13px;
          font-weight: 600;
        }

        .error-banner {
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .filter-form {
            flex-direction: column;
            align-items: stretch;
          }
          .input-group {
            min-width: 100%;
          }
          .filter-actions {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSystemNotificationPage;
