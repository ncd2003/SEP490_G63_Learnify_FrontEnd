import { useEffect, useMemo, useState } from "react";
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
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showCreateTemplates, setShowCreateTemplates] = useState(true);

  const [selectedId, setSelectedId] = useState(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getSystemNotifications({ page, size });
        const result = response?.result || {};
        setItems(result.content || []);
        setTotalPages(result.totalPages || 1);
      } catch (err) {
        const backendMessage = err?.response?.data?.message;
        setError(backendMessage || "MSG90: Không thể tải nội dung trang. Vui lòng làm mới hoặc thử lại sau.");
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page, size, reloadKey]);

  const selectedNotification = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  );

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTargetAudience("ALL");
    setFieldError("");
    setFormError("");
    setShowCreateTemplates(true);
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
    setFieldError("");
    setFormError("");
    setShowCreateTemplates(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFieldError("");
    setFormError("");

    if (!title.trim() || !content.trim()) {
      setFieldError("MSG132: Vui lòng điền đầy đủ tiêu đề và nội dung thông báo.");
      return;
    }

    try {
      setSubmitting(true);
      await adminApi.createSystemNotification({
        title: title.trim(),
        content: content.trim(),
        targetAudience,
      });

      resetForm();
      setIsCreateModalOpen(false);
      setPage(1);
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      if (/tiêu đề|nội dung|đầy đủ/i.test(backendMessage || "")) {
        setFieldError(`MSG132: ${backendMessage}`);
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

      <section className="content-grid">
        <div className="history-panel card">
          <h2>Lịch sử thông báo đã gửi (Mới nhất trước)</h2>

          {error && <div className="error-banner">{error}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thời gian gửi</th>
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
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{item.title || "-"}</td>
                      <td className="content-cell" title={item.content || ""}>{item.content || "-"}</td>
                      <td>{formatAudience(item.targetAudience)}</td>
                      <td>
                        <span className={`status-pill ${item.status === "REVOKED" ? "revoked" : "sent"}`}>
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td>
                        {item.status === "SENT" ? (
                          <button
                            type="button"
                            className="btn-outline"
                            onClick={() => setSelectedId(item.id)}
                          >
                            Thu hồi
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
            <h3>Tạo thông báo mới</h3>

            <form className="create-form" onSubmit={handleCreate}>
              {showCreateTemplates ? (
                <div className="template-list">
                  <p className="template-label">Mẫu thông báo nhanh</p>
                  {SYSTEM_NOTIFICATION_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="template-btn"
                      onClick={() => handleSelectTemplate(template)}
                      disabled={submitting}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  className="template-reset-btn"
                  onClick={() => setShowCreateTemplates(true)}
                  disabled={submitting}
                >
                  Chọn mẫu khác
                </button>
              )}

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

              {formError && <p className="form-error">{formError}</p>}

              <div className="form-actions">
                <button type="button" className="btn-outline" onClick={closeCreateModal} disabled={submitting}>
                  Hủy
                </button>
                <button type="submit" className="btn-dark" disabled={submitting}>
                  {submitting ? "Đang gửi..." : "Gửi thông báo"}
                </button>
              </div>
            </form>
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
          display: grid;
          gap: 14px;
          color: #0f172a;
        }

        .header-box {
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          background: #fff;
          padding: 14px;
        }

        .header-box h1 {
          margin: 0;
          font-size: clamp(24px, 2.4vw, 30px);
          line-height: 1.15;
        }

        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .card {
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
        }

        .card h2 {
          margin: 0 0 10px;
          font-size: 17px;
        }

        .table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: auto;
          max-height: 62vh;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        th,
        td {
          border-bottom: 1px solid #edf2f7;
          padding: 9px 8px;
          font-size: 13px;
          text-align: left;
          vertical-align: middle;
        }

        th {
          background: #f8fafc;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #475569;
        }

        .state-cell {
          text-align: center;
          color: #64748b;
          padding: 16px 8px;
        }

        .content-cell {
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.45;
        }

        .status-pill {
          display: inline-flex;
          border-radius: 999px;
          padding: 3px 8px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .status-pill.sent {
          background: #ecfdf3;
          border-color: #a7f3d0;
          color: #047857;
        }

        .status-pill.revoked {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #334155;
        }

        .dash {
          color: #94a3b8;
        }

        .pager-row {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
          color: #475569;
        }

        .pager-actions {
          display: flex;
          gap: 8px;
        }

        .pager-actions button,
        .btn-outline,
        .btn-dark {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid transparent;
          cursor: pointer;
        }

        .pager-actions button,
        .btn-outline {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .btn-dark {
          background: #0f172a;
          color: #fff;
        }

        .pager-actions button:disabled,
        .btn-outline:disabled,
        .btn-dark:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .revoke-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(15, 23, 42, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 20px 16px;
          backdrop-filter: blur(2px);
        }

        .revoke-modal {
          width: min(460px, calc(100vw - 32px));
          max-height: calc(100vh - 40px);
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.22);
          padding: 16px;
          display: grid;
          gap: 10px;
          overflow-y: auto;
        }

        .revoke-modal h3 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }

        .revoke-modal p {
          margin: 0;
          font-size: 14px;
          color: #334155;
          line-height: 1.45;
        }

        .revoke-modal-meta {
          font-size: 13px;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 10px;
        }

        .revoke-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .create-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(15, 23, 42, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 20px 16px;
          backdrop-filter: blur(2px);
        }

        .create-modal {
          width: min(680px, calc(100vw - 32px));
          max-height: calc(100vh - 40px);
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.22);
          padding: 16px;
          display: grid;
          gap: 10px;
          overflow-y: auto;
        }

        .create-modal h3 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }

        .template-list {
          display: grid;
          gap: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          background: #f8fafc;
        }

        .template-label {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .template-btn,
        .template-reset-btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
        }

        .template-btn:hover,
        .template-reset-btn:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
        }

        .create-form {
          display: grid;
          gap: 10px;
        }

        .create-form label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .create-form input,
        .create-form textarea,
        .create-form select {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 9px 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          background: #fff;
        }

        .create-form input:focus,
        .create-form textarea:focus,
        .create-form select:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
        }

        .field-error {
          margin: -2px 0 0;
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
        }

        .form-error {
          margin: -2px 0 0;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 600;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .error-banner {
          margin-bottom: 8px;
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #b91c1c;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
        }

        @media (max-width: 1180px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 680px) {
          .create-modal-overlay,
          .revoke-modal-overlay {
            padding: 12px;
          }

          .create-modal,
          .revoke-modal {
            width: calc(100vw - 24px);
            max-height: calc(100vh - 24px);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSystemNotificationPage;
