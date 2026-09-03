import {
  Request,
  Response
} from 'express';

import {
  AuthService
} from '../services/AuthService';

import type {
  AuthRequest
} from '../middleware/authMiddleware';

const AUTH_COOKIE_NAME =
  'auth_token';

const AUTH_COOKIE_MAX_AGE =
  8 *
  60 *
  60 *
  1000;

export class AuthController {
  private authService =
    new AuthService();

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
          email,
          password
        );

      /*
      * JWT wordt alleen als
      * HttpOnly-cookie opgeslagen.
      *
      * JavaScript in de frontend
      * kan deze cookie niet uitlezen.
      */
      res.cookie(
        AUTH_COOKIE_NAME,
        token,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            'production',

          sameSite:
            'lax',

          maxAge:
            AUTH_COOKIE_MAX_AGE,

          path:
            '/'
        }
      );

      /*
      * JWT wordt bewust NIET
      * teruggestuurd naar de frontend.
      */
      res.status(200).json({
        message:
          'Inloggen succesvol.'
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

  logout = (
    req: Request,
    res: Response
  ): void => {
    /*
     * Dezelfde relevante cookie-
     * eigenschappen gebruiken bij
     * het verwijderen.
     */
    res.clearCookie(
      AUTH_COOKIE_NAME,
      {
        httpOnly:
          true,

        secure:
          process.env.NODE_ENV ===
          'production',

        sameSite:
          'lax',

        path:
          '/'
      }
    );

    res.status(200).json({
      message:
        'Uitloggen succesvol.'
    });
  };

  me = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        message:
          'U moet ingelogd zijn.'
      });

      return;
    }

    res.status(200).json({
      userId:
        req.user.userId,

      email:
        req.user.email,

      role:
        req.user.role
    });
  };

  getUsers = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const users =
        await this.authService.getUsers(
          req.user.role
        );

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

      res.status(403).json({
        message
      });
    }
  };

  getDeletedUsers = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const users =
        await this.authService
          .getDeletedUsers(
            req.user.role
          );

      res.status(200).json(
        users
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Verwijderde gebruikers konden niet worden geladen.';

      res.status(403).json({
        message
      });
    }
  };

  createUser = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

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
        await this.authService
          .createUser(
            email,
            password,
            role,
            req.user.role
          );

      res.status(201).json({
        message:
          'Gebruiker succesvol aangemaakt.',

        id:
          userId
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De gebruiker kon niet worden aangemaakt.';

      let status =
        400;

      if (
        message.includes(
          'bestaat'
        )
      ) {
        status =
          409;
      }

      if (
        message.includes(
          'toestemming'
        ) ||
        message.includes(
          'admin kan alleen'
        )
      ) {
        status =
          403;
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
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const userId =
        Number(
          req.params.id
        );

      const {
        role
      } = req.body;

      if (
        !Number.isInteger(
          userId
        ) ||
        userId <= 0 ||
        (
          role !== 'admin' &&
          role !== 'medewerker'
        )
      ) {
        res.status(400).json({
          message:
            'Ongeldige gebruiker of rol.'
        });

        return;
      }

      await this.authService
        .changeUserRole(
          userId,
          role,
          req.user.userId,
          req.user.role
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

      res.status(
        message.includes(
          'niet gevonden'
        )
          ? 404
          : 403
      ).json({
        message
      });
    }
  };

  changePassword = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const userId =
        Number(
          req.params.id
        );

      const {
        password
      } = req.body;

      if (
        !Number.isInteger(
          userId
        ) ||
        userId <= 0 ||
        typeof password !==
          'string'
      ) {
        res.status(400).json({
          message:
            'Ongeldige gebruiker of wachtwoord.'
        });

        return;
      }

      await this.authService
        .changeUserPassword(
          userId,
          password,
          req.user.userId,
          req.user.role
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

      let status =
        400;

      if (
        message ===
        'Gebruiker niet gevonden.'
      ) {
        status =
          404;
      } else if (
        message.includes(
          'admin'
        ) ||
        message.includes(
          'owner'
        ) ||
        message.includes(
          'toestemming'
        )
      ) {
        status =
          403;
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
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const userId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          userId
        ) ||
        userId <= 0
      ) {
        res.status(400).json({
          message:
            'Ongeldige gebruiker.'
        });

        return;
      }

      await this.authService
        .deleteUser(
          userId,
          req.user.userId,
          req.user.role
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

      let status =
        403;

      if (
        message ===
        'Gebruiker niet gevonden.'
      ) {
        status =
          404;
      }

      res.status(status).json({
        message
      });
    }
  };

  restoreUser = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const userId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          userId
        ) ||
        userId <= 0
      ) {
        res.status(400).json({
          message:
            'Ongeldige gebruiker.'
        });

        return;
      }

      await this.authService
        .restoreUser(
          userId,
          req.user.role
        );

      res.status(200).json({
        message:
          'Gebruiker succesvol hersteld.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De gebruiker kon niet worden hersteld.';

      res.status(
        message.includes(
          'niet gevonden'
        )
          ? 404
          : 403
      ).json({
        message
      });
    }
  };
}