import { WerkorderRepository } from '../repositories/WerkorderRepository';
import { MateriaalRepository } from '../repositories/MateriaalRepository';
import { FotoRepository } from '../repositories/FotoRepository';
import { Werkorder, Materiaal, Foto } from '../models/Werkorder';

interface WerkorderInput {
  werkorder: Werkorder;
  materialen: Omit<Materiaal, 'werkorder_id'>[];
}

export class WerkorderService {
  private werkorderRepo = new WerkorderRepository();
  private materiaalRepo = new MateriaalRepository();
  private fotoRepo = new FotoRepository();

  async createWerkorder(input: WerkorderInput): Promise<number> {
    // İş kuralı: status alanı boş olamaz
    if (!input.werkorder.status) {
      throw new Error('Status alanı zorunludur');
    }

    // 1. Önce ana werkorder kaydını oluştur, id'sini al
    const werkorderId = await this.werkorderRepo.create(input.werkorder);

    // 2. Gelen her materyali, bu werkorder id'sine bağlayarak kaydet
    for (const materiaal of input.materialen) {
      await this.materiaalRepo.create({
        ...materiaal,
        werkorder_id: werkorderId
      });
    }

    return werkorderId;
  }

  async getAllWerkorders(): Promise<Werkorder[]> {
    return this.werkorderRepo.findAll();
  }

  async getWerkorderDetail(id: number) {
    const werkorder = await this.werkorderRepo.findById(id);
    if (!werkorder) {
      throw new Error('Werkorder bulunamadı');
    }
    const materialen = await this.materiaalRepo.findByWerkorderId(id);
    const fotos = await this.fotoRepo.findByWerkorderId(id);

    return { ...werkorder, materialen, fotos };
  }
}