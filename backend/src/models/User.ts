export type UserRole =
  | 'owner'
  | 'admin'
  | 'medewerker';

export interface User {
  id: number;

  email: string;

  password_hash: string;

  role: UserRole;

  created_at: string;

  is_deleted: boolean;

  deleted_at:
    | string
    | null;
  token_version: number;
}

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