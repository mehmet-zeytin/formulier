import { pool } from '../config/database';
import { Materiaal } from '../models/Werkorder';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class MateriaalRepository {

  async create(materiaal: Materiaal): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO materialen (werkorder_id, tip, naam, aantal, eenheid)
       VALUES (?, ?, ?, ?, ?)`,
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

  async findByWerkorderId(werkorderId: number): Promise<Materiaal[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM materialen WHERE werkorder_id = ?`,
      [werkorderId]
    );
    return rows as Materiaal[];
  }
}