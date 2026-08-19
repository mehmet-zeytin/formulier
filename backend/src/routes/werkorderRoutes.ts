import { Router } from 'express';
import { WerkorderController } from '../controllers/WerkorderController';
import fotoRoutes from './fotoRoutes';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const controller = new WerkorderController();


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
  '/:id',
  authMiddleware,
  controller.updateDraft
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