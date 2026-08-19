import { Router } from 'express';

import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

const controller =
  new AuthController();

router.post(
  '/login',
  controller.login
);

router.get(
  '/users',
  authMiddleware,
  controller.getUsers
);

router.post(
  '/users',
  authMiddleware,
  controller.createUser
);

router.patch(
  '/users/:id/password',
  authMiddleware,
  controller.resetPassword
);

router.patch(
  '/users/:id/role',
  authMiddleware,
  controller.changeRole
);

router.delete(
  '/users/:id',
  authMiddleware,
  controller.deleteUser
);

export default router;