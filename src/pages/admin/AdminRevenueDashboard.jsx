import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const formatNumber = (value) => numberFormatter.format(Number(value || 0));

const formatCurrency = (value) => `${formatNumber(value)} đ`;

const overviewCards = [
  {
    title: "Total Revenue (MTD)",
    value: 1580000000,
    note1: "Biến động so với tháng trước: +8%",
    note2: "Chỉ gồm giao dịch SUCCESS (BR-137)",
    isCurrency: true,
  },
  {
    title: "MRR (Monthly Recurring Revenue)",
    value: 740000000,
    note1: "Ảnh chụp tại thời điểm hiện tại",
    note2: "Không đổi theo bộ lọc thời gian (A1)",
    isCurrency: true,
  },
  {
    title: "Active Subscribers",
    value: 3420,
    note1: "Tổng người dùng đang dùng gói trả phí",
    note2: "",
    isCurrency: false,
  },
  {
    title: "Churn Rate (30 ngày)",
    value: "2.7%",
    note1: "Tỷ lệ không gia hạn trong 30 ngày gần nhất",
    note2: "",
    isCurrency: false,
  },
];

const revenueTrendData = [
  { date: "01/04", doanhThu: 46000000 },
  { date: "02/04", doanhThu: 52000000 },
  { date: "03/04", doanhThu: 48500000 },
  { date: "04/04", doanhThu: 61000000 },
  { date: "05/04", doanhThu: 57500000 },
  { date: "06/04", doanhThu: 69000000 },
  { date: "07/04", doanhThu: 64000000 },
  { date: "08/04", doanhThu: 71000000 },
];

const revenueByPlanData = [
  { name: "Basic", value: 28 },
  { name: "Pro", value: 43 },
  { name: "Premium", value: 29 },
];

const transactions = [
  {
    userName: "Nguyễn Minh Anh",
    plan: "Pro",
    amount: 1500000,
    date: "08/04/2026 10:12",
    transactionId: "TXN-20260408-001",
  },
  {
    userName: "Trần Quốc Bảo",
    plan: "Basic",
    amount: 900000,
    date: "08/04/2026 08:44",
    transactionId: "TXN-20260408-002",
  },
  {
    userName: "Lê Hà My",
    plan: "Premium",
    amount: 2400000,
    date: "08/04/2026 09:20",
    transactionId: "TXN-20260408-003",
  },
  {
    userName: "Phạm Gia Huy",
    plan: "Pro",
    amount: 1500000,
    date: "08/04/2026 08:58",
    transactionId: "TXN-20260408-004",
  },
  {
    userName: "Đặng Hoài Nam",
    plan: "Basic",
    amount: 900000,
    date: "08/04/2026 08:42",
    transactionId: "TXN-20260408-005",
  },
  {
    userName: "Vũ Mai Lan",
    plan: "Pro",
    amount: 1500000,
    date: "07/04/2026 21:15",
    transactionId: "TXN-20260407-006",
  },
  {
    userName: "Bùi Nhật Minh",
    plan: "Premium",
    amount: 2400000,
    date: "07/04/2026 20:10",
    transactionId: "TXN-20260407-007",
  },
  {
    userName: "Hoàng Bảo Châu",
    plan: "Basic",
    amount: 900000,
    date: "07/04/2026 19:05",
    transactionId: "TXN-20260407-008",
  },
  {
    userName: "Đỗ Tuấn Kiệt",
    plan: "Pro",
    amount: 1500000,
    date: "07/04/2026 18:31",
    transactionId: "TXN-20260407-009",
  },
  {
    userName: "Ngô Khánh Linh",
    plan: "Basic",
    amount: 900000,
    date: "07/04/2026 17:22",
    transactionId: "TXN-20260407-010",
  },
];

const pieColors = ["#4c6fb5", "#14a47c", "#f29d4b"];

const AdminRevenueDashboardPage = () => {
  return (
    <div className="rev-dashboard-page">
      <div className="rev-head">
        <div>
          <p className="rev-kicker">Revenue Analytics</p>
          <h1>Bảng điều hành doanh thu</h1>
        </div>
        <div className="rev-updated">Cập nhật dữ liệu: 08/04/2026 10:45</div>
      </div>

      <section className="rev-section">
        <div className="rev-section-title">Bộ lọc và thao tác</div>
        <div className="rev-filter-row">
          <div className="rev-filter-group">
            <label htmlFor="rev-time-filter">Bộ lọc thời gian toàn cục</label>
            <select id="rev-time-filter" defaultValue="Tháng này (mặc định)">
              <option>Tháng này (mặc định)</option>
              <option>30 ngày gần nhất</option>
              <option>Quý này</option>
              <option>Năm nay</option>
            </select>
          </div>
          <button type="button" className="rev-button">Xuất báo cáo</button>
        </div>
      </section>

      <section className="rev-section">
        <div className="rev-section-title">Overview Cards</div>
        <div className="rev-overview-grid">
          {overviewCards.map((card) => (
            <article key={card.title} className="rev-card">
              <h3>{card.title}</h3>
              <p className="rev-card-value">
                {typeof card.value === "number"
                  ? card.isCurrency
                    ? formatCurrency(card.value)
                    : formatNumber(card.value)
                  : card.value}
              </p>
              <p className="rev-muted">{card.note1}</p>
              {card.note2 && <p className="rev-muted">{card.note2}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="rev-section">
        <div className="rev-section-title">Analytical Charts</div>
        <div className="rev-trend-grid">
          <article className="rev-panel">
            <h4>Revenue Trend (Line Chart)</h4>
            <div className="rev-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid stroke="#c9d2e3" strokeDasharray="4 4" />
                  <XAxis dataKey="date" stroke="#283142" tick={{ fontSize: 11, fill: "#283142" }} />
                  <YAxis
                    stroke="#283142"
                    tick={{ fontSize: 11, fill: "#283142" }}
                    tickFormatter={(value) => `${Math.round(value / 1000000)}M`}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #aebad1",
                      color: "#111827",
                      borderRadius: 10,
                    }}
                    labelStyle={{ color: "#111827" }}
                  />
                  <Legend wrapperStyle={{ color: "#111827", fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="doanhThu"
                    name="Doanh thu"
                    stroke="#3158a2"
                    strokeWidth={2.6}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rev-panel">
            <h4>Revenue by Plan (Pie Chart)</h4>
            <div className="rev-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={revenueByPlanData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={92}
                    stroke="#ffffff"
                    strokeWidth={1}
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {revenueByPlanData.map((item, idx) => (
                      <Cell key={item.name} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #aebad1",
                      color: "#111827",
                      borderRadius: 10,
                    }}
                    labelStyle={{ color: "#111827" }}
                  />
                  <Legend wrapperStyle={{ color: "#111827", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      </section>

      <section className="rev-section">
        <div className="rev-section-title">Recent Transactions (10 giao dịch SUCCESS gần nhất)</div>
        <p className="rev-note">Định dạng tiền tệ: VND có phân tách hàng nghìn, làm tròn số nguyên (BR-138).</p>

        <div className="rev-table-wrap">
          <table className="rev-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.transactionId}>
                  <td>{item.userName}</td>
                  <td>{item.plan}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.date}</td>
                  <td>{item.transactionId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .rev-dashboard-page {
          color: #111827;
          display: grid;
          gap: 18px;
          padding: 6px;
        }

        .rev-head {
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

        .rev-kicker {
          margin: 0 0 4px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
        }

        .rev-head h1 {
          margin: 0;
          font-size: clamp(24px, 2.7vw, 34px);
          font-weight: 700;
          line-height: 1.15;
        }

        .rev-updated {
          border: 1px solid #b9c6df;
          background: #e8efff;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          color: #1f2f57;
        }

        .rev-section {
          border: 1px solid #d7deeb;
          background: #f8fbff;
          border-radius: 14px;
          overflow: hidden;
        }

        .rev-section-title {
          border-bottom: 1px solid #d7deeb;
          background: #eef3fb;
          padding: 10px 12px;
          font-size: 15px;
          font-weight: 700;
          color: #23314f;
        }

        .rev-filter-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: end;
          padding: 12px;
        }

        .rev-filter-group {
          display: grid;
          gap: 6px;
        }

        .rev-filter-group label {
          font-size: 13px;
          font-weight: 700;
          color: #22304b;
        }

        .rev-filter-group select {
          width: 100%;
          height: 38px;
          border: 1px solid #b8c5dc;
          background: #ffffff;
          color: #111827;
          border-radius: 10px;
          font-size: 13px;
          padding: 0 10px;
        }

        .rev-button {
          height: 38px;
          border: 1px solid #4f678f;
          background: #dfe9ff;
          color: #1e2f57;
          border-radius: 10px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .rev-overview-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 12px;
        }

        .rev-card,
        .rev-panel {
          border: 1px solid #d4ddeb;
          background: #ffffff;
          border-radius: 12px;
          padding: 12px;
        }

        .rev-card h3,
        .rev-panel h4 {
          margin: 0 0 10px;
          font-size: 14px;
          font-weight: 700;
          color: #22304b;
        }

        .rev-card-value {
          margin: 0 0 10px;
          font-size: clamp(30px, 3vw, 38px);
          font-weight: 700;
          line-height: 1;
          color: #0f172a;
        }

        .rev-muted {
          margin: 4px 0;
          font-size: 13px;
          color: #334155;
        }

        .rev-trend-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 12px;
        }

        .rev-chart-wrap {
          border: 1px solid #d9e2f1;
          border-radius: 10px;
          background:
            radial-gradient(circle at 15% 10%, rgba(191, 219, 254, 0.24), transparent 42%),
            radial-gradient(circle at 90% 90%, rgba(167, 243, 208, 0.2), transparent 38%),
            #ffffff;
          padding: 10px;
          min-height: 300px;
        }

        .rev-note {
          margin: 0;
          padding: 10px 12px 0;
          font-size: 13px;
          color: #334155;
        }

        .rev-table-wrap {
          border: 1px solid #d9e2f1;
          border-radius: 10px;
          background: #ffffff;
          margin: 12px;
          overflow: auto;
        }

        .rev-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .rev-table th,
        .rev-table td {
          border: 1px solid #d8dfec;
          padding: 8px;
          font-size: 12px;
          text-align: left;
          color: #111827;
          background: #ffffff;
          white-space: nowrap;
        }

        .rev-table th {
          background: #ecf2fc;
          font-weight: 700;
          color: #1f2f57;
        }

        .rev-table tbody tr:nth-child(even) td {
          background: #f8fbff;
        }

        .rev-table tbody tr:hover td {
          background: #eef4ff;
        }

        @media (max-width: 1200px) {
          .rev-overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .rev-trend-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .rev-head {
            border-radius: 12px;
            padding: 12px;
          }

          .rev-updated {
            width: 100%;
          }

          .rev-filter-row {
            grid-template-columns: 1fr;
          }

          .rev-overview-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminRevenueDashboardPage;