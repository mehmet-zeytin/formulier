import { Router } from 'express';
import { FotoController } from '../controllers/FotoController';
import { upload } from '../config/multer';

const router = Router({ mergeParams: true });
const controller = new FotoController();

router.post('/', upload.single('foto'), controller.upload);

export default router;