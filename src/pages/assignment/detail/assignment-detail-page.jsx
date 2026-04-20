import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_TEACHER } from "@/routes/paths";

const normalizeStatus = (s) => {
  const v = String(s || "").toUpperCase();
  if (v === "PUBLISHED") return "published";
  if (v === "ARCHIVED") return "archived";
  return "draft";
};

const normalizeFormat = (f) => {
  const v = String(f || "").toUpperCase();
  if (v === "MULTIPLE_CHOICE" || v === "MC") return "mc";
  if (v === "ESSAY") return "essay";
  return "mixed";
};

const normalizeCategory = (c) =>
  String(c || "").toUpperCase() === "TEST" ? "test" : "homework";

const normalizeClassroomAssignmentStatus = (status) => {
  const value = String(status || "").toUpperCase();
  if (value.includes("REVOKE") || value.includes("UNASSIGN")) {
    return "revoked";
  }
  return "assigned";
};

const normalizeClassroomAssignment = (item, idx) => ({
  id: item?.id || `${item?.classroomId || idx}`,
  classroomId: String(item?.classroomId ?? item?.id ?? idx),
  classroomName:
    item?.classroomName || item?.name || `Lớp ${item?.classroomId || idx + 1}`,
  studentCount: Number(
    item?.studentCount ?? item?.numberOfStudents ?? item?.students ?? 0,
  ),
  assignedAt: item?.assignedAt || item?.createdAt || null,
  status: normalizeClassroomAssignmentStatus(item?.status),
});

const formatLabel = (f) =>
  f === "mc" ? "Trắc nghiệm" : f === "essay" ? "Tự luận" : "Hỗn hợp";

const statusLabel = (s) =>
  s === "published" ? "Xuất bản" : s === "archived" ? "Lưu trữ" : "Nháp";

const toDisplayDate = (v) => {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleDateString("vi-VN");
  } catch {
    return "-";
  }
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

const toOrderNumber = (value, fallback = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeRichText = (value) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const normalizeQuestion = (item, idx) => {
  const source =
    item && typeof item.question === "object" && item.question
      ? item.question
      : item;

  return {
    id: item?.id || item?.itemId || source?.id || idx,
    orderIndex: toOrderNumber(item?.orderIndex ?? source?.orderIndex, idx + 1),
    type: String(
      source?.questionType || source?.type || "MULTIPLE_CHOICE",
    ).toUpperCase(),
    content: normalizeRichText(source?.content || source?.prompt || ""),
    points: Number(
      item?.points ?? source?.defaultPoints ?? source?.points ?? 1,
    ),
    cognitiveLevel:
      source?.cognitiveLevel || item?.cognitiveLevel || "APPLYING",
    options: Array.isArray(source?.options)
      ? source.options.map((o) => ({
          text: normalizeRichText(o.content || o.text || ""),
          correct: Boolean(o.correct),
        }))
      : [],
    sampleAnswer: normalizeRichText(
      source?.sampleAnswer || item?.sampleAnswer || "",
    ),
  };
};

const toDetailAssignment = (item) => {
  const sectionQuestions = Array.isArray(item.sections)
    ? [...item.sections]
        .sort(
          (left, right) =>
            toOrderNumber(left?.orderIndex) - toOrderNumber(right?.orderIndex),
        )
        .flatMap((section) => {
          const questions = Array.isArray(section?.questions)
            ? section.questions
            : [];

          return [...questions].sort(
            (left, right) =>
              toOrderNumber(left?.orderIndex) -
              toOrderNumber(right?.orderIndex),
          );
        })
    : [];

  const normalizedQuestions = Array.isArray(item.questions)
    ? [...item.questions]
        .sort(
          (left, right) =>
            toOrderNumber(left?.orderIndex) - toOrderNumber(right?.orderIndex),
        )
        .map(normalizeQuestion)
    : sectionQuestions.map(normalizeQuestion);

  return {
    id: item.id,
    title: item.title || `Bài tập #${item.id}`,
    subject: item.subject || item.subjectName || "Chưa phân môn",
    category: normalizeCategory(item.category),
    format: normalizeFormat(item.format),
    status: normalizeStatus(item.status),
    totalScore: Number(item.totalScore ?? 0),
    questionCount: Number(
      item.numberOfQuestions ??
        item.questionCount ??
        normalizedQuestions.length ??
        0,
    ),
    duration:
      item?.setting?.durationMinutes ??
      item.durationMinutes ??
      item.duration ??
      null,
    startTime: item?.setting?.startTime ?? item.startTime ?? null,
    deadline: item?.setting?.deadline ?? item.deadline ?? null,
    password: item?.setting?.password ?? "",
    allowLateSubmission: item?.setting?.allowLateSubmission ?? false,
    shuffleQuestions: item?.setting?.shuffleQuestions ?? false,
    requireFullScreen: item?.setting?.requireFullScreen ?? false,
    limitTabs: item?.setting?.limitTabs ?? null,
    resultVisibility: item?.setting?.resultVisibility ?? "AFTER_SUBMIT",
    submissionFormats: item?.setting?.submissionFormats ?? ["ONLINE"],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    assignedClasses: Array.isArray(item.classroomIds)
      ? item.classroomIds.map(String)
      : Array.isArray(item.assignedClasses)
        ? item.assignedClasses.map(String)
        : [],
    submissions: Number(item.submissions ?? item.submissionCount ?? 0),
    avgScore: Number(item.avgScore ?? item.averageScore ?? 0),
    questions: normalizedQuestions,
    description: item.description || "",
  };
};

const COG_LABEL = {
  REMEMBERING: "Nhớ",
  UNDERSTANDING: "Hiểu",
  APPLYING: "Vận dụng",
  ANALYZING: "Phân tích",
  EVALUATING: "Đánh giá",
  CREATING: "Sáng tạo",
};

const LETTERS = "ABCDEFGHIJ";

const Ic = {
  ArrowLeft: () => (
    <svg
      width="16"
      height="16"
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
  Edit: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Share: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  ),
  Copy: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  Trash: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  Check: () => (
    <svg
      width="12"
      height="12"
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
      width="16"
      height="16"
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
  Clock: () => (
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
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Users: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  BarChart: () => (
    <svg
      width="14"
      height="14"
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
  FileText: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Shield: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Eye: () => (
    <svg
      width="14"
      height="14"
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
  Send: () => (
    <svg
      width="14"
      height="14"
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
  Calendar: () => (
    <svg
      width="13"
      height="13"
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
  ChevDown: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Award: () => (
    <svg
      width="16"
      height="16"
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
  Lock: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  Layers: () => (
    <svg
      width="14"
      height="14"
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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');

:root {
  --primary: #2563EB;
  --primary-dark: #1D4ED8;
  --primary-light: #EFF6FF;
  --primary-glow: rgba(37,99,235,0.10);
  --primary-shadow: rgba(37,99,235,0.22);
  --gradient: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
  --bg: #F7F8FC;
  --card: #FFFFFF;
  --sidebar-bg: #FAFBFE;
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
  --red: #EF4444;
  --red-l: #FEF2F2;
  --purple: #8B5CF6;
  --purple-l: #F5F3FF;
  --sky: #0EA5E9;
  --sky-l: #F0F9FF;
  --border: #E2E8F0;
  --border-l: #F1F5F9;
  --sh-s: 0 1px 3px rgba(30,41,59,0.04);
  --sh-m: 0 4px 14px rgba(30,41,59,0.07);
  --sh-l: 0 12px 40px rgba(30,41,59,0.11);
  --r-s: 10px;
  --r-m: 12px;
  --r-l: 16px;
  --r-xl: 20px;
  --font: 'Be Vietnam Pro', sans-serif;
  --font-d: 'Be Vietnam Pro', sans-serif;
  --ease: cubic-bezier(0.4,0,0.2,1);
}

*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font);background:var(--bg);color:var(--text)}
.page{padding:24px 28px 64px;min-height:100vh;font-family:var(--font);max-width:100%;overflow-x:hidden}
.breadcrumb{font-size:12px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.breadcrumb span{cursor:pointer;transition:color .15s}
.breadcrumb span:hover{color:var(--primary)}
.breadcrumb-sep{opacity:.4}
.detail-header{background:var(--card);border:1px solid var(--border);border-radius:var(--r-xl);padding:28px 32px;margin-bottom:20px;box-shadow:var(--sh-s);position:relative;overflow:hidden}
.detail-header::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:var(--gradient)}
.dh-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap}
.dh-left{flex:1;min-width:0}
.dh-badge-row{display:flex;align-items:center;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.badge{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase}
.badge-pub{background:var(--green-l);color:var(--green)}
.badge-draft{background:var(--orange-l);color:var(--orange)}
.badge-arch{background:var(--border-l);color:var(--text3)}
.badge-test{background:var(--primary-light);color:var(--primary)}
.badge-hw{background:var(--purple-l);color:var(--purple)}
.badge-subject{background:var(--sky-l);color:var(--sky)}
.dh-title{font-family:var(--font-d);font-size:26px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:14px}
.dh-meta{display:flex;flex-wrap:wrap;gap:18px;font-size:13px;color:var(--text3);font-weight:500}
.dh-meta-item{display:flex;align-items:center;gap:5px}
.dh-actions{display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;align-items:flex-start}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:var(--r-m);font-size:13px;font-weight:700;font-family:var(--font);cursor:pointer;border:none;transition:all .2s var(--ease);white-space:nowrap}
.btn-primary{background:var(--gradient);color:var(--inv);box-shadow:0 3px 12px var(--primary-shadow)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 5px 18px var(--primary-shadow)}
.btn-ghost{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.btn-ghost:hover{border-color:var(--primary);color:var(--primary);background:var(--hover)}
.btn-danger{background:var(--red-l);color:var(--red);border:1.5px solid rgba(239,68,68,.2)}
.btn-danger:hover{background:var(--red);color:var(--inv)}
.stats-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r-l);padding:20px 22px;box-shadow:var(--sh-s);position:relative;overflow:hidden;transition:all .2s var(--ease)}
.stat-card:hover{box-shadow:var(--sh-m);transform:translateY(-2px)}
.stat-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;border-radius:0 4px 4px 0}
.stat-card:nth-child(1)::before{background:var(--primary)}
.stat-card:nth-child(2)::before{background:var(--green)}
.stat-card:nth-child(3)::before{background:var(--orange)}
.stat-card:nth-child(4)::before{background:var(--purple)}
.stat-icon{width:40px;height:40px;border-radius:var(--r-m);display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.stat-card:nth-child(1) .stat-icon{background:var(--primary-light);color:var(--primary)}
.stat-card:nth-child(2) .stat-icon{background:var(--green-l);color:var(--green)}
.stat-card:nth-child(3) .stat-icon{background:var(--orange-l);color:var(--orange)}
.stat-card:nth-child(4) .stat-icon{background:var(--purple-l);color:var(--purple)}
.stat-val{font-size:28px;font-weight:800;color:var(--text);line-height:1;margin-bottom:4px}
.stat-label{font-size:12px;font-weight:600;color:var(--text3)}
.detail-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;align-items:start;min-width:0;max-width:100%}
.section-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r-l);overflow:hidden;box-shadow:var(--sh-s);margin-bottom:16px;min-width:0}
.section-hdr{padding:16px 22px;border-bottom:1px solid var(--border-l);display:flex;align-items:center;justify-content:space-between;background:var(--sidebar-bg)}
.section-title{font-size:14px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:7px}
.section-title-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.section-body{padding:20px 22px;min-width:0}
.q-list{display:flex;flex-direction:column;gap:10px;min-width:0}
.q-card{border:1.5px solid var(--border);border-radius:var(--r-m);overflow:hidden;transition:all .2s var(--ease);animation:cardIn .3s ease-out both;min-width:0;max-width:100%}
.q-card:hover{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-glow),var(--sh-m)}
@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.q-card-hdr{padding:12px 16px;display:flex;align-items:flex-start;gap:10px;cursor:pointer;background:var(--sidebar-bg);border-bottom:1px solid var(--border-l);user-select:none;min-width:0;max-width:100%;overflow:hidden}
.q-card-hdr:hover{background:var(--hover)}
.q-num{width:28px;height:28px;border-radius:50%;background:var(--primary);color:var(--inv);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.q-type-badge{padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;flex-shrink:0}
.q-type-mc{background:var(--primary-light);color:var(--primary)}
.q-type-tf{background:var(--green-l);color:var(--green)}
.q-type-fb{background:var(--orange-l);color:var(--orange)}
.q-type-es{background:var(--purple-l);color:var(--purple)}
.q-cog-badge{padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:var(--border-l);color:var(--text3);flex-shrink:0}
.q-content-preview{flex:1;display:block;min-width:0;max-width:100%;font-size:12px;font-weight:600;color:var(--text);white-space:normal;overflow:hidden;overflow-wrap:anywhere;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.q-content-preview.empty{color:var(--text3);font-style:italic;font-weight:400}
.q-pts{font-size:11px;font-weight:700;color:var(--primary);background:var(--primary-light);padding:2px 8px;border-radius:10px;white-space:nowrap;flex-shrink:0}
.q-chev{color:var(--text3);transition:transform .2s var(--ease);flex-shrink:0}
.q-chev.open{transform:rotate(180deg)}
.q-card-body{padding:16px 18px}
.q-full-content{font-size:13px;color:var(--text);line-height:1.7;margin-bottom:14px;padding:12px 14px;background:var(--input-bg);border-radius:var(--r-s);border-left:3px solid var(--primary);white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
.q-opts{display:flex;flex-direction:column;gap:7px}
.q-opt-row{display:flex;align-items:center;gap:8px;padding:8px 12px;border:1.5px solid var(--border);border-radius:var(--r-s);font-size:12px;color:var(--text2)}
.q-opt-row.correct{border-color:var(--green);background:var(--green-l);color:var(--green)}
.q-opt-letter{width:22px;height:22px;border-radius:6px;background:var(--border-l);font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--text3);flex-shrink:0}
.q-opt-row.correct .q-opt-letter{background:var(--green);color:var(--inv)}
.q-opt-check{width:18px;height:18px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.q-opt-row.correct .q-opt-check{border-color:var(--green);background:var(--green);color:var(--inv)}
.q-opt-text{flex:1;font-size:12px;min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
.q-tf-row{display:flex;gap:8px}
.q-tf-btn{flex:1;padding:10px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:13px;font-weight:700;text-align:center;background:var(--card);color:var(--text3)}
.q-tf-btn.correct{border-color:var(--green);background:var(--green-l);color:var(--green)}
.q-sample-ans{padding:10px 14px;background:var(--input-bg);border-radius:var(--r-s);font-size:12px;color:var(--text2);line-height:1.6;border-left:3px solid var(--purple);white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
.q-ans-label{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.settings-grid{display:flex;flex-direction:column;gap:0}
.setting-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--border-l)}
.setting-row:last-child{border-bottom:none}
.setting-key{font-size:12px;color:var(--text3);font-weight:600;display:flex;align-items:center;gap:5px}
.setting-val{font-size:12px;font-weight:700;color:var(--text);text-align:right}
.setting-val.on{color:var(--green)}
.setting-val.off{color:var(--text3)}
.cls-list-wrap{display:flex;flex-direction:column;gap:8px;padding:14px 22px}
.cls-row-detail{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:var(--r-s);border:1px solid var(--border-l);background:var(--card)}
.cls-main{min-width:0;display:flex;flex-direction:column;gap:4px}
.cls-name-line{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.cls-name{font-size:12px;font-weight:700;color:var(--text)}
.cls-meta-line{display:flex;align-items:center;gap:10px;font-size:11px;font-weight:600;color:var(--text3);flex-wrap:wrap}
.cls-status{padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;white-space:nowrap}
.cls-status.assigned{background:var(--green-l);color:var(--green)}
.cls-status.revoked{background:var(--red-l);color:var(--red)}
.cls-view-btn{padding:6px 10px !important;font-size:11px !important;white-space:nowrap}
.no-cls{padding:20px 22px;font-size:13px;color:var(--text3);font-style:italic}
.score-bar-wrap{display:flex;align-items:center;gap:10px;margin-top:4px}
.score-bar-track{flex:1;height:6px;background:var(--border-l);border-radius:6px;overflow:hidden}
.score-bar-fill{height:100%;border-radius:6px;background:var(--gradient);transition:width .8s var(--ease)}
.score-bar-label{font-size:12px;font-weight:700;color:var(--text2);min-width:55px;text-align:right}
.fmt-chips-row{display:flex;gap:5px;flex-wrap:wrap}
.fmt-chip{padding:2px 9px;border-radius:10px;font-size:10px;font-weight:700;background:var(--sky-l);color:var(--sky)}
.inner-tabs{display:flex;gap:2px;padding:14px 22px 0;border-bottom:1px solid var(--border-l)}
.inner-tab{padding:8px 16px;font-size:12px;font-weight:700;font-family:var(--font);color:var(--text3);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s var(--ease)}
.inner-tab.active{color:var(--primary);border-bottom-color:var(--primary)}
.inner-tab:hover:not(.active){color:var(--text2)}
.toast{position:fixed;bottom:28px;right:28px;padding:13px 22px;border-radius:var(--r-m);font-size:13px;font-weight:600;font-family:var(--font);box-shadow:var(--sh-l);z-index:2000;display:flex;align-items:center;gap:8px;animation:toastIn .2s ease}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.toast.success{background:var(--green);color:var(--inv)}
.toast.info{background:var(--primary);color:var(--inv)}
.toast.error{background:var(--red);color:var(--inv)}
.modal-overlay{position:fixed;inset:0;background:rgba(30,41,59,.45);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal-box{background:var(--card);border-radius:var(--r-xl);padding:0;max-width:440px;width:94%;box-shadow:var(--sh-l);overflow:hidden;animation:ms .25s ease}
@keyframes ms{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.modal-body-center{padding:36px 32px;text-align:center}
.confirm-icon{width:60px;height:60px;border-radius:50%;margin:0 auto 18px;display:flex;align-items:center;justify-content:center}
.confirm-title{font-family:var(--font-d);font-size:20px;font-weight:700;margin-bottom:8px}
.confirm-text{font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:24px}
.confirm-btns{display:flex;gap:10px;justify-content:center}
.edit-mode-modal{max-width:600px;width:95%}
.edit-mode-hero{padding:20px;border-radius:14px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE 45%,#E0E7FF);border:1px solid rgba(37,99,235,.14);margin-bottom:12px;text-align:left}
.edit-mode-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:#FFFFFF;border:1px solid rgba(37,99,235,.18);font-size:10px;font-weight:800;color:var(--primary-dark);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px}
.edit-mode-title{font-family:var(--font-d);font-size:24px;font-weight:700;color:var(--text);line-height:1.28;margin-bottom:6px}
.edit-mode-sub{font-size:13px;color:var(--text2);line-height:1.6}
.edit-choice-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px}
.edit-choice-btn{width:100%;border:1.5px solid var(--border);border-radius:14px;background:var(--card);padding:14px 16px;text-align:left;cursor:pointer;transition:all .2s var(--ease);position:relative;overflow:hidden}
.edit-choice-btn::after{content:'';position:absolute;top:0;left:0;width:4px;height:100%;opacity:.85}
.edit-choice-btn:hover{transform:translateY(-2px);box-shadow:var(--sh-m)}
.edit-choice-btn.setup::after{background:linear-gradient(180deg,#0EA5E9,#2563EB)}
.edit-choice-btn.setup:hover{border-color:#60A5FA;background:#F8FBFF}
.edit-choice-btn.questions::after{background:linear-gradient(180deg,#10B981,#22C55E)}
.edit-choice-btn.questions:hover{border-color:#6EE7B7;background:#F7FFF9}
.edit-choice-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}
.edit-choice-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.edit-choice-btn.setup .edit-choice-icon{background:#E0F2FE;color:#0369A1}
.edit-choice-btn.questions .edit-choice-icon{background:#DCFCE7;color:#047857}
.edit-choice-tag{padding:4px 9px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.03em;text-transform:uppercase}
.edit-choice-btn.setup .edit-choice-tag{background:#EFF6FF;color:#1D4ED8}
.edit-choice-btn.questions .edit-choice-tag{background:#ECFDF5;color:#047857}
.edit-choice-title{font-size:14px;font-weight:800;color:var(--text);margin-bottom:4px}
.edit-choice-desc{font-size:12px;color:var(--text2);line-height:1.5}
.loading-state{text-align:center;padding:60px 20px;background:var(--card);border:1px solid var(--border);border-radius:var(--r-l)}
.loading-title{font-family:var(--font-d);font-size:18px;font-weight:700;color:var(--text3);margin-bottom:6px}
@media(max-width:1280px){.detail-grid{grid-template-columns:1fr}}
@media(max-width:900px){.stats-row{grid-template-columns:repeat(2,1fr)}.dh-top{flex-direction:column}.dh-actions{width:100%;justify-content:flex-start}}
@media(max-width:640px){.page{padding:14px 12px 48px}.stats-row{grid-template-columns:1fr}.dh-title{font-size:20px}.detail-header{padding:20px 18px}}
`;

const QuestionCard = ({ q, index }) => {
  const [open, setOpen] = useState(false);

  const typeClass =
    q.type === "MULTIPLE_CHOICE"
      ? "q-type-mc"
      : q.type === "TRUE_FALSE"
        ? "q-type-tf"
        : q.type === "FILL_IN_THE_BLANK"
          ? "q-type-fb"
          : "q-type-es";

  const typeShort =
    q.type === "MULTIPLE_CHOICE"
      ? "Trắc nghiệm"
      : q.type === "TRUE_FALSE"
        ? "Đúng/Sai"
        : q.type === "FILL_IN_THE_BLANK"
          ? "Điền khuyết"
          : "Tự luận";

  return (
    <div className="q-card" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="q-card-hdr" onClick={() => setOpen((p) => !p)}>
        <div className="q-num">{index + 1}</div>
        <span className={`q-type-badge ${typeClass}`}>{typeShort}</span>
        <span className="q-cog-badge">
          {COG_LABEL[String(q.cognitiveLevel || "").toUpperCase()] ||
            q.cognitiveLevel}
        </span>
        <span className={`q-content-preview${!q.content ? " empty" : ""}`}>
          {q.content || "Chưa có nội dung"}
        </span>
        <span className="q-pts">{q.points} đ</span>
        <span className={`q-chev${open ? " open" : ""}`}>
          <Ic.ChevDown />
        </span>
      </div>

      {open && (
        <div className="q-card-body">
          {q.content && <div className="q-full-content">{q.content}</div>}

          {q.type === "MULTIPLE_CHOICE" && q.options.length > 0 && (
            <div className="q-opts">
              {q.options.map((opt, oi) => (
                <div
                  key={oi}
                  className={`q-opt-row${opt.correct ? " correct" : ""}`}
                >
                  <div className="q-opt-check">
                    {opt.correct && <Ic.Check />}
                  </div>
                  <div className="q-opt-letter">{LETTERS[oi]}</div>
                  <span className="q-opt-text">{opt.text || "(trống)"}</span>
                </div>
              ))}
            </div>
          )}

          {q.type === "TRUE_FALSE" && (
            <div className="q-tf-row">
              {[true, false].map((val) => {
                const isCorrect = q.options.find(
                  (o) =>
                    o.text?.toLowerCase() === (val ? "đúng" : "sai") &&
                    o.correct,
                );
                return (
                  <div
                    key={String(val)}
                    className={`q-tf-btn${isCorrect ? " correct" : ""}`}
                  >
                    {val ? "Đúng" : "Sai"}
                    {isCorrect && " ✓"}
                  </div>
                );
              })}
            </div>
          )}

          {(q.type === "ESSAY" || q.type === "FILL_IN_THE_BLANK") &&
          q.sampleAnswer ? (
            <div>
              <div className="q-ans-label">Đáp án mẫu</div>
              <div className="q-sample-ans">{q.sampleAnswer}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default function AssignmentDetailPage() {
  const navigate = useNavigate();
  const { id: assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [classroomAssignments, setClassroomAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModeModal, setEditModeModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [qTab, setQTab] = useState("all");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!assignmentId) return;
    let alive = true;
    setLoading(true);
    setError("");
    setClassroomAssignments([]);

    Promise.all([
      assignmentApi.getAssignmentById(assignmentId),
      assignmentApi
        .getClassroomAssignments(assignmentId)
        .catch(() => ({ result: [] })),
    ])
      .then(([res, classroomRes]) => {
        if (!alive) return;
        const data = res?.result || res;
        setAssignment(toDetailAssignment(data || {}));

        const list = Array.isArray(classroomRes?.result?.content)
          ? classroomRes.result.content
          : Array.isArray(classroomRes?.result)
            ? classroomRes.result
            : [];

        setClassroomAssignments(list.map(normalizeClassroomAssignment));
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.message || "Không thể tải bài tập.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [assignmentId]);

  const handleDelete = async () => {
    try {
      await assignmentApi.deleteAssignment(assignmentId);
      showToast("Đã xóa bài tập");
      setTimeout(() => navigate(PATH_TEACHER.assignments), 800);
    } catch (err) {
      showToast(err?.response?.data?.message || "Xóa thất bại", "error");
    } finally {
      setDeleteModal(false);
    }
  };

  const handleOpenEditModeModal = () => {
    setEditModeModal(true);
  };

  const handleEditRawAssignment = () => {
    if (!assignment?.id) return;
    setEditModeModal(false);
    navigate(
      `${PATH_TEACHER.assignmentCreateManual}?assignmentId=${assignment.id}`,
    );
  };

  const handleEditQuestions = () => {
    if (!assignment?.id) return;

    const formatParam =
      assignment.format === "mc" ? "multiple_choice" : assignment.format;
    const params = new URLSearchParams({
      assignmentId: String(assignment.id),
      format: String(formatParam || "mixed"),
      category: String(assignment.category || "homework"),
      status: String(assignment.status || "draft"),
    });

    setEditModeModal(false);
    navigate(
      `${PATH_TEACHER.assignmentCreateManualQuestions}?${params.toString()}`,
    );
  };

  const handleViewClassSubmissions = (classroom) => {
    if (!assignment?.id || !classroom?.classroomId) return;

    const params = new URLSearchParams({
      classroomId: String(classroom.classroomId),
    });

    if (classroom.classroomName) {
      params.set("classroomName", classroom.classroomName);
    }

    navigate(
      `${PATH_TEACHER.assignmentSubmissions(assignment.id)}?${params.toString()}`,
    );
  };

  const filteredQuestions = assignment
    ? qTab === "all"
      ? assignment.questions
      : assignment.questions.filter((q) => {
          if (qTab === "mc") return q.type === "MULTIPLE_CHOICE";
          if (qTab === "tf") return q.type === "TRUE_FALSE";
          if (qTab === "fb") return q.type === "FILL_IN_THE_BLANK";
          if (qTab === "essay") return q.type === "ESSAY";
          return true;
        })
    : [];

  const qTypeCounts = assignment
    ? {
        mc: assignment.questions.filter((q) => q.type === "MULTIPLE_CHOICE")
          .length,
        tf: assignment.questions.filter((q) => q.type === "TRUE_FALSE").length,
        fb: assignment.questions.filter((q) => q.type === "FILL_IN_THE_BLANK")
          .length,
        essay: assignment.questions.filter((q) => q.type === "ESSAY").length,
      }
    : {};

  const scorePercent =
    assignment && assignment.totalScore > 0
      ? Math.min(100, (assignment.avgScore / assignment.totalScore) * 100)
      : 0;

  if (loading) {
    return (
      <div className="page">
        <style>{CSS}</style>
        <div className="loading-state">
          <div className="loading-title">Đang tải bài tập...</div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="page">
        <style>{CSS}</style>
        <div className="loading-state">
          <div className="loading-title" style={{ color: "var(--red)" }}>
            {error || "Không tìm thấy bài tập"}
          </div>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 16 }}
            onClick={() => navigate(PATH_TEACHER.assignments)}
          >
            <Ic.ArrowLeft /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <style>{CSS}</style>

      <div className="breadcrumb">
        <span onClick={() => navigate(PATH_TEACHER.assignments)}>
          Thư viện bài tập
        </span>
        <span className="breadcrumb-sep">›</span>
        <span style={{ color: "var(--text2)" }}>Chi tiết bài tập</span>
      </div>

      <div className="detail-header">
        <div className="dh-top">
          <div className="dh-left">
            <div className="dh-badge-row">
              <span
                className={`badge ${
                  assignment.status === "published"
                    ? "badge-pub"
                    : assignment.status === "draft"
                      ? "badge-draft"
                      : "badge-arch"
                }`}
              >
                {statusLabel(assignment.status)}
              </span>
              <span
                className={`badge ${assignment.category === "test" ? "badge-test" : "badge-hw"}`}
              >
                {assignment.category === "test" ? "Kiểm tra" : "Bài tập"}
              </span>
              <span className="badge badge-subject">{assignment.subject}</span>
            </div>
            <div className="dh-title">{assignment.title}</div>
            <div className="dh-meta">
              <span className="dh-meta-item">
                <Ic.FileText /> {assignment.questionCount} câu hỏi
              </span>
              <span className="dh-meta-item">
                <Ic.BarChart /> {formatLabel(assignment.format)}
              </span>
              {assignment.duration ? (
                <span className="dh-meta-item">
                  <Ic.Clock /> {assignment.duration} phút
                </span>
              ) : null}
              <span className="dh-meta-item">
                <Ic.Calendar /> Cập nhật{" "}
                {toDisplayDate(assignment.updatedAt || assignment.createdAt)}
              </span>
              <span className="dh-meta-item">
                <Ic.Users /> {assignment.submissions} lượt nộp
              </span>
            </div>
          </div>

          <div className="dh-actions">
            <button
              className="btn btn-ghost"
              onClick={() => navigate(PATH_TEACHER.assignments)}
            >
              <Ic.ArrowLeft /> Quay lại
            </button>
            <button className="btn btn-ghost" onClick={handleOpenEditModeModal}>
              <Ic.Edit /> Chỉnh sửa
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                navigate(PATH_TEACHER.assignmentAssignClasses(assignment.id))
              }
            >
              <Ic.Share /> Giao bài
            </button>
            <button
              className="btn btn-danger"
              onClick={() => setDeleteModal(true)}
            >
              <Ic.Trash /> Xóa
            </button>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.FileText />
          </div>
          <div className="stat-val">{assignment.questionCount}</div>
          <div className="stat-label">Tổng câu hỏi</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.Users />
          </div>
          <div className="stat-val">{assignment.submissions}</div>
          <div className="stat-label">Lượt nộp bài</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.Award />
          </div>
          <div className="stat-val">
            {assignment.submissions > 0
              ? `${assignment.avgScore}/${assignment.totalScore}`
              : "-"}
          </div>
          <div className="stat-label">Điểm trung bình</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.Layers />
          </div>
          <div className="stat-val">{classroomAssignments.length}</div>
          <div className="stat-label">Lớp được giao</div>
        </div>
      </div>

      {assignment.submissions > 0 ? (
        <div className="section-card" style={{ marginBottom: 16 }}>
          <div className="section-hdr">
            <div className="section-title">
              <div
                className="section-title-icon"
                style={{
                  background: "var(--orange-l)",
                  color: "var(--orange)",
                }}
              >
                <Ic.BarChart />
              </div>
              Thống kê điểm số
            </div>
          </div>
          <div className="section-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{ fontSize: 13, color: "var(--text3)", fontWeight: 600 }}
              >
                Điểm trung bình
              </span>
              <span
                style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}
              >
                {assignment.avgScore} / {assignment.totalScore} điểm
              </span>
            </div>
            <div className="score-bar-wrap">
              <div className="score-bar-track">
                <div
                  className="score-bar-fill"
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div className="score-bar-label">{Math.round(scorePercent)}%</div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="detail-grid">
        <div>
          <div className="section-card">
            <div className="section-hdr">
              <div className="section-title">
                <div
                  className="section-title-icon"
                  style={{
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                  }}
                >
                  <Ic.Layers />
                </div>
                Danh sách câu hỏi
              </div>
              <span
                style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)" }}
              >
                {assignment.questions.length} câu · {assignment.totalScore} điểm
              </span>
            </div>

            <div className="inner-tabs">
              {[
                ["all", `Tất cả (${assignment.questions.length})`],
                ...(qTypeCounts.mc ? [["mc", `TN (${qTypeCounts.mc})`]] : []),
                ...(qTypeCounts.tf ? [["tf", `Đ/S (${qTypeCounts.tf})`]] : []),
                ...(qTypeCounts.fb ? [["fb", `ĐK (${qTypeCounts.fb})`]] : []),
                ...(qTypeCounts.essay
                  ? [["essay", `TL (${qTypeCounts.essay})`]]
                  : []),
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`inner-tab${qTab === key ? " active" : ""}`}
                  onClick={() => setQTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="section-body">
              {filteredQuestions.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: "var(--text3)",
                    fontSize: 13,
                  }}
                >
                  Không có câu hỏi nào.
                </div>
              ) : (
                <div className="q-list">
                  {filteredQuestions.map((q, idx) => (
                    <QuestionCard key={q.id} q={q} index={idx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="section-card">
            <div className="section-hdr">
              <div className="section-title">
                <div
                  className="section-title-icon"
                  style={{ background: "var(--sky-l)", color: "var(--sky)" }}
                >
                  <Ic.Users />
                </div>
                Lớp học được giao
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: "5px 12px", fontSize: 11 }}
                onClick={() =>
                  navigate(PATH_TEACHER.assignmentAssignClasses(assignment.id))
                }
              >
                <Ic.Share /> Giao thêm
              </button>
            </div>
            {classroomAssignments.length === 0 ? (
              <div className="no-cls">Chưa giao cho lớp nào.</div>
            ) : (
              <div className="cls-list-wrap">
                {classroomAssignments.map((classroom) => {
                  return (
                    <div key={classroom.id} className="cls-row-detail">
                      <div className="cls-main">
                        <div className="cls-name-line">
                          <span className="cls-name">
                            {classroom.classroomName}
                          </span>
                          <span
                            className={`cls-status ${
                              classroom.status === "revoked"
                                ? "revoked"
                                : "assigned"
                            }`}
                          >
                            {classroom.status === "revoked"
                              ? "Đã thu hồi"
                              : "Đã giao"}
                          </span>
                        </div>

                        <div className="cls-meta-line">
                          {classroom.studentCount > 0 ? (
                            <span>{classroom.studentCount} học sinh</span>
                          ) : null}
                          {classroom.assignedAt ? (
                            <span>
                              Giao {toDisplayDateTime(classroom.assignedAt)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        className="btn btn-ghost cls-view-btn"
                        onClick={() => handleViewClassSubmissions(classroom)}
                      >
                        <Ic.Eye /> View
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="section-card">
            <div className="section-hdr">
              <div className="section-title">
                <div
                  className="section-title-icon"
                  style={{
                    background: "var(--orange-l)",
                    color: "var(--orange)",
                  }}
                >
                  <Ic.Clock />
                </div>
                Thời gian & Cài đặt
              </div>
            </div>
            <div className="section-body">
              <div className="settings-grid">
                <div className="setting-row">
                  <span className="setting-key">
                    <Ic.Calendar /> Bắt đầu
                  </span>
                  <span className="setting-val">
                    {toDisplayDateTime(assignment.startTime)}
                  </span>
                </div>
                <div className="setting-row">
                  <span className="setting-key">
                    <Ic.Calendar /> Hạn nộp
                  </span>
                  <span className="setting-val">
                    {toDisplayDateTime(assignment.deadline)}
                  </span>
                </div>
                <div className="setting-row">
                  <span className="setting-key">
                    <Ic.Clock /> Thời lượng
                  </span>
                  <span className="setting-val">
                    {assignment.duration ? `${assignment.duration} phút` : "-"}
                  </span>
                </div>
                <div className="setting-row">
                  <span className="setting-key">
                    <Ic.Lock /> Mật khẩu
                  </span>
                  <span className="setting-val">
                    {assignment.password ? "Có mật khẩu" : "Không"}
                  </span>
                </div>
                <div className="setting-row">
                  <span className="setting-key">
                    <Ic.Eye /> Xem kết quả
                  </span>
                  <span className="setting-val" style={{ fontSize: 11 }}>
                    {assignment.resultVisibility === "AFTER_SUBMIT"
                      ? "Sau khi nộp"
                      : assignment.resultVisibility === "AFTER_DEADLINE"
                        ? "Sau hạn chót"
                        : assignment.resultVisibility === "NEVER"
                          ? "Không hiển thị"
                          : "Thủ công"}
                  </span>
                </div>
                <div className="setting-row">
                  <span className="setting-key">
                    <Ic.FileText /> Hình thức nộp
                  </span>
                  <div className="fmt-chips-row">
                    {(assignment.submissionFormats || []).map((f) => (
                      <span key={f} className="fmt-chip">
                        {f === "ONLINE"
                          ? "Online"
                          : f === "OFFLINE"
                            ? "Offline"
                            : "Giấy"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {[
                  ["Xáo trộn câu hỏi", assignment.shuffleQuestions],
                  ["Cho phép nộp muộn", assignment.allowLateSubmission],
                  ["Yêu cầu toàn màn hình", assignment.requireFullScreen],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="setting-row"
                    style={{ paddingTop: 6, paddingBottom: 6 }}
                  >
                    <span className="setting-key">
                      <Ic.Shield /> {label}
                    </span>
                    <span className={`setting-val ${val ? "on" : "off"}`}>
                      {val ? "Bật" : "Tắt"}
                    </span>
                  </div>
                ))}
                {assignment.limitTabs != null && assignment.limitTabs !== "" ? (
                  <div
                    className="setting-row"
                    style={{ paddingTop: 6, paddingBottom: 6 }}
                  >
                    <span className="setting-key">
                      <Ic.Shield /> Giới hạn tab
                    </span>
                    <span className="setting-val">
                      {assignment.limitTabs} lần
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="section-hdr">
              <div className="section-title">
                <div
                  className="section-title-icon"
                  style={{
                    background: "var(--purple-l)",
                    color: "var(--purple)",
                  }}
                >
                  <Ic.Send />
                </div>
                Thao tác nhanh
              </div>
            </div>
            <div
              className="section-body"
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() =>
                  navigate(PATH_TEACHER.assignmentAssignClasses(assignment.id))
                }
              >
                <Ic.Share /> Giao bài cho lớp
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleOpenEditModeModal}
              >
                <Ic.Edit /> Chỉnh sửa bài tập
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast("Đã sao chép đường dẫn", "info");
                }}
              >
                <Ic.Copy /> Sao chép đường dẫn
              </button>
              <button
                className="btn btn-danger"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setDeleteModal(true)}
              >
                <Ic.Trash /> Xóa bài tập
              </button>
            </div>
          </div>
        </div>
      </div>

      {deleteModal ? (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body-center">
              <div
                className="confirm-icon"
                style={{ background: "var(--red-l)", color: "var(--red)" }}
              >
                <Ic.Trash />
              </div>
              <div className="confirm-title">Xóa bài tập?</div>
              <div className="confirm-text">
                Bạn có chắc muốn xóa <strong>"{assignment.title}"</strong>?
                {assignment.submissions > 0 ? (
                  <>
                    {" "}
                    Bài tập này đã có <strong>
                      {assignment.submissions}
                    </strong>{" "}
                    lượt nộp bài.
                  </>
                ) : null}
                <br />
                Hành động này không thể hoàn tác.
              </div>
              <div className="confirm-btns">
                <button
                  className="btn btn-ghost"
                  onClick={() => setDeleteModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="btn"
                  style={{
                    background: "var(--red)",
                    color: "var(--inv)",
                    boxShadow: "0 3px 12px rgba(239,68,68,.25)",
                  }}
                  onClick={handleDelete}
                >
                  <Ic.Trash /> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editModeModal ? (
        <div className="modal-overlay" onClick={() => setEditModeModal(false)}>
          <div
            className="modal-box edit-mode-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-body-center">
              <div className="edit-mode-hero">
                <div className="edit-mode-badge">
                  <Ic.Edit /> Chỉnh sửa bài tập
                </div>
                <div className="edit-mode-title">
                  Chọn kiểu chỉnh sửa phù hợp
                </div>
                <div className="edit-mode-sub">
                  Bạn có thể chỉnh nhanh thông tin bài tập hoặc đi vào màn hình
                  chỉnh sửa câu hỏi với auto save.
                </div>
              </div>

              <div className="edit-choice-grid">
                <button
                  className="edit-choice-btn setup"
                  onClick={handleEditRawAssignment}
                >
                  <div className="edit-choice-top">
                    <div className="edit-choice-icon">
                      <Ic.FileText />
                    </div>
                    <div className="edit-choice-tag">Thiết lập</div>
                  </div>
                  <div className="edit-choice-title">
                    Sửa phần thô assignment
                  </div>
                  <div className="edit-choice-desc">
                    Mở màn hình setup để sửa title, mô tả, category, format và
                    cấu hình hiện tại.
                  </div>
                </button>

                <button
                  className="edit-choice-btn questions"
                  onClick={handleEditQuestions}
                >
                  <div className="edit-choice-top">
                    <div className="edit-choice-icon">
                      <Ic.Layers />
                    </div>
                    <div className="edit-choice-tag">Nội dung đề</div>
                  </div>
                  <div className="edit-choice-title">
                    Sửa câu hỏi trong assignment
                  </div>
                  <div className="edit-choice-desc">
                    Mở màn hình soạn thủ công để thêm, sửa, xóa câu hỏi và tự
                    động lưu mỗi thay đổi.
                  </div>
                </button>
              </div>

              <div className="confirm-btns" style={{ marginTop: 14 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setEditModeModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`toast ${toast.type}`}>
          <Ic.Check /> {toast.msg}
        </div>
      ) : null}
    </div>
  );
}
