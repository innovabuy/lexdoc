import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useExtranetStore } from '@/store/extranetStore';

interface ExtranetProtectedRouteProps {
  children: ReactNode;
}

export function ExtranetProtectedRoute({ children }: ExtranetProtectedRouteProps) {
  const { isAuthenticated } = useExtranetStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/extranet/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ExtranetProtectedRoute;
