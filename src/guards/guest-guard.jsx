import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PATH_TEACHER } from '@/routes/paths';

/**
 * Chặn trang dành cho khách (login, register…).
 * Nếu đã đăng nhập → chuyển hướng về trang chủ của teacher.
 */
const GuestGuard = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={PATH_TEACHER.classroom.root} replace />;
  }

  return children;
};

export default GuestGuard;
