import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { questionBankApi } from "@/apis/question-bank.api";
import { PATH_TEACHER } from "@/routes/paths";

const COG_LEVELS = [
  { v: "REMEMBERING", l: "Nhớ" },
  { v: "UNDERSTANDING", l: "Hiểu" },
  { v: "APPLYING", l: "Vận dụng" },
  { v: "ANALYZING", l: "Phân tích" },
  { v: "EVALUATING", l: "Đánh giá" },
  { v: "CREATING", l: "Sáng tạo" },
];

const COG_LEVEL_LABELS = {
  REMEMBERING: "Nhớ",
  UNDERSTANDING: "Hiểu",
  APPLYING: "Vận dụng",
  ANALYZING: "Phân tích",
  EVALUATING: "Đánh giá",
  CREATING: "Sáng tạo",
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

const Q_TYPES = [
  { v: "MULTIPLE_CHOICE", l: "Trắc nghiệm", short: "TN", cls: "mc" },
  { v: "TRUE_FALSE", l: "Đúng / Sai", short: "ĐS", cls: "tf" },
  { v: "FILL_IN_THE_BLANK", l: "Điền khuyết", short: "ĐK", cls: "fb" },
  { v: "ESSAY", l: "Tự luận", short: "TL", cls: "es" },
];

const PAGE_SIZE = 15;
const LETTERS = "ABCDEFGHIJ";

const ASSIGNMENT_FORMAT = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  ESSAY: "ESSAY",
  MIXED: "MIXED",
};

const SECTION_TYPE = {
  OBJECTIVE: "OBJECTIVE",
  ESSAY: "ESSAY",
  MIXED: "MIXED",
};

const SECTION_TYPE_OPTIONS = [
  { value: SECTION_TYPE.OBJECTIVE, label: "Phần trắc nghiệm" },
  { value: SECTION_TYPE.ESSAY, label: "Phần tự luận" },
  { value: SECTION_TYPE.MIXED, label: "Phần hỗn hợp" },
];

const SECTION_TYPE_LABEL = {
  OBJECTIVE: "Phần trắc nghiệm",
  ESSAY: "Phần tự luận",
  MIXED: "Phần hỗn hợp",
};

const normalizeAssignmentFormat = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (normalized === ASSIGNMENT_FORMAT.MULTIPLE_CHOICE || normalized === "MC") {
    return ASSIGNMENT_FORMAT.MULTIPLE_CHOICE;
  }

  if (normalized === ASSIGNMENT_FORMAT.ESSAY) {
    return ASSIGNMENT_FORMAT.ESSAY;
  }

  if (normalized === ASSIGNMENT_FORMAT.MIXED) {
    return ASSIGNMENT_FORMAT.MIXED;
  }

  return "";
};

const normalizeSectionType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (normalized === SECTION_TYPE.ESSAY) return SECTION_TYPE.ESSAY;
  if (normalized === SECTION_TYPE.MIXED) return SECTION_TYPE.MIXED;
  if (normalized === SECTION_TYPE.OBJECTIVE || normalized === "MC") {
    return SECTION_TYPE.OBJECTIVE;
  }

  return SECTION_TYPE.OBJECTIVE;
};

const cogLabel = (v) => {
  const normalized = String(v || "").toUpperCase();
  return COG_LEVEL_LABELS[normalized] || v || "-";
};

const typeInfo = (v) =>
  Q_TYPES.find((t) => t.v === String(v || "").toUpperCase()) || {
    l: v,
    short: "?",
    cls: "mc",
  };

const truncate = (str, n = 90) =>
  str?.length > n ? `${str.slice(0, n)}...` : str || "";

const toPositiveId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeTfValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

const normalizeQuestion = (item, idx) => ({
  id: item.id || item.questionId || item.itemId || `q-${idx}`,
  type: String(
    item.questionType || item.type || "MULTIPLE_CHOICE",
  ).toUpperCase(),
  content: item.content || item.prompt || "",
  points: Number(item.defaultPoints ?? item.points ?? 1),
  cognitiveLevel: String(
    item.cognitiveLevel || item.difficulty || "APPLYING",
  ).toUpperCase(),
  subject: item.subject || item.subjectName || "",
  topic: item.topic || item.chapterName || "",
  options: Array.isArray(item.options)
    ? item.options.map((o) => ({
        text: o.content || o.text || "",
        correct: Boolean(o.correct ?? o.isCorrect),
      }))
    : [],
  sampleAnswer: item.sampleAnswer || "",
  usageCount: Number(item.usageCount ?? 0),
  createdAt: item.createdAt || "",
});

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
  Plus: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
  FileText: (p) => (
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
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
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
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  Trash: (p) => (
    <svg
      {...p}
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
  Close: (p) => (
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
  ChevronDown: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');
:root { --primary:#2563EB;--primary-dark:#1D4ED8;--primary-light:#EFF6FF;--primary-glow:rgba(37,99,235,0.10);--primary-shadow:rgba(37,99,235,0.22);--gradient:linear-gradient(135deg,#3B82F6 0%,#2563EB 50%,#1D4ED8 100%);--bg:#F7F8FC;--card:#FFFFFF;--sidebar-bg:#FAFBFE;--input-bg:#F5F7FB;--hover:#EDF2FF;--text:#1E293B;--text2:#475569;--text3:#94A3B8;--inv:#FFFFFF;--green:#10B981;--green-l:#ECFDF5;--orange:#F59E0B;--orange-l:#FFFBEB;--red:#EF4444;--red-l:#FEF2F2;--purple:#8B5CF6;--purple-l:#F5F3FF;--sky:#0EA5E9;--sky-l:#F0F9FF;--border:#E2E8F0;--border-l:#F1F5F9;--sh-s:0 1px 3px rgba(30,41,59,.04);--sh-m:0 4px 14px rgba(30,41,59,.07);--sh-l:0 12px 40px rgba(30,41,59,.11);--r-s:10px;--r-m:12px;--r-l:16px;--r-xl:20px;--font:'Be Vietnam Pro',sans-serif;--font-d:'Be Vietnam Pro',sans-serif;--ease:cubic-bezier(0.4,0,0.2,1);}*{box-sizing:border-box;margin:0;padding:0}body{font-family:var(--font);background:var(--bg);color:var(--text)}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}.qbp-page{display:flex;height:100vh;overflow:hidden;font-family:var(--font)}.qbp-left{flex:1;display:flex;flex-direction:column;overflow:hidden;border-right:1.5px solid var(--border)}.topbar{height:54px;background:var(--card);border-bottom:1.5px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex-shrink:0}.topbar-l{display:flex;align-items:center;gap:10px}.bk-btn{display:flex;align-items:center;gap:5px;padding:5px 12px;border:1.5px solid var(--border);border-radius:var(--r-s);background:var(--card);font-size:11px;font-weight:700;font-family:var(--font);color:var(--text2);cursor:pointer;transition:all .15s var(--ease)}.bk-btn:hover{border-color:var(--primary);color:var(--primary);background:var(--hover)}.topbar-title{font-family:var(--font-d);font-size:16px;font-weight:700;color:var(--text)}.filter-bar{padding:14px 20px;background:var(--card);border-bottom:1.5px solid var(--border);display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex-shrink:0}.search-wrap{flex:1;min-width:200px;position:relative}.search-wrap svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}.search-inp{width:100%;padding:8px 12px 8px 34px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:12px;font-family:var(--font);font-weight:500;color:var(--text);background:var(--input-bg);transition:all .2s var(--ease)}.search-inp:focus{outline:none;border-color:var(--primary);background:var(--card);box-shadow:0 0 0 3px var(--primary-glow)}.fsel{padding:8px 28px 8px 10px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:11px;font-weight:600;font-family:var(--font);color:var(--text2);background:var(--card);appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;cursor:pointer;transition:border-color .15s}.fsel:focus{outline:none;border-color:var(--primary)}.filter-active-count{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:var(--r-s);background:var(--primary-light);color:var(--primary);font-size:11px;font-weight:700}.q-scroll{flex:1;overflow-y:auto;padding:14px 16px 24px}.sel-all-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:var(--sidebar-bg);border:1.5px solid var(--border);border-radius:var(--r-m);margin-bottom:12px}.sel-all-l{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--text2)}.sel-all-r{font-size:11px;color:var(--text3);font-weight:600}.qr{display:flex;align-items:flex-start;gap:10px;padding:13px 15px;background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);margin-bottom:8px;cursor:pointer;transition:all .2s var(--ease);animation:qIn .3s ease-out both}@keyframes qIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.qr:hover{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-glow),var(--sh-m)}.qr.selected{border-color:var(--primary);background:var(--primary-light);box-shadow:0 0 0 3px var(--primary-glow)}.qr-check{width:20px;height:20px;border-radius:5px;border:2px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all .15s var(--ease)}.qr.selected .qr-check{border-color:var(--primary);background:var(--primary);color:var(--inv)}.qr-body{flex:1;min-width:0}.qr-badges{display:flex;align-items:center;gap:5px;margin-bottom:6px;flex-wrap:wrap}.badge{padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:.03em;text-transform:uppercase}.badge-mc{background:var(--primary-light);color:var(--primary)}.badge-tf{background:var(--green-l);color:var(--green)}.badge-fb{background:var(--orange-l);color:var(--orange)}.badge-es{background:var(--purple-l);color:var(--purple)}.badge-cog{background:var(--border-l);color:var(--text3)}.badge-subject{background:var(--sky-l);color:var(--sky)}.badge-topic{background:#F4EEFF;color:var(--purple)}.qr-content{font-size:13px;font-weight:600;color:var(--text);line-height:1.5;margin-bottom:6px}.qr-content.empty{color:var(--text3);font-style:italic;font-weight:400}.qr-meta{display:flex;align-items:center;gap:12px;font-size:11px;color:var(--text3);font-weight:500}.qr-pts{font-size:11px;font-weight:700;color:var(--primary);background:var(--primary-light);padding:2px 8px;border-radius:10px;flex-shrink:0;white-space:nowrap}.qr-expand{width:28px;height:28px;border-radius:7px;border:none;background:none;color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s var(--ease)}.qr-expand:hover{background:var(--hover);color:var(--primary)}.qr-expand.open svg{transform:rotate(180deg)}.qr-expanded{padding:10px 0 2px;border-top:1px solid var(--border-l);margin-top:8px}.opt-row{display:flex;align-items:center;gap:7px;padding:6px 10px;border:1.5px solid var(--border);border-radius:var(--r-s);margin-bottom:5px;font-size:12px;color:var(--text2)}.opt-row.correct{border-color:var(--green);background:var(--green-l);color:var(--green)}.opt-letter{width:20px;height:20px;border-radius:5px;background:var(--border-l);font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--text3);flex-shrink:0}.opt-row.correct .opt-letter{background:var(--green);color:var(--inv)}.tf-row{display:flex;gap:7px}.tf-btn{flex:1;padding:8px;border:1.5px solid var(--border);border-radius:var(--r-s);font-size:12px;font-weight:700;text-align:center;color:var(--text3)}.tf-btn.correct{border-color:var(--green);background:var(--green-l);color:var(--green)}.sample-ans{padding:8px 12px;background:var(--input-bg);border-radius:var(--r-s);font-size:12px;color:var(--text2);line-height:1.6;border-left:3px solid var(--purple)}.ans-label{font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}.pagination{display:flex;align-items:center;justify-content:center;gap:6px;padding:16px 0 4px}.page-btn{width:32px;height:32px;border-radius:var(--r-s);border:1.5px solid var(--border);background:var(--card);font-size:12px;font-weight:700;font-family:var(--font);color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--ease)}.page-btn:hover{border-color:var(--primary);color:var(--primary);background:var(--hover)}.page-btn.active{background:var(--primary);border-color:var(--primary);color:var(--inv)}.page-btn:disabled{opacity:.35;cursor:not-allowed}.page-info{font-size:11px;color:var(--text3);font-weight:600;padding:0 6px}.state-box{text-align:center;padding:50px 20px}.state-icon{width:64px;height:64px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 16px}.state-title{font-family:var(--font-d);font-size:17px;font-weight:700;margin-bottom:6px}.state-text{font-size:13px;color:var(--text3)}.qbp-right{width:300px;background:var(--card);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}.cart-hdr{padding:16px 18px;border-bottom:1.5px solid var(--border);background:linear-gradient(135deg,#3B82F6,#2563EB)}.cart-hdr-title{font-size:14px;font-weight:700;color:#fff;display:flex;align-items:center;gap:6px}.cart-hdr-sub{font-size:11px;color:rgba(255,255,255,.75);margin-top:2px}.cart-stats{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1.5px solid var(--border)}.cart-stat{padding:12px 16px;text-align:center;border-right:1px solid var(--border)}.cart-stat:last-child{border-right:none}.cart-stat-val{font-size:20px;font-weight:800;color:var(--text);line-height:1}.cart-stat-label{font-size:10px;font-weight:700;color:var(--text3);margin-top:2px}.cart-scroll{flex:1;overflow-y:auto;padding:10px 12px}.cart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;opacity:.4;padding:20px}.cart-empty p{font-size:12px;color:var(--text3);text-align:center}.cart-item{display:flex;align-items:flex-start;gap:7px;padding:9px 10px;background:var(--sidebar-bg);border:1.5px solid var(--border);border-radius:var(--r-m);margin-bottom:6px;transition:all .15s var(--ease);animation:ci .2s ease-out both}@keyframes ci{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}.cart-item-num{width:22px;height:22px;border-radius:50%;background:var(--primary);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}.cart-item-body{flex:1;min-width:0}.cart-item-content{font-size:11px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}.cart-item-meta{display:flex;align-items:center;gap:5px}.cart-item-rm{width:22px;height:22px;border-radius:5px;border:none;background:none;color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s var(--ease)}.cart-item-rm:hover{background:var(--red-l);color:var(--red)}.cart-footer{padding:14px 16px;border-top:1.5px solid var(--border);background:var(--sidebar-bg)}.cart-pts-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:8px 12px;background:var(--primary-light);border-radius:var(--r-s);border:1px solid rgba(37,99,235,.15)}.cart-pts-label{font-size:12px;font-weight:600;color:var(--primary)}.cart-pts-val{font-size:16px;font-weight:800;color:var(--primary)}.add-btn{width:100%;padding:11px;border:none;border-radius:var(--r-m);background:var(--gradient);color:var(--inv);font-size:13px;font-weight:700;font-family:var(--font);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s var(--ease);box-shadow:0 3px 14px var(--primary-shadow)}.add-btn:hover{transform:translateY(-2px);box-shadow:0 5px 20px var(--primary-shadow)}.add-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:0 2px 8px var(--primary-shadow)}.clear-btn{width:100%;padding:8px;border:1.5px solid var(--border);border-radius:var(--r-m);background:var(--card);color:var(--text3);font-size:11px;font-weight:700;font-family:var(--font);cursor:pointer;margin-top:7px;transition:all .15s var(--ease)}.clear-btn:hover{border-color:var(--red);color:var(--red);background:var(--red-l)}.modal-ov{position:fixed;inset:0;background:rgba(30,41,59,.45);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:mf .2s ease}@keyframes mf{from{opacity:0}to{opacity:1}}.modal-box{background:var(--card);border-radius:var(--r-xl);max-width:560px;width:94%;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--sh-l);animation:ms .25s ease}@keyframes ms{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}.modal-hdr{padding:20px 24px 16px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.modal-title{font-family:var(--font-d);font-size:17px;font-weight:700}.modal-close{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border);background:var(--card);color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s}.modal-close:hover{background:var(--red-l);color:var(--red);border-color:var(--red)}.modal-body{padding:20px 24px 24px;overflow-y:auto}.modal-content-box{font-size:14px;color:var(--text);line-height:1.75;padding:14px 16px;background:var(--input-bg);border-radius:var(--r-s);border-left:4px solid var(--primary);margin-bottom:16px;font-weight:500}.toast{position:fixed;top:28px;right:28px;padding:13px 22px;border-radius:var(--r-m);font-size:13px;font-weight:600;font-family:var(--font);box-shadow:var(--sh-l);z-index:2000;display:flex;align-items:center;gap:8px;animation:ti .2s ease}@keyframes ti{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}.toast.success{background:var(--green);color:var(--inv)}.toast.error{background:var(--red);color:var(--inv)}.toast.info{background:var(--primary);color:var(--inv)}@media(max-width:900px){.qbp-right{width:260px}.filter-bar{flex-direction:column;align-items:stretch}.search-wrap{min-width:0}}@media(max-width:680px){.qbp-right{display:none}}
.imported-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden}.tabs-hdr{display:flex;padding:0 12px;background:var(--sidebar-bg);border-bottom:1.5px solid var(--border);gap:4px}.tab-btn{padding:10px 12px;font-size:11px;font-weight:700;color:var(--text3);border:none;background:none;cursor:pointer;position:relative;transition:all .2s}.tab-btn.active{color:var(--primary)}.tab-btn.active::after{content:'';position:absolute;bottom:-1.5px;left:0;right:0;height:2.5px;background:var(--primary);border-radius:2px 2px 0 0}.as-scroll{flex:1;overflow-y:auto;padding:12px}.as-section{margin-bottom:20px}.as-section:last-child{margin-bottom:0}.as-sec-hdr{display:flex;align-items:center;gap:6px;margin-bottom:8px}.as-sec-title{font-size:11px;font-weight:800;color:var(--text);text-transform:uppercase;letter-spacing:.04em;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.as-sec-badge{padding:2px 6px;background:var(--border-l);color:var(--text3);border-radius:4px;font-size:9px;font-weight:700}.as-q-list{display:flex;flex-direction:column;gap:5px}.as-q-item{display:flex;align-items:flex-start;gap:8px;padding:9px 11px;background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-m);transition:all .15s}.as-q-item:hover{border-color:var(--primary);background:var(--hover)}.as-q-idx{width:18px;height:18px;border-radius:50%;background:var(--primary-light);color:var(--primary);font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}.as-q-body{flex:1;min-width:0}.as-q-txt{font-size:11px;font-weight:600;color:var(--text2);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.as-q-meta{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:9px;font-weight:700;color:var(--text3)}.as-q-pts{color:var(--primary)}.bank-sel-custom{position:relative;z-index:1100}.bank-sel-trigger{display:flex;align-items:center;gap:10px;background:var(--primary-light);border:2px solid var(--primary);border-radius:var(--r-m);padding:0 14px;color:var(--primary);cursor:pointer;height:40px;min-width:260px;transition:all .2s var(--ease);user-select:none}.bank-sel-trigger:hover{background:var(--card);box-shadow:0 0 0 4px var(--primary-glow)}.bank-sel-val{flex:1;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bank-sel-trigger svg{flex-shrink:0}.bank-sel-trigger svg:last-child{transition:transform .2s var(--ease);color:var(--text3)}.bank-sel-trigger svg:last-child.open{transform:rotate(180deg);color:var(--primary)}.bank-sel-dropdown{position:absolute;top:calc(100% + 6px);left:0;right:0;background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);box-shadow:var(--sh-l);padding:6px;max-height:300px;overflow-y:auto;animation:dropIn .2s var(--ease)}@keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}.bank-sel-opt{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r-m);cursor:pointer;transition:all .15s;margin-bottom:2px}.bank-sel-opt:last-child{margin-bottom:0}.bank-sel-opt:hover{background:var(--hover);color:var(--primary)}.bank-sel-opt.active{background:var(--primary-light);color:var(--primary)}.bank-sel-opt span{flex:1;font-size:12px;font-weight:600}.bank-sel-opt svg{flex-shrink:0;opacity:.6}.bank-sel-opt.active svg{opacity:1}
`;

const QuestionRow = ({ q, isSelected, onToggle, onPreview, animDelay }) => {
  const [expanded, setExpanded] = useState(false);
  const ti = typeInfo(q.type);

  const handleExpand = (e) => {
    e.stopPropagation();
    setExpanded((p) => !p);
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    onPreview(q);
  };

  const optionsBlock = () => {
    if (q.type === "MULTIPLE_CHOICE" && q.options.length > 0) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {q.options.map((o, oi) => (
            <div key={oi} className={`opt-row${o.correct ? " correct" : ""}`}>
              <div className="opt-letter">{LETTERS[oi]}</div>
              <span style={{ flex: 1 }}>{o.text || "(trống)"}</span>
              {o.correct && <Ic.Check width={11} height={11} />}
            </div>
          ))}
        </div>
      );
    }

    if (q.type === "TRUE_FALSE") {
      const trueCorrect = q.options.find(
        (o) => normalizeTfValue(o.text) === "dung",
      )?.correct;
      const falseCorrect = q.options.find(
        (o) => normalizeTfValue(o.text) === "sai",
      )?.correct;

      return (
        <div className="tf-row">
          <div className={`tf-btn${trueCorrect ? " correct" : ""}`}>
            Đúng{trueCorrect ? " ✓" : ""}
          </div>
          <div className={`tf-btn${falseCorrect ? " correct" : ""}`}>
            Sai{falseCorrect ? " ✓" : ""}
          </div>
        </div>
      );
    }

    if (
      (q.type === "ESSAY" || q.type === "FILL_IN_THE_BLANK") &&
      q.sampleAnswer
    ) {
      return (
        <>
          <div className="ans-label">Đáp án mẫu</div>
          <div className="sample-ans">{q.sampleAnswer}</div>
        </>
      );
    }

    return null;
  };

  return (
    <div
      className={`qr${isSelected ? " selected" : ""}`}
      onClick={() => onToggle(q.id)}
      style={{ animationDelay: `${animDelay}s` }}
    >
      <div className="qr-check">
        {isSelected && <Ic.Check width={10} height={10} />}
      </div>

      <div className="qr-body">
        <div className="qr-badges">
          <span className={`badge badge-${ti.cls}`}>{ti.l}</span>
          <span className="badge badge-cog">{cogLabel(q.cognitiveLevel)}</span>
          {q.subject && (
            <span className="badge badge-subject">{q.subject}</span>
          )}
          {q.topic && <span className="badge badge-topic">{q.topic}</span>}
        </div>

        <div className={`qr-content${!q.content ? " empty" : ""}`}>
          {q.content ? truncate(q.content) : "Chưa có nội dung"}
        </div>

        <div className="qr-meta">
          {q.usageCount > 0 && <span>Dùng {q.usageCount} lần</span>}
        </div>

        {expanded && (
          <div className="qr-expanded" onClick={(e) => e.stopPropagation()}>
            {optionsBlock()}
          </div>
        )}
      </div>

      <div className="qr-pts">{q.points} đ</div>

      <button
        className="qr-expand"
        onClick={handlePreview}
        title="Xem chi tiết"
        style={{ marginRight: 2 }}
      >
        <Ic.Eye width={13} height={13} />
      </button>

      <button
        className={`qr-expand${expanded ? " open" : ""}`}
        onClick={handleExpand}
        title={expanded ? "Thu gọn" : "Xem đáp án"}
      >
        <Ic.ChevDown width={13} height={13} />
      </button>
    </div>
  );
};

const PreviewModal = ({ q, onClose }) => {
  if (!q) return null;
  const ti = typeInfo(q.type);

  return (
    <div className="modal-ov" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <div
              className="qr-badges"
              style={{
                marginBottom: 8,
                display: "flex",
                gap: 5,
                flexWrap: "wrap",
              }}
            >
              <span className={`badge badge-${ti.cls}`}>{ti.l}</span>
              <span className="badge badge-cog">
                {cogLabel(q.cognitiveLevel)}
              </span>
              {q.subject && (
                <span className="badge badge-subject">{q.subject}</span>
              )}
              {q.topic && <span className="badge badge-topic">{q.topic}</span>}
            </div>
            <div className="modal-title">Xem trước câu hỏi</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Ic.Close width={13} height={13} />
          </button>
        </div>

        <div className="modal-body">
          {q.content && <div className="modal-content-box">{q.content}</div>}

          {q.type === "MULTIPLE_CHOICE" && q.options.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 14,
              }}
            >
              {q.options.map((o, oi) => (
                <div
                  key={oi}
                  className={`opt-row${o.correct ? " correct" : ""}`}
                >
                  <div className="opt-letter">{LETTERS[oi]}</div>
                  <span style={{ flex: 1, fontSize: 13 }}>
                    {o.text || "(trống)"}
                  </span>
                  {o.correct && <Ic.Check width={12} height={12} />}
                </div>
              ))}
            </div>
          )}

          {q.type === "TRUE_FALSE" && (
            <div className="tf-row" style={{ marginBottom: 14 }}>
              {["Đúng", "Sai"].map((label) => {
                const isCorrect = q.options.find(
                  (o) => normalizeTfValue(o.text) === normalizeTfValue(label),
                )?.correct;

                return (
                  <div
                    key={label}
                    className={`tf-btn${isCorrect ? " correct" : ""}`}
                    style={{ padding: 12 }}
                  >
                    {label}
                    {isCorrect ? " ✓" : ""}
                  </div>
                );
              })}
            </div>
          )}

          {q.sampleAnswer && (
            <>
              <div className="ans-label">Đáp án mẫu</div>
              <div
                className="sample-ans"
                style={{ fontSize: 13, marginBottom: 12 }}
              >
                {q.sampleAnswer}
              </div>
            </>
          )}

          <div
            style={{
              display: "flex",
              gap: 16,
              padding: "12px 14px",
              background: "var(--border-l)",
              borderRadius: "var(--r-s)",
              fontSize: 12,
              color: "var(--text3)",
              fontWeight: 600,
            }}
          >
            <span>
              Điểm:{" "}
              <strong style={{ color: "var(--primary)" }}>{q.points} đ</strong>
            </span>
            {q.usageCount > 0 && (
              <span>
                Đã dùng: <strong>{q.usageCount} lần</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItem = ({ q, index, onRemove }) => {
  const ti = typeInfo(q.type);

  return (
    <div className="cart-item">
      <div className="cart-item-num">{index + 1}</div>
      <div className="cart-item-body">
        <div className="cart-item-content">
          {q.content ? truncate(q.content, 55) : "Chưa có nội dung"}
        </div>
        <div className="cart-item-meta">
          <span className={`badge badge-${ti.cls}`} style={{ fontSize: 9 }}>
            {ti.short}
          </span>
          <span
            style={{ fontSize: 10, fontWeight: 700, color: "var(--primary)" }}
          >
            {q.points} đ
          </span>
        </div>
      </div>
      <button className="cart-item-rm" onClick={() => onRemove(q.id)}>
        <Ic.X width={11} height={11} />
      </button>
    </div>
  );
};

const QuestionBankPickerPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const assignmentId = toPositiveId(searchParams.get("assignmentId"));
  const bankIdFromQuery = toPositiveId(searchParams.get("bankId"));

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cogFilter, setCogFilter] = useState("");
  const [subjFilter, setSubjFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [page, setPage] = useState(1);

  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [availableBanks, setAvailableBanks] = useState([]);
  const [activeBankId, setActiveBankId] = useState(bankIdFromQuery);
  const [assignmentFormat, setAssignmentFormat] = useState("");
  const [assignmentSections, setAssignmentSections] = useState([]);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionType, setNewSectionType] = useState(SECTION_TYPE.OBJECTIVE);
  const [creatingSection, setCreatingSection] = useState(false);
  const [rightTab, setRightTab] = useState("cart"); // 'cart' | 'imported'

  const [selected, setSelected] = useState(new Map());
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [importing, setImporting] = useState(false);

  // Custom Dropdown State
  const [isBankOpen, setIsBankOpen] = useState(false);
  const bankRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bankRef.current && !bankRef.current.contains(e.target)) {
        setIsBankOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [importedQuestionIds, setImportedQuestionIds] = useState([]);
  const [assignmentTotalQuestions, setAssignmentTotalQuestions] = useState(0);

  const searchTimer = useRef(null);
  const toastTimer = useRef(null);

  const showToast = (msg, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  const isMixedAssignment = assignmentFormat === ASSIGNMENT_FORMAT.MIXED;
  const hasAssignmentSections = assignmentSections.length > 0;

  const fetchBanks = useCallback(async () => {
    try {
      const res = await questionBankApi.getQuestionBanks({
        page: 1,
        size: 100,
      });
      const content = Array.isArray(res?.result?.content)
        ? res.result.content
        : [];

      const mappedBanks = content
        .map((item) => ({
          id: toPositiveId(item?.id),
          name: String(item?.name || "").trim(),
        }))
        .filter((item) => item.id);

      setAvailableBanks(mappedBanks);

      if (!activeBankId && mappedBanks.length > 0) {
        setActiveBankId(mappedBanks[0].id);
      }
    } catch (err) {
      console.error("Load banks failed", err);
    }
  }, [activeBankId]);

  useEffect(() => {
    if (!assignmentId) {
      setAssignmentFormat("");
      setAssignmentSections([]);
      setTargetSectionId(null);
      setImportedQuestionIds([]);
      setAssignmentTotalQuestions(0);
      return;
    }

    let alive = true;

    const loadAssignment = async () => {
      if (!assignmentId) return;
      try {
        const response = await assignmentApi.getAssignment(assignmentId);
        if (!alive) return;

        const result = response?.result || {};
        const normalizedFormat = normalizeAssignmentFormat(result?.format);

        // Map sections from the AssignmentResponse provided in the prompt
        const normalizedSections = Array.isArray(result?.sections)
          ? result.sections
              .map((section) => {
                const sectionId = toPositiveId(
                  section?.id || section?.sectionId,
                );
                if (!sectionId) return null;

                return {
                  id: sectionId,
                  title:
                    String(section?.title || "").trim() || "Phần chưa đặt tên",
                  sectionType: normalizeSectionType(section?.sectionType),
                  questions: Array.isArray(section.questions)
                    ? section.questions
                    : [],
                };
              })
              .filter(Boolean)
          : [];

        setAssignmentFormat(normalizedFormat);
        setAssignmentTotalQuestions(Number(result?.totalQuestions || 0));
        setAssignmentSections(normalizedSections);

        setTargetSectionId((prev) => {
          const safePrev = toPositiveId(prev);
          if (safePrev && normalizedSections.some((s) => s.id === safePrev)) {
            return safePrev;
          }
          return normalizedSections[0]?.id || null;
        });
      } catch (err) {
        if (!alive) return;
        console.error("Load assignment details failed", err);
      }
    };

    loadAssignment();

    return () => {
      alive = false;
    };
  }, [assignmentId]);

  const refreshAssignment = async () => {
    if (!assignmentId) return;
    try {
      const response = await assignmentApi.getAssignment(assignmentId);
      const result = response?.result || {};

      const normalizedSections = Array.isArray(result?.sections)
        ? result.sections
            .map((section) => {
              const sectionId = toPositiveId(section?.id || section?.sectionId);
              if (!sectionId) return null;
              return {
                id: sectionId,
                title:
                  String(section?.title || "").trim() || "Phần chưa đặt tên",
                sectionType: normalizeSectionType(section?.sectionType),
                questions: Array.isArray(section.questions)
                  ? section.questions
                  : [],
              };
            })
            .filter(Boolean)
        : [];

      setAssignmentSections(normalizedSections);
      setAssignmentTotalQuestions(Number(result?.totalQuestions || 0));
    } catch (err) {
      console.error("Refresh assignment failed", err);
    }
  };

  const createMixedSection = async () => {
    if (!assignmentId) {
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

      const response = await assignmentApi.createSection(assignmentId, payload);
      const result = response?.result || {};
      const newSectionId = toPositiveId(result?.id || result?.sectionId);

      if (!newSectionId) {
        throw new Error("Section ID không hợp lệ");
      }

      const createdSection = {
        id: newSectionId,
        title: String(result?.title || safeTitle).trim() || safeTitle,
        sectionType: normalizeSectionType(
          result?.sectionType || newSectionType,
        ),
      };

      setAssignmentSections((prev) => [
        ...prev,
        { ...createdSection, questions: [] },
      ]);
      setTargetSectionId((prev) => prev || createdSection.id);
      setNewSectionTitle("");
      showToast("Tạo phần mới thành công.");
      await refreshAssignment();
    } catch (err) {
      showToast(err?.response?.data?.message || "Không thể tạo phần.", "error");
    } finally {
      setCreatingSection(false);
    }
  };

  const fetchQuestions = useCallback(async (params) => {
    const safeBankId = toPositiveId(params?.bankId);

    if (!safeBankId) {
      setQuestions([]);
      setTotal(0);
      setError("Vui lòng chọn ngân hàng câu hỏi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await questionBankApi.getQuestions(safeBankId, {
        page: params.page,
        size: PAGE_SIZE,
        keyword: params.search || undefined,
        type: params.type || undefined,
        cognitiveLevel: params.cogFilter || undefined,
        sortBy: "createdAt",
        sortDirection: "DESC",
      });

      const content = Array.isArray(res?.result?.content)
        ? res.result.content
        : [];
      const totalElements =
        res?.result?.totalElements ?? res?.result?.total ?? content.length;
      const normalized = content.map(normalizeQuestion);

      const clientFiltered = normalized.filter((q) => {
        const byCog = params.cogFilter
          ? String(q.cognitiveLevel || "").toUpperCase() ===
            String(params.cogFilter || "").toUpperCase()
          : true;
        const bySubject = params.subjFilter
          ? String(q.subject || "").toLowerCase() ===
            String(params.subjFilter || "").toLowerCase()
          : true;
        const byTopic = params.topicFilter
          ? String(q.topic || "").toLowerCase() ===
            String(params.topicFilter || "").toLowerCase()
          : true;

        return byCog && bySubject && byTopic;
      });

      setQuestions(clientFiltered);
      setTotal(totalElements);

      const subs = [
        ...new Set(normalized.map((q) => q.subject).filter(Boolean)),
      ];
      const tops = [...new Set(normalized.map((q) => q.topic).filter(Boolean))];

      if (subs.length) {
        setSubjects((prev) => [...new Set([...prev, ...subs])]);
      }

      if (tops.length) {
        setTopics((prev) => [...new Set([...prev, ...tops])]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Không thể tải ngân hàng câu hỏi.",
      );
      setQuestions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  useEffect(() => {
    const currentBankId = toPositiveId(searchParams.get("bankId"));
    if (activeBankId && currentBankId !== activeBankId) {
      const next = new URLSearchParams(searchParams);
      next.set("bankId", String(activeBankId));
      setSearchParams(next, { replace: true });
    }
  }, [activeBankId, searchParams, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, cogFilter, subjFilter, topicFilter, activeBankId]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      fetchQuestions({
        bankId: activeBankId,
        page,
        search,
        type: typeFilter,
        cogFilter,
        subjFilter,
        topicFilter,
      });
    }, 350);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [
    page,
    search,
    typeFilter,
    cogFilter,
    subjFilter,
    topicFilter,
    activeBankId,
    fetchQuestions,
  ]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  const toggleSelect = (id) => {
    const q = questions.find((item) => item.id === id);

    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (q) {
        next.set(id, q);
      }
      return next;
    });
  };

  const selectAllPage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      questions.forEach((q) => next.set(q.id, q));
      return next;
    });
  };

  const deselectAllPage = () => {
    setSelected((prev) => {
      const next = new Map(prev);
      questions.forEach((q) => next.delete(q.id));
      return next;
    });
  };

  const removeFromCart = (id) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const clearCart = () => setSelected(new Map());

  const handleBack = () => {
    const query = searchParams.toString();
    navigate(
      query
        ? `${PATH_TEACHER.assignmentCreateMethod}?${query}`
        : PATH_TEACHER.assignmentCreateMethod,
    );
  };

  const goToPreview = () => {
    const params = new URLSearchParams();

    if (assignmentId) {
      params.set("assignmentId", String(assignmentId));
    }

    if (activeBankId) {
      params.set("bankId", String(activeBankId));
    }

    const query = params.toString();
    navigate(
      query
        ? `${PATH_TEACHER.assignmentCreateManualQuestionsPreview}?${query}`
        : PATH_TEACHER.assignmentCreateManualQuestionsPreview,
    );
  };

  const handleAddToAssignment = async () => {
    if (!selected.size) return;

    const resolvedSectionId = toPositiveId(targetSectionId);

    if (isMixedAssignment && !resolvedSectionId) {
      showToast("Vui lòng chọn section để import câu hỏi.", "error");
      return;
    }

    setSaving(true);

    try {
      const questionIds = Array.from(selected.keys())
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0);

      if (assignmentId) {
        let sessionId = toPositiveId(searchParams.get("sessionId"));

        // Nếu chưa có sessionId, tạo session mới
        if (!sessionId) {
          const initResp =
            await assignmentApi.initAssignmentWorkspace(assignmentId);
          sessionId = toPositiveId(
            initResp?.result?.sessionId ||
              initResp?.result?.id ||
              initResp?.result,
          );

          if (!sessionId) {
            throw new Error("Không thể tạo session workspace.");
          }
        }

        // Gọi addFromBankToSession để thêm câu hỏi vào session
        await assignmentApi.addFromBankToSession(
          sessionId,
          assignmentId,
          resolvedSectionId,
          questionIds,
        );

        showToast(`Đã thêm ${questionIds.length} câu hỏi vào bản nháp!`);

        // Navigate tới preview với sessionId
        const next = new URLSearchParams();
        next.set("assignmentId", String(assignmentId));
        next.set("sessionId", String(sessionId));
        if (activeBankId) {
          next.set("bankId", String(activeBankId));
        }

        navigate(
          `${PATH_TEACHER.assignmentCreateManualQuestionsPreview}?${next.toString()}`,
        );
        return;
      } else {
        const next = new URLSearchParams();
        if (activeBankId) next.set("bankId", String(activeBankId));
        if (questionIds.length) next.set("pickedIds", questionIds.join(","));

        const query = next.toString();
        navigate(
          query
            ? `${PATH_TEACHER.assignmentCreateManual}?${query}`
            : PATH_TEACHER.assignmentCreateManual,
        );
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Thêm câu hỏi thất bại",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePublishAssignment = async () => {
    if (!assignmentId) {
      showToast("Thiếu assignmentId để xuất bản.", "error");
      return;
    }

    const selectedQuestionIds = importedQuestionIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (!selectedQuestionIds.length && assignmentTotalQuestions <= 0) {
      showToast("Vui lòng import câu hỏi trước khi xuất bản.", "error");
      return;
    }

    setPublishing(true);
    try {
      await assignmentApi.publishAssignment(assignmentId);
      showToast("Xuất bản bài tập thành công.");
      setTimeout(
        () => navigate(PATH_TEACHER.assignmentDetail(assignmentId)),
        850,
      );
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Xuất bản bài tập thất bại",
        "error",
      );
    } finally {
      setPublishing(false);
    }
  };

  const selectedArr = Array.from(selected.values());
  const totalPoints = selectedArr.reduce(
    (sum, q) => sum + (Number(q.points) || 0),
    0,
  );
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFilters = [typeFilter, cogFilter, subjFilter, topicFilter].filter(
    Boolean,
  ).length;

  const allPageSelected =
    questions.length > 0 && questions.every((q) => selected.has(q.id));
  const somePageSelected = questions.some((q) => selected.has(q.id));

  const pageNumbers = useMemo(() => {
    const nums = [];
    for (
      let i = Math.max(1, page - 2);
      i <= Math.min(totalPages || 1, page + 2);
      i += 1
    ) {
      nums.push(i);
    }
    return nums;
  }, [page, totalPages]);

  return (
    <div className="qbp-page">
      <style>{CSS}</style>

      <div className="qbp-left">
        <div className="topbar">
          <div className="topbar-l">
            <button className="bk-btn" onClick={handleBack}>
              <Ic.ArrowLeft width={13} height={13} /> Quay lại
            </button>
            <span className="topbar-title">Ngân hàng câu hỏi</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}
            >
              {total} câu hỏi
            </span>
            <button
              className="bk-btn"
              onClick={() =>
                fetchQuestions({
                  bankId: activeBankId,
                  page,
                  search,
                  type: typeFilter,
                  cogFilter,
                  subjFilter,
                  topicFilter,
                })
              }
              disabled={loading}
            >
              <Ic.Refresh width={12} height={12} /> Làm mới
            </button>
            <button
              className="bk-btn"
              onClick={goToPreview}
              disabled={!assignmentId}
              title={assignmentId ? "Xem Preview" : "Thiếu assignmentId"}
            >
              <Ic.Eye width={12} height={12} /> Xem Preview
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-wrap">
            <Ic.Search width={14} height={14} />
            <input
              className="search-inp"
              placeholder="Tìm theo nội dung câu hỏi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {availableBanks.length > 0 && (
            <div className="bank-sel-custom" ref={bankRef}>
              <div
                className="bank-sel-trigger"
                onClick={() => setIsBankOpen(!isBankOpen)}
              >
                <Ic.Layers width={16} height={16} />
                <div className="bank-sel-val">
                  {availableBanks.find((b) => b.id === activeBankId)?.name ||
                    "Chọn ngân hàng câu hỏi..."}
                </div>
                <Ic.ChevronDown
                  width={14}
                  height={14}
                  className={isBankOpen ? "open" : ""}
                />
              </div>

              {isBankOpen && (
                <div className="bank-sel-dropdown">
                  {availableBanks.map((bank) => (
                    <div
                      key={bank.id}
                      className={`bank-sel-opt ${
                        bank.id === activeBankId ? "active" : ""
                      }`}
                      onClick={() => {
                        setActiveBankId(toPositiveId(bank.id));
                        setIsBankOpen(false);
                      }}
                    >
                      <Ic.Layers width={13} height={13} />
                      <span>{bank.name}</span>
                      {bank.id === activeBankId && (
                        <Ic.Check width={12} height={12} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <select
            className="fsel"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Loại câu hỏi</option>
            {Q_TYPES.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>

          <select
            className="fsel"
            value={cogFilter}
            onChange={(e) => setCogFilter(e.target.value)}
          >
            <option value="">Mức nhận thức</option>
            {COG_LEVELS.map((c) => (
              <option key={c.v} value={c.v}>
                {c.l}
              </option>
            ))}
          </select>

          {subjects.length > 0 && (
            <select
              className="fsel"
              value={subjFilter}
              onChange={(e) => setSubjFilter(e.target.value)}
            >
              <option value="">Môn học</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {topics.length > 0 && (
            <select
              className="fsel"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            >
              <option value="">Chủ đề / Chương</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {activeFilters > 0 && (
            <button
              className="filter-active-count"
              onClick={() => {
                setTypeFilter("");
                setCogFilter("");
                setSubjFilter("");
                setTopicFilter("");
                setSearch("");
              }}
            >
              <Ic.X width={11} height={11} /> Xóa lọc ({activeFilters})
            </button>
          )}
        </div>

        {isMixedAssignment && (
          <div
            style={{
              padding: "14px 20px 12px",
              background: "var(--card)",
              borderBottom: "1.5px solid var(--border)",
            }}
          >
            <div
              style={{
                border: "1.5px solid var(--border)",
                borderRadius: 14,
                padding: 12,
                background: "var(--sidebar-bg)",
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                Chọn section để thêm câu hỏi
              </div>

              <input
                className="search-inp"
                placeholder="Tiêu đề phần (ví dụ: Phần A - Trắc nghiệm)"
                value={newSectionTitle}
                onChange={(event) => setNewSectionTitle(event.target.value)}
                style={{ paddingLeft: 12 }}
              />

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select
                  className="fsel"
                  value={newSectionType}
                  onChange={(event) => setNewSectionType(event.target.value)}
                  style={{ minWidth: 190, flex: "1 1 220px" }}
                >
                  {SECTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="bk-btn"
                  onClick={createMixedSection}
                  disabled={creatingSection}
                  style={{ minWidth: 130, justifyContent: "center" }}
                >
                  <Ic.Plus width={12} height={12} />
                  {creatingSection ? "Đang tạo..." : "Tạo phần"}
                </button>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text2)",
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                  }}
                >
                  Section nhận câu hỏi import
                </label>

                <select
                  className="fsel"
                  value={targetSectionId || ""}
                  onChange={(event) =>
                    setTargetSectionId(toPositiveId(event.target.value))
                  }
                  style={{ width: "100%" }}
                >
                  <option value="">Chọn section đích</option>
                  {assignmentSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title} ·{" "}
                      {SECTION_TYPE_LABEL[section.sectionType] ||
                        "Phần trắc nghiệm"}
                    </option>
                  ))}
                </select>

                {!assignmentSections.length && (
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>
                    Chưa có section nào. Hãy tạo section trước khi import câu
                    hỏi.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="q-scroll">
          {!loading && questions.length > 0 && (
            <div className="sel-all-bar">
              <div className="sel-all-l">
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `2px solid ${allPageSelected ? "var(--primary)" : "var(--border)"}`,
                    background: allPageSelected
                      ? "var(--primary)"
                      : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all .12s",
                  }}
                  onClick={allPageSelected ? deselectAllPage : selectAllPage}
                >
                  {(allPageSelected || somePageSelected) && (
                    <Ic.Check
                      width={9}
                      height={9}
                      style={{
                        color: allPageSelected ? "#fff" : "var(--primary)",
                      }}
                    />
                  )}
                </div>

                <span
                  style={{ cursor: "pointer" }}
                  onClick={allPageSelected ? deselectAllPage : selectAllPage}
                >
                  {allPageSelected
                    ? "Bỏ chọn trang này"
                    : "Chọn tất cả trang này"}
                </span>
              </div>

              <span className="sel-all-r">
                Trang {page}/{totalPages || 1} · {total} câu
              </span>
            </div>
          )}

          {loading && (
            <div className="state-box">
              <div className="state-icon">
                <Ic.Layers width={26} height={26} />
              </div>
              <div className="state-title">Đang tải câu hỏi...</div>
            </div>
          )}

          {!loading && error && (
            <div className="state-box">
              <div
                className="state-icon"
                style={{ background: "var(--red-l)", color: "var(--red)" }}
              >
                <Ic.FileText width={26} height={26} />
              </div>
              <div className="state-title" style={{ color: "var(--red)" }}>
                {error}
              </div>
            </div>
          )}

          {!loading && !error && questions.length === 0 && (
            <div className="state-box">
              <div className="state-icon">
                <Ic.FileText width={26} height={26} />
              </div>
              <div className="state-title">Không tìm thấy câu hỏi</div>
              <div className="state-text">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
              </div>
            </div>
          )}

          {!loading &&
            !error &&
            questions.map((q, idx) => (
              <QuestionRow
                key={q.id}
                q={q}
                isSelected={selected.has(q.id)}
                onToggle={toggleSelect}
                onPreview={setPreview}
                animDelay={idx * 0.03}
              />
            ))}

          {!loading && totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Ic.ChevLeft width={13} height={13} />
              </button>

              {pageNumbers[0] > 1 && (
                <>
                  <button className="page-btn" onClick={() => setPage(1)}>
                    1
                  </button>
                  {pageNumbers[0] > 2 && <span className="page-info">...</span>}
                </>
              )}

              {pageNumbers.map((n) => (
                <button
                  key={n}
                  className={`page-btn${page === n ? " active" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}

              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="page-info">...</span>
                  )}
                  <button
                    className="page-btn"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <Ic.ChevRight width={13} height={13} />
              </button>

              <span className="page-info">{total} câu</span>
            </div>
          )}
        </div>
      </div>

      <div className="qbp-right">
        <div className="cart-hdr">
          <div className="cart-hdr-title">
            <Ic.Layers width={14} height={14} />
            Câu hỏi đã chọn
          </div>
          <div className="cart-hdr-sub">
            {assignmentId
              ? `Thêm vào bài tập #${assignmentId}`
              : "Chọn để thêm vào bài tập"}
          </div>
        </div>

        <div className="cart-stats">
          <div className="cart-stat">
            <div className="cart-stat-val">{assignmentTotalQuestions}</div>
            <div className="cart-stat-label">Câu hiện có</div>
          </div>
          <div className="cart-stat">
            <div className="cart-stat-val">{selected.size}</div>
            <div className="cart-stat-label">Đang chọn</div>
          </div>
        </div>

        <div className="tabs-hdr">
          <button
            className={`tab-btn${rightTab === "cart" ? " active" : ""}`}
            onClick={() => setRightTab("cart")}
          >
            Đang chọn ({selected.size})
          </button>
          <button
            className={`tab-btn${rightTab === "imported" ? " active" : ""}`}
            onClick={() => setRightTab("imported")}
          >
            Đã thêm ({assignmentTotalQuestions})
          </button>
        </div>

        <div className="imported-wrap">
          {rightTab === "cart" ? (
            <div className="cart-scroll">
              {selected.size === 0 ? (
                <div className="cart-empty">
                  <Ic.FileText
                    width={32}
                    height={32}
                    style={{ color: "var(--text3)" }}
                  />
                  <p>
                    Chưa chọn câu hỏi nào.
                    <br />
                    Tích vào câu hỏi bên trái để thêm.
                  </p>
                </div>
              ) : (
                selectedArr.map((q, idx) => (
                  <CartItem
                    key={q.id}
                    q={q}
                    index={idx}
                    onRemove={removeFromCart}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="as-scroll">
              {assignmentSections.length === 0 ? (
                <div className="cart-empty">
                  <Ic.FileText
                    width={32}
                    height={32}
                    style={{ color: "var(--text3)" }}
                  />
                  <p>Chưa có câu hỏi nào được thêm vào bài tập.</p>
                </div>
              ) : (
                assignmentSections.map((section) => (
                  <div key={section.id} className="as-section">
                    <div className="as-sec-hdr">
                      <div className="as-sec-title">{section.title}</div>
                      <span className="as-sec-badge">
                        {section.questions.length} câu
                      </span>
                    </div>
                    <div className="as-q-list">
                      {section.questions.length === 0 ? (
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text3)",
                            padding: "4px 8px",
                            fontStyle: "italic",
                          }}
                        >
                          Trống
                        </div>
                      ) : (
                        section.questions.map((aq, aqIdx) => (
                          <div key={aq.id} className="as-q-item">
                            <div className="as-q-idx">{aqIdx + 1}</div>
                            <div className="as-q-body">
                              <div className="as-q-txt">
                                {aq.question?.content || "(Không có nội dung)"}
                              </div>
                              <div className="as-q-meta">
                                <span className="as-q-pts">
                                  {aq.points || 0} đ
                                </span>
                                <span>·</span>
                                <span>
                                  {typeInfo(aq.question?.questionType).short}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="cart-footer">
          {rightTab === "cart" && selected.size > 0 && (
            <div className="cart-pts-row">
              <span className="cart-pts-label">Tổng điểm chọn</span>
              <span className="cart-pts-val">
                {totalPoints.toFixed(totalPoints % 1 === 0 ? 0 : 2)} đ
              </span>
            </div>
          )}

          <button
            className="add-btn"
            onClick={handleAddToAssignment}
            disabled={
              !selected.size ||
              saving ||
              publishing ||
              (isMixedAssignment && !toPositiveId(targetSectionId))
            }
          >
            <Ic.Send width={13} height={13} />
            {saving
              ? "Đang thêm..."
              : isMixedAssignment && !toPositiveId(targetSectionId)
                ? "Chọn section trước khi import"
                : selected.size
                  ? `Thêm ${selected.size} câu vào bài tập`
                  : "Chưa chọn câu hỏi"}
          </button>

          <button
            className="add-btn"
            onClick={handlePublishAssignment}
            disabled={publishing || saving || !assignmentId}
            style={{ marginTop: 8 }}
          >
            <Ic.FileText width={13} height={13} />
            {publishing ? "Đang xuất bản..." : "Xuất bản"}
          </button>

          {rightTab === "cart" && selected.size > 0 && (
            <button className="clear-btn" onClick={clearCart}>
              <Ic.Trash width={11} height={11} style={{ marginRight: 4 }} />
              Xóa tất cả lựa chọn
            </button>
          )}
        </div>
      </div>

      {preview && <PreviewModal q={preview} onClose={() => setPreview(null)} />}

      {toast && (
        <div className={`toast ${toast.type}`}>
          <Ic.Check width={13} height={13} /> {toast.msg}
        </div>
      )}
    </div>
  );
};

export default QuestionBankPickerPage;
