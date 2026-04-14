import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { questionBankApi } from "@/apis/question-bank.api";
import { PATH_TEACHER } from "@/routes/paths";

const mkQ = (n) => {
  const pool = [
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Phương trình mặt phẳng qua A(1;0;0), B(0;2;0), C(0;0;3):",
      opts: ["6x+3y+2z-6=0", "x+2y+3z-1=0", "6x+3y+2z+6=0", "2x+3y+6z=6"],
      cor: 0,
    },
    {
      type: "TRUE_FALSE",
      prompt:
        "Hai mặt phẳng có VTPT cùng phương thì song song hoặc trùng nhau.",
      cor: true,
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Khoảng cách từ M(1;0;-1) đến mp x+2y-2z+3=0:",
      opts: ["2/3", "2", "4/3", "8/3"],
      cor: 1,
    },
    {
      type: "FILL_IN_BLANK",
      prompt: "Mặt cầu x^2+y^2+z^2-4x+6y-2z+5=0 có bán kính R = ___",
      ans: "3",
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Cho mặt cầu (x-1)^2+(y+2)^2+(z-3)^2=16. Bán kính:",
      opts: ["2", "4", "8", "16"],
      cor: 1,
    },
    {
      type: "TRUE_FALSE",
      prompt:
        "Đường thẳng vuông góc với mp thì vuông góc với mọi đường thẳng trong mp đó.",
      cor: true,
    },
    {
      type: "ESSAY",
      prompt:
        "Cho hình chóp S.ABCD, đáy hình vuông cạnh a.\na) Tính thể tích.\nb) Tính khoảng cách từ A đến (SBC).",
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt:
        "Thể tích khối chóp SA vuông góc (ABC), SA=3, tam giác ABC đều cạnh 4:",
      opts: ["4sqrt3", "8sqrt3", "12sqrt3", "6sqrt3"],
      cor: 1,
    },
    {
      type: "FILL_IN_BLANK",
      prompt: "Góc giữa hai mp (P): x+y+z-1=0 và (Q): x+y-1=0 bằng ___ độ.",
      ans: "35",
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Trong không gian Oxyz, mp qua A(1;2;3), n=(2;-1;3):",
      opts: ["2x-y+3z-9=0", "2x+y+3z-9=0", "2x-y-3z+9=0", "x+y-3z=0"],
      cor: 0,
    },
    {
      type: "TRUE_FALSE",
      prompt: "Hai mp 2x-y+3z+1=0 và 4x-2y+6z-5=0 song song.",
      cor: true,
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Khoảng cách giữa 2 mp song song 2x-y+2z-1=0 và 2x-y+2z+5=0:",
      opts: ["2", "6/3", "4/3", "6"],
      cor: 0,
    },
    {
      type: "ESSAY",
      prompt:
        "Viết phương trình mp trung trực của đoạn AB với A(1;2;-1), B(3;0;5).",
    },
  ];
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    ...pool[i % pool.length],
  }));
};

const I = {
  Upload: () => (
    <svg
      width="20"
      height="20"
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
  File: () => (
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
    </svg>
  ),
  X: () => (
    <svg
      width="14"
      height="14"
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
  Edit: () => (
    <svg
      width="13"
      height="13"
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
  ChevL: () => (
    <svg
      width="14"
      height="14"
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
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Download: () => (
    <svg
      width="14"
      height="14"
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
  Alert: () => (
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
  Undo: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  ),
  Refresh: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  ),
  FileSpread: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
  Eye: () => (
    <svg
      width="16"
      height="16"
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
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap');
:root{--p:#2563EB;--pd:#1D4ED8;--pl:#EFF6FF;--plr:#F8FAFF;--pg:rgba(37,99,235,.10);--ps:rgba(37,99,235,.22);--gr:linear-gradient(135deg,#3B82F6,#2563EB 50%,#1D4ED8);--bg:#F7F8FC;--card:#FFF;--inp:#F5F7FB;--hov:#EDF2FF;--t:#1E293B;--t2:#475569;--t3:#94A3B8;--inv:#FFF;--gn:#10B981;--gnl:#ECFDF5;--or:#F59E0B;--orl:#FFFBEB;--rd:#EF4444;--rdl:#FEF2F2;--pu:#8B5CF6;--pul:#F5F3FF;--sk:#0EA5E9;--skl:#F0F9FF;--b:#E2E8F0;--bl:#F1F5F9;--ss:0 1px 3px rgba(30,41,59,.04);--sm:0 4px 14px rgba(30,41,59,.07);--sl:0 12px 40px rgba(30,41,59,.11);--rs:10px;--rm:12px;--rl:16px;--rxl:20px;--f:'Be Vietnam Pro',sans-serif;--fd:'Lora',serif;--fm:'JetBrains Mono',monospace;--e:cubic-bezier(.4,0,.2,1)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--f);background:var(--bg);color:var(--t);-webkit-font-smoothing:antialiased}
.app{display:flex;height:100vh;overflow:hidden}
.pnl{flex:1;display:flex;flex-direction:column;overflow:hidden}
.pnl-l{border-right:1px solid var(--b)}
.pnl-r{background:var(--bg)}
.topbar{height:54px;background:var(--card);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex-shrink:0}
.top-l{display:flex;align-items:center;gap:12px}
.bk{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid var(--b);border-radius:var(--rs);background:var(--card);font-size:11px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;transition:all .15s var(--e)}
.bk:hover{border-color:var(--p);color:var(--p)}
.top-t{font-family:var(--fd);font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px}
.top-t svg{color:var(--sk)}
.top-r{display:flex;gap:6px}
.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 16px;border-radius:var(--rm);font-size:11px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;transition:all .2s var(--e)}
.btn-p{background:var(--gr);color:var(--inv);box-shadow:0 2px 10px var(--ps)}
.btn-p:hover{transform:translateY(-1px)}
.btn-g{background:var(--card);color:var(--t2);border:1.5px solid var(--b)}
.btn-g:hover{border-color:var(--p);color:var(--p);background:var(--hov)}
.scr{flex:1;overflow-y:auto;padding:22px;background:var(--bg)}
.cfg{background:var(--card);border:1px solid var(--b);border-radius:var(--rxl);padding:26px;box-shadow:var(--ss);margin-bottom:18px;animation:fu .35s ease both}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.cfg-t{font-family:var(--fd);font-size:18px;font-weight:700;margin-bottom:5px;display:flex;align-items:center;gap:8px}
.cfg-d{font-size:13px;color:var(--t3);margin-bottom:22px;line-height:1.6}
.tmpl{background:linear-gradient(135deg,var(--pl),#DBEAFE);border:1px solid rgba(37,99,235,.12);border-radius:var(--rm);padding:18px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;gap:14px}
.tmpl-info{font-size:13px;font-weight:700;color:var(--pd)}
.tmpl-sub{font-size:11px;color:var(--t2);margin-top:3px}
.tmpl-btns{display:flex;gap:6px;flex-shrink:0}
.uz{border:2px dashed var(--b);border-radius:var(--rl);padding:44px 20px;text-align:center;cursor:pointer;transition:all .25s var(--e);background:var(--inp);margin-bottom:22px}
.uz:hover{border-color:var(--p);background:var(--hov)}
.uz.has{border-color:var(--gn);background:var(--gnl);border-style:solid;padding:24px 20px}
.uz-ic{color:var(--t3);margin-bottom:10px;display:flex;justify-content:center}
.uz-title{font-size:15px;font-weight:700;color:var(--t);margin-bottom:4px}
.uz-t{font-size:12px;color:var(--t3);font-weight:500}
.uz-t strong{color:var(--p);font-weight:700}
.uz-fmts{display:flex;gap:6px;justify-content:center;margin-top:12px}
.uz-fmt{padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;background:var(--bl);color:var(--t3)}
.uz-fi{display:flex;align-items:center;gap:10px;justify-content:center}
.uz-fn{font-size:14px;font-weight:700;color:var(--gn)}
.uz-fs{font-size:11px;color:var(--t3)}
.uz-rm{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--rd);background:var(--rdl);color:var(--rd);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--e)}
.uz-rm:hover{background:var(--rd);color:var(--inv)}
.ibtn{width:100%;padding:14px;border:none;border-radius:var(--rm);background:var(--gr);color:var(--inv);font-size:14px;font-weight:700;font-family:var(--f);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s var(--e);box-shadow:0 4px 16px var(--ps);position:relative;overflow:hidden}
.ibtn:hover{transform:translateY(-2px)}
.ibtn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.ibtn .shim{position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);animation:sh 2s infinite}
@keyframes sh{to{left:100%}}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
.stat{background:var(--card);border:1px solid var(--b);border-radius:var(--rm);padding:16px 14px;text-align:center;box-shadow:var(--ss);animation:fu .3s ease both;position:relative;overflow:hidden}
.stat::before{content:'';position:absolute;top:0;left:0;width:100%;height:3px}
.stat:nth-child(1)::before{background:var(--p)}
.stat:nth-child(2)::before{background:var(--gn)}
.stat:nth-child(3)::before{background:var(--or)}
.stat-v{font-size:28px;font-weight:800;line-height:1}
.stat-l{font-size:10px;font-weight:600;color:var(--t3);margin-top:4px;text-transform:uppercase;letter-spacing:.04em}
.tbd{background:var(--card);border:1px solid var(--b);border-radius:var(--rm);padding:16px 18px;margin-bottom:18px;box-shadow:var(--ss);animation:fu .35s ease both}
.tbd-t{font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px}
.tb-r{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.tb-b{padding:3px 8px;border-radius:8px;font-size:9px;font-weight:700;text-transform:uppercase;min-width:60px;text-align:center}
.tb-b.mc{background:var(--pl);color:var(--p)}
.tb-b.tf{background:var(--gnl);color:var(--gn)}
.tb-b.fb{background:var(--orl);color:var(--or)}
.tb-b.es{background:var(--pul);color:var(--pu)}
.tb-bar{flex:1;height:6px;background:var(--bl);border-radius:6px;overflow:hidden}
.tb-fill{height:100%;border-radius:6px;transition:width .6s var(--e)}
.tb-cnt{font-size:11px;font-weight:700;color:var(--t2);min-width:20px;text-align:right}
.warn{display:flex;align-items:center;gap:9px;padding:12px 16px;background:var(--orl);border:1px solid #FDE68A;border-radius:var(--rm);margin-bottom:16px;font-size:12px;color:#92400E;font-weight:600;animation:fu .3s ease both}
.pvh{height:54px;background:var(--card);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex-shrink:0}
.pv-t{font-family:var(--fd);font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px}
.pv-t svg{color:var(--p)}
.pv-c{font-size:11px;font-weight:700;color:var(--p);background:var(--pl);padding:2px 9px;border-radius:16px}
.emp{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;color:var(--t3)}
.emp-ic{width:72px;height:72px;border-radius:50%;background:var(--pl);color:var(--p);display:flex;align-items:center;justify-content:center;margin-bottom:18px;opacity:.6}
.emp-t{font-family:var(--fd);font-size:17px;font-weight:700;color:var(--t2);margin-bottom:6px}
.emp-d{font-size:12px;line-height:1.6;max-width:260px}
.qc{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:10px;transition:all .2s var(--e);animation:fu .25s ease both;overflow:hidden}
.qc:hover{border-color:var(--p);box-shadow:var(--sm)}
.qc.editing{border-color:var(--or);box-shadow:0 0 0 3px rgba(245,158,11,.1),var(--sm)}
.qc-m{padding:16px 18px}
.qc-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px}
.qc-n{min-width:26px;height:26px;border-radius:50%;background:var(--p);color:var(--inv);font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.qc.editing .qc-n{background:var(--or)}
.qc-body{flex:1}
.qc-tb{padding:2px 7px;border-radius:8px;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;display:inline-block;margin-bottom:3px}
.qc-tb.mc{background:var(--pl);color:var(--p)}
.qc-tb.tf{background:var(--gnl);color:var(--gn)}
.qc-tb.fb{background:var(--orl);color:var(--or)}
.qc-tb.es{background:var(--pul);color:var(--pu)}
.qc-pr{font-size:12px;font-weight:600;line-height:1.6;white-space:pre-line}
.qc-opts{margin-top:7px;display:flex;flex-direction:column;gap:4px;margin-left:36px}
.qc-opt{display:flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid var(--bl);border-radius:var(--rs);font-size:11px;color:var(--t2);font-weight:500}
.qc-opt.ok{border-color:var(--gn);background:var(--gnl);color:var(--gn);font-weight:600}
.qc-ol{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--b);font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--t3);flex-shrink:0}
.qc-opt.ok .qc-ol{border-color:var(--gn);background:var(--gn);color:var(--inv)}
.qc-tf{margin-top:6px;margin-left:36px;font-size:11px;font-weight:600}
.ctag{color:var(--gn);background:var(--gnl);padding:2px 7px;border-radius:6px;font-size:9px;font-weight:700}
.qc-fb{margin-top:5px;margin-left:36px;font-size:10px;color:var(--t3);font-weight:600}
.qc-fb span{color:var(--p);font-weight:700;background:var(--pl);padding:1px 6px;border-radius:4px;margin-left:3px}
.ed-pr{width:100%;padding:7px 10px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:12px;font-family:var(--f);font-weight:600;color:var(--t);background:#FFFDF7;min-height:42px;resize:vertical;line-height:1.6}
.ed-pr:focus{outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.1)}
.ed-or{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.ed-oi{flex:1;padding:6px 9px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:11px;font-family:var(--f);color:var(--t);background:var(--inp)}
.ed-oi:focus{outline:none;border-color:var(--or)}
.ed-radio{width:18px;height:18px;border-radius:50%;border:2px solid var(--b);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s var(--e)}
.ed-radio.on{border-color:var(--gn);background:var(--gn);color:var(--inv)}
.ed-radio:hover{border-color:var(--gn)}
.ed-lbl{font-size:9px;font-weight:700;color:var(--t3);margin:6px 0 4px 36px;text-transform:uppercase;letter-spacing:.04em}
.ed-tf{display:flex;gap:6px;margin-left:36px}
.ed-tfb{flex:1;padding:8px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:11px;font-weight:700;text-align:center;cursor:pointer;background:var(--card);color:var(--t3);font-family:var(--f)}
.ed-tfb:hover{border-color:var(--gn)}
.ed-tfb.on{border-color:var(--gn);background:var(--gnl);color:var(--gn)}
.ed-ans{margin-left:36px;width:calc(100% - 36px);padding:6px 9px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:11px;font-family:var(--fm);color:var(--t);background:#FFFDF7}
.ed-ans:focus{outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.1)}
.qc-bar{display:flex;align-items:center;justify-content:space-between;padding:7px 18px;border-top:1px solid var(--bl);background:var(--bg)}
.qc-bar-l,.qc-bar-r{display:flex;gap:3px}
.ab{display:flex;align-items:center;gap:3px;padding:4px 9px;border-radius:var(--rs);border:none;background:none;font-size:9px;font-weight:600;font-family:var(--f);color:var(--t3);cursor:pointer;transition:all .12s var(--e)}
.ab:hover{background:var(--hov);color:var(--p)}
.ab.ed{color:var(--or)}
.ab.ed:hover{background:var(--orl)}
.ab.dng:hover{background:var(--rdl);color:var(--rd)}
.ab.sv{color:var(--gn)}
.ab.sv:hover{background:var(--gnl)}
.pag{display:flex;align-items:center;justify-content:center;gap:4px;margin-top:12px;padding-bottom:8px}
.pg{width:30px;height:30px;border-radius:var(--rs);border:1.5px solid var(--b);background:var(--card);font-size:10px;font-weight:700;font-family:var(--f);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--e)}
.pg:hover{border-color:var(--p);color:var(--p)}
.pg.on{background:var(--p);color:var(--inv);border-color:var(--p);box-shadow:0 2px 8px var(--ps)}
.pg:disabled{opacity:.3;cursor:not-allowed}
.skel{background:linear-gradient(90deg,var(--bl) 25%,var(--bg) 50%,var(--bl) 75%);background-size:200% 100%;animation:skl 1.5s infinite;border-radius:var(--rm);height:65px;margin-bottom:10px}
@keyframes skl{to{background-position:-200% 0}}
.toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:var(--rm);font-size:12px;font-weight:600;font-family:var(--f);box-shadow:var(--sl);z-index:2000;animation:tin .3s ease;display:flex;align-items:center;gap:7px;background:var(--gn);color:var(--inv)}
@keyframes tin{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:900px){.app{flex-direction:column}.pnl{width:100%}.pnl-l{border-right:none;border-bottom:1px solid var(--b);max-height:50vh}}
`;

const PP = 5;
const LT = "ABCDEFGH";
const TC = {
  MULTIPLE_CHOICE: "mc",
  TRUE_FALSE: "tf",
  FILL_IN_BLANK: "fb",
  ESSAY: "es",
};
const TL = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  TRUE_FALSE: "Đúng/Sai",
  FILL_IN_BLANK: "Điền khuyết",
  ESSAY: "Tự luận",
};

const toPositiveId = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const normalizeEditorType = (type) => {
  const upper = String(type || "")
    .trim()
    .toUpperCase();
  if (upper === "FILL_IN_THE_BLANK") return "FILL_IN_BLANK";
  if (upper === "MULTIPLE_CHOICE") return "MULTIPLE_CHOICE";
  if (upper === "TRUE_FALSE") return "TRUE_FALSE";
  if (upper === "ESSAY") return "ESSAY";
  return "MULTIPLE_CHOICE";
};

const normalizeApiType = (type) => {
  const normalized = normalizeEditorType(type);
  if (normalized === "FILL_IN_BLANK") {
    return "FILL_IN_THE_BLANK";
  }
  return normalized;
};

const normalizeDifficulty = (value) => {
  const upper = String(value || "")
    .trim()
    .toUpperCase();
  if (upper === "EASY" || upper === "MEDIUM" || upper === "HARD") {
    return upper;
  }
  return "MEDIUM";
};

const mapPreviewItemToEditorQuestion = (item, index) => {
  const questionData = item?.questionData || {};
  const type = normalizeEditorType(questionData?.questionType);
  const rawOptions = Array.isArray(questionData?.options)
    ? questionData.options
    : [];

  if (type === "TRUE_FALSE") {
    const trueOption = rawOptions.find(
      (option) =>
        String(option?.content || "")
          .trim()
          .toLowerCase() === "đúng",
    );

    return {
      id: Number(item?.id || item?.rowNumber || index + 1),
      rowNumber: Number(item?.rowNumber || index + 1),
      status: String(item?.status || "VALID").toUpperCase(),
      errors: Array.isArray(item?.errors) ? item.errors : [],
      type,
      prompt: String(questionData?.content || ""),
      cor: Boolean(trueOption?.isCorrect ?? trueOption?.correct),
      points: Number(questionData?.defaultPoints ?? 1) || 1,
      difficulty: normalizeDifficulty(questionData?.difficulty),
    };
  }

  if (type === "FILL_IN_BLANK") {
    return {
      id: Number(item?.id || item?.rowNumber || index + 1),
      rowNumber: Number(item?.rowNumber || index + 1),
      status: String(item?.status || "VALID").toUpperCase(),
      errors: Array.isArray(item?.errors) ? item.errors : [],
      type,
      prompt: String(questionData?.content || ""),
      ans: String(rawOptions?.[0]?.content || ""),
      points: Number(questionData?.defaultPoints ?? 1) || 1,
      difficulty: normalizeDifficulty(questionData?.difficulty),
    };
  }

  if (type === "ESSAY") {
    return {
      id: Number(item?.id || item?.rowNumber || index + 1),
      rowNumber: Number(item?.rowNumber || index + 1),
      status: String(item?.status || "VALID").toUpperCase(),
      errors: Array.isArray(item?.errors) ? item.errors : [],
      type,
      prompt: String(questionData?.content || ""),
      ans: String(questionData?.sampleAnswer || ""),
      points: Number(questionData?.defaultPoints ?? 1) || 1,
      difficulty: normalizeDifficulty(questionData?.difficulty),
    };
  }

  const opts = rawOptions
    .map((option) => String(option?.content || "").trim())
    .filter(Boolean);
  const correctIndex = rawOptions.findIndex((option) =>
    Boolean(option?.isCorrect ?? option?.correct),
  );

  return {
    id: Number(item?.id || item?.rowNumber || index + 1),
    rowNumber: Number(item?.rowNumber || index + 1),
    status: String(item?.status || "VALID").toUpperCase(),
    errors: Array.isArray(item?.errors) ? item.errors : [],
    type,
    prompt: String(questionData?.content || ""),
    opts: opts.length > 0 ? opts : ["", "", "", ""],
    cor: correctIndex >= 0 ? correctIndex : 0,
    points: Number(questionData?.defaultPoints ?? 1) || 1,
    difficulty: normalizeDifficulty(questionData?.difficulty),
  };
};

const validateEditorQuestion = (question) => {
  if (!String(question?.prompt || "").trim()) {
    return false;
  }

  const type = normalizeEditorType(question?.type);

  if (type === "MULTIPLE_CHOICE") {
    const options = Array.isArray(question?.opts)
      ? question.opts.map((option) => String(option || "").trim())
      : [];
    const hasEnoughOptions = options.filter(Boolean).length >= 2;
    const hasValidCorrect =
      Number.isInteger(question?.cor) &&
      question.cor >= 0 &&
      question.cor < options.length &&
      Boolean(options[question.cor]);

    return hasEnoughOptions && hasValidCorrect;
  }

  if (type === "TRUE_FALSE") {
    return typeof question?.cor === "boolean";
  }

  if (type === "FILL_IN_BLANK") {
    return Boolean(String(question?.ans || "").trim());
  }

  return true;
};

const mapEditorQuestionToConfirmPayload = (question) => {
  const type = normalizeEditorType(question?.type);

  if (type === "MULTIPLE_CHOICE") {
    const options = Array.isArray(question?.opts)
      ? question.opts
          .map((option, index) => ({
            content: String(option || "").trim(),
            isCorrect: index === question?.cor,
          }))
          .filter((option) => option.content)
      : [];

    return {
      content: String(question?.prompt || "").trim(),
      questionType: normalizeApiType(type),
      difficulty: normalizeDifficulty(question?.difficulty),
      defaultPoints: Number(question?.points ?? 1) || 1,
      sampleAnswer: null,
      options,
    };
  }

  if (type === "TRUE_FALSE") {
    return {
      content: String(question?.prompt || "").trim(),
      questionType: normalizeApiType(type),
      difficulty: normalizeDifficulty(question?.difficulty),
      defaultPoints: Number(question?.points ?? 1) || 1,
      sampleAnswer: null,
      options: [
        { content: "Đúng", isCorrect: question?.cor === true },
        { content: "Sai", isCorrect: question?.cor === false },
      ],
    };
  }

  if (type === "FILL_IN_BLANK") {
    return {
      content: String(question?.prompt || "").trim(),
      questionType: normalizeApiType(type),
      difficulty: normalizeDifficulty(question?.difficulty),
      defaultPoints: Number(question?.points ?? 1) || 1,
      sampleAnswer: null,
      options: [
        {
          content: String(question?.ans || "").trim(),
          isCorrect: true,
        },
      ],
    };
  }

  return {
    content: String(question?.prompt || "").trim(),
    questionType: normalizeApiType(type),
    difficulty: normalizeDifficulty(question?.difficulty),
    defaultPoints: Number(question?.points ?? 1) || 1,
    sampleAnswer: String(question?.ans || "").trim() || null,
    options: null,
  };
};

const ImportAssignmentFilePage = () => {
  const navigate = useNavigate();
  const { bankId: bankIdFromPath } = useParams();
  const [searchParams] = useSearchParams();

  const resolvedBankId = toPositiveId(
    searchParams.get("bankId") || bankIdFromPath,
  );
  const isBankMode = Boolean(resolvedBankId);

  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("upload");
  const [qs, setQs] = useState([]);
  const [pg, setPg] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fRef = useRef(null);

  const fileName = file?.name || "";
  const fileSizeLabel =
    file && Number.isFinite(file.size) && file.size > 0
      ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
      : "";

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const doImport = async () => {
    if (!file) {
      return;
    }

    setPhase("loading");

    if (!isBankMode) {
      setTimeout(() => {
        setQs(mkQ(13));
        setPhase("results");
        setPg(1);
      }, 2000);
      return;
    }

    try {
      const response = await questionBankApi.previewImportQuestions(
        resolvedBankId,
        file,
      );
      const previewItems = Array.isArray(response?.result)
        ? response.result
        : [];

      setQs(
        previewItems.map((item, index) =>
          mapPreviewItemToEditorQuestion(item, index),
        ),
      );
      setPhase("results");
      setPg(1);
      showToast(
        response?.message ||
          `Đã đọc ${previewItems.length} dòng từ file import.`,
      );
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message || "Không thể preview file import.";
      showToast(apiMessage);
      setQs([]);
      setPhase("upload");
    }
  };

  const handleSaveToBank = async () => {
    if (!isBankMode) {
      showToast("Đã lưu vào ngân hàng!");
      return;
    }

    const payload = qs
      .filter((question) => validateEditorQuestion(question))
      .map((question) => mapEditorQuestionToConfirmPayload(question));

    if (!payload.length) {
      showToast("Không có câu hỏi hợp lệ để lưu vào ngân hàng đề.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await questionBankApi.confirmImportQuestions(
        resolvedBankId,
        payload,
      );
      showToast(response?.message || "Đã lưu câu hỏi vào ngân hàng đề.");
      navigate(PATH_TEACHER.questionBankDetail(resolvedBankId));
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ||
        "Không thể lưu câu hỏi vào ngân hàng đề.";
      showToast(apiMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isBankMode) {
      navigate(PATH_TEACHER.questionBankMethod(resolvedBankId));
      return;
    }

    navigate(PATH_TEACHER.assignmentCreateMethod);
  };

  const resetImportState = () => {
    setPhase("upload");
    setPg(1);
    setFile(null);
    setQs([]);
    setEditId(null);
    setEditData(null);
  };

  const startEdit = (q) => {
    setEditId(q.id);
    setEditData({
      ...q,
      opts: Array.isArray(q.opts) ? [...q.opts] : undefined,
    });
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditData(null);
  };
  const saveEdit = () => {
    setQs((prev) => prev.map((q) => (q.id === editId ? { ...editData } : q)));
    cancelEdit();
    showToast("Đã lưu chỉnh sửa!");
  };
  const deleteQ = (id) => {
    setQs((prev) => prev.filter((q) => q.id !== id));
    if (editId === id) cancelEdit();
  };

  const validCount = useMemo(
    () => qs.filter((question) => validateEditorQuestion(question)).length,
    [qs],
  );
  const errs = Math.max(0, qs.length - validCount);

  const totalPg = Math.ceil(qs.length / PP);
  const vis = qs.slice((pg - 1) * PP, (pg - 1) * PP + PP);
  const cntT = (t) =>
    qs.filter((q) => normalizeEditorType(q.type) === normalizeEditorType(t))
      .length;
  const maxT = Math.max(
    cntT("MULTIPLE_CHOICE"),
    cntT("TRUE_FALSE"),
    cntT("FILL_IN_BLANK"),
    cntT("ESSAY"),
    1,
  );

  return (
    <div className="app">
      <style>{CSS}</style>

      <div className="pnl pnl-l">
        <div className="topbar">
          <div className="top-l">
            <button type="button" className="bk" onClick={handleBack}>
              <I.ArrowL /> Quay lại
            </button>
            <div className="top-t">
              <I.FileSpread /> Import câu hỏi từ file
            </div>
          </div>
          <div className="top-r">
            {phase === "results" && (
              <>
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={resetImportState}
                >
                  <I.Refresh /> Import lại
                </button>
                <button
                  type="button"
                  className="btn btn-p"
                  disabled={isSaving}
                  onClick={handleSaveToBank}
                >
                  <I.Save /> {isSaving ? "Đang lưu..." : "Lưu ngân hàng"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="scr">
          <div className="cfg">
            <div className="cfg-t">
              <I.Upload /> Import câu hỏi
            </div>
            <div className="cfg-d">
              Tải lên file chứa câu hỏi theo mẫu. Hệ thống sẽ phân tích và hiển
              thị preview bên phải.
            </div>

            <div className="tmpl">
              <div>
                <div className="tmpl-info">Tải mẫu file import</div>
                <div className="tmpl-sub">
                  Dùng đúng mẫu để import chính xác
                </div>
              </div>
              <div className="tmpl-btns">
                <button
                  type="button"
                  className="btn btn-g"
                  style={{ fontSize: 10, padding: "6px 12px" }}
                >
                  <I.Download /> .XLSX
                </button>
                <button
                  type="button"
                  className="btn btn-g"
                  style={{ fontSize: 10, padding: "6px 12px" }}
                >
                  <I.Download /> .DOCX
                </button>
              </div>
            </div>

            <input
              ref={fRef}
              type="file"
              accept={
                isBankMode
                  ? ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  : ".xlsx,.xls,.doc,.docx,.csv"
              }
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
              }}
            />

            <div
              className={`uz${file ? " has" : ""}`}
              onClick={() => !file && fRef.current?.click()}
            >
              {file ? (
                <div className="uz-fi">
                  <I.File />
                  <span className="uz-fn">{fileName}</span>
                  <span className="uz-fs">{fileSizeLabel}</span>
                  <button
                    type="button"
                    className="uz-rm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <I.X />
                  </button>
                </div>
              ) : (
                <>
                  <div className="uz-ic">
                    <I.Upload />
                  </div>
                  <div className="uz-title">Kéo thả file vào đây</div>
                  <div className="uz-t">
                    hoặc <strong>nhấn để chọn file</strong>
                  </div>
                  <div className="uz-fmts">
                    <span className="uz-fmt">XLSX</span>
                    <span className="uz-fmt">XLS</span>
                    {!isBankMode && <span className="uz-fmt">DOCX</span>}
                    {!isBankMode && <span className="uz-fmt">CSV</span>}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              className="ibtn"
              disabled={!file || phase === "loading" || isSaving}
              onClick={doImport}
            >
              <div className="shim" />
              <I.Upload /> Import câu hỏi
            </button>
          </div>

          {phase === "loading" && (
            <div className="cfg" style={{ textAlign: "center", padding: 40 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--skl)",
                  color: "var(--sk)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  animation: "pulse 1.5s ease infinite",
                }}
              >
                <I.FileSpread />
              </div>
              <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1);opacity:.7}}`}</style>
              <div
                style={{
                  fontFamily: "var(--fd)",
                  fontSize: 17,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Đang phân tích file...
              </div>
              <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 22 }}>
                Đang đọc từ "{fileName}"
              </p>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skel"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          )}

          {phase === "results" && (
            <>
              <div className="stats">
                <div className="stat" style={{ animationDelay: ".05s" }}>
                  <div className="stat-v" style={{ color: "var(--p)" }}>
                    {qs.length}
                  </div>
                  <div className="stat-l">Tổng câu hỏi</div>
                </div>
                <div className="stat" style={{ animationDelay: ".1s" }}>
                  <div className="stat-v" style={{ color: "var(--gn)" }}>
                    {qs.length - errs}
                  </div>
                  <div className="stat-l">Hợp lệ</div>
                </div>
                <div className="stat" style={{ animationDelay: ".15s" }}>
                  <div className="stat-v" style={{ color: "var(--or)" }}>
                    {errs}
                  </div>
                  <div className="stat-l">Cần kiểm tra</div>
                </div>
              </div>

              {errs > 0 && (
                <div className="warn">
                  <I.Alert /> Có {errs} câu cần kiểm tra. Bấm sửa ở preview bên
                  phải.
                </div>
              )}

              <div className="tbd">
                <div className="tbd-t">Phân bố loại câu hỏi</div>
                {[
                  {
                    t: "MULTIPLE_CHOICE",
                    l: "Trắc nghiệm",
                    c: "mc",
                    clr: "var(--p)",
                  },
                  {
                    t: "TRUE_FALSE",
                    l: "Đúng/Sai",
                    c: "tf",
                    clr: "var(--gn)",
                  },
                  {
                    t: "FILL_IN_BLANK",
                    l: "Điền khuyết",
                    c: "fb",
                    clr: "var(--or)",
                  },
                  { t: "ESSAY", l: "Tự luận", c: "es", clr: "var(--pu)" },
                ].map((x) => {
                  const cnt = cntT(x.t);
                  return (
                    cnt > 0 && (
                      <div key={x.t} className="tb-r">
                        <span className={`tb-b ${x.c}`}>{x.l}</span>
                        <div className="tb-bar">
                          <div
                            className="tb-fill"
                            style={{
                              width: `${(cnt / maxT) * 100}%`,
                              background: x.clr,
                            }}
                          />
                        </div>
                        <span className="tb-cnt">{cnt}</span>
                      </div>
                    )
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pnl pnl-r">
        <div className="pvh">
          <div className="pv-t">
            <I.Eye /> Preview câu hỏi{" "}
            {qs.length > 0 && <span className="pv-c">{qs.length}</span>}
          </div>
          {qs.length > 0 && (
            <button
              type="button"
              className="btn btn-g"
              style={{ fontSize: 10, padding: "5px 12px" }}
            >
              <I.Layers /> Chọn tất cả
            </button>
          )}
        </div>

        {qs.length === 0 ? (
          <div className="emp">
            <div className="emp-ic">
              <I.Eye />
            </div>
            <div className="emp-t">
              {phase === "loading" ? "Đang xử lý..." : "Chưa có câu hỏi"}
            </div>
            <div className="emp-d">
              {phase === "loading"
                ? "Hệ thống đang phân tích file của bạn..."
                : "Import file ở bên trái để xem preview câu hỏi tại đây."}
            </div>
          </div>
        ) : (
          <div className="scr">
            {vis.map((q, i) => {
              const num = (pg - 1) * PP + i + 1;
              const isEd = editId === q.id;
              const d = isEd ? editData : q;
              return (
                <div
                  key={q.id}
                  className={`qc${isEd ? " editing" : ""}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="qc-m">
                    <div className="qc-top">
                      <div className="qc-n">{num}</div>
                      <div className="qc-body">
                        <span className={`qc-tb ${TC[d.type]}`}>
                          {TL[d.type]}
                        </span>
                        {isEd ? (
                          <textarea
                            className="ed-pr"
                            value={d.prompt}
                            onChange={(e) =>
                              setEditData({ ...d, prompt: e.target.value })
                            }
                          />
                        ) : (
                          <div className="qc-pr">{d.prompt}</div>
                        )}
                      </div>
                    </div>

                    {d.type === "MULTIPLE_CHOICE" &&
                      d.opts &&
                      (isEd ? (
                        <div style={{ marginLeft: 36 }}>
                          <div className="ed-lbl">Đáp án (bấm ô chọn đúng)</div>
                          {d.opts.map((o, oi) => (
                            <div key={oi} className="ed-or">
                              <div
                                className={`ed-radio${d.cor === oi ? " on" : ""}`}
                                onClick={() => setEditData({ ...d, cor: oi })}
                              >
                                {d.cor === oi && <I.Check />}
                              </div>
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 3,
                                  background: "var(--bl)",
                                  fontSize: 8,
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
                                className="ed-oi"
                                value={o}
                                onChange={(e) => {
                                  const nw = [...d.opts];
                                  nw[oi] = e.target.value;
                                  setEditData({ ...d, opts: nw });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="qc-opts">
                          {d.opts.map((o, oi) => (
                            <div
                              key={oi}
                              className={`qc-opt${oi === d.cor ? " ok" : ""}`}
                            >
                              <div className="qc-ol">{LT[oi]}</div>
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

                    {d.type === "FILL_IN_BLANK" &&
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
                      <div className="qc-fb" style={{ fontStyle: "italic" }}>
                        Tự luận - chấm thủ công
                      </div>
                    )}
                  </div>

                  <div className="qc-bar">
                    <div className="qc-bar-l">
                      {isEd ? (
                        <>
                          <button
                            type="button"
                            className="ab sv"
                            onClick={saveEdit}
                          >
                            <I.Check /> Lưu
                          </button>
                          <button
                            type="button"
                            className="ab"
                            onClick={cancelEdit}
                          >
                            <I.Undo /> Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="ab ed"
                            onClick={() => startEdit(q)}
                          >
                            <I.Edit /> Sửa
                          </button>
                          <button type="button" className="ab">
                            <I.Copy /> Nhân bản
                          </button>
                        </>
                      )}
                    </div>
                    <div className="qc-bar-r">
                      <button
                        type="button"
                        className="ab dng"
                        onClick={() => deleteQ(q.id)}
                      >
                        <I.Trash /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPg > 1 && (
              <div className="pag">
                <button
                  type="button"
                  className="pg"
                  disabled={pg <= 1}
                  onClick={() => setPg(pg - 1)}
                >
                  <I.ChevL />
                </button>
                {Array.from({ length: totalPg }, (_, i) => i + 1).map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`pg${p === pg ? " on" : ""}`}
                    onClick={() => setPg(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="pg"
                  disabled={pg >= totalPg}
                  onClick={() => setPg(pg + 1)}
                >
                  <I.ChevR />
                </button>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--t3)",
                    fontWeight: 600,
                    marginLeft: 5,
                  }}
                >
                  {qs.length} câu
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="toast">
          <I.Check />
          {toast}
        </div>
      )}
    </div>
  );
};

export default ImportAssignmentFilePage;
