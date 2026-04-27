import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PATH_TEACHER } from "@/routes/paths";
import { questionBankApi } from "@/apis/question-bank.api";
import useDebounce from "@/hooks/use-debounce";
import {
  getLabelFromOptions,
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";

/* ─────────────────────────── constants ─────────────────────────── */

const COG = [
  {
    v: "REMEMBERING",
    l: "Nhớ",
    d: "Nhận biết, ghi nhớ",
    c: "#10B981",
    bg: "#ECFDF5",
    border: "#86EFAC",
    text: "#047857",
  },
  {
    v: "UNDERSTANDING",
    l: "Hiểu",
    d: "Giải thích, diễn giải",
    c: "#0EA5E9",
    bg: "#ECFEFF",
    border: "#67E8F9",
    text: "#0E7490",
  },
  {
    v: "APPLYING",
    l: "Vận dụng",
    d: "Áp dụng tình huống",
    c: "#2563EB",
    bg: "#EFF6FF",
    border: "#93C5FD",
    text: "#1D4ED8",
  },
  {
    v: "ANALYZING",
    l: "Phân tích",
    d: "So sánh, phân biệt",
    c: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    text: "#6D28D9",
  },
  {
    v: "EVALUATING",
    l: "Đánh giá",
    d: "Phán xét, nhận định",
    c: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FCD34D",
    text: "#B45309",
  },
  {
    v: "CREATING",
    l: "Sáng tạo",
    d: "Tạo mới, thiết kế",
    c: "#EF4444",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    text: "#B91C1C",
  },
];

const QTYPES = [
  { v: "MULTIPLE_CHOICE", l: "Trắc nghiệm", ic: "MC", cls: "badge-mc" },
  { v: "TRUE_FALSE", l: "Đúng / Sai", ic: "TF", cls: "badge-tf" },
  { v: "FILL_IN_THE_BLANK", l: "Điền khuyết", ic: "FB", cls: "badge-fb" },
  { v: "ESSAY", l: "Tự luận", ic: "ES", cls: "badge-es" },
];

const LETTERS = "ABCDEFGH";

const ITEMS_PER_PAGE = 10;

/* ─────────────────────────── icons ─────────────────────────── */

const Ic = {
  ArrowL: () => (
    <svg
      width="14"
      height="14"
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
  Sparkles: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 3l1.9 5.8a2 2 0 001.3 1.3L21 12l-5.8 1.9a2 2 0 00-1.3 1.3L12 21l-1.9-5.8a2 2 0 00-1.3-1.3L3 12l5.8-1.9a2 2 0 001.3-1.3L12 3z" />
    </svg>
  ),
  Search: () => (
    <svg
      width="13"
      height="13"
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
  Download: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Upload: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Check: () => (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Edit: () => (
    <svg
      width="11"
      height="11"
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
  Copy: () => (
    <svg
      width="11"
      height="11"
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
      width="11"
      height="11"
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
  Plus: () => (
    <svg
      width="12"
      height="12"
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
  ChevL: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevR: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  X: () => (
    <svg
      width="12"
      height="12"
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
  Calendar: () => (
    <svg
      width="10"
      height="10"
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
  User: () => (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Book: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  Loader: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--p)"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  ),
};

/* ─────────────────────────── CSS ─────────────────────────── */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --p:#2563EB;--pd:#1D4ED8;--pl:#EFF6FF;--plr:#F8FAFF;--pg:rgba(37,99,235,.10);--ps:rgba(37,99,235,.22);
  --gr:linear-gradient(135deg,#3B82F6,#2563EB 50%,#1D4ED8);
  --bg:#F7F8FC;--card:#FFF;--inp:#F5F7FB;--hov:#EDF2FF;
  --t:#1E293B;--t2:#475569;--t3:#94A3B8;--inv:#FFF;
  --gn:#10B981;--gnl:#ECFDF5;--or:#F59E0B;--orl:#FFFBEB;
  --rd:#EF4444;--rdl:#FEF2F2;--pu:#8B5CF6;--pul:#F5F3FF;
  --b:#E2E8F0;--bl:#F1F5F9;
  --ss:0 1px 3px rgba(30,41,59,.04);--sm:0 4px 14px rgba(30,41,59,.07);
  --rs:10px;--rm:12px;--rl:16px;--rxl:20px;
  --f:'Be Vietnam Pro',sans-serif;
  --e:cubic-bezier(.4,0,.2,1);
}
.app-content-wrapper{display:flex;flex-direction:column;height:calc(100vh - 140px);overflow:hidden;background:var(--bg);font-family:var(--f);color:var(--t);border-radius:var(--rl);border:1px solid var(--b);box-shadow:var(--ss)}

/* TOP BAR */
.top-bar{height:54px;background:var(--card);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex-shrink:0}
.top-l{display:flex;align-items:center;gap:10px}
.bk-btn{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid var(--b);border-radius:var(--rs);background:var(--card);font-size:11px;font-weight:600;color:var(--t2);cursor:pointer;transition:all .15s var(--e);font-family:var(--f)}
.bk-btn:hover{border-color:var(--p);color:var(--p)}
.top-t{font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px}
.bank-ic{width:26px;height:26px;border-radius:8px;background:var(--gr);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sep-line{width:1px;height:18px;background:var(--b)}
.top-r{display:flex;gap:6px;align-items:center}
.btn-action{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:var(--rm);font-size:11px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;transition:all .2s var(--e)}
.btn-p{background:var(--gr);color:var(--inv);box-shadow:0 2px 10px var(--ps)}
.btn-p:hover{transform:translateY(-1px)}
.btn-g{background:var(--card);color:var(--t2);border:1.5px solid var(--b)}
.btn-g:hover{border-color:var(--p);color:var(--p);background:var(--hov)}

/* LAYOUT */
.main-layout{display:flex;flex:1;overflow:hidden}

/* SIDEBAR */
.sb-sidebar{width:242px;background:var(--card);border-right:1px solid var(--b);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto}
.sb-hd{padding:14px 16px 10px;border-bottom:1px solid var(--b)}
.sb-title{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.search-wrap{display:flex;align-items:center;gap:6px;background:var(--inp);border:1.5px solid var(--b);border-radius:var(--rm);padding:7px 10px;transition:all .2s}
.search-wrap:focus-within{border-color:var(--p);background:var(--card)}
.search-wrap input{border:none;background:none;font-size:12px;font-family:var(--f);color:var(--t);outline:none;width:100%}
.search-wrap input::placeholder{color:var(--t3)}
.sb-section{padding:10px 12px 6px}
.sb-lbl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;padding:4px 4px 6px}
.fi-item{display:flex;align-items:center;justify-content:space-between;padding:7px 8px;border-radius:var(--rs);cursor:pointer;transition:all .15s;gap:6px}
.fi-item:hover{background:var(--hov)}
.fi-item.on{background:var(--pl)}
.fi-l{display:flex;align-items:center;gap:7px;flex:1;min-width:0}
.fi-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.fi-name{font-size:12px;font-weight:600;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fi-item.on .fi-name{color:var(--p)}
.fi-cnt{font-size:10px;font-weight:700;color:var(--t3);background:var(--bl);padding:1px 7px;border-radius:8px;flex-shrink:0}
.fi-item.on .fi-cnt{background:var(--pg);color:var(--p)}
.sb-divider{height:1px;background:var(--b);margin:6px 12px}
.sb-stats{padding:10px 16px 14px;display:flex;flex-direction:column;gap:6px}
.stat-row{display:flex;justify-content:space-between;align-items:center;font-size:11px}
.stat-label{color:var(--t3);font-weight:500}
.stat-value{font-weight:700;color:var(--t)}

/* CONTENT */
.content-area{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}
.content-bar{background:var(--card);border-bottom:1px solid var(--b);padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;flex-wrap:wrap}
.chips-list{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
.chip-lbl{font-size:11px;font-weight:700;color:var(--t3)}
.chip-item{padding:5px 11px;border-radius:16px;font-size:11px;font-weight:700;border:1.5px solid var(--b);background:var(--card);color:var(--t2);cursor:pointer;transition:all .15s;font-family:var(--f)}
.chip-item:hover{border-color:var(--p);color:var(--p)}
.chip-item.on{border-color:var(--p);background:var(--pl);color:var(--p)}
.bar-r{display:flex;align-items:center;gap:8px;flex-shrink:0}
.result-cnt{font-size:11px;color:var(--t3);font-weight:600;white-space:nowrap}
.sort-sel{height:30px;padding:0 8px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:11px;font-family:var(--f);color:var(--t2);background:var(--card);font-weight:600;outline:none;cursor:pointer}
.sort-sel:focus{border-color:var(--p)}

/* QUESTION LIST */
.q-scroll{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:8px}

/* QUESTION CARD */
.qcard{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);overflow:hidden;transition:all .2s var(--e);animation:fadeUp .22s ease both}
.qcard:hover{border-color:var(--p);box-shadow:var(--sm);transform:translateY(-1px)}
.qcard.sel{border-color:var(--p);background:var(--plr);box-shadow:0 0 0 3px var(--pg)}
.qcard-main{padding:14px 16px 12px}
.qcard-top{display:flex;align-items:flex-start;gap:10px}
.qcard-check{flex-shrink:0;margin-top:3px}
.qcard-check input{width:14px;height:14px;cursor:pointer;accent-color:var(--p)}
.qcard-num{min-width:24px;height:24px;border-radius:50%;background:var(--p);color:var(--inv);font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.qcard-body{flex:1;min-width:0}
.qcard-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:5px}
.badge{padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;display:inline-block}
.badge-mc{background:var(--pl);color:var(--p)}
.badge-tf{background:var(--gnl);color:var(--gn)}
.badge-fb{background:var(--orl);color:var(--or)}
.badge-es{background:var(--pul);color:var(--pu)}
.qcard-prompt{font-size:13px;font-weight:600;line-height:1.65;color:var(--t)}
.qopts{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.qopt{padding:4px 10px;border-radius:8px;font-size:11px;font-weight:500;color:var(--t2);border:1px solid var(--bl);background:var(--bl)}
.qopt.ok{border-color:var(--gn);background:var(--gnl);color:var(--gn);font-weight:700}
.qcard-footer{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-top:1px solid var(--bl);background:var(--bg)}
.footer-l{display:flex;align-items:center;gap:12px}
.qmeta{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:var(--t3)}
.footer-r{display:flex;gap:2px}
.ab-btn{display:flex;align-items:center;gap:4px;padding:5px 9px;border-radius:var(--rs);border:none;background:none;font-size:10px;font-weight:600;font-family:var(--f);color:var(--t3);cursor:pointer;transition:all .15s}
.ab-btn:hover{background:var(--hov);color:var(--p)}
.ab-btn.dng:hover{background:var(--rdl);color:var(--rd)}

/* PAGINATION */
.pag-wrap{padding:10px 20px;background:var(--card);border-top:1px solid var(--b);display:flex;align-items:center;flex-shrink:0;gap:8px}
.pag-info{font-size:11px;color:var(--t3);font-weight:600;flex:1}
.pag-nav{display:flex;align-items:center;gap:4px}
.pg-btn{width:30px;height:30px;border-radius:var(--rs);border:1.5px solid var(--b);background:var(--card);font-size:11px;font-weight:700;font-family:var(--f);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.pg-btn:hover:not(:disabled){border-color:var(--p);color:var(--p)}
.pg-btn.on{background:var(--p);color:#fff;border-color:var(--p)}
.pg-btn:disabled{opacity:.35;cursor:not-allowed}

/* BULK TOOLBAR */
.bulk-bar{position:absolute;bottom:0;left:0;right:0;height:52px;background:var(--card);border-top:1px solid var(--b);display:flex;align-items:center;padding:0 20px;gap:10px;box-shadow:0 -4px 14px rgba(30,41,59,.08);transition:transform .25s var(--e),opacity .25s var(--e);z-index:10}
.bulk-bar.hidden{transform:translateY(100%);opacity:0;pointer-events:none}
.sel-cnt{font-size:12px;font-weight:700;color:var(--p)}

/* EMPTY */
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:10px;padding:40px;text-align:center}
.empty-ic{width:52px;height:52px;border-radius:var(--rxl);background:var(--pl);color:var(--p);display:flex;align-items:center;justify-content:center;margin-bottom:2px}
.empty-state h3{font-size:15px;font-weight:700}
.empty-state p{font-size:12px;color:var(--t3);max-width:240px;line-height:1.6}

.spin-anim{animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

/* Modal CSS */
.modal-overlay {position:fixed;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(3px);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeUp .2s}
.modal-content {background:var(--card);width:100%;max-width:600px;border-radius:var(--rxl);box-shadow:0 10px 40px rgba(0,0,0,.15);display:flex;flex-direction:column;max-height:90vh;overflow:hidden}
.modal-hdr {padding:16px 20px;border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;background:var(--bg)}
.modal-hdr h3 {font-size:16px;font-weight:700;color:var(--t)}
.modal-close {width:28px;height:28px;border-radius:8px;border:none;background:none;color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.modal-close:hover {background:var(--rdl);color:var(--rd)}
.modal-body {padding:20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:16px}
.form-group {display:flex;flex-direction:column;gap:6px}
.form-group label {font-size:12px;font-weight:700;color:var(--t2)}
.form-control {padding:10px 12px;border:1.5px solid var(--b);border-radius:var(--rm);font-family:var(--f);font-size:13px;outline:none;transition:all .2s;background:var(--inp)}
.form-control:focus {border-color:var(--p);background:var(--card)}
.form-row {display:flex;gap:12px}
.form-row > * {flex:1}
.modal-ftr {padding:16px 20px;border-top:1px solid var(--b);background:var(--bg);display:flex;justify-content:flex-end;gap:10px}
.opt-row {display:flex;align-items:center;gap:10px;margin-bottom:8px}
.opt-check {width:18px;height:18px;cursor:pointer;accent-color:var(--gn)}
.opt-input {flex:1;padding:8px 12px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:13px;font-family:var(--f);outline:none;background:var(--inp)}
.opt-input:focus {border-color:var(--p);background:var(--card)}
.opt-del {width:28px;height:28px;border-radius:8px;border:none;background:none;color:var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center}
.opt-del:hover {background:var(--rdl);color:var(--rd)}
.opt-add {align-self:flex-start;padding:6px 12px;font-size:11px;font-weight:600;color:var(--p);background:var(--pl);border:none;border-radius:8px;cursor:pointer}
.opt-add:hover {background:var(--p);color:var(--inv)}
`;

/* ─────────────────────────── helpers ─────────────────────────── */

const getCogUi = (v) =>
  COG.find((c) => c.v === v) || {
    label: "?",
    bg: "#F8FAFC",
    border: "#CBD5E1",
    text: "#475569",
    l: "?",
  };
const getTypeUi = (v) =>
  QTYPES.find((t) => t.v === v) || { l: "?", ic: "?", cls: "" };

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/* ─────────────────────────── QuestionCard ─────────────────────────── */

function QuestionCard({ question, index, checked, onToggle, onEdit, onDelete }) {
  const cog = getCogUi(question.cognitiveLevel);
  const typeUi = getTypeUi(question.questionType);

  const isTrueFalse = question.questionType === "TRUE_FALSE";
  const isMultipleChoice = question.questionType === "MULTIPLE_CHOICE";
  const isFillBlank =
    question.questionType === "FILL_IN_THE_BLANK" ||
    question.questionType === "FILL_IN_BLANK";
  const isEssay = question.questionType === "ESSAY";

  // For True/False
  let tfCorrect = null;
  if (isTrueFalse && question.options) {
    const corOpt = question.options.find((o) => o.correct || o.isCorrect);
    if (corOpt) {
      tfCorrect =
        corOpt.content.toLowerCase().includes("true") ||
        corOpt.content.toLowerCase() === "đúng";
    }
  }

  return (
    <div
      className={`qcard${checked ? " sel" : ""}`}
      style={{ animationDelay: `${(index % 10) * 0.04}s` }}
    >
      <div className="qcard-main">
        <div className="qcard-top">
          <div className="qcard-check">
            <input
              type="checkbox"
              checked={checked}
              onChange={onToggle}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="qcard-num">{index + 1}</div>
          <div className="qcard-body">
            <div className="qcard-meta">
              <span className={`badge ${typeUi.cls}`}>{typeUi.l}</span>
              <span
                className="badge"
                style={{
                  background: cog.bg,
                  border: `1px solid ${cog.border}`,
                  color: cog.text,
                }}
              >
                Mức độ: {cog.l}
              </span>
              {question.usedIn > 0 ? (
                <span className="badge" style={{ background: "var(--gnl)", color: "var(--gn)" }}>
                  Dùng trong {question.usedIn} đề
                </span>
              ) : (
                <span className="badge" style={{ background: "var(--bl)", color: "var(--t3)" }}>
                  Chưa dùng
                </span>
              )}
            </div>
            <div className="qcard-prompt">{question.content}</div>

            {/* MC options */}
            {isMultipleChoice && Array.isArray(question.options) && (
              <div className="qopts">
                {question.options.map((o, oi) => {
                  const isOk = o.correct || o.isCorrect;
                  return (
                    <span key={o.id || oi} className={`qopt${isOk ? " ok" : ""}`}>
                      {LETTERS[oi]}. {o.content}
                    </span>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {isTrueFalse && tfCorrect !== null && (
              <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  className="badge"
                  style={{
                    background: tfCorrect ? "var(--gnl)" : "var(--rdl)",
                    color: tfCorrect ? "var(--gn)" : "var(--rd)",
                    fontSize: 11,
                    padding: "3px 10px",
                  }}
                >
                  Đáp án: {tfCorrect ? "Đúng" : "Sai"}
                </span>
              </div>
            )}

            {/* Fill in blank */}
            {isFillBlank &&
              Array.isArray(question.options) &&
              question.options.length > 0 && (
                <div style={{ marginTop: 7, fontSize: 11, color: "var(--t3)", fontWeight: 600 }}>
                  Đáp án:{" "}
                  <span
                    style={{
                      color: "var(--p)",
                      fontWeight: 700,
                      background: "var(--pl)",
                      padding: "1px 8px",
                      borderRadius: 5,
                      marginLeft: 3,
                    }}
                  >
                    {question.options[0]?.content}
                  </span>
                </div>
              )}

            {/* Essay */}
            {isEssay && (
              <div style={{ marginTop: 7, fontSize: 11, color: "var(--t3)", fontStyle: "italic" }}>
                Câu tự luận — chấm thủ công
                {question.sampleAnswer && (
                  <span style={{ display: "block", marginTop: 3, fontStyle: "normal", color: "var(--t3)" }}>
                    Gợi ý: {question.sampleAnswer}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="qcard-footer">
        <div className="footer-l">
          <div className="qmeta">
            <Ic.Calendar />&nbsp;{formatDate(question.createdAt)}
          </div>
          <div className="qmeta">
            <Ic.User />&nbsp;{question.author || "Giáo viên"}
          </div>
        </div>
        <div className="footer-r">
          <button className="ab-btn" onClick={(e) => { e.stopPropagation(); }}>
            <Ic.Copy /> Nhân bản
          </button>
          <button className="ab-btn" onClick={(e) => { e.stopPropagation(); onEdit(question); }}>
            <Ic.Edit /> Sửa
          </button>
          <button className="ab-btn dng" onClick={(e) => { e.stopPropagation(); onDelete(question); }}>
            <Ic.Trash /> Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── EditModal ─────────────────────────── */

function EditQuestionModal({ isOpen, onClose, question, bankId, onSuccess }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("MULTIPLE_CHOICE");
  const [cog, setCog] = useState("REMEMBERING");
  const [points, setPoints] = useState(1);
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && question) {
      setContent(question.content || "");
      setType(question.questionType || "MULTIPLE_CHOICE");
      setCog(question.cognitiveLevel || "REMEMBERING");
      setPoints(question.defaultPoints || 1);
      setSampleAnswer(question.sampleAnswer || "");

      let opts = [];
      if (Array.isArray(question.options)) {
        opts = question.options.map((o) => ({
          id: o.id || Date.now() + Math.random(),
          content: o.content || "",
          correct: o.correct || o.isCorrect || false,
        }));
      }

      // Ensure min options based on type
      if (
        (question.questionType === "MULTIPLE_CHOICE" ||
          !question.questionType) &&
        opts.length === 0
      ) {
        opts = [
          { id: 1, content: "Lựa chọn 1", correct: true },
          { id: 2, content: "Lựa chọn 2", correct: false },
          { id: 3, content: "Lựa chọn 3", correct: false },
          { id: 4, content: "Lựa chọn 4", correct: false },
        ];
      } else if (question.questionType === "TRUE_FALSE" && opts.length === 0) {
        opts = [
          { id: 1, content: "Đúng", correct: true },
          { id: 2, content: "Sai", correct: false },
        ];
      } else if (
        question.questionType === "FILL_IN_THE_BLANK" &&
        opts.length === 0
      ) {
        opts = [{ id: 1, content: "", correct: true }];
      }

      setOptions(opts);
    }
  }, [isOpen, question]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    // Validation
    if (type === "MULTIPLE_CHOICE") {
      if (options.length < 2) return toast.error("Cần ít nhất 2 lựa chọn");
      if (!options.some((o) => o.correct))
        return toast.error("Vui lòng chọn đáp án đúng");
      if (options.some((o) => !o.content.trim()))
        return toast.error("Vui lòng nhập đầy đủ nội dung các lựa chọn");
    } else if (type === "FILL_IN_THE_BLANK") {
      if (!options[0]?.content.trim())
        return toast.error("Vui lòng nhập đáp án cho câu điền khuyết");
    } else if (type === "ESSAY") {
      if (!sampleAnswer.trim())
        return toast.error("Vui lòng nhập gợi ý/đáp án cho câu tự luận");
    }

    const payload = {
      content,
      questionType: type,
      cognitiveLevel: cog,
      defaultPoints: Number(points),
      sampleAnswer: type === "ESSAY" ? sampleAnswer : null,
      sectionId: null,
      options:
        type === "ESSAY"
          ? []
          : options.map((o) => ({
              content: o.content,
              correct: o.correct,
            })),
    };

    try {
      setLoading(true);
      await questionBankApi.updateQuestion(bankId, question.id, payload);
      toast.success("Cập nhật câu hỏi thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật câu hỏi thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setType(newType);
    if (newType === "MULTIPLE_CHOICE") {
      setOptions([
        { id: Date.now(), content: "", correct: true },
        { id: Date.now() + 1, content: "", correct: false },
        { id: Date.now() + 2, content: "", correct: false },
        { id: Date.now() + 3, content: "", correct: false },
      ]);
    } else if (newType === "TRUE_FALSE") {
      setOptions([
        { id: Date.now(), content: "Đúng", correct: true },
        { id: Date.now() + 1, content: "Sai", correct: false },
      ]);
    } else if (newType === "FILL_IN_THE_BLANK") {
      setOptions([{ id: Date.now(), content: "", correct: true }]);
    } else {
      setOptions([]);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-hdr">
          <h3>Chỉnh sửa câu hỏi</h3>
          <button className="modal-close" onClick={onClose}>
            <Ic.X />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Loại câu hỏi</label>
              <select
                className="form-control"
                value={type}
                onChange={handleTypeChange}
              >
                {QTYPES.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.l}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Mức độ nhận thức</label>
              <select
                className="form-control"
                value={cog}
                onChange={(e) => setCog(e.target.value)}
              >
                {COG.map((c) => (
                  <option key={c.v} value={c.v}>
                    {c.l}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 0.5 }}>
              <label>Điểm</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="form-control"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Nội dung câu hỏi</label>
            <textarea
              className="form-control"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          <div className="form-group">
            <label>ĐÁP ÁN</label>

            {type === "MULTIPLE_CHOICE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {options.map((opt, i) => (
                  <div key={opt.id} className="opt-row">
                    <input
                      type="radio"
                      name="mc_correct"
                      className="opt-check"
                      checked={opt.correct}
                      onChange={() =>
                        setOptions(
                          options.map((o) => ({
                            ...o,
                            correct: o.id === opt.id,
                          })),
                        )
                      }
                    />
                    <span style={{ fontSize: 13, fontWeight: 700, width: 20 }}>
                      {LETTERS[i]}.
                    </span>
                    <input
                      type="text"
                      className="opt-input"
                      value={opt.content}
                      onChange={(e) =>
                        setOptions(
                          options.map((o) =>
                            o.id === opt.id
                              ? { ...o, content: e.target.value }
                              : o,
                          ),
                        )
                      }
                      placeholder={`Lựa chọn ${i + 1}`}
                    />
                    <button
                      className="opt-del"
                      onClick={() =>
                        setOptions(options.filter((o) => o.id !== opt.id))
                      }
                    >
                      <Ic.Trash />
                    </button>
                  </div>
                ))}
                {options.length < 10 && (
                  <button
                    className="opt-add"
                    onClick={() =>
                      setOptions([
                        ...options,
                        { id: Date.now(), content: "", correct: false },
                      ])
                    }
                  >
                    + Thêm lựa chọn
                  </button>
                )}
              </div>
            )}

            {type === "TRUE_FALSE" && (
              <div style={{ display: "flex", gap: 15 }}>
                {options.map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      padding: "10px 20px",
                      border: "1.5px solid var(--b)",
                      borderRadius: "8px",
                      background: opt.correct ? "var(--gnl)" : "var(--card)",
                      borderColor: opt.correct ? "var(--gn)" : "var(--b)",
                    }}
                  >
                    <input
                      type="radio"
                      name="tf_correct"
                      style={{
                        accentColor: "var(--gn)",
                        width: 16,
                        height: 16,
                      }}
                      checked={opt.correct}
                      onChange={() =>
                        setOptions(
                          options.map((o) => ({
                            ...o,
                            correct: o.id === opt.id,
                          })),
                        )
                      }
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: opt.correct ? "var(--gn)" : "var(--t2)",
                      }}
                    >
                      {opt.content}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {type === "FILL_IN_THE_BLANK" && (
              <input
                type="text"
                className="form-control"
                value={options[0]?.content || ""}
                onChange={(e) =>
                  setOptions([
                    { ...options[0], content: e.target.value, correct: true },
                  ])
                }
                placeholder="Nhập từ cần điền (đáp án)..."
              />
            )}

            {type === "ESSAY" && (
              <textarea
                className="form-control"
                rows={3}
                value={sampleAnswer}
                onChange={(e) => setSampleAnswer(e.target.value)}
                placeholder="Nhập gợi ý giải hoặc đáp án cho câu tự luận..."
              />
            )}
          </div>
        </div>
        <div className="modal-ftr">
          <button className="btn btn-g" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button className="btn btn-p" onClick={handleSave} disabled={loading}>
            {loading ? (
              <span className="spin">
                <Ic.Loader />
              </span>
            ) : (
              <>
                <Ic.Check /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function ResourceBankDetailPage() {
  const { bankId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const safeBankId = Number(bankId);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [cogFilter, setCogFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionsPage, setQuestionsPage] = useState({
    content: [],
    pageNumber: 1,
    pageSize: ITEMS_PER_PAGE,
    totalElements: 0,
    totalPages: 0,
  });
  const [bankData, setBankData] = useState(location.state?.bank ?? null);

  const debouncedSearch = useDebounce(search, 350);

  // Fetch Bank Details
  useEffect(() => {
    if (bankData || !Number.isFinite(safeBankId) || safeBankId <= 0) {
      return;
    }
    const hydrateBankInfo = async () => {
      try {
        const response = await questionBankApi.getQuestionBanks({
          page: 1,
          size: 100,
        });
        const banks = response?.result?.content ?? [];
        const matched = banks.find((item) => Number(item.id) === safeBankId);
        if (matched) setBankData(matched);
      } catch (e) {
        // Fallback
      }
    };
    hydrateBankInfo();
  }, [bankData, safeBankId]);

  // Fetch Questions
  useEffect(() => {
    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      setError("ID ngân hàng không hợp lệ.");
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      setError("");

      let sortBy = "createdAt";
      let sortDirection = "DESC";

      if (sort === "oldest") {
        sortDirection = "ASC";
      } else if (sort === "az") {
        sortBy = "content";
        sortDirection = "ASC";
      }

      try {
        const response = await questionBankApi.getQuestions(safeBankId, {
          keyword: debouncedSearch,
          type: typeFilter === "ALL" ? undefined : typeFilter,
          cognitiveLevel: cogFilter === "ALL" ? undefined : cogFilter,
          page: page,
          size: ITEMS_PER_PAGE,
          sortBy: sortBy,
          sortDirection: sortDirection,
        });

        const result = response?.result ?? {};
        setQuestionsPage({
          content: Array.isArray(result.content) ? result.content : [],
          pageNumber: result.pageNumber ?? page,
          pageSize: result.pageSize ?? ITEMS_PER_PAGE,
          totalElements: result.totalElements ?? 0,
          totalPages: result.totalPages ?? 0,
        });
      } catch (err) {
        setQuestionsPage({
          content: [],
          pageNumber: 1,
          pageSize: ITEMS_PER_PAGE,
          totalElements: 0,
          totalPages: 0,
        });
        setError(
          err.response?.data?.message ?? "Không thể tải danh sách câu hỏi.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [
    page,
    debouncedSearch,
    typeFilter,
    cogFilter,
    sort,
    safeBankId,
    refreshTrigger,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearch, typeFilter, cogFilter, sort]);

  const handleDelete = async (question) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng không?",
      )
    ) {
      try {
        await questionBankApi.deleteQuestion(safeBankId, question.id);
        toast.success("Đã xóa câu hỏi thành công");
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa câu hỏi");
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === questionsPage.content.length && questionsPage.content.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questionsPage.content.map((q) => q.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleTypeFilter = (v) => {
    setTypeFilter(v);
  };
  const handleCogFilter = (v) => {
    setCogFilter(v);
  };

  const subjectLabel = bankData
    ? getLabelFromOptions(subjectOptions, bankData.subject)
    : "Toán học";
  const gradeLabel = bankData
    ? getLabelFromOptions(gradeOptions, bankData.gradeLevel)
    : "Khối 10";

  const totalPages = Math.max(1, questionsPage.totalPages);
  const safePageNum = questionsPage.pageNumber;
  const visible = questionsPage.content;
  const fromItem = (safePageNum - 1) * ITEMS_PER_PAGE + 1;
  const toItem = Math.min(
    safePageNum * ITEMS_PER_PAGE,
    questionsPage.totalElements,
  );

  // Stats (Using real data where possible, fake for UI placeholders)
  const stats = {
    total: questionsPage.totalElements,
    usedIn: 3, // Mocked for now as requested by UI design
    ratio: Math.round((3 / (questionsPage.totalElements || 1)) * 100),
    updatedAt: bankData?.updatedAt ? formatDate(bankData.updatedAt) : "12/04/2025"
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app-content-wrapper">
        {/* TOP BAR */}
        <div className="top-bar">
          <div className="top-l">
            <button
              className="bk-btn"
              onClick={() => navigate(PATH_TEACHER.questionBank)}
            >
              <Ic.ArrowL /> Ngân hàng câu hỏi
            </button>
            <div className="sep-line" />
            <div className="top-t">
              <div className="bank-ic">
                <Ic.Book />
              </div>
              {bankData?.name ?? `Ngân hàng #${safeBankId || "-"}`}
            </div>
          </div>
          <div className="top-r">
            <button className="btn-action btn-g">
              <Ic.Download /> Xuất Excel
            </button>
            <button
              className="btn-action btn-g"
              onClick={() =>
                navigate(PATH_TEACHER.questionBankMethod(safeBankId))
              }
            >
              <Ic.Upload /> Thêm câu hỏi
            </button>
            <button
              className="btn-action btn-p"
              onClick={() =>
                navigate(
                  `/question-bank/${safeBankId}/questions/create/ai?bankId=${safeBankId}`,
                )
              }
            >
              <Ic.Sparkles /> Tạo bằng AI
            </button>
          </div>
        </div>

        <div className="main-layout">
          {/* SIDEBAR */}
          <div className="sb-sidebar">
            <div className="sb-hd">
              <div className="sb-title">Tìm kiếm</div>
              <div className="search-wrap">
                <Ic.Search />
                <input
                  placeholder="Tìm câu hỏi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Type filter */}
            <div className="sb-section">
              <div className="sb-lbl">Loại câu hỏi</div>
              <div
                className={`fi-item${typeFilter === "ALL" ? " on" : ""}`}
                onClick={() => handleTypeFilter("ALL")}
              >
                <div className="fi-l">
                  <div className="fi-dot" style={{ background: "var(--p)" }} />
                  <span className="fi-name">Tất cả</span>
                </div>
                <span className="fi-cnt">{questionsPage.totalElements}</span>
              </div>
              {QTYPES.map((t) => (
                <div
                  key={t.v}
                  className={`fi-item${typeFilter === t.v ? " on" : ""}`}
                  onClick={() => handleTypeFilter(t.v)}
                >
                  <div className="fi-l">
                    <div
                      className="fi-dot"
                      style={{
                        background:
                          t.v === "MULTIPLE_CHOICE"
                            ? "#2563EB"
                            : t.v === "TRUE_FALSE"
                              ? "#10B981"
                              : t.v === "FILL_IN_THE_BLANK" || t.v === "FILL_IN_BLANK"
                                ? "#F59E0B"
                                : "#8B5CF6",
                      }}
                    />
                    <span className="fi-name">{t.l}</span>
                  </div>
                  <span className="fi-cnt">{t.v === "MULTIPLE_CHOICE" ? 5 : 2}</span> {/* Mock counts for UI */}
                </div>
              ))}
            </div>

            <div className="sb-divider" />

            {/* Cognitive filter */}
            <div className="sb-section">
              <div className="sb-lbl">Mức độ nhận thức</div>
              {COG.map((c) => (
                <div
                  key={c.v}
                  className={`fi-item${cogFilter === c.v ? " on" : ""}`}
                  onClick={() =>
                    handleCogFilter(cogFilter === c.v ? "ALL" : c.v)
                  }
                >
                  <div className="fi-l">
                    <div className="fi-dot" style={{ background: c.c }} />
                    <span className="fi-name">{c.l}</span>
                  </div>
                  <span className="fi-cnt">2</span> {/* Mock counts */}
                </div>
              ))}
            </div>

            <div className="sb-divider" />

            {/* Stats */}
            <div className="sb-stats">
              <div className="stat-row">
                <span className="stat-label">Tổng câu hỏi</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Đã dùng trong đề</span>
                <span className="stat-value">{stats.usedIn}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Tỉ lệ sử dụng</span>
                <span className="stat-value" style={{ color: "var(--p)" }}>
                  {stats.ratio}%
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Cập nhật lần cuối</span>
                <span className="stat-value">{stats.updatedAt}</span>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="content-area" style={{ position: "relative" }}>
            {/* FILTER BAR */}
            <div className="content-bar">
              <div className="chips-list">
                <span className="chip-lbl">Mức độ:</span>
                <div
                  className={`chip-item${cogFilter === "ALL" ? " on" : ""}`}
                  onClick={() => handleCogFilter("ALL")}
                >
                  Tất cả
                </div>
                {COG.map((c) => (
                  <div
                    key={c.v}
                    className={`chip-item${cogFilter === c.v ? " on" : ""}`}
                    onClick={() =>
                      handleCogFilter(cogFilter === c.v ? "ALL" : c.v)
                    }
                  >
                    {c.l}
                  </div>
                ))}
              </div>
              <div className="bar-r">
                <span className="result-cnt">
                  {questionsPage.totalElements} câu hỏi
                </span>
                <div className="sep-line" />
                <select
                  className="sort-sel"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="az">A → Z</option>
                </select>
                <div className="sep-line" />
                <button
                  className="btn-action btn-g"
                  style={{ padding: "5px 10px", gap: 4 }}
                  onClick={toggleAll}
                >
                  <Ic.Check />
                  {selectedIds.size === questionsPage.content.length && questionsPage.content.length > 0 ? "Bỏ tất cả" : "Chọn tất cả"}
                </button>
                <button
                  className="btn-action btn-p"
                  style={{ padding: "5px 10px", gap: 4 }}
                  onClick={() =>
                    navigate(PATH_TEACHER.questionBankMethod(safeBankId))
                  }
                >
                  <Ic.Plus /> Thêm câu hỏi
                </button>
              </div>
            </div>

            {/* LIST */}
            <div className="q-scroll">
              {loading ? (
                <div className="empty-state">
                  <div className="spin-anim">
                    <Ic.Loader />
                  </div>
                  <p>Đang tải câu hỏi...</p>
                </div>
              ) : error ? (
                <div className="empty-state">
                  <div
                    className="empty-ic"
                    style={{ background: "var(--rdl)", color: "var(--rd)" }}
                  >
                    <Ic.X />
                  </div>
                  <h3>Lỗi</h3>
                  <p>{error}</p>
                </div>
              ) : visible.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-ic">
                    <Ic.Search />
                  </div>
                  <h3>Không có kết quả</h3>
                  <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
              ) : (
                visible.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={(safePageNum - 1) * ITEMS_PER_PAGE + i}
                    checked={selectedIds.has(q.id)}
                    onToggle={() => toggleSelect(q.id)}
                    onEdit={(q) => setEditingQuestion(q)}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>

            {/* PAGINATION */}
            <div className="pag-wrap">
              <span className="pag-info">
                {questionsPage.totalElements > 0
                  ? `Hiển thị ${fromItem}–${toItem} / ${questionsPage.totalElements} câu hỏi`
                  : "Không có câu hỏi"}
              </span>
              <div className="pag-nav">
                <button
                  className="pg-btn"
                  disabled={safePageNum <= 1 || loading}
                  onClick={() => setPage(safePageNum - 1)}
                >
                  <Ic.ChevL />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => {
                    if (
                      totalPages > 7 &&
                      (p < safePageNum - 2 || p > safePageNum + 2) &&
                      p !== 1 &&
                      p !== totalPages
                    ) {
                      if (p === safePageNum - 3 || p === safePageNum + 3)
                        return (
                          <span key={p} style={{ color: "var(--t3)" }}>
                            ...
                          </span>
                        );
                      return null;
                    }
                    return (
                      <button
                        key={p}
                        className={`pg-btn${p === safePageNum ? " on" : ""}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    );
                  },
                )}
                <button
                  className="pg-btn"
                  disabled={safePageNum >= totalPages || loading}
                  onClick={() => setPage(safePageNum + 1)}
                >
                  <Ic.ChevR />
                </button>
              </div>
              <span className="pag-info" style={{ textAlign: "right" }}>
                Trang {safePageNum} / {totalPages}
              </span>
            </div>

            {/* BULK ACTION TOOLBAR */}
            <div className={`bulk-bar${selectedIds.size > 0 ? "" : " hidden"}`}>
              <Ic.Check />
              <span className="sel-cnt">{selectedIds.size} câu đã chọn</span>
              <button className="btn-action btn-g" style={{ padding: "6px 12px" }}>
                <Ic.Plus /> Thêm vào đề
              </button>
              <button className="btn-action btn-g" style={{ padding: "6px 12px" }}>
                <Ic.Copy /> Nhân bản
              </button>
              <button
                className="btn-action btn-g"
                style={{ padding: "6px 12px", borderColor: "rgba(239,68,68,.4)", color: "var(--rd)" }}
              >
                <Ic.Trash /> Xóa
              </button>
              <button className="ab-btn" style={{ marginLeft: "auto" }} onClick={clearSelection}>
                <Ic.X /> Bỏ chọn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditQuestionModal
        isOpen={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        question={editingQuestion}
        bankId={safeBankId}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}
