import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PATH_ADMIN } from '@/routes/paths';
import { PATH_TEACHER } from '@/routes/paths';

/**
 * Chặn trang dành cho khách (login, register…).
 * Nếu đã đăng nhập → chuyển hướng về trang chủ của teacher.
 */
const GuestGuard = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    if (user?.role === "ROLE_ADMIN") {
      return <Navigate to={PATH_ADMIN.users.root} replace />;
    }
    return <Navigate to={PATH_TEACHER.classroom.root} replace />;
  }

  return children;
};

export default GuestGuard;
