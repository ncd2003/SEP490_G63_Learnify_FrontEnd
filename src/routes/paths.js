// ─── GUEST / AUTH ─────────────────────────────────────────────────────────────
export const PATH_AUTH = {
  root: "/",
  home: "/home",
  login: "/login",
  register: "/register",
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
  },
  students: "/students",
  folders: "/folders",
  questionBank: "/question-bank",
  reports: "/reports",
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
  users: {
    root: "/admin/users",
    detail: (id) => `/admin/users/${id}`,
  },
  classroom: {
    root: "/admin/classrooms",
    detail: (id) => `/admin/classrooms/${id}`,
  },
  reports: "/admin/reports",
  settings: "/admin/settings",
};