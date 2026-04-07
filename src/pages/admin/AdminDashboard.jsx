import { Activity, AlertTriangle, ShieldCheck, Users, UserCheck, BookOpen } from "lucide-react";

const metricCards = [
  {
    title: "Tổng người dùng",
    value: "12,480",
    delta: "+6.2% so với tháng trước",
    icon: Users,
  },
  {
    title: "Tài khoản hoạt động",
    value: "11,902",
    delta: "95.3% đang hoạt động",
    icon: UserCheck,
  },
  {
    title: "Tài khoản bị khóa",
    value: "128",
    delta: "Cần theo dõi hành vi bất thường",
    icon: ShieldCheck,
  },
  {
    title: "Cảnh báo hệ thống",
    value: "07",
    delta: "2 cảnh báo mức cao",
    icon: AlertTriangle,
  },
];

const recentActions = [
  { actor: "Nguyen Van A", action: "Khóa tài khoản", target: "student01@gmail.com", time: "2 phút trước" },
  { actor: "Tran Thi B", action: "Mở khóa tài khoản", target: "teacher.alpha@gmail.com", time: "15 phút trước" },
  { actor: "Le Van C", action: "Cập nhật vai trò", target: "user.demo@gmail.com", time: "30 phút trước" },
  { actor: "System", action: "Đồng bộ báo cáo", target: "Kỳ 03/2026", time: "1 giờ trước" },
];

const topClasses = [
  { name: "Toán 10A", users: 58, status: "Ổn định" },
  { name: "IELTS Foundation", users: 53, status: "Tăng nhanh" },
  { name: "Vật lý 12", users: 49, status: "Ổn định" },
  { name: "Ngữ văn 11", users: 45, status: "Cần kiểm tra" },
];

const AdminDashboardPage = () => {
  return (
    <div className="admin-dashboard-page">
      <div className="hero-panel">
        <div>
          <p className="hero-badge">Admin Dashboard</p>
          <h1>Trung tâm giám sát hệ thống Learnify</h1>
          <p className="hero-subtitle">
            Theo dõi người dùng, trạng thái tài khoản, và tín hiệu vận hành trong thời gian gần thực.
          </p>
        </div>
        <div className="hero-pulse">
          <Activity size={18} />
          <span>Realtime Monitoring</span>
        </div>
      </div>

      <section className="metrics-grid">
        {metricCards.map((item) => (
          <article key={item.title} className="metric-card">
            <div className="metric-head">
              <p>{item.title}</p>
              <item.icon size={18} />
            </div>
            <h3>{item.value}</h3>
            <span>{item.delta}</span>
          </article>
        ))}
      </section>

      <section className="dashboard-panels">
        <article className="panel">
          <header>
            <h2>Hoạt động gần đây</h2>
            <span>4 bản ghi mới nhất</span>
          </header>
          <div className="timeline">
            {recentActions.map((item, idx) => (
              <div className="timeline-row" key={`${item.actor}-${idx}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <p>
                    <strong>{item.actor}</strong> - {item.action}
                  </p>
                  <span>{item.target}</span>
                </div>
                <time>{item.time}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <header>
            <h2>Lớp học nổi bật</h2>
            <span>Dựa trên số lượng thành viên</span>
          </header>
          <div className="class-table">
            {topClasses.map((item) => (
              <div key={item.name} className="class-row">
                <div className="class-main">
                  <BookOpen size={16} />
                  <p>{item.name}</p>
                </div>
                <span>{item.users} học viên</span>
                <strong>{item.status}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <style>{`
        .admin-dashboard-page {
          display: grid;
          gap: 20px;
          color: #0f172a;
        }

        .hero-panel {
          background: linear-gradient(135deg, #0f766e 0%, #1d4ed8 55%, #111827 100%);
          color: #f8fafc;
          border-radius: 18px;
          padding: 22px;
          display: flex;
          gap: 18px;
          justify-content: space-between;
          align-items: flex-start;
          box-shadow: 0 18px 30px rgba(15, 23, 42, 0.18);
        }

        .hero-badge {
          display: inline-block;
          font-size: 12px;
          letter-spacing: 0.5px;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid rgba(240, 253, 250, 0.6);
          margin: 0 0 10px;
        }

        .hero-panel h1 {
          margin: 0;
          font-size: clamp(22px, 3vw, 32px);
          line-height: 1.15;
          max-width: 640px;
        }

        .hero-subtitle {
          margin-top: 10px;
          color: #dbeafe;
          max-width: 620px;
          font-size: 14px;
        }

        .hero-pulse {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          background: rgba(248, 250, 252, 0.12);
          border: 1px solid rgba(226, 232, 240, 0.45);
          padding: 8px 12px;
          border-radius: 999px;
          white-space: nowrap;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .metric-card {
          border: 1px solid #dbe4ef;
          border-radius: 14px;
          padding: 16px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .metric-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #475569;
          font-size: 13px;
        }

        .metric-card h3 {
          margin: 10px 0 6px;
          font-size: 30px;
          line-height: 1;
          color: #0f172a;
        }

        .metric-card span {
          color: #64748b;
          font-size: 12px;
        }

        .dashboard-panels {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 14px;
        }

        .panel {
          border: 1px solid #dbe4ef;
          border-radius: 14px;
          background: #fff;
          padding: 16px;
        }

        .panel header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 12px;
          border-bottom: 1px dashed #dbe4ef;
          padding-bottom: 10px;
        }

        .panel h2 {
          margin: 0;
          font-size: 17px;
        }

        .panel header span {
          font-size: 12px;
          color: #64748b;
        }

        .timeline {
          display: grid;
          gap: 12px;
        }

        .timeline-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 10px;
          align-items: center;
          border: 1px solid #eef2f7;
          border-radius: 12px;
          padding: 10px;
        }

        .timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #0ea5e9;
          box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.15);
        }

        .timeline-content p {
          margin: 0;
          font-size: 13px;
        }

        .timeline-content span {
          font-size: 12px;
          color: #64748b;
        }

        .timeline-row time {
          font-size: 11px;
          color: #64748b;
        }

        .class-table {
          display: grid;
          gap: 8px;
        }

        .class-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 10px;
          align-items: center;
          border: 1px solid #edf2f7;
          border-radius: 10px;
          padding: 10px;
          font-size: 13px;
        }

        .class-main {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .class-main p {
          margin: 0;
          font-weight: 600;
        }

        .class-row span {
          color: #475569;
          font-size: 12px;
        }

        .class-row strong {
          font-size: 12px;
          color: #0f766e;
        }

        @media (max-width: 1080px) {
          .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dashboard-panels {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .hero-panel {
            flex-direction: column;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;
