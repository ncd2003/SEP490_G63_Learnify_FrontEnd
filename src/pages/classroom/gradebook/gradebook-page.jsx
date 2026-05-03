import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { classroomApi } from "@/apis/classroom.api";
import { PATH_TEACHER } from "@/routes/paths";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#534AB7", "#185FA5", "#0F6E56", "#854F0B",
  "#993556", "#993C1D", "#0C447C", "#3B6D11",
];
const avatarColor = (id) => AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];
const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase() || "").join("");

const getGrade = (score) => {
  if (score == null) return "NA";
  if (score >= 9) return "A";
  if (score >= 7) return "B";
  if (score >= 5) return "C";
  return "D";
};
const GRADE_LABEL = { A: "Giỏi", B: "Khá", C: "Trung bình", D: "Yếu", NA: "Chưa nộp" };
const GRADE_COLOR = {
  A: { bg: "#E1F5EE", text: "#085041", bar: "#0F6E56" },
  B: { bg: "#E6F1FB", text: "#0C447C", bar: "#185FA5" },
  C: { bg: "#FAEEDA", text: "#633806", bar: "#854F0B" },
  D: { bg: "#FCEBEB", text: "#791F1F", bar: "#A32D2D" },
  NA: { bg: "#F1EFE8", text: "#5F5E5A", bar: "#B4B2A9" },
};

const toDisplayTime = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
};

const normalizeStudentRow = (item, idx) => ({
  id: item.studentId || `s-${idx}`,
  name: item.studentName || `Học sinh ${idx + 1}`,
  email: item.email || "",
  status: item.status || "NOT_STARTED",
  attempts: item.totalAttempts || 0,
  score: item.bestScore != null ? Number(item.bestScore) : null,
  lastScore: item.lastScore != null ? Number(item.lastScore) : null,
  submittedAt: item.submitTime || null,
  isLate: Boolean(item.isLate),
  answers: (item.answers || []).map((ans, aIdx) => normalizeQuestionDetail(ans, aIdx)),
});

const normalizeQuestionDetail = (item, idx) => ({
  n: idx + 1,
  id: item.assignmentQuestionId,
  type: String(item.questionType || "").toUpperCase(),
  content: item.content || "",
  maxPts: Number(item.points || 0),
  myPts: Number(item.earnedPoints || 0),
  myAnswer: item.answerContent || "",
  isCorrect: Boolean(item.isCorrect),
  gradingStatus: item.gradingStatus || "GRADED",
  teacherFeedback: item.teacherFeedback || "",
});

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');

:root {
  --primary:#2563EB;--primary-dark:#1D4ED8;--primary-light:#EFF6FF;
  --primary-shadow:rgba(37,99,235,.2);
  --gradient:linear-gradient(135deg,#3B82F6 0%,#2563EB 50%,#1D4ED8 100%);
  --green:#059669;--green-l:#ECFDF5;--green-d:#065F46;
  --red:#DC2626;--red-l:#FEF2F2;--red-d:#991B1B;
  --amber:#D97706;--amber-l:#FFFBEB;--amber-d:#92400E;
  --purple:#7C3AED;--purple-l:#F5F3FF;--purple-d:#4C1D95;
  --bg:#F8FAFC;--card:#fff;--sidebar-bg:#FAFBFE;--input-bg:#F5F7FB;
  --text:#1E293B;--text2:#475569;--text3:#94A3B8;
  --border:#E2E8F0;--border-l:#F1F5F9;
  --sh-s:0 1px 3px rgba(30,41,59,.04);--sh-m:0 4px 14px rgba(30,41,59,.07);
  --sh-l:0 12px 40px rgba(30,41,59,.12);
  --r-s:10px;--r-m:12px;--r-l:16px;--r-xl:20px;
  --font:'Be Vietnam Pro',sans-serif;--font-d:'Lora',serif;
  --ease:cubic-bezier(.4,0,.2,1);
}
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}

/* ── Page ── */
.page{min-height:100vh;background:var(--bg);font-family:var(--font);color:var(--text)}
.inner{max-width:1200px;margin:0 auto;padding:24px 28px 48px}

/* ── Top bar ── */
.top-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.breadcrumb{font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:5px;margin-bottom:8px}
.breadcrumb span{cursor:pointer;transition:color .12s}.breadcrumb span:hover{color:var(--primary)}
.class-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:var(--r-m);border:1.5px solid var(--border);background:var(--card);font-size:13px;font-weight:600;color:var(--text)}
.class-pill-dot{width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0}
.top-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--r-m);font-size:12px;font-weight:700;font-family:var(--font);cursor:pointer;border:none;transition:all .18s var(--ease);white-space:nowrap}
.btn-p{background:var(--gradient);color:#fff;box-shadow:0 2px 10px var(--primary-shadow)}
.btn-p:hover{transform:translateY(-1px)}
.btn-g{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.btn-g:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light)}

/* ── Assignment selector ── */
.asn-select-wrap{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.asn-select-label{font-size:12px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;flex-shrink:0}
.asn-select{flex:1;min-width:200px;padding:8px 28px 8px 12px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:13px;font-weight:600;font-family:var(--font);color:var(--text);background:var(--card);appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;cursor:pointer;transition:border-color .15s}
.asn-select:focus{outline:none;border-color:var(--primary)}

/* ── Metric cards ── */
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
.metric{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);padding:16px 18px;position:relative;overflow:hidden;transition:all .2s var(--ease)}
.metric:hover{box-shadow:var(--sh-m);transform:translateY(-1px)}
.metric::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:var(--r-l) var(--r-l) 0 0}
.metric:nth-child(1)::before{background:#3B82F6}
.metric:nth-child(2)::before{background:#10B981}
.metric:nth-child(3)::before{background:#F59E0B}
.metric:nth-child(4)::before{background:#8B5CF6}
.metric-label{font-size:11px;font-weight:600;color:var(--text3);margin-bottom:6px}
.metric-val{font-size:26px;font-weight:800;color:var(--text);line-height:1;margin-bottom:3px}
.metric-sub{font-size:11px;color:var(--text3)}

/* ── Charts ── */
.charts-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}
.chart-card{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);padding:16px 18px}
.chart-card-label{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px}

/* ── Toolbar ── */
.toolbar{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.srch-wrap{flex:1;min-width:200px;position:relative}
.srch-wrap svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
.srch-inp{width:100%;padding:8px 12px 8px 32px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:12px;font-family:var(--font);color:var(--text);background:var(--input-bg);outline:none;transition:all .15s}
.srch-inp:focus{border-color:var(--primary);background:var(--card);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
.fsel{padding:8px 24px 8px 10px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:12px;font-weight:600;font-family:var(--font);color:var(--text2);background:var(--card);appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;cursor:pointer;transition:border-color .15s}
.fsel:focus{outline:none;border-color:var(--primary)}

/* ── Table ── */
.tbl-wrap{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);overflow:hidden;margin-bottom:14px}
table{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed}
thead tr{background:var(--sidebar-bg);border-bottom:1.5px solid var(--border)}
th{padding:11px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .12s}
th:hover{color:var(--text2)}
td{padding:11px 12px;border-bottom:1px solid var(--border-l);color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr.hover-row{cursor:pointer;transition:background .1s}
tr.hover-row:hover{background:var(--primary-light)}
.student-cell{display:flex;align-items:center;gap:9px}
.avatar{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0}
.rank-badge{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:11px;font-weight:700}
.score-pill{display:inline-flex;align-items:center;justify-content:center;min-width:44px;padding:3px 9px;border-radius:var(--r-s);font-size:12px;font-weight:700}
.mini-bar{display:flex;align-items:center;gap:6px}
.bar-track{flex:1;height:5px;background:var(--border-l);border-radius:3px;overflow:hidden}
.bar-fill{height:100%;border-radius:3px;transition:width .5s var(--ease)}

/* ── Pagination ── */
.pagination{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--text3)}
.page-btns{display:flex;gap:4px}
.pg-btn{width:30px;height:30px;border-radius:var(--r-s);border:1.5px solid var(--border);background:var(--card);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text2);transition:all .12s;font-family:var(--font)}
.pg-btn:hover,.pg-btn.active{background:var(--primary-light);border-color:rgba(37,99,235,.25);color:var(--primary)}

/* ── State box ── */
.state-box{text-align:center;padding:56px 24px}
.state-icon{width:64px;height:64px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.state-title{font-family:var(--font-d);font-size:18px;font-weight:700;margin-bottom:6px}
.state-text{font-size:13px;color:var(--text3)}

.spinner{width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── Responsive ── */
@media(max-width:900px){.metrics{grid-template-columns:repeat(2,1fr)}.charts-row{grid-template-columns:1fr}}
@media(max-width:640px){.inner{padding:14px 14px 32px}.metrics{grid-template-columns:1fr}.toolbar{flex-direction:column;align-items:stretch}}
`;

const MODAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');

.sdm-ov {
  position: fixed; inset: 0;
  background: rgba(15,23,42,.55);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
  animation: sdm-fadein .18s ease;
}
@keyframes sdm-fadein { from { opacity:0 } to { opacity:1 } }

.sdm-box {
  font-family: 'Be Vietnam Pro', sans-serif;
  background: #fff;
  border: 1.5px solid #E2E8F0;
  border-radius: 20px;
  width: 100%;
  max-width: 780px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(15,23,42,.18);
  animation: sdm-scalein .22s cubic-bezier(.34,1.56,.64,1);
}
@keyframes sdm-scalein { from { opacity:0; transform:scale(.95) } to { opacity:1; transform:scale(1) } }

/* ── Header ── */
.sdm-hdr {
  padding: 18px 22px 16px;
  border-bottom: 1.5px solid #F1F5F9;
  display: flex; align-items: center; gap: 12px;
  background: #FAFBFE; flex-shrink: 0;
}
.sdm-back-btn {
  width: 32px; height: 32px; border-radius: 10px;
  border: 1.5px solid #E2E8F0; background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s; flex-shrink: 0; color: #64748B;
}
.sdm-back-btn:hover { border-color: #534AB7; color: #534AB7; background: #EEEDFE; }
.sdm-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0;
}
.sdm-hdr-info { flex: 1; min-width: 0; }
.sdm-hdr-name { font-size: 15px; font-weight: 700; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sdm-hdr-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; }
.sdm-close-btn {
  width: 32px; height: 32px; border-radius: 50%;
  border: 1.5px solid #E2E8F0; background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s; flex-shrink: 0; color: #94A3B8;
  margin-left: auto;
}
.sdm-close-btn:hover { background: #FEF2F2; border-color: #FCA5A5; color: #DC2626; }

/* ── Body ── */
.sdm-body { flex: 1; overflow-y: auto; padding: 18px 22px; }
.sdm-body::-webkit-scrollbar { width: 4px; }
.sdm-body::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }

/* ── Submission List ── */
.sdm-list { display: flex; flex-direction: column; gap: 8px; }
.sdm-sub-item {
  border: 1.5px solid #E2E8F0;
  border-radius: 14px; padding: 14px 16px;
  cursor: pointer; transition: all .18s; position: relative;
  display: flex; align-items: center; gap: 14px;
}
.sdm-sub-item:hover {
  border-color: #AFA9EC; background: #FAFBFE;
  transform: translateY(-1px); box-shadow: 0 4px 16px rgba(83,74,183,.1);
}
.sdm-sub-left { flex: 1; min-width: 0; }
.sdm-sub-attempt { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
.sdm-sub-time { font-size: 11px; color: #94A3B8; display: flex; align-items: center; gap: 4px; }
.sdm-sub-badges { display: flex; gap: 5px; margin-bottom: 6px; flex-wrap: wrap; }
.sdm-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px;
  border-radius: 6px; display: inline-flex; align-items: center; gap: 3px;
}
.sdm-sub-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.sdm-sub-score-wrap { text-align: right; }
.sdm-sub-score-val { font-size: 22px; font-weight: 800; line-height: 1; }
.sdm-sub-score-tot { font-size: 11px; color: #94A3B8; }
.sdm-sub-grade-pill {
  font-size: 10px; font-weight: 700; padding: 3px 8px;
  border-radius: 6px; display: block; text-align: center; margin-top: 3px;
}
.sdm-progress-ring { flex-shrink: 0; }
.sdm-chevron { color: #CBD5E1; flex-shrink: 0; }
.sdm-sub-item:hover .sdm-chevron { color: #534AB7; }

/* ── Score Hero (Detail) ── */
.sdm-score-hero {
  background: #FAFBFE; border: 1.5px solid #F1F5F9;
  border-radius: 16px; padding: 18px 20px;
  display: flex; align-items: center; gap: 18px; margin-bottom: 16px;
}
.sdm-score-ring-wrap { position: relative; flex-shrink: 0; }
.sdm-score-ring-label {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.sdm-score-ring-val { font-size: 18px; font-weight: 800; line-height: 1; }
.sdm-score-ring-denom { font-size: 10px; color: #94A3B8; }
.sdm-hero-info { flex: 1; min-width: 0; }
.sdm-hero-grade { font-size: 24px; font-weight: 800; color: #1E293B; line-height: 1; margin-bottom: 4px; }
.sdm-hero-sub { font-size: 12px; color: #94A3B8; margin-bottom: 8px; }
.sdm-hero-tags { display: flex; gap: 6px; flex-wrap: wrap; }

.sdm-stat-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 16px; }
.sdm-stat-item {
  background: #F8FAFC; border: 1.5px solid #F1F5F9;
  border-radius: 12px; padding: 10px 12px; text-align: center;
}
.sdm-stat-val { font-size: 18px; font-weight: 800; color: #1E293B; line-height: 1; margin-bottom: 3px; }
.sdm-stat-label { font-size: 10px; color: #94A3B8; font-weight: 600; }

/* ── Questions ── */
.sdm-section-title {
  font-size: 11px; font-weight: 700; color: #94A3B8;
  text-transform: uppercase; letter-spacing: .06em;
  margin: 6px 0 10px; display: flex; align-items: center; gap: 8px;
}
.sdm-section-title::before {
  content: ''; display: block; width: 3px; height: 13px;
  border-radius: 2px; background: #534AB7;
}
.sdm-q-list { display: flex; flex-direction: column; gap: 8px; }
.sdm-q-item {
  border: 1.5px solid #E2E8F0; border-radius: 14px;
  padding: 13px 15px; transition: border-color .15s;
}
.sdm-q-item:hover { border-color: #CBD5E1; }
.sdm-q-item.correct { border-left: 3px solid #0F6E56; }
.sdm-q-item.wrong   { border-left: 3px solid #A32D2D; }
.sdm-q-top { display: flex; align-items: flex-start; gap: 10px; }
.sdm-q-num {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0; margin-top: 1px;
}
.sdm-q-body { flex: 1; min-width: 0; }
.sdm-q-content { font-size: 13px; color: #1E293B; line-height: 1.6; margin-bottom: 10px; font-weight: 500; }
.sdm-q-answers { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.sdm-ans-row { display: flex; gap: 8px; align-items: flex-start; }
.sdm-ans-label { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 5px; margin-top: 2px; flex-shrink: 0; }
.sdm-ans-text { font-size: 12px; color: #1E293B; line-height: 1.55; flex: 1; padding-top: 2px; }
.sdm-q-footer { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.sdm-q-type-tag {
  font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 5px;
  background: #F1F5F9; color: #64748B; text-transform: uppercase; letter-spacing: .04em;
}
.sdm-q-pts { font-size: 12px; font-weight: 800; margin-left: auto; flex-shrink: 0; }
.sdm-q-status { font-size: 11px; color: #94A3B8; }

/* ── Footer ── */
.sdm-footer {
  padding: 14px 22px; border-top: 1.5px solid #F1F5F9;
  display: flex; justify-content: flex-end; gap: 8px;
  flex-shrink: 0; background: #FAFBFE;
}
.sdm-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 10px;
  font-size: 12px; font-weight: 700; font-family: 'Be Vietnam Pro', sans-serif;
  cursor: pointer; border: none; transition: all .18s;
}
.sdm-btn-ghost {
  background: #fff; color: #64748B;
  border: 1.5px solid #E2E8F0;
}
.sdm-btn-ghost:hover { border-color: #94A3B8; color: #1E293B; }
.sdm-btn-primary {
  background: #534AB7; color: #fff;
  box-shadow: 0 2px 10px rgba(83,74,183,.3);
}
.sdm-btn-primary:hover { background: #3C3489; transform: translateY(-1px); }

/* ── Empty / No answer ── */
.sdm-no-answer {
  font-size: 11px; color: #94A3B8; font-style: italic; padding: 5px 0;
}

/* ── Spinner ── */
.sdm-spinner {
  width: 18px; height: 18px; border: 2px solid #E2E8F0;
  border-top-color: #534AB7; border-radius: 50%;
  animation: sdm-spin .7s linear infinite; flex-shrink: 0;
}
@keyframes sdm-spin { to { transform: rotate(360deg) } }
`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconArrowLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconBarChart = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconClose2 = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Ic = {
  Search: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Users: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  Check: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Award: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  BarChart: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  File: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  X: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ChevronRight: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Clock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

// ─── Progress Ring (SVG) ──────────────────────────────────────────────────────
const ProgressRing = ({ score, total, color, size = 72 }) => {
  const pct = total > 0 ? Math.min(score / total, 1) : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} className="sdm-progress-ring" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="5" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray .5s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
};

// ─── Submission List View ─────────────────────────────────────────────────────
const SubmissionListView = ({ submissions, onSelect, totalScore }) => {
  if (submissions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B", marginBottom: 4 }}>Chưa có lượt nộp bài</div>
        <div style={{ fontSize: 12 }}>Học sinh chưa nộp bài tập này.</div>
      </div>
    );
  }

  return (
    <div className="sdm-list">
      {submissions.map((sub, idx) => {
        const score = sub.totalEarnedScore ?? 0;
        const total = sub.totalScore ?? totalScore ?? 10;
        const g = getGrade(score);
        const gc = GRADE_COLOR[g];
        const isBest = sub.submissionId === [...submissions].reduce((best, s) =>
              (s.totalEarnedScore ?? 0) > (best.totalEarnedScore ?? 0) ? s : best
            ).submissionId;

        return (
          <div key={sub.submissionId} className="sdm-sub-item" onClick={() => onSelect(sub.submissionId)}>
            {/* Progress Ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ProgressRing score={score} total={total} color={gc.bar} size={60} />
              <div style={{
                position: "absolute", inset: 0, display: "flex",
                flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: gc.bar, lineHeight: 1 }}>
                  {score.toFixed(1)}
                </span>
                <span style={{ fontSize: 9, color: "#94A3B8" }}>/{total}</span>
              </div>
            </div>

            {/* Info */}
            <div className="sdm-sub-left">
              <div className="sdm-sub-badges">
                {isBest && (
                  <span className="sdm-badge" style={{ background: "#E1F5EE", color: "#085041" }}>
                    🏆 Cao nhất
                  </span>
                )}
                {sub.late && (
                  <span className="sdm-badge" style={{ background: "#FCEBEB", color: "#791F1F" }}>
                    ⏰ Nộp trễ
                  </span>
                )}
                <span className="sdm-badge" style={{ background: "#EEEDFE", color: "#3C3489" }}>
                  Lần {sub.attemptNumber || idx + 1}
                </span>
              </div>
              <div className="sdm-sub-time">
                <IconClock />
                {toDisplayTime(sub.submitTime)}
              </div>
            </div>

            {/* Grade pill */}
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <span style={{
                display: "inline-block", fontSize: 11, fontWeight: 700,
                padding: "4px 10px", borderRadius: 8,
                background: gc.bg, color: gc.text,
              }}>
                {GRADE_LABEL[g]}
              </span>
            </div>

            <div className="sdm-chevron"><IconChevronRight /></div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Submission Detail View ───────────────────────────────────────────────────
const SubmissionDetailView = ({ submission }) => {
  if (!submission) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8" }}>
        <div className="sdm-spinner" style={{ margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13 }}>Đang tải chi tiết bài làm...</div>
      </div>
    );
  }

  const score = submission.totalEarnedScore ?? 0;
  const total = submission.totalScore ?? 10;
  const g = getGrade(score);
  const gc = GRADE_COLOR[g];
  const answers = submission.answers || [];

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.filter((a) => !a.isCorrect).length;

  return (
    <>
      {/* Score Hero */}
      <div className="sdm-score-hero">
        <div className="sdm-score-ring-wrap">
          <ProgressRing score={score} total={total} color={gc.bar} size={80} />
          <div className="sdm-score-ring-label">
            <span className="sdm-score-ring-val" style={{ color: gc.bar }}>{score.toFixed(1)}</span>
            <span className="sdm-score-ring-denom">/{total}</span>
          </div>
        </div>
        <div className="sdm-hero-info">
          <div className="sdm-hero-grade">{score.toFixed(1)} / {total} điểm</div>
          <div className="sdm-hero-sub">
            <IconClock /> Hoàn thành lúc {toDisplayTime(submission.submitTime)}
          </div>
          <div className="sdm-hero-tags">
            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: gc.bg, color: gc.text }}>
              {GRADE_LABEL[g]}
            </span>
            {submission.late && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: "#FCEBEB", color: "#791F1F" }}>
                Nộp trễ
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="sdm-stat-row">
        <div className="sdm-stat-item">
          <div className="sdm-stat-val" style={{ color: "#0F6E56" }}>{correctCount}</div>
          <div className="sdm-stat-label">Câu đúng</div>
        </div>
        <div className="sdm-stat-item">
          <div className="sdm-stat-val" style={{ color: "#A32D2D" }}>{wrongCount}</div>
          <div className="sdm-stat-label">Câu sai</div>
        </div>
        <div className="sdm-stat-item">
          <div className="sdm-stat-val">{answers.length}</div>
          <div className="sdm-stat-label">Tổng câu hỏi</div>
        </div>
      </div>

      {/* Questions */}
      <div className="sdm-section-title">Chi tiết từng câu</div>
      <div className="sdm-q-list">
        {answers.map((ans, idx) => {
          const isCorrect = ans.isCorrect === true || String(ans.isCorrect).toLowerCase() === "true";

          const pts = ans.earnedPoints ?? 0;
          const maxPts = ans.maxPoints ?? ans.points ?? 0;
          const qType = String(ans.questionType || "").replace("_", " ");

          const numStyle = isCorrect
            ? { background: "#E1F5EE", color: "#085041" }
            : { background: "#FCEBEB", color: "#791F1F" };

          const ptsColor = isCorrect ? "#0F6E56" : "#A32D2D";

          let parsedOptions = [];
          try {
            parsedOptions = typeof ans.allOptions === "string" ? JSON.parse(ans.allOptions) : (ans.allOptions || []);
          } catch (e) {}

          let studentAnswer = (ans.answerContent || ans.studentAnswer || ans.studentAnswerContent || "").trim();
          let correctAnswer = (ans.sampleAnswer || ans.correctAnswer || ans.correctAnswerContent || ans.rightAnswer || "").trim();

          // Resolve display content for MC/TF questions where student answer is an ID
          if (["MULTIPLE_CHOICE", "TRUE_FALSE"].includes(ans.questionType)) {
            const chosenOpt = parsedOptions.find(o => String(o.id) === studentAnswer);
            if (chosenOpt) studentAnswer = chosenOpt.content;
            else if (studentAnswer.toLowerCase() === "true") studentAnswer = "Đúng";
            else if (studentAnswer.toLowerCase() === "false") studentAnswer = "Sai";
          }

          // If correctAnswer is empty, try to find it in allOptions
          if (!correctAnswer) {
            const correctOpt = parsedOptions.find(o => o.isCorrect === true || String(o.isCorrect).toLowerCase() === "true");
            if (correctOpt) correctAnswer = correctOpt.content;
          }

          return (
            <div
              key={ans.studentAnswerId || ans.assignmentQuestionId || idx}
              className={`sdm-q-item ${isCorrect ? "correct" : "wrong"}`}
            >
              <div className="sdm-q-top">
                {/* Number badge */}
                <div className="sdm-q-num" style={numStyle}>
                  {isCorrect ? <IconCheck /> : <IconClose2 />}
                </div>

                <div className="sdm-q-body">
                  {/* Question content */}
                  <div className="sdm-q-content">
                    {idx + 1}. {ans.questionContent || ans.content || `Câu ${idx + 1}`}
                  </div>

                  {/* Answers */}
                  <div className="sdm-q-answers">
                    {/* Student answer */}
                    <div className="sdm-ans-row">
                      <span
                        className="sdm-ans-label"
                        style={
                          isCorrect
                            ? { background: "#E1F5EE", color: "#085041" }
                            : { background: "#FCEBEB", color: "#791F1F" }
                        }
                      >
                        Học sinh
                      </span>
                      {studentAnswer ? (
                        <span className="sdm-ans-text">{studentAnswer}</span>
                      ) : (
                        <span className="sdm-no-answer">Không trả lời</span>
                      )}
                    </div>

                    {/* Correct answer — only show when student answered wrong or partially wrong */}
                    {(!isCorrect || qType.includes("essay")) && correctAnswer && (
                      <div className="sdm-ans-row">
                        <span
                          className="sdm-ans-label"
                          style={{ background: "#E1F5EE", color: "#085041" }}
                        >
                          {qType.includes("essay") ? "Gợi ý" : "Đáp án"}
                        </span>
                        <span className="sdm-ans-text">{correctAnswer}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="sdm-q-footer">
                    <span className="sdm-q-type-tag">{qType || "multiple choice"}</span>
                    <span className="sdm-q-status" style={{ color: isCorrect ? "#0F6E56" : "#A32D2D", fontWeight: 600 }}>
                      {isCorrect ? "Đúng" : "Sai"}
                    </span>
                    <span className="sdm-q-pts" style={{ color: ptsColor }}>
                      {pts}/{maxPts}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ─── Student Detail Modal ─────────────────────────────────────────────────────
const StudentDetailModal = ({ modal, onClose, onSelectSubmission, onBackToList, loadingDetail }) => {
  const navigate = useNavigate();
  if (!modal) return null;

  const { view, student, submissions = [], selectedSubmission, totalScore } = modal;
  const isListView = view === "LIST";


  return (
    <>
      <style>{MODAL_CSS}</style>
      <div className="sdm-ov" onClick={onClose}>
        <div className="sdm-box" onClick={(e) => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="sdm-hdr">
            {!isListView && (
              <button className="sdm-back-btn" onClick={onBackToList}>
                <IconArrowLeft />
              </button>
            )}
            <div
              className="sdm-avatar"
              style={{ background: avatarColor(student?.id || 0) }}
            >
              {getInitials(student?.name)}
            </div>
            <div className="sdm-hdr-info">
              <div className="sdm-hdr-name">{student?.name || "Học sinh"}</div>
              <div className="sdm-hdr-sub">
                {isListView
                  ? `Lịch sử nộp bài · ${submissions.length} lần`
                  : `Lần ${selectedSubmission?.attemptNumber ?? "?"} · ${student?.name}`}
              </div>
            </div>
            <button className="sdm-close-btn" onClick={onClose}>
              <IconX />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="sdm-body">
            {loadingDetail ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 24px", gap: 14 }}>
                <div className="sdm-spinner" />
                <span style={{ fontSize: 13, color: "#94A3B8" }}>Đang tải dữ liệu...</span>
              </div>
            ) : isListView ? (
              <SubmissionListView
                submissions={submissions}
                onSelect={onSelectSubmission}
                totalScore={totalScore}
              />
            ) : (
              <SubmissionDetailView submission={selectedSubmission} />
            )}
          </div>

          {/* ── Footer ── */}
          <div className="sdm-footer">
            <button className="sdm-btn sdm-btn-ghost" onClick={isListView ? onClose : onBackToList}>
              {isListView ? "Đóng" : "← Quay lại"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

const PAGE_SIZE = 10;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GradebookPage() {
  const navigate = useNavigate();
  const { id: classId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAsnId = searchParams.get("assignmentId") || "";

  const [classInfo, setClassInfo] = useState(null);
  const [assignments, setAssignments] = useState([]); // list for dropdown
  const [students, setStudents] = useState([]); // rows for selected asn
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sort, setSort] = useState("rank");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // {student + questions}

  // ── Fetch class + assignment list ──
  useEffect(() => {
    if (!classId) return;
    let alive = true;
    Promise.all([
      classroomApi.getClassroomById(classId).catch(() => null),
      assignmentApi.getAssignmentsForClassroom(classId).catch(() => ({ result: [] })),
    ]).then(([clsRes, asnRes]) => {
      if (!alive) return;
      setClassInfo(clsRes?.result || null);
      const list = Array.isArray(asnRes?.result?.content)
        ? asnRes.result.content
        : Array.isArray(asnRes?.result)
          ? asnRes.result
          : [];
      setAssignments(list);
      if (!selectedAsnId && list.length) {
        setSearchParams({ assignmentId: String(list[0].id) });
      }
    });
    return () => {
      alive = false;
    };
  }, [classId, selectedAsnId, setSearchParams]);

  // ── Fetch gradebook for selected assignment ──
  useEffect(() => {
    if (!selectedAsnId) return;
    let alive = true;
    setLoading(true);
    setError("");
    assignmentApi
      .getGradebook(selectedAsnId, classId)
      .then((res) => {
        if (!alive) return;
        const data = res?.result || {};
        const rows = Array.isArray(data.students) ? data.students : [];
        setStudents(rows.map(normalizeStudentRow));
        setSummary(data.summary || null);
        setPage(1);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.message || "Không thể tải bảng điểm.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedAsnId, classId]);

  // ── Derived ──
  const selectedAsn = useMemo(
    () => assignments.find((a) => String(a.id) === String(selectedAsnId)) || null,
    [assignments, selectedAsnId],
  );

  // ── Open detail (fetch attempts) ──
  const openDetail = async (row) => {
    if (!selectedAsnId || !classId) return;
    setLoadingDetail(true);
    try {
      const res = await assignmentApi.getStudentSubmissions(selectedAsnId, row.id, classId);
      const list = res?.result || [];
      setModal({
        view: "LIST",
        student: row,
        submissions: list,
        totalScore: selectedAsn?.totalScore || 10,
      });
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const selectSubmission = async (submissionId) => {
    setLoadingDetail(true);
    try {
      const res = await assignmentApi.getSubmissionForGrading(submissionId);
      setModal((prev) => ({
        ...prev,
        view: "DETAIL",
        selectedSubmission: res?.result || null,
      }));
    } catch (err) {
      console.error("Failed to fetch submission detail", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const backToList = () => {
    setModal((prev) => ({
      ...prev,
      view: "LIST",
      selectedSubmission: null,
    }));
  };



  const filtered = useMemo(() => {
    let list = [...students];
    if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    if (gradeFilter) list = list.filter((s) => getGrade(s.score) === gradeFilter);
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "vi");
      if (sort === "score-desc") return (b.score ?? -1) - (a.score ?? -1);
      if (sort === "score-asc") return (a.score ?? 999) - (b.score ?? 999);
      if (sort === "time") return (a.submittedAt || "zzz").localeCompare(b.submittedAt || "zzz");
      return (a.rank ?? 9999) - (b.rank ?? 9999);
    });
    return list;
  }, [students, search, gradeFilter, sort]);

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

  const metrics = useMemo(() => {
    if (summary) {
      return {
        avg: summary.avgScore || 0,
        submitted: summary.submittedCount || 0,
        notSubmitted: summary.notSubmittedCount || 0,
        total: summary.totalStudents || 0,
        maxVal: summary.highestScore || 0,
        minVal: summary.lowestScore || 0,
        passed: 0,
      };
    }
    const submitted = students.filter((s) => s.score != null);
    const avg = submitted.length
      ? submitted.reduce((a, s) => a + s.score, 0) / submitted.length
      : 0;
    const maxVal = submitted.length
      ? submitted.reduce((a, s) => (s.score > a ? s.score : a), 0)
      : 0;
    const minVal = submitted.length
      ? submitted.reduce((a, s) => (s.score < a ? s.score : a), 10)
      : 0;
    const passed = submitted.filter((s) => s.score >= 5).length;
    return { avg, submitted: submitted.length, notSubmitted: students.length - submitted.length, total: students.length, maxVal, minVal, passed };
  }, [students, summary]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ClassroomDetailLayout activeMenuKeyOverride="grades">
      <div className="page">
        <style>{CSS}</style>

        <div className="inner">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span onClick={() => navigate("/classrooms")}>Lớp học</span>
            <span style={{ opacity: 0.5 }}>›</span>
            <span style={{ color: "var(--text2)" }}>Bảng điểm</span>
          </div>

          {/* Top bar */}
          <div className="top-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className="btn btn-g" onClick={() => navigate(-1)}>
                <Ic.ArrowLeft width={13} height={13} /> Quay lại
              </button>
              <div className="class-pill">
                <div className="class-pill-dot" />
                <span>{classInfo?.name || `Lớp ${classId}`}</span>
                {classInfo?.subject && (
                  <>
                    <span style={{ color: "var(--text3)" }}>—</span>
                    <span style={{ color: "var(--text3)", fontWeight: 400 }}>{classInfo.subject}</span>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Assignment selector */}
          <div className="asn-select-wrap">
            <span className="asn-select-label">Bài tập</span>
            <select
              className="asn-select"
              value={selectedAsnId}
              onChange={(e) => {
                setSearchParams({ assignmentId: e.target.value });
                setPage(1);
              }}
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title || a.assignmentTitle || `Bài tập #${a.id}`}
                </option>
              ))}
            </select>
            {selectedAsn && (
              <span style={{ fontSize: 12, color: "var(--text3)", flexShrink: 0 }}>
                {[
                  selectedAsn.questionCount && `${selectedAsn.questionCount} câu`,
                  selectedAsn.totalScore && `${selectedAsn.totalScore} điểm`,
                  selectedAsn.setting?.durationMinutes &&
                  `${selectedAsn.setting.durationMinutes} phút`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>

          {/* Metrics */}
          <div className="metrics">
            {[
              {
                label: "Điểm trung bình",
                val: metrics.avg.toFixed(1),
                sub: "/ 10 điểm",
                Icon: Ic.BarChart,
                iconBg: "#EFF6FF",
                iconColor: "#2563EB",
              },
              {
                label: "Đã nộp",
                val: metrics.submitted,
                sub: `/ ${metrics.total} học sinh`,
                Icon: Ic.Users,
                iconBg: "#ECFDF5",
                iconColor: "#059669",
              },
              {
                label: "Điểm cao nhất",
                val: metrics.maxVal?.toFixed(1) ?? "—",
                sub: "Của lớp",
                Icon: Ic.Award,
                iconBg: "#FFFBEB",
                iconColor: "#D97706",
              },
              {
                label: "Điểm thấp nhất",
                val: metrics.minVal?.toFixed(1) ?? "—",
                sub: "Của lớp",
                Icon: Ic.Award,
                iconBg: "#FCEBEB",
                iconColor: "#DC2626",
              },
            ].map(({ label, val, sub }) => (
              <div key={label} className="metric">
                <div className="metric-label">{label}</div>
                <div className="metric-val">{val}</div>
                <div className="metric-sub">{sub}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="srch-wrap">
              <Ic.Search width={13} height={13} />
              <input
                className="srch-inp"
                placeholder="Tìm học sinh..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              className="fsel"
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả xếp loại</option>
              <option value="A">Giỏi (9–10)</option>
              <option value="B">Khá (7–8.9)</option>
              <option value="C">Trung bình (5–6.9)</option>
              <option value="D">Yếu (&lt;5)</option>
              <option value="NA">Chưa nộp</option>
            </select>
            <select className="fsel" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="rank">Thứ hạng</option>
              <option value="name">Tên A→Z</option>
              <option value="score-desc">Điểm cao→thấp</option>
              <option value="score-asc">Điểm thấp→cao</option>
              <option value="time">Thời gian nộp</option>
            </select>
            <span style={{ fontSize: 12, color: "var(--text3)", flexShrink: 0 }}>
              {filtered.length} học sinh
            </span>
          </div>

          {/* Table */}
          {loading ? (
            <div className="state-box">
              <div className="state-icon">
                <Ic.File width={26} height={26} />
              </div>
              <div className="state-title">Đang tải bảng điểm...</div>
            </div>
          ) : error ? (
            <div className="state-box">
              <div className="state-title" style={{ color: "var(--red)" }}>
                {error}
              </div>
            </div>
          ) : (
            <>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th style={{ width: 180 }}>Học sinh</th>
                      <th style={{ width: 100, textAlign: "center" }}>Trạng thái</th>
                      <th style={{ width: 70, textAlign: "center" }}>Số lần</th>
                      <th style={{ width: 100, textAlign: "center" }}>Điểm cao nhất</th>
                      <th style={{ width: 100, textAlign: "center" }}>Lần gần nhất</th>
                      <th style={{ width: 130 }}>Nộp lúc</th>
                      <th style={{ width: 80, textAlign: "center" }}>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDetail && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "12px", background: "var(--primary-light)" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>
                            <div className="spinner" /> Đang tải lịch sử làm bài...
                          </div>
                        </td>
                      </tr>
                    )}

                    {pageData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          style={{
                            textAlign: "center",
                            padding: "32px",
                            color: "var(--text3)",
                            fontSize: 13,
                          }}
                        >
                          Không có học sinh phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      pageData.map((st, idx) => {
                        const g = getGrade(st.score);
                        const gs = GRADE_COLOR[g];
                        const statusMap = {
                          NOT_STARTED: { label: "Chưa làm", cls: "NA" },
                          DOING: { label: "Đang làm", cls: "C" },
                          SUBMITTED: { label: "Chờ chấm", cls: "B" },
                          GRADED: { label: "Đã chấm", cls: "A" },
                          ABANDONED: { label: "Bỏ thi", cls: "D" },
                        };
                        const sInfo = statusMap[st.status] || { label: st.status, cls: "NA" };

                        return (
                          <tr key={st.id} className="hover-row" onClick={() => openDetail(st)}>
                            <td style={{ textAlign: "center" }}>{idx + 1 + (page - 1) * PAGE_SIZE}</td>
                            <td>
                              <div className="student-cell">
                                <div className="avatar" style={{ background: avatarColor(st.id) }}>
                                  {getInitials(st.name)}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontSize: 13, fontWeight: 600 }}>{st.name}</span>
                                  <span style={{ fontSize: 10, color: "var(--text3)" }}>{st.email}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="score-pill" style={{ background: GRADE_COLOR[sInfo.cls]?.bg, color: GRADE_COLOR[sInfo.cls]?.text, fontSize: 10 }}>
                                {sInfo.label}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", fontSize: 12, color: "var(--text2)" }}>
                              {st.attempts}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="score-pill" style={{ background: gs.bg, color: gs.text }}>
                                {st.score?.toFixed(1) ?? "—"}
                              </span>
                            </td>
                            <td style={{ textAlign: "center", fontSize: 12, color: "var(--text2)" }}>
                              {st.lastScore?.toFixed(1) ?? "—"}
                            </td>
                            <td style={{ fontSize: 12, color: "var(--text3)" }}>
                              {toDisplayTime(st.submittedAt) || "—"}
                              {st.isLate && (
                                <span style={{ color: "var(--red)", marginLeft: 5, fontWeight: 700 }}>
                                  (Trễ)
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn btn-g"
                                style={{ padding: "4px 12px", fontSize: 11 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(st);
                                }}
                              >
                                Xem
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination">
                <span>
                  Trang {page}/{totalPages} — {filtered.length} học sinh
                </span>
                <div className="page-btns">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`pg-btn${p === page ? " active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Detail modal */}
      {modal && (
        <StudentDetailModal
          modal={modal}
          onClose={() => setModal(null)}
          onSelectSubmission={selectSubmission}
          onBackToList={backToList}
          loadingDetail={loadingDetail}
        />
      )}
    </ClassroomDetailLayout>
  );
}
