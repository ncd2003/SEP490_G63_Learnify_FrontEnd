import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/apis/admin.api";

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

const formatRole = (role) => {
  if (!role) return "-";
  const lowered = role.toLowerCase();
  if (lowered.includes("student")) return "Học sinh";
  if (lowered.includes("teacher")) return "Giáo viên";
  if (lowered.includes("admin")) return "Quản trị viên";
  return role;
};

const AdminManageReportPage = () => {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedReportId, setSelectedReportId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getReports({ status, page, size });
        const result = response?.result || {};
        const content = result.content || [];

        setItems(content);
        setTotalPages(result.totalPages || 1);

        if (content.length > 0) {
          const nextSelected = content.some((item) => item.reportId === selectedReportId)
            ? selectedReportId
            : content[0].reportId;
          setSelectedReportId(nextSelected);
        } else {
          setSelectedReportId(null);
          setDetail(null);
        }
      } catch (err) {
        const backendMessage = err?.response?.data?.message;
        setError(backendMessage || "MSG90: Không thể tải nội dung trang. Vui lòng làm mới trang hoặc thử lại sau.");
        setItems([]);
        setTotalPages(1);
        setSelectedReportId(null);
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [status, page, size]);

  useEffect(() => {
    const fetchReportDetail = async () => {
      if (!selectedReportId) return;

      setDetailLoading(true);
      setDetailError("");

      try {
        const response = await adminApi.getReportDetail(selectedReportId);
        setDetail(response?.result || null);
      } catch (err) {
        const backendMessage = err?.response?.data?.message;
        setDetailError(backendMessage || "Không thể tải chi tiết báo cáo.");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchReportDetail();
  }, [selectedReportId]);

  const selectedSummary = useMemo(
    () => items.find((item) => item.reportId === selectedReportId) || null,
    [items, selectedReportId],
  );

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
                  <th>Người bị báo cáo</th>
                  <th>Số báo cáo chờ</th>
                  <th>Lý do chính</th>
                  <th>Trạng thái</th>
                  <th>Ưu tiên</th>
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
                    <tr
                      key={item.reportId}
                      className={item.reportId === selectedReportId ? "active-row" : ""}
                      onClick={() => setSelectedReportId(item.reportId)}
                    >
                      <td>RP-{item.reportId}</td>
                      <td>USR-{item.reportedUserId}</td>
                      <td>{item.pendingReportCountForTarget}</td>
                      <td>{formatReason(item.reason)}</td>
                      <td>{formatStatus(item.status)}</td>
                      <td>{item.highPriority ? "TOP" : "Thường"}</td>
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

        <div className="detail-panel card">
          <h2>
            Chi tiết báo cáo
            {selectedSummary ? ` đã chọn: RP-${selectedSummary.reportId}` : ""}
          </h2>

          {detailLoading ? (
            <p className="state-text">Đang tải chi tiết...</p>
          ) : detailError ? (
            <p className="error-text">{detailError}</p>
          ) : !detail ? (
            <p className="state-text">Chọn một báo cáo để xem chi tiết.</p>
          ) : (
            <div className="detail-grid">
              <div className="detail-item">
                <span>Người gửi báo cáo:</span>
                <strong>
                  {detail.reporterCode} ({formatRole(detail.reporterRole)})
                </strong>
              </div>
              <div className="detail-item">
                <span>Người bị báo cáo:</span>
                <strong>
                  {detail.reportedUserCode} ({formatRole(detail.reportedUserRole)})
                </strong>
              </div>
              <div className="detail-item">
                <span>Lý do báo cáo:</span>
                <strong>{formatReason(detail.reason)}</strong>
              </div>
              <div className="detail-item">
                <span>Mô tả chi tiết:</span>
                <p>{detail.detailedDescription || "-"}</p>
              </div>
              <div className="detail-item">
                <span>Trạng thái:</span>
                <strong>{formatStatus(detail.status)}</strong>
              </div>
            </div>
          )}
        </div>
      </section>

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
          grid-template-columns: 1fr 1.12fr;
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

        .active-row {
          background: #eff6ff;
        }

        tbody tr {
          cursor: pointer;
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

        .detail-grid {
          display: grid;
          gap: 10px;
        }

        .detail-item {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          background: #f8fafc;
          display: grid;
          gap: 5px;
        }

        .detail-item span {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-weight: 700;
        }

        .detail-item strong,
        .detail-item p {
          margin: 0;
          font-size: 14px;
          color: #0f172a;
          line-height: 1.45;
        }

        .state-text {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }

        .error-banner,
        .error-text {
          color: #b91c1c;
        }

        .error-banner {
          margin-bottom: 8px;
          border: 1px solid #fecaca;
          background: #fff1f2;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
        }

        .error-text {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminManageReportPage;
