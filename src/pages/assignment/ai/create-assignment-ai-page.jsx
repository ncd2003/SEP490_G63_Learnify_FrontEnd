import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATH_TEACHER } from "@/routes/paths";

const COG = [
  { v: "REMEMBER", l: "Nhớ", d: "Nhận biết, ghi nhớ", c: "#10B981" },
  { v: "UNDERSTAND", l: "Hiểu", d: "Giải thích, diễn giải", c: "#0EA5E9" },
  { v: "APPLY", l: "Vận dụng", d: "Áp dụng tình huống", c: "#2563EB" },
  { v: "ANALYZE", l: "Phân tích", d: "So sánh, phân biệt", c: "#8B5CF6" },
  { v: "EVALUATE", l: "Đánh giá", d: "Phán xét, nhận định", c: "#F59E0B" },
  { v: "CREATE", l: "Sáng tạo", d: "Tạo mới, thiết kế", c: "#EF4444" },
];
const QT = [
  { v: "MULTIPLE_CHOICE", l: "Trắc nghiệm", ic: "MC" },
  { v: "TRUE_FALSE", l: "Đúng / Sai", ic: "TF" },
  { v: "FILL_IN_BLANK", l: "Điền khuyết", ic: "FB" },
  { v: "ESSAY", l: "Tự luận", ic: "ES" },
];
const mkQ = (n) => {
  const pool = [
    {
      type: "MULTIPLE_CHOICE",
      prompt:
        "Trong không gian Oxyz, mặt phẳng đi qua A(1;2;3) có vectơ pháp tuyến n⃗=(2;-1;3) có phương trình là:",
      opts: ["2x-y+3z-9=0", "2x+y+3z-9=0", "2x-y-3z+9=0", "x+y-3z=0"],
      cor: 0,
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Khoảng cách từ M(1;0;-1) đến mp (P): x+2y-2z+3=0 bằng:",
      opts: ["2/3", "2", "4/3", "8/3"],
      cor: 1,
    },
    {
      type: "TRUE_FALSE",
      prompt: "Hai mp x+2y-z+5=0 và 2x+4y-2z+1=0 song song với nhau.",
      cor: true,
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Cho mặt cầu (S): (x-1)²+(y+2)²+(z-3)²=16. Bán kính bằng:",
      opts: ["2", "4", "8", "16"],
      cor: 1,
    },
    {
      type: "FILL_IN_BLANK",
      prompt: "Góc giữa (P): x+y+z-1=0 và (Q): x+y-1=0 bằng ___ độ.",
      ans: "35",
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Thể tích khối chóp S.ABC có SA⊥(ABC), SA=3, △ABC đều cạnh 4:",
      opts: ["4√3", "8√3", "12√3", "6√3"],
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
        "Cho hình chóp S.ABCD, đáy hình vuông cạnh a, SA⊥(ABCD), SA=a√2.\na) Tính thể tích.\nb) Tính khoảng cách từ A đến (SBC).",
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Phương trình mp qua A(1;0;0), B(0;2;0), C(0;0;3):",
      opts: ["6x+3y+2z-6=0", "x+2y+3z-1=0", "6x+3y+2z+6=0", "2x+3y+6z=6"],
      cor: 0,
    },
    {
      type: "FILL_IN_BLANK",
      prompt: "Mặt cầu x²+y²+z²-4x+6y-2z+5=0 có R = ___",
      ans: "3",
    },
    {
      type: "MULTIPLE_CHOICE",
      prompt: "Khoảng cách giữa 2 mp song song 2x-y+2z-1=0 và 2x-y+2z+5=0:",
      opts: ["2", "6/3", "4/3", "6"],
      cor: 0,
    },
    {
      type: "TRUE_FALSE",
      prompt: "Hai mp có VTPT cùng phương thì song song hoặc trùng nhau.",
      cor: true,
    },
  ];
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    ...pool[i % pool.length],
  }));
};

const I = {
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
  Upload: () => (
    <svg
      width="16"
      height="16"
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
  Bot: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <line x1="12" y1="7" x2="12" y2="11" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
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
  Zap: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
};

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap');:root{--p:#2563EB;--pd:#1D4ED8;--pl:#EFF6FF;--plr:#F8FAFF;--pg:rgba(37,99,235,.10);--ps:rgba(37,99,235,.22);--gr:linear-gradient(135deg,#3B82F6,#2563EB 50%,#1D4ED8);--bg:#F7F8FC;--card:#FFF;--inp:#F5F7FB;--hov:#EDF2FF;--t:#1E293B;--t2:#475569;--t3:#94A3B8;--inv:#FFF;--gn:#10B981;--gnl:#ECFDF5;--or:#F59E0B;--orl:#FFFBEB;--rd:#EF4444;--rdl:#FEF2F2;--pu:#8B5CF6;--pul:#F5F3FF;--b:#E2E8F0;--bl:#F1F5F9;--ss:0 1px 3px rgba(30,41,59,.04);--sm:0 4px 14px rgba(30,41,59,.07);--rs:10px;--rm:12px;--rl:16px;--rxl:20px;--f:'Be Vietnam Pro',sans-serif;--fd:'Lora',serif;--fm:'JetBrains Mono',monospace;--e:cubic-bezier(.4,0,.2,1)}*{box-sizing:border-box;margin:0;padding:0}body{font-family:var(--f);background:var(--bg);color:var(--t);-webkit-font-smoothing:antialiased}.app{display:flex;height:100vh;overflow:hidden}.left{flex:1;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--b)}.right{width:380px;display:flex;flex-direction:column;background:var(--card);flex-shrink:0}.top{height:54px;background:var(--card);border-bottom:1px solid var(--b);display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex-shrink:0}.top-l{display:flex;align-items:center;gap:12px}.bk{display:flex;align-items:center;gap:5px;padding:5px 10px;border:1.5px solid var(--b);border-radius:var(--rs);background:var(--card);font-size:11px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;transition:all .15s var(--e)}.bk:hover{border-color:var(--p);color:var(--p)}.top-t{font-family:var(--fd);font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px}.top-t svg{color:var(--p)}.top-r{display:flex;gap:6px}.btn{display:inline-flex;align-items:center;gap:5px;padding:7px 16px;border-radius:var(--rm);font-size:11px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;transition:all .2s var(--e)}.btn-p{background:var(--gr);color:var(--inv);box-shadow:0 2px 10px var(--ps)}.btn-p:hover{transform:translateY(-1px)}.btn-g{background:var(--card);color:var(--t2);border:1.5px solid var(--b)}.btn-g:hover{border-color:var(--p);color:var(--p);background:var(--hov)}.scroll{flex:1;overflow-y:auto;padding:22px;background:var(--bg)}.cfg{background:var(--card);border:1px solid var(--b);border-radius:var(--rxl);padding:24px;box-shadow:var(--ss);margin-bottom:18px;animation:fu .35s ease both}@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.cfg-t{font-family:var(--fd);font-size:17px;font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:7px}.cfg-d{font-size:12px;color:var(--t3);margin-bottom:18px;line-height:1.5}.fl{display:block;font-size:11px;font-weight:700;color:var(--t2);margin-bottom:6px}.fl .rq{color:var(--rd)}.fg{margin-bottom:16px}.cg{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.cp{padding:10px 12px;border:1.5px solid var(--b);border-radius:var(--rm);cursor:pointer;transition:all .2s var(--e);background:var(--card);text-align:left}.cp:hover{border-color:var(--p);background:var(--hov)}.cp.on{border-color:var(--p);background:var(--pl);box-shadow:0 0 0 3px var(--pg)}.cp-n{font-size:12px;font-weight:700;display:flex;align-items:center;gap:5px;margin-bottom:1px}.cp-dot{width:7px;height:7px;border-radius:50%}.cp-d{font-size:9px;color:var(--t3);font-weight:500}.qr{display:flex;align-items:center;gap:10px}.qb{width:34px;height:34px;border-radius:var(--rs);border:1.5px solid var(--b);background:var(--card);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;transition:all .15s var(--e)}.qb:hover{border-color:var(--p);color:var(--p)}.qv{font-size:22px;font-weight:800;font-family:var(--fm);min-width:36px;text-align:center}.qtg{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.qtp{padding:9px;border:1.5px solid var(--b);border-radius:var(--rm);cursor:pointer;transition:all .2s var(--e);background:var(--card);text-align:center}.qtp:hover{border-color:var(--p);background:var(--hov)}.qtp.on{border-color:var(--p);background:var(--pl);box-shadow:0 0 0 3px var(--pg)}.qti{font-size:10px;font-weight:800;color:var(--t3);background:var(--bl);width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 5px}.qtp.on .qti{background:var(--p);color:var(--inv)}.qtl{font-size:10px;font-weight:700;color:var(--t2)}.ta{width:100%;padding:9px 12px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp);resize:vertical;min-height:60px;line-height:1.6;transition:all .2s var(--e)}.ta:focus{outline:none;border-color:var(--p);background:var(--card);box-shadow:0 0 0 3px var(--pg)}.uz{border:2px dashed var(--b);border-radius:var(--rm);padding:24px;text-align:center;cursor:pointer;transition:all .2s var(--e);background:var(--inp)}.uz:hover{border-color:var(--p);background:var(--hov)}.uz.has{border-color:var(--gn);background:var(--gnl);border-style:solid}.uz-fi{display:flex;align-items:center;gap:8px;justify-content:center}.uz-fn{font-size:13px;font-weight:600;color:var(--gn)}.uz-rm{background:none;border:none;color:var(--rd);cursor:pointer}.uz-t{font-size:11px;color:var(--t3);font-weight:500}.uz-t strong{color:var(--p);font-weight:700}.st{display:flex;margin-bottom:12px;background:var(--inp);border-radius:var(--rm);padding:3px;border:1px solid var(--b)}.stb{flex:1;padding:7px;border-radius:var(--rs);font-size:11px;font-weight:700;font-family:var(--f);color:var(--t3);cursor:pointer;border:none;background:none;text-align:center;transition:all .15s var(--e)}.stb.on{background:var(--card);color:var(--p);box-shadow:var(--ss)}.gbtn{width:100%;padding:13px;border:none;border-radius:var(--rm);background:var(--gr);color:var(--inv);font-size:13px;font-weight:700;font-family:var(--f);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .25s var(--e);box-shadow:0 4px 16px var(--ps);overflow:hidden;position:relative}.gbtn:hover{transform:translateY(-2px)}.gbtn:disabled{opacity:.5;cursor:not-allowed;transform:none}.gbtn .shim{position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);animation:sh 2s infinite}@keyframes sh{to{left:100%}}.qc{background:var(--card);border:1.5px solid var(--b);border-radius:var(--rl);margin-bottom:12px;transition:all .2s var(--e);animation:fu .25s ease both;overflow:hidden}.qc:hover{border-color:var(--p);box-shadow:var(--sm)}.qc.editing{border-color:var(--or);box-shadow:0 0 0 3px rgba(245,158,11,.1),var(--sm)}.qc-main{padding:18px 20px}.qc-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}.qc-n{min-width:28px;height:28px;border-radius:50%;background:var(--p);color:var(--inv);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}.qc.editing .qc-n{background:var(--or)}.qc-body{flex:1}.qc-tb{padding:2px 7px;border-radius:10px;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;display:inline-block;margin-bottom:4px}.qc-tb.mc{background:var(--pl);color:var(--p)}.qc-tb.tf{background:var(--gnl);color:var(--gn)}.qc-tb.fb{background:var(--orl);color:var(--or)}.qc-tb.es{background:var(--pul);color:var(--pu)}.qc-pr{font-size:13px;font-weight:600;line-height:1.65;white-space:pre-line}.qc-opts{margin-top:8px;display:flex;flex-direction:column;gap:5px;margin-left:38px}.qc-opt{display:flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid var(--bl);border-radius:var(--rs);font-size:12px;color:var(--t2);font-weight:500;transition:all .15s var(--e)}.qc-opt.ok{border-color:var(--gn);background:var(--gnl);color:var(--gn);font-weight:600}.qc-ol{width:20px;height:20px;border-radius:50%;border:1.5px solid var(--b);font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;color:var(--t3);flex-shrink:0}.qc-opt.ok .qc-ol{border-color:var(--gn);background:var(--gn);color:var(--inv)}.qc-tf{margin-top:8px;margin-left:38px;font-size:12px;font-weight:600}.ctag{color:var(--gn);background:var(--gnl);padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700}.qc-fb{margin-top:6px;margin-left:38px;font-size:11px;color:var(--t3);font-weight:600}.qc-fb span{color:var(--p);font-weight:700;background:var(--pl);padding:1px 7px;border-radius:5px;margin-left:3px}.qc-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 20px;border-top:1px solid var(--bl);background:var(--bg)}.qc-bar-l,.qc-bar-r{display:flex;gap:4px}.ab{display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:var(--rs);border:none;background:none;font-size:10px;font-weight:600;font-family:var(--f);color:var(--t3);cursor:pointer;transition:all .15s var(--e)}.ab:hover{background:var(--hov);color:var(--p)}.ab.ed{color:var(--or)}.ab.ed:hover{background:var(--orl)}.ab.dng:hover{background:var(--rdl);color:var(--rd)}.ab.sv{color:var(--gn)}.ab.sv:hover{background:var(--gnl)}.ed-prompt{width:100%;padding:8px 12px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:13px;font-family:var(--f);font-weight:600;color:var(--t);background:#FFFDF7;min-height:48px;resize:vertical;line-height:1.6}.ed-prompt:focus{outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.1)}.ed-opt-row{display:flex;align-items:center;gap:7px;margin-bottom:5px}.ed-opt-input{flex:1;padding:7px 10px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp)}.ed-opt-input:focus{outline:none;border-color:var(--or)}.ed-opt-radio{width:20px;height:20px;border-radius:50%;border:2px solid var(--b);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s var(--e)}.ed-opt-radio.on{border-color:var(--gn);background:var(--gn);color:var(--inv)}.ed-opt-radio:hover{border-color:var(--gn)}.ed-lbl{font-size:10px;font-weight:700;color:var(--t3);margin:8px 0 5px 38px;text-transform:uppercase;letter-spacing:.04em}.ed-tf{display:flex;gap:8px;margin-left:38px}.ed-tfb{flex:1;padding:9px;border:1.5px solid var(--b);border-radius:var(--rs);font-size:12px;font-weight:700;text-align:center;cursor:pointer;background:var(--card);color:var(--t3);font-family:var(--f);transition:all .15s var(--e)}.ed-tfb:hover{border-color:var(--gn)}.ed-tfb.on{border-color:var(--gn);background:var(--gnl);color:var(--gn)}.ed-ans{margin-left:38px;width:calc(100% - 38px);padding:7px 10px;border:1.5px solid var(--or);border-radius:var(--rs);font-size:12px;font-family:var(--fm);color:var(--t);background:#FFFDF7}.ed-ans:focus{outline:none;box-shadow:0 0 0 3px rgba(245,158,11,.1)}.pag{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:14px}.pg{width:32px;height:32px;border-radius:var(--rs);border:1.5px solid var(--b);background:var(--card);font-size:11px;font-weight:700;font-family:var(--f);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--e)}.pg:hover{border-color:var(--p);color:var(--p)}.pg.on{background:var(--p);color:var(--inv);border-color:var(--p);box-shadow:0 2px 8px var(--ps)}.pg:disabled{opacity:.3;cursor:not-allowed}.rh{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.rt{font-family:var(--fd);font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px}.rc{font-size:11px;font-weight:700;color:var(--p);background:var(--pl);padding:2px 9px;border-radius:16px}.skel{background:linear-gradient(90deg,var(--bl) 25%,var(--bg) 50%,var(--bl) 75%);background-size:200% 100%;animation:skl 1.5s infinite;border-radius:var(--rm);height:70px;margin-bottom:10px}@keyframes skl{to{background-position:-200% 0}}.ch-h{height:54px;border-bottom:1px solid var(--b);display:flex;align-items:center;padding:0 18px;gap:9px;flex-shrink:0;background:var(--plr)}.ch-ic{width:30px;height:30px;border-radius:50%;background:var(--gr);color:var(--inv);display:flex;align-items:center;justify-content:center}.ch-hi h3{font-size:13px;font-weight:700}.ch-hi p{font-size:9px;color:var(--t3)}.ch-msgs{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:12px;background:var(--bg)}.ch-m{display:flex;gap:8px;max-width:90%;animation:fu .2s ease both}.ch-m.usr{align-self:flex-end;flex-direction:row-reverse}.ch-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}.ch-av.bt{background:var(--gr);color:var(--inv)}.ch-av.hm{background:var(--b);color:var(--t2)}.ch-bb{padding:9px 12px;border-radius:var(--rm);font-size:12px;line-height:1.6;font-weight:500}.ch-m.bot .ch-bb{background:var(--card);border:1px solid var(--b);border-top-left-radius:3px}.ch-m.usr .ch-bb{background:var(--p);color:var(--inv);border-top-right-radius:3px}.ch-tm{font-size:8px;color:var(--t3);margin-top:3px}.ch-m.usr .ch-tm{text-align:right}.ch-sug{display:flex;flex-wrap:wrap;gap:5px;padding:0 16px 8px}.ch-sg{padding:5px 10px;border:1.5px solid var(--b);border-radius:16px;font-size:10px;font-weight:600;font-family:var(--f);color:var(--t2);cursor:pointer;background:var(--card);transition:all .15s var(--e)}.ch-sg:hover{border-color:var(--p);color:var(--p);background:var(--hov)}.ch-inp{padding:10px 14px;border-top:1px solid var(--b);background:var(--card);flex-shrink:0}.ch-ir{display:flex;gap:6px;align-items:flex-end}.ch-ta{flex:1;padding:8px 12px;border:1.5px solid var(--b);border-radius:var(--rm);font-size:12px;font-family:var(--f);color:var(--t);background:var(--inp);resize:none;min-height:36px;max-height:80px;line-height:1.5}.ch-ta:focus{outline:none;border-color:var(--p);box-shadow:0 0 0 3px var(--pg)}.ch-sd{width:36px;height:36px;border-radius:var(--rm);border:none;background:var(--gr);color:var(--inv);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px var(--ps);transition:all .2s var(--e)}.ch-sd:hover{transform:translateY(-1px)}.ch-sd:disabled{opacity:.4;cursor:not-allowed;transform:none}.ch-ht{font-size:9px;color:var(--t3);margin-top:4px;text-align:center}.typing{display:flex;gap:3px;padding:6px 12px}.td{width:5px;height:5px;border-radius:50%;background:var(--t3);animation:tb 1.4s infinite both}.td:nth-child(2){animation-delay:.15s}.td:nth-child(3){animation-delay:.3s}@keyframes tb{0%,80%,100%{transform:scale(0);opacity:.4}40%{transform:scale(1);opacity:1}}@media(max-width:900px){.right{display:none}.left{border:none}}`;

const PP = 5,
  LT = "ABCDEFGH",
  TC = {
    MULTIPLE_CHOICE: "mc",
    TRUE_FALSE: "tf",
    FILL_IN_BLANK: "fb",
    ESSAY: "es",
  },
  TL = {
    MULTIPLE_CHOICE: "Trắc nghiệm",
    TRUE_FALSE: "Đúng/Sai",
    FILL_IN_BLANK: "Điền khuyết",
    ESSAY: "Tự luận",
  };

const CreateAssignmentAiPage = () => {
  const navigate = useNavigate();
  const [cog, setCog] = useState("");
  const [qty, setQty] = useState(5);
  const [qts, setQts] = useState(["MULTIPLE_CHOICE"]);
  const [addP, setAddP] = useState("");
  const [srcT, setSrcT] = useState("file");
  const [aiF, setAiF] = useState("");
  const [raw, setRaw] = useState("");
  const [phase, setPhase] = useState("config");
  const [qs, setQs] = useState([]);
  const [pg, setPg] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [msgs, setMsgs] = useState([
    {
      role: "bot",
      text: "Chào thầy/cô! Tôi là trợ lý AI Learnify. Sau khi tạo câu hỏi, thầy/cô có thể nhờ tôi chỉnh sửa hoặc bấm ✏️ để sửa thủ công.",
      time: "Bây giờ",
    },
  ]);
  const [chatIn, setChatIn] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEnd = useRef(null);
  const fRef = useRef(null);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);
  const togQT = (v) =>
    setQts((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  const canGen = cog && qty >= 1 && qts.length > 0 && (aiF || raw.trim());
  const doGen = () => {
    setPhase("loading");
    setTimeout(() => {
      const r = mkQ(qty);
      setQs(r);
      setPhase("results");
      setPg(1);
      setEditId(null);
      setMsgs((p) => [
        ...p,
        {
          role: "bot",
          text: `Đã tạo ${r.length} câu! Bấm ✏️ Sửa để chỉnh thủ công, hoặc nhắn cho tôi:\n• \"Sửa câu 3 cho dễ hơn\"\n• \"Thêm 2 câu tự luận\"`,
          time: "Vừa xong",
        },
      ]);
    }, 2200);
  };
  const startEdit = (q) => {
    setEditId(q.id);
    setEditData({ ...q, opts: q.opts ? [...q.opts] : undefined });
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditData(null);
  };
  const saveEdit = () => {
    setQs((p) => p.map((q) => (q.id === editId ? { ...editData } : q)));
    cancelEdit();
  };
  const deleteQ = (id) => {
    setQs((p) => p.filter((q) => q.id !== id));
    if (editId === id) cancelEdit();
  };
  const sendChat = () => {
    if (!chatIn.trim()) return;
    setMsgs((p) => [
      ...p,
      { role: "user", text: chatIn.trim(), time: "Vừa xong" },
    ]);
    const m = chatIn;
    setChatIn("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      let r = "Đã ghi nhận! ";
      if (m.includes("sửa") || m.includes("đổi")) r += "Câu hỏi đã cập nhật.";
      else if (m.includes("thêm")) r += "Đã thêm câu hỏi mới.";
      else if (m.includes("xóa")) r += "Đã xóa.";
      else r += "Mô tả cụ thể câu cần sửa nhé!";
      setMsgs((p) => [...p, { role: "bot", text: r, time: "Vừa xong" }]);
    }, 1400);
  };
  const totalPg = Math.ceil(qs.length / PP);
  const vis = qs.slice((pg - 1) * PP, (pg - 1) * PP + PP);
  const sugs =
    phase === "results"
      ? [
          "Sửa câu 1 cho khó hơn",
          "Thêm 3 câu nữa",
          "Đổi câu 3 sang tự luận",
          "Xóa câu cuối",
        ]
      : ["Gợi ý chủ đề", "Giải thích cách dùng"];
  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="left">
        <div className="top">
          <div className="top-l">
            <button
              type="button"
              className="bk"
              onClick={() => navigate(PATH_TEACHER.assignmentCreateMethod)}
            >
              <I.ArrowL /> Quay lại
            </button>
            <div className="top-t">
              <I.Sparkles /> Tạo câu hỏi với AI
            </div>
          </div>
          <div className="top-r">
            {phase === "results" && (
              <>
                <button
                  className="btn btn-g"
                  onClick={() => {
                    setPhase("config");
                    setPg(1);
                  }}
                >
                  <I.Refresh /> Tạo lại
                </button>
                <button className="btn btn-p">
                  <I.Save /> Lưu vào ngân hàng
                </button>
              </>
            )}
          </div>
        </div>
        <div className="scroll">
          <div className="cfg">
            <div className="cfg-t">
              <I.Zap /> Cấu hình sinh câu hỏi
            </div>
            <div className="cfg-d">
              Thiết lập thông số để AI sinh câu hỏi phù hợp.
            </div>
            <div className="fg">
              <label className="fl">
                Mức độ nhận thức <span className="rq">*</span>
              </label>
              <div className="cg">
                {COG.map((c) => (
                  <div
                    key={c.v}
                    className={`cp${cog === c.v ? " on" : ""}`}
                    onClick={() => setCog(c.v)}
                  >
                    <div className="cp-n">
                      <div className="cp-dot" style={{ background: c.c }} />
                      {c.l}
                    </div>
                    <div className="cp-d">{c.d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="fg">
              <label className="fl">
                Số lượng <span className="rq">*</span>
              </label>
              <div className="qr">
                <button
                  className="qb"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  −
                </button>
                <div className="qv">{qty}</div>
                <button
                  className="qb"
                  onClick={() => setQty(Math.min(50, qty + 1))}
                >
                  +
                </button>
                <span style={{ fontSize: 11, color: "var(--t3)" }}>câu</span>
              </div>
            </div>
            <div className="fg">
              <label className="fl">
                Loại câu hỏi <span className="rq">*</span>
              </label>
              <div className="qtg">
                {QT.map((q) => (
                  <div
                    key={q.v}
                    className={`qtp${qts.includes(q.v) ? " on" : ""}`}
                    onClick={() => togQT(q.v)}
                  >
                    <div className="qti">{q.ic}</div>
                    <div className="qtl">{q.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="fg">
              <label className="fl">Tài liệu nguồn</label>
              <div className="st">
                <button
                  className={`stb${srcT === "file" ? " on" : ""}`}
                  onClick={() => setSrcT("file")}
                >
                  📎 Upload file
                </button>
                <button
                  className={`stb${srcT === "text" ? " on" : ""}`}
                  onClick={() => setSrcT("text")}
                >
                  📝 Nhập văn bản
                </button>
              </div>
              {srcT === "file" ? (
                <>
                  <input
                    ref={fRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setAiF(e.target.files[0].name);
                    }}
                  />
                  <div
                    className={`uz${aiF ? " has" : ""}`}
                    onClick={() => !aiF && fRef.current?.click()}
                  >
                    {aiF ? (
                      <div className="uz-fi">
                        <I.File />
                        <span className="uz-fn">{aiF}</span>
                        <button
                          className="uz-rm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAiF("");
                          }}
                        >
                          <I.X />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: "var(--t3)", marginBottom: 6 }}>
                          <I.Upload />
                        </div>
                        <div className="uz-t">
                          Kéo thả hoặc <strong>chọn file</strong>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <textarea
                  className="ta"
                  placeholder="Dán nội dung bài học..."
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  style={{ minHeight: 90 }}
                />
              )}
            </div>
            <div className="fg">
              <label className="fl">Yêu cầu thêm</label>
              <textarea
                className="ta"
                placeholder='VD: "Tập trung hình học không gian"...'
                value={addP}
                onChange={(e) => setAddP(e.target.value)}
              />
            </div>
            <button className="gbtn" disabled={!canGen} onClick={doGen}>
              <div className="shim" />
              <I.Sparkles /> Tạo câu hỏi với AI
            </button>
            {!canGen && (
              <p
                style={{
                  fontSize: 10,
                  color: "var(--t3)",
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Chọn mức độ, loại câu hỏi và tài liệu
              </p>
            )}
          </div>
          {phase === "loading" && (
            <div className="cfg" style={{ textAlign: "center", padding: 36 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--pl)",
                  color: "var(--p)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  animation: "pulse 1.5s ease infinite",
                }}
              >
                <I.Sparkles />
              </div>
              <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1);opacity:.7}}`}</style>
              <div
                style={{
                  fontFamily: "var(--fd)",
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 5,
                }}
              >
                AI đang tạo...
              </div>
              <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 20 }}>
                Đang sinh {qty} câu hỏi
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
              <div className="rh">
                <div className="rt">
                  <I.Sparkles /> Câu hỏi đã tạo{" "}
                  <span className="rc">{qs.length}</span>
                </div>
              </div>
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
                    <div className="qc-main">
                      <div className="qc-top">
                        <div className="qc-n">{num}</div>
                        <div className="qc-body">
                          <span className={`qc-tb ${TC[d.type]}`}>
                            {TL[d.type]}
                          </span>
                          {isEd ? (
                            <textarea
                              className="ed-prompt"
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
                          <div style={{ marginLeft: 38 }}>
                            <div className="ed-lbl">
                              Đáp án (bấm ○ chọn đúng)
                            </div>
                            {d.opts.map((o, oi) => (
                              <div key={oi} className="ed-opt-row">
                                <div
                                  className={`ed-opt-radio${d.cor === oi ? " on" : ""}`}
                                  onClick={() => setEditData({ ...d, cor: oi })}
                                >
                                  {d.cor === oi && <I.Check />}
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
                                onClick={() =>
                                  setEditData({ ...d, cor: false })
                                }
                              >
                                Sai
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="qc-tf">
                            Đáp án:{" "}
                            <span className="ctag">
                              {d.cor ? "Đúng" : "Sai"}
                            </span>
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
                          Tự luận — chấm thủ công
                        </div>
                      )}
                    </div>
                    <div className="qc-bar">
                      <div className="qc-bar-l">
                        {isEd ? (
                          <>
                            <button className="ab sv" onClick={saveEdit}>
                              <I.Check /> Lưu
                            </button>
                            <button className="ab" onClick={cancelEdit}>
                              <I.Undo /> Hủy
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="ab ed"
                              onClick={() => startEdit(q)}
                            >
                              <I.Edit /> Sửa
                            </button>
                            <button className="ab">
                              <I.Copy /> Nhân bản
                            </button>
                          </>
                        )}
                      </div>
                      <div className="qc-bar-r">
                        <button
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
                    className="pg"
                    disabled={pg <= 1}
                    onClick={() => setPg(pg - 1)}
                  >
                    <I.ChevL />
                  </button>
                  {Array.from({ length: totalPg }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`pg${p === pg ? " on" : ""}`}
                      onClick={() => setPg(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
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
                      marginLeft: 6,
                    }}
                  >
                    {qs.length} câu
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="right">
        <div className="ch-h">
          <div className="ch-ic">
            <I.Bot />
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
              <div className={`ch-av ${m.role === "user" ? "hm" : "bt"}`}>
                {m.role === "user" ? <I.User /> : <I.Bot />}
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
              <div className="ch-av bt">
                <I.Bot />
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
          <div ref={chatEnd} />
        </div>
        <div className="ch-sug">
          {sugs.map((s, i) => (
            <button key={i} className="ch-sg" onClick={() => setChatIn(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="ch-inp">
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
              className="ch-sd"
              onClick={sendChat}
              disabled={!chatIn.trim() || typing}
            >
              <I.Send />
            </button>
          </div>
          <div className="ch-ht">Enter gửi · Shift+Enter xuống dòng</div>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignmentAiPage;
