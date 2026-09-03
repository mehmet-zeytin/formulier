import {
  Router
} from 'express';

import {
  rateLimit
} from 'express-rate-limit';

import {
  FotoController
} from '../controllers/FotoController';

import {
  upload
} from '../config/multer';

import {
  authMiddleware
} from '../middleware/authMiddleware';

const router =
  Router({
    mergeParams: true
  });

const controller =
  new FotoController();

const fotoUploadLimiter =
  rateLimit({
    windowMs:
      15 *
      60 *
      1000,

    limit: 30,

    standardHeaders:
      'draft-7',

    legacyHeaders:
      false,

    message: {
      message:
        'Te veel foto-uploadpogingen. Probeer het later opnieuw.'
    }
  });

router.get(
  '/:fotoId/file',
  authMiddleware,
  controller.getFile
);

router.post(
  '/',
  authMiddleware,
  fotoUploadLimiter,
  upload.single(
    'foto'
  ),
  controller.upload
);

router.delete(
  '/:fotoId',
  authMiddleware,
  controller.delete
);

export default router;