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

export interface LoginResponse {
  message: string;

  requiresMfa: true;

  requiresSetup: boolean;

  challengeToken: string;

  qrCodeDataUrl?: string;
}

interface VerifyMfaResponse {
  message: string;
}

interface LogoutResponse {
  message: string;
}

export const login =
  async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const response =
      await api.post<LoginResponse>(
        '/auth/login',
        {
          email,
          password
        }
      );

    return response.data;
  };

export const verifyMfa =
  async (
    challengeToken: string,
    code: string
  ): Promise<
    CurrentUserResponse
  > => {
    await api.post<
      VerifyMfaResponse
    >(
      '/auth/mfa/verify',
      {
        challengeToken,
        code
      }
    );

    /*
     * MFA is nu succesvol.
     *
     * De backend heeft de
     * HttpOnly-cookie geplaatst.
     *
     * Haal daarna de actuele
     * gebruiker op.
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