const normalizeRole = (role) => {
  const rawRole = String(role || "").trim().toUpperCase();
  if (!rawRole) {
    return "";
  }
  return rawRole.startsWith("ROLE_") ? rawRole.slice(5) : rawRole;
};

const isAdminRole = (role) => normalizeRole(role) === "ADMIN";
const isTeacherRole = (role) => normalizeRole(role) === "TEACHER";
const isStudentRole = (role) => normalizeRole(role) === "STUDENT";

export { normalizeRole, isAdminRole, isTeacherRole, isStudentRole };