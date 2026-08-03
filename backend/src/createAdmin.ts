import bcrypt from 'bcrypt';
import { pool } from './config/database';

async function createAdmin() {
  const email = 'admin@formulier.nl';
  const plainPassword = 'admin123';

  const hash = await bcrypt.hash(plainPassword, 10);

  await pool.query(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, hash]
  );

  console.log('Admin gebruiker aangemaakt:', email);
  process.exit(0);
}

createAdmin();