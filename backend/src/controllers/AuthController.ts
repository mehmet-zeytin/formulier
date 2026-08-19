import {
  Request,
  Response
} from 'express';

import {
  AuthService
} from '../services/AuthService';

import {
  AuthRequest
} from '../middleware/authMiddleware';

export class AuthController {
  private authService =
    new AuthService();

  private canManageUsers(
    req: AuthRequest,
    res: Response
  ): boolean {
    if (!req.user) {
      res.status(401).json({
        message:
          'U moet ingelogd zijn.'
      });

      return false;
    }

    if (
      req.user.role !== 'owner' &&
      req.user.role !== 'admin'
    ) {
      res.status(403).json({
        message:
          'U heeft geen toegang tot gebruikersbeheer.'
      });

      return false;
    }

    return true;
  }

  login = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const {
        email,
        password
      } = req.body;

      if (
        typeof email !==
          'string' ||
        typeof password !==
          'string' ||
        !email.trim() ||
        !password
      ) {
        res.status(400).json({
          message:
            'E-mail en wachtwoord zijn verplicht.'
        });

        return;
      }

      const token =
        await this.authService.login(
          email
            .trim()
            .toLowerCase(),
          password
        );

      res.status(200).json({
        message:
          'Inloggen succesvol.',
        token
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Er is een onverwachte fout opgetreden tijdens het inloggen.';

      res.status(401).json({
        message
      });
    }
  };

  getUsers = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    if (
      !this.canManageUsers(
        req,
        res
      )
    ) {
      return;
    }

    try {
      const users =
        await this.authService.getUsers();

      res.status(200).json(
        users
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gebruikers konden niet worden geladen.';

      res.status(500).json({
        message
      });
    }
  };

  createUser = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    if (
      !this.canManageUsers(
        req,
        res
      )
    ) {
      return;
    }

    try {
      const {
        email,
        password,
        role
      } = req.body;

      if (
        typeof email !==
          'string' ||
        typeof password !==
          'string' ||
        (
          role !== 'admin' &&
          role !== 'medewerker'
        )
      ) {
        res.status(400).json({
          message:
            'E-mail, wachtwoord en een geldige rol zijn verplicht.'
        });

        return;
      }

      const userId =
        await this.authService.createUser(
          email,
          password,
          role,
          req.user!.role
        );

      res.status(201).json({
        message:
          'Gebruiker succesvol aangemaakt.',
        id: userId
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De gebruiker kon niet worden aangemaakt.';

      let status = 400;

      if (
        message ===
        'Er bestaat al een gebruiker met dit e-mailadres.'
      ) {
        status = 409;
      }

      if (
        message.includes(
          'geen toestemming'
        ) ||
        message.includes(
          'Alleen de owner'
        )
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };

  resetPassword = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    if (
      !this.canManageUsers(
        req,
        res
      )
    ) {
      return;
    }

    try {
      const userId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          userId
        ) ||
        userId <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig gebruikers-ID vereist.'
        });

        return;
      }

      const {
        password
      } = req.body;

      if (
        typeof password !==
        'string'
      ) {
        res.status(400).json({
          message:
            'Het nieuwe wachtwoord is verplicht.'
        });

        return;
      }

      await this.authService
        .resetUserPassword(
          userId,
          req.user!.userId,
          req.user!.role,
          password
        );

      res.status(200).json({
        message:
          'Wachtwoord succesvol gewijzigd.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Het wachtwoord kon niet worden gewijzigd.';

      let status = 400;

      if (
        message ===
        'Gebruiker niet gevonden.'
      ) {
        status = 404;
      } else if (
        message.includes(
          'geen toestemming'
        ) ||
        message.includes(
          'Een admin kan alleen'
        ) ||
        message.includes(
          'owner-account'
        )
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };

  changeRole = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    if (
      !this.canManageUsers(
        req,
        res
      )
    ) {
      return;
    }

    try {
      const userId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          userId
        ) ||
        userId <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig gebruikers-ID vereist.'
        });

        return;
      }

      const {
        role
      } = req.body;

      if (
        role !== 'admin' &&
        role !== 'medewerker'
      ) {
        res.status(400).json({
          message:
            'Er is een geldige gebruikersrol vereist.'
        });

        return;
      }

      await this.authService
        .changeUserRole(
          userId,
          role,
          req.user!.userId,
          req.user!.role
        );

      res.status(200).json({
        message:
          'Gebruikersrol succesvol gewijzigd.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De gebruikersrol kon niet worden gewijzigd.';

      let status = 400;

      if (
        message ===
        'Gebruiker niet gevonden.'
      ) {
        status = 404;
      } else if (
        message.includes(
          'Alleen de owner'
        ) ||
        message.includes(
          'owner-account'
        ) ||
        message.includes(
          'eigen rol'
        )
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };

  deleteUser = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    if (
      !this.canManageUsers(
        req,
        res
      )
    ) {
      return;
    }

    try {
      const userId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          userId
        ) ||
        userId <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig gebruikers-ID vereist.'
        });

        return;
      }

      await this.authService
        .deleteUser(
          userId,
          req.user!.userId,
          req.user!.role
        );

      res.status(200).json({
        message:
          'Gebruiker succesvol verwijderd.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De gebruiker kon niet worden verwijderd.';

      let status = 400;

      if (
        message ===
        'Gebruiker niet gevonden.'
      ) {
        status = 404;
      } else if (
        message.includes(
          'geen toestemming'
        ) ||
        message.includes(
          'Een admin kan alleen'
        ) ||
        message.includes(
          'owner-account'
        ) ||
        message.includes(
          'eigen account'
        )
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };
}