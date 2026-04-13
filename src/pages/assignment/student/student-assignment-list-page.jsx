import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import { classroomApi } from "@/apis/classroom.api";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_STUDENT } from "@/routes/paths";

const toDisplayDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getUrgency = (deadline, status) => {
  if (status === "SUBMITTED" || status === "GRADED") return "done";
  if (!deadline) return "normal";

  const diff = new Date(deadline).getTime() - Date.now();
  if (!Number.isFinite(diff)) return "normal";
  if (diff <= 0) return "late";
  if (diff < 24 * 60 * 60 * 1000) return "urgent";
  if (diff < 3 * 24 * 60 * 60 * 1000) return "soon";
  return "normal";
};

const getTimeLeftLabel = (deadline, urgency) => {
  if (urgency === "late") return "Đã quá hạn";
  if (urgency === "done") return "Đã nộp";
  if (!deadline) return "Không giới hạn";

  const diff = new Date(deadline).getTime() - Date.now();
  if (!Number.isFinite(diff)) return "Không giới hạn";

  const hours = Math.max(0, Math.ceil(diff / (60 * 60 * 1000)));
  const days = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));

  if (hours < 24) return `Còn ${hours} giờ`;
  return `Còn ${days} ngày`;
};

const normalizeFormat = (format) => {
  const normalized = String(format || "").toUpperCase();
  if (normalized === "MULTIPLE_CHOICE" || normalized === "MC") return "mc";
  if (normalized === "ESSAY") return "essay";
  return "mixed";
};

const normalizeCategory = (category) =>
  String(category || "").toUpperCase() === "TEST" ? "exam" : "homework";

const normalizeMyStatus = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "SUBMITTED" || normalized === "GRADED") return "done";
  if (normalized === "LATE" || normalized === "MISSED") return "late";
  return "pending";
};

const toUiAssignment = (item) => {
  const deadline = item?.effectiveDeadline ?? item?.deadline ?? null;
  const myStatus = normalizeMyStatus(
    item?.status ?? item?.mySubmissionStatus ?? item?.submissionStatus,
  );
  const urgency = getUrgency(
    deadline,
    myStatus === "done" ? "SUBMITTED" : myStatus.toUpperCase(),
  );

  return {
    id: Number(item?.assignmentId ?? item?.id ?? item?.classroomAssignmentId),
    submissionId:
      Number(
        item?.submissionId ??
          item?.mySubmissionId ??
          item?.latestSubmissionId ??
          item?.submission?.id ??
          item?.latestSubmission?.id,
      ) || null,
    title: String(
      item?.title ||
        item?.assignmentTitle ||
        `Bài tập #${item?.assignmentId ?? item?.id ?? ""}`,
    ),
    subject: String(item?.subject || item?.subjectName || ""),
    category: normalizeCategory(item?.category || "HOMEWORK"),
    format: normalizeFormat(item?.format),
    totalScore: Number(item?.totalPoints ?? item?.totalScore ?? 10),
    questions: Number(item?.numberOfQuestions ?? item?.questionCount ?? 0),
    duration: item?.effectiveDuration ?? item?.setting?.durationMinutes ?? null,
    start:
      item?.effectiveStartTime ??
      item?.setting?.startTime ??
      item?.startTime ??
      null,
    deadline,
    description: String(item?.description || ""),
    myStatus,
    requirePassword: Boolean(
      item?.requirePassword ??
      item?.requiresPassword ??
      item?.passwordRequired ??
      item?.hasPassword ??
      item?.setting?.requirePassword ??
      item?.setting?.hasPassword,
    ),
    myScore:
      item?.highestScore != null
        ? Number(item.highestScore)
        : item?.myScore != null
          ? Number(item.myScore)
          : null,
    urgency,
    timeLabel: getTimeLeftLabel(deadline, urgency),
  };
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');

:root {
  --primary:#2563EB;--primary-light:#EFF6FF;--primary-dark:#1D4ED8;
  --primary-shadow:rgba(37,99,235,.22);
  --gradient:linear-gradient(135deg,#3B82F6 0%,#2563EB 50%,#1D4ED8 100%);
  --green:#059669;--green-l:#ECFDF5;
  --amber:#D97706;--amber-l:#FFFBEB;
  --red:#DC2626;--red-l:#FEF2F2;
  --purple:#7C3AED;--purple-l:#F5F3FF;
  --bg:#F8FAFC;--card:#fff;--input-bg:#F5F7FB;
  --hover:#EDF2FF;--text:#1E293B;--text2:#475569;--text3:#94A3B8;
  --border:#E2E8F0;--border-l:#F1F5F9;
  --sh-l:0 12px 40px rgba(30,41,59,.11);
  --r-s:10px;--r-m:12px;--r-l:16px;--r-xl:20px;
  --font:'Be Vietnam Pro',sans-serif;--font-d:'Lora',serif;
  --ease:cubic-bezier(0.4,0,0.2,1);
}
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
.page{min-height:100vh;background:var(--bg);font-family:var(--font);color:var(--text)}
.class-hero{background:var(--card);border-bottom:1.5px solid var(--border);padding:20px 24px 0;position:sticky;top:0;z-index:10}
.class-hero-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
.class-avatar{width:48px;height:48px;border-radius:12px;background:var(--gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;flex-shrink:0;letter-spacing:-.02em}
.class-info{flex:1;margin-left:12px}
.class-name{font-family:var(--font-d);font-size:20px;font-weight:700;color:var(--text);line-height:1.25}
.class-sub{font-size:12px;color:var(--text3);margin-top:3px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dot{width:3px;height:3px;border-radius:50%;background:var(--text3)}
.class-tabs{display:flex;gap:0}
.ctab{padding:10px 18px;font-size:12px;font-weight:600;font-family:var(--font);color:var(--text3);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s var(--ease)}
.ctab.active{color:var(--primary);border-bottom-color:var(--primary)}
.ctab:hover:not(.active){color:var(--text2)}
.header-btn{display:flex;align-items:center;gap:5px;padding:6px 14px;border:1.5px solid var(--border);border-radius:var(--r-m);background:var(--card);font-size:11px;font-weight:700;font-family:var(--font);color:var(--text2);cursor:pointer;transition:all .15s var(--ease)}
.header-btn:hover{border-color:var(--primary);color:var(--primary);background:var(--hover)}
.stats-strip{display:grid;grid-template-columns:repeat(4,1fr);background:var(--card);border-bottom:1.5px solid var(--border)}
.ss-item{padding:13px 20px;text-align:center;border-right:1px solid var(--border-l)}
.ss-item:last-child{border-right:none}
.ss-val{font-size:22px;font-weight:800;line-height:1;margin-bottom:3px}
.ss-val.blue{color:var(--primary)}.ss-val.green{color:var(--green)}.ss-val.amber{color:var(--amber)}.ss-val.red{color:var(--red)}
.ss-label{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}
.prog-section{padding:14px 24px;background:var(--card);border-bottom:1.5px solid var(--border)}
.prog-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}
.prog-label{font-size:12px;font-weight:600;color:var(--text2)}
.prog-pct{font-size:12px;font-weight:700;color:var(--primary)}
.prog-track{height:7px;background:var(--border-l);border-radius:10px;overflow:hidden}
.prog-fill{height:100%;border-radius:10px;background:var(--gradient);transition:width .6s var(--ease)}
.filter-bar{padding:14px 24px;background:var(--card);border-bottom:1.5px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.search-wrap{flex:1;min-width:200px;position:relative}
.search-wrap svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
.search-inp{width:100%;padding:8px 12px 8px 34px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:12px;font-family:var(--font);font-weight:500;color:var(--text);background:var(--input-bg);transition:all .2s var(--ease)}
.search-inp:focus{outline:none;border-color:var(--primary);background:var(--card);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
.fsel{padding:8px 26px 8px 10px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:11px;font-weight:600;font-family:var(--font);color:var(--text2);background:var(--card);appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;cursor:pointer;transition:border-color .15s}
.fsel:focus{outline:none;border-color:var(--primary)}
.urgency-chip{display:flex;align-items:center;gap:4px;padding:6px 11px;border-radius:var(--r-s);font-size:11px;font-weight:700;border:1.5px solid var(--border);cursor:pointer;background:var(--card);color:var(--text2);transition:all .15s var(--ease)}
.urgency-chip.active{background:var(--red-l);border-color:rgba(220,38,38,.25);color:var(--red)}
.urgency-chip:hover:not(.active){border-color:var(--primary);color:var(--primary)}
.section-head{display:flex;align-items:center;justify-content:space-between;padding:16px 24px 8px}
.section-head-title{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:6px}
.section-head-bar{width:3px;height:12px;border-radius:2px}
.section-count{font-size:11px;font-weight:600;color:var(--text3)}
.acard{display:flex;align-items:stretch;background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);margin:0 24px 10px;overflow:hidden;transition:all .25s var(--ease);cursor:pointer;animation:aIn .3s ease-out both}
@keyframes aIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.acard:hover{border-color:#93C5FD;box-shadow:0 4px 18px rgba(37,99,235,.09);transform:translateY(-1px)}
.acard-accent{width:4px;flex-shrink:0}
.acard-accent.urgent{background:var(--red)}.acard-accent.soon{background:var(--amber)}
.acard-accent.normal{background:var(--primary)}.acard-accent.done{background:var(--green)}
.acard-accent.late{background:#9CA3AF}
.acard-body{flex:1;padding:14px 18px;min-width:0}
.acard-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}
.acard-badges{display:flex;gap:5px;flex-wrap:wrap}
.badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.02em;text-transform:uppercase}
.badge-exam{background:#EDE9FE;color:#5B21B6}.badge-hw{background:#E0F2FE;color:#0369A1}
.badge-mc{background:var(--primary-light);color:var(--primary-dark)}.badge-essay{background:var(--purple-l);color:var(--purple)}
.badge-mixed{background:#F0FDF4;color:#166534}
.status-pill{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;flex-shrink:0}
.status-dot{width:7px;height:7px;border-radius:50%}
.acard-title{font-size:13px;font-weight:700;color:var(--text);line-height:1.5;margin-bottom:8px}
.acard-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:11px;color:var(--text3);font-weight:500}
.acard-meta span{display:flex;align-items:center;gap:4px}
.acard-divider{height:1px;background:var(--border-l);margin:10px 0}
.dl-row{display:flex;align-items:center;gap:10px}
.dl-label{font-size:11px;font-weight:600;display:flex;align-items:center;gap:5px;flex-shrink:0}
.dl-label.urgent{color:var(--red)}.dl-label.soon{color:var(--amber)}.dl-label.normal{color:var(--text3)}.dl-label.done{color:var(--green)}.dl-label.late{color:#9CA3AF}
.dl-track{flex:1;height:4px;background:var(--border-l);border-radius:4px;overflow:hidden}
.dl-fill{height:100%;border-radius:4px}
.dl-fill.urgent{background:var(--red)}.dl-fill.soon{background:var(--amber)}.dl-fill.normal{background:var(--primary)}.dl-fill.done{background:var(--green)}.dl-fill.late{background:#D1D5DB}
.dl-right{font-size:11px;font-weight:700;white-space:nowrap;flex-shrink:0}
.dl-right.urgent{color:var(--red)}.dl-right.soon{color:var(--amber)}.dl-right.normal{color:var(--text2)}.dl-right.done{color:var(--green)}.dl-right.late{color:#9CA3AF}
.score-bar-wrap{display:flex;align-items:center;gap:8px;margin-top:6px}
.score-bar-track{flex:1;height:5px;background:var(--border-l);border-radius:5px;overflow:hidden}
.score-bar-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,#10B981,#059669)}
.score-chip{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;background:var(--green-l);color:var(--green)}
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:var(--r-m);font-size:11px;font-weight:700;font-family:var(--font);cursor:pointer;border:none;transition:all .2s var(--ease);margin-top:10px}
.btn-start{background:var(--gradient);color:#fff;box-shadow:0 2px 10px var(--primary-shadow)}
.btn-start:hover{transform:translateY(-1px)}
.btn-urgent{background:linear-gradient(135deg,#EF4444,#DC2626);color:#fff;box-shadow:0 2px 10px rgba(220,38,38,.3)}
.btn-urgent:hover{transform:translateY(-1px)}
.btn-result{background:var(--green-l);color:var(--green);border:1.5px solid rgba(5,150,105,.2)}
.btn-result:hover{background:var(--green);color:#fff}
.state-box{text-align:center;padding:52px 24px;background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);margin:24px}
.state-icon{width:64px;height:64px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.state-title{font-family:var(--font-d);font-size:18px;font-weight:700;margin-bottom:6px}
.state-text{font-size:13px;color:var(--text3)}
.modal-ov{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;animation:mf .2s ease}
@keyframes mf{from{opacity:0}to{opacity:1}}
.modal-box{background:var(--card);border-radius:var(--r-xl);max-width:520px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:var(--sh-l);animation:ms .25s ease}
@keyframes ms{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
.modal-hdr{padding:22px 24px 16px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.modal-title{font-family:var(--font-d);font-size:18px;font-weight:700;line-height:1.3}
.modal-close{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border);background:var(--card);color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s}
.modal-close:hover{background:var(--red-l);color:var(--red);border-color:var(--red)}
.modal-body{padding:20px 24px 24px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}
.info-item{padding:10px 12px;background:var(--input-bg);border:1px solid var(--border-l);border-radius:var(--r-s)}
.info-key{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
.info-val{font-size:12px;font-weight:700;color:var(--text)}
.modal-actions{display:flex;gap:8px;flex-wrap:wrap}
.modal-btn{flex:1;padding:11px;border:none;border-radius:var(--r-m);font-size:12px;font-weight:700;font-family:var(--font);cursor:pointer;transition:all .2s var(--ease);display:flex;align-items:center;justify-content:center;gap:6px}
.modal-btn-p{background:var(--gradient);color:#fff;box-shadow:0 3px 12px var(--primary-shadow)}
.modal-btn-p:hover{transform:translateY(-1px)}
.modal-btn-g{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.modal-btn-g:hover{border-color:var(--primary);color:var(--primary)}
.pw-row{margin-bottom:14px;text-align:left}
.pw-lbl{font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;display:block}
.pw-inp{width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:13px;font-weight:600;font-family:var(--font);background:var(--input-bg);color:var(--text);transition:all .2s var(--ease)}
.pw-inp:focus{outline:none;border-color:var(--primary);background:var(--card);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
.pw-note{font-size:11px;color:var(--text3);margin-top:6px;line-height:1.5}
.pw-err{margin-top:8px;padding:9px 10px;border-radius:10px;background:var(--red-l);border:1px solid rgba(220,38,38,.2);font-size:11px;font-weight:700;color:var(--red)}
.toast{position:fixed;bottom:28px;right:28px;padding:12px 20px;border-radius:var(--r-m);font-size:12px;font-weight:600;font-family:var(--font);box-shadow:var(--sh-l);z-index:2000;display:flex;align-items:center;gap:7px;background:var(--green);color:#fff;animation:ti .2s ease}
.toast.error{background:var(--red)}
@keyframes ti{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:640px){
  .class-hero{padding:14px 14px 0}.acard{margin:0 14px 10px}.filter-bar{padding:12px 14px}
  .stats-strip .ss-val{font-size:18px}.section-head{padding:14px 14px 7px}
  .info-grid{grid-template-columns:1fr}
}
`;

const Ic = {
  Search: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Clock: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  File: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Award: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Check: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Warn: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  X: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  BarChart: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  Send: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Eye: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Circle: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

const DeadlineRow = ({ assignment }) => {
  const { urgency, timeLabel, deadline, myStatus, myScore, totalScore } =
    assignment;

  if (myStatus === "done") {
    const safeMyScore = Number(myScore || 0);
    const pct =
      totalScore > 0 ? Math.round((safeMyScore / totalScore) * 100) : 0;
    return (
      <>
        <div className="dl-row">
          <div className="dl-label done">
            <Ic.Check width={11} height={11} /> Đã nộp thành công
          </div>
          <div style={{ flex: 1 }} />
          <span className="score-chip">
            {safeMyScore}/{totalScore} đ
          </span>
        </div>
        <div className="score-bar-wrap">
          <div className="score-bar-track">
            <div className="score-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--green)",
              minWidth: 36,
            }}
          >
            {pct}%
          </span>
        </div>
      </>
    );
  }

  if (myStatus === "late") {
    return (
      <div className="dl-row">
        <div className="dl-label late">
          <Ic.Circle width={11} height={11} /> Đã hết hạn -{" "}
          {toDisplayDateTime(deadline)}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF" }}>
          Không nộp được
        </span>
      </div>
    );
  }

  const barWidth = urgency === "urgent" ? 92 : urgency === "soon" ? 68 : 35;

  return (
    <div className="dl-row">
      <div className={`dl-label ${urgency}`}>
        <Ic.Clock width={11} height={11} /> {timeLabel}
      </div>
      <div className="dl-track">
        <div
          className={`dl-fill ${urgency}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className={`dl-right ${urgency}`}>
        {toDisplayDateTime(deadline)}
      </span>
    </div>
  );
};

const AssignmentCard = ({ assignment, index, onOpen }) => {
  const {
    title,
    category,
    format,
    questions,
    duration,
    totalScore,
    subject,
    myStatus,
    urgency,
  } = assignment;

  const catBadge =
    category === "exam" ? (
      <span className="badge badge-exam">Kiểm tra</span>
    ) : (
      <span className="badge badge-hw">Bài tập</span>
    );

  const fmtBadge =
    format === "mc" ? (
      <span className="badge badge-mc">Trắc nghiệm</span>
    ) : format === "essay" ? (
      <span className="badge badge-essay">Tự luận</span>
    ) : (
      <span className="badge badge-mixed">Hỗn hợp</span>
    );

  const statusPill = (() => {
    if (myStatus === "done") {
      return (
        <div className="status-pill">
          <div className="status-dot" style={{ background: "var(--green)" }} />
          <span style={{ color: "var(--green)" }}>Đã nộp</span>
        </div>
      );
    }

    if (myStatus === "late") {
      return (
        <div className="status-pill">
          <div className="status-dot" style={{ background: "#9CA3AF" }} />
          <span style={{ color: "#9CA3AF" }}>Quá hạn</span>
        </div>
      );
    }

    if (urgency === "urgent") {
      return (
        <div className="status-pill">
          <div className="status-dot" style={{ background: "var(--red)" }} />
          <span style={{ color: "var(--red)" }}>Sắp hết hạn</span>
        </div>
      );
    }

    return (
      <div className="status-pill">
        <div className="status-dot" style={{ background: "var(--primary)" }} />
        <span style={{ color: "var(--primary)" }}>Chưa nộp</span>
      </div>
    );
  })();

  const actionBtn = (() => {
    if (myStatus === "done") {
      return (
        <button
          className="btn btn-result"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(assignment, "result");
          }}
        >
          <Ic.Eye width={12} height={12} /> Xem kết quả
        </button>
      );
    }

    if (myStatus === "late") {
      return null;
    }

    if (urgency === "urgent") {
      return (
        <button
          className="btn btn-urgent"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(assignment, "start");
          }}
        >
          <Ic.Send width={12} height={12} /> Làm bài ngay
        </button>
      );
    }

    return (
      <button
        className="btn btn-start"
        onClick={(event) => {
          event.stopPropagation();
          onOpen(assignment, "start");
        }}
      >
        <Ic.Send width={12} height={12} /> Làm bài
      </button>
    );
  })();

  return (
    <div
      className="acard"
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={() => onOpen(assignment, "detail")}
    >
      <div
        className={`acard-accent ${myStatus === "done" ? "done" : myStatus === "late" ? "late" : urgency}`}
      />
      <div className="acard-body">
        <div className="acard-top">
          <div className="acard-badges">
            {catBadge}
            {fmtBadge}
          </div>
          {statusPill}
        </div>

        <div className="acard-title">{title}</div>

        <div className="acard-meta">
          <span>
            <Ic.File width={11} height={11} /> {questions} câu
          </span>
          {duration ? (
            <span>
              <Ic.Clock width={11} height={11} /> {duration} phút
            </span>
          ) : null}
          <span>
            <Ic.Award width={11} height={11} /> {totalScore} điểm
          </span>
          <span style={{ color: "var(--primary-dark)", fontWeight: 600 }}>
            {subject || "-"}
          </span>
        </div>

        <div className="acard-divider" />
        <DeadlineRow assignment={assignment} />
        {actionBtn}
      </div>
    </div>
  );
};

const DetailModal = ({ assignment, onClose, onStartAssignment }) => {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  if (!assignment) return null;

  const {
    title,
    category,
    format,
    questions,
    duration,
    totalScore,
    subject,
    description,
    start,
    deadline,
    myStatus,
    requirePassword,
    myScore,
    urgency,
  } = assignment;

  const catBadge =
    category === "exam" ? (
      <span className="badge badge-exam">Kiểm tra</span>
    ) : (
      <span className="badge badge-hw">Bài tập</span>
    );

  const fmtBadge =
    format === "mc" ? (
      <span className="badge badge-mc">Trắc nghiệm</span>
    ) : format === "essay" ? (
      <span className="badge badge-essay">Tự luận</span>
    ) : (
      <span className="badge badge-mixed">Hỗn hợp</span>
    );

  const isDone = myStatus === "done";
  const isLate = myStatus === "late";

  const statusBlock = (() => {
    if (isDone) {
      const safeMyScore = Number(myScore || 0);
      const pct =
        totalScore > 0 ? Math.round((safeMyScore / totalScore) * 100) : 0;
      return (
        <div
          style={{
            background: "var(--green-l)",
            border: "1px solid rgba(5,150,105,.2)",
            borderRadius: "var(--r-m)",
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--green)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Ic.Check width={12} height={12} /> Đã nộp thành công
            </span>
            <span
              style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}
            >
              {safeMyScore}/{totalScore} đ
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "rgba(5,150,105,.15)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "var(--green)",
                borderRadius: 6,
              }}
            />
          </div>
        </div>
      );
    }

    if (isLate) {
      return (
        <div
          style={{
            background: "var(--red-l)",
            border: "1px solid rgba(220,38,38,.2)",
            borderRadius: "var(--r-m)",
            padding: "11px 14px",
            marginBottom: 16,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--red)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ic.Circle width={13} height={13} /> Bài này đã hết hạn nộp bài
        </div>
      );
    }

    if (urgency === "urgent") {
      return (
        <div
          style={{
            background: "var(--red-l)",
            border: "1px solid rgba(220,38,38,.2)",
            borderRadius: "var(--r-m)",
            padding: "11px 14px",
            marginBottom: 16,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--red)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ic.Warn width={13} height={13} /> Sắp hết hạn - hãy làm bài ngay!
        </div>
      );
    }

    return null;
  })();

  const infoItems = [
    ["Môn học", subject || "-"],
    ["Loại", category === "exam" ? "Kiểm tra" : "Bài tập"],
    [
      "Định dạng",
      format === "mc"
        ? "Trắc nghiệm"
        : format === "essay"
          ? "Tự luận"
          : "Hỗn hợp",
    ],
    ["Số câu hỏi", `${questions} câu`],
    ["Thời lượng", duration ? `${duration} phút` : "Không giới hạn"],
    ["Tổng điểm", `${totalScore} điểm`],
    ["Mở từ", toDisplayDateTime(start)],
    ["Hạn nộp", toDisplayDateTime(deadline)],
  ];

  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
              {catBadge}
              {fmtBadge}
            </div>
            <div className="modal-title">{title}</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Ic.X width={13} height={13} />
          </button>
        </div>

        <div className="modal-body">
          {statusBlock}

          {description ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--text2)",
                lineHeight: 1.7,
                marginBottom: 16,
                padding: "10px 14px",
                background: "var(--input-bg)",
                borderRadius: "var(--r-s)",
                borderLeft: "3px solid var(--primary)",
              }}
            >
              {description}
            </p>
          ) : null}

          <div className="info-grid">
            {infoItems.map(([key, value]) => (
              <div key={key} className="info-item">
                <div className="info-key">{key}</div>
                <div className="info-val">{value}</div>
              </div>
            ))}
          </div>

          {!isDone && !isLate ? (
            <div className="pw-row">
              <label className="pw-lbl" htmlFor="assignment-start-password">
                {requirePassword
                  ? "Mật khẩu bài thi (bắt buộc)"
                  : "Mật khẩu bài thi (nếu có)"}
              </label>
              <input
                id="assignment-start-password"
                className="pw-inp"
                type="password"
                placeholder="Nhập mật khẩu trước khi bắt đầu làm bài"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError("");
                }}
              />
              <div className="pw-note">
                {requirePassword
                  ? "Bài thi này có cài mật khẩu. Học sinh cần nhập đúng để vào làm bài."
                  : "Nếu giáo viên có cài mật khẩu, bạn có thể nhập ngay tại đây để vào bài nhanh hơn."}
              </div>
              {passwordError ? (
                <div className="pw-err">{passwordError}</div>
              ) : null}
            </div>
          ) : null}

          <div className="modal-actions">
            {isDone ? (
              <button
                className="modal-btn modal-btn-p"
                onClick={() => {
                  onClose();
                  onStartAssignment(assignment, "result");
                }}
              >
                <Ic.Eye width={13} height={13} /> Xem kết quả chi tiết
              </button>
            ) : !isLate ? (
              <button
                className="modal-btn modal-btn-p"
                onClick={() => {
                  if (requirePassword && !String(password || "").trim()) {
                    setPasswordError("Vui lòng nhập mật khẩu bài thi.");
                    return;
                  }

                  onClose();
                  onStartAssignment(
                    assignment,
                    "start",
                    String(password || "").trim(),
                  );
                }}
              >
                <Ic.Send width={13} height={13} /> Bắt đầu làm bài
              </button>
            ) : null}

            <button className="modal-btn modal-btn-g" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const STUDENT_TABS = [
  { key: "assignments", label: "Bài tập" },
  { key: "materials", label: "Tài liệu" },
  { key: "members", label: "Thành viên" },
  { key: "attendance", label: "Điểm danh" },
];

const getTabPath = (key, classId) => {
  if (key === "assignments") return PATH_STUDENT.classroom.assignments(classId);
  if (key === "materials") return PATH_STUDENT.classroom.folders(classId);
  if (key === "members") return PATH_STUDENT.classroom.members(classId);
  if (key === "attendance") return PATH_STUDENT.classroom.attendance(classId);
  return PATH_STUDENT.classroom.detail(classId);
};

const parseStudentAssignments = (response) => {
  const result = response?.result;

  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.content)) {
    return result.content;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  return [];
};

const StudentAssignmentListPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const classId = Number(id);

  const [classInfo, setClassInfo] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!Number.isFinite(classId) || classId <= 0) {
      setError("Lớp học không hợp lệ.");
      setLoading(false);
      return;
    }

    let alive = true;

    setLoading(true);
    setError("");

    Promise.all([
      classroomApi.getClassroomById(classId).catch(() => null),
      assignmentApi
        .getStudentAssignments({ classroomId: classId })
        .catch(() => ({ result: [] })),
    ])
      .then(([classRes, assignRes]) => {
        if (!alive) return;

        const classData = classRes?.result || null;
        setClassInfo(classData);

        const list = parseStudentAssignments(assignRes)
          .map(toUiAssignment)
          .map((item) => ({
            ...item,
            subject: item.subject || String(classData?.subject || ""),
          }))
          .filter((item) => Number.isFinite(item.id) && item.id > 0);

        setAssignments(list);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.message || "Không thể tải dữ liệu.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [classId]);

  const filtered = useMemo(() => {
    return assignments
      .filter((item) => {
        const normalizedSearch = search.trim().toLowerCase();

        if (
          normalizedSearch &&
          !item.title.toLowerCase().includes(normalizedSearch) &&
          !item.subject.toLowerCase().includes(normalizedSearch)
        ) {
          return false;
        }

        if (statusFilter === "pending" && item.myStatus !== "pending")
          return false;
        if (statusFilter === "done" && item.myStatus !== "done") return false;
        if (statusFilter === "late" && item.myStatus !== "late") return false;
        if (statusFilter === "urgent" && item.urgency !== "urgent")
          return false;

        if (
          urgentOnly &&
          item.urgency !== "urgent" &&
          item.urgency !== "soon"
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.myStatus === "late" && b.myStatus !== "late") return 1;
        if (b.myStatus === "late" && a.myStatus !== "late") return -1;

        const urgencyOrder = {
          urgent: 0,
          soon: 1,
          normal: 2,
          done: 3,
          late: 4,
        };
        return (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2);
      });
  }, [assignments, search, statusFilter, urgentOnly]);

  const pending = filtered.filter((item) => item.myStatus === "pending");
  const done = filtered.filter((item) => item.myStatus === "done");
  const late = filtered.filter((item) => item.myStatus === "late");

  const counts = {
    total: assignments.length,
    done: assignments.filter((item) => item.myStatus === "done").length,
    pending: assignments.filter((item) => item.myStatus === "pending").length,
    late: assignments.filter((item) => item.myStatus === "late").length,
  };

  const progressPct =
    counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  const classInitials = classInfo
    ? (classInfo.name || "").replace(/\d/g, "").substring(0, 2).toUpperCase() ||
      (classInfo.name || "").substring(0, 2).toUpperCase()
    : "CL";

  const handleOpenModal = (assignment, mode) => setModal({ assignment, mode });

  const handleStartAssignment = (assignment, mode, password = "") => {
    if (mode === "result") {
      const safeSubmissionId = Number(assignment?.submissionId);
      if (!Number.isFinite(safeSubmissionId) || safeSubmissionId <= 0) {
        showToast("Không tìm thấy mã bài nộp để mở kết quả chi tiết.", "error");
        return;
      }

      navigate(PATH_STUDENT.assignmentResult(safeSubmissionId), {
        state: {
          classId,
          assignmentId: assignment?.id || null,
        },
      });
      return;
    }

    navigate(PATH_STUDENT.classroom.assignmentDo(classId, assignment.id), {
      state: {
        startPassword: String(password || "").trim() || null,
      },
    });
  };

  return (
    <ClassroomDetailLayout>
      <div className="page">
        <style>{CSS}</style>

        <div className="class-hero">
          <div className="class-hero-top">
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="class-avatar">{classInitials}</div>
              <div className="class-info">
                <div className="class-name">
                  {classInfo
                    ? `Lớp ${classInfo.name}${classInfo.subject ? ` - ${classInfo.subject}` : ""}`
                    : `Lớp ${classId}`}
                </div>
                <div className="class-sub">
                  {classInfo?.teacherName ? (
                    <span>GV: {classInfo.teacherName}</span>
                  ) : null}
                  {classInfo?.teacherName ? <div className="dot" /> : null}
                  {classInfo?.studentCount ? (
                    <span>{classInfo.studentCount} học sinh</span>
                  ) : null}
                  {classInfo?.studentCount ? <div className="dot" /> : null}
                  <span>Năm học 2025-2026</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignSelf: "center" }}>
              <button
                className="header-btn"
                onClick={() => navigate(PATH_STUDENT.classroom.detail(classId))}
              >
                <Ic.BarChart width={12} height={12} /> Quay lại lớp học
              </button>
            </div>
          </div>

          <div className="class-tabs">
            {STUDENT_TABS.map((item) => (
              <button
                key={item.key}
                className={`ctab${item.key === "assignments" ? " active" : ""}`}
                onClick={() => navigate(getTabPath(item.key, classId))}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="stats-strip">
          <div className="ss-item">
            <div className="ss-val blue">{counts.total}</div>
            <div className="ss-label">Tổng bài</div>
          </div>
          <div className="ss-item">
            <div className="ss-val green">{counts.done}</div>
            <div className="ss-label">Đã nộp</div>
          </div>
          <div className="ss-item">
            <div className="ss-val amber">{counts.pending}</div>
            <div className="ss-label">Chưa nộp</div>
          </div>
          <div className="ss-item">
            <div className="ss-val red">{counts.late}</div>
            <div className="ss-label">Quá hạn</div>
          </div>
        </div>

        <div className="prog-section">
          <div className="prog-row">
            <span className="prog-label">Tiến độ hoàn thành</span>
            <span className="prog-pct">{progressPct}%</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-wrap">
            <Ic.Search width={13} height={13} />
            <input
              className="search-inp"
              placeholder="Tìm kiếm bài tập..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className="fsel"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chưa nộp</option>
            <option value="done">Đã nộp</option>
            <option value="late">Quá hạn</option>
            <option value="urgent">Sắp hết hạn</option>
          </select>

          <button
            className={`urgency-chip${urgentOnly ? " active" : ""}`}
            onClick={() => setUrgentOnly((prev) => !prev)}
          >
            <Ic.Warn width={11} height={11} /> Sắp hết hạn
          </button>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="state-icon">
              <Ic.File width={26} height={26} />
            </div>
            <div className="state-title">Đang tải bài tập...</div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="state-box">
            <div
              className="state-icon"
              style={{ background: "var(--red-l)", color: "var(--red)" }}
            >
              <Ic.Circle width={26} height={26} />
            </div>
            <div className="state-title" style={{ color: "var(--red)" }}>
              {error}
            </div>
          </div>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="state-box">
            <div className="state-icon">
              <Ic.File width={26} height={26} />
            </div>
            <div className="state-title">Không tìm thấy bài tập</div>
            <div className="state-text">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
            </div>
          </div>
        ) : null}

        {!loading && !error ? (
          <div style={{ paddingTop: 6, paddingBottom: 28 }}>
            {pending.length > 0 ? (
              <>
                <div className="section-head">
                  <div className="section-head-title">
                    <div
                      className="section-head-bar"
                      style={{ background: "var(--primary)" }}
                    />
                    Cần làm
                  </div>
                  <span className="section-count">{pending.length} bài</span>
                </div>
                {pending.map((assignment, index) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    index={index}
                    onOpen={handleOpenModal}
                  />
                ))}
              </>
            ) : null}

            {done.length > 0 ? (
              <>
                <div className="section-head" style={{ marginTop: 8 }}>
                  <div className="section-head-title">
                    <div
                      className="section-head-bar"
                      style={{ background: "var(--green)" }}
                    />
                    <span style={{ color: "var(--green)" }}>Đã hoàn thành</span>
                  </div>
                  <span className="section-count">{done.length} bài</span>
                </div>
                {done.map((assignment, index) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    index={index + pending.length}
                    onOpen={handleOpenModal}
                  />
                ))}
              </>
            ) : null}

            {late.length > 0 ? (
              <>
                <div className="section-head" style={{ marginTop: 8 }}>
                  <div className="section-head-title">
                    <div
                      className="section-head-bar"
                      style={{ background: "#9CA3AF" }}
                    />
                    <span style={{ color: "#9CA3AF" }}>Quá hạn</span>
                  </div>
                  <span className="section-count">{late.length} bài</span>
                </div>
                {late.map((assignment, index) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    index={index + pending.length + done.length}
                    onOpen={handleOpenModal}
                  />
                ))}
              </>
            ) : null}
          </div>
        ) : null}

        {modal ? (
          <DetailModal
            assignment={modal.assignment}
            onClose={() => setModal(null)}
            onStartAssignment={handleStartAssignment}
          />
        ) : null}

        {toast ? (
          <div className={`toast${toast.type === "error" ? " error" : ""}`}>
            <Ic.Check width={13} height={13} /> {toast.msg}
          </div>
        ) : null}
      </div>
    </ClassroomDetailLayout>
  );
};

export default StudentAssignmentListPage;
