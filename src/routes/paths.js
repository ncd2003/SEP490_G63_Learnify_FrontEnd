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
  plans: "/plans",
  login: "/login",
  adminLogin: "/admin/login",
  register: "/register",
  terms: "/terms-of-service",
  privacy: "/privacy-policy",
  accessDenied: "/access-denied",
  verifyOtp: "/verify-otp",
  oauth2Redirect: "/oauth2/redirect",
  selectRole: "/select-role",
  forgotPassword: "/forgot-password",
  forgotPasswordOtp: "/forgot-password/verify-otp",
  resetPassword: "/reset-password",
};

export const PATH_PAYMENT = {
  success: "/success",
  cancel: "/cancel",
};

// ─── COMMON (All authenticated users) ─────────────────────────────────────────
export const PATH_COMMON = {
  profile: "/profile",
  changePassword: "/change-password",
  notifications: "/notifications",
};

// ─── TEACHER ──────────────────────────────────────────────────────────────────
export const PATH_TEACHER = {
  root: "/",
  schedule: path(ROOTS_TEACHER, "/classrooms/schedule"),
  classroom: {
    root: "/classrooms",
    detail: (id) => `/classrooms/${id}`,
    create: "/classrooms/new",
    edit: (id) => `/classrooms/${id}/edit`,
    lecture: (id) => `/classrooms/${id}/lecture`,
    pendingRequests: (id) => `/classrooms/${id}/pending-requests`,
    schedule: (id) => `/classrooms/${id}/schedule`,
    recordings: (id) => `/classrooms/${id}/recordings`,
    assignments: (id) => `/classrooms/${id}/assignments`,
    assignmentCreateManual: (id) =>
      `/classrooms/${id}/assignments/create/manual`,
    assignmentCreateManualQuestions: (id) =>
      `/classrooms/${id}/assignments/create/manual/questions`,
    folders: (id) => `/classrooms/${id}/folders`,
    attendance: (id) => `/classrooms/${id}/attendance`,
    attendanceSession: (id, sessionId) =>
      `/classrooms/${id}/attendance/${sessionId}`,
  },
  assignments: path(ROOTS_TEACHER, "/assignments"),
  assignmentCreateMethod: path(ROOTS_TEACHER, "/assignments/create-method"),
  assignmentCreateAiSetup: path(ROOTS_TEACHER, "/assignments/create/ai/setup"),
  assignmentCreateAi: path(ROOTS_TEACHER, "/assignments/create/ai"),
  assignmentCreateManual: path(ROOTS_TEACHER, "/assignments/create/manual"),
  assignmentCreateManualQuestions: path(
    ROOTS_TEACHER,
    "/assignments/create/manual/questions",
  ),
  assignmentCreateManualQuestionsPreview: path(
    ROOTS_TEACHER,
    "/assignments/create/manual/questions/preview",
  ),
  assignmentDetail: (assignmentId) =>
    path(ROOTS_TEACHER, `/assignments/${assignmentId}`),
  assignmentSubmissions: (assignmentId) =>
    path(ROOTS_TEACHER, `/assignments/${assignmentId}/submissions`),
  assignmentAssignClasses: (assignmentId) =>
    path(ROOTS_TEACHER, `/assignments/${assignmentId}/assign-classes`),
  assignmentCreateImport: path(ROOTS_TEACHER, "/assignments/create/import"),
  assignmentQuestionBankPicker: path(
    ROOTS_TEACHER,
    "/assignments/question-bank-picker",
  ),
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
  assignmentResult: (submissionId) =>
    `/student/submissions/${submissionId}/result`,
  schedule: "/classrooms/schedule",
  classroom: {
    root: "/classrooms",
    detail: (id) => `/classrooms/${id}`,
    assignments: (id) => `/classrooms/${id}/assignments`,
    assignmentDo: (classId, assignmentId) =>
      `/classrooms/${classId}/assignments/${assignmentId}/start`,
    folders: (id) => `/classrooms/${id}/folders`,
    members: (id) => `/classrooms/${id}/pending-requests`,
    schedule: (id) => `/classrooms/${id}/schedule`,
    attendance: (id) => `/classrooms/${id}/attendance`,
  },
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const PATH_ADMIN = {
  root: "/admin",
  dashboard: "/admin/dashboard",
  revenueDashboard: "/admin/revenue-dashboard",
  transactionHistory: "/admin/transaction-history",
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
