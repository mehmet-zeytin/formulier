import { pool } from '../config/database';
import { Werkorder } from '../models/Werkorder';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class WerkorderRepository {
  async create(
    werkorder: Werkorder,
    createdBy: number
  ): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `
        INSERT INTO werkorders (
          werkorder_id,
          aankomsttijd,
          eindtijd,
          datum,
          uitgevoerde_werkzaamheden,
          status,
          is_voltooid,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)
      `,
      [
        werkorder.werkorder_id,
        werkorder.aankomsttijd ?? null,
        werkorder.eindtijd ?? null,
        werkorder.datum,
        werkorder.uitgevoerde_werkzaamheden ?? null,
        werkorder.status ?? null,
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
    const [result] = await pool.query<ResultSetHeader>(
      `
        INSERT INTO werkorders (
          werkorder_id,
          datum,
          is_voltooid,
          created_by
        )
        VALUES (?, ?, FALSE, ?)
      `,
      [
        werkorderId,
        datum,
        createdBy
      ]
    );

    return result.insertId;
  }

  async updateDraft(
    id: number,
    updates: Partial<Werkorder>
  ): Promise<boolean> {
    const allowedFields: Array<keyof Werkorder> = [
      'werkorder_id',
      'aankomsttijd',
      'eindtijd',
      'datum',
      'uitgevoerde_werkzaamheden',
      'status'
    ];

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          updates,
          field
        )
      ) {
        fields.push(`${field} = ?`);
        values.push(
          updates[field] ?? null
        );
      }
    }

    if (fields.length === 0) {
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

    return result.affectedRows > 0;
  }

  async findDraftsByUser(
    userId: number
  ): Promise<Werkorder[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM werkorders
          WHERE is_voltooid = FALSE
            AND created_by = ?
          ORDER BY updated_at DESC
        `,
        [userId]
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
          ORDER BY updated_at DESC
        `
      );

    return rows as Werkorder[];
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

    return result.affectedRows > 0;
  }

  async findAll():
    Promise<Werkorder[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM werkorders
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
          SELECT *
          FROM werkorders
          WHERE created_by = ?
          ORDER BY created_at DESC
        `,
        [userId]
      );

    return rows as Werkorder[];
  }

  async findById(
    id: number
  ): Promise<Werkorder | null> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
        `
          SELECT *
          FROM werkorders
          WHERE id = ?
          LIMIT 1
        `,
        [id]
      );

    return rows.length > 0
      ? (
          rows[0] as Werkorder
        )
      : null;
  }
}