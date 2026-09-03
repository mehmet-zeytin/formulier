import {
  useEffect,
  useState
} from 'react';

import type {
  ReactNode
} from 'react';

import {
  Navigate
} from 'react-router-dom';

import {
  getCurrentUserFromServer,
  type CurrentUserResponse,
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
  const [
    user,
    setUser
  ] =
    useState<CurrentUserResponse | null>(
      null
    );

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    unauthorized,
    setUnauthorized
  ] =
    useState(false);

  useEffect(() => {
    let active =
      true;

    const loadUser =
      async () => {
        try {
          const currentUser =
            await getCurrentUserFromServer();

          if (!active) {
            return;
          }

          setUser(
            currentUser
          );
        } catch {
          if (!active) {
            return;
          }

          setUnauthorized(
            true
          );
        } finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      };

    void loadUser();

    return () => {
      active =
        false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Laden...
      </div>
    );
  }

  if (
    unauthorized ||
    !user
  ) {
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

  return (
    <>
      {children}
    </>
  );
}