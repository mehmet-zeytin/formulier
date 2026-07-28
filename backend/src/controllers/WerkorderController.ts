import { Request, Response } from 'express';
import { WerkorderService } from '../services/WerkorderService';

export class WerkorderController {
  private werkorderService = new WerkorderService();

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { werkorder, materialen } = req.body;
      const newId = await this.werkorderService.createWerkorder({ werkorder, materialen });
      res.status(201).json({ message: 'Werkorder başarıyla oluşturuldu', id: newId });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const werkorders = await this.werkorderService.getAllWerkorders();
      res.status(200).json(werkorders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const detail = await this.werkorderService.getWerkorderDetail(id);
      res.status(200).json(detail);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  };
}