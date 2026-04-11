import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_TEACHER } from "@/routes/paths";

const COG_SHORT = [
  { v: "REMEMBER", l: "Nhớ" },
  { v: "UNDERSTAND", l: "Hiểu" },
  { v: "APPLY", l: "Vận dụng" },
  { v: "ANALYZE", l: "Phân tích" },
  { v: "EVALUATE", l: "Đánh giá" },
  { v: "CREATE", l: "Sáng tạo" },
];

const Q_TYPES = [
  { v: "MULTIPLE_CHOICE", l: "Trắc nghiệm", ic: "MC" },
  { v: "TRUE_FALSE", l: "Đúng / Sai", ic: "TF" },
  { v: "FILL_IN_BLANK", l: "Điền khuyết", ic: "FB" },
  { v: "ESSAY", l: "Tự luận", ic: "ES" },
];

const LETTERS = "ABCDEFGHIJ";

const API_TYPE_MAP = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  FILL_IN_BLANK: "FILL_IN_THE_BLANK",
  ESSAY: "ESSAY",
};

const API_COG_MAP = {
  REMEMBER: "REMEMBERING",
  UNDERSTAND: "UNDERSTANDING",
  APPLY: "APPLYING",
  ANALYZE: "ANALYZING",
  EVALUATE: "EVALUATING",
  CREATE: "CREATING",
};

const UI_COG_MAP = {
  REMEMBERING: "REMEMBER",
  UNDERSTANDING: "UNDERSTAND",
  APPLYING: "APPLY",
  ANALYZING: "ANALYZE",
  EVALUATING: "EVALUATE",
  CREATING: "CREATE",
};

const makeOption = () => ({ id: Date.now() + Math.random(), text: "" });

const makeQuestion = (type = "MULTIPLE_CHOICE") => ({
  id: Date.now() + Math.random(),
  type,
  sectionId: null,
  prompt: "",
  points: 1,
  cogLevel: "APPLY",
  options:
    type === "MULTIPLE_CHOICE"
      ? [makeOption(), makeOption(), makeOption(), makeOption()]
      : [],
  correct:
    type === "TRUE_FALSE" ? null : type === "MULTIPLE_CHOICE" ? -1 : undefined,
  answer: "",
  collapsed: false,
});

const normalizeType = (rawType) => {
  const type = String(rawType || "").toUpperCase();
  if (type === "MULTIPLE_CHOICE") return "MULTIPLE_CHOICE";
  if (type === "TRUE_FALSE") return "TRUE_FALSE";
  if (type === "FILL_IN_THE_BLANK" || type === "FILL_IN_BLANK") {
    return "FILL_IN_BLANK";
  }
  if (type === "ESSAY") return "ESSAY";
  return "MULTIPLE_CHOICE";
};

const FORMAT_MODE = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  ESSAY: "ESSAY",
  MIXED: "MIXED",
};

const SECTION_TYPE = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  ESSAY: "ESSAY",
};

const normalizeSectionType = (rawType) => {
  const type = String(rawType || "").toUpperCase();
  if (type === "MULTIPLE_CHOICE" || type === "MC") {
    return SECTION_TYPE.MULTIPLE_CHOICE;
  }
  if (type === "ESSAY") return SECTION_TYPE.ESSAY;
  return null;
};

const normalizeFormatMode = (rawFormat) => {
  const value = String(rawFormat || "")
    .trim()
    .toUpperCase();
  if (value === "MC" || value === "MULTIPLE_CHOICE") {
    return FORMAT_MODE.MULTIPLE_CHOICE;
  }
  if (value === "ESSAY") return FORMAT_MODE.ESSAY;
  return FORMAT_MODE.MIXED;
};

const toPositiveId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveSingleModeSectionId = (sections, formatMode) => {
  const list = Array.isArray(sections) ? sections : [];
  if (!list.length) return null;

  const targetSectionType =
    formatMode === FORMAT_MODE.ESSAY
      ? SECTION_TYPE.ESSAY
      : SECTION_TYPE.MULTIPLE_CHOICE;

  const matched = list.find(
    (section) =>
      normalizeSectionType(section?.sectionType) === targetSectionType,
  );

  return (
    toPositiveId(matched?.id || matched?.sectionId) ||
    toPositiveId(list[0]?.id || list[0]?.sectionId)
  );
};

const getAllowedQuestionTypes = (formatMode) => {
  if (formatMode === FORMAT_MODE.ESSAY) return ["ESSAY"];
  if (formatMode === FORMAT_MODE.MULTIPLE_CHOICE) {
    return ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"];
  }
  return ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK", "ESSAY"];
};

const getAllowedQuestionTypesBySectionType = (sectionType) => {
  if (sectionType === SECTION_TYPE.ESSAY) return ["ESSAY"];
  return ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK"];
};

const buildInitialQuestions = (formatMode) => {
  if (formatMode === FORMAT_MODE.ESSAY) return [makeQuestion("ESSAY")];
  if (formatMode === FORMAT_MODE.MULTIPLE_CHOICE) {
    return [makeQuestion("MULTIPLE_CHOICE")];
  }
  return [];
};

const sanitizeQuestionsByFormat = (questions, formatMode) => {
  const source = Array.isArray(questions) ? questions : [];
  const allowedTypes = getAllowedQuestionTypes(formatMode);

  if (!source.length) {
    return buildInitialQuestions(formatMode);
  }

  const filtered = source.filter((q) => allowedTypes.includes(q.type));
  if (!filtered.length) {
    return buildInitialQuestions(formatMode);
  }

  return filtered.length === source.length ? source : filtered;
};

const mapBackendQuestion = (item, sectionId = null) => {
  const type = normalizeType(item?.questionType || item?.type);
  const opts = Array.isArray(item?.options)
    ? item.options.map((o) => ({
        id: Date.now() + Math.random(),
        text: o?.content || o?.text || "",
        correct: Boolean(o?.correct),
      }))
    : [];

  let correct = -1;
  if (type === "TRUE_FALSE") {
    const trueOpt = opts.find(
      (o) => String(o.text).trim().toLowerCase() === "đúng",
    );
    const falseOpt = opts.find(
      (o) => String(o.text).trim().toLowerCase() === "sai",
    );
    if (trueOpt?.correct) correct = true;
    else if (falseOpt?.correct) correct = false;
    else correct = null;
  } else if (type === "MULTIPLE_CHOICE") {
    correct = opts.findIndex((o) => o.correct);
  }

  return {
    id: Date.now() + Math.random(),
    backendItemId: item?.itemId || item?.id || null,
    sectionId: item?.sectionId || sectionId || null,
    type,
    prompt: item?.content || item?.prompt || "",
    points: Number(item?.defaultPoints ?? item?.points ?? 1) || 1,
    cogLevel:
      UI_COG_MAP[String(item?.cognitiveLevel || "").toUpperCase()] || "APPLY",
    options:
      type === "MULTIPLE_CHOICE"
        ? opts.length
          ? opts
          : [makeOption(), makeOption(), makeOption(), makeOption()]
        : [],
    correct,
    answer: item?.sampleAnswer || "",
    collapsed: false,
  };
};

const Ic = {
  Plus: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg
      width="13"
      height="13"
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
      width="13"
      height="13"
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
  ArrowL: () => (
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
  Save: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
    </svg>
  ),
  Copy: () => (
    <svg
      width="13"
      height="13"
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
  ChevD: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevU: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  GripV: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      opacity=".35"
    >
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
    </svg>
  ),
  ArrowUp: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  ArrowDown: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  ),
  PenTool: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
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
  Cloud: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      <polyline points="11 15 13 17 17 13" strokeWidth="2.5" />
    </svg>
  ),
  Warn: () => (
    <svg
      width="14"
      height="14"
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
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap');
:root{--p:#2563EB;--pd:#1D4ED8;--pl:#EFF6FF;--plr:#F8FAFF;--pg:rgba(37,99,235,.10);--ps:rgba(37,99,235,.22);--gr:linear-gradient(135deg,#3B82F6,#2563EB 50%,#1D4ED8);--bg:#F7F8FC;--card:#FFF;--inp:#F5F7FB;--hov:#EDF2FF;--t:#1E293B;--t2:#475569;--t3:#94A3B8;--inv:#FFF;--gn:#10B981;--gnl:#ECFDF5;--or:#F59E0B;--rd:#EF4444;--rdl:#FEF2F2;--pu:#8B5CF6;--b:#E2E8F0;--bl:#F1F5F9;--ss:0 1px 3px rgba(30,41,59,.04);--sm:0 4px 14px rgba(30,41,59,.07);--sl:0 12px 40px rgba(30,41,59,.11);--rs:10px;--rm:12px;--rl:16px;--rxl:20px;--f:'Be Vietnam Pro',sans-serif;--fd:'Lora',serif;--fm:'JetBrains Mono',monospace;--e:cubic-bezier(.4,0,.2,1)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--f);background:var(--bg);color:var(--t);-webkit-font-smoothing:antialiased}
.page{display:flex;height:100vh;overflow:hidden}
.side{width:280px;background:var(--card);border-right:1px solid var(--b);display:flex;flex-direction:column;flex-shrink:0}
.side-hdr{padding:18px 20px;border-bottom:1px solid var(--b);background:var(--gr);color:var(--inv);position:relative;overflow:hidden}
.side-hdr h2{font-family:var(--fd);font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px;position:relative;z-index:1}
.side-hdr p{font-size:10px;opacity:.82;margin-top:3px;position:relative;z-index:1}
.side-stats{padding:14px 20px;border-bottom:1px solid var(--b);background:var(--plr)}
.side-stat-row{display:flex;justify-content:space-between;margin-bottom:6px}
.side-stat-label{font-size:11px;font-weight:600;color:var(--t3)}
.side-stat-val{font-size:11px;font-weight:800;color:var(--t)}
.side-stat-val.warn{color:var(--or)}
.side-nav{flex:1;overflow-y:auto;padding:12px 16px}
.side-group{margin-bottom:12px}
.side-nav-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);margin-bottom:8px}
.nav-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}
.nav-dot{aspect-ratio:1;border-radius:var(--rs);border:1.5px solid var(--b);background:var(--card);font-size:11px;font-weight:700;font-family:var(--f);color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--e)}
.nav-dot:hover{border-color:var(--p);color:var(--p);transform:scale(1.06)}
.nav-dot.active{border-color:var(--p);background:var(--p);color:var(--inv);box-shadow:0 2px 8px var(--ps)}
.nav-dot.filled{border-color:var(--gn);background:var(--gnl);color:var(--gn)}
.side-footer{padding:14px 20px;border-top:1px solid var(--b);background:var(--plr)}
.save-btn{width:100%;padding:12px;border:none;border-radius:var(--rm);background:var(--gr);color:var(--inv);font-size:13px;font-weight:700;font-family:var(--f);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s var(--e);box-shadow:0 3px 14px var(--ps)}
.save-btn:hover{transform:translateY(-2px);box-shadow:0 5px 20px var(--ps)}
.save-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:0 2px 8px var(--ps)}
.autosave{display:flex;align-items:center;justify-content:center;gap:5px;font-size:10px;color:var(--gn);font-weight:600;margin-top:8px}
.autosave.error{color:var(--rd)}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:54px;background:var(--card);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 24px;flex-shrink:0}
.top-l{display:flex;align-items:center;gap:12px}
.bk{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid var(--b);border-radius:var(--rs);background:var(--card);font-size:11px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;transition:all .15s var(--e)}
.bk:hover{border-color:var(--p);color:var(--p)}
.top-t{font-family:var(--fd);font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px}
.top-t svg{color:var(--pu)}
.top-r{display:flex;gap:6px}
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 16px;border-radius:var(--rm);font-size:11px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;transition:all .2s var(--e)}
.btn-p{background:var(--gr);color:var(--inv);box-shadow:0 2px 10px var(--ps)}
.btn-p:hover{transform:translateY(-1px)}
.btn-g{background:var(--card);color:var(--t2);border:1.5px solid var(--b)}
.btn-g:hover{border-color:var(--p);color:var(--p);background:var(--hov)}
.btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
.scroll{flex:1;overflow-y:auto;padding:24px 28px 100px;background:var(--bg)}
.section-wrap{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:14px;overflow:hidden;box-shadow:var(--ss)}
.section-hdr{padding:12px 16px;border-bottom:1px solid var(--bl);display:flex;align-items:center;justify-content:space-between;background:var(--plr)}
.section-title{font-size:13px;font-weight:800;color:var(--t)}
.section-sub{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.04em}
.section-body{padding:14px 16px}
.qc{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:14px;transition:all .25s var(--e);overflow:hidden}
.qc:hover{box-shadow:var(--sm)}
.qc.active{border-color:var(--p);box-shadow:0 0 0 3px var(--pg),var(--sm)}
.qc-hdr{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--bl);background:var(--plr);cursor:pointer;transition:background .15s var(--e)}
.qc-hdr:hover{background:var(--hov)}
.qc-grip{cursor:grab;opacity:.4;transition:opacity .15s var(--e)}
.qc:hover .qc-grip{opacity:1}
.qc-num{min-width:28px;height:28px;border-radius:50%;background:var(--p);color:var(--inv);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.qc-type-badge{padding:3px 9px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.qc-type-badge.mc{background:var(--pl);color:var(--p)}
.qc-type-badge.tf{background:var(--gnl);color:var(--gn)}
.qc-type-badge.fb{background:#FFF7E8;color:var(--or)}
.qc-type-badge.es{background:#F4EEFF;color:var(--pu)}
.qc-hdr-title{flex:1;font-size:13px;font-weight:600;color:var(--t);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qc-hdr-title.empty{color:var(--t3);font-style:italic;font-weight:500}
.qc-hdr-pts{font-size:11px;font-weight:700;color:var(--p);background:var(--pl);padding:2px 8px;border-radius:10px;white-space:nowrap}
.qc-hdr-actions{display:flex;gap:2px}
.qc-hdr-btn{width:26px;height:26px;border-radius:6px;border:none;background:none;color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s var(--e)}
.qc-hdr-btn:hover{background:var(--hov);color:var(--p)}
.qc-hdr-btn.dng:hover{background:var(--rdl);color:var(--rd)}
.qc-collapse{display:flex;align-items:center;color:var(--t3)}
.qc-body{padding:18px 20px}
.fg{margin-bottom:14px}
.fl{display:block;font-size:10px;font-weight:700;color:var(--t3);margin-bottom:5px;text-transform:uppercase;letter-spacing:.04em}
.f-input{width:100%;padding:9px 12px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:13px;font-family:var(--f);font-weight:600;color:var(--t);background:var(--inp);transition:all .2s var(--e);line-height:1.6}
.f-input:focus{outline:none;border-color:var(--p);background:var(--card);box-shadow:0 0 0 3px var(--pg)}
textarea.f-input{resize:vertical;min-height:70px}
.meta-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
.meta-item{flex:1;min-width:120px}
.meta-select{width:100%;padding:8px 30px 8px 10px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:11px;font-weight:600;font-family:var(--f);color:var(--t2);background:var(--inp);appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;cursor:pointer;transition:all .15s var(--e)}
.meta-select:focus{outline:none;border-color:var(--p)}
.pts-input{width:80px;padding:8px 10px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:13px;font-family:var(--fm);font-weight:600;color:var(--t);background:var(--inp);text-align:center;transition:all .15s var(--e)}
.pts-input:focus{outline:none;border-color:var(--p)}
.opts{display:flex;flex-direction:column;gap:7px;margin-top:4px}
.opt-row{display:flex;align-items:center;gap:8px}
.opt-radio{width:22px;height:22px;border-radius:50%;border:2px solid var(--b);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s var(--e)}
.opt-radio:hover{border-color:var(--gn)}
.opt-radio.on{border-color:var(--gn);background:var(--gn);color:var(--inv)}
.opt-letter{width:22px;height:22px;border-radius:6px;background:var(--bl);font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--t3);flex-shrink:0}
.opt-input{flex:1;padding:8px 12px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp);transition:all .15s var(--e)}
.opt-input:focus{outline:none;border-color:var(--p);background:var(--card)}
.opt-rm{width:24px;height:24px;border-radius:6px;border:none;background:none;color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s var(--e);flex-shrink:0}
.opt-rm:hover{background:var(--rdl);color:var(--rd)}
.add-opt{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border:1.5px dashed var(--b);border-radius:var(--rs);color:var(--t3);font-size:11px;font-weight:600;font-family:var(--f);cursor:pointer;background:none;transition:all .15s var(--e);margin-top:6px}
.add-opt:hover{border-color:var(--p);color:var(--p);background:var(--hov)}
.tf-row{display:flex;gap:10px}
.tf-btn{flex:1;padding:12px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:13px;font-weight:700;text-align:center;cursor:pointer;background:var(--card);color:var(--t3);font-family:var(--f);transition:all .15s var(--e)}
.tf-btn:hover{border-color:var(--gn)}
.tf-btn.on{border-color:var(--gn);background:var(--gnl);color:var(--gn);box-shadow:0 2px 8px rgba(16,185,129,.12)}
.fb-hint{font-size:10px;color:var(--t3);font-style:italic;margin-top:4px}
.add-type-bar{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);padding:16px 20px;margin-top:18px;box-shadow:var(--ss)}
.add-type-title{font-size:12px;font-weight:700;color:var(--t2);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.add-type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.add-type-btn{padding:12px 8px;border:1.5px solid var(--b);border-radius:var(--rm);cursor:pointer;transition:all .2s var(--e);background:var(--card);text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.add-type-btn:hover{border-color:var(--p);background:var(--hov);transform:translateY(-2px);box-shadow:var(--sm)}
.add-type-ic{width:36px;height:36px;border-radius:50%;background:var(--bl);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--t3);transition:all .15s var(--e)}
.add-type-btn:hover .add-type-ic{background:var(--p);color:var(--inv)}
.add-type-label{font-size:11px;font-weight:700;color:var(--t2)}
.toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:var(--rm);font-size:12px;font-weight:600;font-family:var(--f);box-shadow:var(--sl);z-index:2000;display:flex;align-items:center;gap:7px;background:var(--gn);color:var(--inv)}
.toast.error{background:var(--rd)}
.modal-ov{position:fixed;inset:0;background:rgba(30,41,59,.45);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal-box{background:var(--card);border-radius:var(--rxl);padding:32px;max-width:420px;width:92%;box-shadow:var(--sl);text-align:center}
.modal-ic{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.modal-t{font-family:var(--fd);font-size:19px;font-weight:700;margin-bottom:6px}
.modal-tx{font-size:13px;color:var(--t2);line-height:1.6;margin-bottom:20px}
.modal-btns{display:flex;gap:8px;justify-content:center}
@media(max-width:900px){.side{display:none}.scroll{padding:16px 12px 80px}.add-type-grid{grid-template-columns:repeat(2,1fr)}.meta-row{flex-direction:column}.meta-item{min-width:auto}}
`;

const ManualAssignmentCreatorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const assignmentId = searchParams.get("assignmentId")
    ? Number(searchParams.get("assignmentId"))
    : null;
  const bankId = searchParams.get("bankId")
    ? Number(searchParams.get("bankId"))
    : null;
  const formatMode = useMemo(
    () => normalizeFormatMode(searchParams.get("format")),
    [searchParams],
  );
  const allowedQuestionTypes = useMemo(
    () => getAllowedQuestionTypes(formatMode),
    [formatMode],
  );
  const questionTypeOptions = useMemo(
    () => Q_TYPES.filter((qt) => allowedQuestionTypes.includes(qt.v)),
    [allowedQuestionTypes],
  );
  const sectionIdFromQuery = useMemo(
    () => toPositiveId(searchParams.get("sectionId")),
    [searchParams],
  );

  const [qs, setQs] = useState(() => buildInitialQuestions(formatMode));
  const [activeId, setActiveId] = useState(() => null);
  const [delModal, setDelModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const [sessionId, setSessionId] = useState(null);
  const [shouldLoadDraft, setShouldLoadDraft] = useState(false);
  const [mixedSections, setMixedSections] = useState([]);
  const [singleModeSectionId, setSingleModeSectionId] =
    useState(sectionIdFromQuery);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionType, setNewSectionType] = useState(
    SECTION_TYPE.MULTIPLE_CHOICE,
  );
  const [creatingSection, setCreatingSection] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const toastTimer = useRef(null);
  const saveTimer = useRef(null);
  const itemIdMapRef = useRef({});
  const prevQuestionSnapshotsRef = useRef({});
  const initPromiseRef = useRef(null);
  const initScopeKeyRef = useRef("");
  const isDraftHydratedRef = useRef(false);

  const activeSafe = activeId || qs[0]?.id || null;

  const showToast = (msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const scope = useMemo(
    () => ({
      assignmentId:
        Number.isFinite(assignmentId) && assignmentId > 0
          ? assignmentId
          : undefined,
      bankId: Number.isFinite(bankId) && bankId > 0 ? bankId : undefined,
    }),
    [assignmentId, bankId],
  );

  const setupPagePath = useMemo(() => {
    const query = searchParams.toString();
    return query
      ? `${PATH_TEACHER.assignmentCreateManual}?${query}`
      : PATH_TEACHER.assignmentCreateManual;
  }, [searchParams]);

  useEffect(() => {
    setQs((prev) => sanitizeQuestionsByFormat(prev, formatMode));
    if (formatMode !== FORMAT_MODE.MIXED) {
      setMixedSections([]);
    } else {
      setSingleModeSectionId(null);
    }
  }, [formatMode]);

  useEffect(() => {
    if (formatMode !== FORMAT_MODE.MIXED && sectionIdFromQuery) {
      setSingleModeSectionId(sectionIdFromQuery);
    }
  }, [formatMode, sectionIdFromQuery]);

  useEffect(() => {
    if (formatMode === FORMAT_MODE.MIXED) return;
    if (singleModeSectionId) return;
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) return;

    let alive = true;

    const loadDefaultSection = async () => {
      try {
        const resp = await assignmentApi.getAssignment(assignmentId);
        const sections = Array.isArray(resp?.result?.sections)
          ? resp.result.sections
          : [];
        const resolvedSectionId = resolveSingleModeSectionId(
          sections,
          formatMode,
        );

        if (alive && resolvedSectionId) {
          setSingleModeSectionId(resolvedSectionId);
        }
      } catch (error) {
        console.error("Load assignment sections failed", error);
      }
    };

    loadDefaultSection();

    return () => {
      alive = false;
    };
  }, [assignmentId, formatMode, singleModeSectionId]);

  const groupedQuestions = useMemo(() => {
    const indexed = qs.map((q, idx) => ({ q, idx }));

    if (formatMode === FORMAT_MODE.MULTIPLE_CHOICE) {
      return [
        {
          key: "mc",
          sectionId: singleModeSectionId,
          sectionType: SECTION_TYPE.MULTIPLE_CHOICE,
          title: "Phần: Trắc nghiệm",
          subtitle: "MC / TF / Điền khuyết",
          sectionLabel: "Trắc nghiệm",
          emptyMessage: "Chưa có câu hỏi trắc nghiệm.",
          items: indexed.filter(({ q }) => q.type !== "ESSAY"),
        },
      ];
    }

    if (formatMode === FORMAT_MODE.ESSAY) {
      return [
        {
          key: "essay",
          sectionId: singleModeSectionId,
          sectionType: SECTION_TYPE.ESSAY,
          title: "Phần: Tự luận",
          subtitle: "Essay",
          sectionLabel: "Tự luận",
          emptyMessage: "Chưa có câu hỏi tự luận.",
          items: indexed.filter(({ q }) => q.type === "ESSAY"),
        },
      ];
    }

    const firstSectionIndexByType = mixedSections.reduce(
      (acc, section, idx) => {
        if (acc[section.sectionType] === undefined) {
          acc[section.sectionType] = idx;
        }
        return acc;
      },
      {},
    );

    return mixedSections.map((section, index) => {
      const isEssaySection = section.sectionType === SECTION_TYPE.ESSAY;

      return {
        key: String(section.id || `mixed-${index}`),
        sectionId: section.id || null,
        sectionType: section.sectionType,
        title: section.title || `Phần ${index + 1}`,
        subtitle: isEssaySection ? "Essay" : "MC / TF / Điền khuyết",
        sectionLabel: isEssaySection ? "Tự luận" : "Trắc nghiệm",
        emptyMessage: isEssaySection
          ? "Chưa có câu hỏi tự luận."
          : "Chưa có câu hỏi trắc nghiệm.",
        items: indexed.filter(({ q }) => {
          if (q.sectionId != null && section.id != null) {
            return String(q.sectionId) === String(section.id);
          }

          // Backward compatibility for old local data where sectionId is not set yet.
          if (isEssaySection && q.type === "ESSAY") {
            return firstSectionIndexByType[SECTION_TYPE.ESSAY] === index;
          }

          if (!isEssaySection && q.type !== "ESSAY") {
            return (
              firstSectionIndexByType[SECTION_TYPE.MULTIPLE_CHOICE] === index
            );
          }

          return false;
        }),
      };
    });
  }, [formatMode, mixedSections, qs, singleModeSectionId]);

  const createMixedSection = async () => {
    if (formatMode !== FORMAT_MODE.MIXED) return;

    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      showToast("Thiếu assignmentId để tạo phần.", "error");
      return;
    }

    const safeTitle = String(newSectionTitle || "").trim();
    if (!safeTitle) {
      showToast("Vui lòng nhập tiêu đề phần.", "error");
      return;
    }

    setCreatingSection(true);
    try {
      const payload = {
        title: safeTitle,
        sectionType: newSectionType,
      };
      const resp = await assignmentApi.createSection(assignmentId, payload);
      const result = resp?.result || {};

      setMixedSections((prev) => [
        ...prev,
        {
          id: result?.id || result?.sectionId || Date.now(),
          title: String(result?.title || safeTitle),
          sectionType:
            normalizeSectionType(result?.sectionType) || newSectionType,
        },
      ]);

      setNewSectionTitle("");
      showToast("Tạo phần mới thành công.");
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      showToast(apiMessage || "Không thể tạo phần mới.", "error");
    } finally {
      setCreatingSection(false);
    }
  };

  const filled = qs.filter((q) => q.prompt.trim()).length;
  const totalPts = qs.reduce((s, q) => s + (Number(q.points) || 0), 0);

  const updateQ = (id, updates) =>
    setQs((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));

  const addQ = (type, targetSectionId = null) => {
    if (
      formatMode !== FORMAT_MODE.MIXED &&
      !allowedQuestionTypes.includes(type)
    ) {
      return;
    }

    let nextSectionId = null;

    if (formatMode === FORMAT_MODE.MIXED) {
      const targetSection = mixedSections.find(
        (section) => String(section.id) === String(targetSectionId),
      );

      if (!targetSection) {
        showToast("Không tìm thấy phần để thêm câu hỏi.", "error");
        return;
      }

      const sectionAllowedTypes = getAllowedQuestionTypesBySectionType(
        targetSection.sectionType,
      );
      if (!sectionAllowedTypes.includes(type)) {
        showToast(
          targetSection.sectionType === SECTION_TYPE.ESSAY
            ? "Phần này chỉ thêm được câu hỏi tự luận."
            : "Phần này chỉ thêm được câu hỏi trắc nghiệm / đúng sai / điền khuyết.",
          "error",
        );
        return;
      }

      nextSectionId = targetSection?.id || null;
    } else {
      nextSectionId = singleModeSectionId;
    }

    const q = {
      ...makeQuestion(type),
      sectionId: nextSectionId,
    };
    setQs((prev) => [...prev, q]);
    setActiveId(q.id);
  };

  const moveQ = (id, dir) => {
    const idx = qs.findIndex((q) => q.id === id);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === qs.length - 1))
      return;
    const nw = [...qs];
    [nw[idx], nw[idx + dir]] = [nw[idx + dir], nw[idx]];
    setQs(nw);
  };

  const dupQ = (id) => {
    const idx = qs.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const src = qs[idx];
    const cp = {
      ...src,
      id: Date.now() + Math.random(),
      options: src.options
        ? src.options.map((o) => ({ ...o, id: Date.now() + Math.random() }))
        : [],
    };
    const nw = [...qs];
    nw.splice(idx + 1, 0, cp);
    setQs(nw);
    showToast("Đã nhân bản câu hỏi");
  };

  const confirmDel = async () => {
    const target = delModal;

    if (!target) return;

    const targetQuestion = qs.find((q) => q.id === target);
    if (!targetQuestion) {
      setDelModal(null);
      return;
    }

    const resolvedItemId = Number(
      itemIdMapRef.current[target] || targetQuestion.backendItemId,
    );
    const hasRemoteItemId =
      Number.isFinite(resolvedItemId) && resolvedItemId > 0;
    const hasSession = Number.isFinite(sessionId) && sessionId > 0;

    if (hasRemoteItemId && hasSession) {
      try {
        await assignmentApi.deleteDraftItem(sessionId, resolvedItemId);
      } catch (error) {
        console.error(
          "Delete draft item failed",
          error?.response?.data || error,
        );
        showToast("Không thể xóa câu hỏi nháp trên máy chủ.", "error");
        return;
      }
    }

    setQs((prev) => prev.filter((q) => q.id !== target));
    if (activeSafe === target) {
      const next = qs.find((q) => q.id !== target);
      if (next) setActiveId(next.id);
    }
    delete itemIdMapRef.current[target];
    setDelModal(null);
  };

  const toggleCollapse = (id) => {
    const q = qs.find((x) => x.id === id);
    if (!q) return;
    updateQ(id, { collapsed: !q.collapsed });
  };

  const updateOpt = (qId, oIdx, text) => {
    const q = qs.find((x) => x.id === qId);
    if (!q) return;
    const nw = [...q.options];
    nw[oIdx] = { ...nw[oIdx], text };
    updateQ(qId, { options: nw });
  };

  const setCor = (qId, oIdx) => updateQ(qId, { correct: oIdx });

  const addOpt = (qId) => {
    const q = qs.find((x) => x.id === qId);
    if (!q) return;
    updateQ(qId, { options: [...q.options, makeOption()] });
  };

  const rmOpt = (qId, oIdx) => {
    const q = qs.find((x) => x.id === qId);
    if (!q || q.options.length <= 2) return;
    const nw = q.options.filter((_, i) => i !== oIdx);
    const cor =
      q.correct === oIdx ? -1 : q.correct > oIdx ? q.correct - 1 : q.correct;
    updateQ(qId, { options: nw, correct: cor });
  };

  const getQuestionSnapshot = (q) =>
    JSON.stringify({
      sectionId: q.sectionId,
      type: q.type,
      prompt: q.prompt,
      points: q.points,
      cogLevel: q.cogLevel,
      options: q.options,
      correct: q.correct,
      answer: q.answer,
    });

  const buildSnapshotMap = (questions) =>
    questions.reduce((acc, q) => {
      acc[String(q.id)] = getQuestionSnapshot(q);
      return acc;
    }, {});

  const resolveSectionIdForQuestion = (q) => {
    const explicitSectionId = q?.sectionId ?? null;
    if (formatMode !== FORMAT_MODE.MIXED) {
      return explicitSectionId ?? singleModeSectionId;
    }

    const requiredSectionType =
      q?.type === "ESSAY" ? SECTION_TYPE.ESSAY : SECTION_TYPE.MULTIPLE_CHOICE;

    if (explicitSectionId != null) {
      const matchedById = mixedSections.find(
        (section) => String(section?.id) === String(explicitSectionId),
      );
      if (matchedById?.sectionType === requiredSectionType) {
        return explicitSectionId;
      }
    }

    const matchedByType = mixedSections.find(
      (section) => section.sectionType === requiredSectionType,
    );
    return matchedByType?.id ?? null;
  };

  const buildDraftPayload = (q) => {
    let options = null;
    if (q.type === "MULTIPLE_CHOICE") {
      const normalized = q.options
        .map((opt, idx) => ({
          content: String(opt.text || "").trim(),
          correct: q.correct === idx,
        }))
        .filter((opt) => opt.content.length > 0);

      options = normalized.length ? normalized : null;
    } else if (q.type === "TRUE_FALSE") {
      options = [
        { content: "Đúng", correct: q.correct === true },
        { content: "Sai", correct: q.correct === false },
      ];
    }

    return {
      itemId: itemIdMapRef.current[q.id] || null,
      content: String(q.prompt || "").trim() || null,
      questionType: API_TYPE_MAP[q.type],
      cognitiveLevel: API_COG_MAP[q.cogLevel] || "APPLYING",
      defaultPoints: Number.isFinite(Number(q.points)) ? Number(q.points) : 1,
      sampleAnswer: String(q.answer || "").trim() || null,
      options,
      sectionId: resolveSectionIdForQuestion(q),
    };
  };

  const saveQuestionsToDraft = async (questions, { silent = false } = {}) => {
    if (!sessionId) {
      if (!silent) showToast("Đã lưu cục bộ");
      return false;
    }

    if (!Array.isArray(questions) || !questions.length) {
      setAutoSaveStatus("saved");
      return true;
    }

    setAutoSaveStatus("saving");
    try {
      for (const q of questions) {
        const payload = buildDraftPayload(q);
        const res = await assignmentApi.autoSaveDraftItem(
          sessionId,
          payload,
          scope,
        );
        const itemId = res?.result;
        if (itemId) itemIdMapRef.current[q.id] = itemId;
      }
      setAutoSaveStatus("saved");
      if (!silent) showToast("Đã lưu");
      return true;
    } catch (error) {
      console.error("Auto save failed", error?.response?.data || error);
      setAutoSaveStatus("error");
      if (!silent) showToast("Lưu thất bại", "error");
      return false;
    }
  };

  const saveAllToDraft = async ({ silent = false } = {}) =>
    saveQuestionsToDraft(qs, { silent });

  const saveAllToDraftByBatch = async () => {
    if (!sessionId) {
      showToast("Đã lưu cục bộ");
      return false;
    }

    const payloadItems = qs.map(buildDraftPayload);
    setAutoSaveStatus("saving");

    try {
      await assignmentApi.batchAutoSaveDraftItems(
        sessionId,
        payloadItems,
        scope,
      );
      prevQuestionSnapshotsRef.current = buildSnapshotMap(qs);
      setAutoSaveStatus("saved");
      showToast("Đã lưu");
      return true;
    } catch (error) {
      console.error("Batch save failed", error?.response?.data || error);
      setAutoSaveStatus("error");
      showToast("Lưu thất bại", "error");
      return false;
    }
  };

  const collectSelectedQuestionIds = () => {
    const ids = qs
      .map((q) => Number(itemIdMapRef.current[q.id]))
      .filter((id) => Number.isFinite(id) && id > 0);
    return [...new Set(ids)];
  };

  const handlePublish = async () => {
    if (publishing) return;

    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      showToast("Thiếu assignmentId để xuất bản.", "error");
      return;
    }

    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      showToast("Chưa khởi tạo được phiên nháp. Vui lòng thử lại.", "error");
      return;
    }

    setPublishing(true);

    try {
      const saved = await saveAllToDraft({ silent: true });
      if (!saved) throw new Error("SAVE_DRAFT_FAILED");

      const selectedQuestionIds = collectSelectedQuestionIds();
      if (!selectedQuestionIds.length) {
        throw new Error("NO_SELECTED_QUESTION_IDS");
      }

      await assignmentApi.confirmAndPublishAssignment(assignmentId, {
        sessionId,
        bankId: scope.bankId ?? null,
        selectedQuestionIds,
      });

      setSessionId(null);
      itemIdMapRef.current = {};

      showToast("Bài tập đã được xuất bản!");
      navigate(PATH_TEACHER.assignmentAssignClasses(assignmentId));
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      showToast(
        apiMessage ||
          "Bạn không thể xuất bản vì có câu hỏi chưa hoàn thiện. Vui lòng kiểm tra lại các vùng bị đỏ hoặc bấm 'Lưu' để hoàn thiện sau",
        "error",
      );
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    const scopeKey = `${scope.assignmentId || ""}:${scope.bankId || ""}`;

    if (initScopeKeyRef.current !== scopeKey) {
      initScopeKeyRef.current = scopeKey;
      initPromiseRef.current = null;
      isDraftHydratedRef.current = false;
      setShouldLoadDraft(false);
      setSessionId(null);
      setMixedSections([]);
      setSingleModeSectionId(null);
      setNewSectionTitle("");
    }

    let cancelled = false;

    if (!initPromiseRef.current) {
      initPromiseRef.current = (async () => {
        const initResp = await assignmentApi.initManualDraftSession(scope);
        const result = initResp?.result;
        const sid = result?.sessionId || result;
        const hasPending =
          Boolean(result?.hasPending) || Number(result?.itemCount || 0) > 0;
        const normalizedSid = Number(sid);
        return {
          sid:
            Number.isFinite(normalizedSid) && normalizedSid > 0
              ? normalizedSid
              : null,
          hasPending,
        };
      })();
    }

    initPromiseRef.current
      .then(({ sid, hasPending }) => {
        if (!cancelled && sid) {
          setSessionId(sid);
          setShouldLoadDraft(hasPending);

          if (!hasPending) {
            // Fresh session: mark current editor state as baseline to avoid autosave on first render.
            prevQuestionSnapshotsRef.current = buildSnapshotMap(qs);
            isDraftHydratedRef.current = true;
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Init draft session failed", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    if (!sessionId || !shouldLoadDraft) return;
    let alive = true;
    const baselineQuestions = buildInitialQuestions(formatMode);

    const load = async () => {
      try {
        const resp = await assignmentApi.getDraftWorkspace(sessionId);
        const sections = Array.isArray(resp?.result?.sections)
          ? resp.result.sections
          : [];
        if (alive && formatMode !== FORMAT_MODE.MIXED) {
          const resolvedSectionId = resolveSingleModeSectionId(
            sections,
            formatMode,
          );
          if (resolvedSectionId) {
            setSingleModeSectionId(resolvedSectionId);
          }
        }
        if (alive && formatMode === FORMAT_MODE.MIXED) {
          const nextSections = sections
            .map((section, index) => {
              const normalizedSectionType = normalizeSectionType(
                section?.sectionType,
              );

              if (!normalizedSectionType) return null;

              return {
                id: section?.id || section?.sectionId || `loaded-${index}`,
                title: String(
                  section?.title ||
                    section?.sectionTitle ||
                    `Phần ${index + 1}`,
                ),
                sectionType: normalizedSectionType,
              };
            })
            .filter(Boolean);

          setMixedSections(nextSections);
        }

        const loaded = sections.flatMap((section) => {
          const questions = Array.isArray(section?.draftQuestions)
            ? section.draftQuestions
            : Array.isArray(section?.questions)
              ? section.questions
              : [];
          const sectionId = section?.id || section?.sectionId || null;
          return questions.map((item) => mapBackendQuestion(item, sectionId));
        });
        if (alive && loaded.length) {
          const normalizedLoaded = sanitizeQuestionsByFormat(
            loaded,
            formatMode,
          );

          setQs(normalizedLoaded);
          setActiveId(normalizedLoaded[0]?.id || null);
          normalizedLoaded.forEach((q) => {
            if (q.backendItemId) itemIdMapRef.current[q.id] = q.backendItemId;
          });
          prevQuestionSnapshotsRef.current = buildSnapshotMap(normalizedLoaded);
          isDraftHydratedRef.current = true;
        } else if (alive) {
          // No draft items returned: treat current editor state as baseline.
          prevQuestionSnapshotsRef.current =
            buildSnapshotMap(baselineQuestions);
          isDraftHydratedRef.current = true;
        }
      } catch (error) {
        console.error("Load draft failed", error);
        // Allow autosave to continue even when reload draft fails.
        prevQuestionSnapshotsRef.current = buildSnapshotMap(baselineQuestions);
        isDraftHydratedRef.current = true;
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [formatMode, sessionId, shouldLoadDraft]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (!sessionId || !isDraftHydratedRef.current) return;

    const changedQuestions = qs.filter(
      (q) =>
        getQuestionSnapshot(q) !==
        prevQuestionSnapshotsRef.current[String(q.id)],
    );

    const hasRemovedQuestions = Object.keys(
      prevQuestionSnapshotsRef.current,
    ).some((id) => !qs.some((q) => String(q.id) === id));

    if (!changedQuestions.length) {
      if (hasRemovedQuestions) {
        prevQuestionSnapshotsRef.current = buildSnapshotMap(qs);
      }
      return;
    }

    saveTimer.current = setTimeout(async () => {
      const saved = await saveQuestionsToDraft(changedQuestions, {
        silent: true,
      });
      if (saved) {
        prevQuestionSnapshotsRef.current = buildSnapshotMap(qs);
      }
    }, 900);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [qs, sessionId]);

  const renderQuestionCard = ({ q, idx }, sectionLabel, sectionType = null) => {
    const isActive = q.id === activeSafe;
    const num = idx + 1;

    return (
      <div key={q.id} className={`qc${isActive ? " active" : ""}`}>
        <div
          className="qc-hdr"
          onClick={() => {
            setActiveId(q.id);
            toggleCollapse(q.id);
          }}
        >
          <div className="qc-grip">
            <Ic.GripV />
          </div>
          <div className="qc-num">{num}</div>
          <span
            className={`qc-type-badge ${q.type === "MULTIPLE_CHOICE" ? "mc" : q.type === "TRUE_FALSE" ? "tf" : q.type === "FILL_IN_BLANK" ? "fb" : "es"}`}
          >
            {q.type === "MULTIPLE_CHOICE"
              ? "Trắc nghiệm"
              : q.type === "TRUE_FALSE"
                ? "Đúng/Sai"
                : q.type === "FILL_IN_BLANK"
                  ? "Điền khuyết"
                  : "Tự luận"}
          </span>
          <span className={`qc-hdr-title${!q.prompt.trim() ? " empty" : ""}`}>
            {q.prompt.trim() || "Chưa nhập nội dung..."}
          </span>
          <span className="qc-hdr-pts">{q.points} đ</span>
          <div className="qc-hdr-actions">
            <button
              className="qc-hdr-btn"
              title="Lên"
              onClick={(e) => {
                e.stopPropagation();
                moveQ(q.id, -1);
              }}
            >
              <Ic.ArrowUp />
            </button>
            <button
              className="qc-hdr-btn"
              title="Xuống"
              onClick={(e) => {
                e.stopPropagation();
                moveQ(q.id, 1);
              }}
            >
              <Ic.ArrowDown />
            </button>
            <button
              className="qc-hdr-btn"
              title="Nhân bản"
              onClick={(e) => {
                e.stopPropagation();
                dupQ(q.id);
              }}
            >
              <Ic.Copy />
            </button>
            <button
              className="qc-hdr-btn dng"
              title="Xóa"
              onClick={(e) => {
                e.stopPropagation();
                setDelModal(q.id);
              }}
            >
              <Ic.Trash />
            </button>
          </div>
          <div className="qc-collapse">
            {q.collapsed ? <Ic.ChevD /> : <Ic.ChevU />}
          </div>
        </div>

        {!q.collapsed && (
          <div className="qc-body">
            <div className="fg">
              <div className="meta-row">
                <div className="meta-item">
                  <label className="fl">Mức độ nhận thức</label>
                  <select
                    className="meta-select"
                    value={q.cogLevel}
                    onChange={(e) =>
                      updateQ(q.id, { cogLevel: e.target.value })
                    }
                  >
                    {COG_SHORT.map((c) => (
                      <option key={c.v} value={c.v}>
                        {c.l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="meta-item">
                  <label className="fl">Loại câu hỏi</label>
                  <select
                    className="meta-select"
                    value={q.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      const sectionAllowedTypes =
                        formatMode === FORMAT_MODE.MIXED
                          ? getAllowedQuestionTypesBySectionType(sectionType)
                          : allowedQuestionTypes;

                      if (!sectionAllowedTypes.includes(t)) {
                        showToast(
                          sectionType === SECTION_TYPE.ESSAY
                            ? "Phần tự luận chỉ hỗ trợ loại câu hỏi tự luận."
                            : "Phần này không hỗ trợ loại câu hỏi đã chọn.",
                          "error",
                        );
                        return;
                      }

                      const upd = { type: t };
                      if (t === "MULTIPLE_CHOICE") {
                        upd.options = [
                          makeOption(),
                          makeOption(),
                          makeOption(),
                          makeOption(),
                        ];
                        upd.correct = -1;
                      } else {
                        upd.options = [];
                      }
                      if (t === "TRUE_FALSE") upd.correct = null;
                      if (t === "ESSAY" || t === "FILL_IN_BLANK")
                        upd.answer = q.answer || "";
                      updateQ(q.id, upd);
                    }}
                  >
                    {(formatMode === FORMAT_MODE.MIXED
                      ? Q_TYPES.filter((qt) =>
                          getAllowedQuestionTypesBySectionType(
                            sectionType,
                          ).includes(qt.v),
                        )
                      : questionTypeOptions
                    ).map((qt) => (
                      <option key={qt.v} value={qt.v}>
                        {qt.l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="meta-item" style={{ flex: "0 0 100px" }}>
                  <label className="fl">Điểm</label>
                  <input
                    className="pts-input"
                    type="number"
                    min="0"
                    step="0.25"
                    value={q.points}
                    onChange={(e) =>
                      updateQ(q.id, { points: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="fg">
              <label className="fl">Nội dung câu hỏi *</label>
              <textarea
                className="f-input"
                placeholder={`Nhập nội dung ${sectionLabel.toLowerCase()}...`}
                value={q.prompt}
                onChange={(e) => updateQ(q.id, { prompt: e.target.value })}
              />
            </div>

            {q.type === "MULTIPLE_CHOICE" && (
              <div className="fg">
                <label className="fl">Đáp án (bấm ○ chọn đáp án đúng)</label>
                <div className="opts">
                  {q.options.map((o, oi) => (
                    <div key={o.id} className="opt-row">
                      <div
                        className={`opt-radio${q.correct === oi ? " on" : ""}`}
                        onClick={() => setCor(q.id, oi)}
                      >
                        {q.correct === oi && <Ic.Check />}
                      </div>
                      <div className="opt-letter">{LETTERS[oi]}</div>
                      <input
                        className="opt-input"
                        placeholder={`Đáp án ${LETTERS[oi]}`}
                        value={o.text}
                        onChange={(e) => updateOpt(q.id, oi, e.target.value)}
                      />
                      {q.options.length > 2 && (
                        <button
                          className="opt-rm"
                          onClick={() => rmOpt(q.id, oi)}
                        >
                          <Ic.X />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {q.options.length < 8 && (
                  <button className="add-opt" onClick={() => addOpt(q.id)}>
                    <Ic.Plus /> Thêm đáp án
                  </button>
                )}
              </div>
            )}

            {q.type === "TRUE_FALSE" && (
              <div className="fg">
                <label className="fl">Đáp án đúng</label>
                <div className="tf-row">
                  <button
                    className={`tf-btn${q.correct === true ? " on" : ""}`}
                    onClick={() => updateQ(q.id, { correct: true })}
                  >
                    Đúng
                  </button>
                  <button
                    className={`tf-btn${q.correct === false ? " on" : ""}`}
                    onClick={() => updateQ(q.id, { correct: false })}
                  >
                    Sai
                  </button>
                </div>
              </div>
            )}

            {q.type === "FILL_IN_BLANK" && (
              <div className="fg">
                <label className="fl">Đáp án</label>
                <input
                  className="f-input"
                  style={{ minHeight: "auto" }}
                  placeholder="Nhập đáp án đúng..."
                  value={q.answer}
                  onChange={(e) => updateQ(q.id, { answer: e.target.value })}
                />
                <div className="fb-hint">
                  Dùng dấu ___ trong câu hỏi để đánh dấu chỗ trống
                </div>
              </div>
            )}

            {q.type === "ESSAY" && (
              <div className="fg">
                <label className="fl">Đáp án mẫu (tùy chọn)</label>
                <textarea
                  className="f-input"
                  placeholder="Nhập đáp án mẫu hoặc hướng dẫn chấm..."
                  value={q.answer}
                  onChange={(e) => updateQ(q.id, { answer: e.target.value })}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <style>{CSS}</style>

      <div className="side">
        <div className="side-hdr">
          <h2>
            <Ic.PenTool /> Tạo thủ công
          </h2>
          <p>Soạn câu hỏi chi tiết</p>
        </div>

        <div className="side-stats">
          <div className="side-stat-row">
            <span className="side-stat-label">Tổng câu hỏi</span>
            <span className="side-stat-val">{qs.length}</span>
          </div>
          <div className="side-stat-row">
            <span className="side-stat-label">Đã nhập nội dung</span>
            <span className="side-stat-val">
              {filled}/{qs.length}
            </span>
          </div>
          <div className="side-stat-row">
            <span className="side-stat-label">Tổng điểm</span>
            <span className={`side-stat-val${totalPts === 0 ? " warn" : ""}`}>
              {totalPts}
            </span>
          </div>
        </div>

        <div className="side-nav">
          {groupedQuestions.map((group) => (
            <div key={group.key} className="side-group">
              <div className="side-nav-title">{group.title}</div>
              <div className="nav-grid">
                {group.items.map(({ q, idx }) => {
                  const isFilled = q.prompt.trim().length > 0;
                  const isActive = q.id === activeSafe;
                  return (
                    <button
                      key={q.id}
                      className={`nav-dot${isActive ? " active" : ""}${isFilled && !isActive ? " filled" : ""}`}
                      onClick={() => setActiveId(q.id)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="side-footer">
          <button
            className="save-btn"
            onClick={handlePublish}
            disabled={publishing}
          >
            <Ic.Save />
            {publishing ? "Đang kiểm tra & xuất bản..." : "Xuất bản"}
          </button>
          <div
            className={`autosave${autoSaveStatus === "error" ? " error" : ""}`}
          >
            <Ic.Cloud />
            {autoSaveStatus === "saving" && "Đang tự động lưu"}
            {autoSaveStatus === "saved" && "Đã tự động lưu"}
            {autoSaveStatus === "error" && "Lỗi lưu tự động"}
            {autoSaveStatus === "idle" && "Chờ lưu"}
          </div>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="top-l">
            <button className="bk" onClick={() => navigate(setupPagePath)}>
              <Ic.ArrowL /> Quay lại
            </button>
            <div className="top-t">
              <Ic.PenTool /> Tạo câu hỏi thủ công
            </div>
          </div>
          <div className="top-r">
            <button
              className="btn btn-g"
              onClick={saveAllToDraftByBatch}
              disabled={publishing}
            >
              <Ic.Eye /> Lưu
            </button>
            <button
              className="btn btn-p"
              onClick={handlePublish}
              disabled={publishing}
            >
              <Ic.Save />
              {publishing ? "Đang xử lý..." : "Xuất bản"}
            </button>
          </div>
        </div>

        <div className="scroll">
          {formatMode === FORMAT_MODE.MIXED && (
            <div className="section-wrap">
              <div className="section-hdr">
                <div className="section-title">
                  Cấu hình phần cho đề hỗn hợp
                </div>
                <div className="section-sub">Tạo section qua API</div>
              </div>
              <div className="section-body">
                <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                  <input
                    className="f-input"
                    placeholder="Tiêu đề phần (ví dụ: Phần A - Trắc nghiệm)"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                  />
                  <div className="meta-row">
                    <div className="meta-item">
                      <select
                        className="meta-select"
                        value={newSectionType}
                        onChange={(e) => setNewSectionType(e.target.value)}
                      >
                        <option value={SECTION_TYPE.MULTIPLE_CHOICE}>
                          Phần trắc nghiệm
                        </option>
                        <option value={SECTION_TYPE.ESSAY}>Phần tự luận</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn btn-g"
                      disabled={creatingSection}
                      onClick={createMixedSection}
                    >
                      <Ic.Plus /> {creatingSection ? "Đang tạo..." : "Tạo phần"}
                    </button>
                  </div>
                </div>

                {!groupedQuestions.length && (
                  <div style={{ color: "var(--t3)", fontSize: 12 }}>
                    Chưa có phần nào. Hãy tạo phần trước khi thêm câu hỏi.
                  </div>
                )}
              </div>
            </div>
          )}

          {groupedQuestions.map((group) => (
            <div key={group.key} className="section-wrap">
              <div className="section-hdr">
                <div className="section-title">{group.title}</div>
                <div className="section-sub">{group.subtitle}</div>
              </div>
              <div className="section-body">
                {group.items.length > 0 ? (
                  group.items.map((item) =>
                    renderQuestionCard(
                      item,
                      group.sectionLabel,
                      group.sectionType,
                    ),
                  )
                ) : (
                  <div
                    style={{
                      color: "var(--t3)",
                      fontSize: 12,
                      padding: "8px 2px",
                    }}
                  >
                    {group.emptyMessage}
                  </div>
                )}

                <div className="add-type-bar" style={{ marginTop: 14 }}>
                  <div className="add-type-title">
                    <Ic.Plus /> Thêm câu hỏi mới
                  </div>
                  <div className="add-type-grid">
                    {(formatMode === FORMAT_MODE.MIXED
                      ? Q_TYPES.filter((qt) =>
                          getAllowedQuestionTypesBySectionType(
                            group.sectionType,
                          ).includes(qt.v),
                        )
                      : questionTypeOptions
                    ).map((qt) => (
                      <button
                        key={qt.v}
                        className="add-type-btn"
                        onClick={() => addQ(qt.v, group.sectionId)}
                      >
                        <div className="add-type-ic">{qt.ic}</div>
                        <div className="add-type-label">{qt.l}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {delModal && (
        <div className="modal-ov" onClick={() => setDelModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div
              className="modal-ic"
              style={{ background: "var(--rdl)", color: "var(--rd)" }}
            >
              <Ic.Trash />
            </div>
            <div className="modal-t">Xóa câu hỏi?</div>
            <div className="modal-tx">
              Bạn có chắc muốn xóa câu hỏi này? Hành động không thể hoàn tác.
            </div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={() => setDelModal(null)}>
                Hủy
              </button>
              <button
                className="btn"
                style={{
                  background: "var(--rd)",
                  color: "var(--inv)",
                  boxShadow: "0 3px 12px rgba(239,68,68,.25)",
                }}
                onClick={confirmDel}
              >
                <Ic.Trash /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast${toast.type === "error" ? " error" : ""}`}>
          {toast.type === "error" ? <Ic.Warn /> : <Ic.Check />} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ManualAssignmentCreatorPage;
