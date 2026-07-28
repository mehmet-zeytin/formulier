import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}