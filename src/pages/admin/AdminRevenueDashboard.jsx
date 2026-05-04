import { useEffect, useState } from "react";
import { DollarSign, RefreshCw, UserCheck, TrendingDown, BarChart2 } from "lucide-react";
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
import { toast } from "react-toastify";
import { adminApi } from "@/apis/admin.api";
import dayjs from "dayjs";

const numberFormatter = new Intl.NumberFormat("vi-VN");
const formatNumber = (value) => numberFormatter.format(Number(value || 0));
const formatCurrency = (value) => `${formatNumber(value)} đ`;

const pieColors = ["#4c6fb5", "#14a47c", "#f29d4b"];

const AdminRevenueDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timeframe, setTimeframe] = useState("Tháng này");

  const fetchData = async (tf) => {
    try {
      setLoading(true);
      setError(false);
      const res = await adminApi.getRevenueDashboard(tf);

      // In ra console để xem chính xác hình thù dữ liệu trả về
      console.log("Dữ liệu API trả về:", res);

      // Trường hợp 1: Nếu axios interceptor ĐÃ bóc sẵn response.data
      if (res?.code === 1000) {
        // Tùy thuộc vào backend của bạn đặt tên biến chứa payload là 'result' hay 'data'
        setData(res.result || res.data);
      }
      // Trường hợp 2: Nếu axios CHƯA bóc, giữ nguyên cấu trúc mặc định
      else if (res.data?.code === 1000) {
        setData(res.data.result || res.data.data);
      }
      else {
        // Nếu code khác 1000 thật, mới set Error
        console.warn("API không trả về code 1000", res);
        setError(true);
      }
    } catch (err) {
      console.error("Lỗi khi gọi API doanh thu:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(timeframe);
  }, [timeframe]);

  const handleExport = async () => {
    try {
      const res = await adminApi.exportRevenueDashboard(timeframe);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `revenue-report-${dayjs().format("YYYYMMDDHHmmss")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Xuất báo cáo thành công."); // MSG193
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi xuất báo cáo.");
    }
  };

  if (error) {
    return (
      <div className="rev-dashboard-page" style={{ textAlign: "center", padding: "50px 20px" }}>
        <h2 style={{ color: "#b91c1c" }}>Lỗi kết nối máy chủ</h2>
        <p>Lỗi kết nối máy chủ. Không thể tải dữ liệu thống kê hệ thống lúc này. Vui lòng tải lại trang.</p>
        <button className="rev-button" style={{ marginTop: "20px" }} onClick={() => fetchData(timeframe)}>
          Tải lại
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Đang tải dữ liệu doanh thu...</div>;
  }

  const { overview, trends, recentTransactions } = data;
  const overviewCards = [
    {
      title: "Tổng doanh thu",
      value: overview.totalRevenue.current,
      note1: overview.totalRevenue.variancePercent != null
        ? `Biến động so với kỳ trước: ${overview.totalRevenue.variancePercent > 0 ? "+" : ""}${overview.totalRevenue.variancePercent}%`
        : "Không có dữ liệu kỳ trước",
      note2: "Chỉ gồm giao dịch SUCCESS",
      isCurrency: true,
      icon: <DollarSign size={24} className="rev-card-icon" />,
    },
    {
      title: "Doanh thu định kỳ hàng tháng (MRR)",
      value: overview.mrr,
      note1: "Ảnh chụp tại thời điểm hiện tại",
      note2: "Không đổi theo bộ lọc thời gian",
      isCurrency: true,
      icon: <RefreshCw size={24} className="rev-card-icon" />,
    },
    {
      title: "Người đăng ký đang hoạt động",
      value: overview.activeSubscribers,
      note1: "Tổng người dùng đang dùng gói trả phí",
      note2: "",
      isCurrency: false,
      icon: <UserCheck size={24} className="rev-card-icon" />,
    },
    {
      title: "Tỷ lệ rời bỏ (30 ngày)",
      value: overview.churnRate,
      note1: "Tỷ lệ không gia hạn trong 30 ngày gần nhất",
      note2: "",
      isCurrency: false,
      icon: <TrendingDown size={24} color="#dc2626" className="rev-card-icon" />,
    },
  ];

  const isLineChartEmpty = !trends?.revenueTrend || trends.revenueTrend.length === 0;
  const isPieChartEmpty = !trends?.revenueByPlan || trends.revenueByPlan.length === 0;

  return (
    <div className="rev-dashboard-page">
      <div className="rev-head">
        <div>
          <p className="rev-kicker">Revenue Analytics</p>
          <h1>Bảng điều hành doanh thu</h1>
        </div>
        <div className="rev-updated">
          Cập nhật dữ liệu: {dayjs(overview.generatedAt).format("DD/MM/YYYY HH:mm")}
        </div>
      </div>

      <section className="rev-section">
        <div className="rev-section-title">Bộ lọc và thao tác</div>
        <div className="rev-filter-row">
          <div className="rev-filter-group">
            <label htmlFor="rev-time-filter">Bộ lọc thời gian toàn cục</label>
            <select
              id="rev-time-filter"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="Tháng này">Tháng này (mặc định)</option>
              <option value="30 ngày gần nhất">30 ngày gần nhất</option>
              <option value="Quý này">Quý này</option>
              <option value="Năm nay">Năm nay</option>
            </select>
          </div>
          <button type="button" className="rev-button" onClick={handleExport}>
            Xuất báo cáo
          </button>
        </div>
      </section>

      <section className="rev-section">
        <div className="rev-section-title">Thẻ Tổng quan</div>
        <div className="rev-overview-grid">
          {overviewCards.map((card) => (
            <article key={card.title} className="rev-card">
              <div className="rev-card-header">
                <h3>{card.title}</h3>
                {card.icon}
              </div>
              <p className={`rev-card-value ${card.isCurrency ? "rev-currency-value" : ""}`}>
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
        <div className="rev-section-title">Biểu đồ phân tích</div>
        <div className="rev-trend-grid">
          <article className="rev-panel">
            <h4>Xu hướng doanh thu (Line Chart)</h4>
            <div className="rev-chart-wrap">
              {isLineChartEmpty ? (
                <div className="rev-chart-empty">
                  <BarChart2 size={40} opacity={0.2} />
                  <p>Chưa có dữ liệu doanh thu trong khoảng thời gian này</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trends.revenueTrend}>
                    <CartesianGrid stroke="#c9d2e3" strokeDasharray="4 4" />
                    <XAxis dataKey="date" stroke="#283142" tick={{ fontSize: 11, fill: "#283142" }} />
                    <YAxis
                      stroke="#283142"
                      tick={{ fontSize: 11, fill: "#283142" }}
                      tickFormatter={(value) => `${Math.round(value / 1000)}k`}
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
              )}
            </div>
          </article>

          <article className="rev-panel">
            <h4>Doanh thu theo gói (Pie Chart)</h4>
            <div className="rev-chart-wrap">
              {isPieChartEmpty ? (
                <div className="rev-chart-empty">
                  <BarChart2 size={40} opacity={0.2} />
                  <p>Chưa có dữ liệu doanh thu trong khoảng thời gian này</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={trends.revenueByPlan}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={92}
                      stroke="#ffffff"
                      strokeWidth={1}
                      label={({ name, value }) => `${name} ${value}%`}
                    >
                      {trends.revenueByPlan.map((item, idx) => (
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
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="rev-section">
        <div className="rev-section-title">Giao dịch gần đây (10 giao dịch SUCCESS gần nhất)</div>
        <div className="rev-table-wrap">
          <table className="rev-table">
            <thead>
              <tr>
                <th>Tên người dùng</th>
                <th>Gói dịch vụ</th>
                <th style={{ textAlign: "right" }}>Số tiền</th>
                <th>Ngày giao dịch</th>
                <th>Mã giao dịch</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((item) => (
                  <tr key={item.transactionId}>
                    <td>{item.userName}</td>
                    <td>{item.plan}</td>
                    <td style={{ textAlign: "right", fontWeight: 500 }}>{formatCurrency(item.amount)}</td>
                    <td>{item.date}</td>
                    <td>{item.transactionId}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                    Không có giao dịch nào trong khoảng thời gian này.
                  </td>
                </tr>
              )}
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
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .rev-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rev-card-icon {
          color: #cbd5e1;
          opacity: 0.8;
          margin-top: -10px;
        }

        .rev-card-value {
          margin: 0 0 10px;
          font-size: clamp(30px, 3vw, 38px);
          font-weight: 700;
          line-height: 1;
          color: #0f172a;
        }

        .rev-currency-value {
          color: #16a34a;
          font-size: clamp(34px, 3.5vw, 42px);
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

        .rev-chart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 280px;
          color: #94a3b8;
          text-align: center;
          gap: 12px;
        }

        .rev-chart-empty p {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
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