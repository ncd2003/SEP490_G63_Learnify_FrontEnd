import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_TEACHER } from "@/routes/paths";

const CLASSES = [
  { id: "c1", name: "10A1", students: 42 },
  { id: "c2", name: "10A2", students: 38 },
  { id: "c3", name: "10A3", students: 40 },
  { id: "c4", name: "11B1", students: 35 },
  { id: "c5", name: "11B2", students: 37 },
  { id: "c6", name: "12C1", students: 33 },
];

const SUBJECTS = [
  "Toán học",
  "Vật lý",
  "Hóa học",
  "Ngữ văn",
  "Tiếng Anh",
  "Sinh học",
];

const Ic = {
  Search: () => (
    <svg
      width="16"
      height="16"
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
  Plus: () => (
    <svg
      width="16"
      height="16"
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
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
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
  Check: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
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
      width="16"
      height="16"
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
  Layers: () => (
    <svg
      width="16"
      height="16"
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
  Award: () => (
    <svg
      width="18"
      height="18"
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
  Refresh: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  Grid: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  List: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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
  --font-d: 'Lora', serif;
  --ease: cubic-bezier(0.4,0,0.2,1);
}

*{box-sizing:border-box;margin:0;padding:0}
.page{width:100%;max-width:none;margin:0;padding:24px 12px 56px;font-family:var(--font);background:var(--bg);color:var(--text)}
.page-top{margin-bottom:22px}
.breadcrumb{font-size:12px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.page-title-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.page-title{font-family:var(--font-d);font-size:28px;font-weight:700;color:var(--text)}
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:var(--r-m);font-size:13px;font-weight:700;font-family:var(--font);cursor:pointer;border:none;transition:all .2s var(--ease);white-space:nowrap}
.btn-primary{background:var(--gradient);color:var(--inv);box-shadow:0 3px 12px var(--primary-shadow)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 5px 18px var(--primary-shadow)}
.btn-ghost{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.btn-ghost:hover{border-color:var(--primary);color:var(--primary);background:var(--hover)}
.stats-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r-l);padding:20px 22px;box-shadow:var(--sh-s);transition:all .2s var(--ease);position:relative;overflow:hidden}
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
.tabs{display:flex;gap:4px;margin-bottom:18px;background:var(--card);border:1px solid var(--border);border-radius:var(--r-l);padding:5px;box-shadow:var(--sh-s)}
.tab{padding:9px 20px;border-radius:var(--r-m);font-size:13px;font-weight:600;font-family:var(--font);color:var(--text3);cursor:pointer;border:none;background:none;transition:all .2s var(--ease);display:flex;align-items:center;gap:6px}
.tab:hover{color:var(--text2);background:var(--hover)}
.tab.active{background:var(--primary);color:var(--inv);box-shadow:0 2px 8px var(--primary-shadow)}
.tab-count{padding:2px 7px;border-radius:10px;font-size:10px;font-weight:800;background:rgba(255,255,255,.2)}
.tab:not(.active) .tab-count{background:var(--border-l);color:var(--text3)}
.toolbar{background:var(--card);border:1px solid var(--border);border-radius:var(--r-l);padding:14px 20px;margin-bottom:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;box-shadow:var(--sh-s)}
.search-box{flex:1;min-width:220px;position:relative}
.search-box svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3)}
.search-input{width:100%;padding:9px 12px 9px 36px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:13px;font-family:var(--font);font-weight:500;color:var(--text);background:var(--input-bg);transition:all .2s var(--ease)}
.search-input:focus{outline:none;border-color:var(--primary);background:var(--card);box-shadow:0 0 0 3px var(--primary-glow)}
.filter-select{padding:9px 32px 9px 12px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:12px;font-weight:600;font-family:var(--font);color:var(--text2);background:var(--card);appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;cursor:pointer}
.view-toggle{display:flex;border:1.5px solid var(--border);border-radius:var(--r-m);overflow:hidden}
.vt-btn{padding:8px 12px;background:var(--card);border:none;color:var(--text3);cursor:pointer;display:flex;align-items:center;transition:all .15s var(--ease)}
.vt-btn:first-child{border-right:1px solid var(--border)}
.vt-btn.active{background:var(--primary-light);color:var(--primary)}
.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
.a-card{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);overflow:hidden;transition:all .25s var(--ease);animation:cardIn .35s ease-out both}
.a-card:hover{box-shadow:var(--sh-m);border-color:var(--primary);transform:translateY(-3px)}
@keyframes cardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.a-card-top{padding:20px 22px 16px}
.a-card-badge-row{display:flex;align-items:center;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.badge{padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase}
.badge-pub{background:var(--green-l);color:var(--green)}
.badge-draft{background:var(--orange-l);color:var(--orange)}
.badge-arch{background:var(--border-l);color:var(--text3)}
.badge-test{background:var(--primary-light);color:var(--primary)}
.badge-hw{background:var(--purple-l);color:var(--purple)}
.badge-subject{background:var(--sky-l);color:var(--sky)}
.a-title{font-size:15px;font-weight:700;color:var(--text);line-height:1.45;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.a-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--text3);font-weight:500}
.a-meta-item{display:flex;align-items:center;gap:4px}
.a-card-divider{height:1px;background:var(--border-l);margin:0 22px}
.a-card-bottom{padding:14px 22px;display:flex;align-items:center;justify-content:space-between}
.assigned-classes{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.class-chip{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;background:var(--primary-light);color:var(--primary-dark);border:1px solid rgba(37,99,235,.12)}
.class-more{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;background:var(--border-l);color:var(--text3)}
.no-class{font-size:11px;color:var(--text3);font-weight:500;font-style:italic}
.a-card-actions{display:flex;gap:2px}
.act-btn{width:32px;height:32px;border-radius:var(--r-s);border:none;background:none;color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--ease)}
.act-btn:hover{background:var(--hover);color:var(--primary)}
.act-btn.danger:hover{background:var(--red-l);color:var(--red)}
.score-bar-wrap{margin-top:10px;display:flex;align-items:center;gap:10px}
.score-bar-track{flex:1;height:5px;background:var(--border-l);border-radius:5px;overflow:hidden}
.score-bar-fill{height:100%;border-radius:5px;background:var(--gradient);transition:width .6s var(--ease)}
.score-bar-label{font-size:11px;font-weight:700;color:var(--text2);min-width:50px;text-align:right}
.modal-overlay{position:fixed;inset:0;background:rgba(30,41,59,.45);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:mf .2s ease}
@keyframes mf{from{opacity:0}to{opacity:1}}
.modal-box{background:var(--card);border-radius:var(--r-xl);padding:0;max-width:520px;width:94%;box-shadow:var(--sh-l);animation:ms .3s ease;overflow:hidden}
@keyframes ms{from{opacity:0;transform:translateY(24px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
.modal-header{padding:24px 28px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.modal-title{font-family:var(--font-d);font-size:19px;font-weight:700}
.modal-close{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--border);background:var(--card);color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center}
.modal-body{padding:20px 28px 24px;max-height:50vh;overflow-y:auto}
.modal-assign-title{font-size:13px;font-weight:600;color:var(--text2);margin-bottom:4px}
.modal-assign-name{font-size:15px;font-weight:700;color:var(--text);margin-bottom:18px}
.class-list{display:flex;flex-direction:column;gap:8px}
.class-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1.5px solid var(--border);border-radius:var(--r-m);cursor:pointer;transition:all .2s var(--ease)}
.class-row:hover{border-color:var(--primary);background:var(--hover)}
.class-row.selected{border-color:var(--primary);background:var(--primary-light)}
.class-checkbox{width:22px;height:22px;border-radius:6px;border:2px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.class-row.selected .class-checkbox{border-color:var(--primary);background:var(--primary);color:var(--inv)}
.class-row-info{flex:1}
.class-row-name{font-size:14px;font-weight:700;color:var(--text)}
.class-row-students{font-size:12px;color:var(--text3);font-weight:500}
.class-row-status{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px}
.class-row-status.assigned{background:var(--green-l);color:var(--green)}
.class-row-status.new{background:var(--primary-light);color:var(--primary)}
.modal-footer{padding:16px 28px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--sidebar-bg)}
.modal-footer-info{font-size:12px;color:var(--text3);font-weight:600}
.modal-footer-actions{display:flex;gap:8px}
.confirm-modal .modal-body{text-align:center;padding:32px 28px}
.confirm-icon{width:60px;height:60px;border-radius:50%;margin:0 auto 18px;display:flex;align-items:center;justify-content:center}
.confirm-title{font-family:var(--font-d);font-size:20px;font-weight:700;margin-bottom:8px}
.confirm-text{font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:20px}
.confirm-btns{display:flex;gap:10px;justify-content:center}
.empty-state{text-align:center;padding:60px 20px;background:var(--card);border:1px solid var(--border);border-radius:var(--r-l)}
.empty-icon{width:72px;height:72px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
.empty-title{font-family:var(--font-d);font-size:20px;font-weight:700;margin-bottom:8px}
.empty-text{font-size:14px;color:var(--text3);margin-bottom:20px}
.toast{position:fixed;bottom:28px;right:28px;padding:13px 22px;border-radius:var(--r-m);font-size:13px;font-weight:600;font-family:var(--font);box-shadow:var(--sh-l);z-index:2000;display:flex;align-items:center;gap:8px}
.toast.success{background:var(--green);color:var(--inv)}
.toast.info{background:var(--primary);color:var(--inv)}
.toast.error{background:var(--red);color:var(--inv)}
.error-text{font-size:13px;color:var(--red);font-weight:600}
@media(max-width:900px){.stats-row{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.stats-row{grid-template-columns:1fr}.cards-grid{grid-template-columns:1fr}.page{padding:16px 10px 40px}.toolbar{flex-direction:column}.page-title-row{flex-direction:column;align-items:flex-start}.tabs{overflow-x:auto}}
`;

const normalizeStatus = (status) => {
  const s = String(status || "").toUpperCase();
  if (s === "PUBLISHED") return "published";
  if (s === "DRAFT") return "draft";
  if (s === "ARCHIVED") return "archived";
  return "draft";
};

const normalizeCategory = (category) =>
  String(category || "").toUpperCase() === "TEST" ? "test" : "homework";

const normalizeFormat = (format) => {
  const f = String(format || "").toUpperCase();
  if (f === "MULTIPLE_CHOICE" || f === "MC") return "mc";
  if (f === "ESSAY") return "essay";
  return "mixed";
};

const formatLabel = (format) => {
  if (format === "mc") return "Trắc nghiệm";
  if (format === "essay") return "Tự luận";
  return "Hỗn hợp";
};

const statusLabel = (status) => {
  if (status === "published") return "Xuất bản";
  if (status === "archived") return "Lưu trữ";
  return "Nháp";
};

const toDisplayDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return "-";
  }
};

const toUiAssignment = (item) => ({
  id: item.id,
  title: item.title || `Bài tập #${item.id}`,
  subject: item.subject || item.subjectName || "Chưa phân môn",
  category: normalizeCategory(item.category),
  format: normalizeFormat(item.format),
  status: normalizeStatus(item.status),
  totalScore: Number(item.totalScore ?? 0),
  questionCount: Number(item.numberOfQuestions ?? item.questionCount ?? 0),
  duration:
    item?.setting?.durationMinutes ??
    item.durationMinutes ??
    item.duration ??
    null,
  createdAt: item.updatedAt || item.createdAt,
  assignedClasses:
    Array.isArray(item.classroomIds) && item.classroomIds.length > 0
      ? item.classroomIds.map((id) => String(id))
      : Array.isArray(item.assignedClasses)
        ? item.assignedClasses.map((id) => String(id))
        : [],
  submissions: Number(item.submissions ?? item.submissionCount ?? 0),
  avgScore: Number(item.avgScore ?? item.averageScore ?? 0),
});

export default function AssignmentHubPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [assignModal, setAssignModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [toast, setToast] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchAssignments = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await assignmentApi.getAssignments({
          page: 1,
          size: 100,
        });
        if (!mounted) return;

        const list = Array.isArray(response?.result?.content)
          ? response.result.content
          : [];

        setAssignments(list.map(toUiAssignment));
      } catch (err) {
        if (!mounted) return;
        setAssignments([]);
        setError(
          err?.response?.data?.message ||
            "Không thể tải danh sách bài tập. Vui lòng thử lại.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAssignments();

    return () => {
      mounted = false;
    };
  }, [refreshTick]);

  const subjects = useMemo(() => {
    const fromData = Array.from(
      new Set(assignments.map((item) => item.subject).filter(Boolean)),
    );
    return fromData.length > 0 ? fromData : SUBJECTS;
  }, [assignments]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const goToDetail = (assignmentId) => {
    navigate(PATH_TEACHER.assignmentDetail(assignmentId));
  };

  const filtered = assignments.filter((item) => {
    if (tab === "published" && item.status !== "published") return false;
    if (tab === "draft" && item.status !== "draft") return false;
    if (tab === "archived" && item.status !== "archived") return false;
    if (subjectFilter && item.subject !== subjectFilter) return false;
    if (formatFilter && item.format !== formatFilter) return false;
    if (
      search &&
      !String(item.title || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const counts = {
    all: assignments.length,
    published: assignments.filter((item) => item.status === "published").length,
    draft: assignments.filter((item) => item.status === "draft").length,
    archived: assignments.filter((item) => item.status === "archived").length,
  };

  const totalSubs = assignments.reduce(
    (sum, item) => sum + (item.submissions || 0),
    0,
  );
  const avgScore =
    assignments.filter((item) => item.avgScore > 0).length > 0
      ? (
          assignments
            .filter((item) => item.avgScore > 0)
            .reduce((sum, item) => sum + item.avgScore, 0) /
          assignments.filter((item) => item.avgScore > 0).length
        ).toFixed(1)
      : "-";

  const openAssign = (assignment) => {
    setSelectedClasses([...(assignment.assignedClasses || [])]);
    setAssignModal(assignment);
  };

  const toggleClass = (classId) => {
    setSelectedClasses((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId],
    );
  };

  const confirmAssign = () => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.id === assignModal.id
          ? { ...item, assignedClasses: [...selectedClasses] }
          : item,
      ),
    );
    setAssignModal(null);
    showToast("Đã giao bài tập thành công");
  };

  const duplicate = (assignment) => {
    const copy = {
      ...assignment,
      id: Date.now(),
      title: `${assignment.title} (bản sao)`,
      status: "draft",
      assignedClasses: [],
      submissions: 0,
      avgScore: 0,
      createdAt: new Date().toISOString(),
    };
    setAssignments((prev) => [copy, ...prev]);
    showToast("Đã nhân bản bài tập", "info");
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    try {
      await assignmentApi.deleteAssignment(deleteModal.id);
      setAssignments((prev) =>
        prev.filter((item) => item.id !== deleteModal.id),
      );
      setDeleteModal(null);
      showToast("Đã xóa bài tập");
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          "Xóa bài tập thất bại. Vui lòng thử lại.",
        "error",
      );
    }
  };

  return (
    <div className="page">
      <style>{CSS}</style>

      <div className="page-top">
        <div className="breadcrumb">Khu vực làm việc / Ngân hàng bài tập</div>
        <div className="page-title-row">
          <h1 className="page-title">Thư viện bài tập</h1>
          <button
            className="btn btn-primary"
            onClick={() => navigate(PATH_TEACHER.assignmentCreateMethod)}
          >
            <Ic.Plus /> Tạo bài tập
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.Layers />
          </div>
          <div className="stat-val">{assignments.length}</div>
          <div className="stat-label">Tổng bài tập</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.Send />
          </div>
          <div className="stat-val">{counts.published}</div>
          <div className="stat-label">Đã xuất bản</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.Users />
          </div>
          <div className="stat-val">{totalSubs}</div>
          <div className="stat-label">Lượt nộp bài</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.Award />
          </div>
          <div className="stat-val">{avgScore}</div>
          <div className="stat-label">Điểm TB</div>
        </div>
      </div>

      <div className="tabs">
        {[
          ["all", "Tất cả"],
          ["published", "Đã xuất bản"],
          ["draft", "Bản nháp"],
          ["archived", "Lưu trữ"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`tab${tab === key ? " active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label} <span className="tab-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Ic.Search />
          <input
            className="search-input"
            placeholder="Tìm kiếm bài tập..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.target.value)}
        >
          <option value="">Tất cả môn học</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={formatFilter}
          onChange={(event) => setFormatFilter(event.target.value)}
        >
          <option value="">Định dạng</option>
          <option value="mc">Trắc nghiệm</option>
          <option value="essay">Tự luận</option>
          <option value="mixed">Hỗn hợp</option>
        </select>

        <div className="view-toggle">
          <button
            className={`vt-btn${viewMode === "grid" ? " active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <Ic.Grid />
          </button>
          <button
            className={`vt-btn${viewMode === "list" ? " active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <Ic.List />
          </button>
        </div>

        <button
          className="btn btn-ghost"
          onClick={() => setRefreshTick((prev) => prev + 1)}
          disabled={loading}
        >
          <Ic.Refresh /> Làm mới
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <div className="empty-state">
          <div className="empty-title">Đang tải danh sách bài tập...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Ic.FileText />
          </div>
          <div className="empty-title">Không tìm thấy bài tập</div>
          <div className="empty-text">Thử đổi bộ lọc hoặc tạo bài tập mới.</div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(PATH_TEACHER.assignmentCreateMethod)}
          >
            <Ic.Plus /> Tạo bài tập
          </button>
        </div>
      ) : (
        <div
          className="cards-grid"
          style={viewMode === "list" ? { gridTemplateColumns: "1fr" } : {}}
        >
          {filtered.map((assignment, index) => (
            <div
              key={assignment.id}
              className="a-card"
              style={{ animationDelay: `${index * 0.04}s` }}
              onClick={() => goToDetail(assignment.id)}
            >
              <div className="a-card-top">
                <div className="a-card-badge-row">
                  <span
                    className={`badge ${assignment.status === "published" ? "badge-pub" : assignment.status === "draft" ? "badge-draft" : "badge-arch"}`}
                  >
                    {statusLabel(assignment.status)}
                  </span>
                  <span
                    className={`badge ${assignment.category === "test" ? "badge-test" : "badge-hw"}`}
                  >
                    {assignment.category === "test" ? "Kiểm tra" : "Bài tập"}
                  </span>
                  <span className="badge badge-subject">
                    {assignment.subject}
                  </span>
                </div>

                <div className="a-title">{assignment.title}</div>

                <div className="a-meta">
                  <span className="a-meta-item">
                    <Ic.FileText /> {assignment.questionCount} câu
                  </span>
                  <span className="a-meta-item">
                    <Ic.BarChart /> {formatLabel(assignment.format)}
                  </span>
                  {assignment.duration ? (
                    <span className="a-meta-item">
                      <Ic.Clock /> {assignment.duration} phút
                    </span>
                  ) : null}
                  <span className="a-meta-item">
                    <Ic.Calendar /> {toDisplayDate(assignment.createdAt)}
                  </span>
                </div>

                {assignment.submissions > 0 ? (
                  <div className="score-bar-wrap">
                    <div className="score-bar-track">
                      <div
                        className="score-bar-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            assignment.totalScore > 0
                              ? (assignment.avgScore / assignment.totalScore) *
                                  100
                              : 0,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="score-bar-label">
                      TB: {assignment.avgScore}/{assignment.totalScore}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="a-card-divider" />

              <div className="a-card-bottom">
                <div className="assigned-classes">
                  {assignment.assignedClasses.length === 0 ? (
                    <span className="no-class">Chưa giao lớp nào</span>
                  ) : (
                    <>
                      {assignment.assignedClasses.slice(0, 3).map((classId) => {
                        const classroom = CLASSES.find(
                          (item) => item.id === classId,
                        );
                        return classroom ? (
                          <span key={classId} className="class-chip">
                            {classroom.name}
                          </span>
                        ) : (
                          <span key={classId} className="class-chip">
                            {classId}
                          </span>
                        );
                      })}
                      {assignment.assignedClasses.length > 3 ? (
                        <span className="class-more">
                          +{assignment.assignedClasses.length - 3}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>

                <div className="a-card-actions">
                  <button
                    className="act-btn"
                    title="Xem"
                    onClick={(event) => {
                      event.stopPropagation();
                      goToDetail(assignment.id);
                    }}
                  >
                    <Ic.Eye />
                  </button>
                  <button
                    className="act-btn"
                    title="Giao bài"
                    onClick={(event) => {
                      event.stopPropagation();
                      openAssign(assignment);
                    }}
                  >
                    <Ic.Share />
                  </button>
                  <button
                    className="act-btn"
                    title="Chỉnh sửa"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(
                        `${PATH_TEACHER.assignmentCreateManual}?assignmentId=${assignment.id}`,
                      );
                    }}
                  >
                    <Ic.Edit />
                  </button>
                  <button
                    className="act-btn"
                    title="Nhân bản"
                    onClick={(event) => {
                      event.stopPropagation();
                      duplicate(assignment);
                    }}
                  >
                    <Ic.Copy />
                  </button>
                  <button
                    className="act-btn danger"
                    title="Xóa"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteModal(assignment);
                    }}
                  >
                    <Ic.Trash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {assignModal ? (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div
            className="modal-box"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Giao bài tập cho lớp</div>
              <button
                className="modal-close"
                onClick={() => setAssignModal(null)}
              >
                <Ic.X />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-assign-title">Bài tập</div>
              <div className="modal-assign-name">{assignModal.title}</div>
              <div className="class-list">
                {CLASSES.map((classroom) => {
                  const selected = selectedClasses.includes(classroom.id);
                  const wasAssigned = assignModal.assignedClasses.includes(
                    classroom.id,
                  );

                  return (
                    <div
                      key={classroom.id}
                      className={`class-row${selected ? " selected" : ""}`}
                      onClick={() => toggleClass(classroom.id)}
                    >
                      <div className="class-checkbox">
                        {selected ? <Ic.Check /> : null}
                      </div>
                      <div className="class-row-info">
                        <div className="class-row-name">
                          Lớp {classroom.name}
                        </div>
                        <div className="class-row-students">
                          {classroom.students} học sinh
                        </div>
                      </div>
                      {wasAssigned ? (
                        <span className="class-row-status assigned">
                          Đã giao
                        </span>
                      ) : null}
                      {!wasAssigned && selected ? (
                        <span className="class-row-status new">Mới</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-footer-info">
                {selectedClasses.length} lớp được chọn
              </div>
              <div className="modal-footer-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => setAssignModal(null)}
                >
                  Hủy
                </button>
                <button className="btn btn-primary" onClick={confirmAssign}>
                  <Ic.Send /> Xác nhận giao
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModal ? (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div
            className="modal-box confirm-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-body">
              <div
                className="confirm-icon"
                style={{ background: "var(--red-l)", color: "var(--red)" }}
              >
                <Ic.Trash />
              </div>
              <div className="confirm-title">Xóa bài tập?</div>
              <div className="confirm-text">
                Bạn có chắc muốn xóa "<strong>{deleteModal.title}</strong>"?
                {deleteModal.submissions > 0
                  ? ` Bài tập này đã có ${deleteModal.submissions} lượt nộp bài.`
                  : ""}
                <br />
                Hành động này không thể hoàn tác.
              </div>
              <div className="confirm-btns">
                <button
                  className="btn btn-ghost"
                  onClick={() => setDeleteModal(null)}
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
                  onClick={confirmDelete}
                >
                  <Ic.Trash /> Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <Ic.Check /> : <Ic.Layers />}
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}
