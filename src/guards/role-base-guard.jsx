import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PATH_AUTH, PATH_TEACHER, PATH_STUDENT, PATH_ADMIN } from "@/routes/paths";
import Login from "@/pages/Login";

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
    if (pathname === "/") {
      return <Navigate to={PATH_AUTH.login} />;
    }
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-5xl">
          <Login />
        </div>
      </div>
    );
  }

  const userRole = user?.role;

  if (userRole !== role) {
    switch (userRole) {
      case "ROLE_TEACHER":
        return <Navigate to={PATH_TEACHER.classroom.root} replace />;
      case "ROLE_STUDENT":
        return <Navigate to={PATH_STUDENT.classroom.root} replace />;
      case "ROLE_ADMIN":
        return <Navigate to={PATH_ADMIN.users.root} replace />;
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
