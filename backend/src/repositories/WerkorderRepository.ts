import {
  pool
} from '../config/database';

import {
  Werkorder,
  AssignmentHistoryItem
} from '../models/Werkorder';

import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

export interface AssignableUser {
  id: number;
  email: string;

  role:
    | 'admin'
    | 'medewerker';
}

export class WerkorderRepository {
  async create(
    werkorder: Werkorder,
    createdBy: number
  ): Promise<number> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO werkorders (
            werkorder_id,
            aankomsttijd,
            eindtijd,
            datum,
            uitgevoerde_werkzaamheden,
            status,
            is_voltooid,
            created_by,
            assigned_to
          )
          VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?)
        `,
        [
          werkorder.werkorder_id,
          werkorder.aankomsttijd ?? null,
          werkorder.eindtijd ?? null,
          werkorder.datum,
          werkorder
            .uitgevoerde_werkzaamheden ??
            null,
          werkorder.status ?? null,
          createdBy,
          createdBy
        ]
      );

    return result.insertId;
  }

  async createDraft(
    werkorderId: string,
    datum: string,
    createdBy: number
  ): Promise<number> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO werkorders (
            werkorder_id,
            datum,
            is_voltooid,
            created_by,
            assigned_to
          )
          VALUES (?, ?, FALSE, ?, ?)
        `,
        [
          werkorderId,
          datum,
          createdBy,
          createdBy
        ]
      );

    return result.insertId;
  }

  async updateDraft(
    id: number,
    updates: Partial<Werkorder>
  ): Promise<boolean> {
    const allowedFields:
      Array<keyof Werkorder> = [
        'werkorder_id',
        'aankomsttijd',
        'eindtijd',
        'datum',
        'uitgevoerde_werkzaamheden',
        'status'
      ];

    const fields: string[] = [];

    const values:
      unknown[] = [];

    for (
      const field
      of allowedFields
    ) {
      if (
        Object.prototype
          .hasOwnProperty.call(
            updates,
            field
          )
      ) {
        fields.push(
          `${field} = ?`
        );

        values.push(
          updates[field] ??
          null
        );
      }
    }

    if (
      fields.length === 0
    ) {
      return false;
    }

    values.push(id);

    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE werkorders
          SET ${fields.join(', ')}
          WHERE id = ?
            AND is_voltooid = FALSE
        `,
        values
      );

    return (
      result.affectedRows > 0
    );
  }

  async findDraftsByUser(
    userId: number
  ): Promise<Werkorder[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT DISTINCT w.*
          FROM werkorders w

          LEFT JOIN werkorder_access wa
            ON wa.werkorder_id = w.id

          WHERE
            w.is_voltooid = FALSE
            AND w.is_deleted = FALSE
            AND (
              w.assigned_to = ?
              OR wa.user_id = ?
            )

          ORDER BY
            w.updated_at DESC
        `,
        [
          userId,
          userId
        ]
      );

    return rows as Werkorder[];
  }

  async findAllDrafts():
    Promise<Werkorder[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM werkorders
          WHERE is_voltooid = FALSE
            AND is_deleted = FALSE
          ORDER BY updated_at DESC
        `
      );

    return rows as Werkorder[];
  }


  async hasOpenDraftsAssignedToUser(
    userId: number
  ): Promise<boolean> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT 1

          FROM werkorders

          WHERE assigned_to = ?
            AND is_voltooid = FALSE
            AND is_deleted = FALSE

          LIMIT 1
        `,
        [userId]
      );

    return (
      rows.length > 0
    );
  }

  async completeDraft(
    id: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE werkorders
          SET is_voltooid = TRUE
          WHERE id = ?
            AND is_voltooid = FALSE
        `,
        [id]
      );

    return (
      result.affectedRows > 0
    );
  }

  async findDeletedById(
    id: number
  ): Promise<
    Werkorder | null
  > {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM werkorders
          WHERE id = ?
            AND is_deleted = TRUE
          LIMIT 1
        `,
        [id]
      );

    if (
      rows.length === 0
    ) {
      return null;
    }

    return (
      rows[0] as Werkorder
    );
  }

  async findAll():
    Promise<Werkorder[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM werkorders
          WHERE is_deleted = FALSE
          ORDER BY created_at DESC
        `
      );

    return rows as Werkorder[];
  }

  async findByUser(
    userId: number
  ): Promise<Werkorder[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT DISTINCT w.*
          FROM werkorders w

          LEFT JOIN werkorder_access wa
            ON wa.werkorder_id = w.id

          WHERE
            w.is_deleted = FALSE
            AND (
              w.assigned_to = ?
              OR wa.user_id = ?
            )

          ORDER BY
            w.created_at DESC
        `,
        [
          userId,
          userId
        ]
      );

    return rows as Werkorder[];
  }

  async findById(
    id: number
  ): Promise<
    Werkorder | null
  > {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM werkorders
          WHERE id = ?
            AND is_deleted = FALSE
          LIMIT 1
        `,
        [id]
      );

    if (
      rows.length === 0
    ) {
      return null;
    }

    return (
      rows[0] as Werkorder
    );
  }

  async hasUserAccess(
    werkorderId: number,
    userId: number
  ): Promise<boolean> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT 1

          FROM werkorder_access wa

          INNER JOIN users u
            ON u.id = wa.user_id

          WHERE wa.werkorder_id = ?
            AND wa.user_id = ?
            AND u.is_deleted = FALSE

          LIMIT 1
        `,
        [
          werkorderId,
          userId
        ]
      );

    return (
      rows.length > 0
    );
  }

  async getAccessUserIds(
    werkorderId: number
  ): Promise<number[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            wa.user_id

          FROM werkorder_access wa

          INNER JOIN users u
            ON u.id = wa.user_id

          WHERE wa.werkorder_id = ?
            AND u.is_deleted = FALSE

          ORDER BY
            wa.user_id
        `,
        [werkorderId]
      );

    return rows.map(
      row =>
        Number(
          row.user_id
        )
    );
  }

  async replaceAccess(
    werkorderId: number,
    userIds: number[],
    grantedBy: number
  ): Promise<void> {
    const connection =
      await pool.getConnection();

    try {
      await connection
        .beginTransaction();

      await connection.query(
        `
          DELETE FROM werkorder_access
          WHERE werkorder_id = ?
        `,
        [werkorderId]
      );

      for (
        const userId
        of userIds
      ) {
        await connection.query(
          `
            INSERT INTO werkorder_access (
              werkorder_id,
              user_id,
              granted_by
            )
            VALUES (?, ?, ?)
          `,
          [
            werkorderId,
            userId,
            grantedBy
          ]
        );
      }

      await connection.commit();
    } catch (
      error
    ) {
      await connection.rollback();

      throw error;
    } finally {
      connection.release();
    }
  }

  async findAssignableUsers():
    Promise<AssignableUser[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            id,
            email,
            role

          FROM users

          WHERE role IN (
            'admin',
            'medewerker'
          )
            AND is_deleted = FALSE

          ORDER BY email ASC
        `
      );

    return rows.map(
      row => ({
        id:
          Number(row.id),

        email:
          String(row.email),

        role:
          row.role as
            | 'admin'
            | 'medewerker'
      })
    );
  }

  async findUserById(
    userId: number
  ): Promise<
    AssignableUser | null
  > {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            id,
            email,
            role

          FROM users

          WHERE id = ?
            AND is_deleted = FALSE

          LIMIT 1
        `,
        [userId]
      );

    if (
      rows.length === 0
    ) {
      return null;
    }

    const row =
      rows[0];

    if (
      row.role !== 'admin' &&
      row.role !== 'medewerker'
    ) {
      return null;
    }

    return {
      id:
        Number(row.id),

      email:
        String(row.email),

      role:
        row.role as
          | 'admin'
          | 'medewerker'
    };
  }

  async findAnyUserById(
    userId: number
  ): Promise<{
    id: number;
    email: string;
    role: string;
  } | null> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            id,
            email,
            role

          FROM users

          WHERE id = ?

          LIMIT 1
        `,
        [userId]
      );

    if (
      rows.length === 0
    ) {
      return null;
    }

    return {
      id:
        Number(
          rows[0].id
        ),

      email:
        String(
          rows[0].email
        ),

      role:
        String(
          rows[0].role
        )
    };
  }

  async transferAssigneeWithHistory(
    werkorderId: number,

    fromUserId:
      | number
      | null,

    fromUserEmail:
      | string
      | null,

    toUserId: number,

    toUserEmail: string,

    changedBy: number,

    changedByEmail: string,

    reason: string
  ): Promise<boolean> {
    const connection =
      await pool.getConnection();

    try {
      await connection
        .beginTransaction();

      const [result] =
        await connection
          .query<ResultSetHeader>(
            `
              UPDATE werkorders
              SET assigned_to = ?
              WHERE id = ?
                AND is_voltooid = FALSE
            `,
            [
              toUserId,
              werkorderId
            ]
          );

      if (
        result.affectedRows === 0
      ) {
        await connection
          .rollback();

        return false;
      }

      await connection.query(
        `
          INSERT INTO werkorder_assignment_history (
            werkorder_id,

            from_user_id,
            from_user_email,

            to_user_id,
            to_user_email,

            changed_by,
            changed_by_email,

            reason
          )

          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,
        [
          werkorderId,

          fromUserId,
          fromUserEmail,

          toUserId,
          toUserEmail,

          changedBy,
          changedByEmail,

          reason
        ]
      );

      await connection.commit();

      return true;
    } catch (
      error
    ) {
      await connection.rollback();

      throw error;
    } finally {
      connection.release();
    }
  }

  async getFotoPathsForDelete(
  werkorderId: number
): Promise<string[]> {
  const [rows] =
    await pool.query<RowDataPacket[]>(
      `
        SELECT bestandspad
        FROM fotos
        WHERE werkorder_id = ?
      `,
      [werkorderId]
    );

  return rows.map(
    row =>
      String(
        row.bestandspad
      )
  );
}

  async getFotoPaths(
    werkorderId: number
  ): Promise<string[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT bestandspad
          FROM fotos
          WHERE werkorder_id = ?
        `,
        [werkorderId]
      );

    return rows.map(
      row =>
        String(
          row.bestandspad
        )
    );
  }

  async moveToTrash(
    werkorderId: number,
    deletedBy: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE werkorders
          SET
            is_deleted = TRUE,
            deleted_at = NOW(),
            deleted_by = ?
          WHERE id = ?
            AND is_deleted = FALSE
        `,
        [
          deletedBy,
          werkorderId
        ]
      );

    return (
      result.affectedRows > 0
    );
  }

  async restoreFromTrash(
    werkorderId: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE werkorders
          SET
            is_deleted = FALSE,
            deleted_at = NULL,
            deleted_by = NULL
          WHERE id = ?
            AND is_deleted = TRUE
        `,
        [werkorderId]
      );

    return (
      result.affectedRows > 0
    );
  }


  async findTrash():
    Promise<Werkorder[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM werkorders
          WHERE is_deleted = TRUE
          ORDER BY deleted_at DESC
        `
      );

    return rows as Werkorder[];
  }





  async deletePermanent(
    werkorderId: number
  ): Promise<boolean> {
    const connection =
      await pool.getConnection();

    try {
      await connection
        .beginTransaction();

      const [result] =
        await connection
          .query<ResultSetHeader>(
            `
              DELETE FROM werkorders
              WHERE id = ?
            `,
            [werkorderId]
          );

      if (
        result.affectedRows === 0
      ) {
        await connection
          .rollback();

        return false;
      }

      await connection.commit();

      return true;
    } catch (
      error
    ) {
      await connection.rollback();

      throw error;
    } finally {
      connection.release();
    }
  }

  async getAssignmentHistory(
    werkorderId: number
  ): Promise<
    AssignmentHistoryItem[]
  > {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            id,

            werkorder_id,

            from_user_id,
            from_user_email,

            to_user_id,
            to_user_email,

            changed_by,
            changed_by_email,

            reason,
            created_at

          FROM werkorder_assignment_history

          WHERE werkorder_id = ?

          ORDER BY
            created_at DESC,
            id DESC
        `,
        [werkorderId]
      );

    return (
      rows as
        AssignmentHistoryItem[]
    );
  }
}