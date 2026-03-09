import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PATH_AUTH } from '@/routes/paths';

/**
 * Bảo vệ trang yêu cầu đăng nhập.
 * Nếu chưa đăng nhập → chuyển hướng về trang login, lưu lại returnUrl.
 */
const AuthGuard = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={PATH_AUTH.login}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

export default AuthGuard;
