import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_TEACHER } from "@/routes/paths";
import { usePendingSessions } from "@/hooks/use-pending-sessions";
import "@/assets/css/pages/classroom/assignments/assignment-page.css";

/* ════════════════════════════════════
   ICONS
   ════════════════════════════════════ */
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
  Filter: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  MoreH: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
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
  ChevD: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
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
  Archive: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
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

/* ════════════════════════════════════
   CSS
   ════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');

:root {
  --primary: #2563EB;
  --primary-dark: #1D4ED8;
  --primary-darker: #1E40AF;
  --primary-light: #EFF6FF;
  --primary-lighter: #F8FAFF;
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
body{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}

.page{max-width:1200px;margin:0 auto;padding:28px 32px 60px}

/* ═══ HEADER ═══ */
.page-top{margin-bottom:28px}
.breadcrumb{font-size:12px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.page-title-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.page-title{font-family:var(--font-d);font-size:26px;font-weight:700;color:var(--text)}
.page-title-actions{display:flex;gap:10px}

.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:var(--r-m);font-size:13px;font-weight:700;font-family:var(--font);cursor:pointer;border:none;transition:all .2s var(--ease);white-space:nowrap}
.btn-primary{background:var(--gradient);color:var(--inv);box-shadow:0 3px 12px var(--primary-shadow)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 5px 18px var(--primary-shadow)}
.btn-ghost{background:var(--card);color:var(--text2);border:1.5px solid var(--border)}
.btn-ghost:hover{border-color:var(--primary);color:var(--primary);background:var(--hover)}

/* ═══ STAT CARDS ═══ */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
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

/* ═══ TOOLBAR ═══ */
.toolbar{background:var(--card);border:1px solid var(--border);border-radius:var(--r-l);padding:14px 20px;margin-bottom:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;box-shadow:var(--sh-s)}

.search-box{flex:1;min-width:200px;position:relative}
.search-box svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3)}
.search-input{width:100%;padding:9px 12px 9px 36px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:13px;font-family:var(--font);font-weight:500;color:var(--text);background:var(--input-bg);transition:all .2s var(--ease)}
.search-input:focus{outline:none;border-color:var(--primary);background:var(--card);box-shadow:0 0 0 3px var(--primary-glow)}
.search-input::placeholder{color:var(--text3)}

.filter-select{padding:9px 32px 9px 12px;border:1.5px solid var(--border);border-radius:var(--r-m);font-size:12px;font-weight:600;font-family:var(--font);color:var(--text2);background:var(--card);appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;cursor:pointer;transition:all .2s var(--ease)}
.filter-select:focus{outline:none;border-color:var(--primary)}

.view-toggle{display:flex;border:1.5px solid var(--border);border-radius:var(--r-m);overflow:hidden}
.vt-btn{padding:8px 12px;background:var(--card);border:none;color:var(--text3);cursor:pointer;display:flex;align-items:center;transition:all .15s var(--ease)}
.vt-btn:first-child{border-right:1px solid var(--border)}
.vt-btn.active{background:var(--primary-light);color:var(--primary)}
.vt-btn:hover:not(.active){background:var(--hover)}

/* ═══ TABS ═══ */
.tabs{display:flex;gap:4px;margin-bottom:18px;background:var(--card);border:1px solid var(--border);border-radius:var(--r-l);padding:5px;box-shadow:var(--sh-s)}
.tab{padding:9px 20px;border-radius:var(--r-m);font-size:13px;font-weight:600;font-family:var(--font);color:var(--text3);cursor:pointer;border:none;background:none;transition:all .2s var(--ease);display:flex;align-items:center;gap:6px}
.tab:hover{color:var(--text2);background:var(--hover)}
.tab.active{background:var(--primary);color:var(--inv);box-shadow:0 2px 8px var(--primary-shadow)}
.tab-count{padding:2px 7px;border-radius:10px;font-size:10px;font-weight:800;background:rgba(255,255,255,.2)}
.tab:not(.active) .tab-count{background:var(--border-l);color:var(--text3)}

/* ═══ CARD GRID ═══ */
.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}

.a-card{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r-l);overflow:hidden;transition:all .25s var(--ease);cursor:default;animation:cardIn .35s ease-out both;position:relative}
.a-card:hover{box-shadow:var(--sh-m);border-color:var(--primary);transform:translateY(-3px)}

@keyframes cardIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

.a-card-top{padding:20px 22px 16px;position:relative}

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

.assigned-classes{display:flex;align-items:center;gap:6px}
.class-chip{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;background:var(--primary-light);color:var(--primary-dark);border:1px solid rgba(37,99,235,.12)}
.class-more{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;background:var(--border-l);color:var(--text3)}

.no-class{font-size:11px;color:var(--text3);font-weight:500;font-style:italic}

.a-card-actions{display:flex;gap:2px}
.act-btn{width:32px;height:32px;border-radius:var(--r-s);border:none;background:none;color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--ease)}
.act-btn:hover{background:var(--hover);color:var(--primary)}
.act-btn.danger:hover{background:var(--red-l);color:var(--red)}

/* Score bar */
.score-bar-wrap{margin-top:10px;display:flex;align-items:center;gap:10px}
.score-bar-track{flex:1;height:5px;background:var(--border-l);border-radius:5px;overflow:hidden}
.score-bar-fill{height:100%;border-radius:5px;background:var(--gradient);transition:width .6s var(--ease)}
.score-bar-label{font-size:11px;font-weight:700;color:var(--text2);min-width:50px;text-align:right}

/* ═══ ASSIGN MODAL ═══ */
.modal-overlay{position:fixed;inset:0;background:rgba(30,41,59,.45);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:mf .2s ease}
@keyframes mf{from{opacity:0}to{opacity:1}}
.modal-box{background:var(--card);border-radius:var(--r-xl);padding:0;max-width:520px;width:94%;box-shadow:var(--sh-l);animation:ms .3s ease;overflow:hidden}
@keyframes ms{from{opacity:0;transform:translateY(24px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}

.modal-header{padding:24px 28px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.modal-title{font-family:var(--font-d);font-size:19px;font-weight:700}
.modal-close{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--border);background:var(--card);color:var(--text3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s var(--ease)}
.modal-close:hover{background:var(--red-l);color:var(--red);border-color:var(--red)}

.modal-body{padding:20px 28px 24px;max-height:50vh;overflow-y:auto}

.modal-assign-title{font-size:13px;font-weight:600;color:var(--text2);margin-bottom:4px}
.modal-assign-name{font-size:15px;font-weight:700;color:var(--text);margin-bottom:18px}

.class-list{display:flex;flex-direction:column;gap:8px}

.class-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1.5px solid var(--border);border-radius:var(--r-m);cursor:pointer;transition:all .2s var(--ease)}
.class-row:hover{border-color:var(--primary);background:var(--hover)}
.class-row.selected{border-color:var(--primary);background:var(--primary-light)}

.class-checkbox{width:22px;height:22px;border-radius:6px;border:2px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;transition:all .2s var(--ease);flex-shrink:0}
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

/* ═══ DELETE CONFIRM ═══ */
.confirm-modal .modal-body{text-align:center;padding:32px 28px}
.confirm-icon{width:60px;height:60px;border-radius:50%;margin:0 auto 18px;display:flex;align-items:center;justify-content:center}
.confirm-title{font-family:var(--font-d);font-size:20px;font-weight:700;margin-bottom:8px}
.confirm-text{font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:20px}
.confirm-btns{display:flex;gap:10px;justify-content:center}

/* ═══ EMPTY STATE ═══ */
.empty-state{text-align:center;padding:60px 20px}
.empty-icon{width:72px;height:72px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
.empty-title{font-family:var(--font-d);font-size:20px;font-weight:700;margin-bottom:8px}
.empty-text{font-size:14px;color:var(--text3);margin-bottom:20px}

/* ═══ TOAST ═══ */
.toast{position:fixed;bottom:28px;right:28px;padding:13px 22px;border-radius:var(--r-m);font-size:13px;font-weight:600;font-family:var(--font);box-shadow:var(--sh-l);z-index:2000;animation:toastIn .35s ease;display:flex;align-items:center;gap:8px}
.toast.success{background:var(--green);color:var(--inv)}
.toast.info{background:var(--primary);color:var(--inv)}
@keyframes toastIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* ═══ RESPONSIVE ═══ */
@media(max-width:900px){.stats-row{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.stats-row{grid-template-columns:1fr}.cards-grid{grid-template-columns:1fr}.page{padding:16px 12px 40px}.toolbar{flex-direction:column}.page-title-row{flex-direction:column;align-items:flex-start}.tabs{overflow-x:auto}}
`;

const AssignmentPage = () => {
  const navigate = useNavigate();
  const { pendingSessions } = usePendingSessions("ASSIGNMENT");

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const firstPendingSession =
    pendingSessions.size > 0 ? Array.from(pendingSessions.values())[0] : null;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        const response = await assignmentApi.getAssignments({
          page: 1,
          size: 100,
        });
        setAssignments(response?.result?.items || []);
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
        showToast("Lỗi tải danh sách bài tập", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  // Filter assignments
  const filtered = assignments.filter((a) => {
    if (tab === "published" && a.status !== "PUBLISHED") return false;
    if (tab === "draft" && a.status !== "DRAFT") return false;
    if (tab === "archived" && a.status !== "ARCHIVED") return false;
    if (subjectFilter && a.subject !== subjectFilter) return false;
    if (formatFilter && a.format !== formatFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const counts = {
    all: assignments.length,
    published: assignments.filter((a) => a.status === "PUBLISHED").length,
    draft: assignments.filter((a) => a.status === "DRAFT").length,
    archived: assignments.filter((a) => a.status === "ARCHIVED").length,
  };

  const handleCreateNew = () => {
    navigate(PATH_TEACHER.assignmentCreateMethod);
  };

  const handleResumeDraft = () => {
    if (firstPendingSession) {
      navigate(
        `${PATH_TEACHER.assignmentCreateManual}?assignmentId=${firstPendingSession.targetId}`,
      );
    }
  };

  const handleViewAssignment = (id) => {
    navigate(`${PATH_TEACHER.assignmentCreateManual}?assignmentId=${id}`);
  };

  const handleDuplicateAssignment = (assignment) => {
    showToast("Tính năng nhân bản sẽ được hoàn thành sớm", "info");
  };

  const handleDeleteAssignment = (assignment) => {
    showToast("Tính năng xóa sẽ được hoàn thành sớm", "info");
  };

  const formatLabel = (f) =>
    f === "MC" ? "Trắc nghiệm" : f === "ESSAY" ? "Tự luận" : "Hỗn hợp";

  return (
    <div className="page">
      <style>{CSS}</style>

      {/* Header */}
      <div className="page-top">
        <div className="breadcrumb">Khu vực làm việc / Ngân hàng bài tập</div>
        <div className="page-title-row">
          <h1 className="page-title">Thư viện bài tập</h1>
          <div className="page-title-actions">
            <button className="btn btn-primary" onClick={handleCreateNew}>
              <Ic.Plus /> Tạo bài tập
            </button>
          </div>
        </div>
      </div>

      {/* Pending Draft Banner */}
      {firstPendingSession?.hasPending && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            marginBottom: "24px",
            borderRadius: "10px",
            backgroundColor: "#FFFAEB",
            border: "1px solid #FFE16B",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                backgroundColor: "#FCD34D",
                borderRadius: "50%",
                flexShrink: 0,
              }}
            >
              <Ic.Clock />
            </div>
            <div>
              <div
                style={{ fontSize: "14px", fontWeight: 600, color: "#78350F" }}
              >
                Bạn có bản nháp chưa hoàn thành
              </div>
              <div
                style={{ fontSize: "13px", color: "#92400E", marginTop: "2px" }}
              >
                {firstPendingSession.targetName || "Bài tập"} —{" "}
                {firstPendingSession.itemCount || 0} câu hỏi
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button className="btn btn-primary" onClick={handleResumeDraft}>
              <Ic.Send /> Tiếp tục chỉnh sửa
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
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
            <Ic.BarChart />
          </div>
          <div className="stat-val">{counts.draft}</div>
          <div className="stat-label">Bản nháp</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Ic.Archive />
          </div>
          <div className="stat-val">{counts.archived}</div>
          <div className="stat-label">Đã lưu trữ</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          ["all", "Tất cả"],
          ["published", "Đã xuất bản"],
          ["draft", "Bản nháp"],
          ["archived", "Lưu trữ"],
        ].map(([k, l]) => (
          <button
            key={k}
            className={`tab${tab === k ? " active" : ""}`}
            onClick={() => setTab(k)}
          >
            {l} <span className="tab-count">{counts[k]}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Ic.Search />
          <input
            className="search-input"
            placeholder="Tìm kiếm bài tập..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="">Tất cả môn học</option>
          {Array.from(new Set(assignments.map((a) => a.subject)))
            .filter(Boolean)
            .map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
        <select
          className="filter-select"
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
        >
          <option value="">Định dạng</option>
          <option value="MC">Trắc nghiệm</option>
          <option value="ESSAY">Tự luận</option>
          <option value="MIXED">Hỗn hợp</option>
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
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="empty-state">
          <div style={{ fontSize: "14px", color: "var(--text2)" }}>
            Đang tải...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Ic.FileText />
          </div>
          <div className="empty-title">Không tìm thấy bài tập</div>
          <div className="empty-text">
            Thử thay đổi bộ lọc hoặc tạo bài tập mới.
          </div>
          <button className="btn btn-primary" onClick={handleCreateNew}>
            <Ic.Plus /> Tạo bài tập
          </button>
        </div>
      ) : (
        <div
          className="cards-grid"
          style={viewMode === "list" ? { gridTemplateColumns: "1fr" } : {}}
        >
          {filtered.map((a, i) => (
            <div
              key={a.id}
              className="a-card"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="a-card-top">
                <div className="a-card-badge-row">
                  <span
                    className={`badge ${a.status === "PUBLISHED" ? "badge-pub" : a.status === "DRAFT" ? "badge-draft" : "badge-arch"}`}
                  >
                    {a.status === "PUBLISHED"
                      ? "Xuất bản"
                      : a.status === "DRAFT"
                        ? "Nháp"
                        : "Lưu trữ"}
                  </span>
                  <span
                    className={`badge ${a.category === "TEST" ? "badge-test" : "badge-hw"}`}
                  >
                    {a.category === "TEST" ? "Kiểm tra" : "Bài tập"}
                  </span>
                  {a.subject && (
                    <span className="badge badge-subject">{a.subject}</span>
                  )}
                </div>
                <div className="a-title">{a.title}</div>
                <div className="a-meta">
                  {a.totalQuestions && (
                    <span className="a-meta-item">
                      <Ic.FileText /> {a.totalQuestions} câu
                    </span>
                  )}
                  {a.format && (
                    <span className="a-meta-item">
                      <Ic.BarChart /> {formatLabel(a.format)}
                    </span>
                  )}
                  {a.durationMinutes && (
                    <span className="a-meta-item">
                      <Ic.Clock /> {a.durationMinutes} phút
                    </span>
                  )}
                  <span className="a-meta-item">
                    <Ic.Calendar />{" "}
                    {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
              <div className="a-card-divider" />
              <div className="a-card-bottom">
                <div className="assigned-classes">
                  <span className="no-class">
                    Chi tiết giao bài sẽ cập nhật
                  </span>
                </div>
                <div className="a-card-actions">
                  <button
                    className="act-btn"
                    title="Xem"
                    onClick={() => handleViewAssignment(a.id)}
                  >
                    <Ic.Eye />
                  </button>
                  <button
                    className="act-btn"
                    title="Chỉnh sửa"
                    onClick={() => handleViewAssignment(a.id)}
                  >
                    <Ic.Edit />
                  </button>
                  <button
                    className="act-btn"
                    title="Nhân bản"
                    onClick={() => handleDuplicateAssignment(a)}
                  >
                    <Ic.Copy />
                  </button>
                  <button
                    className="act-btn danger"
                    title="Xóa"
                    onClick={() => handleDeleteAssignment(a)}
                  >
                    <Ic.Trash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <Ic.Check /> : <Ic.Layers />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default AssignmentPage;
