import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/apis/admin.api";
import {
  Bar,
  BarChart,
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

const formatTimestamp = (value) => {
  if (!value) return "--/--/---- --:--";
  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const shortDate = (value) => {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}`;
};

const monthLabel = (value) => {
  if (!value) return "";
  const [year, month] = String(value).split("-");
  return `${month}/${year}`;
};

const AdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await adminApi.getSystemDashboard();
        setDashboard(response?.result || null);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "MSG90: Không thể tải dữ liệu bảng điều hành hệ thống. Vui lòng thử lại.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const lineData = useMemo(() => {
    const list = dashboard?.trends?.userGrowthLast30Days || [];
    return list.map((item) => ({
      date: shortDate(item.date),
      hocSinh: Number(item.newStudents || 0),
      giaoVien: Number(item.newTeachers || 0),
    }));
  }, [dashboard]);

  const barData = useMemo(() => {
    const list = dashboard?.trends?.classActivityLast6Months || [];
    return list.map((item) => ({
      month: monthLabel(item.month),
      soLop: Number(item.newClasses || 0),
    }));
  }, [dashboard]);

  const pieData = useMemo(() => {
    const storage = dashboard?.details?.storageUsage;
    if (!storage) return [];
    return [
      {
        name: "Tài liệu lớp học",
        value: Number(storage.classMaterialsMb || 0),
      },
      {
        name: "Bài nộp học sinh",
        value: Number(storage.studentSubmissionsMb || 0),
      },
      {
        name: "Media hệ thống",
        value: Number(storage.systemMediaMb || 0),
      },
    ];
  }, [dashboard]);

  const topClasses = dashboard?.details?.topActiveClasses || [];
  const overview = dashboard?.overview;
  const totalUsers = overview?.totalUsers;

  return (
    <div className="sys-dashboard-page">
      <div className="sys-head">
        <div>
          <p className="sys-kicker">System Analytics</p>
          <h1>Bảng điều hành hệ thống</h1>
        </div>
        <div className="sys-updated">Cập nhật gần nhất: {formatTimestamp(overview?.generatedAt)} | cache tối đa 15 phút</div>
      </div>

      {loading && <div className="sys-info">Đang tải dữ liệu dashboard...</div>}
      {!!error && <div className="sys-error">{error}</div>}

      {!loading && !error && (
        <>
          <section className="sys-section">
            <div className="sys-section-title">Tổng quan hệ thống</div>
            <div className="sys-overview-grid">
              <article className="sys-card">
                <h3>Tổng người dùng</h3>
                <p className="sys-card-value">{formatNumber(totalUsers?.total)}</p>
                <p className="sys-muted">Học sinh: {formatNumber(totalUsers?.roleBreakdown?.students)}</p>
                <p className="sys-muted">Giáo viên: {formatNumber(totalUsers?.roleBreakdown?.teachers)}</p>
                <p className="sys-muted">Quản trị viên: {formatNumber(totalUsers?.roleBreakdown?.admins)}</p>
                <p className="sys-split">Đang hoạt động: {formatNumber(totalUsers?.active)} <span>|</span> Đã khóa: {formatNumber(totalUsers?.locked)}</p>
              </article>

              <article className="sys-card">
                <h3>Lớp học đang hoạt động</h3>
                <p className="sys-card-value">{formatNumber(overview?.activeClasses)}</p>
                <p className="sys-muted">Không bao gồm lớp đã lưu trữ hoặc đã xóa mềm</p>
              </article>

              <article className="sys-card">
                <h3>DAU (Daily Active Users)</h3>
                <p className="sys-card-value">{formatNumber(overview?.dau)}</p>
                <p className="sys-muted">Số người dùng tương tác trong ngày hiện tại</p>
              </article>
            </div>
          </section>

          <section className="sys-section">
            <div className="sys-section-title">Xu hướng tăng trưởng và hoạt động</div>
            <div className="sys-trend-grid">
              <article className="sys-panel">
                <h4>Biểu đồ đường: Tăng trưởng người dùng 30 ngày</h4>
                <div className="sys-chart-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={lineData}>
                      <CartesianGrid stroke="#c9d2e3" strokeDasharray="4 4" />
                      <XAxis dataKey="date" stroke="#283142" tick={{ fontSize: 11, fill: "#283142" }} />
                      <YAxis stroke="#283142" tick={{ fontSize: 11, fill: "#283142" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "#ffffff", border: "1px solid #aebad1", color: "#111827", borderRadius: 10 }}
                        labelStyle={{ color: "#111827" }}
                      />
                      <Legend wrapperStyle={{ color: "#111827", fontSize: 12 }} />
                      <Line type="monotone" dataKey="hocSinh" name="Học sinh" stroke="#3158a2" strokeWidth={2.6} dot={false} />
                      <Line type="monotone" dataKey="giaoVien" name="Giáo viên" stroke="#12a07a" strokeWidth={2.6} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="sys-panel">
                <h4>Biểu đồ cột: Xu hướng tạo lớp mới 6 tháng</h4>
                <div className="sys-chart-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData}>
                      <CartesianGrid stroke="#c9d2e3" strokeDasharray="4 4" />
                      <XAxis dataKey="month" stroke="#283142" tick={{ fontSize: 11, fill: "#283142" }} />
                      <YAxis stroke="#283142" tick={{ fontSize: 11, fill: "#283142" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "#ffffff", border: "1px solid #aebad1", color: "#111827", borderRadius: 10 }}
                        labelStyle={{ color: "#111827" }}
                      />
                      <Legend wrapperStyle={{ color: "#111827", fontSize: 12 }} />
                      <Bar dataKey="soLop" name="Số lớp mới" fill="#5474b8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>
          </section>

          <section className="sys-section">
            <div className="sys-section-title">Chi tiết và phân rã dữ liệu</div>
            <div className="sys-detail-grid">
              <article className="sys-panel">
                <h4>Biểu đồ tròn: Phân bổ lưu trữ</h4>
                <div className="sys-chart-wrap">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={96}
                        stroke="#ffffff"
                        strokeWidth={1}
                        label={({ name }) => name}
                      >
                        <Cell fill="#4c6fb5" />
                        <Cell fill="#14a47c" />
                        <Cell fill="#f29d4b" />
                      </Pie>
                      <Tooltip
                        formatter={(v) => `${formatNumber(v)} MB`}
                        contentStyle={{ background: "#ffffff", border: "1px solid #aebad1", color: "#111827", borderRadius: 10 }}
                        labelStyle={{ color: "#111827" }}
                      />
                      <Legend wrapperStyle={{ color: "#111827", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="sys-panel">
                <h4>Top 5 lớp học hoạt động cao nhất (30 ngày)</h4>
                <div className="sys-table-wrap">
                  <table className="sys-table">
                    <thead>
                      <tr>
                        <th>Hạng</th>
                        <th>Tên lớp</th>
                        <th>Giáo viên</th>
                        <th>Bài viết</th>
                        <th>Bình luận</th>
                        <th>Bài nộp</th>
                        <th>Interaction Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClasses.map((item, index) => (
                        <tr key={item.classId || `${item.classCode}-${index}`}>
                          <td>{index + 1}</td>
                          <td>{item.className || "-"}</td>
                          <td>{item.teacherName || "-"}</td>
                          <td>{formatNumber(item.teacherPosts)}</td>
                          <td>{formatNumber(item.userComments)}</td>
                          <td>{formatNumber(item.studentSubmissions)}</td>
                          <td>{formatNumber(item.interactionScore)}</td>
                        </tr>
                      ))}
                      {topClasses.length === 0 && (
                        <tr>
                          <td colSpan={7} className="sys-empty-row">Không có dữ liệu tương tác trong 30 ngày gần nhất.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </section>
        </>
      )}

      <style>{`
        .sys-dashboard-page {
          color: #111827;
          display: grid;
          gap: 18px;
          padding: 6px;
        }

        .sys-head {
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

        .sys-kicker {
          margin: 0 0 4px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
        }

        .sys-head h1 {
          margin: 0;
          font-size: clamp(24px, 2.7vw, 34px);
          font-weight: 700;
          line-height: 1.15;
        }

        .sys-updated {
          border: 1px solid #b9c6df;
          background: #e8efff;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          color: #1f2f57;
        }

        .sys-info,
        .sys-error {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
        }

        .sys-error {
          border-color: #ef4444;
          color: #b91c1c;
        }

        .sys-section {
          border: 1px solid #d7deeb;
          background: #f8fbff;
          border-radius: 14px;
          overflow: hidden;
        }

        .sys-section-title {
          border-bottom: 1px solid #d7deeb;
          background: #eef3fb;
          padding: 10px 12px;
          font-size: 15px;
          font-weight: 700;
          color: #23314f;
        }

        .sys-overview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          padding: 12px;
        }

        .sys-card,
        .sys-panel {
          border: 1px solid #d4ddeb;
          background: #ffffff;
          border-radius: 12px;
          padding: 12px;
        }

        .sys-card h3,
        .sys-panel h4 {
          margin: 0 0 10px;
          font-size: 14px;
          font-weight: 700;
          color: #22304b;
        }

        .sys-card-value {
          margin: 0 0 10px;
          font-size: clamp(30px, 3vw, 40px);
          font-weight: 700;
          line-height: 1;
          color: #0f172a;
        }

        .sys-muted {
          margin: 4px 0;
          font-size: 13px;
          color: #334155;
        }

        .sys-split {
          margin: 7px 0 0;
          font-size: 13px;
          color: #0f172a;
          font-weight: 700;
        }

        .sys-split span {
          color: #94a3b8;
          padding: 0 6px;
        }

        .sys-trend-grid,
        .sys-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          padding: 12px;
        }

        .sys-chart-wrap {
          border: 1px solid #d9e2f1;
          border-radius: 10px;
          background:
            radial-gradient(circle at 15% 10%, rgba(191, 219, 254, 0.24), transparent 42%),
            radial-gradient(circle at 90% 90%, rgba(167, 243, 208, 0.2), transparent 38%),
            #ffffff;
          padding: 10px;
          min-height: 300px;
        }

        .sys-table-wrap {
          border: 1px solid #d9e2f1;
          border-radius: 10px;
          background: #ffffff;
          padding: 8px;
          overflow: auto;
        }

        .sys-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        .sys-table th,
        .sys-table td {
          border: 1px solid #d8dfec;
          padding: 8px;
          font-size: 12px;
          text-align: left;
          color: #111827;
          background: #ffffff;
        }

        .sys-table th {
          background: #ecf2fc;
          font-weight: 700;
          color: #1f2f57;
        }

        .sys-table tbody tr:nth-child(even) td {
          background: #f8fbff;
        }

        .sys-table tbody tr:hover td {
          background: #eef4ff;
        }

        .sys-empty-row {
          text-align: center;
          font-style: italic;
          background: #f6f9ff;
        }

        @media (max-width: 1200px) {
          .sys-overview-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sys-trend-grid,
          .sys-detail-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .sys-overview-grid {
            grid-template-columns: 1fr;
          }

          .sys-head {
            border-radius: 12px;
            padding: 12px;
          }

          .sys-updated {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;
