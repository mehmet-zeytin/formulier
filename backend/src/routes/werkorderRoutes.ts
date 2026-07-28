import { Router } from 'express';
import { WerkorderController } from '../controllers/WerkorderController';
import fotoRoutes from './fotoRoutes';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const controller = new WerkorderController();

router.post('/', controller.create);
router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);
router.use('/:werkorderId/fotos', fotoRoutes);

export default router;