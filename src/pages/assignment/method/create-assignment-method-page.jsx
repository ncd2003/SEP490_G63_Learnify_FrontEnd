import { Link, useSearchParams } from "react-router-dom";
import { PATH_TEACHER } from "@/routes/paths";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

:root {
  --primary: #2563EB;
  --primary-dark: #1D4ED8;
  --primary-darker: #1E40AF;
  --primary-light: #EFF6FF;
  --primary-lighter: #F8FAFF;
  --primary-glow: rgba(37,99,235,0.10);
  --primary-shadow: rgba(37,99,235,0.22);
  --gradient: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
  --gradient-shine: linear-gradient(135deg, #60A5FA 0%, #3B82F6 40%, #2563EB 70%, #1D4ED8 100%);

  --bg: #F7F8FC;
  --card: #FFFFFF;
  --input-bg: #F5F7FB;
  --hover: #EDF2FF;

  --text: #1E293B;
  --text2: #475569;
  --text3: #94A3B8;
  --inv: #FFFFFF;

  --green: #10B981;
  --green-l: #ECFDF5;
  --orange: #F59E0B;
  --orange-l: #FFFBEB;
  --purple: #8B5CF6;
  --purple-l: #F5F3FF;
  --sky: #0EA5E9;
  --sky-l: #F0F9FF;

  --border: #E2E8F0;
  --border-l: #F1F5F9;

  --sh-s: 0 1px 3px rgba(30,41,59,0.04);
  --sh-m: 0 4px 14px rgba(30,41,59,0.07);
  --sh-l: 0 12px 40px rgba(30,41,59,0.11);
  --sh-xl: 0 20px 60px rgba(30,41,59,0.14);

  --r-s: 10px;
  --r-m: 12px;
  --r-l: 16px;
  --r-xl: 20px;
  --r-2xl: 24px;

  --font: 'Be Vietnam Pro', sans-serif;
  --font-d: 'Be Vietnam Pro', sans-serif;
  --ease: cubic-bezier(0.4,0,0.2,1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.page {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 24px 12px 56px;
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
}

.breadcrumb {
  font-size: 12px;
  color: var(--text3);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb span { color: var(--text2); }

.page-header {
  margin-bottom: 40px;
  position: relative;
}

.page-title {
  font-family: var(--font-d);
  font-size: 30px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 8px;
  line-height: 1.3;
}

.page-desc {
  font-size: 15px;
  color: var(--text2);
  line-height: 1.6;
  max-width: 560px;
}

.methods-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(270px, 1fr));
  gap: 16px;
  align-items: stretch;
}

.method-card {
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--r-2xl);
  padding: 26px 22px 22px;
  transition: all .3s var(--ease);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.method-card:hover {
  border-color: var(--primary);
  box-shadow: var(--sh-m);
  transform: translateY(-4px);
}

.method-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient);
  opacity: 0;
  transition: opacity .3s var(--ease);
}

.method-card:hover::before { opacity: 1; }

.method-card.featured {
  border-color: transparent;
  background: linear-gradient(var(--card), var(--card)) padding-box,
              var(--gradient-shine) border-box;
  border: 2px solid transparent;
  box-shadow: 0 4px 20px var(--primary-shadow), 0 0 0 0 transparent;
  position: relative;
}

.method-card.featured::before {
  opacity: 1;
  height: 5px;
  background: var(--gradient-shine);
}

.method-card.featured::after {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%);
  pointer-events: none;
}

.method-card.featured:hover {
  box-shadow: 0 8px 30px var(--primary-shadow), 0 0 0 4px var(--primary-glow);
  transform: translateY(-6px);
}

.featured-ribbon {
  position: absolute;
  top: 16px;
  right: -32px;
  background: var(--gradient);
  color: var(--inv);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: 5px 40px;
  transform: rotate(45deg);
  box-shadow: 0 2px 8px var(--primary-shadow);
  z-index: 2;
}

.mc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.mc-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--r-l);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .3s var(--ease);
}

.mc-icon.blue { background: var(--primary-light); color: var(--primary); }
.mc-icon.purple { background: var(--purple-l); color: var(--purple); }
.mc-icon.sky { background: var(--sky-l); color: var(--sky); }
.mc-icon.green { background: var(--green-l); color: var(--green); }

.method-card:hover .mc-icon { transform: scale(1.08); }

.mc-icon.ai-glow {
  background: linear-gradient(135deg, #DBEAFE, #EFF6FF);
  color: var(--primary);
  box-shadow: 0 0 0 6px rgba(59,130,246,0.08);
  position: relative;
}

.mc-icon.ai-glow::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: var(--r-l);
  border: 2px solid rgba(59,130,246,0.15);
  animation: iconPulse 2.5s ease infinite;
}

@keyframes iconPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .4; transform: scale(1.12); }
}

.mc-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .03em;
}

.mc-badge.auto { background: var(--primary-light); color: var(--primary); }
.mc-badge.flex { background: var(--purple-l); color: var(--purple); }
.mc-badge.fast { background: var(--green-l); color: var(--green); }

.mc-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 7px;
  line-height: 1.35;
}

.mc-desc {
  font-size: 12.5px;
  color: var(--text2);
  line-height: 1.6;
  margin-bottom: 16px;
  flex: 1;
}

.mc-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--primary-lighter);
  border-radius: var(--r-m);
  border: 1px solid rgba(37,99,235,0.06);
}

.mc-feat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text2);
}

.mc-feat-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mc-bullets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.mc-bullet {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text3);
}

.mc-bullet-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mc-bullet-dot.purple { background: var(--purple); }
.mc-bullet-dot.sky { background: var(--sky); }

.mc-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: var(--r-m);
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  transition: all .25s var(--ease);
  text-decoration: none;
}

.mc-cta.primary {
  background: var(--gradient);
  color: var(--inv);
  box-shadow: 0 3px 14px var(--primary-shadow);
}

.mc-cta.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px var(--primary-shadow);
}

.mc-cta.outline {
  background: var(--card);
  color: var(--primary);
  border: 1.5px solid var(--primary);
}

.mc-cta.outline:hover {
  background: var(--primary-light);
  box-shadow: 0 2px 10px var(--primary-glow);
}

.sparkle-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.sparkle-text {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.compare-section {
  margin-top: 56px;
}
.compare-title {
  font-family: var(--font-d);
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
  text-align: center;
}

.compare-desc {
  font-size: 13px;
  color: var(--text3);
  text-align: center;
  margin-bottom: 24px;
}

.compare-table {
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  overflow: hidden;
  box-shadow: var(--sh-s);
  border-collapse: separate;
  border-spacing: 0;
}

.compare-table thead th {
  padding: 14px 18px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: .05em;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.compare-table thead th:first-child { border-radius: var(--r-xl) 0 0 0; }
.compare-table thead th:last-child { border-radius: 0 var(--r-xl) 0 0; }
.compare-table thead th.highlight { background: var(--primary-light); color: var(--primary); }

.compare-table tbody td {
  padding: 13px 18px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text2);
  border-bottom: 1px solid var(--border-l);
  vertical-align: middle;
  text-align: center;
}

.compare-table tbody tr:last-child td { border-bottom: none; }
.compare-table tbody td:first-child { font-weight: 600; color: var(--text); text-align: center; }
.compare-table tbody td.highlight { background: var(--primary-lighter); }

.check-icon, .cross-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon { color: var(--green); }
.cross-icon { color: var(--text3); }

.bottom-cta {
  margin: 56px auto 0;
  width: 100%;
  background: linear-gradient(135deg, var(--primary-light) 0%, #DBEAFE 100%);
  border: 1px solid rgba(37,99,235,0.1);
  border-radius: var(--r-2xl);
  padding: 32px 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  overflow: hidden;
}

.bottom-cta::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
}

.bottom-cta-content { position: relative; z-index: 1; }
.bottom-cta-title {
  font-family: var(--font-d);
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--text);
}

.bottom-cta-text {
  font-size: 13px;
  color: var(--text2);
  line-height: 1.6;
}

.bottom-cta-actions {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.fade-up { animation: fadeUp .5s ease-out both; }
.fade-up-1 { animation-delay: .05s; }
.fade-up-2 { animation-delay: .12s; }
.fade-up-3 { animation-delay: .19s; }
.fade-up-4 { animation-delay: .26s; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .methods-grid {
    grid-template-columns: repeat(2, minmax(260px, 1fr));
  }

  .compare-section {
    max-width: calc(100% - 20px);
  }

  .bottom-cta {
    max-width: calc(100% - 28px);
  }
}

@media (max-width: 900px) {
  .methods-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
  .method-card.featured { order: -1; }
  .bottom-cta {
    flex-direction: column;
    text-align: center;
    padding: 28px 24px;
    max-width: 100%;
  }
  .compare-section { width: 100%; max-width: 100%; margin-left: 0; margin-right: 0; }
}

@media (max-width: 640px) {
  .page { padding: 20px 16px 60px; }
  .page-title { font-size: 24px; }
}
`;

const Ic = {
  ChevR: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Check: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Minus: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Sparkles: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z" />
    </svg>
  ),
  Brain: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M9.5 2A5.5 5.5 0 005 7.5c0 .96.246 1.863.678 2.65L5 11l1.5.5.5 1.5 1 .5-.5 1.5.5 1 1 .5v2.5a2 2 0 002 2h1" />
      <path d="M14.5 2A5.5 5.5 0 0119 7.5c0 .96-.246 1.863-.678 2.65L19 11l-1.5.5-.5 1.5-1 .5.5 1.5-.5 1-1 .5v2.5a2 2 0 01-2 2h-1" />
      <path d="M12 2v20" />
    </svg>
  ),
  PenTool: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  Upload: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  BookOpen: () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M2 5a3 3 0 013-3h6a3 3 0 013 3v14a3 3 0 00-3-3H5a3 3 0 00-3 3V5z" />
      <path d="M22 5a3 3 0 00-3-3h-6a3 3 0 00-3 3v14a3 3 0 013-3h6a3 3 0 013 3V5z" />
    </svg>
  ),
  Zap: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Target: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Sliders: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
    </svg>
  ),
  Layers: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
};

const CreateAssignmentMethodPage = () => {
  const [searchParams] = useSearchParams();
  const withQuery = (path, overrides = {}) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    const query = next.toString();
    return query ? `${path}?${query}` : path;
  };

  return (
    <div className="page">
      <style>{CSS}</style>

      <div className="breadcrumb">
        Khu vực làm việc / Ngân hàng đề / <span>Tạo bài tập</span>
      </div>

      <div className="page-header fade-up">
        <h1 className="page-title">Chọn phương thức tạo bài tập</h1>
      </div>

      <div className="methods-grid">
        <article className="method-card featured fade-up fade-up-1">
          <div className="featured-ribbon">Nổi bật</div>

          <div className="mc-header">
            <div className="mc-icon ai-glow">
              <Ic.Brain />
            </div>
            <div className="mc-badge auto">Tự động</div>
          </div>

          <div className="sparkle-row">
            <Ic.Sparkles />
            <span className="sparkle-text">Hỗ trợ bởi AI</span>
          </div>

          <div className="mc-title">Tạo bài tập với AI</div>
          <div className="mc-desc">
            AI tự động sinh câu hỏi theo chủ đề, mức độ khó và định dạng bạn
            mong muốn. Tiết kiệm đến 80% thời gian soạn đề.
          </div>

          <div className="mc-features">
            <div className="mc-feat">
              <div className="mc-feat-dot">
                <Ic.Zap />
              </div>
              Sinh câu hỏi tự động theo chủ đề
            </div>
            <div className="mc-feat">
              <div className="mc-feat-dot">
                <Ic.Target />
              </div>
              Tùy chỉnh độ khó và số lượng câu
            </div>
            <div className="mc-feat">
              <div className="mc-feat-dot">
                <Ic.Sliders />
              </div>
              Hỗ trợ Trắc nghiệm, Tự luận, Hỗn hợp
            </div>
            <div className="mc-feat">
              <div className="mc-feat-dot">
                <Ic.Layers />
              </div>
              Chỉnh sửa và bổ sung sau khi tạo
            </div>
          </div>

          <Link
            to={withQuery(PATH_TEACHER.assignmentCreateAiSetup)}
            className="mc-cta primary"
          >
            <Ic.Sparkles /> Bắt đầu với AI <Ic.ChevR />
          </Link>
        </article>

        <article className="method-card fade-up fade-up-2">
          <div className="mc-header">
            <div className="mc-icon purple">
              <Ic.PenTool />
            </div>
            <div className="mc-badge flex">Linh hoạt</div>
          </div>

          <div className="mc-title">Tạo bài tập thủ công</div>
          <div className="mc-desc">
            Tự soạn từng câu hỏi theo ý muốn. Hoàn toàn kiểm soát nội dung, đáp
            án và thang điểm. Hỗ trợ auto-save phiên đang làm.
          </div>

          <div className="mc-bullets">
            <div className="mc-bullet">
              <div className="mc-bullet-dot purple" /> Soạn từng câu hỏi chi
              tiết
            </div>
            <div className="mc-bullet">
              <div className="mc-bullet-dot purple" /> Tổ chức theo phần và
              section
            </div>
            <div className="mc-bullet">
              <div className="mc-bullet-dot purple" /> Auto-save tránh mất dữ
              liệu
            </div>
            <div className="mc-bullet">
              <div className="mc-bullet-dot purple" /> Kiểm soát hoàn toàn nội
              dung
            </div>
          </div>

          <Link
            to={withQuery(PATH_TEACHER.assignmentCreateManual)}
            className="mc-cta outline"
          >
            Tạo thủ công <Ic.ChevR />
          </Link>
        </article>

        <article className="method-card fade-up fade-up-3">
          <div className="mc-header">
            <div className="mc-icon green">
              <Ic.BookOpen />
            </div>
            <div className="mc-badge fast">Tái sử dụng</div>
          </div>

          <div className="mc-title">Tạo từ ngân hàng câu hỏi</div>
          <div className="mc-desc">
            Chọn nhanh câu hỏi có sẵn trong ngân hàng để tạo bài tập. Phù hợp
            khi bạn đã có kho câu hỏi theo môn/chủ đề và muốn ra đề ổn định.
          </div>

          <div className="mc-bullets">
            <div className="mc-bullet">
              <div className="mc-bullet-dot sky" /> Tận dụng kho câu hỏi đã có
            </div>
            <div className="mc-bullet">
              <div className="mc-bullet-dot sky" /> Lọc theo môn, chủ đề, mức độ
            </div>
            <div className="mc-bullet">
              <div className="mc-bullet-dot sky" /> Tiết kiệm thời gian nhập lại
              nội dung
            </div>
            <div className="mc-bullet">
              <div className="mc-bullet-dot sky" /> Vẫn có thể chỉnh sửa sau khi
              chọn
            </div>
          </div>

          <Link
            to={withQuery(PATH_TEACHER.assignmentCreateManual, {
              source: "question-bank",
            })}
            className="mc-cta outline"
          >
            Chọn từ ngân hàng <Ic.ChevR />
          </Link>
        </article>
      </div>

      <div className="compare-section fade-up">
        <div className="compare-title">So sánh các phương thức</div>
        <div className="compare-desc">
          Chọn phương thức phù hợp nhất với nhu cầu và thời gian của bạn.
        </div>

        <table className="compare-table">
          <thead>
            <tr>
              <th>Tính năng</th>
              <th className="highlight">Tạo với AI</th>
              <th>Tạo thủ công</th>
              <th>Từ ngân hàng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tốc độ tạo đề</td>
              <td className="highlight">
                <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                  Rất nhanh
                </span>
              </td>
              <td>Chậm</td>
              <td>Nhanh</td>
            </tr>
            <tr>
              <td>Tự động sinh câu hỏi</td>
              <td className="highlight">
                <div className="check-icon">
                  <Ic.Check />
                </div>
              </td>
              <td>
                <div className="cross-icon">
                  <Ic.X />
                </div>
              </td>
              <td>
                <div className="cross-icon">
                  <Ic.X />
                </div>
              </td>
            </tr>
            <tr>
              <td>Tùy chỉnh độ khó</td>
              <td className="highlight">
                <div className="check-icon">
                  <Ic.Check />
                </div>
              </td>
              <td>
                <div className="check-icon">
                  <Ic.Check />
                </div>
              </td>
              <td>
                <div className="check-icon">
                  <Ic.Check />
                </div>
              </td>
            </tr>
            <tr>
              <td>Chỉnh sửa sau tạo</td>
              <td className="highlight">
                <div className="check-icon">
                  <Ic.Check />
                </div>
              </td>
              <td>
                <div className="check-icon">
                  <Ic.Check />
                </div>
              </td>
              <td>
                <div className="check-icon">
                  <Ic.Check />
                </div>
              </td>
            </tr>
            <tr>
              <td>Yêu cầu ngân hàng câu hỏi</td>
              <td className="highlight">
                <div className="cross-icon">
                  <Ic.X />
                </div>
              </td>
              <td>
                <div className="cross-icon">
                  <Ic.X />
                </div>
              </td>
              <td>
                <div className="check-icon">
                  <Ic.Check />
                </div>
              </td>
            </tr>
            <tr>
              <td>Phù hợp nhất cho</td>
              <td className="highlight">
                <span
                  style={{
                    color: "var(--primary)",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Tạo đề nhanh, đa dạng
                </span>
              </td>
              <td>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  Kiểm soát chi tiết
                </span>
              </td>
              <td>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  Tái sử dụng câu hỏi chuẩn
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bottom-cta fade-up">
        <div className="bottom-cta-content">
          <div className="bottom-cta-title">
            Chưa biết chọn phương thức nào?
          </div>
          <div className="bottom-cta-text">
            Thử bắt đầu với AI, bạn luôn có thể chỉnh sửa, bổ sung hoặc chuyển
            sang phương thức khác sau.
          </div>
        </div>
        <div className="bottom-cta-actions">
          <Link
            to={PATH_TEACHER.assignmentCreateAiSetup}
            className="mc-cta primary"
            style={{ width: "auto", padding: "13px 28px" }}
          >
            <Ic.Sparkles /> Thử tạo với AI <Ic.ChevR />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentMethodPage;
