import { useMemo, useState } from "react";

const PAGE_SIZE = 10;
const now = new Date("2026-04-08T16:20:00");

const transactionSeed = [
  ["TXN-20260408-2481", "Nguyễn Minh Anh", "Pro", 1500000, "SUCCESS", "2026-04-08T14:18:00"],
  ["TXN-20260408-2480", "Trần Gia Bảo", "Basic", 900000, "FAILED", "2026-04-08T14:10:00"],
  ["TXN-20260408-2479", "Lê Hoài Nam", "Premium", 2400000, "SUCCESS", "2026-04-08T14:03:00"],
  ["TXN-20260408-2478", "Phạm Quỳnh Chi", "Pro", 1500000, "PENDING", "2026-04-08T13:56:00"],
  ["TXN-20260408-2477", "Đỗ Tuấn Kiệt", "Basic", 900000, "SUCCESS", "2026-04-08T13:40:00"],
  ["TXN-20260408-2476", "Vũ Minh Châu", "Pro", 1500000, "SUCCESS", "2026-04-08T13:29:00"],
  ["TXN-20260408-2475", "Bùi Khánh Linh", "Premium", 2400000, "FAILED", "2026-04-08T13:11:00"],
  ["TXN-20260408-2474", "Hoàng Gia Hân", "Basic", 900000, "SUCCESS", "2026-04-08T12:58:00"],
  ["TXN-20260408-2473", "Ngô Hà Nam", "Pro", 1500000, "PENDING", "2026-04-08T12:42:00"],
  ["TXN-20260408-2472", "Đặng Thu Hà", "Basic", 900000, "SUCCESS", "2026-04-08T12:31:00"],
  ["TXN-20260408-2471", "Mai Quốc Huy", "Pro", 1500000, "SUCCESS", "2026-04-08T12:10:00"],
  ["TXN-20260407-2470", "Lý Ngọc Anh", "Premium", 2400000, "SUCCESS", "2026-04-07T21:35:00"],
  ["TXN-20260407-2469", "Nguyễn Đức Mạnh", "Basic", 900000, "FAILED", "2026-04-07T20:58:00"],
  ["TXN-20260407-2468", "Trịnh Mai Phương", "Pro", 1500000, "SUCCESS", "2026-04-07T20:40:00"],
  ["TXN-20260407-2467", "Vũ Gia Linh", "Premium", 2400000, "PENDING", "2026-04-07T20:03:00"],
  ["TXN-20260407-2466", "Đinh Công Nam", "Basic", 900000, "SUCCESS", "2026-04-07T19:49:00"],
  ["TXN-20260407-2465", "Phùng An Nhi", "Pro", 1500000, "SUCCESS", "2026-04-07T19:18:00"],
  ["TXN-20260407-2464", "Lưu Thanh Hương", "Basic", 900000, "SUCCESS", "2026-04-07T18:57:00"],
  ["TXN-20260406-2463", "Hà Tiến Dũng", "Premium", 2400000, "FAILED", "2026-04-06T18:21:00"],
  ["TXN-20260406-2462", "Đoàn Nhật Quang", "Pro", 1500000, "SUCCESS", "2026-04-06T17:44:00"],
];

const transactions = transactionSeed.map((item) => ({
  id: item[0],
  userName: item[1],
  planName: item[2],
  amount: item[3],
  status: item[4],
  createdAt: item[5],
}));

const numberFormatter = new Intl.NumberFormat("vi-VN");

const formatMoney = (value) => `${numberFormatter.format(Number(value || 0))} đ`;

const formatDateTime = (value) => {
  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const isInPeriod = (dateInput, period) => {
  const date = new Date(dateInput);
  if (period === "this-month") {
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  if (period === "last-7-days") {
    const lowerBound = new Date(now);
    lowerBound.setDate(now.getDate() - 7);
    return date >= lowerBound && date <= now;
  }

  if (period === "this-quarter") {
    const quarter = Math.floor(now.getMonth() / 3);
    const dateQuarter = Math.floor(date.getMonth() / 3);
    return (
      dateQuarter === quarter &&
      date.getFullYear() === now.getFullYear()
    );
  }

  if (period === "this-year") {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
};

const statusMap = {
  SUCCESS: { label: "Success", className: "txn-status--success" },
  FAILED: { label: "Failed", className: "txn-status--failed" },
  PENDING: { label: "Pending", className: "txn-status--pending" },
};

const AdminTransactionHistoryPage = () => {
  const [draftKeyword, setDraftKeyword] = useState("TXN-20260408");
  const [draftStatus, setDraftStatus] = useState("all");
  const [draftPeriod, setDraftPeriod] = useState("this-month");

  const [keyword, setKeyword] = useState("TXN-20260408");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("this-month");
  const [page, setPage] = useState(1);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((item) => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        const matchKeyword =
          normalizedKeyword.length === 0 ||
          item.id.toLowerCase().includes(normalizedKeyword) ||
          item.userName.toLowerCase().includes(normalizedKeyword);

        const matchStatus = status === "all" || item.status === status;
        const matchPeriod = isInPeriod(item.createdAt, period);

        return matchKeyword && matchStatus && matchPeriod;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [keyword, status, period]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const visibleRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, safePage]);

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(safePage * PAGE_SIZE, totalItems);

  const handleApplyFilters = () => {
    setKeyword(draftKeyword);
    setStatus(draftStatus);
    setPeriod(draftPeriod);
    setPage(1);
  };

  const pageButtons = useMemo(() => {
    const buttons = [1];

    if (totalPages <= 1) return buttons;

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    const middle = [safePage - 1, safePage, safePage + 1].filter(
      (item) => item > 1 && item < totalPages,
    );

    return [1, ...middle, totalPages];
  }, [safePage, totalPages]);

  return (
    <div className="txn-page">
      <div className="txn-head">
        <div>
          <p className="txn-kicker">Revenue Analytics</p>
          <h1>Lịch sử giao dịch</h1>
        </div>
        <div className="txn-updated">Cập nhật dữ liệu: 08/04/2026 14:20</div>
      </div>

      <section className="txn-section">
        <div className="txn-section-title">Tìm kiếm và bộ lọc</div>
        <div className="txn-filter-grid">
          <div className="txn-field">
            <label htmlFor="txn-search">Tìm kiếm giao dịch</label>
            <input
              id="txn-search"
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              placeholder="Nhập Transaction ID hoặc tên người dùng"
            />
          </div>

          <div className="txn-field">
            <label htmlFor="txn-status">Trạng thái</label>
            <select
              id="txn-status"
              value={draftStatus}
              onChange={(event) => setDraftStatus(event.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div className="txn-field">
            <label htmlFor="txn-period">Khoảng ngày</label>
            <select
              id="txn-period"
              value={draftPeriod}
              onChange={(event) => setDraftPeriod(event.target.value)}
            >
              <option value="this-month">Tháng này</option>
              <option value="last-7-days">7 ngày gần nhất</option>
              <option value="this-quarter">Quý này</option>
              <option value="this-year">Năm nay</option>
            </select>
          </div>

          <button type="button" className="txn-button" onClick={handleApplyFilters}>
            Áp dụng
          </button>
        </div>
      </section>

      <section className="txn-section">
        <div className="txn-section-title">Danh sách giao dịch (mặc định sắp xếp mới nhất trước)</div>
        <p className="txn-note">
          Sắp xếp theo created_at giảm dần (BR-140). Số tiền hiển thị theo định dạng VND,
          có dấu phân tách hàng nghìn và làm tròn số nguyên (BR-139).
        </p>

        <div className="txn-table-wrap">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User Name</th>
                <th>Plan Name</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((item) => {
                const statusMeta = statusMap[item.status] || statusMap.PENDING;
                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.userName}</td>
                    <td>{item.planName}</td>
                    <td>{formatMoney(item.amount)}</td>
                    <td>
                      <span className={`txn-status ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td>{formatDateTime(item.createdAt)}</td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="txn-empty-row">
                    Không tìm thấy giao dịch phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="txn-footer">
          <p>Hiển thị {startIndex}-{endIndex} / {totalItems} giao dịch</p>

          <div className="txn-pagination">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
            >
              Trước
            </button>

            {pageButtons.map((item, idx) => {
              const shouldShowEllipsis =
                idx > 0 && pageButtons[idx] - pageButtons[idx - 1] > 1;

              return (
                <div key={item} className="txn-page-group">
                  {shouldShowEllipsis && <span className="txn-ellipsis">...</span>}
                  <button
                    type="button"
                    className={item === safePage ? "active" : ""}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .txn-page {
          color: #111827;
          display: grid;
          gap: 18px;
          padding: 6px;
        }

        .txn-head {
          border: 1px solid #cbd5e1;
          background: linear-gradient(130deg, #ffffff 0%, #f4f8ff 100%);
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .txn-kicker {
          margin: 0 0 4px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
        }

        .txn-head h1 {
          margin: 0;
          font-size: clamp(24px, 2.7vw, 34px);
          font-weight: 700;
          line-height: 1.15;
        }

        .txn-updated {
          border: 1px solid #b9c6df;
          background: #e8efff;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          color: #1f2f57;
        }

        .txn-section {
          border: 1px solid #d7deeb;
          background: #f8fbff;
          border-radius: 14px;
          overflow: hidden;
        }

        .txn-section-title {
          border-bottom: 1px solid #d7deeb;
          background: #eef3fb;
          padding: 10px 12px;
          font-size: 15px;
          font-weight: 700;
          color: #23314f;
        }

        .txn-filter-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr auto;
          gap: 12px;
          padding: 12px;
          align-items: end;
        }

        .txn-field {
          display: grid;
          gap: 6px;
        }

        .txn-field label {
          font-size: 13px;
          font-weight: 700;
          color: #22304b;
        }

        .txn-field input,
        .txn-field select {
          height: 38px;
          border: 1px solid #b8c5dc;
          border-radius: 10px;
          background: #ffffff;
          color: #111827;
          font-size: 13px;
          padding: 0 10px;
        }

        .txn-button {
          height: 38px;
          border: 1px solid #4f678f;
          background: #dfe9ff;
          color: #1e2f57;
          border-radius: 10px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .txn-note {
          margin: 0;
          padding: 10px 12px 0;
          font-size: 13px;
          color: #334155;
        }

        .txn-table-wrap {
          border: 1px solid #d9e2f1;
          border-radius: 10px;
          background: #ffffff;
          margin: 12px;
          overflow: auto;
        }

        .txn-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 860px;
        }

        .txn-table th,
        .txn-table td {
          border: 1px solid #d8dfec;
          padding: 8px;
          font-size: 12px;
          text-align: left;
          color: #111827;
          background: #ffffff;
          white-space: nowrap;
        }

        .txn-table th {
          background: #ecf2fc;
          font-weight: 700;
          color: #1f2f57;
        }

        .txn-table tbody tr:nth-child(even) td {
          background: #f8fbff;
        }

        .txn-table tbody tr:hover td {
          background: #eef4ff;
        }

        .txn-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          border: 1px solid transparent;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .txn-status--success {
          background: #e8faf3;
          border-color: #9edec2;
          color: #0f6a4f;
        }

        .txn-status--failed {
          background: #fdecec;
          border-color: #f1b8b8;
          color: #9f2f2f;
        }

        .txn-status--pending {
          background: #fff7e8;
          border-color: #f2d4a5;
          color: #8a5a09;
        }

        .txn-empty-row {
          text-align: center;
          font-style: italic;
          background: #f6f9ff;
        }

        .txn-footer {
          padding: 0 12px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .txn-footer p {
          margin: 0;
          font-size: 13px;
          color: #334155;
          font-weight: 600;
        }

        .txn-pagination {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .txn-page-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .txn-pagination button {
          min-width: 34px;
          height: 30px;
          border: 1px solid #b6c4dd;
          border-radius: 8px;
          background: #ffffff;
          color: #1f2f57;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 0 10px;
        }

        .txn-pagination button:hover:not(:disabled) {
          background: #edf3ff;
        }

        .txn-pagination button.active {
          border-color: #3c62a6;
          background: #dfe9ff;
          color: #193d80;
        }

        .txn-pagination button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .txn-ellipsis {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 1200px) {
          .txn-filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .txn-button {
            width: fit-content;
          }
        }

        @media (max-width: 760px) {
          .txn-head {
            border-radius: 12px;
            padding: 12px;
          }

          .txn-updated {
            width: 100%;
          }

          .txn-filter-grid {
            grid-template-columns: 1fr;
          }

          .txn-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminTransactionHistoryPage;
