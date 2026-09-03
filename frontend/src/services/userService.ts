import {
  api
} from './api';

import type {
  UserRole
} from './authService';

export interface UserListItem {
  id: number;

  email: string;

  role: UserRole;

  created_at: string;

  is_deleted: boolean;

  deleted_at:
    | string
    | null;
}

interface CreateUserPayload {
  email: string;

  password: string;

  role:
    | 'admin'
    | 'medewerker';
}

interface CreateUserResponse {
  message: string;

  id: number;
}

interface MessageResponse {
  message: string;
}

export const getUsers =
  async (): Promise<
    UserListItem[]
  > => {
    const response =
      await api.get<
        UserListItem[]
      >(
        '/auth/users'
      );

    return response.data;
  };

export const getDeletedUsers =
  async (): Promise<
    UserListItem[]
  > => {
    const response =
      await api.get<
        UserListItem[]
      >(
        '/auth/users/deleted'
      );

    return response.data;
  };

export const createUser =
  async (
    payload:
      CreateUserPayload
  ): Promise<
    CreateUserResponse
  > => {
    const response =
      await api.post<
        CreateUserResponse
      >(
        '/auth/users',
        payload
      );

    return response.data;
  };

export const changeUserRole =
  async (
    userId: number,

    role:
      | 'admin'
      | 'medewerker'
  ): Promise<
    MessageResponse
  > => {
    const response =
      await api.patch<
        MessageResponse
      >(
        `/auth/users/${userId}/role`,
        {
          role
        }
      );

    return response.data;
  };

export const changeUserPassword =
  async (
    userId: number,
    password: string
  ): Promise<
    MessageResponse
  > => {
    const response =
      await api.patch<
        MessageResponse
      >(
        `/auth/users/${userId}/password`,
        {
          password
        }
      );

    return response.data;
  };

export const deleteUser =
  async (
    userId: number
  ): Promise<
    MessageResponse
  > => {
    const response =
      await api.delete<
        MessageResponse
      >(
        `/auth/users/${userId}`
      );

    return response.data;
  };

export const restoreUser =
  async (
    userId: number
  ): Promise<
    MessageResponse
  > => {
    const response =
      await api.patch<
        MessageResponse
      >(
        `/auth/users/${userId}/restore`
      );

    return response.data;
  };