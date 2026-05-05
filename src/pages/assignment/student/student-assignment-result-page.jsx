import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import { PATH_STUDENT } from "@/routes/paths";

const LETTERS = "ABCDEFGHIJ";

const COG_COLORS = {
  REMEMBERING: "#3B82F6",
  UNDERSTANDING: "#10B981",
  APPLYING: "#F59E0B",
  ANALYZING: "#8B5CF6",
  EVALUATING: "#EC4899",
  CREATING: "#EF4444",
};

const COG_LABEL = {
  REMEMBERING: "Nhớ",
  UNDERSTANDING: "Hiểu",
  APPLYING: "Vận dụng",
  ANALYZING: "Phân tích",
  EVALUATING: "Đánh giá",
  CREATING: "Sáng tạo",
};

const toDisplayDateTime = (v) => {
  if (!v) return "-";

  try {
    return new Date(v).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const normalizeType = (t) => {
  const v = String(t || "").toUpperCase();
  if (v.includes("MULTIPLE") || v === "MC") return "mc";
  if (v.includes("TRUE") || v.includes("FALSE") || v === "TF") return "tf";
  if (v.includes("BLANK")) return "fb";
  return "essay";
};

const parseOptionList = (rawOptions) => {
  let parsed = rawOptions;

  if (typeof rawOptions === "string") {
    try {
      parsed = JSON.parse(rawOptions);
    } catch {
      parsed = [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.map((option, index) => {
    const text = String(
      option?.content ?? option?.text ?? option?.label ?? "",
    ).trim();

    return {
      id: String(
        option?.id ?? option?.optionId ?? option?.value ?? option?.key ?? index,
      ),
      text,
      correct: Boolean(option?.correct ?? option?.isCorrect),
    };
  });
};

const normalizeQuestionResult = (item, idx) => {
  const type = normalizeType(item.questionType || item.type);
  const allOptions = parseOptionList(item.allOptions ?? item.options);
  const correctOptions = parseOptionList(item.correctOptions);

  const correctOptionIdSet = new Set(
    correctOptions.map((option) => String(option.id)),
  );
  const correctOptionTextSet = new Set(
    correctOptions.map((option) => String(option.text || "").toLowerCase()),
  );

  const normalizedOptions = (
    allOptions.length ? allOptions : correctOptions
  ).map((option) => ({
    ...option,
    correct:
      Boolean(option.correct) ||
      correctOptionIdSet.has(String(option.id)) ||
      correctOptionTextSet.has(String(option.text || "").toLowerCase()),
  }));

  const correctIdx = normalizedOptions.findIndex((o) => o.correct);

  const rawStudentAnswer = String(
    item.studentAnswer ??
    item.myAnswer ??
    item.essayAnswer ??
    item.submittedText ??
    "",
  ).trim();

  let myAnswerIdx =
    typeof item.myAnswerIndex === "number"
      ? item.myAnswerIndex
      : typeof item.selectedOptionIndex === "number"
        ? item.selectedOptionIndex
        : -1;

  if (type === "mc" && myAnswerIdx < 0 && rawStudentAnswer) {
    myAnswerIdx = normalizedOptions.findIndex(
      (option) => String(option.id) === rawStudentAnswer,
    );
  }

  const normalizedStudentAnswer = rawStudentAnswer.toLowerCase();
  const myAnswerTF =
    type === "tf"
      ? normalizedStudentAnswer === "true"
        ? normalizedOptions.find((option) =>
          ["đúng", "dung", "true"].includes(
            String(option.text || "")
              .trim()
              .toLowerCase(),
          ),
        )?.text || "Đúng"
        : normalizedStudentAnswer === "false"
          ? normalizedOptions.find((option) =>
            ["sai", "false"].includes(
              String(option.text || "")
                .trim()
                .toLowerCase(),
            ),
          )?.text || "Sai"
          : rawStudentAnswer
      : "";

  const myEssayText =
    type === "essay" || type === "fb"
      ? rawStudentAnswer
      : item.essayAnswer || item.submittedText || "";

  // Với câu điền khuyết (FB), nếu sampleAnswer trống, thử lấy từ danh sách correctOptions
  const sampleAns =
    item.sampleAnswer ||
    item.correctAnswer ||
    (type === "fb" && correctOptions.length > 0
      ? correctOptions.map((o) => o.text).join(", ")
      : "");

  const teacherNote = item.teacherComment || item.feedback || "";

  const myPts = Number(item.earnedPoints ?? item.myPoints ?? 0);
  const totalPts = Number(item.defaultPoints ?? item.points ?? 1);
  const isCorrectByFlag =
    typeof item.isCorrect === "boolean"
      ? item.isCorrect
      : typeof item.correct === "boolean"
        ? item.correct
        : null;
  const isCorrect =
    isCorrectByFlag === null
      ? myPts >= totalPts && totalPts > 0
      : isCorrectByFlag;
  const isPartial = myPts > 0 && myPts < totalPts;

  const status =
    type === "essay"
      ? isPartial
        ? "partial"
        : isCorrect
          ? "correct"
          : "pending"
      : isCorrect
        ? "correct"
        : "wrong";

  return {
    id: item.id || item.itemId || idx,
    type,
    content: item.content || item.prompt || "",
    cognitiveLevel: String(item.cognitiveLevel || "APPLYING").toUpperCase(),
    points: totalPts,
    myPoints: myPts,
    status,
    options: normalizedOptions,
    correctOptions,
    correctIndex: correctIdx,
    myAnswerIndex: myAnswerIdx,
    correctTF:
      type === "tf" ? normalizedOptions.find((o) => o.correct)?.text || "" : "",
    myAnswerTF,
    myEssayText,
    sampleAnswer: sampleAns,
    teacherNote,
  };
};

const normalizeResult = (data) => {
  const qs = Array.isArray(data.questions) ? data.questions : [];
  const normalizedQs = qs.map(normalizeQuestionResult);

  const correct = normalizedQs.filter((q) => q.status === "correct").length;
  const wrong = normalizedQs.filter((q) => q.status === "wrong").length;
  const partial = normalizedQs.filter(
    (q) => q.status === "partial" || q.status === "pending",
  ).length;
  const total =
    normalizedQs.length ||
    Number(data.questionCount ?? data.numberOfQuestions ?? 0);

  return {
    assignmentId: data.assignmentId || data.id || data.assignmentId,
    classroomId:
      Number(data.classroomId ?? data.classId) > 0
        ? Number(data.classroomId ?? data.classId)
        : null,
    title: data.title || data.assignmentTitle || "Bài tập",
    subject: data.subject || "",
    className: data.className || data.class || "",
    submittedAt: data.submittedAt || data.submitTime || data.createdAt || null,
    durationMinutes: Number(
      data.setting?.durationMinutes ?? data.durationMinutes ?? 0,
    ),
    usedMinutes: Number(
      data.usedMinutes ??
      data.timeSpentMinutes ??
      (data.startTime && data.submitTime
        ? (new Date(data.submitTime).getTime() -
          new Date(data.startTime).getTime()) /
        (1000 * 60)
        : 0),
    ),
    myScore: Number(
      data.totalEarnedScore ?? data.totalEarnedPoints ?? data.myScore ?? 0,
    ),
    totalScore: Number(data.totalScore ?? data.maxScore ?? 10),
    correct,
    wrong,
    partial,
    total,
    questions: normalizedQs,
    visibility: String(data.visibility || "FULL_DETAILS").toUpperCase(),
  };
};

const Ic = {
  ChevDown: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
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
  Refresh: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
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
  Bookmark: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');

:root {
  --primary:#2563EB;--primary-dark:#1D4ED8;--primary-light:#EFF6FF;
  --primary-shadow:rgba(37,99,235,.22);
  --gradient:linear-gradient(135deg,#3B82F6 0%,#2563EB 50%,#1D4ED8 100%);
  --green:#059669;--green-l:#ECFDF5;--green-d:#065F46;
  --red:#DC2626;--red-l:#FEF2F2;--red-d:#991B1B;
  --amber:#D97706;--amber-l:#FFFBEB;
  --purple:#7C3AED;--purple-l:#F5F3FF;
  --bg:#F8FAFC;--card:#fff;--input-bg:#F5F7FB;--sidebar-bg:#FAFBFE;
  --text:#1E293B;--text2:#475569;--text3:#94A3B8;
  --border:#E2E8F0;--border-l:#F1F5F9;
  --sh-s:0 1px 3px rgba(30,41,59,.04);--sh-m:0 4px 14px rgba(30,41,59,.07);
  --r-s:10px;--r-m:12px;--r-l:16px;--r-xl:20px;
  --font:'Be Vietnam Pro',sans-serif;--font-d:'Lora',serif;
  --ease:cubic-bezier(0.4,0,0.2,1);
}
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
.page{min-height:100vh;background:var(--bg);font-family:var(--font);color:var(--text);width:100%;overflow-x:hidden}
.max-w{width:min(1680px,100%);max-width:100%;margin:0 auto;padding-bottom:40px}
.hero{background:var(--card);border-bottom:1.5px solid var(--border);padding:32px 24px 28px;text-align:center;position:relative;overflow:visible}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:var(--gradient)}
.score-ring-wrap{display:flex;align-items:center;justify-content:center;margin-bottom:20px}
.grade-pill{display:inline-flex;align-items:center;gap:7px;padding:8px 20px;border-radius:40px;font-size:14px;font-weight:800;margin-bottom:10px}
.hero-title{font-family:var(--font-d);font-size:22px;font-weight:700;color:var(--text);margin-bottom:6px;line-height:1.35}
.hero-sub{font-size:13px;color:var(--text3);margin-bottom:0}
.stat-chips{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:18px}
.stat-chip{display:flex;flex-direction:column;align-items:center;padding:10px 16px;border-radius:var(--r-m);border:1.5px solid var(--border);background:var(--sidebar-bg);min-width:72px}
.sc-val{font-size:20px;font-weight:800;line-height:1;margin-bottom:3px}
.sc-label{font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}
.breakdown{display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:var(--card);border-bottom:1.5px solid var(--border)}
.bk-item{padding:16px 20px;text-align:center;border-right:1px solid var(--border-l)}
.bk-item:last-child{border-right:none}
.bk-val{font-size:26px;font-weight:800;line-height:1;margin-bottom:3px}
.bk-label{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}
.bk-bar{height:5px;border-radius:5px;overflow:hidden;background:var(--border-l)}
.bk-fill{height:100%;border-radius:5px;transition:width .7s var(--ease)}
.section-card{background:var(--card);border-bottom:1.5px solid var(--border);padding:18px 24px}
.section-title{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:7px;margin-bottom:14px}
.section-title-bar{width:3px;height:12px;border-radius:2px;flex-shrink:0}
.cog-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.cog-row:last-child{margin-bottom:0}
.cog-label{font-size:12px;font-weight:600;color:var(--text2);width:88px;flex-shrink:0}
.cog-track{flex:1;height:8px;background:var(--border-l);border-radius:8px;overflow:hidden}
.cog-fill{height:100%;border-radius:8px;transition:width .7s var(--ease)}
.cog-stat{font-size:11px;font-weight:700;color:var(--text3);min-width:60px;text-align:right}
.inner-tabs-wrap{background:var(--card);border-bottom:1.5px solid var(--border);position:sticky;top:0;z-index:8}
.inner-tabs{display:flex;gap:2px;padding:12px 24px 0}
.itab{padding:9px 16px;font-size:12px;font-weight:700;font-family:var(--font);color:var(--text3);border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s var(--ease)}
.itab.active{color:var(--primary);border-bottom-color:var(--primary)}
.itab:hover:not(.active){color:var(--text2)}
.filter-row{display:flex;gap:6px;padding:10px 24px 12px;flex-wrap:wrap;border-top:1px solid var(--border-l)}
.fchip{padding:5px 12px;border-radius:var(--r-s);font-size:11px;font-weight:700;border:1.5px solid var(--border);background:var(--card);cursor:pointer;font-family:var(--font);color:var(--text3);transition:all .14s}
.fchip.active{background:var(--primary-light);border-color:rgba(37,99,235,.3);color:var(--primary-dark)}
.fchip.active.green-chip{background:var(--green-l);border-color:rgba(5,150,105,.3);color:var(--green-d)}
.fchip.active.red-chip{background:var(--red-l);border-color:rgba(220,38,38,.3);color:var(--red-d)}
.qr-list{padding:16px 24px 8px}
.qr-card{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);margin-bottom:10px;overflow:hidden;transition:all .2s var(--ease);animation:qIn .3s ease-out both}
@keyframes qIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.qr-card:hover{box-shadow:var(--sh-m)}
.qr-card.correct-card:hover{border-color:rgba(5,150,105,.35)}
.qr-card.wrong-card:hover{border-color:rgba(220,38,38,.25)}
.qr-hdr{padding:11px 15px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--border-l);background:var(--sidebar-bg);cursor:pointer;user-select:none;transition:background .12s}
.qr-hdr:hover{background:#EDF2FF}
.qr-num{width:28px;height:28px;border-radius:50%;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.qr-num.correct{background:#DCFCE7;color:#15803D}
.qr-num.wrong{background:#FEE2E2;color:#991B1B}
.qr-num.partial{background:#FEF9C3;color:#854D0E}
.qr-num.pending{background:#EDE9FE;color:#5B21B6}
.badge{padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.02em}
.badge-mc{background:var(--primary-light);color:var(--primary-dark)}
.badge-tf{background:var(--green-l);color:var(--green-d)}
.badge-fb{background:#FEF3C7;color:#92400E}
.badge-es{background:var(--purple-l);color:var(--purple)}
.badge-cog{background:var(--border-l);color:var(--text3)}
.qr-preview{flex:1;font-size:12px;font-weight:600;color:var(--text);white-space:normal;overflow:visible;text-overflow:unset;line-height:1.5}
.pts-chip{padding:3px 9px;border-radius:20px;font-size:11px;font-weight:800;flex-shrink:0}
.pts-chip.correct{background:#DCFCE7;color:#15803D}
.pts-chip.wrong{background:#FEE2E2;color:#991B1B}
.pts-chip.partial{background:#FEF9C3;color:#854D0E}
.pts-chip.pending{background:#EDE9FE;color:#5B21B6}
.chev-icon{color:var(--text3);transition:transform .2s var(--ease);flex-shrink:0}
.chev-icon.open{transform:rotate(180deg)}
.qr-body{padding:14px 16px}
.q-content-box{font-size:13px;color:var(--text);line-height:1.75;padding:11px 14px;background:var(--input-bg);border-radius:var(--r-s);border-left:3px solid var(--primary);margin-bottom:12px;font-weight:500}
.opt-row{display:flex;align-items:center;gap:8px;padding:8px 11px;border:1.5px solid var(--border);border-radius:var(--r-s);margin-bottom:5px;font-size:12px;color:var(--text2);transition:all .12s}
.opt-row.correct-opt{border-color:#34D399;background:#F0FDF4;color:#065F46}
.opt-row.wrong-opt{border-color:#FCA5A5;background:#FFF1F2;color:#991B1B}
.opt-row.my-correct{border-color:#34D399;background:#F0FDF4;color:#065F46}
.opt-letter{width:20px;height:20px;border-radius:5px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:var(--border-l);color:var(--text3)}
.opt-row.correct-opt .opt-letter{background:#34D399;color:#fff}
.opt-row.wrong-opt .opt-letter{background:#FCA5A5;color:#fff}
.opt-tags{display:flex;gap:4px;margin-left:auto;flex-shrink:0}
.opt-tag{padding:2px 7px;border-radius:10px;font-size:9px;font-weight:700}
.tag-mine{background:#FEF9C3;color:#854D0E}
.tag-correct-ans{background:#DCFCE7;color:#15803D}
.tag-wrong-ans{background:#FEE2E2;color:#991B1B}
.tf-opt{flex:1;padding:9px 12px;border:1.5px solid var(--border);border-radius:var(--r-s);font-size:12px;font-weight:700;text-align:center;color:var(--text3)}
.tf-opt.correct-opt{border-color:#34D399;background:#F0FDF4;color:#065F46}
.tf-opt.wrong-opt{border-color:#FCA5A5;background:#FFF1F2;color:#991B1B}
.essay-block{padding:12px 14px;border-radius:var(--r-s);margin-bottom:8px}
.essay-block.mine{background:var(--input-bg);border:1.5px solid var(--border)}
.essay-block.sample{background:#F0FDF4;border:1.5px solid rgba(5,150,105,.2)}
.essay-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
.essay-text{font-size:12px;color:var(--text2);line-height:1.65;white-space:pre-wrap}
.teacher-note{display:flex;align-items:flex-start;gap:8px;padding:10px 13px;background:var(--purple-l);border:1px solid rgba(124,58,237,.2);border-radius:var(--r-s);font-size:12px;color:var(--purple);margin-top:6px;line-height:1.6}
.fb-fill-answer{padding:8px 12px;background:var(--green-l);border-radius:var(--r-s);border:1.5px solid rgba(5,150,105,.2);font-size:13px;font-weight:700;color:var(--green-d)}
.action-bar{padding:16px 24px;background:var(--card);border-top:1.5px solid var(--border);display:flex;gap:8px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:var(--r-m);font-size:12px;font-weight:700;font-family:var(--font);cursor:pointer;border:none;transition:all .2s var(--ease)}
.btn-p{background:var(--gradient);color:#fff;box-shadow:0 3px 12px var(--primary-shadow)}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 5px 18px var(--primary-shadow)}
.btn-g{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.btn-g:hover{border-color:var(--primary);color:var(--primary);background:var(--primary-light)}
.state-box{text-align:center;padding:60px 24px;background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);margin:28px 24px}
.state-icon{width:64px;height:64px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.state-title{font-family:var(--font-d);font-size:18px;font-weight:700;margin-bottom:6px}
.state-text{font-size:13px;color:var(--text3)}
@media(max-width:640px){
  .hero{padding:24px 16px 20px}.breakdown{grid-template-columns:1fr 1fr}.breakdown .bk-item:nth-child(3){grid-column:span 2}
  .qr-list{padding:12px 14px}.action-bar{padding:14px 16px}.inner-tabs{padding:10px 14px 0}.filter-row{padding:8px 14px 10px}
  .stat-chips .stat-chip{padding:8px 12px;min-width:60px}
}
`;

const ScoreRing = ({ myScore, totalScore, size = 130 }) => {
  const pct = totalScore > 0 ? myScore / totalScore : 0;
  const safePct = Math.max(0, Math.min(1, pct));
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        marginBottom: 8,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ display: "block" }}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={10}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="#10B981"
          strokeWidth={10}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - safePct)}
          transform={`rotate(-90 ${cx} ${cx})`}
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          transform: "translateY(-50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-d)",
            fontSize: 38,
            fontWeight: 700,
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          {myScore % 1 === 0 ? myScore : myScore.toFixed(2)}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--text3)",
            fontWeight: 600,
            marginTop: 3,
          }}
        >
          / {totalScore} điểm
        </div>
      </div>
    </div>
  );
};

const QuestionReviewCard = ({ q, index, isOpen, onToggle }) => {
  const numCls =
    q.status === "correct"
      ? "correct"
      : q.status === "partial"
        ? "partial"
        : q.status === "pending"
          ? "pending"
          : "wrong";

  const typeBadge =
    q.type === "mc" ? (
      <span className="badge badge-mc">Trắc nghiệm</span>
    ) : q.type === "tf" ? (
      <span className="badge badge-tf">Đúng/Sai</span>
    ) : q.type === "fb" ? (
      <span className="badge badge-fb">Điền khuyết</span>
    ) : (
      <span className="badge badge-es">Tự luận</span>
    );

  const ptsLabel =
    q.myPoints >= q.points
      ? `+${q.points}d`
      : q.myPoints > 0
        ? `+${q.myPoints}/${q.points}đ`
        : `0/${q.points}đ`;

  const cardCls =
    q.status === "correct"
      ? " correct-card"
      : q.status === "wrong"
        ? " wrong-card"
        : "";

  const optionsBlock = () => {
    if (q.type === "mc" && q.options.length > 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {q.options.map((o, oi) => {
            const isCorrect = oi === q.correctIndex;
            const isMine = oi === q.myAnswerIndex;
            let cls = "";

            if (isCorrect && isMine) {
              cls = " my-correct";
            } else if (isCorrect) {
              cls = " correct-opt";
            } else if (isMine) {
              cls = " wrong-opt";
            }

            return (
              <div key={oi} className={`opt-row${cls}`}>
                <div className="opt-letter">{LETTERS[oi]}</div>
                <span style={{ flex: 1 }}>{o.text || "(trong)"}</span>
                <div className="opt-tags">
                  {isCorrect && (!isMine || q.status === "correct") ? (
                    <span className="opt-tag tag-correct-ans">Đáp án đúng</span>
                  ) : null}
                  {isMine && q.status !== "correct" ? (
                    <span className="opt-tag tag-wrong-ans">Lựa chọn của bạn</span>
                  ) : isMine && q.status === "correct" ? (
                    <span className="opt-tag tag-correct-ans">Bạn chọn đúng</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (q.type === "tf" && q.options.length > 0) {
      return (
        <div style={{ display: "flex", gap: 8 }}>
          {q.options.map((o, oi) => {
            const isCorrect = o.correct;
            const isMine = o.text === q.myAnswerTF;
            let cls = "";

            if (isCorrect && isMine) {
              cls = " my-correct";
            } else if (isCorrect) {
              cls = " correct-opt";
            } else if (isMine) {
              cls = " wrong-opt";
            }

            return (
              <div key={oi} className={`tf-opt${cls}`}>
                {o.text}
                {isCorrect && !isMine ? " ✓" : ""}
              </div>
            );
          })}
        </div>
      );
    }

    if (q.type === "fb") {
      return (
        <>
          {q.myEssayText ? (
            <div className="essay-block mine">
              <div className="essay-label" style={{ color: "var(--text3)" }}>
                Bạn điền
              </div>
              <div
                className="essay-text"
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: q.status === "correct" ? "var(--green)" : "var(--red)",
                }}
              >
                {q.myEssayText}
              </div>
            </div>
          ) : null}
          {(q.sampleAnswer || (q.correctOptions && q.correctOptions.length > 0)) ? (
            <div style={{ marginTop: 4 }}>
              <div
                className="essay-label"
                style={{ color: "var(--green)", marginBottom: 4 }}
              >
                Đáp án đúng
              </div>
              <div className="fb-fill-answer">
                {q.sampleAnswer || q.correctOptions.map((o) => o.text).join(", ")}
              </div>
            </div>
          ) : null}
        </>
      );
    }

    return (
      <>
        {q.myEssayText ? (
          <div className="essay-block mine">
            <div className="essay-label" style={{ color: "var(--text3)" }}>
              Bài làm của bạn
            </div>
            <div className="essay-text">{q.myEssayText}</div>
          </div>
        ) : null}
        {q.correctOptions && q.correctOptions.length > 0 && (
          <div className="essay-section">
            <div className="essay-label">Đáp án đúng:</div>
            <div className="essay-ans correct">
              {q.correctOptions.map((o) => o.text).join(", ")}
            </div>
          </div>
        )}
        {q.sampleAnswer ? (
          <div className="essay-block sample">
            <div className="essay-label" style={{ color: "var(--green-d)" }}>
              Đáp án mẫu / Hướng dẫn
            </div>
            <div className="essay-text">{q.sampleAnswer}</div>
          </div>
        ) : null}
        {q.teacherNote ? (
          <div className="teacher-note">
            <Ic.Edit
              width={14}
              height={14}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <span>
              <strong>Nhận xét GV:</strong> {q.teacherNote}
            </span>
          </div>
        ) : null}
        {!q.sampleAnswer && !q.teacherNote ? (
          <div
            style={{
              padding: "10px 12px",
              background: "var(--purple-l)",
              borderRadius: "var(--r-s)",
              fontSize: 12,
              color: "var(--purple)",
              fontWeight: 500,
            }}
          >
            Câu tự luận đang chờ giáo viên chấm điểm.
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div
      className={`qr-card${cardCls}`}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div className="qr-hdr" onClick={onToggle}>
        <div className={`qr-num ${numCls}`}>{index + 1}</div>
        {typeBadge}
        <span className="badge badge-cog">
          {COG_LABEL[q.cognitiveLevel] || q.cognitiveLevel}
        </span>
        <span className="qr-preview">{q.content || "Chưa có nội dung"}</span>
        <span className={`pts-chip ${numCls}`}>{ptsLabel}</span>
        <span className={`chev-icon${isOpen ? " open" : ""}`}>
          <Ic.ChevDown width={13} height={13} />
        </span>
      </div>

      {isOpen ? (
        <div className="qr-body">
          {q.content ? <div className="q-content-box">{q.content}</div> : null}
          {optionsBlock()}
        </div>
      ) : null}
    </div>
  );
};

const StudentAssignmentResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { submissionId } = useParams();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded] = useState(new Set());

  const classIdFromState = Number(location.state?.classId);
  const classIdFromResult = Number(result?.classroomId);
  const classIdForLayout =
    Number.isFinite(classIdFromState) && classIdFromState > 0
      ? classIdFromState
      : Number.isFinite(classIdFromResult) && classIdFromResult > 0
        ? classIdFromResult
        : null;

  useEffect(() => {
    if (!submissionId) return;

    let alive = true;
    setLoading(true);
    setError("");

    assignmentApi
      .getSubmissionResult(submissionId)
      .then((res) => {
        if (!alive) return;
        setResult(normalizeResult(res?.result || res));
      })
      .catch((err) => {
        if (!alive) return;
        const code = err?.response?.data?.code;
        const msg = err?.response?.data?.message;

        if (code === "RESULT_NOT_RELEASED_YET") {
          setError(
            "Kết quả chưa được công bố. Vui lòng chờ sau khi hết hạn nộp bài.",
          );
        } else if (code === "RESULT_NOT_VISIBLE") {
          setError("Bài tập này không cho phép xem lại kết quả.");
        } else {
          setError(msg || "Không thể tải kết quả bài thi.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [submissionId]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!result) return [];

    let qs = [...result.questions];

    if (activeTab === "wrong") {
      qs = qs.filter((q) => q.status !== "correct");
    }

    if (activeTab === "correct") {
      qs = qs.filter((q) => q.status === "correct");
    }

    if (activeTab === "essay") {
      qs = qs.filter((q) => q.type === "essay");
    }

    if (activeFilter === "correct") {
      qs = qs.filter((q) => q.status === "correct");
    }

    if (activeFilter === "wrong") {
      qs = qs.filter((q) => q.status !== "correct");
    }

    return qs;
  }, [result, activeTab, activeFilter]);

  const cogStats = useMemo(() => {
    if (!result) return [];

    const levels = [
      "REMEMBERING",
      "UNDERSTANDING",
      "APPLYING",
      "ANALYZING",
      "EVALUATING",
      "CREATING",
    ];

    return levels
      .map((lv) => {
        const qs = result.questions.filter((q) => q.cognitiveLevel === lv);
        if (!qs.length) return null;

        const correct = qs.filter((q) => q.status === "correct").length;

        return {
          level: lv,
          label: COG_LABEL[lv],
          correct,
          total: qs.length,
          pct: Math.round((correct / qs.length) * 100),
          color: COG_COLORS[lv],
        };
      })
      .filter(Boolean);
  }, [result]);

  const stateClassId = classIdForLayout;
  const stateAssignmentId = Number(
    location.state?.assignmentId || result?.assignmentId,
  );

  const canRetry =
    Number.isFinite(stateClassId) &&
    stateClassId > 0 &&
    Number.isFinite(stateAssignmentId) &&
    stateAssignmentId > 0;

  if (loading) {
    return (
      <ClassroomDetailLayout
        classIdOverride={classIdForLayout}
        activeMenuKeyOverride="assignments"
      >
        <div className="page">
          <style>{CSS}</style>
          <div className="max-w">
            <div className="state-box">
              <div className="state-icon">
                <Ic.File width={26} height={26} />
              </div>
              <div className="state-title">Đang tải kết quả...</div>
            </div>
          </div>
        </div>
      </ClassroomDetailLayout>
    );
  }

  if (error || !result) {
    return (
      <ClassroomDetailLayout
        classIdOverride={classIdForLayout}
        activeMenuKeyOverride="assignments"
      >
        <div className="page">
          <style>{CSS}</style>
          <div className="max-w">
            <div className="state-box">
              <div
                className="state-icon"
                style={{ background: "var(--red-l)", color: "var(--red)" }}
              >
                <Ic.X width={26} height={26} />
              </div>
              <div className="state-title" style={{ color: "var(--red)" }}>
                {error || "Không tìm thấy kết quả"}
              </div>
              <div className="state-text" style={{ marginBottom: 16 }}>
                Vui lòng quay lại và thử lại.
              </div>
              <button className="btn btn-g" onClick={() => navigate(-1)}>
                <Ic.ArrowLeft width={13} height={13} /> Quay lại
              </button>
            </div>
          </div>
        </div>
      </ClassroomDetailLayout>
    );
  }

  const pctByScore =
    result.totalScore > 0
      ? Math.round((result.myScore / result.totalScore) * 100)
      : 0;
  const pctByQuestion =
    result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const pct =
    result.totalScore > 0
      ? Math.max(0, Math.min(100, pctByScore))
      : Math.max(0, Math.min(100, pctByQuestion));

  const correctCount = result.questions.filter(
    (q) => q.status === "correct",
  ).length;
  const wrongCount = result.questions.filter(
    (q) => q.status !== "correct",
  ).length;

  return (
    <ClassroomDetailLayout
      classIdOverride={classIdForLayout}
      activeMenuKeyOverride="assignments"
    >
      <div className="page">
        <style>{CSS}</style>
        <div className="max-w">
          <div className="hero">
            <div className="score-ring-wrap">
              <ScoreRing
                myScore={result.myScore}
                totalScore={result.totalScore}
              />
            </div>

            <h1 className="hero-title">{result.title}</h1>
            <p className="hero-sub">
              {[
                result.className,
                result.subject,
                result.submittedAt
                  ? `Nộp lúc ${toDisplayDateTime(result.submittedAt)}`
                  : null,
              ]
                .filter(Boolean)
                .join(" - ")}
            </p>

            <div className="stat-chips">
              <div className="stat-chip">
                <div className="sc-val" style={{ color: "var(--green)" }}>
                  {result.correct}
                </div>
                <div className="sc-label">Câu đúng</div>
              </div>
              <div className="stat-chip">
                <div className="sc-val" style={{ color: "var(--red)" }}>
                  {result.wrong}
                </div>
                <div className="sc-label">Câu sai</div>
              </div>
              <div className="stat-chip">
                <div className="sc-val" style={{ color: "var(--amber)" }}>
                  {result.partial}
                </div>
                <div className="sc-label">Chờ chấm</div>
              </div>
              {result.durationMinutes > 0 ? (
                <div className="stat-chip">
                  <div className="sc-val" style={{ color: "var(--primary)" }}>
                    {result.usedMinutes}/{result.durationMinutes}
                  </div>
                  <div className="sc-label">Phút dùng</div>
                </div>
              ) : null}
              <div className="stat-chip">
                <div className="sc-val" style={{ color: "var(--text)" }}>
                  {pct}%
                </div>
                <div className="sc-label">Tỉ lệ đúng</div>
              </div>
            </div>
          </div>

          <div className="breakdown">
            {[
              {
                label: "Câu đúng",
                val: result.correct,
                total: result.total,
                color: "#10B981",
                bg: "#DCFCE7",
              },
              {
                label: "Câu sai",
                val: result.wrong,
                total: result.total,
                color: "#EF4444",
                bg: "#FEE2E2",
              },
              {
                label: "Tự luận",
                val: result.partial,
                total: result.total,
                color: "#8B5CF6",
                bg: "#EDE9FE",
              },
            ].map(({ label, val, total, color, bg }) => (
              <div key={label} className="bk-item">
                <div className="bk-val" style={{ color }}>
                  {val}
                  <span style={{ fontSize: 14, color: "var(--text3)" }}>
                    / {total}
                  </span>
                </div>
                <div className="bk-label">{label}</div>
                <div className="bk-bar" style={{ background: bg }}>
                  <div
                    className="bk-fill"
                    style={{
                      width: `${total > 0 ? Math.round((val / total) * 100) : 0}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {cogStats.length > 0 ? (
            <div className="section-card">
              <div className="section-title">
                <div
                  className="section-title-bar"
                  style={{ background: "var(--primary)" }}
                />
                Kết quả theo mức độ nhận thức
              </div>
              {cogStats.map((cs) => (
                <div key={cs.level} className="cog-row">
                  <span className="cog-label">{cs.label}</span>
                  <div className="cog-track">
                    <div
                      className="cog-fill"
                      style={{ width: `${cs.pct}%`, background: cs.color }}
                    />
                  </div>
                  <span className="cog-stat">
                    {cs.correct}/{cs.total} - {cs.pct}%
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {result.visibility === "SCORE_ONLY" ? (
            <div className="section-card" style={{ textAlign: "center", padding: "40px 24px" }}>
              <div className="state-icon" style={{ marginBottom: 12 }}>
                <Ic.File width={24} height={24} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>
                Bài tập này chỉ cho phép xem điểm số.
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                Chi tiết câu hỏi và đáp án không được hiển thị theo thiết lập của giáo viên.
              </div>
            </div>
          ) : (
            <>
              <div className="inner-tabs-wrap">
                <div className="inner-tabs">
                  {[
                    ["all", `Tất cả (${result.questions.length})`],
                    ["wrong", `Sai / Thiếu (${wrongCount})`],
                    ["correct", `Đúng (${correctCount})`],
                    [
                      "essay",
                      `Tự luận (${result.questions.filter((q) => q.type === "essay").length})`,
                    ],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={`itab${activeTab === key ? " active" : ""}`}
                      onClick={() => setActiveTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="filter-row">
                  {[
                    ["all", "Tất cả", ""],
                    ["correct", `${correctCount} Đúng`, "green-chip"],
                    ["wrong", `${wrongCount} Sai`, "red-chip"],
                  ].map(([key, label, chipCls]) => (
                    <button
                      key={key}
                      className={`fchip${activeFilter === key ? ` active ${chipCls}` : ""}`}
                      onClick={() => setActiveFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="qr-list">
                {filtered.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 0",
                      color: "var(--text3)",
                      fontSize: 13,
                    }}
                  >
                    Không có câu hỏi nào trong bộ lọc này.
                  </div>
                ) : (
                  filtered.map((q, idx) => (
                    <QuestionReviewCard
                      key={q.id}
                      q={q}
                      index={idx}
                      isOpen={expanded.has(q.id)}
                      onToggle={() => toggleExpand(q.id)}
                    />
                  ))
                )}
              </div>
            </>
          )}

          <div className="action-bar">
            <button
              className="btn btn-p"
              onClick={() => {
                if (canRetry) {
                  navigate(
                    PATH_STUDENT.classroom.assignmentDo(
                      stateClassId,
                      stateAssignmentId,
                    ),
                  );
                  return;
                }

                navigate(-1);
              }}
            >
              <Ic.Refresh width={13} height={13} /> Làm lại bài
            </button>
            <button className="btn btn-g">
              <Ic.Bookmark width={13} height={13} /> Lưu để ôn tập
            </button>
            <button
              className="btn btn-g"
              onClick={() => {
                if (Number.isFinite(stateClassId) && stateClassId > 0) {
                  navigate(PATH_STUDENT.classroom.assignments(stateClassId));
                  return;
                }

                navigate(-1);
              }}
            >
              <Ic.ArrowLeft width={13} height={13} /> Về danh sách bài
            </button>
          </div>
        </div>
      </div>
    </ClassroomDetailLayout>
  );
};

export default StudentAssignmentResultPage;
