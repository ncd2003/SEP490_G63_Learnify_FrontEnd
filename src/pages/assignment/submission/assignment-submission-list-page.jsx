import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_TEACHER } from "@/routes/paths";

const toDisplayTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

const AVATAR_COLORS = [
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#14B8A6",
  "#A78BFA",
];

const avatarColor = (id) => AVATAR_COLORS[Number(id) % AVATAR_COLORS.length];

const toUpper = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const toFiniteNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDurationMinutes = (startTime, submitTime) => {
  if (!startTime || !submitTime) return null;

  const startMs = new Date(startTime).getTime();
  const submitMs = new Date(submitTime).getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(submitMs)) return null;
  if (submitMs <= startMs) return 0;

  return Math.round((submitMs - startMs) / 60000);
};

const extractSubmissionItems = (response) => {
  const result = response?.result;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.content)) return result.content;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(response?.content)) return response.content;

  return [];
};

const extractOptionsFromRaw = (rawOptions) => {
  if (Array.isArray(rawOptions)) return rawOptions;
  if (!rawOptions || typeof rawOptions !== "string") return [];

  try {
    const parsed = JSON.parse(rawOptions);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.options)) return parsed.options;
  } catch {
    return [];
  }

  return [];
};

const getOptionText = (option) =>
  String(option?.content || option?.text || option?.label || "").trim();

const resolveMyAnswerIndex = (options = [], answerContent = "") => {
  const explicitIndex = options.findIndex((option) =>
    Boolean(
      option?.selected ||
      option?.isSelected ||
      option?.chosen ||
      option?.studentSelected,
    ),
  );
  if (explicitIndex >= 0) return explicitIndex;

  const normalizedAnswer = String(answerContent || "").trim();
  if (!normalizedAnswer) return -1;

  const letterIndex = "ABCDEFGHIJ".indexOf(normalizedAnswer.toUpperCase());
  if (letterIndex >= 0 && letterIndex < options.length) return letterIndex;

  return options.findIndex(
    (option) => getOptionText(option) === normalizedAnswer,
  );
};

const normalizeSubmission = (item, idx) => ({
  id: Number(item?.submissionId ?? item?.id ?? idx + 1),
  submissionId: Number(item?.submissionId ?? item?.id ?? idx + 1),
  studentId: item?.studentId,
  studentName: item?.studentName || item?.name || `Học sinh ${idx + 1}`,
  submittedAt: item?.submitTime || item?.submittedAt || item?.createdAt || null,
  usedMinutes: Number(item?.usedMinutes ?? item?.timeSpentMinutes ?? 0),
  totalScore:
    item?.totalEarnedScore != null
      ? Number(item.totalEarnedScore)
      : item?.totalScore != null
        ? Number(item.totalScore)
        : null,
  maxScore: item?.totalScore != null ? Number(item.totalScore) : null,
  autoScore: Number(item?.autoScore ?? item?.mcScore ?? 0),
  essayScore: item?.essayScore != null ? Number(item.essayScore) : null,
  status: toUpper(item?.status || item?.gradingStatus || "SUBMITTED"),
  isLate: Boolean(item?.isLate),
  autoSubmitted: Boolean(item?.autoSubmitted),
  tabSwitchCount: Number(item?.tabSwitchCount ?? 0),
  totalEssayQuestions: Number(item?.totalEssayQuestions ?? 0),
  gradedEssayQuestions: Number(item?.gradedEssayQuestions ?? 0),
  needsGrading:
    toUpper(item?.status || item?.gradingStatus || "SUBMITTED") !== "GRADED" &&
    Number(item?.totalEssayQuestions ?? 0) >
      Number(item?.gradedEssayQuestions ?? 0),
});

const normalizeEssayAnswer = (item, idx) => ({
  questionId: Number(item?.assignmentQuestionId ?? item?.questionId ?? idx + 1),
  studentAnswerId: Number(item?.studentAnswerId ?? item?.id ?? idx + 1),
  questionNum: Number(item?.questionNumber ?? item?.order ?? idx + 1),
  questionContent: item?.questionContent || item?.content || "",
  maxPoints: Number(
    item?.maxPoints ?? item?.defaultPoints ?? item?.points ?? 1,
  ),
  sampleAnswer: item?.sampleAnswer || "",
  cognitiveLevel: item?.cognitiveLevel || "",
  myAnswer: item?.answerContent || item?.submittedText || item?.myAnswer || "",
  earnedPoints: item?.earnedPoints != null ? Number(item.earnedPoints) : null,
  teacherComment: item?.teacherFeedback || item?.teacherComment || "",
  gradingStatus: toUpper(item?.gradingStatus || "PENDING"),
  gradedAt: item?.gradedAt || null,
  gradedBy: item?.gradedByName || null,
});

const normalizeMcAnswer = (item, idx) => {
  const options = extractOptionsFromRaw(item?.allOptions || item?.options).map(
    (option) => ({
      text: getOptionText(option),
      correct: Boolean(option?.correct ?? option?.isCorrect),
      selected: Boolean(
        option?.selected ||
        option?.isSelected ||
        option?.chosen ||
        option?.studentSelected,
      ),
    }),
  );
  const myAnswerIndex = resolveMyAnswerIndex(options, item?.answerContent);
  const correctIndex = options.findIndex((option) => option.correct);

  return {
    questionId: Number(
      item?.assignmentQuestionId ?? item?.questionId ?? idx + 1,
    ),
    questionNum: Number(item?.questionNumber ?? item?.order ?? idx + 1),
    questionContent: item?.questionContent || item?.content || "",
    questionType: String(item?.questionType || "MULTIPLE_CHOICE").toUpperCase(),
    maxPoints: Number(item?.maxPoints ?? item?.defaultPoints ?? 0.25),
    earnedPoints: Number(item?.earnedPoints ?? 0),
    options,
    isCorrect: Boolean(item?.isCorrect),
    myAnswerIndex,
    correctIndex,
    myAnswerTF: item?.answerContent || item?.myAnswer || "",
    correctTF: options[correctIndex]?.text || item?.correctAnswer || "",
  };
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');

:root {
  --primary:#2563EB;--primary-dark:#1D4ED8;--primary-light:#EFF6FF;
  --primary-shadow:rgba(37,99,235,.22);
  --gradient:linear-gradient(135deg,#3B82F6 0%,#2563EB 50%,#1D4ED8 100%);
  --green:#059669;--green-l:#ECFDF5;--green-d:#065F46;
  --red:#DC2626;--red-l:#FEF2F2;--red-d:#991B1B;
  --amber:#D97706;--amber-l:#FFFBEB;--amber-d:#92400E;
  --purple:#7C3AED;--purple-l:#F5F3FF;--purple-d:#4C1D95;
  --bg:#F8FAFC;--card:#fff;--sidebar-bg:#FAFBFE;--input-bg:#F5F7FB;
  --text:#1E293B;--text2:#475569;--text3:#94A3B8;
  --border:#E2E8F0;--border-l:#F1F5F9;
  --sh-s:0 1px 3px rgba(30,41,59,.04);--sh-m:0 4px 14px rgba(30,41,59,.07);
  --sh-l:0 12px 40px rgba(30,41,59,.11);
  --r-s:10px;--r-m:12px;--r-l:16px;--r-xl:20px;
  --font:'Be Vietnam Pro',sans-serif;--font-d:'Be Vietnam Pro',sans-serif;
  --ease:cubic-bezier(0.4,0,0.2,1);
}
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}

.root{display:flex;height:100vh;overflow:hidden;font-family:var(--font);background:var(--bg)}

.panel-left{width:320px;flex-shrink:0;display:flex;flex-direction:column;border-right:1.5px solid var(--border);background:var(--card);overflow:hidden}
.asn-hdr{padding:16px 18px;background:var(--gradient);position:relative;overflow:hidden;flex-shrink:0}
.asn-hdr::before{content:'';position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.08)}
.asn-hdr-title{font-family:var(--font-d);font-size:14px;font-weight:700;color:#fff;margin-bottom:3px;position:relative}
.asn-hdr-sub{font-size:11px;color:rgba(255,255,255,.72);position:relative;line-height:1.5}
.back-btn{display:flex;align-items:center;gap:4px;font-size:10px;color:rgba(255,255,255,.7);margin-bottom:8px;cursor:pointer;position:relative;transition:color .12s}
.back-btn:hover{color:#fff}

.stats-strip{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1.5px solid var(--border);flex-shrink:0}
.ss{padding:10px 0;text-align:center;border-right:1px solid var(--border-l)}
.ss:last-child{border-right:none}
.ss-val{font-size:18px;font-weight:800;line-height:1;margin-bottom:2px}
.ss-label{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}

.sub-filter{padding:10px 12px;border-bottom:1.5px solid var(--border);display:flex;gap:7px;flex-shrink:0}
.srch-wrap{flex:1;position:relative}
.srch-wrap svg{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--text3)}
.srch-inp{width:100%;padding:7px 9px 7px 28px;border:1.5px solid var(--border);border-radius:var(--r-s);font-size:11px;font-family:var(--font);color:var(--text);background:var(--input-bg);outline:none;transition:all .15s}
.srch-inp:focus{border-color:var(--primary);background:var(--card);box-shadow:0 0 0 2px rgba(37,99,235,.08)}
.fsel{padding:7px 20px 7px 8px;border:1.5px solid var(--border);border-radius:var(--r-s);font-size:11px;font-weight:600;font-family:var(--font);color:var(--text2);background:var(--card);appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='9' height='9' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center;cursor:pointer;transition:border-color .15s}
.fsel:focus{outline:none;border-color:var(--primary)}

.sub-list{flex:1;overflow-y:auto;padding:8px 10px}
.sub-row{display:flex;align-items:center;gap:9px;padding:10px 12px;border-radius:var(--r-m);cursor:pointer;transition:all .15s;margin-bottom:4px;border:1.5px solid transparent}
.sub-row:hover{background:var(--sidebar-bg);border-color:var(--border)}
.sub-row.active{background:var(--primary-light);border-color:rgba(37,99,235,.25)}
.sub-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;color:#fff}
.sub-info{flex:1;min-width:0}
.sub-name{font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sub-time{font-size:10px;color:var(--text3);margin-top:1px}
.sub-score{text-align:right;flex-shrink:0}
.sub-score-val{font-size:13px;font-weight:800}
.needs-dot{width:7px;height:7px;border-radius:50%;background:var(--amber);flex-shrink:0}

.badge{padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.02em}
.badge-graded{background:var(--green-l);color:var(--green-d)}
.badge-pending{background:var(--amber-l);color:var(--amber-d)}
.badge-mc{background:var(--primary-light);color:var(--primary-dark)}
.badge-es{background:var(--purple-l);color:var(--purple-d)}

.panel-right{flex:1;display:flex;flex-direction:column;overflow:hidden}
.empty-panel{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;opacity:.5;padding:24px}
.empty-panel p{font-size:13px;color:var(--text3);text-align:center}

.grade-topbar{padding:13px 20px;background:var(--card);border-bottom:1.5px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.grade-avatar{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0}
.grade-name{font-size:13px;font-weight:700;color:var(--text)}
.grade-meta{font-size:11px;color:var(--text3);margin-top:1px}
.grade-score-big{font-family:var(--font-d);font-size:24px;font-weight:700;line-height:1}
.grade-score-sub{font-size:10px;color:var(--text3);font-weight:600;margin-top:1px}

.ov-strip{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1.5px solid var(--border);background:var(--card);flex-shrink:0}
.ov-item{padding:10px 16px;text-align:center;border-right:1px solid var(--border-l)}
.ov-item:last-child{border-right:none}
.ov-val{font-size:17px;font-weight:800;line-height:1;margin-bottom:2px}
.ov-label{font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}

.inner-tabs{display:flex;border-bottom:1.5px solid var(--border);background:var(--card);flex-shrink:0}
.itab{padding:9px 18px;font-size:12px;font-weight:700;font-family:var(--font);color:var(--text3);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1.5px;transition:all .15s}
.itab.active{color:var(--primary);border-bottom-color:var(--primary)}
.itab:hover:not(.active){color:var(--text2)}

.grade-scroll{flex:1;overflow-y:auto;padding:16px 20px}
.section-heading{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;display:flex;align-items:center;gap:7px}
.section-heading-bar{width:3px;height:12px;border-radius:2px;flex-shrink:0}

.qg-card{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);margin-bottom:10px;overflow:hidden;transition:all .2s var(--ease)}
.qg-card.essay-card{border-left:3px solid var(--purple)}
.qg-card.mc-correct{border-left:3px solid var(--green)}
.qg-card.mc-wrong{border-left:3px solid var(--red)}
.qg-hdr{padding:11px 14px;background:var(--sidebar-bg);border-bottom:1px solid var(--border-l);display:flex;align-items:center;gap:8px;cursor:pointer;transition:background .12s}
.qg-hdr:hover{background:var(--primary-light)}
.qg-num{width:26px;height:26px;border-radius:50%;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.qg-num.correct{background:#DCFCE7;color:#15803D}
.qg-num.wrong{background:#FEE2E2;color:#991B1B}
.qg-num.essay-pending{background:#EDE9FE;color:#5B21B6}
.qg-num.essay-graded{background:#DCFCE7;color:#15803D}
.qg-content{flex:1;font-size:12px;font-weight:600;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pts-chip{padding:2px 9px;border-radius:20px;font-size:11px;font-weight:800;flex-shrink:0}
.pts-chip.correct{background:#DCFCE7;color:#15803D}
.pts-chip.wrong{background:#FEE2E2;color:#991B1B}
.pts-chip.pending{background:#EDE9FE;color:#5B21B6}
.qg-body{padding:12px 14px}

.mc-opts{display:flex;flex-direction:column;gap:4px}
.mc-opt{display:flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--r-s);font-size:11px;color:var(--text2)}
.mc-opt.correct-opt{border-color:#34D399;background:#F0FDF4;color:#065F46}
.mc-opt.wrong-opt{border-color:#FCA5A5;background:#FFF1F2;color:#991B1B}
.opt-l{width:18px;height:18px;border-radius:4px;background:var(--border-l);font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--text3);flex-shrink:0}
.mc-opt.correct-opt .opt-l{background:#34D399;color:#fff}
.mc-opt.wrong-opt .opt-l{background:#FCA5A5;color:#fff}
.opt-tag-hs{font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px;background:#FEF9C3;color:#92400E}
.opt-tag-correct{font-size:9px;font-weight:700;padding:2px 6px;border-radius:8px;background:#DCFCE7;color:#15803D}

.essay-box{padding:11px 13px;border-radius:var(--r-s);margin-bottom:8px}
.essay-box.student{background:var(--input-bg);border:1px solid var(--border)}
.essay-box.sample{background:#F0FDF4;border:1px solid rgba(5,150,105,.2)}
.essay-box-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
.essay-box-text{font-size:12px;color:var(--text2);line-height:1.65;white-space:pre-wrap}
.grading-zone{border:1.5px solid rgba(124,58,237,.2);border-radius:var(--r-m);padding:12px 14px;background:var(--purple-l)}
.grading-zone-label{font-size:10px;font-weight:700;color:var(--purple-d);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;display:flex;align-items:center;gap:5px}
.score-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.score-inp{width:72px;padding:7px 10px;border:1.5px solid rgba(124,58,237,.3);border-radius:var(--r-s);font-size:16px;font-weight:800;font-family:var(--font);color:var(--purple-d);background:var(--card);text-align:center;outline:none;transition:all .15s}
.score-inp:focus{border-color:var(--purple);box-shadow:0 0 0 3px rgba(124,58,237,.1)}
.score-max-label{font-size:13px;font-weight:700;color:var(--text3)}
.presets{display:flex;gap:5px;flex-wrap:wrap}
.preset-btn{padding:4px 10px;border-radius:var(--r-s);border:1px solid rgba(124,58,237,.2);background:var(--card);font-size:11px;font-weight:700;font-family:var(--font);color:var(--purple);cursor:pointer;transition:all .12s}
.preset-btn:hover,.preset-btn.active{background:var(--purple);color:#fff;border-color:var(--purple)}
.comment-inp{width:100%;padding:8px 10px;border:1px solid rgba(124,58,237,.2);border-radius:var(--r-s);font-size:12px;font-family:var(--font);color:var(--text);background:var(--card);resize:vertical;min-height:60px;outline:none;transition:border-color .15s;margin-top:8px;line-height:1.5}
.comment-inp:focus{border-color:var(--purple);box-shadow:0 0 0 2px rgba(124,58,237,.08)}
.graded-note{display:flex;align-items:flex-start;gap:6px;padding:8px 10px;background:rgba(5,150,105,.06);border:1px solid rgba(5,150,105,.2);border-radius:var(--r-s);font-size:11px;color:var(--green-d);margin-top:6px}

.grade-footer{padding:12px 20px;background:var(--card);border-top:1.5px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.nav-btns{display:flex;align-items:center;gap:5px}
.nav-btn{width:30px;height:30px;border-radius:var(--r-s);border:1.5px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text3);transition:all .12s}
.nav-btn:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light)}
.nav-btn:disabled{opacity:.3;cursor:not-allowed;pointer-events:none}
.nav-pos{font-size:11px;color:var(--text3);font-weight:600;padding:0 4px}
.footer-actions{display:flex;gap:7px}
.btn{display:inline-flex;align-items:center;gap:5px;padding:8px 18px;border-radius:var(--r-m);font-size:12px;font-weight:700;font-family:var(--font);cursor:pointer;border:none;transition:all .2s var(--ease)}
.btn-p{background:var(--gradient);color:#fff;box-shadow:0 2px 10px var(--primary-shadow)}
.btn-p:hover{transform:translateY(-1px)}
.btn-success{background:linear-gradient(135deg,#10B981,#059669);color:#fff;box-shadow:0 2px 8px rgba(5,150,105,.25)}
.btn-success:hover{transform:translateY(-1px)}
.btn-g{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.btn-g:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light)}

.toast{position:fixed;bottom:28px;right:28px;padding:12px 20px;border-radius:var(--r-m);font-size:12px;font-weight:600;font-family:var(--font);box-shadow:var(--sh-l);z-index:2000;display:flex;align-items:center;gap:7px;animation:ti .2s ease}
@keyframes ti{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.toast.success{background:var(--green);color:#fff}
.toast.info{background:var(--primary);color:#fff}
.toast.warn{background:var(--amber);color:#fff}
.toast.error{background:var(--red);color:#fff}

.loading-state{flex:1;display:flex;align-items:center;justify-content:center;opacity:.5}

@media(max-width:900px){.panel-left{width:280px}}
@media(max-width:680px){.panel-left{display:none}}
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
  ArrowLeft: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ChevLeft: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevRight: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
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
  Edit: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Layers: (p) => (
    <svg
      {...p}
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
  Users: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Calendar: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

const EssayGradingCard = ({ answer, grade, comment, onGrade, onComment }) => {
  const presets = useMemo(() => {
    const max = answer.maxPoints;
    const raw = [0, max * 0.25, max * 0.5, max * 0.75, max];
    return [...new Set(raw.map((v) => Math.round(v * 4) / 4))];
  }, [answer.maxPoints]);

  const isGraded = grade != null;
  const numCls = isGraded ? "essay-graded" : "essay-pending";
  const ptsCls = isGraded ? "correct" : "pending";

  return (
    <div className="qg-card essay-card">
      <div className="qg-hdr" style={{ cursor: "default" }}>
        <div className={`qg-num ${numCls}`}>{answer.questionNum}</div>
        <span className="badge badge-es">Tự luận</span>
        <span className="qg-content">{answer.questionContent}</span>
        <span className={`pts-chip ${ptsCls}`}>
          {isGraded
            ? `+${grade}/${answer.maxPoints}đ`
            : `?/${answer.maxPoints}đ`}
        </span>
      </div>

      <div className="qg-body">
        <div className="essay-box student">
          <div className="essay-box-label" style={{ color: "var(--text3)" }}>
            Bài làm học sinh
          </div>
          <div className="essay-box-text">
            {answer.myAnswer || "(Không có bài làm)"}
          </div>
        </div>

        {answer.sampleAnswer ? (
          <div className="essay-box sample">
            <div
              className="essay-box-label"
              style={{ color: "var(--green-d)" }}
            >
              Đáp án mẫu
            </div>
            <div className="essay-box-text">{answer.sampleAnswer}</div>
          </div>
        ) : null}

        <div className="grading-zone">
          <div className="grading-zone-label">
            <Ic.Edit width={13} height={13} /> Chấm điểm
          </div>

          <div className="score-row">
            <input
              className="score-inp"
              type="number"
              min={0}
              max={answer.maxPoints}
              step={0.25}
              value={grade ?? ""}
              placeholder="—"
              onChange={(event) => {
                const raw = event.target.value;
                if (raw === "") {
                  onGrade(null);
                  return;
                }
                const next = Math.min(
                  answer.maxPoints,
                  Math.max(0, parseFloat(raw) || 0),
                );
                onGrade(next);
              }}
            />
            <span className="score-max-label">/ {answer.maxPoints} điểm</span>
          </div>

          <div className="presets">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`preset-btn${grade === preset ? " active" : ""}`}
                onClick={() => onGrade(preset)}
              >
                {preset}đ
              </button>
            ))}
          </div>

          <textarea
            className="comment-inp"
            placeholder="Nhận xét cho học sinh (không bắt buộc)..."
            value={comment}
            onChange={(event) => onComment(event.target.value)}
          />
        </div>

        {isGraded && answer.gradedBy ? (
          <div className="graded-note">
            <Ic.Check
              width={12}
              height={12}
              style={{ marginTop: 1, flexShrink: 0 }}
            />
            <span>
              Đã chấm bởi {answer.gradedBy} — {toDisplayTime(answer.gradedAt)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const McAnswerCard = ({ answer, isOpen, onToggle }) => {
  const isCorrect = answer.earnedPoints >= answer.maxPoints;
  const cardCls = isCorrect ? "mc-correct" : "mc-wrong";
  const numCls = isCorrect ? "correct" : "wrong";
  const ptsCls = isCorrect ? "correct" : "wrong";

  return (
    <div className={`qg-card ${cardCls}`}>
      <div className="qg-hdr" onClick={onToggle}>
        <div className={`qg-num ${numCls}`}>{answer.questionNum}</div>
        <span className="badge badge-mc">TN</span>
        <span className="qg-content">{answer.questionContent}</span>
        <span className={`pts-chip ${ptsCls}`}>
          {isCorrect ? `+${answer.maxPoints}đ` : `0/${answer.maxPoints}đ`}
        </span>
      </div>

      {isOpen && !isCorrect ? (
        <div className="qg-body">
          <div className="mc-opts">
            {answer.options.map((option, oi) => {
              const isCorrectOpt = oi === answer.correctIndex;
              const isMine = oi === answer.myAnswerIndex;
              let cls = "";
              if (isCorrectOpt) cls = " correct-opt";
              else if (isMine) cls = " wrong-opt";

              return (
                <div key={oi} className={`mc-opt${cls}`}>
                  <div className="opt-l">{"ABCD"[oi]}</div>
                  <span style={{ flex: 1 }}>{option.text || "(trống)"}</span>
                  {isMine && !isCorrectOpt ? (
                    <span className="opt-tag-hs">HS chọn</span>
                  ) : null}
                  {isCorrectOpt ? (
                    <span className="opt-tag-correct">Đáp án đúng</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const GradingPanel = ({
  submission,
  assignmentInfo,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  position,
  totalSubs,
  onSaveGrades,
  saving,
}) => {
  const [activeTab, setActiveTab] = useState("essay");
  const [grades, setGrades] = useState({});
  const [comments, setComments] = useState({});
  const [openMc, setOpenMc] = useState(new Set());

  useEffect(() => {
    if (!submission) return;
    const nextGrades = {};
    const nextComments = {};

    (submission.essayAnswers || []).forEach((answer) => {
      nextGrades[answer.questionId] = answer.earnedPoints;
      nextComments[answer.questionId] = answer.teacherComment || "";
    });

    setGrades(nextGrades);
    setComments(nextComments);
  }, [submission?.id, submission]);

  const gradedCount = (submission?.essayAnswers || []).filter(
    (answer) => grades[answer.questionId] != null,
  ).length;
  const allEssayGraded =
    gradedCount === Number((submission?.essayAnswers || []).length);
  const totalNow = useMemo(() => {
    if (!submission) return 0;
    const initialEssaySum = (submission.essayAnswers || []).reduce(
      (sum, a) => sum + (a.earnedPoints || 0),
      0,
    );
    const currentEssaySum = (submission.essayAnswers || []).reduce(
      (sum, a) => sum + (grades[a.questionId] || 0),
      0,
    );
    return (submission.totalScore || 0) + (currentEssaySum - initialEssaySum);
  }, [submission, grades]);
  const mcCorrect = (submission?.mcAnswers || []).filter(
    (answer) => answer.earnedPoints >= answer.maxPoints,
  ).length;

  const toggleMc = (id) => {
    setOpenMc((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!submission) {
    return (
      <div className="empty-panel">
        <Ic.File width={40} height={40} style={{ color: "var(--text3)" }} />
        <p>
          Chọn một học sinh ở bên trái
          <br />
          để xem và chấm bài.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grade-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="grade-avatar"
            style={{ background: avatarColor(submission.studentId) }}
          >
            {getInitials(submission.studentName)}
          </div>
          <div>
            <div className="grade-name">{submission.studentName}</div>
            <div className="grade-meta">
              Nộp {toDisplayTime(submission.submittedAt)} ·{" "}
              {submission.usedMinutes} phút
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div
              className="grade-score-big"
              style={{
                color: allEssayGraded ? "var(--green)" : "var(--amber)",
              }}
            >
              {totalNow.toFixed(2)}
            </div>
            <div className="grade-score-sub">
              / {assignmentInfo?.totalScore || 10} điểm
            </div>
          </div>
          <span
            className={`badge ${submission.status === "GRADED" ? "badge-graded" : "badge-pending"}`}
            style={{ padding: "4px 10px", fontSize: 10 }}
          >
            {submission.status === "GRADED" ? "Đã chấm" : "Chờ chấm"}
          </span>
        </div>
      </div>

      <div className="ov-strip">
        <div className="ov-item">
          <div className="ov-val" style={{ color: "var(--primary)" }}>
            {submission.autoScore.toFixed(2)}
          </div>
          <div className="ov-label">Điểm tự động</div>
        </div>
        <div className="ov-item">
          <div className="ov-val" style={{ color: "var(--purple)" }}>
            {((submission?.essayAnswers || []).reduce(
              (sum, a) => sum + (grades[a.questionId] || 0),
              0,
            )).toFixed(2)}
          </div>
          <div className="ov-label">Điểm tự luận</div>
        </div>
        <div className="ov-item">
          <div className="ov-val" style={{ color: "var(--green)" }}>
            {mcCorrect}/{(submission.mcAnswers || []).length}
          </div>
          <div className="ov-label">MC đúng</div>
        </div>
        <div className="ov-item">
          <div
            className="ov-val"
            style={{ color: allEssayGraded ? "var(--green)" : "var(--amber)" }}
          >
            {gradedCount}/{(submission?.essayAnswers || []).length}
          </div>
          <div className="ov-label">Tự luận đã chấm</div>
        </div>
      </div>

      <div className="inner-tabs">
        {(submission.essayAnswers || []).length > 0 ? (
          <button
            type="button"
            className={`itab${activeTab === "essay" ? " active" : ""}`}
            onClick={() => setActiveTab("essay")}
          >
            Tự luận ({(submission.essayAnswers || []).length})
          </button>
        ) : null}
        <button
          type="button"
          className={`itab${activeTab === "mc" ? " active" : ""}`}
          onClick={() => setActiveTab("mc")}
        >
          Trắc nghiệm ({(submission.mcAnswers || []).length})
        </button>
        <button
          type="button"
          className={`itab${activeTab === "all" ? " active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          Tất cả
        </button>
      </div>

      <div className="grade-scroll">
        {(activeTab === "essay" || activeTab === "all") &&
        (submission.essayAnswers || []).length > 0 ? (
          <>
            <div className="section-heading">
              <div
                className="section-heading-bar"
                style={{ background: "var(--purple)" }}
              />
              Câu tự luận — chấm thủ công
            </div>
            {(submission.essayAnswers || []).map((answer) => (
              <EssayGradingCard
                key={answer.questionId}
                answer={answer}
                grade={grades[answer.questionId] ?? null}
                comment={comments[answer.questionId] ?? ""}
                onGrade={(value) =>
                  setGrades((prev) => ({ ...prev, [answer.questionId]: value }))
                }
                onComment={(value) =>
                  setComments((prev) => ({
                    ...prev,
                    [answer.questionId]: value,
                  }))
                }
              />
            ))}
          </>
        ) : null}

        {(activeTab === "mc" || activeTab === "all") &&
        (submission.mcAnswers || []).length > 0 ? (
          <>
            <div
              className="section-heading"
              style={{ marginTop: activeTab === "all" ? 16 : 0 }}
            >
              <div
                className="section-heading-bar"
                style={{ background: "var(--primary)" }}
              />
              Câu trắc nghiệm
            </div>
            {(submission.mcAnswers || []).map((answer) => (
              <McAnswerCard
                key={answer.questionId}
                answer={answer}
                isOpen={openMc.has(answer.questionId)}
                onToggle={() => toggleMc(answer.questionId)}
              />
            ))}
          </>
        ) : null}
      </div>

      <div className="grade-footer">
        <div className="nav-btns">
          <button
            type="button"
            className="nav-btn"
            disabled={prevDisabled}
            onClick={onPrev}
          >
            <Ic.ChevLeft width={13} height={13} />
          </button>
          <button
            type="button"
            className="nav-btn"
            disabled={nextDisabled}
            onClick={onNext}
          >
            <Ic.ChevRight width={13} height={13} />
          </button>
          <span className="nav-pos">
            {position} / {totalSubs}
          </span>
        </div>
        <div className="footer-actions">
          <button
            type="button"
            className="btn btn-g"
            onClick={() => onSaveGrades(grades, comments, false)}
          >
            Lưu nháp
          </button>
          <button
            type="button"
            className="btn btn-success"
            disabled={saving}
            onClick={() => onSaveGrades(grades, comments, true)}
          >
            <Ic.Check width={12} height={12} />
            {saving ? "Đang lưu..." : "Xác nhận điểm"}
          </button>
        </div>
      </div>
    </>
  );
};

export default function AssignmentSubmissionListPage() {
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const [searchParams] = useSearchParams();

  const classroomIdParam = Number(searchParams.get("classroomId"));
  const classroomName = searchParams.get("classroomName") || "";

  const [assignmentInfo, setAssignmentInfo] = useState({
    id: Number(assignmentId) || null,
    title: `Bài tập #${assignmentId || ""}`,
  });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubId, setActiveSubId] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [subDetail, setSubDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    setAssignmentInfo({
      id: Number(assignmentId) || null,
      title: `Bài tập #${assignmentId || ""}`,
    });
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId) return;
    let alive = true;
    setLoading(true);

    const submissionParams =
      Number.isFinite(classroomIdParam) && classroomIdParam > 0
        ? { classroomId: classroomIdParam }
        : {};

    assignmentApi
      .getSubmissions(assignmentId, submissionParams)
      .then((subRes) => {
        if (!alive) return;

        const list = extractSubmissionItems(subRes);

        const normalized = list.map(normalizeSubmission);
        setSubmissions(normalized);

        if (normalized.length > 0) {
          setAssignmentInfo((prev) => ({
            ...prev,
            totalScore: normalized[0].maxScore ?? prev?.totalScore,
          }));
        }

        const firstPending = normalized.find((s) => s.needsGrading);
        if (firstPending) setActiveSubId(firstPending.id);
        else if (normalized.length > 0) setActiveSubId(normalized[0].id);
        else setActiveSubId(null);
      })
      .catch((err) => {
        if (!alive) return;
        showToast(
          err?.response?.data?.message || "Không thể tải danh sách nộp bài",
          "error",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [assignmentId, classroomIdParam]);

  useEffect(() => {
    if (!activeSubId) return;
    let alive = true;
    setLoadingSub(true);
    setSubDetail(null);

    assignmentApi
      .getSubmissionDetail(activeSubId)
      .then((res) => {
        if (!alive) return;

        const data = res?.result || res || {};
        const basic = submissions.find((s) => s.id === activeSubId) || null;
        const rawAnswers = Array.isArray(data?.answers)
          ? data.answers
          : [
              ...(Array.isArray(data?.essayAnswers) ? data.essayAnswers : []),
              ...(Array.isArray(data?.mcAnswers) ? data.mcAnswers : []),
            ];

        const essayAnswers = rawAnswers
          .filter((answer) => toUpper(answer?.questionType) === "ESSAY")
          .map((answer, index) => normalizeEssayAnswer(answer, index));
        const mcAnswers = rawAnswers
          .filter((answer) => toUpper(answer?.questionType) !== "ESSAY")
          .map((answer, index) => normalizeMcAnswer(answer, index));

        const totalEssayQuestions = Number(
          data?.totalEssayQuestions ??
            basic?.totalEssayQuestions ??
            essayAnswers.length,
        );
        const gradedEssayQuestions = Number(
          data?.gradedEssayQuestions ??
            basic?.gradedEssayQuestions ??
            essayAnswers.filter((answer) => answer.gradingStatus === "GRADED")
              .length,
        );
        const status = toUpper(data?.status || basic?.status || "SUBMITTED");
        const usedMinutesFromTimeline = getDurationMinutes(
          data?.startTime,
          data?.submitTime,
        );

        const autoScore = mcAnswers.reduce((sum, a) => sum + (a.earnedPoints || 0), 0);
        const essayScoreNow = essayAnswers.reduce(
          (sum, a) => sum + (a.earnedPoints || 0),
          0,
        );

        setSubDetail({
          ...basic,
          id: Number(data?.submissionId ?? basic?.id ?? activeSubId),
          submissionId: Number(data?.submissionId ?? basic?.id ?? activeSubId),
          studentId: data?.studentId ?? basic?.studentId,
          studentName: data?.studentName || basic?.studentName || "Học sinh",
          status,
          submittedAt: data?.submitTime || basic?.submittedAt || null,
          usedMinutes:
            usedMinutesFromTimeline ?? Number(basic?.usedMinutes ?? 0),
          autoScore,
          essayScore: essayScoreNow,
          totalScore:
            data?.totalEarnedScore != null
              ? Number(data.totalEarnedScore)
              : autoScore + essayScoreNow,
          maxScore:
            data?.totalScore != null
              ? Number(data.totalScore)
              : (basic?.maxScore ?? null),
          totalEssayQuestions,
          gradedEssayQuestions,
          needsGrading:
            status !== "GRADED" && totalEssayQuestions > gradedEssayQuestions,
          essayAnswers,
          mcAnswers,
        });
      })
      .catch(() => {
        if (!alive) return;
        showToast("Không thể tải chi tiết bài làm", "error");
      })
      .finally(() => {
        if (alive) setLoadingSub(false);
      });

    return () => {
      alive = false;
    };
  }, [activeSubId, submissions]);

  const handleSaveGrades = useCallback(
    async (grades, comments, finalize) => {
      if (!activeSubId) return;

      const essayAnswers = subDetail?.essayAnswers || [];
      const ungraded = essayAnswers.filter(
        (answer) => grades[answer.questionId] == null,
      );
      if (finalize && ungraded.length > 0) {
        showToast(`Chưa chấm ${ungraded.length} câu essay!`, "warn");
        return;
      }

      const gradeItems = essayAnswers
        .filter((answer) => grades[answer.questionId] != null)
        .map((answer) => ({
          studentAnswerId: Number(answer.studentAnswerId),
          score: Number(grades[answer.questionId]),
          feedback: comments[answer.questionId] || "",
        }))
        .filter(
          (answer) =>
            Number.isFinite(answer.studentAnswerId) &&
            Number.isFinite(answer.score) &&
            answer.score >= 0,
        );

      if (gradeItems.length === 0) {
        showToast("Bạn chưa nhập điểm câu tự luận nào.", "warn");
        return;
      }

      setSaving(true);
      try {
        const payload = {
          answers: gradeItems,
        };

        const response = await assignmentApi.gradeSubmission(
          activeSubId,
          payload,
        );
        const result = response?.result || {};
        const nextStatus = toUpper(
          result?.status || (finalize ? "GRADED" : subDetail?.status),
        );
        const totalEssayQuestions = Number(
          result?.totalEssayQuestions ?? essayAnswers.length,
        );
        const gradedEssayQuestions = Number(
          result?.gradedEssayQuestions ?? gradeItems.length,
        );
        const isFullyGraded = Boolean(
          result?.fullyGraded || nextStatus === "GRADED",
        );
        const totalEarnedScore = toFiniteNumberOrNull(result?.totalEarnedScore);

        setSubDetail((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            status: nextStatus,
            totalScore:
              totalEarnedScore !== null ? totalEarnedScore : prev.totalScore,
            totalEssayQuestions,
            gradedEssayQuestions,
            needsGrading: !isFullyGraded,
            essayAnswers: prev.essayAnswers.map((answer) => ({
              ...answer,
              earnedPoints:
                grades[answer.questionId] != null
                  ? Number(grades[answer.questionId])
                  : answer.earnedPoints,
              teacherComment:
                comments[answer.questionId] !== undefined
                  ? comments[answer.questionId]
                  : answer.teacherComment,
              gradingStatus:
                grades[answer.questionId] != null
                  ? "GRADED"
                  : answer.gradingStatus,
            })),
          };
        });

        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === activeSubId
              ? {
                  ...s,
                  status: nextStatus,
                  totalScore:
                    totalEarnedScore !== null ? totalEarnedScore : s.totalScore,
                  totalEssayQuestions,
                  gradedEssayQuestions,
                  needsGrading: !isFullyGraded,
                }
              : s,
          ),
        );

        const message =
          response?.message ||
          (finalize ? "Chấm điểm thành công." : "Đã lưu điểm.");
        showToast(message, finalize ? "success" : "info");
      } catch (err) {
        showToast(err?.response?.data?.message || "Lưu điểm thất bại", "error");
      } finally {
        setSaving(false);
      }
    },
    [activeSubId, subDetail],
  );

  const filteredSubs = useMemo(
    () =>
      submissions.filter((s) => {
        if (
          search &&
          !s.studentName.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        if (statusFilter === "pending" && !s.needsGrading) return false;
        if (statusFilter === "graded" && s.needsGrading) return false;
        return true;
      }),
    [submissions, search, statusFilter],
  );

  const activeIdx = filteredSubs.findIndex((s) => s.id === activeSubId);

  const counts = useMemo(
    () => ({
      total: submissions.length,
      graded: submissions.filter((s) => !s.needsGrading).length,
      pending: submissions.filter((s) => s.needsGrading).length,
    }),
    [submissions],
  );

  return (
    <div className="root">
      <style>{CSS}</style>

      <div className="panel-left">
        <div className="asn-hdr">
          <div
            className="back-btn"
            onClick={() =>
              navigate(PATH_TEACHER.assignmentDetail(assignmentId))
            }
          >
            <Ic.ArrowLeft width={11} height={11} /> Về chi tiết bài tập
          </div>
          <div className="asn-hdr-title">
            {assignmentInfo?.title || `Bài tập #${assignmentId}`}
          </div>
          <div className="asn-hdr-sub">
            {[
              assignmentInfo?.subject,
              classroomName,
              `${assignmentInfo?.questionCount || 0} câu`,
              `${assignmentInfo?.totalScore || 10} điểm`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        <div className="stats-strip">
          <div className="ss">
            <div className="ss-val" style={{ color: "var(--primary)" }}>
              {counts.total}
            </div>
            <div className="ss-label">Đã nộp</div>
          </div>
          <div className="ss">
            <div className="ss-val" style={{ color: "var(--green)" }}>
              {counts.graded}
            </div>
            <div className="ss-label">Đã chấm</div>
          </div>
          <div className="ss">
            <div className="ss-val" style={{ color: "var(--amber)" }}>
              {counts.pending}
            </div>
            <div className="ss-label">Chờ chấm</div>
          </div>
        </div>

        <div className="sub-filter">
          <div className="srch-wrap">
            <Ic.Search width={12} height={12} />
            <input
              className="srch-inp"
              placeholder="Tìm học sinh..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="fsel"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="pending">Chờ chấm</option>
            <option value="graded">Đã chấm</option>
          </select>
        </div>

        <div className="sub-list">
          {loading ? (
            <div className="loading-state">
              <Ic.Layers
                width={28}
                height={28}
                style={{ color: "var(--text3)" }}
              />
            </div>
          ) : filteredSubs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                opacity: 0.45,
              }}
            >
              <Ic.Users
                width={28}
                height={28}
                style={{ color: "var(--text3)", margin: "0 auto 8px" }}
              />
              <p style={{ fontSize: 12, color: "var(--text3)" }}>
                Không có bài nộp
              </p>
            </div>
          ) : (
            filteredSubs.map((s) => {
              const isActive = s.id === activeSubId;
              return (
                <div
                  key={s.id}
                  className={`sub-row${isActive ? " active" : ""}`}
                  onClick={() => setActiveSubId(s.id)}
                >
                  <div
                    className="sub-avatar"
                    style={{ background: avatarColor(s.studentId) }}
                  >
                    {getInitials(s.studentName)}
                  </div>
                  <div className="sub-info">
                    <div className="sub-name">{s.studentName}</div>
                    <div className="sub-time">
                      Nộp {toDisplayTime(s.submittedAt)} · {s.usedMinutes}p
                    </div>
                  </div>
                  <div className="sub-score">
                    {s.totalScore != null ? (
                      <>
                        <div
                          className="sub-score-val"
                          style={{ color: "var(--green)" }}
                        >
                          {s.totalScore}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--text3)",
                            fontWeight: 600,
                          }}
                        >
                          / {assignmentInfo?.totalScore || 10}
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          className="sub-score-val"
                          style={{ color: "var(--amber)" }}
                        >
                          —
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--text3)",
                            fontWeight: 600,
                          }}
                        >
                          Chờ
                        </div>
                      </>
                    )}
                  </div>
                  {s.needsGrading ? (
                    <div className="needs-dot" title="Cần chấm essay" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="panel-right">
        {loadingSub ? (
          <div className="loading-state">
            <Ic.Layers
              width={28}
              height={28}
              style={{ color: "var(--text3)" }}
            />
          </div>
        ) : (
          <GradingPanel
            submission={subDetail}
            assignmentInfo={assignmentInfo}
            position={Math.max(1, activeIdx + 1)}
            totalSubs={Math.max(1, filteredSubs.length)}
            prevDisabled={activeIdx <= 0}
            nextDisabled={activeIdx >= filteredSubs.length - 1}
            onPrev={() => {
              if (activeIdx > 0) setActiveSubId(filteredSubs[activeIdx - 1].id);
            }}
            onNext={() => {
              if (activeIdx < filteredSubs.length - 1)
                setActiveSubId(filteredSubs[activeIdx + 1].id);
            }}
            onSaveGrades={handleSaveGrades}
            saving={saving}
          />
        )}
      </div>

      {toast ? (
        <div className={`toast ${toast.type}`}>
          <Ic.Check width={13} height={13} /> {toast.msg}
        </div>
      ) : null}
    </div>
  );
}
