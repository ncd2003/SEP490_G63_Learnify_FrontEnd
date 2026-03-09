/**
 * Helper: nối root + sublink thành đường dẫn hoàn chỉnh
 * @param {string} root
 * @param {string} sublink
 * @returns {string}
 */
const path = (root, sublink) => `${root}${sublink}`;

// ─── ROOT SEGMENTS ────────────────────────────────────────────────────────────
const ROOTS_GUEST    = '/';
const ROOTS_TEACHER  = '';  // Removed /teacher prefix
const ROOTS_STUDENT  = '';  // Removed /student prefix
const ROOTS_ADMIN    = '/admin';

// ─── GUEST / AUTH ─────────────────────────────────────────────────────────────
export const PATH_AUTH = {
  root:           ROOTS_GUEST,
  home:           '/home',                           // trang chủ public
  login:          path(ROOTS_GUEST, '/login'),
  register:       path(ROOTS_GUEST, '/register'),
  verifyOtp:      path(ROOTS_GUEST, '/verify-otp'),
  oauth2Redirect: path(ROOTS_GUEST, '/oauth2/redirect'),
};

// ─── TEACHER ──────────────────────────────────────────────────────────────────
export const PATH_TEACHER = {
  root: '/',  // Default root without /teacher prefix
  profile: path(ROOTS_TEACHER, '/profile'),
  classroom: {
    root:   path(ROOTS_TEACHER, '/classrooms'),
    detail: (id) => path(ROOTS_TEACHER, `/classrooms/${id}`),
    create: path(ROOTS_TEACHER, '/classrooms/new'),
    edit:   (id) => path(ROOTS_TEACHER, `/classrooms/${id}/edit`),
    pendingRequests: (id) => path(ROOTS_TEACHER, `/classrooms/${id}/pending-requests`),
  },
  schedule:   path(ROOTS_TEACHER, '/schedule'),
  students:   path(ROOTS_TEACHER, '/students'),
  documents:  path(ROOTS_TEACHER, '/documents'),
  questionBank: path(ROOTS_TEACHER, '/question-bank'),
  reports:    path(ROOTS_TEACHER, '/reports'),
};

// ─── STUDENT ──────────────────────────────────────────────────────────────────
export const PATH_STUDENT = {
  root: '/',  // Default root without /student prefix
  profile: path(ROOTS_STUDENT, '/profile'),
  classroom: {
    root:   path(ROOTS_STUDENT, '/classrooms'),
    detail: (id) => path(ROOTS_STUDENT, `/classrooms/${id}`),
  },
  schedule: path(ROOTS_STUDENT, '/schedule'),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const PATH_ADMIN = {
  root: ROOTS_ADMIN,
  users: {
    root:   path(ROOTS_ADMIN, '/users'),
    detail: (id) => path(ROOTS_ADMIN, `/users/${id}`),
  },
  classroom: {
    root:   path(ROOTS_ADMIN, '/classrooms'),
    detail: (id) => path(ROOTS_ADMIN, `/classrooms/${id}`),
  },
  reports:  path(ROOTS_ADMIN, '/reports'),
  settings: path(ROOTS_ADMIN, '/settings'),
};
