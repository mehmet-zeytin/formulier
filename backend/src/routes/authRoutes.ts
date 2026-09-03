import {
  Router
} from 'express';

import {
  rateLimit
} from 'express-rate-limit';

import {
  AuthController
} from '../controllers/AuthController';

import {
  authMiddleware
} from '../middleware/authMiddleware';

const router =
  Router();

const controller =
  new AuthController();

const loginLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit:
      5,

    standardHeaders:
      'draft-7',

    legacyHeaders:
      false,

    skipSuccessfulRequests:
      true,

    message: {
      message:
        'Te veel inlogpogingen. Probeer het over 15 minuten opnieuw.'
    }
  });

router.post(
  '/login',
  loginLimiter,
  controller.login
);

router.post(
  '/logout',
  controller.logout
);

router.get(
  '/me',
  authMiddleware,
  controller.me
);

router.get(
  '/users',
  authMiddleware,
  controller.getUsers
);

router.get(
  '/users/deleted',
  authMiddleware,
  controller.getDeletedUsers
);

router.post(
  '/users',
  authMiddleware,
  controller.createUser
);

router.patch(
  '/users/:id/role',
  authMiddleware,
  controller.changeRole
);

router.patch(
  '/users/:id/password',
  authMiddleware,
  controller.changePassword
);

router.delete(
  '/users/:id',
  authMiddleware,
  controller.deleteUser
);

router.patch(
  '/users/:id/restore',
  authMiddleware,
  controller.restoreUser
);

export default router;