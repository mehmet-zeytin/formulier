import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FotoService } from '../services/FotoService';
import fs from 'fs';
import path from 'path';

export class FotoController {
  private fotoService = new FotoService();

  upload = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: 'Giriş yapmanız gerekiyor.'
        });
        return;
      }

      const werkorderId = Number(req.params.werkorderId);

      if (
        !Number.isInteger(werkorderId) ||
        werkorderId <= 0
      ) {
        res.status(400).json({
          message: 'Geçerli bir werkorder ID gerekli.'
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          message: 'Fotoğraf dosyası gerekli.'
        });
        return;
      }

      const { beschrijving, genomen_op } = req.body;

      const genomenOp =
        typeof genomen_op === 'string' &&
        genomen_op.trim()
          ? genomen_op.trim()
          : new Date().toISOString();

      const bestandspad =
        `/uploads/${req.file.filename}`;

      const fotoId = await this.fotoService.createFoto({
        werkorderId,
        beschrijving:
          typeof beschrijving === 'string'
            ? beschrijving.trim() || null
            : null,
        bestandspad,
        genomenOp,
        userId: req.user.userId,
        role: req.user.role
      });

      res.status(201).json({
        message: 'Fotoğraf başarıyla yüklendi.',
        id: fotoId,
        pad: bestandspad,
        genomen_op: genomenOp
      });
    } catch (error: unknown) {
      /*
       * Multer dosyayı controller çalışmadan önce diske
       * kaydetti. Veritabanı veya yetki işlemi başarısız
       * olursa sahipsiz dosyayı temizliyoruz.
       */
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Fotoğraf yüklenemedi.';

      let status = 400;

      if (message === 'Werkorder bulunamadı.') {
        status = 404;
      } else if (
        message ===
        'Bu taslağa fotoğraf ekleme yetkiniz yok.'
      ) {
        status = 403;
      } else if (
        message ===
        'Tamamlanmış werkorder için fotoğraf eklenemez.'
      ) {
        status = 409;
      }

      res.status(status).json({ message });
    }
  };

  delete = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message: 'Giriş yapmanız gerekiyor.'
        });
        return;
      }

      const fotoId = Number(req.params.fotoId);

      if (!Number.isInteger(fotoId) || fotoId <= 0) {
        res.status(400).json({
          message: 'Geçerli bir fotoğraf ID gerekli.'
        });
        return;
      }

      const foto = await this.fotoService.deleteFoto(
        fotoId,
        req.user.userId,
        req.user.role
      );

      const relativePath =
        foto.bestandspad.replace(/^\/+/, '');

      const filePath = path.resolve(
        __dirname,
        '../..',
        relativePath
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.status(200).json({
        message: 'Fotoğraf başarıyla silindi.'
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Fotoğraf silinemedi.';

      let status = 400;

      if (
        message === 'Fotoğraf bulunamadı.' ||
        message === 'Werkorder bulunamadı.'
      ) {
        status = 404;
      } else if (
        message ===
        'Bu fotoğrafı silme yetkiniz yok.'
      ) {
        status = 403;
      } else if (
        message ===
        'Tamamlanmış werkorder üzerindeki fotoğraf silinemez.'
      ) {
        status = 409;
      }

      res.status(status).json({ message });
    }
  };
}