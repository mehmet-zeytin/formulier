import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';

export class AuthService {
  private userRepo = new UserRepository();

  async login(email: string, password: string): Promise<string> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new Error('Onjuist e-mailadres of wachtwoord');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Onjuist e-mailadres of wachtwoord');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    return token;
  }
}