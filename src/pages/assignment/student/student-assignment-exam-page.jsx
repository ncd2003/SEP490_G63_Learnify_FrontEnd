import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_STUDENT } from "@/routes/paths";

const I = {
  Clock: () => (
    <svg
      width="16"
      height="16"
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
  Flag: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  FlagFill: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" strokeWidth="2" />
    </svg>
  ),
  Check: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevL: () => (
    <svg
      width="16"
      height="16"
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
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="9 18 15 12 9 6" />
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
  Warning: () => (
    <svg
      width="20"
      height="20"
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
  Lock: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
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
  CloudSave: () => (
    <svg
      width="14"
      height="14"
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
  Trophy: () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  ),
  Refresh: () => (
    <svg
      width="16"
      height="16"
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
  Layers: () => (
    <svg
      width="18"
      height="18"
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
  PenLine: () => (
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
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --primary: #2563EB;
  --primary-dark: #1D4ED8;
  --primary-darker: #1E40AF;
  --primary-light: #EFF6FF;
  --primary-lighter: #F8FAFF;
  --primary-glow: rgba(37, 99, 235, 0.12);
  --primary-shadow: rgba(37, 99, 235, 0.25);
  --primary-mid: #3B82F6;
  --gradient-btn: linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%);
  --bg: #F7F8FC;
  --bg-card: #FFFFFF;
  --bg-sidebar: #FAFBFE;
  --bg-input: #F5F7FB;
  --bg-hover: #EDF2FF;
  --text: #1E293B;
  --text-2: #475569;
  --text-3: #94A3B8;
  --text-inv: #FFFFFF;
  --done: #10B981;
  --done-l: #ECFDF5;
  --orange: #F59E0B;
  --orange-l: #FFFBEB;
  --red: #EF4444;
  --red-l: #FEF2F2;
  --purple: #8B5CF6;
  --purple-l: #F5F3FF;
  --border: #E2E8F0;
  --border-l: #F1F5F9;
  --shadow-s: 0 1px 3px rgba(30,41,59,0.04), 0 1px 2px rgba(30,41,59,0.03);
  --shadow-m: 0 4px 12px rgba(30,41,59,0.06), 0 2px 4px rgba(30,41,59,0.03);
  --shadow-l: 0 12px 36px rgba(30,41,59,0.1), 0 4px 12px rgba(30,41,59,0.04);
  --r-s: 10px;
  --r-m: 12px;
  --r-l: 16px;
  --r-xl: 20px;
  --font: 'Be Vietnam Pro', sans-serif;
  --font-d: 'Lora', serif;
  --font-mono: 'JetBrains Mono', monospace;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
.exam-app { display: flex; min-height: 100vh; }
.sidebar {
  width: 286px;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 50;
}
.sidebar-header {
  padding: 22px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--gradient-btn);
  color: var(--text-inv);
  position: relative;
  overflow: hidden;
}
.sidebar-subject {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
  margin-bottom: 6px;
  position: relative; z-index: 1;
}
.sidebar-title {
  font-family: var(--font-d);
  font-size: 17px; font-weight: 700;
  line-height: 1.35;
  margin-bottom: 5px;
  position: relative; z-index: 1;
}
.sidebar-teacher { font-size: 12px; opacity: 0.65; position: relative; z-index: 1; }
.timer-box { padding: 18px 20px; border-bottom: 1px solid var(--border); background: var(--primary-lighter); }
.timer-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-3);
  margin-bottom: 8px;
  display: flex; align-items: center; gap: 6px;
}
.timer-display {
  font-family: var(--font-mono);
  font-size: 34px; font-weight: 500;
  color: var(--primary-darker);
  letter-spacing: 0.04em;
  line-height: 1;
}
.timer-display.warning { color: var(--orange); }
.timer-display.danger { color: var(--red); animation: pulse 1s ease infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
.timer-track { height: 5px; background: var(--border); border-radius: 5px; margin-top: 12px; overflow: hidden; }
.timer-fill { height: 100%; border-radius: 5px; transition: width 1s linear, background 0.5s var(--ease); }
.nav-scroll { flex: 1; overflow-y: auto; padding: 4px 0; }
.nav-sec { padding: 16px 20px 8px; }
.nav-sec-title {
  font-size: 11px; font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-3);
  margin-bottom: 10px;
}
.nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 8px; }
.nav-dot {
  aspect-ratio: 1;
  border-radius: var(--r-s);
  border: 2px solid var(--border);
  background: var(--bg-card);
  font-size: 12px; font-weight: 700;
  font-family: var(--font);
  color: var(--text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s var(--ease);
  position: relative;
}
.nav-dot:hover { border-color: var(--primary); color: var(--primary); transform: scale(1.08); }
.nav-dot.active { border-color: var(--primary); background: var(--primary); color: var(--text-inv); box-shadow: 0 2px 8px var(--primary-shadow); }
.nav-dot.answered { border-color: var(--done); background: var(--done-l); color: var(--done); }
.nav-dot.answered.active { background: var(--done); color: var(--text-inv); border-color: var(--done); }
.nav-dot.flagged::after { content:''; position:absolute; top:-3px; right:-3px; width:8px; height:8px; border-radius:50%; background:var(--orange); border:2px solid var(--bg-card); }
.legend-wrap { padding: 0 20px 10px; }
.legend { display:flex; gap:14px; flex-wrap:wrap; }
.legend-item { display:flex; align-items:center; gap:5px; font-size:10px; color:var(--text-3); font-weight:600; }
.lsw { width:10px; height:10px; border-radius:4px; border:2px solid; }
.lsw.c { border-color:var(--primary); background:var(--primary); }
.lsw.a { border-color:var(--done); background:var(--done-l); }
.lsw.f { border-color:var(--orange); background:var(--orange-l); }
.sidebar-footer { margin-top: auto; padding: 16px 20px; border-top: 1px solid var(--border); background: var(--bg-sidebar); }
.prog-info { display:flex; justify-content:space-between; margin-bottom:8px; }
.prog-text { font-size:12px; font-weight:700; color:var(--text-2); }
.prog-pct { font-size:12px; font-weight:800; color:var(--primary); }
.prog-track { height:6px; background:var(--border); border-radius:6px; overflow:hidden; margin-bottom:16px; }
.prog-fill { height:100%; background:var(--gradient-btn); border-radius:6px; transition:width 0.5s var(--ease); }
.submit-btn {
  width: 100%; padding: 13px;
  border: none; border-radius: var(--r-m);
  background: var(--gradient-btn);
  color: var(--text-inv);
  font-size: 14px; font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s var(--ease);
  box-shadow: 0 4px 14px var(--primary-shadow);
}
.submit-btn:hover { transform:translateY(-2px); box-shadow:0 6px 20px var(--primary-shadow); }
.main { flex: 1; margin-left: 286px; padding: 18px 32px 92px; width: calc(100vw - 286px); max-width: none; }
.sec-banner { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-l); padding: 12px 16px; margin-bottom: 10px; box-shadow: var(--shadow-s); display: flex; align-items: center; gap: 10px; }
.sec-icon { width: 36px; height: 36px; border-radius: var(--r-m); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sec-icon.mc { background: var(--primary-light); color: var(--primary); }
.sec-icon.essay { background: var(--purple-l); color: var(--purple); }
.sec-info h3 { font-family:var(--font-d); font-size:14px; font-weight:700; margin-bottom:2px; }
.sec-info p { font-size:12px; color:var(--text-3); line-height:1.35; }
.qc {
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: var(--r-l);
  padding: 14px 16px;
  margin-bottom: 8px;
  box-shadow: var(--shadow-s);
  transition: all 0.25s var(--ease);
  animation: qIn 0.3s ease-out;
  scroll-margin-top: 20px;
}
.qc:hover { box-shadow: var(--shadow-m); }
.qc.cur { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow), var(--shadow-m); }
.qc.fl { border-color: var(--orange); background: #FFFDF8; }
@keyframes qIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.qh { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; gap:8px; }
.ql { display:flex; align-items:flex-start; gap:10px; flex:1; }
.qn {
  min-width:28px; height:28px;
  border-radius:50%;
  background: var(--primary);
  color: var(--text-inv);
  font-weight:800; font-size:11px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.qc.fl .qn { background:var(--orange); }
.qp { font-size:13px; font-weight:600; line-height:1.5; color:var(--text); white-space:pre-line; flex:1; padding-top:2px; }
.qa { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.qpts { padding:3px 8px; border-radius:20px; font-size:10px; font-weight:700; background:var(--primary-light); color:var(--primary-dark); white-space:nowrap; }
.fbtn {
  width:28px; height:28px;
  border-radius:50%;
  border:1.5px solid var(--border);
  background:var(--bg-card);
  color:var(--text-3);
  cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:all 0.2s var(--ease);
}
.fbtn:hover { border-color:var(--orange); color:var(--orange); background:var(--orange-l); }
.fbtn.on { border-color:var(--orange); color:var(--orange); background:var(--orange-l); }
.mco { display:flex; flex-direction:column; gap:6px; margin-left:36px; }
.mci {
  display:flex; align-items:center; gap:10px;
  padding:8px 12px;
  border:1.5px solid var(--border);
  border-radius:var(--r-m);
  cursor:pointer;
  transition:all 0.2s var(--ease);
  background:var(--bg-card);
}
.mci:hover { border-color:var(--primary); background:var(--bg-hover); transform:translateX(3px); }
.mci.sel { border-color:var(--primary); background:var(--primary-light); box-shadow:0 2px 8px var(--primary-glow); }
.mcl {
  width:26px; height:26px;
  border-radius:50%;
  border:2px solid var(--border);
  font-size:11px; font-weight:800;
  display:flex; align-items:center; justify-content:center;
  color:var(--text-3);
  transition:all 0.2s var(--ease);
  flex-shrink:0;
  background:var(--bg-card);
}
.mci.sel .mcl { border-color:var(--primary); background:var(--primary); color:var(--text-inv); }
.mct { font-size:12px; font-weight:500; color:var(--text-2); line-height:1.4; flex:1; }
.mci.sel .mct { color:var(--primary-darker); font-weight:600; }
.tfg { display:flex; gap:8px; margin-left:36px; }
.tfi {
  flex:1; padding:10px;
  border:1.5px solid var(--border);
  border-radius:var(--r-m);
  text-align:center;
  font-size:13px; font-weight:700;
  color:var(--text-3); cursor:pointer;
  transition:all 0.2s var(--ease);
  background:var(--bg-card);
}
.tfi:hover { border-color:var(--primary); color:var(--primary); }
.tfi.sel { border-color:var(--primary); background:var(--primary-light); color:var(--primary-dark); box-shadow:0 2px 8px var(--primary-glow); }
.fib {
  margin-left:36px; width:calc(100% - 36px);
  padding:9px 12px;
  border:1.5px solid var(--border);
  border-radius:var(--r-m);
  font-size:13px; font-family:var(--font-mono);
  font-weight:500; color:var(--text);
  background:var(--bg-input);
  transition:all 0.2s var(--ease);
}
.fib:focus { outline:none; border-color:var(--primary); background:var(--bg-card); box-shadow:0 0 0 3px var(--primary-glow); }
.ess {
  margin-left:36px; width:calc(100% - 36px);
  min-height:100px; padding:12px 14px;
  border:1.5px solid var(--border);
  border-radius:var(--r-m);
  font-size:13px; font-family:var(--font);
  font-weight:500; color:var(--text);
  background:var(--bg-input);
  line-height:1.6; resize:vertical;
  transition:all 0.2s var(--ease);
}
.ess:focus { outline:none; border-color:var(--primary); background:var(--bg-card); box-shadow:0 0 0 3px var(--primary-glow); }
.ess-cnt { margin-left:36px; margin-top:4px; font-size:10px; color:var(--text-3); font-weight:600; }
.bnav {
  position:fixed; bottom:0; left:286px; right:0;
  background:var(--bg-card);
  border-top:1px solid var(--border);
  padding:12px 40px;
  display:flex; align-items:center; justify-content:space-between;
  z-index:40;
  box-shadow:0 -2px 8px rgba(30,41,59,0.03);
}
.nb {
  display:flex; align-items:center; gap:6px;
  padding:10px 20px;
  border:1.5px solid var(--border);
  border-radius:var(--r-m);
  background:var(--bg-card);
  font-size:13px; font-weight:700;
  font-family:var(--font);
  color:var(--text-2); cursor:pointer;
  transition:all 0.2s var(--ease);
}
.nb:hover { border-color:var(--primary); color:var(--primary); background:var(--bg-hover); }
.nb:disabled { opacity:0.3; cursor:not-allowed; }
.npos { font-size:13px; font-weight:700; color:var(--text-3); }
.asv { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:var(--primary); }
.vwarn {
  position:fixed;
  top:20px;
  right:24px;
  width:min(420px, calc(100vw - 32px));
  background:linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%);
  border:1.5px solid rgba(37,99,235,0.25);
  border-left:5px solid var(--primary);
  border-radius:16px;
  box-shadow:0 18px 42px rgba(30,64,175,0.24);
  padding:14px 16px;
  z-index:1200;
  animation:vwIn 0.24s ease;
}
.vwarn.danger {
  background:linear-gradient(145deg, #EFF6FF 0%, #FEE2E2 100%);
  border-color:rgba(239,68,68,0.35);
  border-left-color:var(--red);
}
.vwarn-head { display:flex; align-items:flex-start; gap:10px; }
.vwarn-icon {
  width:34px;
  height:34px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:rgba(37,99,235,0.14);
  color:var(--primary-dark);
  flex-shrink:0;
}
.vwarn.danger .vwarn-icon { background:rgba(239,68,68,0.16); color:var(--red); }
.vwarn-title { font-size:14px; font-weight:800; color:var(--primary-darker); line-height:1.3; }
.vwarn.danger .vwarn-title { color:var(--red); }
.vwarn-close {
  margin-left:auto;
  border:none;
  background:transparent;
  color:var(--text-3);
  font-size:18px;
  font-weight:700;
  cursor:pointer;
  line-height:1;
}
.vwarn-text { margin-top:8px; font-size:12px; font-weight:600; color:var(--text-2); line-height:1.55; }
.vwarn-meta {
  margin-top:10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}
.vwarn-pill {
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:5px 10px;
  border-radius:999px;
  font-size:11px;
  font-weight:800;
  background:rgba(37,99,235,0.16);
  color:var(--primary-darker);
}
.vwarn-danger {
  margin-top:10px;
  font-size:11px;
  font-weight:700;
  color:var(--red);
  background:var(--red-l);
  border:1px solid rgba(239,68,68,0.2);
  border-radius:10px;
  padding:8px 10px;
}
@keyframes vwIn { from{opacity:0;transform:translateY(-8px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
.mov {
  position:fixed; inset:0;
  background:rgba(30,41,59,0.45);
  backdrop-filter:blur(6px);
  display:flex; align-items:center; justify-content:center;
  z-index:1000;
  animation:mf 0.2s ease;
}
@keyframes mf { from{opacity:0} to{opacity:1} }
.mbox {
  background:var(--bg-card);
  border-radius:var(--r-xl);
  padding:36px; max-width:500px; width:92%;
  box-shadow:var(--shadow-l);
  text-align:center;
}
.miw { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; }
.mt { font-family:var(--font-d); font-size:22px; font-weight:700; margin-bottom:10px; }
.mtx { font-size:14px; color:var(--text-2); line-height:1.7; margin-bottom:24px; }
.msts { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:24px; }
.mst { background:var(--bg); border-radius:var(--r-m); padding:14px 10px; }
.mstv { font-size:22px; font-weight:800; }
.mstl { font-size:11px; font-weight:600; color:var(--text-3); margin-top:2px; }
.mbtns { display:flex; gap:10px; justify-content:center; }
.mb {
  padding:11px 24px; border-radius:var(--r-m);
  font-size:13px; font-weight:700;
  font-family:var(--font); cursor:pointer;
  transition:all 0.2s var(--ease);
  display:flex; align-items:center; gap:6px;
}
.mb-c { border:1.5px solid var(--border); background:var(--bg-card); color:var(--text-2); }
.mb-c:hover { background:var(--bg-hover); border-color:var(--primary); color:var(--primary); }
.mb-g { border:none; background:var(--gradient-btn); color:var(--text-inv); box-shadow:0 4px 14px var(--primary-shadow); }
.rscr { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:40px 24px; background:linear-gradient(160deg, #F7F8FC 0%, var(--primary-lighter) 50%, #F7F8FC 100%); }
.rcard { background:var(--bg-card); border-radius:var(--r-xl); padding:48px 40px; max-width:540px; width:100%; text-align:center; box-shadow:var(--shadow-l); }
.rtitle { font-family:var(--font-d); font-size:26px; font-weight:700; margin-bottom:8px; }
.rsub { font-size:14px; color:var(--text-2); line-height:1.6; margin-bottom:20px; }
.rbd { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:24px; }
.rbi { background:var(--bg); border-radius:var(--r-m); padding:16px 12px; }
.rbv { font-size:20px; font-weight:800; }
.rbl { font-size:11px; font-weight:600; color:var(--text-3); margin-top:2px; }
.rbtns { display:flex; gap:12px; justify-content:center; }
.rbtns button { padding:11px 24px; border-radius:var(--r-m); font-size:13px; font-weight:700; font-family:var(--font); cursor:pointer; }
.rbtns .gh { border:1.5px solid var(--border); background:var(--bg-card); color:var(--text-2); }
.rbtns .so { border:none; background:var(--gradient-btn); color:var(--text-inv); box-shadow:0 4px 14px var(--primary-shadow); }
.load-box{display:flex;align-items:center;justify-content:center;min-height:100vh;width:100%;font-family:var(--font);color:var(--text-2)}
.err-box{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;width:100%;gap:10px;padding:24px;text-align:center}
.err-title{font-size:20px;font-weight:800;color:var(--red)}
.err-text{font-size:14px;color:var(--text-2)}
.err-btn{padding:10px 16px;border:none;border-radius:var(--r-m);background:var(--gradient-btn);color:var(--text-inv);font-weight:700;cursor:pointer}
.pw-wrap{
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:100vh;
  width:100%;
  padding:24px;
  background:linear-gradient(165deg, #F8FAFF 0%, #EEF4FF 50%, #F8FAFF 100%);
}
.pw-card{
  width:min(520px, 100%);
  background:var(--bg-card);
  border:1.5px solid rgba(37,99,235,0.18);
  border-radius:var(--r-xl);
  box-shadow:0 24px 48px rgba(30,64,175,0.18);
  padding:30px 28px;
  text-align:center;
}
.pw-icon{
  width:66px;
  height:66px;
  border-radius:18px;
  margin:0 auto 14px;
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--primary-dark);
  background:linear-gradient(145deg, #DBEAFE 0%, #EFF6FF 100%);
  box-shadow:0 10px 24px rgba(37,99,235,0.18);
}
.pw-title{font-family:var(--font-d);font-size:28px;font-weight:700;color:var(--primary-darker);margin-bottom:8px;line-height:1.3}
.pw-sub{font-size:14px;color:var(--text-2);line-height:1.65;margin-bottom:16px}
.pw-input{
  width:100%;
  border:1.5px solid var(--border);
  border-radius:var(--r-m);
  padding:12px 14px;
  font-size:15px;
  font-family:var(--font);
  font-weight:600;
  background:var(--bg-input);
  color:var(--text);
  transition:all 0.2s var(--ease);
}
.pw-input:focus{outline:none;border-color:var(--primary);background:var(--bg-card);box-shadow:0 0 0 3px var(--primary-glow)}
.pw-err{
  margin-top:10px;
  text-align:left;
  font-size:12px;
  font-weight:700;
  color:var(--red);
  background:var(--red-l);
  border:1px solid rgba(239,68,68,0.2);
  border-radius:10px;
  padding:9px 11px;
}
.pw-actions{display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap}
.pw-btn{
  padding:11px 18px;
  border-radius:var(--r-m);
  font-size:13px;
  font-weight:700;
  font-family:var(--font);
  cursor:pointer;
  border:none;
  transition:all 0.2s var(--ease);
}
.pw-btn.primary{background:var(--gradient-btn);color:var(--text-inv);box-shadow:0 6px 18px var(--primary-shadow)}
.pw-btn.primary:hover{transform:translateY(-1px)}
.pw-btn.secondary{background:var(--bg-card);color:var(--text-2);border:1.5px solid var(--border)}
.pw-btn.secondary:hover{border-color:var(--primary);color:var(--primary)}
.pw-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.asv.err { color:var(--red); }
@media (max-width:920px) {
  .sidebar{display:none}
  .bnav{left:0;padding:10px 16px}
  .mco,.ess,.fib,.ess-cnt,.tfg{margin-left:0}
  .ess,.fib{width:100%}
  .msts{grid-template-columns:1fr}
  .rbd{grid-template-columns:1fr}
}
`;

const normalizeQuestionType = (rawType, hasOptions = false) => {
  const value = String(rawType || "").toUpperCase();

  if (value.includes("ESSAY")) return "essay";
  if (value.includes("TRUE_FALSE") || value.includes("TRUEFALSE")) {
    return "true-false";
  }
  if (value.includes("FILL")) return "fill-blank";
  if (value.includes("MULTIPLE_CHOICE") || value === "MC" || hasOptions) {
    return "multiple-choice";
  }

  return "essay";
};

const parseQuestionOptions = (rawOptions) => {
  if (!rawOptions) return [];

  let parsed = rawOptions;

  if (typeof rawOptions === "string") {
    try {
      parsed = JSON.parse(rawOptions);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((option, index) => {
      const id =
        String(
          option?.id ?? option?.optionId ?? option?.optionKey ?? option?.value,
        ).trim() || String(index + 1);
      const text = String(
        option?.content ?? option?.text ?? option?.label ?? "",
      ).trim();

      if (!text) return null;

      return { id, text };
    })
    .filter(Boolean);
};

const mapStartResultToExamData = (result = {}) => {
  const sections = Array.isArray(result?.sections)
    ? result.sections.map((section, sectionIndex) => {
        const questions = Array.isArray(section?.questions)
          ? section.questions.map((question, questionIndex) => {
              const options = parseQuestionOptions(question?.options);
              const normalizedType = normalizeQuestionType(
                question?.questionType,
                options.length > 0,
              );

              return {
                id: String(
                  question?.assignmentQuestionId ||
                    `${section?.sectionId || sectionIndex}-${questionIndex}`,
                ),
                type: normalizedType,
                points: Number(question?.points || 0),
                prompt: String(question?.content || ""),
                options,
              };
            })
          : [];

        const sectionType = questions.some(
          (question) => question.type === "essay",
        )
          ? "essay"
          : "mc";

        return {
          id: String(section?.sectionId || `s-${sectionIndex + 1}`),
          title: String(section?.title || `Phần ${sectionIndex + 1}`),
          type: sectionType,
          description:
            sectionType === "essay"
              ? "Trình bày lời giải chi tiết."
              : "Chọn đáp án đúng nhất cho mỗi câu.",
          questions,
        };
      })
    : [];

  const totalScore = sections
    .flatMap((section) => section.questions)
    .reduce((sum, question) => sum + Number(question.points || 0), 0);

  const remainingSeconds = Number(result?.durationRemainingSeconds);
  const durationSeconds = Number(result?.durationMinutes) * 60;

  return {
    submissionId: Number(result?.submissionId || 0),
    assignmentId: Number(result?.assignmentId || 0),
    title: String(result?.title || "Bài kiểm tra"),
    description: String(result?.description || ""),
    subject: "Bài tập",
    teacher: "Giáo viên",
    totalScore: totalScore > 0 ? Number(totalScore.toFixed(2)) : 10,
    durationSeconds:
      Number.isFinite(remainingSeconds) && remainingSeconds > 0
        ? remainingSeconds
        : Number.isFinite(durationSeconds) && durationSeconds > 0
          ? durationSeconds
          : 0,
    sections,
    requireFullScreen: Boolean(result?.requireFullScreen),
    trackTabSwitch:
      result?.trackTabSwitch === undefined || result?.trackTabSwitch === null
        ? true
        : Boolean(result?.trackTabSwitch),
    limitTabs:
      result?.limitTabs === null || result?.limitTabs === undefined
        ? null
        : Number(result.limitTabs),
  };
};

const getInitialAnswers = (draftAnswers = []) => {
  if (!Array.isArray(draftAnswers)) return {};

  return draftAnswers.reduce((acc, draft) => {
    const questionId = String(draft?.assignmentQuestionId || "");
    if (!questionId) return acc;

    acc[questionId] = String(draft?.answerContent || "");
    return acc;
  }, {});
};

const buildDraftAnswers = (answers = {}) =>
  Object.entries(answers)
    .map(([questionId, answerValue]) => {
      const numericQuestionId = Number(questionId);

      if (!Number.isFinite(numericQuestionId) || numericQuestionId <= 0) {
        return null;
      }

      return {
        assignmentQuestionId: Math.round(numericQuestionId),
        answerContent:
          answerValue === undefined || answerValue === null
            ? ""
            : String(answerValue),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.assignmentQuestionId - b.assignmentQuestionId);

const formatSeconds = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const minutePart = Math.floor(safeSeconds / 60);
  const secondPart = safeSeconds % 60;

  return `${String(minutePart).padStart(2, "0")}:${String(secondPart).padStart(2, "0")}`;
};

const VIOLATION_EVENT_TYPE = {
  TAB_SWITCH: "TAB_SWITCH",
  FOCUS_LOST: "FOCUS_LOST",
};

const VIOLATION_EVENT_LABEL = {
  TAB_SWITCH: "chuyển tab hoặc ẩn trình duyệt",
  FOCUS_LOST: "rời khỏi cửa sổ làm bài",
};

const isPasswordStartError = (err) => {
  const message = String(err?.response?.data?.message || "").toLowerCase();
  const errorCode = String(
    err?.response?.data?.errorCode || err?.response?.data?.code || "",
  ).toLowerCase();

  return (
    message.includes("mật khẩu") ||
    message.includes("mat khau") ||
    message.includes("password") ||
    errorCode.includes("password")
  );
};

const StudentAssignmentExamPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: classIdParam, assignmentId: assignmentIdParam } = useParams();

  const classId = Number(classIdParam);
  const assignmentId = Number(assignmentIdParam);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [currentQ, setCurrentQ] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [violationCount, setViolationCount] = useState(0);
  const [remainingViolations, setRemainingViolations] = useState(null);
  const [violationNotice, setViolationNotice] = useState(null);

  const qRefs = useRef({});
  const draftReadyRef = useRef(false);
  const lastSavedDraftSignatureRef = useRef("");
  const answersRef = useRef({});
  const examDataRef = useRef(null);
  const submitInFlightRef = useRef(false);
  const violationCountRef = useRef(0);
  const initialStartPasswordRef = useRef(
    typeof location.state?.startPassword === "string"
      ? location.state.startPassword
      : null,
  );

  const goToResultPage = useCallback(
    (submissionId) => {
      const safeSubmissionId = Number(submissionId);

      if (!Number.isFinite(safeSubmissionId) || safeSubmissionId <= 0) {
        return;
      }

      navigate(PATH_STUDENT.assignmentResult(safeSubmissionId), {
        replace: true,
        state: {
          classId,
          assignmentId,
        },
      });
    },
    [navigate, classId, assignmentId],
  );

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    examDataRef.current = examData;
  }, [examData]);

  useEffect(() => {
    violationCountRef.current = violationCount;
  }, [violationCount]);

  const allQuestions = useMemo(
    () =>
      examData ? examData.sections.flatMap((section) => section.questions) : [],
    [examData],
  );

  const totalQuestions = allQuestions.length;

  const answeredCount = useMemo(
    () =>
      allQuestions.filter((question) => {
        const answer = answers[question.id];
        if (answer === undefined || answer === null) return false;
        return typeof answer === "string" ? answer.trim().length > 0 : true;
      }).length,
    [allQuestions, answers],
  );

  const flaggedCount = useMemo(
    () => Object.values(flags).filter(Boolean).length,
    [flags],
  );

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);

  const currentIndex = useMemo(
    () => allQuestions.findIndex((question) => question.id === currentQ),
    [allQuestions, currentQ],
  );

  useEffect(() => {
    if (!Number.isFinite(classId) || classId <= 0) {
      setError("classroomId không hợp lệ.");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      setError("assignmentId không hợp lệ.");
      setLoading(false);
      return;
    }

    let alive = true;

    const loadStartAssignment = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await assignmentApi.startStudentAssignment(
          assignmentId,
          classId,
          initialStartPasswordRef.current,
        );

        if (!alive) return;

        const nextExamData = mapStartResultToExamData(response?.result || {});
        const initialAnswers = getInitialAnswers(
          response?.result?.draftAnswers,
        );
        const initialDraftAnswers = buildDraftAnswers(initialAnswers);
        const firstQuestionId =
          nextExamData.sections?.[0]?.questions?.[0]?.id || "";

        setExamData(nextExamData);
        draftReadyRef.current = false;
        lastSavedDraftSignatureRef.current =
          JSON.stringify(initialDraftAnswers);
        setAnswers(initialAnswers);
        setFlags({});
        setCurrentQ(firstQuestionId);
        setSubmitted(false);
        setShowSubmit(false);
        setAutoSaved(false);
        setAutoSaveError("");
        setIsSavingDraft(false);
        setSubmitError("");
        setSubmitResult(null);
        setIsSubmitting(false);
        submitInFlightRef.current = false;
        setViolationCount(0);
        setRemainingViolations(
          Number.isFinite(nextExamData.limitTabs) && nextExamData.limitTabs >= 0
            ? Math.max(0, Math.round(nextExamData.limitTabs))
            : null,
        );
        setViolationNotice(null);
        setTimeLeft(nextExamData.durationSeconds || 0);
      } catch (err) {
        if (!alive) return;

        const backendMessage =
          err?.response?.data?.message ||
          "Không thể bắt đầu làm bài. Vui lòng thử lại.";

        setError(
          isPasswordStartError(err)
            ? `${backendMessage} Vui lòng quay lại popup chi tiết bài tập để nhập mật khẩu trước khi vào làm bài.`
            : backendMessage,
        );
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadStartAssignment();

    return () => {
      alive = false;
    };
  }, [assignmentId, classId, reloadKey]);

  useEffect(() => {
    if (submitted || !examData) return;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setShowSubmit(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [submitted, examData]);

  useEffect(() => {
    if (submitted || !examData?.submissionId) return;

    if (!draftReadyRef.current) {
      draftReadyRef.current = true;
      return;
    }

    const draftAnswers = buildDraftAnswers(answers);
    const nextSignature = JSON.stringify(draftAnswers);

    if (nextSignature === lastSavedDraftSignatureRef.current) {
      return;
    }

    let alive = true;

    const timeout = window.setTimeout(async () => {
      try {
        setIsSavingDraft(true);
        setAutoSaveError("");

        await assignmentApi.saveStudentAssignmentDraft(examData.submissionId, {
          answers: draftAnswers,
        });

        if (!alive) return;
        lastSavedDraftSignatureRef.current = nextSignature;
        setAutoSaved(true);
      } catch (err) {
        if (!alive) return;
        setAutoSaved(false);
        setAutoSaveError(
          err?.response?.data?.message ||
            "Lưu nháp thất bại. Vui lòng thử lại.",
        );
      } finally {
        if (alive) {
          setIsSavingDraft(false);
        }
      }
    }, 700);

    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [answers, submitted, examData?.submissionId]);

  const submitExam = useCallback(
    async ({ triggeredByViolation = false } = {}) => {
      const currentExamData = examDataRef.current;
      const submissionId = currentExamData?.submissionId;

      if (!submissionId || submitInFlightRef.current || submitted) {
        return;
      }

      submitInFlightRef.current = true;
      setIsSubmitting(true);
      setSubmitError("");
      setShowSubmit(false);

      try {
        const finalAnswers = buildDraftAnswers(answersRef.current);
        const response = await assignmentApi.submitStudentAssignment(
          submissionId,
          {
            finalAnswers,
          },
        );

        setSubmitResult(response?.result || null);
        setSubmitted(true);
        goToResultPage(response?.result?.submissionId || submissionId);
      } catch (err) {
        const backendMessage =
          err?.response?.data?.message ||
          "Không thể nộp bài. Vui lòng thử lại.";
        const lowerMessage = backendMessage.toLowerCase();
        const alreadySubmitted =
          lowerMessage.includes("đã nộp") ||
          lowerMessage.includes("already submitted");

        if (triggeredByViolation && alreadySubmitted) {
          setSubmitted(true);
          goToResultPage(submissionId);
          return;
        }

        if (triggeredByViolation) {
          setSubmitError("Bài thi đã bị khóa do vi phạm.");
          setShowSubmit(false);
          return;
        }

        setSubmitError(backendMessage);
        setShowSubmit(true);
      } finally {
        setIsSubmitting(false);
        submitInFlightRef.current = false;
      }
    },
    [submitted, goToResultPage],
  );

  const recordViolation = useCallback(
    async (eventType, metadata = "") => {
      const currentExamData = examDataRef.current;
      const submissionId = currentExamData?.submissionId;
      const configuredLimit = Number(currentExamData?.limitTabs);
      const isLimitTabsEnabled =
        Number.isFinite(configuredLimit) && configuredLimit >= 0;

      if (
        !submissionId ||
        submitted ||
        submitInFlightRef.current ||
        !isLimitTabsEnabled
      ) {
        return;
      }

      try {
        const response = await assignmentApi.recordStudentAssignmentViolation(
          submissionId,
          {
            eventType,
            metadata,
            answers: buildDraftAnswers(answersRef.current),
          },
        );

        const resultPayload = response?.result || {};
        const safeLimit = Number(
          resultPayload?.limitTabs ?? currentExamData?.limitTabs,
        );
        const limitTabs =
          Number.isFinite(safeLimit) && safeLimit >= 0
            ? Math.round(safeLimit)
            : null;

        const safeCount = Number(
          resultPayload?.violationCount ?? resultPayload?.tabSwitchCount,
        );
        const nextCount =
          Number.isFinite(safeCount) && safeCount >= 0
            ? Math.round(safeCount)
            : violationCountRef.current + 1;

        const safeRemaining = Number(
          resultPayload?.remainingTabs ??
            resultPayload?.remainingViolations ??
            resultPayload?.tabsRemaining,
        );
        const nextRemaining =
          Number.isFinite(safeRemaining) && safeRemaining >= 0
            ? Math.round(safeRemaining)
            : limitTabs === null
              ? null
              : Math.max(0, limitTabs - nextCount);

        setViolationCount(nextCount);
        setRemainingViolations(nextRemaining);

        const autoSubmitted = Boolean(resultPayload?.autoSubmitted);
        setViolationNotice({
          id: Date.now(),
          eventType,
          count: nextCount,
          remaining: nextRemaining,
          limitTabs,
          autoSubmitted,
        });

        if (response?.result?.autoSubmitted) {
          await submitExam({ triggeredByViolation: true });
        }
      } catch {
        const fallbackCount = violationCountRef.current + 1;
        const safeLimit = Number(currentExamData?.limitTabs);
        const limitTabs =
          Number.isFinite(safeLimit) && safeLimit >= 0
            ? Math.round(safeLimit)
            : null;
        const fallbackRemaining =
          limitTabs === null ? null : Math.max(0, limitTabs - fallbackCount);

        setViolationCount(fallbackCount);
        setRemainingViolations(fallbackRemaining);
        setViolationNotice({
          id: Date.now(),
          eventType,
          count: fallbackCount,
          remaining: fallbackRemaining,
          limitTabs,
          autoSubmitted: false,
        });
      }
    },
    [submitted, submitExam],
  );

  useEffect(() => {
    if (!violationNotice) return;

    const timeout = window.setTimeout(
      () => setViolationNotice(null),
      violationNotice.autoSubmitted ? 9000 : 6500,
    );

    return () => window.clearTimeout(timeout);
  }, [violationNotice]);

  useEffect(() => {
    const isLimitTabsEnabled =
      Number.isFinite(examData?.limitTabs) && examData.limitTabs >= 0;

    if (submitted || !examData?.submissionId || !isLimitTabsEnabled) {
      return;
    }

    let blurTimeout = null;
    let lastViolationTime = 0;
    const MIN_INTERVAL_MS = 3000; // Tối thiểu 3 giây giữa 2 lần đếm

    const onWindowBlur = () => {
      // Debounce — chờ 500ms xem có focus lại không (tránh false positive khi click address bar/devtools)
      blurTimeout = window.setTimeout(() => {
        const now = Date.now();
        if (now - lastViolationTime < MIN_INTERVAL_MS) return;
        lastViolationTime = now;

        recordViolation(
          VIOLATION_EVENT_TYPE.FOCUS_LOST,
          "Học sinh đã rời khỏi cửa sổ làm bài.",
        );
      }, 500);
    };

    const onWindowFocus = () => {
      // Nếu focus lại nhanh trong 500ms -> không tính vi phạm
      if (blurTimeout) {
        window.clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        recordViolation(
          VIOLATION_EVENT_TYPE.TAB_SWITCH,
          "Học sinh đã chuyển tab hoặc ẩn trình duyệt.",
        );
      }
    };

    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (blurTimeout) window.clearTimeout(blurTimeout);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [submitted, examData?.submissionId, examData?.limitTabs, recordViolation]);

  useEffect(() => {
    if (submitted || !examData?.requireFullScreen || !examData?.submissionId) {
      return;
    }

    if (typeof document.documentElement?.requestFullscreen !== "function") {
      return;
    }

    document.documentElement.requestFullscreen().catch(() => {});
  }, [submitted, examData?.requireFullScreen, examData?.submissionId]);

  useEffect(() => {
    if (!autoSaved) return;

    const timeout = window.setTimeout(() => setAutoSaved(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [autoSaved]);

  const timerPercent = examData?.durationSeconds
    ? (timeLeft / examData.durationSeconds) * 100
    : 0;
  const timerClass =
    timeLeft <= 60 ? "danger" : timeLeft <= 300 ? "warning" : "";
  const timerColor =
    timeLeft <= 60
      ? "var(--red)"
      : timeLeft <= 300
        ? "var(--orange)"
        : "var(--primary)";

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setAutoSaved(false);
    setAutoSaveError("");
  };

  const toggleFlag = (questionId) => {
    setFlags((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const goQuestion = (questionId) => {
    setCurrentQ(questionId);

    const questionElement = qRefs.current[questionId];
    if (questionElement) {
      questionElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const goPreviousQuestion = () => {
    if (currentIndex <= 0) return;
    goQuestion(allQuestions[currentIndex - 1].id);
  };

  const goNextQuestion = () => {
    if (currentIndex >= totalQuestions - 1) return;
    goQuestion(allQuestions[currentIndex + 1].id);
  };

  const optionLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (loading) {
    return (
      <div className="exam-app">
        <style>{CSS}</style>
        <div className="load-box">Đang tải đề thi...</div>
      </div>
    );
  }

  if (error || !examData || totalQuestions === 0) {
    return (
      <div className="exam-app">
        <style>{CSS}</style>
        <div className="err-box">
          <div className="err-title">Không thể mở bài làm</div>
          <div className="err-text">
            {error || "Dữ liệu đề thi không hợp lệ."}
          </div>
          <button
            className="err-btn"
            onClick={() => setReloadKey((prev) => prev + 1)}
          >
            Thử lại
          </button>
          <button
            className="err-btn"
            onClick={() =>
              navigate(PATH_STUDENT.classroom.assignments(classId))
            }
          >
            Quay lại danh sách bài tập
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const totalScore = Number(examData.totalScore || 0);
    const earnedScore = Number(submitResult?.totalEarnedScore);
    const estimatedScore = totalQuestions
      ? Number(((answeredCount / totalQuestions) * totalScore).toFixed(2))
      : 0;
    const scoreDisplay =
      Number.isFinite(earnedScore) && earnedScore >= 0
        ? earnedScore
        : estimatedScore;

    return (
      <div className="exam-app">
        <style>{CSS}</style>
        <div className="rscr">
          <div className="rcard">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <I.Trophy />
            </div>
            <div className="rtitle">Hoàn thành bài kiểm tra!</div>
            <div className="rsub">
              Bài làm đã được ghi nhận. Bạn có thể xem lại hoặc quay về danh
              sách bài tập.
            </div>

            <div className="rbd">
              <div className="rbi">
                <div className="rbv">
                  {answeredCount}/{totalQuestions}
                </div>
                <div className="rbl">Câu đã trả lời</div>
              </div>
              <div className="rbi">
                <div className="rbv">
                  {formatSeconds(
                    Math.max(0, examData.durationSeconds - timeLeft),
                  )}
                </div>
                <div className="rbl">Thời gian làm bài</div>
              </div>
              <div className="rbi">
                <div className="rbv" style={{ color: "var(--primary)" }}>
                  {scoreDisplay}
                </div>
                <div className="rbl">Điểm ước tính</div>
              </div>
              <div className="rbi">
                <div className="rbv" style={{ color: "var(--orange)" }}>
                  {flaggedCount}
                </div>
                <div className="rbl">Câu đã đánh dấu</div>
              </div>
            </div>

            <div className="rbtns">
              <button
                className="gh"
                onClick={() =>
                  navigate(PATH_STUDENT.classroom.assignments(classId))
                }
              >
                <I.Eye /> Về danh sách bài tập
              </button>
              <button
                className="so"
                onClick={() => setReloadKey((prev) => prev + 1)}
              >
                <I.Refresh /> Làm lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-app">
      <style>{CSS}</style>

      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-subject">{examData.subject || "Bài tập"}</div>
          <div className="sidebar-title">{examData.title}</div>
          <div className="sidebar-teacher">{examData.teacher}</div>
        </div>

        <div className="timer-box">
          <div className="timer-label">
            <I.Clock /> Thời gian còn lại
          </div>
          <div className={`timer-display ${timerClass}`}>
            {formatSeconds(timeLeft)}
          </div>
          <div className="timer-track">
            <div
              className="timer-fill"
              style={{
                width: `${Math.max(0, Math.min(100, timerPercent))}%`,
                background: timerColor,
              }}
            />
          </div>
        </div>

        <div className="nav-scroll">
          {examData.sections.map((section) => (
            <div key={section.id} className="nav-sec">
              <div className="nav-sec-title">{section.title}</div>
              <div className="nav-grid">
                {section.questions.map((question) => {
                  const globalIndex =
                    allQuestions.findIndex((item) => item.id === question.id) +
                    1;
                  const answerValue = answers[question.id];
                  const isAnswered =
                    answerValue !== undefined &&
                    answerValue !== null &&
                    (typeof answerValue === "string"
                      ? answerValue.trim().length > 0
                      : true);

                  return (
                    <button
                      key={question.id}
                      className={`nav-dot${currentQ === question.id ? " active" : ""}${isAnswered ? " answered" : ""}${flags[question.id] ? " flagged" : ""}`}
                      onClick={() => goQuestion(question.id)}
                    >
                      {globalIndex}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="legend-wrap">
          <div className="legend">
            <div className="legend-item">
              <div className="lsw c" /> Đang xem
            </div>
            <div className="legend-item">
              <div className="lsw a" /> Đã trả lời
            </div>
            <div className="legend-item">
              <div className="lsw f" /> Đánh dấu
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="prog-info">
            <span className="prog-text">Tiến độ</span>
            <span className="prog-pct">
              {answeredCount}/{totalQuestions} câu
            </span>
          </div>
          <div className="prog-track">
            <div
              className="prog-fill"
              style={{
                width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
          <button className="submit-btn" onClick={() => setShowSubmit(true)}>
            <I.Send /> Nộp bài
          </button>
        </div>
      </div>

      <div className="main">
        {examData.sections.map((section) => (
          <div key={section.id}>
            <div className="sec-banner">
              <div className={`sec-icon ${section.type}`}>
                {section.type === "mc" ? <I.Layers /> : <I.PenLine />}
              </div>
              <div className="sec-info">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
            </div>

            {section.questions.map((question) => {
              const globalIndex =
                allQuestions.findIndex((item) => item.id === question.id) + 1;

              return (
                <div
                  key={question.id}
                  className={`qc${currentQ === question.id ? " cur" : ""}${flags[question.id] ? " fl" : ""}`}
                  ref={(element) => {
                    qRefs.current[question.id] = element;
                  }}
                  onClick={() => setCurrentQ(question.id)}
                >
                  <div className="qh">
                    <div className="ql">
                      <div className="qn">{globalIndex}</div>
                      <div className="qp">{question.prompt}</div>
                    </div>

                    <div className="qa">
                      <div className="qpts">{question.points} điểm</div>
                      <button
                        className={`fbtn${flags[question.id] ? " on" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFlag(question.id);
                        }}
                        title="Đánh dấu"
                      >
                        {flags[question.id] ? <I.FlagFill /> : <I.Flag />}
                      </button>
                    </div>
                  </div>

                  {question.type === "multiple-choice" ? (
                    <div className="mco">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={option.id}
                          className={`mci${answers[question.id] === option.id ? " sel" : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setAnswer(question.id, option.id);
                          }}
                        >
                          <div className="mcl">
                            {optionLabels[optionIndex] || optionIndex + 1}
                          </div>
                          <div className="mct">{option.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {question.type === "true-false" ? (
                    <div className="tfg">
                      <div
                        className={`tfi${answers[question.id] === "true" ? " sel" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setAnswer(question.id, "true");
                        }}
                      >
                        Đúng
                      </div>
                      <div
                        className={`tfi${answers[question.id] === "false" ? " sel" : ""}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          setAnswer(question.id, "false");
                        }}
                      >
                        Sai
                      </div>
                    </div>
                  ) : null}

                  {question.type === "fill-blank" ? (
                    <input
                      className="fib"
                      placeholder="Nhập câu trả lời..."
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        setAnswer(question.id, event.target.value)
                      }
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : null}

                  {question.type === "essay" ? (
                    <>
                      <textarea
                        className="ess"
                        placeholder="Viết câu trả lời của bạn..."
                        value={answers[question.id] || ""}
                        onChange={(event) =>
                          setAnswer(question.id, event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                      />
                      <div className="ess-cnt">
                        {String(answers[question.id] || "").length} ký tự
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="bnav">
        <button
          className="nb"
          onClick={goPreviousQuestion}
          disabled={currentIndex <= 0}
        >
          <I.ChevL /> Câu trước
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="npos">
            Câu {Math.max(1, currentIndex + 1)} / {totalQuestions}
          </div>
          {isSavingDraft ? (
            <div className="asv">
              <I.CloudSave /> Đang lưu...
            </div>
          ) : autoSaveError ? (
            <div className="asv err">{autoSaveError}</div>
          ) : autoSaved ? (
            <div className="asv">
              <I.CloudSave /> Đã lưu
            </div>
          ) : null}
        </div>

        <button
          className="nb"
          onClick={goNextQuestion}
          disabled={currentIndex >= totalQuestions - 1}
        >
          Câu sau <I.ChevR />
        </button>
      </div>

      {violationNotice ? (
        <div
          className={`vwarn${violationNotice.autoSubmitted || (violationNotice.remaining !== null && violationNotice.remaining <= 1) ? " danger" : ""}`}
        >
          <div className="vwarn-head">
            <div className="vwarn-icon">
              <I.Warning />
            </div>
            <div>
              <div className="vwarn-title">Cảnh báo giám sát bài thi</div>
              <div className="vwarn-text">
                Hệ thống đã ghi nhận hành vi{" "}
                {VIOLATION_EVENT_LABEL[violationNotice.eventType] || "vi phạm"}{" "}
                của học sinh.
              </div>
            </div>
            <button
              className="vwarn-close"
              onClick={() => setViolationNotice(null)}
            >
              ×
            </button>
          </div>
          <div className="vwarn-meta">
            <span className="vwarn-pill">
              Lần vi phạm: {violationNotice.count}
            </span>
            <span className="vwarn-pill">
              {violationNotice.remaining === null
                ? "Đang cập nhật lượt"
                : `Còn ${violationNotice.remaining} lượt`}
            </span>
          </div>
          <div className="vwarn-danger">
            Nếu vượt quá số lượt cho phép, hệ thống sẽ tự động nộp bài ngay lập
            tức.
          </div>
        </div>
      ) : null}

      {showSubmit ? (
        <div
          className="mov"
          onClick={() => timeLeft > 0 && !isSubmitting && setShowSubmit(false)}
        >
          <div className="mbox" onClick={(event) => event.stopPropagation()}>
            <div
              className="miw"
              style={{
                background:
                  unansweredCount > 0
                    ? "var(--orange-l)"
                    : "var(--primary-light)",
                color: unansweredCount > 0 ? "var(--orange)" : "var(--primary)",
              }}
            >
              {unansweredCount > 0 ? <I.Warning /> : <I.Check />}
            </div>
            <div className="mt">
              {timeLeft <= 0 ? "Hết giờ làm bài!" : "Xác nhận nộp bài?"}
            </div>
            <div className="mtx">
              {timeLeft <= 0
                ? "Thời gian làm bài đã kết thúc. Bài làm sẽ được nộp tự động."
                : unansweredCount > 0
                  ? `Bạn vẫn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`
                  : "Bạn đã trả lời tất cả các câu hỏi. Bạn có chắc chắn muốn nộp bài?"}
            </div>
            {submitError ? (
              <div
                style={{
                  marginBottom: 16,
                  color: "var(--red)",
                  background: "var(--red-l)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "var(--r-m)",
                  padding: "10px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {submitError}
              </div>
            ) : null}

            <div className="msts">
              <div className="mst">
                <div className="mstv" style={{ color: "var(--primary)" }}>
                  {answeredCount}
                </div>
                <div className="mstl">Đã trả lời</div>
              </div>
              <div className="mst">
                <div
                  className="mstv"
                  style={{
                    color: unansweredCount > 0 ? "var(--red)" : "var(--text-3)",
                  }}
                >
                  {unansweredCount}
                </div>
                <div className="mstl">Chưa trả lời</div>
              </div>
              <div className="mst">
                <div className="mstv" style={{ color: "var(--orange)" }}>
                  {flaggedCount}
                </div>
                <div className="mstl">Đánh dấu</div>
              </div>
            </div>

            <div className="mbtns">
              {timeLeft > 0 ? (
                <button
                  className="mb mb-c"
                  onClick={() => setShowSubmit(false)}
                  disabled={isSubmitting}
                >
                  Quay lại làm bài
                </button>
              ) : null}
              <button
                className="mb mb-g"
                onClick={() => submitExam()}
                disabled={isSubmitting}
              >
                <I.Send />
                {isSubmitting
                  ? "Đang nộp..."
                  : timeLeft <= 0
                    ? "Xem kết quả"
                    : "Nộp bài"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentAssignmentExamPage;
