import { Request, Response } from 'express';
import { FotoRepository } from '../repositories/FotoRepository';

export class FotoController {
  private fotoRepo = new FotoRepository();

  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      const werkorderId = Number(req.params.werkorderId);
      const { beschrijving } = req.body;

      if (!req.file) {
        res.status(400).json({ message: 'Foto dosyası gerekli' });
        return;
      }

      const bestandspad = `/uploads/${req.file.filename}`;

      const fotoId = await this.fotoRepo.create({
        werkorder_id: werkorderId,
        beschrijving,
        bestandspad
      });

      res.status(201).json({ message: 'Foto başarıyla yüklendi', id: fotoId, pad: bestandspad });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}