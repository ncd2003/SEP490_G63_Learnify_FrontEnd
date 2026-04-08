import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeRole } from "@/lib/auth-role";
import { PATH_TEACHER, PATH_STUDENT, PATH_ADMIN } from "@/routes/paths";

/**
 * @param {{ role: string, children: import("react").ReactNode }} props
 */
const RoleBasedGuard = ({ children, role }) => {
  const { isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();
  const [requestedLocation, setRequestedLocation] = useState(null);

  if (!isAuthenticated) {
    if (pathname !== requestedLocation) {
      setRequestedLocation(pathname);
    }
    return <Navigate to="/" replace />;
  }

  const userRole = normalizeRole(user?.role);
  const requiredRole = normalizeRole(role);

  if (userRole !== requiredRole) {
    switch (userRole) {
      case "TEACHER":
        return <Navigate to={PATH_TEACHER.classroom.root} replace />;
      case "STUDENT":
        return <Navigate to={PATH_STUDENT.classroom.root} replace />;
      case "ADMIN":
        return <Navigate to={PATH_ADMIN.dashboard} replace />;
      default:
        return <Navigate to="/404" replace />;
    }
  }

  if (requestedLocation && pathname !== requestedLocation) {
    setRequestedLocation(null);
    return <Navigate to={requestedLocation} />;
  }

  return <>{children}</>;
};

export default RoleBasedGuard;
