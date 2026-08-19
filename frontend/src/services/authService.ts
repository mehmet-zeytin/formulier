import {
  api
} from './api';

export type UserRole =
  | 'owner'
  | 'admin'
  | 'medewerker';

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

interface LoginResponse {
  token: string;
}

const TOKEN_KEY =
  'token';

export const login = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const response =
    await api.post<LoginResponse>(
      '/auth/login',
      {
        email,
        password
      }
    );

  const token =
    response.data.token;

  if (!token) {
    throw new Error(
      'Er is geen inlogtoken ontvangen van de server.'
    );
  }

  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  const user =
    getCurrentUser();

  if (!user) {
    localStorage.removeItem(
      TOKEN_KEY
    );

    throw new Error(
      'Er is een ongeldig inlogtoken ontvangen.'
    );
  }

  return user;
};

export const logout =
  (): void => {
    localStorage.removeItem(
      TOKEN_KEY
    );
  };

export const getToken =
  (): string | null => {
    return localStorage.getItem(
      TOKEN_KEY
    );
  };

export const getCurrentUser =
  (): AuthUser | null => {
    const token =
      getToken();

    if (!token) {
      return null;
    }

    try {
      const parts =
        token.split('.');

      if (
        parts.length !== 3
      ) {
        logout();
        return null;
      }

      const base64Url =
        parts[1];

      const base64 =
        base64Url
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(
            base64Url.length +
              (
                (
                  4 -
                  (
                    base64Url.length %
                    4
                  )
                ) %
                4
              ),
            '='
          );

      const payload =
        JSON.parse(
          decodeURIComponent(
            Array.from(
              atob(base64)
            )
              .map(
                character =>
                  `%${character
                    .charCodeAt(0)
                    .toString(16)
                    .padStart(
                      2,
                      '0'
                    )}`
              )
              .join('')
          )
        ) as Partial<AuthUser>;

      const validRole =
        payload.role ===
          'owner' ||
        payload.role ===
          'admin' ||
        payload.role ===
          'medewerker';

      if (
        typeof payload.userId !==
          'number' ||
        typeof payload.email !==
          'string' ||
        typeof payload.exp !==
          'number' ||
        typeof payload.iat !==
          'number' ||
        !validRole
      ) {
        logout();

        return null;
      }

      const nowInSeconds =
        Math.floor(
          Date.now() / 1000
        );

      if (
        payload.exp <=
        nowInSeconds
      ) {
        logout();

        return null;
      }

      return payload as AuthUser;
    } catch {
      logout();

      return null;
    }
  };

export const isAuthenticated =
  (): boolean => {
    return (
      getCurrentUser() !== null
    );
  };

export const hasRole = (
  role: UserRole
): boolean => {
  return (
    getCurrentUser()?.role ===
    role
  );
};