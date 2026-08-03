import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService = new AuthService();

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'E-mailadres en wachtwoord zijn verplicht' });
        return;
      }

      const token = await this.authService.login(email, password);
      res.status(200).json({ message: 'Inloggen gelukt', token });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  };
}