// ─── GUEST / AUTH ─────────────────────────────────────────────────────────────
const path = (root, sublink) => `${root}${sublink}`;

const ROOTS_TEACHER = "/";

export const PATH_AUTH = {
  root: "/",
  home: "/home",
  plans: "/plans",
  login: "/login",
  adminLogin: "/admin/login",
  register: "/register",
  terms: "/terms-of-service",
  privacy: "/privacy-policy",
  verifyOtp: "/verify-otp",
  oauth2Redirect: "/oauth2/redirect",
  selectRole: "/select-role",
  forgotPassword: "/forgot-password",
  forgotPasswordOtp: "/forgot-password/verify-otp",
  resetPassword: "/reset-password",
};

// ─── COMMON (All authenticated users) ─────────────────────────────────────────
export const PATH_COMMON = {
  profile: "/profile",
  changePassword: "/change-password",
};

// ─── TEACHER ──────────────────────────────────────────────────────────────────
export const PATH_TEACHER = {
  root: "/",
  classroom: {
    root: "/classrooms",
    detail: (id) => `/classrooms/${id}`,
    create: "/classrooms/new",
    edit: (id) => `/classrooms/${id}/edit`,
    pendingRequests: (id) => `/classrooms/${id}/pending-requests`,
    schedule: (id) => `/classrooms/${id}/schedule`,
    folders: (id) => `/classrooms/${id}/folders`,
    attendance: (id) => `/classrooms/${id}/attendance`,
    attendanceSession: (id, sessionId) => `/classrooms/${id}/attendance/${sessionId}`,
  },
  students: path(ROOTS_TEACHER, "/students"),
  documents: path(ROOTS_TEACHER, "/documents"),
  questionBank: path(ROOTS_TEACHER, "/question-bank"),
  questionBankDetail: (bankId) =>
    path(ROOTS_TEACHER, `/question-bank/${bankId}`),
  questionBankEdit: (bankId) =>
    path(ROOTS_TEACHER, `/question-bank/${bankId}/edit`),
  questionBankMethod: (bankId) =>
    path(ROOTS_TEACHER, `/question-bank/${bankId}/questions/create-method`),
  questionBankImport: (bankId) =>
    path(ROOTS_TEACHER, `/question-bank/${bankId}/import`),
  questionBankAi: (bankId) =>
    path(ROOTS_TEACHER, `/question-bank/${bankId}/ai`),
  questionBankManual: (bankId) =>
    path(ROOTS_TEACHER, `/question-bank/${bankId}/manual`),
  reports: path(ROOTS_TEACHER, "/reports"),
};

// ─── STUDENT ──────────────────────────────────────────────────────────────────
export const PATH_STUDENT = {
  root: "/",
  classroom: {
    root: "/classrooms",
    detail: (id) => `/classrooms/${id}`,
  },
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const PATH_ADMIN = {
  root: "/admin",
  dashboard: "/admin/dashboard",
  users: {
    root: "/admin/users",
    detail: (id) => `/admin/users/${id}`,
  },
  subscriptions: {
    root: "/admin/subscriptions",
    detail: (id) => `/admin/subscriptions/${id}`,
  },
  plans: {
    root: "/admin/plans",
    detail: (id) => `/admin/plans/${id}`,
  },
  classroom: {
    root: "/admin/classrooms",
    detail: (id) => `/admin/classrooms/${id}`,
  },
  reports: "/admin/reports",
  systemNotifications: "/admin/system-notifications",
  settings: "/admin/settings",
};
