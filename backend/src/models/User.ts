export type UserRole =
  | 'owner'
  | 'admin'
  | 'medewerker';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at?: string;
}