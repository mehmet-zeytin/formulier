import express, {
  NextFunction,
  Request,
  Response
} from 'express';

import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import {
  rateLimit
} from 'express-rate-limit';

import werkorderRoutes
  from './routes/werkorderRoutes';

import authRoutes
  from './routes/authRoutes';

dotenv.config();

const app =
  express();

const PORT =
  process.env.PORT ||
  3000;

const frontendUrl =
  process.env.FRONTEND_URL;

if (!frontendUrl) {
  throw new Error(
    'FRONTEND_URL is niet geconfigureerd.'
  );
}

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [
        frontendUrl
      ]
    : [
        frontendUrl,
        'http://localhost:5173',
        'http://localhost:5174'
      ];

const stateChangingMethods =
  new Set([
    'POST',
    'PUT',
    'PATCH',
    'DELETE'
  ]);

const csrfOriginProtection:
  express.RequestHandler =
  (
    req,
    res,
    next
  ) => {
    if (
      !stateChangingMethods.has(
        req.method
      )
    ) {
      return next();
    }

    const origin =
      req.get(
        'origin'
      );

    if (
      !origin ||
      !allowedOrigins.includes(
        origin
      )
    ) {
      return res
        .status(403)
        .json({
          message:
            'Verzoek geblokkeerd vanwege ongeldige herkomst.'
        });
    }

    next();
  };

/*
 * Security headers
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },

    contentSecurityPolicy: {
      directives: {
        imgSrc: [
          "'self'",
          'data:',
          'blob:'
        ]
      }
    }
  })
);

/*
 * Request logging
 */
app.use(
  (
    req,
    res,
    next
  ) => {
    const start =
      Date.now();

    res.on(
      'finish',
      () => {
        const duration =
          Date.now() -
          start;

        console.log(
          [
            new Date()
              .toISOString(),
            req.method,
            req.path,
            res.statusCode,
            `${duration}ms`
          ].join(' ')
        );
      }
    );

    next();
  }
);

/*
 * CORS
 */
app.use(
  cors({
    origin:
      allowedOrigins,

    credentials:
      true
  })
);

/*
 * CSRF origin protection
 */
app.use(
  csrfOriginProtection
);

/*
 * Cookies
 */
app.use(
  cookieParser()
);

/*
 * JSON body parser
 */
app.use(
  express.json({
    limit:
      '100kb'
  })
);

/*
 * General API rate limit
 */
const apiLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      300,

    standardHeaders:
      'draft-7',

    legacyHeaders:
      false,

    message: {
      message:
        'Te veel verzoeken. Probeer het later opnieuw.'
    }
  });

app.use(
  '/api',
  apiLimiter
);

/*
 * API routes
 */
app.use(
  '/api/werkorders',
  werkorderRoutes
);

app.use(
  '/api/auth',
  authRoutes
);

/*
 * API health check
 */
app.get(
  '/api/health',
  (
    req,
    res
  ) => {
    res.json({
      message:
        'Formulier API werkt'
    });
  }
);

/*
 * Frontend production build
 */
const frontendDistPath =
  path.resolve(
    __dirname,
    '../../frontend/dist'
  );

app.use(
  express.static(
    frontendDistPath
  )
);

/*
 * React Router fallback
 *
 * Express 5 gebruikt een benoemde wildcard.
 */
app.get(
  '/*splat',
  (
    req,
    res,
    next
  ) => {
    if (
      req.path.startsWith(
        '/api'
      )
    ) {
      return next();
    }

    res.sendFile(
      path.join(
        frontendDistPath,
        'index.html'
      )
    );
  }
);

/*
 * API 404
 */
app.use(
  '/api',
  (
    req,
    res
  ) => {
    res.status(404).json({
      message:
        'API-endpoint niet gevonden.'
    });
  }
);

/*
 * Invalid JSON
 */
app.use(
  (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (
      err instanceof SyntaxError &&
      'status' in err &&
      (
        err as {
          status?: number;
        }
      ).status === 400 &&
      'body' in err
    ) {
      res.status(400).json({
        message:
          'Ongeldige JSON in het verzoek.'
      });

      return;
    }

    next(err);
  }
);

/*
 * Request too large
 */
app.use(
  (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (
      typeof err ===
        'object' &&
      err !== null &&
      'status' in err &&
      (
        err as {
          status?: number;
        }
      ).status === 413
    ) {
      res.status(413).json({
        message:
          'Het verzoek is te groot.'
      });

      return;
    }

    next(err);
  }
);

/*
 * Generic server error
 */
app.use(
  (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    console.error(
      'Onverwachte serverfout:',
      err
    );

    res.status(500).json({
      message:
        'Er is een interne serverfout opgetreden.'
    });
  }
);

app.listen(
  PORT,
  () => {
    console.log(
      `Server draait op http://localhost:${PORT}`
    );
  }
);