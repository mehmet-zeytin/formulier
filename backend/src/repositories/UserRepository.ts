import { pool } from '../config/database';
import { User } from '../models/User';
import { RowDataPacket } from 'mysql2';

export class UserRepository {

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }
}