import {
  NextFunction,
  Request,
  Response
} from 'express';

import jwt from 'jsonwebtoken';

import {
  UserRepository
} from '../repositories/UserRepository';

import type {
  UserRole
} from '../models/User';

interface JwtPayload {
  userId: number;

  email?: string;

  role?: UserRole;

  iat?: number;

  tokenVersion?: number;

  exp?: number;
}

export interface AuthenticatedUser {
  userId: number;

  email: string;

  role: UserRole;
}

export interface AuthRequest
  extends Request {
  user?:
    AuthenticatedUser;
}

const AUTH_COOKIE_NAME =
  'auth_token';

const userRepository =
  new UserRepository();

export const authMiddleware =
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      /*
       * JWT wordt uit de
       * HttpOnly-cookie gehaald.
       */
      
      console.log(
        'COOKIE DEBUG:',
        req.cookies
      );
      
      const token =
        req.cookies?.[
          AUTH_COOKIE_NAME
        ];

      if (
        typeof token !==
          'string' ||
        !token
      ) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const jwtSecret =
        process.env.JWT_SECRET;

      if (!jwtSecret) {
        console.error(
          'JWT_SECRET is niet geconfigureerd.'
        );

        res.status(500).json({
          message:
            'Er is een serverfout opgetreden.'
        });

        return;
      }

      /*
       * Handtekening en vervaldatum
       * controleren.
       */
      const decoded =
        jwt.verify(
          token,
          jwtSecret
        ) as JwtPayload;

      if (
        !Number.isInteger(
          decoded.userId
        ) ||
        decoded.userId <=
          0
      ) {
        res.status(401).json({
          message:
            'Ongeldige authenticatie.'
        });

        return;
      }

      /*
       * Gebruiker opnieuw uit
       * database ophalen.
       */
      const user =
        await userRepository
          .findById(
            decoded.userId
          );

      if (!user) {
        res.status(401).json({
          message:
            'Uw account bestaat niet meer.'
        });

        return;
      }

      /*
       * token_version voorkomt dat
       * oude sessies geldig blijven
       * na wachtwoordwijzigingen of
       * andere invalidaties.
       */
      if (
        !Number.isInteger(
          decoded.tokenVersion
        ) ||
        decoded.tokenVersion !==
          user.token_version
      ) {
        res.status(401).json({
          message:
            'Uw sessie is niet meer geldig. Log opnieuw in.'
        });

        return;
      }

      if (
        Boolean(
          user.is_deleted
        )
      ) {
        res.status(401).json({
          message:
            'Uw account is verwijderd. Log opnieuw in met een actief account.'
        });

        return;
      }

      /*
       * Altijd de actuele rol
       * uit de database gebruiken.
       */
      if (
        user.role !==
          'owner' &&
        user.role !==
          'admin' &&
        user.role !==
          'medewerker'
      ) {
        res.status(401).json({
          message:
            'Uw account heeft geen geldige gebruikersrol.'
        });

        return;
      }

      req.user = {
        userId:
          user.id,

        email:
          user.email,

        role:
          user.role
      };

      next();
    } catch (
      error: unknown
    ) {
      if (
        error instanceof
          jwt.TokenExpiredError
      ) {
        res.status(401).json({
          message:
            'Uw sessie is verlopen. Log opnieuw in.'
        });

        return;
      }

      if (
        error instanceof
          jwt.JsonWebTokenError
      ) {
        res.status(401).json({
          message:
            'Ongeldige authenticatie.'
        });

        return;
      }

      console.error(
        'Authenticatiefout:',
        error
      );

      res.status(500).json({
        message:
          'Er is een serverfout opgetreden tijdens de authenticatie.'
      });
    }
  };