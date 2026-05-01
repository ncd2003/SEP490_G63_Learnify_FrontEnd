import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { assignmentApi } from "@/apis/assignment.api";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_TEACHER } from "@/routes/paths";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --p:#2563EB;--pd:#1D4ED8;--pl:#EFF6FF;--plr:#F8FAFF;
  --pg:rgba(37,99,235,.10);--ps:rgba(37,99,235,.22);
  --gr:linear-gradient(135deg,#3B82F6,#2563EB 50%,#1D4ED8);
  --bg:#F7F8FC;--card:#FFF;--inp:#F5F7FB;--hov:#EDF2FF;
  --t:#1E293B;--t2:#475569;--t3:#94A3B8;--inv:#FFF;
  --gn:#10B981;--gnl:#ECFDF5;--gnd:#065F46;
  --or:#F59E0B;--orl:#FFFBEB;
  --rd:#EF4444;--rdl:#FEF2F2;
  --pu:#8B5CF6;--pul:#F5F3FF;--pud:#4C1D95;
  --sk:#0EA5E9;--skl:#F0F9FF;--skd:#0C4A6E;
  --b:#E2E8F0;--bl:#F1F5F9;
  --ss:0 1px 3px rgba(30,41,59,.04);
  --sm:0 4px 14px rgba(30,41,59,.07);
  --rs:8px;--rm:10px;--rl:14px;--rxl:18px;
  --f:'Be Vietnam Pro',sans-serif;--fm:'JetBrains Mono',monospace;
  --e:cubic-bezier(.4,0,.2,1)
}
*{box-sizing:border-box;margin:0;padding:0}

.page{display:flex;height:100vh;overflow:hidden;background:var(--bg);color:var(--t);font-family:var(--f)}

.side{width:230px;min-width:230px;display:flex;flex-direction:column;background:var(--card);border-right:1px solid var(--b);overflow:hidden;flex-shrink:0;padding:14px 12px}
.side-group{display:flex;flex-direction:column;gap:6px}
.side-group + .side-group{margin-top:14px;padding-top:14px;border-top:1px solid var(--bl)}
.side-nav-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t3);padding:0 8px}
.side-nav{display:flex;flex-direction:column;gap:5px}
.nav-dot{min-height:38px;border-radius:10px;border:none;background:transparent;font-size:13px;font-weight:700;font-family:var(--f);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:0 12px;transition:all .15s var(--e);text-align:left;gap:10px}
.nav-dot:hover{background:var(--hov);color:var(--p)}
.nav-dot.active{background:var(--pl);color:var(--p)}
.nav-dot.filled{background:var(--gnl);color:var(--gnd)}
.nav-dot.active.filled{background:var(--pl);color:var(--p)}
.nav-dot span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
.nav-dot span:last-child{width:22px;height:22px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:var(--bl);color:var(--t3);font-size:11px;font-weight:800;flex-shrink:0}
.nav-dot.active span:last-child{background:var(--card);color:var(--p)}
.nav-dot.filled span:last-child{background:var(--card);color:var(--gn)}
.nav-dot.active.filled span:last-child{background:var(--card);color:var(--p)}

.side-section-head{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--t3);padding:8px 8px 6px}
.side-actions{display:grid;gap:4px}
.side-action-btn{display:flex;align-items:center;gap:7px;padding:10px 12px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;font-family:var(--f);transition:all .15s var(--e);width:100%;text-align:left}
.side-action-btn.manual{background:var(--pul);color:var(--pud)}
.side-action-btn.manual:hover{filter:brightness(.97)}
.side-action-btn.ai{background:var(--pl);color:var(--pd)}
.side-action-btn.ai:hover{filter:brightness(.97)}
.side-action-btn.bank{background:var(--skl);color:var(--skd)}
.side-action-btn.bank:hover{filter:brightness(.97)}

.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.workspace-shell{display:flex;flex:1;min-height:0;overflow:hidden}
.topbar{height:54px;background:var(--card);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 24px;flex-shrink:0}
.topbar-l{display:flex;align-items:center;gap:12px}
.bk{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid var(--b);border-radius:var(--rs);background:var(--card);font-size:11px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;transition:all .15s var(--e)}
.bk:hover{border-color:var(--p);color:var(--p)}
.sep{width:1px;height:18px;background:var(--b)}
.page-title{font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px;font-family:var(--f)}
.stat-pill{display:flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:var(--bl);color:var(--t2);font-family:var(--f)}
.topbar-r{display:flex;gap:6px}

.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 16px;border-radius:var(--rm);font-size:11px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;transition:all .2s var(--e)}
.btn-p{background:var(--gr);color:var(--inv);box-shadow:0 2px 10px var(--ps)}
.btn-p:hover{transform:translateY(-1px);box-shadow:0 4px 18px var(--ps)}
.btn-p:disabled{opacity:.45;cursor:not-allowed;transform:none}
.btn-g{background:var(--card);color:var(--t2);border:1.5px solid var(--b)}
.btn-g:hover{border-color:var(--p);color:var(--p);background:var(--hov)}

.scroll{flex:1;overflow-y:auto;padding:24px 28px 100px;background:var(--bg)}
.workspace-main{flex:1;min-width:0}
.workspace-chat{width:380px;min-width:380px;display:flex;flex-direction:column;border-left:1px solid var(--b);background:var(--card);flex-shrink:0}
.section-wrap{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:14px;overflow:hidden;box-shadow:var(--ss)}
.section-hdr{padding:12px 16px;border-bottom:1px solid var(--bl);display:flex;align-items:center;justify-content:space-between;background:var(--plr)}
.section-title{font-size:13px;font-weight:800;color:var(--t);font-family:var(--f)}
.section-hdr-right{display:flex;align-items:center;gap:8px}
.section-sub{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.04em;font-family:var(--f)}
.section-body{padding:14px 16px}
.section-meta{font-size:12px;color:var(--t3);font-weight:500;font-family:var(--f)}
.sec-type-badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:999px;background:var(--bl);color:var(--t2);font-size:9px;font-weight:800;letter-spacing:.04em;font-family:var(--f)}

.qc{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:14px;transition:all .25s var(--e);overflow:hidden}
.qc:hover{border-color:#CBD5E1;box-shadow:var(--sm)}
.qc.dragging{opacity:.4}
.qc.drop-over{border-color:var(--p);border-style:dashed;background:var(--plr)}
.qc.selected{border-color:var(--p);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
.qc.editing{border-color:var(--or);box-shadow:0 0 0 3px rgba(245,158,11,.1)}
.qc.publish-error{border-color:var(--rd);box-shadow:0 0 0 3px rgba(239,68,68,.12)}
@keyframes fu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}

.qc-main{padding:18px 20px}
.qc-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}
.qc-top-meta{display:flex;align-items:flex-start;gap:8px;flex-shrink:0}
.drag-handle{color:var(--t3);font-size:13px;flex-shrink:0;cursor:grab;padding-top:2px;line-height:1;user-select:none}
.qc-num{min-width:26px;height:26px;border-radius:50%;background:var(--p);color:var(--inv);font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.qc.editing .qc-num{background:var(--or)}
.qc-select{width:24px;height:24px;border-radius:8px;border:1.5px solid var(--b);background:var(--card);display:flex;align-items:center;justify-content:center;color:transparent;cursor:pointer;transition:all .15s var(--e);flex-shrink:0;margin-top:1px}
.qc-select:hover{border-color:var(--p);background:var(--plr)}
.qc-select.on{background:var(--p);border-color:var(--p);color:var(--inv)}

.qc-body{flex:1;min-width:0}
.qc-badges{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:6px}
.qc-type-badge{padding:2px 7px;border-radius:10px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;display:inline-block}
.qc-type-badge.mc{background:var(--pl);color:var(--p)}
.qc-type-badge.tf{background:var(--gnl);color:var(--gnd)}
.qc-type-badge.fb{background:var(--orl);color:#92400E}
.qc-type-badge.es{background:var(--pul);color:var(--pud)}
.qc-src-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:10px;font-size:9px;font-weight:800}
.qc-src-badge.MANUAL{background:var(--pul);color:var(--pud)}
.qc-src-badge.AI{background:var(--pl);color:var(--pd)}
.qc-src-badge.BANK_IMPORT{background:var(--skl);color:var(--skd)}

.qc-prompt{font-size:13px;font-weight:600;line-height:1.65;white-space:pre-line;color:var(--t)}

.qc-opts{margin-top:10px;display:flex;flex-direction:column;gap:6px}
.qc-opt{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border:1px solid var(--bl);border-radius:var(--rs);font-size:12px;line-height:1.5;color:var(--t2);font-weight:500;transition:all .15s var(--e)}
.qc-opt.correct{border-color:var(--gn);background:var(--gnl);color:var(--gnd);font-weight:700}
.qc-opt-lbl{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--b);font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--t3);flex-shrink:0;margin-top:1px}
.qc-opt.correct .qc-opt-lbl{border-color:var(--gn);background:var(--gn);color:var(--inv)}

.qc-tf{margin-top:8px;font-size:12px;font-weight:600;color:var(--t2)}
.ctag{color:var(--gnd);background:var(--gnl);padding:2px 8px;border-radius:8px;font-size:11px;font-weight:800;border:1px solid rgba(16,185,129,.25)}

.qc-fb{margin-top:7px;font-size:11px;color:var(--t3);font-weight:600}
.qc-fb span{color:var(--p);font-weight:800;background:var(--pl);padding:2px 8px;border-radius:6px;margin-left:4px;font-family:var(--fm);font-size:12px}

.qc-essay{margin-top:7px;font-size:11px;color:var(--t3);font-style:italic;font-weight:600}

.qc-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 20px;border-top:1px solid var(--bl);background:var(--bg)}
.qc-bar-l,.qc-bar-r{display:flex;gap:3px;align-items:center}
.ab{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:var(--rs);border:none;background:none;font-size:10px;font-weight:700;font-family:var(--f);color:var(--t3);cursor:pointer;transition:all .15s var(--e)}
.ab:hover{background:var(--hov);color:var(--p)}
.ab.sv{color:var(--gn)}.ab.sv:hover{background:var(--gnl)}
.ab.dng:hover{background:var(--rdl);color:var(--rd)}

.drop-slot{height:10px;margin:0 10px;border:1px dashed transparent;border-radius:999px;position:relative;transition:all .15s var(--e);background:transparent}
.drop-slot::before{content:"";position:absolute;left:10px;right:10px;top:50%;height:1px;background:transparent;transform:translateY(-50%);transition:all .15s var(--e)}
.drop-slot.active{height:34px;margin:8px 10px;background:var(--plr);border-color:var(--p)}
.drop-slot.active::before{background:var(--ps)}
.drop-slot-label{display:none;position:absolute;inset:0;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--p);font-family:var(--f)}
.drop-slot.active .drop-slot-label{display:flex}

.ed-prompt{width:100%;padding:8px 12px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:13px;font-family:var(--f);font-weight:600;color:var(--t);background:#FFFDF7;min-height:48px;resize:vertical;line-height:1.6;outline:none}
.ed-prompt:focus{box-shadow:0 0 0 3px rgba(245,158,11,.1)}
.ed-lbl{font-size:10px;font-weight:800;color:var(--t3);margin:8px 0 5px 36px;text-transform:uppercase;letter-spacing:.04em}
.ed-opt-row{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.ed-opt-input{flex:1;padding:7px 10px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp);outline:none}
.ed-opt-input:focus{border-color:var(--or)}
.ed-opt-radio{width:20px;height:20px;border-radius:50%;border:2px solid var(--b);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s var(--e)}
.ed-opt-radio.on{border-color:var(--gn);background:var(--gn);color:var(--inv)}
.ed-opt-radio:hover{border-color:var(--gn)}
.ed-tf{display:flex;gap:8px;margin-left:36px}
.ed-tfb{flex:1;padding:9px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:12px;font-weight:700;text-align:center;cursor:pointer;background:var(--card);color:var(--t3);font-family:var(--f);transition:all .15s var(--e)}
.ed-tfb.on{border-color:var(--gn);background:var(--gnl);color:var(--gnd)}
.ed-ans{margin-left:36px;width:calc(100% - 36px);padding:7px 10px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:12px;font-family:var(--fm);color:var(--t);background:#FFFDF7;outline:none}
.ed-ans:focus{box-shadow:0 0 0 3px rgba(245,158,11,.1)}

.q-empty{border:1.5px dashed var(--b);border-radius:var(--rl);padding:20px;text-align:center;color:var(--t3);font-size:13px;font-weight:500;font-family:var(--f)}
.preview-footer{border-top:1px solid var(--b);padding-top:16px;display:flex;align-items:center;justify-content:space-between;margin-top:8px}

.ai-refine{margin-top:0;border:none;border-radius:0;overflow:hidden;background:var(--card);box-shadow:none;flex:1;display:flex;flex-direction:column}
.ch-h{height:54px;border-bottom:1px solid var(--b);display:flex;align-items:center;padding:0 18px;gap:9px;flex-shrink:0;background:var(--plr)}
.ch-ic{width:30px;height:30px;border-radius:50%;background:var(--gr);color:var(--inv);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ch-hi h3{font-size:13px;font-weight:700;line-height:1.2}
.ch-hi p{font-size:9px;color:var(--t3);line-height:1.2}
.ch-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px;background:var(--bg)}
.ch-m{display:flex;gap:8px;max-width:90%;animation:fu .2s ease both;font-size:12px;line-height:1.6}
.ch-m.usr{align-self:flex-end;flex-direction:row-reverse}
.ch-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
.ch-av.bt{background:var(--gr);color:var(--inv)}
.ch-av.hm{background:var(--b);color:var(--t2)}
.ch-bb{padding:9px 12px;border-radius:var(--rm);font-size:12px;line-height:1.6;font-weight:500;white-space:pre-line}
.ch-m.bot .ch-bb{background:var(--card);border:1px solid var(--b);border-top-left-radius:3px}
.ch-m.usr .ch-bb{background:var(--p);color:var(--inv);border-top-right-radius:3px}
.ch-tm{font-size:8px;color:var(--t3);margin-top:3px}
.ch-m.usr .ch-tm{text-align:right}
.ch-sug{display:flex;flex-wrap:wrap;gap:5px;padding:0 16px 8px}
.ch-sg{padding:5px 10px;border:1.5px solid var(--b);border-radius:16px;font-size:10px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;background:var(--card);transition:all .15s var(--e)}
.ch-sg:hover{border-color:var(--p);color:var(--p);background:var(--hov)}
.ch-inp{padding:10px 14px;border-top:1px solid var(--b);background:var(--card);flex-shrink:0}
.ch-ir{display:flex;gap:6px;align-items:flex-end}
.ch-ta{flex:1;padding:8px 12px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp);resize:none;min-height:36px;max-height:80px;line-height:1.5}
.ch-ta:focus{outline:none;border-color:var(--p);box-shadow:0 0 0 3px var(--pg)}
.ch-sd{width:36px;height:36px;border-radius:var(--rm);border:none;background:var(--gr);color:var(--inv);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px var(--ps);transition:all .2s var(--e)}
.ch-sd:hover{transform:translateY(-1px)}
.ch-sd:disabled{opacity:.4;cursor:not-allowed;transform:none}
.ch-ht{font-size:9px;color:var(--t3);margin-top:4px;text-align:center}
.typing{display:flex;gap:3px;padding:6px 12px}
.td{width:5px;height:5px;border-radius:50%;background:var(--t3);animation:tb 1.4s infinite both}
.td:nth-child(2){animation-delay:.15s}
.td:nth-child(3){animation-delay:.3s}
@keyframes tb{0%,80%,100%{transform:scale(0);opacity:.4}40%{transform:scale(1);opacity:1}}


.ws-success{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;gap:14px;text-align:center;padding:2rem}

@media(max-width:900px){
  .page{flex-direction:column}
  .side{width:100%;border-right:none;border-bottom:1px solid var(--b);flex-shrink:0}
  .main{overflow:visible}
  .workspace-shell{flex-direction:column}
  .workspace-chat{width:100%;min-width:0;border-left:none;border-top:1px solid var(--b)}
  .scroll{padding:16px 12px 80px}
}

@media(max-width:700px){
  .topbar{padding:0 12px;height:auto;min-height:54px;flex-wrap:wrap;gap:10px;padding-top:10px;padding-bottom:10px}
  .topbar-l{flex-wrap:wrap;gap:8px}
  .topbar-r{width:100%;justify-content:flex-end;flex-wrap:wrap}
  .page-title{font-size:14px}
  .section-hdr{flex-wrap:wrap;align-items:flex-start}
  .section-hdr-right{width:100%;justify-content:space-between}
  .section-meta{width:100%}
  .qc-main{padding:16px 14px}
  .qc-bar{padding:8px 14px;flex-wrap:wrap;gap:8px}
  .qc-bar-l,.qc-bar-r{width:100%;justify-content:space-between}
  .qc-opts,.qc-tf,.qc-fb,.qc-essay,.ed-lbl,.ed-tf,.ed-ans{margin-left:0;width:100%}
  .ed-ans{width:100%}
}
`;

const LT = "ABCDEFGH";
const TC = {
  MULTIPLE_CHOICE: "mc",
  TRUE_FALSE: "tf",
  FILL_IN_THE_BLANK: "fb",
  ESSAY: "es",
};
const TL = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  TRUE_FALSE: "Đúng / Sai",
  FILL_IN_THE_BLANK: "Điền khuyết",
  ESSAY: "Tự luận",
};

const COG_UI = {
  REMEMBERING: {
    label: "Nhớ",
    bg: "#ECFDF5",
    border: "#86EFAC",
    text: "#047857",
  },
  UNDERSTANDING: {
    label: "Hiểu",
    bg: "#ECFEFF",
    border: "#67E8F9",
    text: "#0E7490",
  },
  APPLYING: {
    label: "Vận dụng",
    bg: "#EFF6FF",
    border: "#93C5FD",
    text: "#1D4ED8",
  },
  ANALYZING: {
    label: "Phân tích",
    bg: "#F5F3FF",
    border: "#C4B5FD",
    text: "#6D28D9",
  },
  EVALUATING: {
    label: "Đánh giá",
    bg: "#FFFBEB",
    border: "#FCD34D",
    text: "#B45309",
  },
  CREATING: {
    label: "Sáng tạo",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    text: "#B91C1C",
  },
};

const SRC_CFG = {
  MANUAL: { label: "Thủ công", icon: "✎", cls: "MANUAL" },
  AI: { label: "AI", icon: "✦", cls: "AI" },
  BANK_IMPORT: { label: "Ngân hàng", icon: "◈", cls: "BANK_IMPORT" },
};

const API_TYPE_MAP = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  FILL_IN_THE_BLANK: "FILL_IN_THE_BLANK",
  ESSAY: "ESSAY",
};

const API_COG_MAP = {
  REMEMBERING: "REMEMBERING",
  UNDERSTANDING: "UNDERSTANDING",
  APPLYING: "APPLYING",
  ANALYZING: "ANALYZING",
  EVALUATING: "EVALUATING",
  CREATING: "CREATING",
};

const SECTION_TYPE = {
  OBJECTIVE: "OBJECTIVE",
  ESSAY: "ESSAY",
  MIXED: "MIXED",
};

const toPositiveId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeSectionType = (rawType) => {
  const type = String(rawType || "")
    .trim()
    .toUpperCase();
  if (type === "OBJECTIVE" || type === "MULTIPLE_CHOICE" || type === "MC") {
    return SECTION_TYPE.OBJECTIVE;
  }
  if (type === "ESSAY") return SECTION_TYPE.ESSAY;
  if (type === "MIXED") return SECTION_TYPE.MIXED;
  return SECTION_TYPE.OBJECTIVE;
};

const normalizeQuestionType = (rawType) => {
  const type = String(rawType || "")
    .trim()
    .toUpperCase();
  if (type === "MULTIPLE_CHOICE") return "MULTIPLE_CHOICE";
  if (type === "TRUE_FALSE") return "TRUE_FALSE";
  if (type === "FILL_IN_THE_BLANK" || type === "FILL_IN_BLANK") {
    return "FILL_IN_THE_BLANK";
  }
  if (type === "ESSAY") return "ESSAY";
  return "MULTIPLE_CHOICE";
};

const readQuestionContent = (question) =>
  String(
    question?.prompt ||
      question?.content ||
      question?.questionContent ||
      question?.question?.content ||
      question?.question?.prompt ||
      "",
  );

const readQuestionPoints = (question) => {
  const parsed = Number(question?.points ?? question?.score ?? 1);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const getMcCorrectIndexes = (correct) => {
  if (Array.isArray(correct)) {
    return correct
      .map((index) => Number(index))
      .filter(
        (index, position, allIndexes) =>
          Number.isInteger(index) &&
          index >= 0 &&
          allIndexes.indexOf(index) === position,
      );
  }

  const parsed = Number(correct);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return [parsed];
  }

  return [];
};

const readQuestionSource = (question) =>
  String(
    question?.sourceType ||
      question?.source ||
      question?.origin ||
      question?.question?.sourceType ||
      "MANUAL",
  )
    .trim()
    .toUpperCase();

const readOptions = (question) => {
  const rawOptions =
    question?.opts ||
    question?.options ||
    question?.answers ||
    question?.question?.options ||
    [];

  return Array.isArray(rawOptions)
    ? rawOptions
        .map((option) => {
          if (option && typeof option === "object") {
            return String(
              option.content ??
                option.text ??
                option.value ??
                option.label ??
                "",
            );
          }
          return String(option ?? "");
        })
        .filter((value) => value !== "")
    : [];
};

const getCorrectFlagsFromOptions = (rawOptions = []) => {
  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    return [];
  }

  // New backend structure: each option has { content, correct, ... }
  return rawOptions
    .map((opt) => Boolean(opt?.correct ?? false))
    .filter((_, idx) => idx < rawOptions.length);
};

const readCorrectIndex = (question, options = [], rawOptions = []) => {
  // Check if options have correct flags (new backend structure)
  if (Array.isArray(rawOptions) && rawOptions.length > 0) {
    const correctIdx = rawOptions.findIndex((opt) =>
      Boolean(opt?.correct ?? false),
    );
    if (correctIdx >= 0) {
      return correctIdx;
    }
    // rawOptions exist but no correct flag found - return -1 to prevent false highlighting
    return -1;
  }

  // Fallback to old logic
  const rawCorrect = question?.cor ?? question?.correct ?? question?.answer;

  if (Array.isArray(rawCorrect)) {
    const firstIndex = Number(rawCorrect[0]);
    return Number.isInteger(firstIndex) && firstIndex >= 0 ? firstIndex : 0;
  }

  if (typeof rawCorrect === "boolean") {
    return rawCorrect ? 0 : 1;
  }

  const parsed = Number(rawCorrect);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }

  const answerText = String(rawCorrect || "")
    .trim()
    .toLowerCase();
  if (!answerText) return 0;

  const matchedIndex = options.findIndex(
    (option) =>
      String(option || "")
        .trim()
        .toLowerCase() === answerText,
  );
  return matchedIndex >= 0 ? matchedIndex : 0;
};

const mapWorkspaceQuestion = (question) => {
  const type = normalizeQuestionType(
    question?.type || question?.questionType || question?.question?.type,
  );
  const rawOptions =
    question?.opts ||
    question?.options ||
    question?.answers ||
    question?.question?.options ||
    [];
  const options = readOptions(question);
  const prompt = readQuestionContent(question);
  const sourceType = readQuestionSource(question);
  const points = readQuestionPoints(question);
  const cognitiveLevel = String(
    question?.cognitiveLevel ||
      question?.cogLevel ||
      question?.question?.cognitiveLevel ||
      "APPLYING",
  )
    .trim()
    .toUpperCase();

  const mapped = {
    id:
      toPositiveId(question?.id) ||
      toPositiveId(question?.questionId) ||
      toPositiveId(question?.itemId) ||
      question?.id ||
      question?.questionId ||
      question?.itemId ||
      Math.random(),
    itemId:
      toPositiveId(question?.itemId) ||
      toPositiveId(question?.assignmentQuestionId) ||
      toPositiveId(question?.draftItemId) ||
      toPositiveId(question?.questionId) ||
      toPositiveId(question?.id) ||
      null,
    type,
    prompt,
    cognitiveLevel,
    sourceType,
    points,
  };

  if (type === "MULTIPLE_CHOICE") {
    const correctIndex = readCorrectIndex(question, options, rawOptions);
    mapped.opts = options.length > 0 ? options : ["A", "B", "C", "D"];
    mapped.cor = correctIndex;
  } else if (type === "TRUE_FALSE") {
    // Try to read from new backend structure first (rawOptions with correct flags)
    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
      const correctOpt = rawOptions.find(opt => Boolean(opt?.correct ?? false));
      // correctOpt at index 0 = "Đúng" (true), at index 1 = "Sai" (false)
      mapped.cor = rawOptions.indexOf(correctOpt) === 0;
    } else {
      // Fallback to old logic
      const rawCorrect = question?.cor ?? question?.correct ?? question?.answer;
      mapped.cor = Boolean(
        rawCorrect === true ||
        rawCorrect === "true" ||
        rawCorrect === 1 ||
        rawCorrect === "1",
      );
    }
  } else if (type === "FILL_IN_THE_BLANK") {
    // Try to read from new backend structure first
    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
      const correctOpt = rawOptions.find(opt => Boolean(opt?.correct ?? false));
      mapped.ans = correctOpt?.content || options[0] || "";
    } else {
      // Fallback to old logic
      mapped.ans = String(
        question?.ans ||
          question?.answer ||
          question?.correctAnswer ||
          options[0] ||
          "",
      );
    }
  } else if (type === "ESSAY") {
    mapped.sampleAnswer = String(
      question?.sampleAnswer || question?.answer || question?.guidance || "",
    );
  }

  return mapped;
};

const mapWorkspaceSection = (section, index) => {
  const sectionId =
    toPositiveId(section?.id || section?.sectionId) || index + 1;
  const questions = Array.isArray(section?.questions)
    ? section.questions
    : Array.isArray(section?.draftQuestions)
      ? section.draftQuestions
      : [];

  return {
    id: sectionId,
    title: String(
      section?.title || section?.sectionTitle || `Phần ${index + 1}`,
    ),
    sectionType: normalizeSectionType(section?.sectionType),
    questions: questions.map((question, questionIndex) => ({
      ...mapWorkspaceQuestion(question),
      sectionId,
      orderIndex: questionIndex,
    })),
  };
};

const INIT = [
  {
    id: 1,
    title: "Phần trắc nghiệm",
    sectionType: "OBJECTIVE",
    questions: [
      {
        id: 1,
        type: "MULTIPLE_CHOICE",
        prompt:
          "Dựa vào quy tắc về các động từ chỉ nhận thức, tri giác trong tài liệu, câu nào sau đây được chia đúng ngữ pháp?",
        opts: [
          "I am wanting to go for a walk at the moment.",
          "She wants to go for a walk at the moment.",
          "Are you understanding your lesson?",
          "He is liking this film very much.",
        ],
        cor: 1,
        cognitiveLevel: "APPLYING",
        sourceType: "AI",
        points: 1,
      },
      {
        id: 2,
        type: "TRUE_FALSE",
        prompt:
          "Theo quy tắc chia động từ ở ngôi thứ ba số ít, động từ 'miss' (kết thúc bằng đuôi 's') phải được chia thành 'misses'. Phát biểu này Đúng hay Sai?",
        cor: true,
        cognitiveLevel: "REMEMBERING",
        sourceType: "AI",
        points: 1,
      },
      {
        id: 3,
        type: "FILL_IN_THE_BLANK",
        prompt:
          "Dựa vào cách dùng thì hiện tại hoàn thành với 'since' và 'for', hãy điền từ thích hợp vào chỗ trống: 'I have been a teacher ___ 2010.'",
        ans: "since",
        cognitiveLevel: "APPLYING",
        sourceType: "BANK_IMPORT",
        points: 1,
      },
    ],
  },
  {
    id: 2,
    title: "Phần tự luận",
    sectionType: "ESSAY",
    questions: [
      {
        id: 4,
        type: "ESSAY",
        prompt:
          "Phân tích ý nghĩa của việc sử dụng thì hiện tại tiếp diễn để diễn đạt tương lai trong tiếng Anh. Cho ví dụ minh họa cụ thể.",
        sampleAnswer:
          "Thì hiện tại tiếp diễn được dùng cho tương lai gần khi kế hoạch đã được sắp xếp sẵn...",
        cognitiveLevel: "ANALYZING",
        sourceType: "MANUAL",
        points: 3,
      },
      {
        id: 5,
        type: "ESSAY",
        prompt:
          "Viết một đoạn văn ngắn (3-5 câu) về thói quen hàng ngày của bạn, sử dụng đúng các thì hiện tại đã học.",
        sampleAnswer: "",
        cognitiveLevel: "CREATING",
        sourceType: "AI",
        points: 2,
      },
    ],
  },
];

const QTYPES = [
  { v: "MULTIPLE_CHOICE", l: "Trắc nghiệm" },
  { v: "TRUE_FALSE", l: "Đúng / Sai" },
  { v: "FILL_IN_THE_BLANK", l: "Điền khuyết" },
  { v: "ESSAY", l: "Tự luận" },
];

const DEFAULT_CHAT_MESSAGES = [
  {
    role: "bot",
    text: "Chào thầy/cô! Tôi là trợ lý AI Learnify. Sau khi tạo câu hỏi, thầy/cô có thể nhờ tôi chỉnh sửa hoặc bấm ✏️ để sửa thủ công.",
    time: "Bây giờ",
  },
];

const formatChatMessageTime = (value) => {
  if (!value) return "Vừa xong";
  try {
    const d = new Date(value);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "Vừa xong";
  }
};

const AI_CHAT_LOGO_PATH = "/logo/image.png";

let nid = 200;

const I = {
  Send: () => (
    <svg
      width="16"
      height="16"
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
  User: () => (
    <svg
      width="14"
      height="14"
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
};

function ChkIcon() {
  return (
    <I.Check />
  );
}

export default function ManualAssignmentPreviewPage() {
  const { user } = useAuth();
  const userAvatarUrl = user?.profilePicture || user?.avatarUrl || null;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [sections, setSections] = useState([]);
  const [active, setActive] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dropId, setDropId] = useState(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [publishErrorDraftItemId, setPublishErrorDraftItemId] = useState(null);
  const [workspaceSessionId, setWorkspaceSessionId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const autoSaveTimerRef = useRef(null);
  const skipAutoSaveRef = useRef(false);
  const autoSaveSeqRef = useRef(0);
  const questionRefs = useRef(new Map());
  const chatEndRef = useRef(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [msgs, setMsgs] = useState(DEFAULT_CHAT_MESSAGES);
  const [chatIn, setChatIn] = useState("");
  const [typing, setTyping] = useState(false);

  const sugs = [
    "Sửa câu 1 cho khó hơn",
    "Thêm 3 câu nữa",
    "Đổi câu 3 sang tự luận",
    "Xóa câu cuối",
  ];

  const totalQ = sections.reduce((a, s) => a + s.questions.length, 0);
  const totalPts = sections.reduce(
    (a, s) => a + s.questions.reduce((b, q) => b + q.points, 0),
    0,
  );

  const pageLabel = useMemo(() => {
    const assignmentId = searchParams.get("assignmentId");
    if (assignmentTitle) {
      return `Preview bài tập · ${assignmentTitle}`;
    }
    return assignmentId
      ? `Preview bài tập #${assignmentId}`
      : "Preview bài tập";
  }, [assignmentTitle, searchParams]);

  const buildNextQuery = (extraParams = {}) => {
    const params = new URLSearchParams(searchParams);

    if (workspaceSessionId) {
      params.set("sessionId", String(workspaceSessionId));
    }

    Object.entries(extraParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        params.delete(key);
        return;
      }

      params.set(key, String(value));
    });

    return params.toString();
  };

  const goToManualEditor = () => {
    navigate(
      `${PATH_TEACHER.assignmentCreateManualQuestions}?${buildNextQuery()}`,
    );
  };

  const goToAiEditor = () => {
    navigate(`${PATH_TEACHER.assignmentCreateAi}?${buildNextQuery()}`);
  };

  const goToQuestionBankPicker = () => {
    navigate(
      `${PATH_TEACHER.assignmentQuestionBankPicker}?${buildNextQuery()}`,
    );
  };

  const registerQuestionRef = (questionId) => (node) => {
    const targetId = toPositiveId(questionId);

    if (!targetId) {
      return;
    }

    if (node) {
      questionRefs.current.set(targetId, node);
      return;
    }

    questionRefs.current.delete(targetId);
  };

  const clearDragState = () => {
    dragItem.current = null;
    dragOver.current = null;
    setDraggingId(null);
    setDropId(null);
  };

  const toggleQuestionSelection = (questionId) => {
    const safeQuestionId = toPositiveId(questionId);

    if (!safeQuestionId || editId || typing) {
      return;
    }

    setSelectedQuestionIds((prev) =>
      prev.includes(safeQuestionId)
        ? prev.filter((id) => id !== safeQuestionId)
        : [...prev, safeQuestionId],
    );
  };

  const clearSelectedQuestions = () => {
    setSelectedQuestionIds([]);
  };

  const reorderSectionQuestions = async (
    sectionId,
    sourceQuestionId,
    targetQuestionId,
  ) => {
    const assignmentId = toPositiveId(searchParams.get("assignmentId"));

    if (!workspaceSessionId || !assignmentId) {
      return;
    }

    const targetSection = sections.find((section) => section.id === sectionId);

    if (!targetSection) {
      return;
    }

    const sourceIndex = targetSection.questions.findIndex(
      (question) =>
        toPositiveId(question?.itemId || question?.id) === sourceQuestionId,
    );
    const targetIndex = targetSection.questions.findIndex(
      (question) =>
        toPositiveId(question?.itemId || question?.id) === targetQuestionId,
    );

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return;
    }

    const nextQuestions = [...targetSection.questions];
    const [movedQuestion] = nextQuestions.splice(sourceIndex, 1);
    nextQuestions.splice(targetIndex, 0, movedQuestion);

    const previousSections = sections;
    const nextSections = sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            questions: nextQuestions.map((question, index) => ({
              ...question,
              orderIndex: index,
            })),
          }
        : section,
    );

    setSections(nextSections);
    setAutoSaveStatus("saving");

    const batchItems = nextQuestions.map((question, index) =>
      buildAutoSavePayload(question, sectionId, index),
    );

    try {
      await assignmentApi.batchAutoSaveDraftItems(
        workspaceSessionId,
        batchItems,
        {
          assignmentId,
        },
      );
      setAutoSaveStatus("saved");
      toast.success("Đã cập nhật vị trí câu hỏi.");
    } catch (error) {
      setSections(previousSections);
      setAutoSaveStatus("error");
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật thứ tự câu hỏi.",
      );
    } finally {
      clearDragState();
    }
  };

  const handleQuestionDragStart = (sectionId, question) => (event) => {
    const questionId = toPositiveId(question?.itemId || question?.id);

    if (!questionId || editId || publishing || isLoadingWorkspace) {
      event.preventDefault();
      return;
    }

    dragItem.current = {
      sectionId,
      questionId,
    };
    dragOver.current = null;
    setDraggingId(questionId);
    setDropId(null);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(questionId));
    }
  };

  const handleQuestionDragEnd = () => {
    clearDragState();
  };

  const handleQuestionDragOver = (sectionId, question) => (event) => {
    event.preventDefault();

    const questionId = toPositiveId(question?.itemId || question?.id);
    const dragged = dragItem.current;

    if (!questionId || !dragged || dragged.questionId === questionId) {
      return;
    }

    if (dragged.sectionId !== sectionId) {
      return;
    }

    dragOver.current = {
      sectionId,
      questionId,
    };
    setDropId(questionId);
  };

  const handleQuestionDrop = (sectionId, question) => async (event) => {
    event.preventDefault();

    const questionId = toPositiveId(question?.itemId || question?.id);
    const dragged = dragItem.current;

    if (
      !questionId ||
      !dragged ||
      dragged.sectionId !== sectionId ||
      dragged.questionId === questionId
    ) {
      clearDragState();
      return;
    }

    await reorderSectionQuestions(sectionId, dragged.questionId, questionId);
  };

  useEffect(() => {
    const assignmentId = toPositiveId(searchParams.get("assignmentId"));
    const existingSessionId = toPositiveId(searchParams.get("sessionId"));

    if (!assignmentId) {
      setSections([]);
      setLoadError("Không tìm thấy assignmentId hợp lệ.");
      return undefined;
    }

    let alive = true;

    const loadWorkspace = async () => {
      setIsLoadingWorkspace(true);
      setLoadError("");

      try {
        try {
          const assignmentResp =
            await assignmentApi.getAssignment(assignmentId);
          const assignmentData = assignmentResp?.result || {};
          const resolvedTitle = String(assignmentData?.title || "").trim();
          if (alive) {
            setAssignmentTitle(resolvedTitle || "");
          }
        } catch {
          if (alive) {
            setAssignmentTitle("");
          }
        }

        let sessionId = existingSessionId;

        if (!sessionId) {
          const initResp =
            await assignmentApi.initAssignmentWorkspace(assignmentId);
          sessionId = toPositiveId(
            initResp?.result?.sessionId ||
              initResp?.result?.id ||
              initResp?.result,
          );
        }

        if (!sessionId) {
          throw new Error("Không lấy được session workspace.");
        }

        setWorkspaceSessionId(sessionId);
        const workspaceResp = await assignmentApi.getDraftWorkspace(sessionId);
        const rawSections = Array.isArray(workspaceResp?.result?.sections)
          ? workspaceResp.result.sections
          : [];

        const mappedSections = rawSections.map(mapWorkspaceSection);

        if (!alive) return;

        setSections(mappedSections);
        const preferredSectionId = toPositiveId(searchParams.get("sectionId"));
        const fallbackActive =
          preferredSectionId &&
          mappedSections.some((section) => section.id === preferredSectionId)
            ? preferredSectionId
            : mappedSections[0]?.id || null;
        setActive(fallbackActive);
      } catch (error) {
        if (!alive) return;

        setLoadError(
          error?.response?.data?.message ||
            error?.message ||
            "Không thể tải workspace. Vui lòng thử lại.",
        );
        setSections([]);
        setActive(null);
        setWorkspaceSessionId(null);
      } finally {
        if (alive) setIsLoadingWorkspace(false);
      }
    };

    loadWorkspace();

    return () => {
      alive = false;
    };
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!chatEndRef.current) {
      return;
    }

    chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  useEffect(() => {
    if (!publishErrorDraftItemId) {
      return undefined;
    }

    const targetQuestion = sections
      .flatMap((section) => section.questions)
      .find(
        (question) =>
          toPositiveId(question?.itemId || question?.id) ===
          publishErrorDraftItemId,
      );

    if (!targetQuestion) {
      return undefined;
    }

    const targetSection = sections.find((section) =>
      section.questions.some(
        (question) =>
          toPositiveId(question?.itemId || question?.id) ===
          publishErrorDraftItemId,
      ),
    );

    if (targetSection && targetSection.id !== active) {
      setActive(targetSection.id);
    }

    const targetId = toPositiveId(targetQuestion?.itemId || targetQuestion?.id);
    const scrollToTarget = () => {
      const node = questionRefs.current.get(targetId);

      if (!node) {
        return;
      }

      node.scrollIntoView({ behavior: "smooth", block: "center" });

      if (typeof node.focus === "function") {
        node.focus({ preventScroll: true });
      }
    };

    const rafId = window.requestAnimationFrame(scrollToTarget);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [publishErrorDraftItemId, sections, active]);

  const buildAutoSavePayload = (question, sectionId, orderIndex) => {
    const questionType = API_TYPE_MAP[question?.type] || "MULTIPLE_CHOICE";
    const cognitiveLevel =
      API_COG_MAP[question?.cognitiveLevel] ||
      question?.cognitiveLevel ||
      "APPLYING";

    let options = null;

    if (questionType === "MULTIPLE_CHOICE") {
      const correctIndex = question?.cor ?? 0;
      const sourceOptions = Array.isArray(question?.opts) ? question.opts : [];
      options = sourceOptions
        .map((option, index) => ({
          content: String(option ?? "").trim(),
          correct: index === correctIndex,
        }))
        .filter((option) => option.content.length > 0);
      if (!options.length) options = null;
    } else if (questionType === "TRUE_FALSE") {
      options = [
        { content: "Đúng", correct: question?.cor === true },
        { content: "Sai", correct: question?.cor === false },
      ];
    } else if (questionType === "FILL_IN_THE_BLANK") {
      const fillAnswer = String(question?.ans || "").trim();
      options = fillAnswer ? [{ content: fillAnswer, correct: true }] : null;
    }

    return {
      itemId: toPositiveId(question?.itemId || question?.id) || null,
      content: String(question?.prompt || "").trim() || null,
      questionType,
      cognitiveLevel,
      defaultPoints: Number.isFinite(Number(question?.points))
        ? Number(question.points)
        : 1,
      sampleAnswer:
        questionType === "ESSAY"
          ? String(question?.sampleAnswer || "").trim() || null
          : null,
      options,
      sectionId,
      orderIndex: Number.isInteger(orderIndex) ? orderIndex : null,
    };
  };

  const refreshWorkspaceAfterRefine = async (sessionId) => {
    const workspaceResp = await assignmentApi.getDraftWorkspace(sessionId);
    const rawSections = Array.isArray(workspaceResp?.result?.sections)
      ? workspaceResp.result.sections
      : [];
    const mappedSections = rawSections.map(mapWorkspaceSection);

    setSections(mappedSections);

    const preferredSectionId = toPositiveId(searchParams.get("sectionId"));
    const fallbackActive =
      preferredSectionId &&
      mappedSections.some((section) => section.id === preferredSectionId)
        ? preferredSectionId
        : mappedSections[0]?.id || null;
    setActive(fallbackActive);
    setSelectedQuestionIds([]);
    setPublishErrorDraftItemId(null);
  };

  const sendChat = async () => {
    const message = String(chatIn || "").trim();

    if (!message || typing) {
      return;
    }

    setMsgs((prev) => [
      ...prev,
      {
        role: "user",
        text: message,
        time: formatChatMessageTime(new Date()),
      },
    ]);
    setChatIn("");
    setTyping(true);

    try {
      const safeSessionId = toPositiveId(workspaceSessionId);
      const safeAssignmentId = toPositiveId(searchParams.get("assignmentId"));
      const safeBankId = toPositiveId(searchParams.get("bankId"));
      const safeSectionId =
        toPositiveId(active) || toPositiveId(searchParams.get("sectionId"));

      if (!safeSessionId || !safeAssignmentId) {
        throw new Error("Không có đủ thông tin để tinh chỉnh câu hỏi.");
      }

      const normalizedSelectedQuestionIds = selectedQuestionIds
        .map((id) => toPositiveId(id))
        .filter(Boolean);

      const response = await assignmentApi.refineAiQuestions(
        safeSessionId,
        {
          prompt: message,
          sectionId: safeSectionId || undefined,
          selectQuestionIds:
            normalizedSelectedQuestionIds.length > 0
              ? normalizedSelectedQuestionIds
              : undefined,
          filterBySectionOnly: normalizedSelectedQuestionIds.length === 0,
        },
        {
          bankId: safeBankId || undefined,
          assignmentId: safeAssignmentId,
        },
      );

      const result = response?.result || {};
      const nextSessionId = toPositiveId(result?.sessionId);

      if (nextSessionId) {
        setWorkspaceSessionId(nextSessionId);
      }

      await refreshWorkspaceAfterRefine(nextSessionId || safeSessionId);

      const warnings = Array.isArray(result?.warnings)
        ? result.warnings.filter(Boolean)
        : [];

      setMsgs((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Đã refine theo yêu cầu của thầy/cô.${normalizedSelectedQuestionIds.length ? `\nPhạm vi: ${normalizedSelectedQuestionIds.length} câu được chọn.` : "\nPhạm vi: toàn bộ section."}${warnings.length ? `\nCảnh báo: ${warnings.join("; ")}` : ""}`,
          time: formatChatMessageTime(new Date()),
        },
      ]);
    } catch (error) {
      setMsgs((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            error?.response?.data?.message ||
            error?.message ||
            "Không thể refine câu hỏi lúc này. Vui lòng thử lại.",
          time: formatChatMessageTime(new Date()),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const persistQuestionEdit = async (
    question,
    sectionId,
    orderIndex,
    { silent = false } = {},
  ) => {
    if (!workspaceSessionId || !question) {
      return false;
    }

    const seq = ++autoSaveSeqRef.current;

    if (!silent) {
      setAutoSaveStatus("saving");
    }

    try {
      await assignmentApi.autoSaveDraftItem(
        workspaceSessionId,
        buildAutoSavePayload(question, sectionId, orderIndex),
        { assignmentId: toPositiveId(searchParams.get("assignmentId")) },
      );

      if (seq === autoSaveSeqRef.current) {
        setAutoSaveStatus("saved");
      }

      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          questions: section.questions.map((item) =>
            item.id === question.id ? { ...question, sectionId } : item,
          ),
        })),
      );

      return true;
    } catch (error) {
      if (seq === autoSaveSeqRef.current) {
        setAutoSaveStatus("error");
      }
      return false;
    }
  };

  const handleBackToEditor = () => {
    const query = searchParams.toString();
    navigate(
      query
        ? `${PATH_TEACHER.assignmentCreateManualQuestions}?${query}`
        : PATH_TEACHER.assignmentCreateManualQuestions,
    );
  };

  const delQ = async (sid, question) => {
    const itemId = toPositiveId(question?.itemId || question?.id);

    if (!workspaceSessionId || !itemId) {
      toast.error("Không thể xóa câu hỏi nháp.");
      return;
    }

    try {
      const response = await assignmentApi.deleteDraftItem(
        workspaceSessionId,
        itemId,
      );

      setSections((prev) =>
        prev.map((section) =>
          section.id === sid
            ? {
                ...section,
                questions: section.questions.filter(
                  (item) => toPositiveId(item?.itemId || item?.id) !== itemId,
                ),
              }
            : section,
        ),
      );

      if (editId === question?.id) {
        cancelEdit();
      }

      if (publishErrorDraftItemId === itemId) {
        setPublishErrorDraftItemId(null);
      }

      toast.success(response?.message || "Đã xóa câu hỏi nháp thành công.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể xóa câu hỏi nháp.",
      );
    }
  };
  const startEdit = (q) => {
    skipAutoSaveRef.current = true;
    setEditId(q.id);
    setEditData({ ...q, opts: q.opts ? [...q.opts] : undefined });
  };
  const addMultipleChoiceOption = () => {
    if (!editData || editData.type !== "MULTIPLE_CHOICE") {
      return;
    }

    const nextOptions = Array.isArray(editData.opts) ? [...editData.opts] : [];
    nextOptions.push("");

    setEditData({
      ...editData,
      opts: nextOptions,
    });
  };
  const cancelEdit = () => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    setEditId(null);
    setEditData(null);
  };
  const saveEdit = async (question, sectionId, orderIndex) => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    const currentQuestion = editData || question;
    if (!currentQuestion) {
      cancelEdit();
      return;
    }

    await persistQuestionEdit(currentQuestion, sectionId, orderIndex, {
      silent: false,
    });
    cancelEdit();
  };

  useEffect(() => {
    if (!editId || !editData || !workspaceSessionId) {
      return undefined;
    }

    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return undefined;
    }

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      persistQuestionEdit(editData, editData.sectionId, null, { silent: true });
    }, 700);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [editData, editId, workspaceSessionId]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const assignmentId = toPositiveId(searchParams.get("assignmentId"));
      const sessionId = toPositiveId(workspaceSessionId);
      const bankId = toPositiveId(searchParams.get("bankId"));
      const selectedQuestionIds = sections.flatMap((section) =>
        section.questions
          .map((question) => toPositiveId(question?.itemId || question?.id))
          .filter(Boolean),
      );

      if (!assignmentId || !sessionId) {
        throw new Error("Không có đủ thông tin để xuất bản bài tập.");
      }

      await assignmentApi.confirmAndPublishAssignment(assignmentId, {
        sessionId,
        bankId: bankId || null,
        selectedQuestionIds,
      });

      navigate(PATH_TEACHER.assignmentAssignClasses(assignmentId), {
        replace: true,
      });
    } catch (error) {
      const result = error?.response?.data?.result || {};
      const draftItemId = toPositiveId(result?.draftItemId);
      const reasons = Array.isArray(result?.reasons)
        ? result.reasons
            .map((reason) => String(reason || "").trim())
            .filter(Boolean)
        : [];

      setPublishErrorDraftItemId(draftItemId);

      if (draftItemId) {
        const matchedSection = sections.find((section) =>
          section.questions.some(
            (question) =>
              toPositiveId(question?.itemId || question?.id) === draftItemId,
          ),
        );

        if (matchedSection) {
          setActive(matchedSection.id);
        }
      }

      toast.error(
        reasons[0] ||
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất bản bài tập. Vui lòng thử lại.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const getCog = (l) => COG_UI[l] || COG_UI.APPLYING;

  const renderQ = (q, num, sid) => {
    const isEd = editId === q.id;
    const d = isEd ? editData : q;
    const cog = getCog(d?.cognitiveLevel);
    const src = SRC_CFG[q.sourceType] || SRC_CFG.MANUAL;
    const safeQuestionId = toPositiveId(q?.itemId || q?.id);
    const isQuestionSelected = safeQuestionId
      ? selectedQuestionIds.includes(safeQuestionId)
      : false;
    const isPublishErrorQuestion =
      publishErrorDraftItemId &&
      toPositiveId(q?.itemId || q?.id) === publishErrorDraftItemId;

    return (
      <div
        key={q.id}
        className={`qc${isEd ? " editing" : ""}${isPublishErrorQuestion ? " publish-error" : ""}${isQuestionSelected ? " selected" : ""}${draggingId === q.id ? " dragging" : ""}${dropId === q.id ? " drop-over" : ""}`}
        ref={registerQuestionRef(q.id)}
        tabIndex={-1}
        onDragOver={handleQuestionDragOver(sid, q)}
        onDrop={handleQuestionDrop(sid, q)}
        onDragEnd={handleQuestionDragEnd}
      >
        <div className="qc-main">
          <div className="qc-top">
            {!isEd && (
              <div className="qc-top-meta">
                <button
                  type="button"
                  className={`qc-select${isQuestionSelected ? " on" : ""}`}
                  onClick={() => toggleQuestionSelection(safeQuestionId)}
                  title={isQuestionSelected ? "Bỏ chọn câu hỏi" : "Chọn câu hỏi để refine"}
                >
                  ✓
                </button>
                <div
                  className="drag-handle"
                  draggable
                  onDragStart={handleQuestionDragStart(sid, q)}
                  onDragEnd={handleQuestionDragEnd}
                  title="Kéo để đổi vị trí"
                >
                  ⋮⋮
                </div>
              </div>
            )}
            <div className="qc-num">{num}</div>
            <div className="qc-body">
              <div className="qc-badges">
                <span className={`qc-type-badge ${TC[d.type] || "mc"}`}>
                  {TL[d.type]}
                </span>
                <span
                  style={{
                    padding: "2px 7px",
                    borderRadius: 10,
                    fontSize: 9,
                    fontWeight: 800,
                    background: cog.bg,
                    border: `1px solid ${cog.border}`,
                    color: cog.text,
                  }}
                >
                  {cog.label}
                </span>
                <span className={`qc-src-badge ${src.cls}`}>
                  {src.icon} {src.label}
                </span>
              </div>

              {isEd ? (
                <textarea
                  className="ed-prompt"
                  rows={3}
                  value={d.prompt}
                  onChange={(e) =>
                    setEditData({ ...d, prompt: e.target.value })
                  }
                  autoFocus
                />
              ) : (
                <div className="qc-prompt">{d.prompt}</div>
              )}

              {d.type === "MULTIPLE_CHOICE" &&
                d.opts &&
                (isEd ? (
                  <div style={{ marginLeft: 36 }}>
                    <div className="ed-lbl">Đáp án (bấm ○ chọn đúng)</div>
                    {d.opts.map((o, oi) => (
                      <div key={oi} className="ed-opt-row">
                        <div
                          className={`ed-opt-radio${d.cor === oi ? " on" : ""}`}
                          onClick={() => setEditData({ ...d, cor: oi })}
                        >
                          {d.cor === oi && <ChkIcon />}
                        </div>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            background: "var(--bl)",
                            fontSize: 9,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--t3)",
                            flexShrink: 0,
                          }}
                        >
                          {LT[oi]}
                        </div>
                        <input
                          className="ed-opt-input"
                          value={o}
                          onChange={(e) => {
                            const nw = [...d.opts];
                            nw[oi] = e.target.value;
                            setEditData({ ...d, opts: nw });
                          }}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="ab"
                      style={{ marginTop: 6, width: "fit-content" }}
                      onClick={addMultipleChoiceOption}
                    >
                      + Thêm đáp án
                    </button>
                  </div>
                ) : (
                  <div className="qc-opts">
                    {d.opts.map((o, oi) => (
                      <div
                        key={oi}
                        className={`qc-opt${oi === d.cor ? " correct" : ""}`}
                      >
                        <div className="qc-opt-lbl">
                          {oi === d.cor ? <ChkIcon /> : LT[oi]}
                        </div>
                        {o}
                      </div>
                    ))}
                  </div>
                ))}

              {d.type === "TRUE_FALSE" &&
                (isEd ? (
                  <>
                    <div className="ed-lbl">Đáp án</div>
                    <div className="ed-tf">
                      <div
                        className={`ed-tfb${d.cor === true ? " on" : ""}`}
                        onClick={() => setEditData({ ...d, cor: true })}
                      >
                        Đúng
                      </div>
                      <div
                        className={`ed-tfb${d.cor === false ? " on" : ""}`}
                        onClick={() => setEditData({ ...d, cor: false })}
                      >
                        Sai
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="qc-tf">
                    Đáp án:{" "}
                    <span className="ctag">{d.cor ? "Đúng" : "Sai"}</span>
                  </div>
                ))}

              {d.type === "FILL_IN_THE_BLANK" &&
                (isEd ? (
                  <>
                    <div className="ed-lbl">Đáp án</div>
                    <input
                      className="ed-ans"
                      value={d.ans || ""}
                      onChange={(e) =>
                        setEditData({ ...d, ans: e.target.value })
                      }
                    />
                  </>
                ) : (
                  <div className="qc-fb">
                    Đáp án: <span>{d.ans}</span>
                  </div>
                ))}

              {d.type === "ESSAY" && !isEd && (
                <>
                  <div className="qc-essay">Tự luận — chấm thủ công</div>
                  {d.sampleAnswer && (
                    <div
                      className="qc-fb"
                      style={{ fontStyle: "normal", marginTop: 4 }}
                    >
                      Gợi ý trả lời: <span>{d.sampleAnswer}</span>
                    </div>
                  )}
                </>
              )}
              {d.type === "ESSAY" && isEd && (
                <>
                  <div className="ed-lbl">Gợi ý trả lời (tùy chọn)</div>
                  <textarea
                    className="ed-ans"
                    style={{
                      width: "calc(100% - 36px)",
                      fontFamily: "var(--f)",
                      fontSize: 12,
                      resize: "vertical",
                      minHeight: 44,
                    }}
                    value={d.sampleAnswer || ""}
                    onChange={(e) =>
                      setEditData({ ...d, sampleAnswer: e.target.value })
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="qc-bar">
          <div className="qc-bar-l">
            {isEd ? (
              <>
                <button
                  type="button"
                  className="ab sv"
                  onClick={() => saveEdit(q, sid, num - 1)}
                >
                  <ChkIcon /> Lưu
                </button>
                <button type="button" className="ab" onClick={cancelEdit}>
                  ✕ Hủy
                </button>
              </>
            ) : (
              <button type="button" className="ab" onClick={() => startEdit(q)}>
                ✎ Sửa
              </button>
            )}
          </div>
          <div className="qc-bar-r">
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--t3)",
                marginRight: 6,
              }}
            >
              {q.points}đ
            </span>
            <button
              type="button"
              className="ab dng"
              onClick={() => delQ(sid, q)}
            >
              ✕ Xóa
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (published) {
    return (
      <div className="page">
        <style>{CSS}</style>
        <div className="ws-success">
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--gnl)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              color: "var(--gn)",
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--t)" }}>
            Bài tập đã được xuất bản!
          </div>
          <div style={{ fontSize: 14, color: "var(--t2)" }}>
            {totalQ} câu hỏi · {totalPts} điểm
          </div>
          <button
            type="button"
            className="btn btn-g"
            style={{ marginTop: 8 }}
            onClick={() => setPublished(false)}
          >
            ← Quay lại chỉnh sửa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <style>{CSS}</style>

      <div className="side">
        <div className="side-group">
          <div className="side-section-head">CÁC PHẦN</div>
          <div className="side-nav">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`nav-dot${section.id === active ? " active" : ""}`}
                onClick={() => setActive(section.id)}
                title={section.title}
              >
                <span>{section.title}</span>
                <span>{section.questions.length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="side-group">
          <div className="side-section-head">THÊM CÂU HỎI</div>
          <div className="side-actions">
            <button
              type="button"
              className="side-action-btn manual"
              onClick={goToManualEditor}
              disabled={isLoadingWorkspace || !workspaceSessionId}
            >
              <span>✎</span> Tạo thủ công
            </button>
            <button
              type="button"
              className="side-action-btn ai"
              onClick={goToAiEditor}
              disabled={isLoadingWorkspace || !workspaceSessionId}
            >
              <span>✦</span> Tạo với AI
            </button>
            <button
              type="button"
              className="side-action-btn bank"
              onClick={goToQuestionBankPicker}
              disabled={isLoadingWorkspace || !workspaceSessionId}
            >
              <span>◈</span> Từ ngân hàng
            </button>
          </div>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="topbar-l">
            <button type="button" className="bk" onClick={handleBackToEditor}>
              ← Quay lại
            </button>
            <div className="sep" />
            <div className="page-title">{pageLabel}</div>
          </div>
          <div className="topbar-r">
            <span className="stat-pill">
              <b>{totalQ}</b> câu hỏi
            </span>
            <span className="stat-pill">
              <b>{sections.length}</b> phần
            </span>
            <button
              type="button"
              className="btn btn-g"
              onClick={handleBackToEditor}
            >
              Quay lại chỉnh sửa
            </button>
            <button
              type="button"
              className="btn btn-p"
              onClick={handlePublish}
              disabled={publishing || totalQ === 0}
            >
              {publishing ? "Đang xuất bản..." : "✦ Xuất bản"}
            </button>
          </div>
        </div>

        <div className="workspace-shell">
          <div className="scroll workspace-main">
          {isLoadingWorkspace ? (
            <div className="section-wrap">
              <div className="section-hdr">
                <div className="section-title">Đang tải workspace...</div>
              </div>
              <div className="section-body">
                <div className="q-empty">
                  Vui lòng chờ hệ thống tải dữ liệu bài tập.
                </div>
              </div>
            </div>
          ) : loadError ? (
            <div className="section-wrap">
              <div className="section-hdr">
                <div className="section-title">Không tải được workspace</div>
              </div>
              <div className="section-body">
                <div className="q-empty">{loadError}</div>
              </div>
            </div>
          ) : sections.length === 0 ? (
            <div className="section-wrap">
              <div className="section-hdr">
                <div className="section-title">Không có câu hỏi</div>
              </div>
              <div className="section-body">
                <div className="q-empty">
                  Workspace hiện không có section nào.
                </div>
              </div>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id} className="section-wrap">
                <div className="section-hdr">
                  <div className="section-title">{section.title}</div>
                  <div className="section-hdr-right">
                    <span className={`sec-type-badge ${section.sectionType}`}>
                      {section.sectionType === "OBJECTIVE"
                        ? "Trắc nghiệm"
                        : section.sectionType === "ESSAY"
                          ? "Tự luận"
                          : "Hỗn hợp"}
                    </span>
                    <span className="section-meta">
                      {section.questions.length} câu ·{" "}
                      {section.questions.reduce((sum, q) => sum + q.points, 0)}{" "}
                      điểm
                    </span>
                  </div>
                </div>
                <div className="section-body">
                  {section.questions.length === 0 ? (
                    <div className="q-empty">
                      Chưa có câu hỏi — thêm từ sidebar bên trái
                    </div>
                  ) : (
                    section.questions.map((question, index) =>
                      renderQ(question, index + 1, section.id),
                    )
                  )}
                </div>
              </div>
            ))
          )}

          <div className="preview-footer">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{ fontSize: 13, color: "var(--t2)", fontWeight: 500 }}
              >
                Tổng: <b>{totalQ}</b> câu hỏi · <b>{totalPts}</b> điểm
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color:
                    autoSaveStatus === "error"
                      ? "var(--rd)"
                      : autoSaveStatus === "saved"
                        ? "var(--gn)"
                        : "var(--t3)",
                }}
              >
                {autoSaveStatus === "saving" && "Đang tự động lưu"}
                {autoSaveStatus === "saved" && "Đã tự động lưu"}
                {autoSaveStatus === "error" && "Lỗi lưu tự động"}
                {autoSaveStatus === "idle" && "Sẵn sàng tự động lưu"}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-p"
              onClick={handlePublish}
              disabled={publishing || totalQ === 0}
            >
              {publishing ? "Đang xuất bản..." : "✦ Xuất bản bài tập"}
            </button>
          </div>
          </div>
          <div className="workspace-chat">
            <div className="ai-refine">
              <div className="ch-h">
                <div className="ch-ic" style={{ background: "transparent" }}>
                  <img
                    src={AI_CHAT_LOGO_PATH}
                    alt="Learnify AI"
                    style={{ width: 48, height: 48, objectFit: "contain" }}
                  />
                </div>
                <div className="ch-hi">
                  <h3>Trợ lý AI</h3>
                  <p>Chỉnh sửa câu hỏi qua chat</p>
                </div>
              </div>

              <div className="ch-msgs">
                {msgs.map((m, i) => (
                  <div
                    key={i}
                    className={`ch-m ${m.role === "user" ? "usr" : "bot"}`}
                  >
                    <div
                      className={`ch-av ${m.role === "user" ? "hm" : "bt"}`}
                      style={
                        m.role === "user" ? undefined : { background: "transparent" }
                      }
                    >
                      {m.role === "user" ? (
                        userAvatarUrl ? (
                          <img
                            src={userAvatarUrl}
                            alt={user?.fullName || "User"}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <I.User />
                        )
                      ) : (
                        <img
                          src={AI_CHAT_LOGO_PATH}
                          alt="Learnify AI"
                          style={{ width: 40, height: 40, objectFit: "contain" }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="ch-bb" style={{ whiteSpace: "pre-line" }}>
                        {m.text}
                      </div>
                      <div className="ch-tm">{m.time}</div>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="ch-m bot">
                    <div className="ch-av bt" style={{ background: "transparent" }}>
                      <img
                        src={AI_CHAT_LOGO_PATH}
                        alt="Learnify AI"
                        style={{ width: 40, height: 40, objectFit: "contain" }}
                      />
                    </div>
                    <div className="ch-bb">
                      <div className="typing">
                        <div className="td" />
                        <div className="td" />
                        <div className="td" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="ch-sug">
                {sugs.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="ch-sg"
                    onClick={() => setChatIn(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="ch-inp">
                {sections.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 10,
                        color: "var(--t3)",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      Phần tinh chỉnh
                    </label>
                    <select
                      value={active || ""}
                      onChange={(event) => setActive(toPositiveId(event.target.value))}
                      style={{
                        width: "100%",
                        height: 32,
                        border: "1.5px solid var(--b)",
                        borderRadius: "var(--rs)",
                        padding: "0 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: "var(--f)",
                        color: "var(--t)",
                        background: "var(--card)",
                        outline: "none",
                      }}
                    >
                      {sections.map((section) => (
                        <option key={`chat-section-${section.id}`} value={section.id}>
                          {section.title} - {section.sectionType === "OBJECTIVE" ? "Trắc nghiệm" : section.sectionType === "ESSAY" ? "Tự luận" : "Hỗn hợp"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="ch-ht left">
                  {selectedQuestionIds.length > 0
                    ? `Đang chọn ${selectedQuestionIds.length} câu để tinh chỉnh.`
                    : "Chưa chọn câu hỏi: AI sẽ tinh chỉnh toàn bộ."}
                </div>
                <div className="ch-ir">
                  <textarea
                    className="ch-ta"
                    placeholder="Nhập yêu cầu chỉnh sửa..."
                    value={chatIn}
                    onChange={(e) => setChatIn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    rows={1}
                  />
                  <button
                    type="button"
                    className="ch-sd"
                    onClick={sendChat}
                    disabled={!chatIn.trim() || typing || isLoadingWorkspace}
                  >
                    <I.Send />
                  </button>
                </div>
                <div className="ch-ht">Enter gửi · Shift+Enter xuống dòng</div>
                {selectedQuestionIds.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="ab"
                      onClick={clearSelectedQuestions}
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
