// ─── GUEST / AUTH ─────────────────────────────────────────────────────────────
const path = (root, sublink = "") => {
  const normalizedRoot = String(root ?? "").replace(/\/+$/, "");
  const normalizedSublink = String(sublink ?? "").replace(/^\/+/, "");

  if (!normalizedRoot) {
    return `/${normalizedSublink}`;
  }

  if (!normalizedSublink) {
    return normalizedRoot;
  }

  return `${normalizedRoot}/${normalizedSublink}`;
};

const ROOTS_TEACHER = "/";

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
    assignments: (id) => `/classrooms/${id}/assignments`,
    assignmentCreateManual: (id) =>
      `/classrooms/${id}/assignments/create/manual`,
    assignmentCreateManualQuestions: (id) =>
      `/classrooms/${id}/assignments/create/manual/questions`,
  },
  assignments: path(ROOTS_TEACHER, "/assignments"),
  assignmentCreateMethod: path(ROOTS_TEACHER, "/assignments/create-method"),
  assignmentCreateAi: path(ROOTS_TEACHER, "/assignments/create/ai"),
  assignmentCreateManual: path(ROOTS_TEACHER, "/assignments/create/manual"),
  assignmentCreateManualQuestions: path(
    ROOTS_TEACHER,
    "/assignments/create/manual/questions",
  ),
  assignmentAssignClasses: (assignmentId) =>
    path(ROOTS_TEACHER, `/assignments/${assignmentId}/assign-classes`),
  assignmentCreateImport: path(ROOTS_TEACHER, "/assignments/create/import"),
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
