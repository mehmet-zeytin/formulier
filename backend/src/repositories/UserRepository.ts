import { pool } from '../config/database';

import {
  User,
  UserRole
} from '../models/User';

import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

type UserRow =
  RowDataPacket & User;

type SafeUser = Pick<
  User,
  'id' | 'email' | 'role' | 'created_at'
>;

type ManageableUserRole =
  Exclude<UserRole, 'owner'>;

export class UserRepository {
  async findByEmail(
    email: string
  ): Promise<User | null> {
    const [rows] =
      await pool.query<UserRow[]>(
        `
          SELECT
            id,
            email,
            password_hash,
            role,
            created_at
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [email]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }

  async findById(
    id: number
  ): Promise<User | null> {
    const [rows] =
      await pool.query<UserRow[]>(
        `
          SELECT
            id,
            email,
            password_hash,
            role,
            created_at
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [id]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }

  async findAll():
    Promise<SafeUser[]> {
    const [rows] =
      await pool.query<
        RowDataPacket[]
      >(
        `
          SELECT
            id,
            email,
            role,
            created_at
          FROM users
          ORDER BY
            CASE role
              WHEN 'owner' THEN 1
              WHEN 'admin' THEN 2
              WHEN 'medewerker' THEN 3
              ELSE 4
            END,
            created_at ASC
        `
      );

    return rows as SafeUser[];
  }

  async create(
    email: string,
    passwordHash: string,
    role: ManageableUserRole
  ): Promise<number> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO users (
            email,
            password_hash,
            role
          )
          VALUES (?, ?, ?)
        `,
        [
          email,
          passwordHash,
          role
        ]
      );

    return result.insertId;
  }

  async updatePasswordHash(
    id: number,
    passwordHash: string
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE users
          SET password_hash = ?
          WHERE id = ?
        `,
        [
          passwordHash,
          id
        ]
      );

    return (
      result.affectedRows > 0
    );
  }

  async updateRole(
    id: number,
    role: ManageableUserRole
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE users
          SET role = ?
          WHERE id = ?
            AND role <> 'owner'
        `,
        [
          role,
          id
        ]
      );

    return (
      result.affectedRows > 0
    );
  }

  async deleteById(
    id: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          DELETE FROM users
          WHERE id = ?
            AND role <> 'owner'
        `,
        [id]
      );

    return (
      result.affectedRows > 0
    );
  }
}