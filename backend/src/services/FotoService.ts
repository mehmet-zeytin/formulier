import { FotoRepository } from '../repositories/FotoRepository';
import { WerkorderRepository } from '../repositories/WerkorderRepository';
import { Foto } from '../models/Werkorder';

type UserRole = 'owner' | 'admin' | 'medewerker';

interface CreateFotoInput {
  werkorderId: number;
  beschrijving?: string | null;
  bestandspad: string;
  genomenOp: string;
  userId: number;
  role: UserRole;
}

export class FotoService {
  private fotoRepo = new FotoRepository();
  private werkorderRepo = new WerkorderRepository();

  async createFoto(
    input: CreateFotoInput
  ): Promise<number> {
    const werkorder =
      await this.werkorderRepo.findById(
        input.werkorderId
      );

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    if (werkorder.is_voltooid) {
      throw new Error(
        'Er kan geen foto worden toegevoegd aan een voltooide werkorder.'
      );
    }

    const isAdmin =
      input.role === 'admin';

    const isOwner =
      werkorder.created_by ===
      input.userId;

    if (!isAdmin && !isOwner) {
      throw new Error(
        'U heeft geen toestemming om een foto aan dit concept toe te voegen.'
      );
    }

    /*
     * Frontend kan bijvoorbeeld dit formaat sturen:
     *
     * 2026-08-18T09:39:41.709Z
     *
     * MySQL DATETIME verwacht:
     *
     * 2026-08-18 09:39:41
     */
    const parsedDate =
      new Date(input.genomenOp);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      throw new Error(
        'Er is een geldige datum en tijd voor de foto vereist.'
      );
    }

    /*
     * ISO datum omzetten naar een formaat
     * dat MySQL DATETIME accepteert.
     */
    const genomenOpForDatabase =
      parsedDate
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

    const foto: Foto = {
      werkorder_id:
        input.werkorderId,

      beschrijving:
        input.beschrijving ?? null,

      bestandspad:
        input.bestandspad,

      genomen_op:
        genomenOpForDatabase
    };

    return this.fotoRepo.create(
      foto
    );
  }

  async deleteFoto(
    fotoId: number,
    userId: number,
    role: UserRole
  ): Promise<Foto> {
    const foto =
      await this.fotoRepo.findById(
        fotoId
      );

    if (!foto) {
      throw new Error(
        'Foto niet gevonden.'
      );
    }

    const werkorder =
      await this.werkorderRepo.findById(
        foto.werkorder_id
      );

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    if (werkorder.is_voltooid) {
      throw new Error(
        'Een foto van een voltooide werkorder kan niet worden verwijderd.'
      );
    }

    const isAdmin =
      role === 'owner' ||
      role === 'admin';

    const isOwner =
      werkorder.created_by ===
      userId;

    if (!isAdmin && !isOwner) {
      throw new Error(
        'U heeft geen toestemming om deze foto te verwijderen.'
      );
    }

    const deleted =
      await this.fotoRepo.delete(
        fotoId
      );

    if (!deleted) {
      throw new Error(
        'De foto kon niet worden verwijderd.'
      );
    }

    return foto;
  }
}