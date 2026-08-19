import {
  NextFunction,
  Request,
  Response
} from 'express';

import jwt from 'jsonwebtoken';

import type {
  UserRole
} from '../models/User';

export interface AuthUser {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthRequest
  extends Request {
  user?: AuthUser;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authorization =
    req.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith(
      'Bearer '
    )
  ) {
    res.status(401).json({
      message:
        'U moet ingelogd zijn.'
    });

    return;
  }

  const token =
    authorization.substring(7);

  const jwtSecret =
    process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      message:
        'JWT_SECRET is niet geconfigureerd.'
    });

    return;
  }

  try {
    const decoded =
      jwt.verify(
        token,
        jwtSecret
      ) as Partial<AuthUser>;

    const validRole =
      decoded.role === 'owner' ||
      decoded.role === 'admin' ||
      decoded.role === 'medewerker';

    if (
      typeof decoded.userId !==
        'number' ||
      typeof decoded.email !==
        'string' ||
      !validRole
    ) {
      res.status(401).json({
        message:
          'Ongeldige sessie.'
      });

      return;
    }

    req.user = {
      userId:
        decoded.userId,

      email:
        decoded.email,

      role:
        decoded.role as UserRole
    };

    next();
  } catch {
    res.status(401).json({
      message:
        'Uw sessie is ongeldig of verlopen.'
    });
  }
};