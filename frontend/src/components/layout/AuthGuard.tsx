import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const hasToken = token || localStorage.getItem('semimatrix_token') || localStorage.getItem('token');

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
