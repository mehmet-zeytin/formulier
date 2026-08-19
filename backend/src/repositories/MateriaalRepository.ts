import { pool } from '../config/database';
import { Materiaal } from '../models/Werkorder';
import {
  ResultSetHeader,
  RowDataPacket
} from 'mysql2';

type MateriaalWithoutWerkorderId = Omit<
  Materiaal,
  'id' | 'werkorder_id'
>;

export class MateriaalRepository {
  async create(materiaal: Materiaal): Promise<number> {
    const [result] =
      await pool.query<ResultSetHeader>(
        `
          INSERT INTO materialen (
            werkorder_id,
            tip,
            naam,
            aantal,
            eenheid
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          materiaal.werkorder_id,
          materiaal.tip,
          materiaal.naam,
          materiaal.aantal,
          materiaal.eenheid ?? null
        ]
      );

    return result.insertId;
  }

  async findByWerkorderId(
    werkorderId: number
  ): Promise<Materiaal[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
        SELECT
          id,
          werkorder_id,
          tip,
          naam,
          aantal,
          eenheid
        FROM materialen
        WHERE werkorder_id = ?
        ORDER BY id ASC
      `,
      [werkorderId]
    );

    return rows as Materiaal[];
  }

  async replaceForWerkorder(
    werkorderId: number,
    materialen: MateriaalWithoutWerkorderId[]
  ): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query<ResultSetHeader>(
        `
          DELETE FROM materialen
          WHERE werkorder_id = ?
        `,
        [werkorderId]
      );

      for (const materiaal of materialen) {
        await connection.query<ResultSetHeader>(
          `
            INSERT INTO materialen (
              werkorder_id,
              tip,
              naam,
              aantal,
              eenheid
            )
            VALUES (?, ?, ?, ?, ?)
          `,
          [
            werkorderId,
            materiaal.tip,
            materiaal.naam,
            materiaal.aantal,
            materiaal.eenheid ?? null
          ]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}