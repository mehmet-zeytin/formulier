import { Router } from 'express';
import { FotoController } from '../controllers/FotoController';
import { upload } from '../config/multer';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });
const controller = new FotoController();

router.post('/', upload.single('foto'), controller.upload);
router.delete('/:fotoId', authMiddleware, controller.delete);

export default router;