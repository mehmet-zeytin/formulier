import {
  pool
} from '../config/database';

import type {
  User,
  UserListItem,
  UserRole
} from '../models/User';

import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

type UserRow =
  RowDataPacket &
  User;

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
            created_at,
            is_deleted,
            deleted_at,
            token_version,
            mfa_enabled,
            mfa_secret

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

  async findActiveByEmail(
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
            created_at,
            is_deleted,
            deleted_at,
            token_version,
            mfa_enabled,
            mfa_secret

          FROM users

          WHERE email = ?
            AND is_deleted = FALSE

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
            created_at,
            is_deleted,
            deleted_at,
            token_version,
            mfa_enabled,
            mfa_secret

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

  async findAllActive():
    Promise<UserListItem[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            id,
            email,
            role,
            created_at,
            is_deleted,
            deleted_at

          FROM users

          WHERE is_deleted = FALSE

          ORDER BY created_at DESC
        `
      );

    return rows.map(
      row => ({
        id:
          Number(row.id),

        email:
          String(row.email),

        role:
          row.role as UserRole,

        created_at:
          String(row.created_at),

        is_deleted:
          Boolean(
            row.is_deleted
          ),

        deleted_at:
          row.deleted_at
            ? String(
                row.deleted_at
              )
            : null
      })
    );
  }

  async findAllDeleted():
    Promise<UserListItem[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            id,
            email,
            role,
            created_at,
            is_deleted,
            deleted_at

          FROM users

          WHERE is_deleted = TRUE

          ORDER BY
            deleted_at DESC,
            id DESC
        `
      );

    return rows.map(
      row => ({
        id:
          Number(row.id),

        email:
          String(row.email),

        role:
          row.role as UserRole,

        created_at:
          String(row.created_at),

        is_deleted:
          Boolean(
            row.is_deleted
          ),

        deleted_at:
          row.deleted_at
            ? String(
                row.deleted_at
              )
            : null
      })
    );
  }

  async create(
    email: string,
    passwordHash: string,
    role:
      | 'admin'
      | 'medewerker'
  ): Promise<number> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO users (
            email,
            password_hash,
            role,
            is_deleted,
            deleted_at,
            mfa_enabled,
            mfa_secret
          )

          VALUES (
            ?,
            ?,
            ?,
            FALSE,
            NULL,
            FALSE,
            NULL
          )
        `,
        [
          email,
          passwordHash,
          role
        ]
      );

    return result.insertId;
  }

  async setMfaSecret(
    id: number,
    encryptedSecret: string
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE users

          SET
            mfa_secret = ?,
            mfa_enabled = FALSE

          WHERE id = ?
            AND is_deleted = FALSE
        `,
        [
          encryptedSecret,
          id
        ]
      );

    return (
      result.affectedRows > 0
    );
  }

  async enableMfa(
    id: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE users

          SET
            mfa_enabled = TRUE,
            token_version = token_version + 1

          WHERE id = ?
            AND is_deleted = FALSE
            AND mfa_secret IS NOT NULL
        `,
        [id]
      );

    return (
      result.affectedRows > 0
    );
  }

  async disableMfa(
    id: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE users

          SET
            mfa_enabled = FALSE,
            mfa_secret = NULL,
            token_version = token_version + 1

          WHERE id = ?
            AND is_deleted = FALSE
        `,
        [id]
      );

    return (
      result.affectedRows > 0
    );
  }

  async updateRole(
    id: number,
    role:
      | 'admin'
      | 'medewerker'
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE users

          SET role = ?

          WHERE id = ?
            AND is_deleted = FALSE
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

  async updatePassword(
    id: number,
    passwordHash: string
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE users

          SET
            password_hash = ?,
            token_version = token_version + 1

          WHERE id = ?
            AND is_deleted = FALSE
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

  async softDelete(
    id: number
  ): Promise<boolean> {
    const connection =
      await pool.getConnection();

    try {
      await connection
        .beginTransaction();

      await connection.query(
        `
          DELETE FROM werkorder_access
          WHERE user_id = ?
        `,
        [id]
      );

      const [result] =
        await connection
          .query<ResultSetHeader>(
            `
              UPDATE users
              SET
                is_deleted = TRUE,
                deleted_at = NOW(),
                token_version = token_version + 1

              WHERE id = ?
                AND is_deleted = FALSE
                AND role <> 'owner'
            `,
            [id]
          );

      if (
        result.affectedRows === 0
      ) {
        await connection
          .rollback();

        return false;
      }

      await connection
        .commit();

      return true;
    } catch (
      error
    ) {
      await connection
        .rollback();

      throw error;
    } finally {
      connection.release();
    }
  }

  async restore(
    id: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE users

          SET
            is_deleted = FALSE,
            deleted_at = NULL

          WHERE id = ?
            AND is_deleted = TRUE
        `,
        [id]
      );

    return (
      result.affectedRows > 0
    );
  }
}