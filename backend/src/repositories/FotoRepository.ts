import { pool } from '../config/database';
import { Foto } from '../models/Werkorder';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export class FotoRepository {

  async create(foto: Foto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO fotos (werkorder_id, beschrijving, bestandspad)
       VALUES (?, ?, ?)`,
      [foto.werkorder_id, foto.beschrijving ?? null, foto.bestandspad]
    );
    return result.insertId;
  }

  async findByWerkorderId(werkorderId: number): Promise<Foto[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM fotos WHERE werkorder_id = ?`,
      [werkorderId]
    );
    return rows as Foto[];
  }
}