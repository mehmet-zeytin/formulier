import { WerkorderRepository } from '../repositories/WerkorderRepository';
import { MateriaalRepository } from '../repositories/MateriaalRepository';
import { FotoRepository } from '../repositories/FotoRepository';
import { Werkorder, Materiaal, Foto } from '../models/Werkorder';
import { EmailService } from './EmailService';

interface WerkorderInput {
  werkorder: Werkorder;
  materialen: Omit<Materiaal, 'werkorder_id'>[];
}

export class WerkorderService {
  private werkorderRepo = new WerkorderRepository();
  private materiaalRepo = new MateriaalRepository();
  private fotoRepo = new FotoRepository();
  private emailService = new EmailService();

  async createWerkorder(input: WerkorderInput): Promise<number> {
    // Bedrijfsregel: het statusveld mag niet leeg zijn
    if (!input.werkorder.status) {
      throw new Error('Statusveld is verplicht');
    }
    for (const materiaal of input.materialen) {
      if (materiaal.aantal < 0) {
        throw new Error(`Materiaalhoeveelheid kan niet negatief zijn: ${materiaal.naam}`);
      }
    }

    // 1. Maak eerst de hoofdwerkorder aan en haal het ID op
    const werkorderId = await this.werkorderRepo.create(input.werkorder);

    // 2. Sla elk meegeleverd materiaal op door het te koppelen aan dit werkorder-ID
    for (const materiaal of input.materialen) {
      await this.materiaalRepo.create({
        ...materiaal,
        werkorder_id: werkorderId
      });
    }

    await this.emailService.sendWerkorderNotification(input.werkorder, input.materialen);

    return werkorderId;
  }

  async getAllWerkorders(): Promise<Werkorder[]> {
    return this.werkorderRepo.findAll();
  }

  async getWerkorderDetail(id: number) {
    const werkorder = await this.werkorderRepo.findById(id);
    if (!werkorder) {
      throw new Error('Werkorder niet gevonden');
    }
    const materialen = await this.materiaalRepo.findByWerkorderId(id);
    const fotos = await this.fotoRepo.findByWerkorderId(id);

    return { ...werkorder, materialen, fotos };
  }
}