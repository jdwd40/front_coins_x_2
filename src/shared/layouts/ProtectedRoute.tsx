import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store';

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, checkTokenExpiry } = useAuthStore();
  const location = useLocation();

  const tokenValid = checkTokenExpiry();

  if (!isAuthenticated || !tokenValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

