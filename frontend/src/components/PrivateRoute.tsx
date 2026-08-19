import type {
  ReactNode
} from 'react';

import {
  Navigate
} from 'react-router-dom';

import {
  getCurrentUser,
  type UserRole
} from '../services/authService';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function PrivateRoute({
  children,
  allowedRoles
}: PrivateRouteProps) {
  const user =
    getCurrentUser();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(
      user.role
    )
  ) {
    return (
      <Navigate
        to="/werkorders"
        replace
      />
    );
  }

  return <>{children}</>;
}