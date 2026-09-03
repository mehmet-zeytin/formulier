import {
  pool
} from '../config/database';

import type {
  Foto
} from '../models/Werkorder';

import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

export class FotoRepository {
  async create(
    foto: Foto
  ): Promise<number> {
    const [result] =
      await pool.query<ResultSetHeader>(
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
          foto.beschrijving ??
            null,
          foto.bestandspad,
          foto.genomen_op
        ]
      );

    return result.insertId;
  }

  async findByWerkorderId(
    werkorderId: number
  ): Promise<Foto[]> {
    const [rows] =
      await pool.query<RowDataPacket[]>(
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

          ORDER BY
            genomen_op DESC,
            id DESC
        `,
        [
          werkorderId
        ]
      );

    return rows as Foto[];
  }

  async findById(
    id: number
  ): Promise<
    Foto | null
  > {
    const [rows] =
      await pool.query<RowDataPacket[]>(
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

    if (
      rows.length === 0
    ) {
      return null;
    }

    return rows[0] as Foto;
  }

  async delete(
    id: number
  ): Promise<boolean> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          DELETE FROM fotos
          WHERE id = ?
        `,
        [id]
      );

    return (
      result.affectedRows >
      0
    );
  }
}