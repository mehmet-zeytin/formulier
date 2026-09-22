import {
  Router
} from 'express';

import {
  WerkorderController
} from '../controllers/WerkorderController';

import fotoRoutes
  from './fotoRoutes';

import {
  authMiddleware
} from '../middleware/authMiddleware';

const router = Router();

const controller =
  new WerkorderController();

router.post(
  '/drafts',
  authMiddleware,
  controller.createDraft
);

router.get(
  '/drafts',
  authMiddleware,
  controller.getDrafts
);

router.get(
  '/assignable-users',
  authMiddleware,
  controller.getAssignableUsers
);

router.post(
  '/',
  authMiddleware,
  controller.create
);

router.get(
  '/',
  authMiddleware,
  controller.getAll
);

router.put(
  '/:id/materialen',
  authMiddleware,
  controller.updateMaterialen
);

router.post(
  '/:id/complete',
  authMiddleware,
  controller.completeDraft
);

router.patch(
  '/:id/assignee',
  authMiddleware,
  controller.transferDraft
);

router.get(
  '/:id/assignment-history',
  authMiddleware,
  controller.getAssignmentHistory
);

router.get(
  '/:id/access',
  authMiddleware,
  controller.getAccess
);

router.put(
  '/:id/access',
  authMiddleware,
  controller.updateAccess
);

router.get(
  '/trash',
  authMiddleware,
  controller.getTrash
);

router.patch(
  '/:id/restore',
  authMiddleware,
  controller.restoreWerkorder
);

router.delete(
  '/:id/permanent',
  authMiddleware,
  controller.deleteWerkorderPermanently
);

router.patch(
  '/:id',
  authMiddleware,
  controller.updateDraft
);

router.delete(
  '/:id',
  authMiddleware,
  controller.deleteWerkorder
);

router.get(
  '/:id',
  authMiddleware,
  controller.getById
);


router.use(
  '/:werkorderId/fotos',
  fotoRoutes
);

export default router;