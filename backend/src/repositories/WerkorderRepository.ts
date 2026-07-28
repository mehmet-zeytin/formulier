import { pool } from '../config/database';
import { Werkorder } from '../models/Werkorder';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class WerkorderRepository {

  async create(werkorder: Werkorder): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO werkorders 
        (werkorder_id, aankomsttijd, eindtijd, datum, uitgevoerde_werkzaamheden, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        werkorder.werkorder_id,
        werkorder.aankomsttijd,
        werkorder.eindtijd,
        werkorder.datum,
        werkorder.uitgevoerde_werkzaamheden,
        werkorder.status
      ]
    );
    return result.insertId;
  }

  async findAll(): Promise<Werkorder[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM werkorders ORDER BY created_at DESC`
    );
    return rows as Werkorder[];
  }

  async findById(id: number): Promise<Werkorder | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM werkorders WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as Werkorder) : null;
  }
}