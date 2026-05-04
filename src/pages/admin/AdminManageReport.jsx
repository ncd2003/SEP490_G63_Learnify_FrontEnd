import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Paperclip, RotateCcw, AlertTriangle, ShieldAlert, Eye, User, UserX } from "lucide-react";
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [actionTargetNote, setActionTargetNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [showReporterTemplates, setShowReporterTemplates] = useState(true);
  const [showTargetTemplates, setShowTargetTemplates] = useState(true);

  useEffect(() => {
    // No dropdown click-outside needed anymore
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getReports({
          keyword,
          priority: priorityFilter,
          status,
          page,
          size
        });
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
  }, [status, keyword, priorityFilter, page, size]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(keywordInput.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setKeywordInput("");
    setKeyword("");
    setPriorityFilter("");
    setStatus("PENDING");
    setPage(1);
  };

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

  const openDetailModal = (report) => {
    setSelectedReport(report);
    setSelectedAction("");
    setActionNote("");
    setActionTargetNote("");
    setActionError("");
    setShowReporterTemplates(true);
    setShowTargetTemplates(true);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    if (resolvingReportId === selectedReport?.reportId) return;
    setIsDetailModalOpen(false);
    setSelectedReport(null);
    setSelectedAction("");
    setActionNote("");
    setActionTargetNote("");
  };

  const startProcessing = (action) => {
    setSelectedAction(action);
    setActionNote("");
    setActionTargetNote("");
    setActionError("");
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
      closeDetailModal();
    } else {
      setIsDetailModalOpen(false);
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
          "Chúng tôi nhận thấy bạn có hành vi vi phạm tiêu chuẩn cộng đồng. Yêu cầu bạn chấm dứt ngay hành vi này nếu không tài khoản sẽ bị khóa. Nếu bạn thấy không chính xác, hãy gửi lại kháng cáo qua email admin@learnify.vn.",
          "Tài khoản của bạn đã vi phạm quy định. Bạn cần phải khắc phục trong vòng 24h nếu không sẽ bị khóa tài khoản. Nếu bạn thấy không chính xác, hãy gửi lại kháng cáo qua email admin@learnify.vn.",
          "Đây là thông báo cảnh báo về việc bạn vi phạm nội quy. Hãy tuân thủ quy định để tránh bị khóa vĩnh viễn. Nếu bạn thấy không chính xác, hãy gửi lại kháng cáo qua email admin@learnify.vn."
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

      <section className="filter-box card">
        <form className="filter-form" onSubmit={handleSearch}>
          <div className="filter-inputs">
            <div className="input-group">
              <label>Tìm kiếm</label>
              <div className="search-input-wrap">
                <Search size={16} />
                <input
                  placeholder="Tên người bị báo cáo..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Trạng thái</label>
              <select
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
            </div>

            <div className="input-group">
              <label>Ưu tiên</label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                <option value="HIGH">Ưu tiên cao</option>
                <option value="NORMAL">Thường</option>
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
        <div className="list-panel card">
          <h2>Danh sách báo cáo</h2>
          {error && <div className="error-banner">{error}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Đối tượng</th>
                  <th>Lý do & Mô tả</th>
                  <th>Minh chứng</th>
                  <th>Báo cáo chờ</th>
                  <th>Trạng thái</th>
                  <th>Ưu tiên</th>
                  <th>Thao tác</th>
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
                      <td><span className="id-badge">RP-{item.reportId}</span></td>
                      <td className="user-pair-cell">
                        <div className="user-row">
                          <span className="user-label reporter">Từ:</span>
                          <button
                            type="button"
                            className="user-link"
                            onClick={() => handleOpenUserDetail(item.reporterId)}
                          >
                            {item.reporterName || `USR-${item.reporterId}`}
                          </button>
                        </div>
                        <div className="user-row">
                          <span className="user-label target">Đến:</span>
                          <button
                            type="button"
                            className="user-link bold"
                            onClick={() => handleOpenUserDetail(item.reportedUserId)}
                          >
                            {item.reportedUserName || `USR-${item.reportedUserId}`}
                          </button>
                        </div>
                      </td>
                      <td className="reason-desc-cell">
                        <div className="reason-type">{formatReason(item.reason)}</div>
                        <div className="desc-text" title={item.detailedDescription || "-"}>
                          {item.detailedDescription || "-"}
                        </div>
                      </td>
                      <td className="center-cell">
                        {item.evidenceUrl ? (
                          <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer" className="evidence-btn" title="Xem minh chứng">
                            <Paperclip size={18} />
                          </a>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td className="center-cell">
                        <span className="count-badge">{item.pendingReportCountForTarget}</span>
                      </td>
                      <td>
                        <span className={`status-pill ${item.status.toLowerCase()}`}>
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-pill ${item.highPriority ? "high" : "normal"}`}>
                          {item.highPriority ? "Cao" : "Thường"}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          type="button"
                          className="btn-resolve"
                          onClick={() => openDetailModal(item)}
                        >
                          <ShieldAlert size={16} />
                          {item.status === "PENDING" ? "Xử lý" : "Chi tiết"}
                        </button>
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

      {isDetailModalOpen && selectedReport && (
        <div className="detail-modal-overlay" onClick={closeDetailModal}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <ShieldAlert size={24} className="icon-main" />
                <div>
                  <h3>Chi tiết xử lý báo cáo</h3>
                  <span className="modal-id">Mã: RP-{selectedReport.reportId}</span>
                </div>
              </div>
              <button className="btn-close" onClick={closeDetailModal}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                {/* Left Side: Report Info */}
                <div className="detail-info-pane">
                  <div className="info-section">
                    <h4><User size={16} /> Thông tin đối tượng</h4>
                    <div className="info-card">
                      <div className="info-item">
                        <span className="label">Người báo cáo:</span>
                        <button className="user-link-bold" onClick={() => handleOpenUserDetail(selectedReport.reporterId)}>
                          {selectedReport.reporterName}
                        </button>
                      </div>
                      <div className="info-item">
                        <span className="label">Người bị báo cáo:</span>
                        <button className="user-link-bold highlight" onClick={() => handleOpenUserDetail(selectedReport.reportedUserId)}>
                          {selectedReport.reportedUserName}
                        </button>
                      </div>
                      <div className="info-item">
                        <span className="label">Số báo cáo chờ:</span>
                        <span className="count-badge-large">{selectedReport.pendingReportCountForTarget}</span>
                      </div>
                    </div>
                  </div>

                  <div className="info-section">
                    <h4><AlertTriangle size={16} /> Nội dung vi phạm</h4>
                    <div className="reason-box">
                      <div className="reason-label">{formatReason(selectedReport.reason)}</div>
                      <div className="reason-description">
                        {selectedReport.detailedDescription || "Không có mô tả chi tiết."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Evidence Preview */}
                <div className="detail-evidence-pane">
                  <h4><Eye size={16} /> Minh chứng (Evidence)</h4>
                  <div className="evidence-preview-box">
                    {selectedReport.evidenceUrl ? (
                      selectedReport.evidenceUrl.match(/\.(jpeg|jpg|gif|png)$/) ? (
                        <img src={selectedReport.evidenceUrl} alt="Evidence" className="evidence-img" />
                      ) : (
                        <div className="evidence-file-placeholder">
                          <Paperclip size={48} />
                          <a href={selectedReport.evidenceUrl} target="_blank" rel="noopener noreferrer" className="btn-view-file">
                            Xem tệp đính kèm
                          </a>
                        </div>
                      )
                    ) : (
                      <div className="no-evidence">
                        <p>Không có minh chứng hình ảnh/tệp tin.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom: Resolution Actions */}
              <div className="resolution-section">
                {selectedReport.status === "PENDING" ? (
                  <>
                    <div className="resolution-header">
                      <h4>LỰA CHỌN XỬ LÝ</h4>
                      {!selectedAction && <p>Vui lòng chọn một hành động để tiếp tục</p>}
                    </div>

                    {!selectedAction ? (
                      <div className="action-buttons-grid">
                        <button className="action-choice dismiss" onClick={() => startProcessing("DISMISS")}>
                          <RotateCcw size={20} />
                          <span>Bỏ qua báo cáo</span>
                        </button>
                        <button className="action-choice warn" onClick={() => startProcessing("WARN")}>
                          <AlertTriangle size={20} />
                          <span>Gửi cảnh báo</span>
                        </button>
                        <button className="action-choice lock" onClick={() => startProcessing("LOCK_ACCOUNT")}>
                          <UserX size={20} />
                          <span>Khóa tài khoản</span>
                        </button>
                      </div>
                    ) : (
                      <div className="resolution-form animate-fade-in">
                        <div className="form-header">
                          <h5>Đang thực hiện: <strong>{getActionModalMeta().title}</strong></h5>
                          <button className="btn-text" onClick={() => setSelectedAction("")}>Đổi hành động</button>
                        </div>
                        <p className="helper-text">{getActionModalMeta().helper}</p>
                        
                        <div className="note-inputs">
                          <div className="input-field">
                            <label><span className="dot reporter"></span> Gửi cho Người báo cáo:</label>
                            <textarea
                              value={actionNote}
                              onChange={(e) => setActionNote(e.target.value)}
                              placeholder={getActionModalMeta().placeholder}
                              rows={3}
                            />
                            <div className="template-chips">
                              {getActionModalMeta().reporterTemplates.map((text, idx) => (
                                <button key={idx} className="chip" onClick={() => setActionNote(text)}>{text}</button>
                              ))}
                            </div>
                          </div>

                          {selectedAction === "WARN" && (
                            <div className="input-field">
                              <label><span className="dot target"></span> Gửi cho Người bị báo cáo:</label>
                              <textarea
                                value={actionTargetNote}
                                onChange={(e) => setActionTargetNote(e.target.value)}
                                placeholder={getActionModalMeta().targetPlaceholder}
                                rows={3}
                              />
                              <div className="template-chips">
                                {getActionModalMeta().targetTemplates.map((text, idx) => (
                                  <button key={idx} className="chip" onClick={() => setActionTargetNote(text)}>{text}</button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {actionError && <p className="error-text">{actionError}</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="processed-box">
                    <ShieldAlert size={20} />
                    <span>Báo cáo này đã được xử lý (Trạng thái: {formatStatus(selectedReport.status)})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeDetailModal} disabled={resolvingReportId === selectedReport.reportId}>
                Đóng
              </button>
              {selectedAction && (
                <button className="btn-confirm-action" onClick={handleConfirmAction} disabled={resolvingReportId === selectedReport.reportId}>
                  {resolvingReportId === selectedReport.reportId ? "Đang xử lý..." : "Xác nhận xử lý"}
                </button>
              )}
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
          padding: 16px;
        }

        .header-box h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .filter-form {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .filter-inputs {
          display: flex;
          gap: 16px;
          flex: 1;
          flex-wrap: wrap;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 200px;
        }

        .input-group label {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 10px;
          min-height: 40px;
          background: #fff;
        }

        .search-input-wrap input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
        }

        .input-group select {
          min-height: 40px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }

        .filter-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary {
          background: #0f766e;
          color: #fff;
          border: none;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #334155;
          border: 1px solid #cbd5e1;
        }

        .btn-primary, .btn-secondary {
          min-height: 40px;
          padding: 0 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
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

        .id-badge {
          font-family: monospace;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          color: #475569;
        }

        .user-pair-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        .user-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          width: 24px;
        }

        .user-label.reporter { color: #64748b; }
        .user-label.target { color: #0f766e; }

        .user-link {
          border: none;
          background: none;
          padding: 0;
          font: inherit;
          color: #1e293b;
          cursor: pointer;
          text-align: left;
        }

        .user-link:hover { text-decoration: underline; color: #0f766e; }
        .user-link.bold { font-weight: 700; }

        .reason-desc-cell {
          max-width: 280px;
        }

        .reason-type {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .desc-text {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .center-cell { text-align: center; }

        .evidence-btn {
          color: #0f766e;
          transition: transform 0.2s;
          display: inline-block;
        }

        .evidence-btn:hover { transform: scale(1.1); color: #0d9488; }

        .count-badge {
          background: #f1f5f9;
          color: #475569;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .status-pill {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .status-pill.pending { background: #fffbeb; color: #92400e; }
        .status-pill.reviewed { background: #f0fdf4; color: #166534; }
        .status-pill.rejected { background: #f1f5f9; color: #475569; }

        .priority-pill {
          display: inline-flex;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .priority-pill.high { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
        .priority-pill.normal { background: #f8fafc; color: #64748b; }

        .btn-resolve {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0f766e;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-resolve:hover {
          background: #0d9488;
          transform: translateY(-1px);
        }

        .detail-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .detail-modal {
          width: min(1000px, 100%);
          max-height: 95vh;
          background: #fff;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
        }

        .modal-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-main { color: #0f766e; }

        .modal-header h3 { margin: 0; font-size: 20px; font-weight: 700; }
        .modal-id { font-size: 13px; color: #64748b; font-weight: 600; }
        .btn-close { border: none; background: none; font-size: 28px; cursor: pointer; color: #94a3b8; }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 30px;
        }

        .info-section h4, .detail-evidence-pane h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .info-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .info-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .info-item .label { color: #64748b; }
        .user-link-bold {
          border: none;
          background: none;
          padding: 0;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
        }
        .user-link-bold:hover { text-decoration: underline; }
        .user-link-bold.highlight { color: #0f766e; font-size: 15px; }

        .count-badge-large {
          background: #fee2e2;
          color: #dc2626;
          padding: 2px 10px;
          border-radius: 20px;
          font-weight: 700;
        }

        .reason-box {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          background: #fff;
        }

        .reason-label {
          display: inline-block;
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 12px;
        }

        .reason-description {
          font-size: 14px;
          color: #334155;
          line-height: 1.6;
        }

        .evidence-preview-box {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .evidence-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          cursor: zoom-in;
          max-height: 400px;
        }

        .evidence-file-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #64748b;
        }

        .btn-view-file {
          background: #fff;
          border: 1px solid #cbd5e1;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          color: #0f766e;
          text-decoration: none;
        }

        .resolution-section {
          border-top: 2px dashed #e2e8f0;
          padding-top: 24px;
        }

        .resolution-header { margin-bottom: 20px; }
        .resolution-header h4 { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; }
        .resolution-header p { font-size: 13px; color: #64748b; margin: 4px 0 0; }

        .action-buttons-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .action-choice {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-choice span { font-weight: 700; font-size: 14px; }

        .action-choice.dismiss { color: #475569; }
        .action-choice.dismiss:hover { background: #f8fafc; border-color: #cbd5e1; }

        .action-choice.warn { color: #b45309; }
        .action-choice.warn:hover { background: #fffbeb; border-color: #fcd34d; }

        .action-choice.lock { color: #dc2626; }
        .action-choice.lock:hover { background: #fef2f2; border-color: #fecaca; }

        .resolution-form {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
        }

        .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .form-header h5 { margin: 0; font-size: 14px; font-weight: 500; }
        .btn-text { background: none; border: none; color: #1d4ed8; cursor: pointer; font-size: 13px; text-decoration: underline; }

        .helper-text { font-size: 13px; color: #64748b; margin-bottom: 16px; }

        .note-inputs { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .input-field { display: flex; flex-direction: column; gap: 8px; }
        .input-field label { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.reporter { background: #3b82f6; }
        .dot.target { background: #ef4444; }

        .input-field textarea {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          resize: vertical;
          outline: none;
        }

        .template-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip {
          background: #fff;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 11px;
          color: #475569;
          cursor: pointer;
        }
        .chip:hover { background: #f1f5f9; }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #f8fafc;
        }

        .btn-cancel { padding: 10px 20px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; font-weight: 600; cursor: pointer; }
        .btn-confirm-action { padding: 10px 20px; border-radius: 8px; border: none; background: #0f766e; color: #fff; font-weight: 700; cursor: pointer; }

        .processed-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px;
          background: #f1f5f9;
          border-radius: 8px;
          color: #475569;
          font-weight: 600;
        }

        .error-text { color: #dc2626; font-size: 13px; font-weight: 600; margin-top: 10px; }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .detail-grid { grid-template-columns: 1fr; }
          .action-buttons-grid { grid-template-columns: 1fr; }
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
