import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/apis/admin.api";
import { PATH_ADMIN } from "@/routes/paths";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ xử lý (mặc định)" },
  { value: "REVIEWED", label: "Đã xử lý" },
  { value: "REJECTED", label: "Đã bác bỏ" },
];

const formatStatus = (status) => {
  switch (status) {
    case "PENDING":
      return "Chờ xử lý";
    case "REVIEWED":
      return "Đã xử lý";
    case "REJECTED":
      return "Đã bác bỏ";
    default:
      return status || "-";
  }
};

const formatReason = (reason) => {
  switch (reason) {
    case "SPAM":
      return "Spam";
    case "HARASSMENT":
      return "Quấy rối";
    case "INAPPROPRIATE_CONTENT":
      return "Nội dung phản cảm";
    default:
      return reason || "-";
  }
};

const AdminManageReportPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [items, setItems] = useState([]);
  const [resolvingReportId, setResolvingReportId] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [actionTargetNote, setActionTargetNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [showReporterTemplates, setShowReporterTemplates] = useState(true);
  const [showTargetTemplates, setShowTargetTemplates] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getReports({ status, page, size });
        const result = response?.result || {};
        const content = Array.isArray(result.content) ? result.content : [];

        // List API currently does not include detailedDescription, so enrich rows from detail API.
        const contentWithDescription = await Promise.all(
          content.map(async (item) => {
            try {
              const detailResponse = await adminApi.getReportDetail(item.reportId);
              return {
                ...item,
                detailedDescription: detailResponse?.result?.detailedDescription || "",
                evidenceUrl: detailResponse?.result?.evidenceUrl || "",
              };
            } catch {
              return { ...item, detailedDescription: "", evidenceUrl: "" };
            }
          }),
        );

        setItems(contentWithDescription);
        setTotalPages(result.totalPages || 1);
      } catch (err) {
        const backendMessage = err?.response?.data?.message;
        setError(
          backendMessage ||
            "Không thể tải nội dung trang. Vui lòng làm mới trang hoặc thử lại sau.",
        );
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [status, page, size]);

  const handleOpenUserDetail = (userId) => {
    if (!userId) return;
    navigate(PATH_ADMIN.users.detail(userId));
  };

  const resolveReport = async (reportId, action, note, targetNote) => {
    if (!reportId) return;

    try {
      setResolvingReportId(reportId);

      await adminApi.resolveReport(reportId, {
        action,
        note: note || null,
        targetNote: targetNote || null,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.reportId === reportId
            ? {
                ...item,
                status: action === "DISMISS" ? "REJECTED" : "REVIEWED",
              }
            : item,
        ),
      );
    } catch {
      // Errors are surfaced by global HTTP interceptor toast.
    } finally {
      setResolvingReportId(null);
    }
  };

  const openActionModal = (report, action) => {
    setSelectedReport(report);
    setSelectedAction(action);
    setActionNote("");
    setActionTargetNote("");
    setActionError("");
    setShowReporterTemplates(true);
    setShowTargetTemplates(true);
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    if (selectedReport?.reportId === resolvingReportId) return;
    setIsActionModalOpen(false);
    setSelectedAction("");
    setSelectedReport(null);
    setActionNote("");
    setActionTargetNote("");
    setActionError("");
    setShowReporterTemplates(true);
    setShowTargetTemplates(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedReport?.reportId || !selectedAction) return;

    const trimmedNote = actionNote.trim();
    const trimmedTargetNote = actionTargetNote.trim();

    const requiresNote = selectedAction === "DISMISS" || selectedAction === "LOCK_ACCOUNT" || selectedAction === "WARN";
    if (requiresNote && !trimmedNote) {
      setActionError("Vui lòng nhập nội dung cho người báo cáo.");
      return;
    }

    if (selectedAction === "WARN" && !trimmedTargetNote) {
      setActionError("Vui lòng nhập nội dung cho người bị báo cáo.");
      return;
    }

    await resolveReport(selectedReport.reportId, selectedAction, trimmedNote, trimmedTargetNote);
    if (selectedReport.reportId !== resolvingReportId) {
      closeActionModal();
    } else {
      setIsActionModalOpen(false);
      setSelectedAction("");
      setSelectedReport(null);
      setActionNote("");
      setActionTargetNote("");
      setActionError("");
      setShowReporterTemplates(true);
      setShowTargetTemplates(true);
    }
  };

  const getActionModalMeta = () => {
    if (selectedAction === "DISMISS") {
      return {
        title: "Bỏ qua báo cáo",
        helper:
          "Nhập nội dung phản hồi để gửi kết quả xử lý báo cáo qua thông báo in-app cho người báo cáo.",
        placeholder: "Nội dung gửi cho người báo cáo...",
        reporterTemplates: [
          "Chúng tôi không nhận thấy có dấu hiệu vi phạm tiêu chuẩn cộng đồng từ người dùng này.",
          "Bằng chứng bạn cung cấp chưa đủ để chúng tôi có thể xử lý, vui lòng cung cấp thêm thông tin.",
          "Hành vi của người dùng không vi phạm các điều khoản dịch vụ của hệ thống."
        ],
        targetTemplates: []
      };
    }
    if (selectedAction === "WARN") {
      return {
        title: "Gửi cảnh báo",
        helper:
          "Hệ thống sẽ gửi thông báo cảnh báo in-app cho người bị báo cáo và gửi kết quả xử lý cho người báo cáo.",
        placeholder: "Nội dung gửi cho người báo cáo...",
        targetPlaceholder: "Nội dung cảnh báo (gửi in-app)...",
        reporterTemplates: [
          "Đã nhận thấy dấu hiệu vi phạm và chúng tôi đã gửi cảnh báo cho người dùng, nếu còn tái phạm sẽ khóa tài khoản.",
          "Chúng tôi đã ghi nhận hành vi vi phạm và gửi cảnh báo nhắc nhở đến người dùng này.",
          "Cảm ơn bạn đã báo cáo, chúng tôi đã tiến hành cảnh báo và sẽ theo dõi sát sao tài khoản này."
        ],
        targetTemplates: [
          "Chúng tôi nhận thấy bạn có hành vi vi phạm tiêu chuẩn cộng đồng. Yêu cầu bạn chấm dứt ngay hành vi này nếu không tài khoản sẽ bị khóa.",
          "Tài khoản của bạn đã vi phạm quy định. Bạn cần phải khắc phục trong vòng 24h nếu không sẽ bị khóa tài khoản.",
          "Đây là thông báo cảnh báo về việc bạn vi phạm nội quy. Hãy tuân thủ quy định để tránh bị khóa vĩnh viễn."
        ]
      };
    }
    return {
      title: "Khóa tài khoản",
      helper:
        "Hệ thống sẽ khóa tài khoản vĩnh viễn và gửi thông báo in-app kết quả xử lý cho người báo cáo.",
      placeholder: "Nội dung gửi cho người báo cáo...",
      reporterTemplates: [
        "Cảm ơn bạn đã báo cáo. Chúng tôi đã xác minh và tiến hành khóa vĩnh viễn tài khoản vi phạm này.",
        "Hành vi vi phạm là nghiêm trọng, tài khoản này đã bị khóa khỏi hệ thống thành công.",
        "Chúng tôi đã khóa tài khoản này do vi phạm nhiều lần. Cảm ơn sự đóng góp của bạn."
      ],
      targetTemplates: []
    };
  };

  return (
    <div className="admin-manage-report-page">
      <section className="header-box">
        <h1>Quản lý báo cáo</h1>
      </section>

      <section className="filter-box">
        <label htmlFor="status-filter">Lọc trạng thái</label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="content-grid">
        <div className="list-panel card">
          <h2>Danh sách báo cáo</h2>
          {error && <div className="error-banner">{error}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Người báo cáo</th>
                  <th>Người bị báo cáo</th>
                  <th>Lý do chính</th>
                  <th>Mô tả chi tiết</th>
                  <th>Minh chứng</th>
                  <th>Số báo cáo chờ</th>
                  <th>Trạng thái</th>
                  <th>Ưu tiên</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="state-cell">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="state-cell">
                      Không có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.reportId}>
                      <td>RP-{item.reportId}</td>
                      <td>
                        <button
                          type="button"
                          className="user-link-btn"
                          onClick={() => handleOpenUserDetail(item.reporterId)}
                        >
                          {item.reporterName || `USR-${item.reporterId}`}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="user-link-btn"
                          onClick={() => handleOpenUserDetail(item.reportedUserId)}
                        >
                          {item.reportedUserName || `USR-${item.reportedUserId}`}
                        </button>
                      </td>
                      <td>{formatReason(item.reason)}</td>
                      <td className="desc-cell" title={item.detailedDescription || "-"}>
                        {item.detailedDescription || "-"}
                      </td>
                      <td>
                        {item.evidenceUrl ? (
                          <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer" className="user-link-btn" style={{fontSize: '12px'}}>
                            Xem file
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{item.pendingReportCountForTarget}</td>
                      <td>{formatStatus(item.status)}</td>
                      <td>{item.highPriority ? "TOP" : "Thường"}</td>
                      <td>
                        {item.status === "PENDING" ? (
                          <div className="action-group">
                            <button
                              type="button"
                              className="action-btn dismiss"
                              disabled={resolvingReportId === item.reportId}
                              onClick={() => openActionModal(item, "DISMISS")}
                            >
                              Bỏ qua
                            </button>
                            <button
                              type="button"
                              className="action-btn warn"
                              disabled={resolvingReportId === item.reportId}
                              onClick={() => openActionModal(item, "WARN")}
                            >
                              Cảnh báo
                            </button>
                            <button
                              type="button"
                              className="action-btn lock"
                              disabled={resolvingReportId === item.reportId}
                              onClick={() => openActionModal(item, "LOCK_ACCOUNT")}
                            >
                              Khóa
                            </button>
                          </div>
                        ) : (
                          <span className="action-done">Đã xử lý</span>
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
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page <= 1}
              >
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

      {isActionModalOpen && selectedReport && (
        <div className="action-modal-overlay" onClick={closeActionModal}>
          <div className="action-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{getActionModalMeta().title}</h3>
            <p className="action-modal-helper">{getActionModalMeta().helper}</p>
            <div className="action-modal-target">
              Báo cáo: RP-{selectedReport.reportId} | Người báo cáo: {selectedReport.reporterName || `USR-${selectedReport.reporterId}`} | Người bị báo cáo: {selectedReport.reportedUserName || `USR-${selectedReport.reportedUserId}`}
            </div>

            <div className="action-note-section">
              <label className="action-note-label">
                <span className="badge-reporter">Người báo cáo</span> 
                Nội dung phản hồi (in-app):
              </label>
              <textarea
                className="action-note-input"
                value={actionNote}
                onChange={(event) => {
                  setActionNote(event.target.value);
                  if (actionError) setActionError("");
                }}
                placeholder={getActionModalMeta().placeholder}
                rows={3}
              />
              <div className="action-templates">
                {showReporterTemplates ? (
                  getActionModalMeta().reporterTemplates.map((text, idx) => (
                    <button 
                      key={`rep-${idx}`} 
                      className="template-badge" 
                      onClick={() => { 
                        setActionNote(text); 
                        setActionError(""); 
                        setShowReporterTemplates(false); 
                      }}
                    >
                      {text}
                    </button>
                  ))
                ) : (
                  <button 
                    className="template-badge change-template-btn" 
                    onClick={() => setShowReporterTemplates(true)}
                  >
                    🔄 Chọn mẫu khác
                  </button>
                )}
              </div>
            </div>

            {selectedAction === "WARN" && (
              <div className="action-note-section">
                <label className="action-note-label">
                  <span className="badge-target">Người bị báo cáo</span>
                  Nội dung cảnh báo (in-app):
                </label>
                <textarea
                  className="action-note-input"
                  value={actionTargetNote}
                  onChange={(event) => {
                    setActionTargetNote(event.target.value);
                    if (actionError) setActionError("");
                  }}
                  placeholder={getActionModalMeta().targetPlaceholder}
                  rows={3}
                />
                <div className="action-templates">
                  {showTargetTemplates ? (
                    getActionModalMeta().targetTemplates.map((text, idx) => (
                      <button 
                        key={`tar-${idx}`} 
                        className="template-badge" 
                        onClick={() => { 
                          setActionTargetNote(text); 
                          setActionError(""); 
                          setShowTargetTemplates(false); 
                        }}
                      >
                        {text}
                      </button>
                    ))
                  ) : (
                    <button 
                      className="template-badge change-template-btn" 
                      onClick={() => setShowTargetTemplates(true)}
                    >
                      🔄 Chọn mẫu khác
                    </button>
                  )}
                </div>
              </div>
            )}

            {actionError && <div className="action-error-text">{actionError}</div>}

            <div className="action-modal-buttons">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={closeActionModal}
                disabled={resolvingReportId === selectedReport.reportId}
              >
                Hủy
              </button>
              <button
                type="button"
                className="modal-btn primary"
                onClick={handleConfirmAction}
                disabled={resolvingReportId === selectedReport.reportId}
              >
                {resolvingReportId === selectedReport.reportId ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-manage-report-page {
          display: grid;
          gap: 14px;
          color: #0f172a;
        }

        .header-box,
        .filter-box,
        .card {
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
        }

        .header-box h1 {
          margin: 0;
          font-size: clamp(24px, 2.4vw, 30px);
          line-height: 1.15;
        }

        .filter-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-box label {
          font-size: 13px;
          color: #334155;
          font-weight: 600;
        }

        .filter-box select {
          min-height: 36px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 14px;
          color: #0f172a;
          background: #fff;
          outline: none;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
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
          min-width: 980px;
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

        .user-link-btn {
          border: none;
          background: none;
          padding: 0;
          font: inherit;
          font-weight: 700;
          color: #1d4ed8;
          cursor: pointer;
          text-decoration: underline;
        }

        .user-link-btn:hover {
          color: #1e40af;
        }

        .desc-cell {
          max-width: 360px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .action-group {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .action-btn {
          min-height: 28px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #fff;
          font-size: 12px;
          font-weight: 700;
          padding: 0 8px;
          cursor: pointer;
        }

        .action-btn.dismiss {
          color: #334155;
        }

        .action-btn.warn {
          color: #92400e;
          border-color: #fcd34d;
          background: #fffbeb;
        }

        .action-btn.lock {
          color: #991b1b;
          border-color: #fecaca;
          background: #fef2f2;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-done {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
        }

        .state-cell {
          text-align: center;
          color: #64748b;
          padding: 16px 8px;
        }

        .pager-actions button {
          min-height: 34px;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
          cursor: pointer;
        }

        .pager-actions button:hover {
          background: #f1f5f9;
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

        .pager-actions button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .error-banner {
          margin-bottom: 8px;
          border: 1px solid #fecaca;
          color: #b91c1c;
          background: #fff1f2;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
        }

        .action-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.42);
          z-index: 160;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .action-modal {
          width: min(640px, 100%);
          background: #ffffff;
          border: 1px solid #dbe5ef;
          border-radius: 12px;
          padding: 16px;
          display: grid;
          gap: 10px;
        }

        .action-modal h3 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }

        .action-modal-helper {
          margin: 0;
          font-size: 13px;
          color: #334155;
          line-height: 1.5;
        }

        .action-modal-target {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          padding: 10px;
          font-size: 12px;
          color: #334155;
          line-height: 1.45;
        }

        .action-note-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .action-note-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .badge-reporter {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .badge-target {
          background: #fee2e2;
          color: #991b1b;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }

        .action-templates {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .template-badge {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          max-width: 100%;
          transition: all 0.2s;
        }

        .template-badge:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .change-template-btn {
          background: #e0f2fe;
          border-color: #bae6fd;
          color: #0369a1;
          font-weight: 600;
        }

        .change-template-btn:hover {
          background: #bae6fd;
          color: #0c4a6e;
        }

        .action-note-input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          color: #0f172a;
          resize: vertical;
          min-height: 80px;
          outline: none;
        }

        .action-note-input:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .action-error-text {
          font-size: 13px;
          color: #b91c1c;
        }

        .action-modal-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }

        .modal-btn {
          min-height: 34px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 12px;
          font-weight: 700;
          padding: 0 12px;
          cursor: pointer;
        }

        .modal-btn.secondary {
          background: #ffffff;
          color: #334155;
        }

        .modal-btn.primary {
          background: #1d4ed8;
          border-color: #1d4ed8;
          color: #ffffff;
        }

        .modal-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AdminManageReportPage;
