import { Request, Response } from 'express';
import { FotoRepository } from '../repositories/FotoRepository';
import fs from 'fs';
import path from 'path';

export class FotoController {
  private fotoRepo = new FotoRepository();

  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      const werkorderId = Number(req.params.werkorderId);
      const { beschrijving } = req.body;

      if (!req.file) {
        res.status(400).json({ message: 'Fotobestand is vereist' });
        return;
      }

      const bestandspad = `/uploads/${req.file.filename}`;

      const fotoId = await this.fotoRepo.create({
        werkorder_id: werkorderId,
        beschrijving,
        bestandspad
      });

      res.status(201).json({ message: 'Foto succesvol geüpload', id: fotoId, pad: bestandspad });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const fotoId = Number(req.params.fotoId);

      const foto = await this.fotoRepo.findById(fotoId);
      if (!foto) {
        res.status(404).json({ message: 'Foto niet gevonden' });
        return;
      }

      // Verwijder het daadwerkelijke bestand van de schijf
      const filePath = path.join(__dirname, '../..', foto.bestandspad);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Verwijder de database record
      await this.fotoRepo.delete(fotoId);

      res.status(200).json({ message: 'Foto succesvol verwijderd' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}