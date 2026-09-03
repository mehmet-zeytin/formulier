import {
  api
} from './api';

export type UserRole =
  | 'owner'
  | 'admin'
  | 'medewerker';

export interface CurrentUserResponse {
  userId: number;

  email: string;

  role: UserRole;
}

interface LoginResponse {
  message: string;
}

interface LogoutResponse {
  message: string;
}

export const login =
  async (
    email: string,
    password: string
  ): Promise<
    CurrentUserResponse
  > => {
    await api.post<
      LoginResponse
    >(
      '/auth/login',
      {
        email,
        password
      }
    );

    /*
     * JWT is HttpOnly en kan dus
     * niet door JavaScript worden
     * uitgelezen.
     *
     * Haal de actuele gebruiker
     * daarom via /auth/me op.
     */
    return getCurrentUserFromServer();
  };

export const logout =
  async (): Promise<void> => {
    await api.post<
      LogoutResponse
    >(
      '/auth/logout'
    );
  };

export const getCurrentUserFromServer =
  async (): Promise<
    CurrentUserResponse
  > => {
    const response =
      await api.get<
        CurrentUserResponse
      >(
        '/auth/me'
      );

    return response.data;
  };