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

  async hasPendingTransferRequest(
    werkorderId: number
  ): Promise<boolean> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT id
          FROM werkorder_transfer_requests
          WHERE werkorder_id = ?
            AND status = 'pending'
          LIMIT 1
        `,
        [werkorderId]
      );

    return rows.length > 0;
  }

  async createTransferRequest(
    werkorderId: number,
    fromUserId: number | null,
    toUserId: number,
    requestedBy: number,
    reason: string
  ): Promise<number> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO werkorder_transfer_requests (
            werkorder_id,
            from_user_id,
            to_user_id,
            requested_by,
            reason
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          werkorderId,
          fromUserId,
          toUserId,
          requestedBy,
          reason
        ]
      );

    return result.insertId;
  }

  async getPendingTransferRequestsForUser(
    userId: number
  ) {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            tr.id,
            tr.werkorder_id,
            w.werkorder_id AS werkorder_nummer,

            tr.from_user_id,
            from_user.email AS from_user_email,

            tr.to_user_id,
            to_user.email AS to_user_email,

            tr.requested_by,
            requested_by_user.email AS requested_by_email,

            tr.reason,
            tr.status,
            tr.created_at

          FROM werkorder_transfer_requests tr

          INNER JOIN werkorders w
            ON w.id = tr.werkorder_id

          LEFT JOIN users from_user
            ON from_user.id = tr.from_user_id

          INNER JOIN users to_user
            ON to_user.id = tr.to_user_id

          INNER JOIN users requested_by_user
            ON requested_by_user.id = tr.requested_by

          WHERE tr.to_user_id = ?
            AND tr.status = 'pending'
            AND w.is_deleted = FALSE
            AND w.is_voltooid = FALSE

          ORDER BY tr.created_at DESC
        `,
        [userId]
      );

    return rows;
  }

  async findPendingTransferRequest(
    requestId: number
  ) {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            tr.*,
            w.assigned_to,
            w.is_voltooid,
            w.is_deleted,

            from_user.email AS from_user_email,
            to_user.email AS to_user_email,
            requested_by_user.email AS requested_by_email

          FROM werkorder_transfer_requests tr

          INNER JOIN werkorders w
            ON w.id = tr.werkorder_id

          LEFT JOIN users from_user
            ON from_user.id = tr.from_user_id

          INNER JOIN users to_user
            ON to_user.id = tr.to_user_id

          INNER JOIN users requested_by_user
            ON requested_by_user.id = tr.requested_by

          WHERE tr.id = ?
            AND tr.status = 'pending'

          LIMIT 1
        `,
        [requestId]
      );

    return rows.length > 0
      ? rows[0]
      : null;
  }


async acceptTransferRequest(
  requestId: number,
  respondingUserId: number
): Promise<boolean> {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] =
      await connection.query<RowDataPacket[]>(
        `
          SELECT
            tr.id,
            tr.werkorder_id,
            tr.from_user_id,
            tr.to_user_id,
            tr.requested_by,
            tr.reason,
            tr.status,

            w.assigned_to,
            w.is_voltooid,
            w.is_deleted,

            from_user.email AS from_user_email,
            to_user.email AS to_user_email,
            requested_by_user.email AS requested_by_email

          FROM werkorder_transfer_requests tr

          INNER JOIN werkorders w
            ON w.id = tr.werkorder_id

          LEFT JOIN users from_user
            ON from_user.id = tr.from_user_id

          INNER JOIN users to_user
            ON to_user.id = tr.to_user_id

          INNER JOIN users requested_by_user
            ON requested_by_user.id = tr.requested_by

          WHERE tr.id = ?
            AND tr.status = 'pending'

          FOR UPDATE
        `,
        [requestId]
      );

    if (rows.length === 0) {
      await connection.rollback();

      return false;
    }

    const request = rows[0];

    if (
      Number(request.to_user_id) !==
      respondingUserId
    ) {
      await connection.rollback();

      return false;
    }

    if (
      Boolean(request.is_voltooid) ||
      Boolean(request.is_deleted)
    ) {
      await connection.rollback();

      return false;
    }

    const currentAssignedTo =
      request.assigned_to === null
        ? null
        : Number(request.assigned_to);

    const expectedFromUserId =
      request.from_user_id === null
        ? null
        : Number(request.from_user_id);

    if (
      currentAssignedTo !==
      expectedFromUserId
    ) {
      await connection.rollback();

      return false;
    }

    const [updateResult] =
      await connection
        .query<ResultSetHeader>(
          `
            UPDATE werkorders

            SET assigned_to = ?

            WHERE id = ?
              AND is_voltooid = FALSE
              AND is_deleted = FALSE
              AND assigned_to <=> ?
          `,
          [
            Number(request.to_user_id),
            Number(request.werkorder_id),
            expectedFromUserId
          ]
        );

    if (
      updateResult.affectedRows === 0
    ) {
      await connection.rollback();

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

        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(request.werkorder_id),

        expectedFromUserId,
        request.from_user_email ?? null,

        Number(request.to_user_id),
        String(request.to_user_email),

        Number(request.requested_by),
        String(request.requested_by_email),

        String(request.reason)
      ]
    );

    const [requestResult] =
      await connection
        .query<ResultSetHeader>(
          `
            UPDATE werkorder_transfer_requests

            SET
              status = 'accepted',
              responded_at = CURRENT_TIMESTAMP

            WHERE id = ?
              AND status = 'pending'
          `,
          [requestId]
        );

    if (
      requestResult.affectedRows === 0
    ) {
      await connection.rollback();

      return false;
    }

    await connection.commit();

    return true;
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}

  async rejectTransferRequest(
    requestId: number,
    respondingUserId: number,
    rejectionReason: string
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE werkorder_transfer_requests

          SET
            status = 'rejected',
            rejection_reason = ?,
            responded_at = CURRENT_TIMESTAMP

          WHERE id = ?
            AND to_user_id = ?
            AND status = 'pending'
        `,
        [
          rejectionReason,
          requestId,
          respondingUserId
        ]
      );

    return result.affectedRows > 0;
  }


  async getAssignmentNotificationData(
    userId: number,
    werkorderId: number
  ): Promise<{
    email: string;
    werkorder_nummer: string;
  } | null> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            u.email,
            w.werkorder_id AS werkorder_nummer
          FROM users u
          INNER JOIN werkorders w
            ON w.id = ?
          WHERE u.id = ?
            AND u.deleted_at IS NULL
          LIMIT 1
        `,
        [
          werkorderId,
          userId
        ]
      );

    if (rows.length === 0) {
      return null;
    }

    return {
      email: String(
        rows[0].email
      ),

      werkorder_nummer: String(
        rows[0].werkorder_nummer
      )
    };
  }


  async createWerkorderNotification(
    userId: number,
    werkorderId: number,
    message: string
  ): Promise<number> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO werkorder_notifications (
            user_id,
            werkorder_id,
            type,
            message
          )
          VALUES (?, ?, 'assigned', ?)
        `,
        [
          userId,
          werkorderId,
          message
        ]
      );

    return result.insertId;
  }

  async getWerkorderNotificationsForUser(
    userId: number
  ): Promise<RowDataPacket[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT
            n.id,
            n.user_id,
            n.werkorder_id,
            n.type,
            n.message,
            n.is_read,
            n.created_at,
            n.read_at,
            w.werkorder_id AS werkorder_nummer
          FROM werkorder_notifications n
          INNER JOIN werkorders w
            ON w.id = n.werkorder_id
          WHERE n.user_id = ?
            AND n.is_read = 0
          ORDER BY n.created_at DESC
        `,
        [userId]
      );

    return rows;
  }

  async markWerkorderNotificationRead(
    notificationId: number,
    userId: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          UPDATE werkorder_notifications
          SET
            is_read = 1,
            read_at = CURRENT_TIMESTAMP
          WHERE id = ?
            AND user_id = ?
            AND is_read = 0
        `,
        [
          notificationId,
          userId
        ]
      );

    return result.affectedRows > 0;
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