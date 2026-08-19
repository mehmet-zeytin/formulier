import { pool } from '../config/database';
import { Foto } from '../models/Werkorder';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

type FotoRow = RowDataPacket & Foto;

export class FotoRepository {
  async create(foto: Foto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `
        INSERT INTO fotos (
          werkorder_id,
          beschrijving,
          bestandspad,
          genomen_op
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        foto.werkorder_id,
        foto.beschrijving ?? null,
        foto.bestandspad,
        foto.genomen_op
      ]
    );

    return result.insertId;
  }

  async findByWerkorderId(
    werkorderId: number
  ): Promise<Foto[]> {
    const [rows] = await pool.query<FotoRow[]>(
      `
        SELECT
          id,
          werkorder_id,
          beschrijving,
          bestandspad,
          genomen_op,
          created_at
        FROM fotos
        WHERE werkorder_id = ?
        ORDER BY genomen_op DESC
      `,
      [werkorderId]
    );

    return rows;
  }

  async findById(id: number): Promise<Foto | null> {
    const [rows] = await pool.query<FotoRow[]>(
      `
        SELECT
          id,
          werkorder_id,
          beschrijving,
          bestandspad,
          genomen_op,
          created_at
        FROM fotos
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `
        DELETE FROM fotos
        WHERE id = ?
      `,
      [id]
    );

    return result.affectedRows > 0;
  }
}