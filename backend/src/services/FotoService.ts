import {
  FotoRepository
} from '../repositories/FotoRepository';

import {
  WerkorderRepository
} from '../repositories/WerkorderRepository';

import type {
  Foto,
  Werkorder
} from '../models/Werkorder';

import type {
  UserRole
} from '../models/User';

interface CreateFotoInput {
  werkorderId: number;

  beschrijving?:
    | string
    | null;

  bestandspad: string;

  genomenOp: string;

  userId: number;

  role: UserRole;
}

export class FotoService {
  private fotoRepo =
    new FotoRepository();

  private werkorderRepo =
    new WerkorderRepository();

  private hasGlobalAccess(
    role: UserRole
  ): boolean {
    return (
      role === 'owner' ||
      role === 'admin'
    );
  }

  private async canAccessWerkorder(
    werkorder: Werkorder,
    userId: number,
    role: UserRole
  ): Promise<boolean> {
    /*
     * Owner en admin hebben
     * toegang tot alle werkorders.
     */
    if (
      this.hasGlobalAccess(
        role
      )
    ) {
      return true;
    }

    /*
     * De huidige verantwoordelijke
     * heeft toegang.
     */
    if (
      werkorder.assigned_to ===
      userId
    ) {
      return true;
    }

    if (!werkorder.id) {
      return false;
    }

    /*
     * Extra toegang via
     * werkorder_access.
     */
    return this.werkorderRepo
      .hasUserAccess(
        werkorder.id,
        userId
      );
  }

  async getFotoForUser(
    werkorderId: number,
    fotoId: number,
    userId: number,
    role: UserRole
  ): Promise<Foto> {
    if (
      !Number.isInteger(
        werkorderId
      ) ||
      werkorderId <= 0
    ) {
      throw new Error(
        'Ongeldig werkorder-ID.'
      );
    }

    if (
      !Number.isInteger(
        fotoId
      ) ||
      fotoId <= 0
    ) {
      throw new Error(
        'Ongeldig foto-ID.'
      );
    }

    const foto =
      await this.fotoRepo.findById(
        fotoId
      );

    if (!foto) {
      throw new Error(
        'Foto niet gevonden.'
      );
    }

    /*
     * De foto moet werkelijk bij
     * de werkorder uit de URL horen.
     */
    if (
      Number(
        foto.werkorder_id
      ) !== werkorderId
    ) {
      throw new Error(
        'Foto hoort niet bij deze werkorder.'
      );
    }

    const werkorder =
      await this.werkorderRepo.findById(
        werkorderId
      );

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    const hasAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!hasAccess) {
      throw new Error(
        'U heeft geen toegang tot deze foto.'
      );
    }

    return foto;
  }

  async createFoto(
    input: CreateFotoInput
  ): Promise<number> {
    if (
      !Number.isInteger(
        input.werkorderId
      ) ||
      input.werkorderId <= 0
    ) {
      throw new Error(
        'Ongeldig werkorder-ID.'
      );
    }

    const werkorder =
      await this.werkorderRepo
        .findById(
          input.werkorderId
        );

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    if (
      Boolean(
        werkorder.is_voltooid
      )
    ) {
      throw new Error(
        'Er kan geen foto worden toegevoegd aan een voltooide werkorder.'
      );
    }

    const canAccess =
      await this.canAccessWerkorder(
        werkorder,
        input.userId,
        input.role
      );

    if (!canAccess) {
      throw new Error(
        'U heeft geen toestemming om een foto aan dit concept toe te voegen.'
      );
    }

    const parsedDate =
      new Date(
        input.genomenOp
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      throw new Error(
        'Er is een geldige datum en tijd voor de foto vereist.'
      );
    }

    const maxAllowedTime =
      Date.now() +
      5 * 60 * 1000;

    if (
      parsedDate.getTime() >
      maxAllowedTime
    ) {
      throw new Error(
        'De datum en tijd van de foto mogen niet in de toekomst liggen.'
      );
    }

    const genomenOpForDatabase =
      parsedDate
        .toISOString()
        .slice(
          0,
          19
        )
        .replace(
          'T',
          ' '
        );

    const beschrijving =
      input.beschrijving
        ?.trim() ??
      null;

    if (
      beschrijving &&
      beschrijving.length >
        2000
    ) {
      throw new Error(
        'De beschrijving van de foto is te lang.'
      );
    }

    const foto: Foto = {
      werkorder_id:
        input.werkorderId,

      beschrijving,

      bestandspad:
        input.bestandspad,

      genomen_op:
        genomenOpForDatabase
    };

    return this.fotoRepo
      .create(
        foto
      );
  }

  async deleteFoto(
    werkorderId: number,
    fotoId: number,
    userId: number,
    role: UserRole
  ): Promise<Foto> {
    if (
      !Number.isInteger(
        werkorderId
      ) ||
      werkorderId <= 0
    ) {
      throw new Error(
        'Ongeldig werkorder-ID.'
      );
    }

    if (
      !Number.isInteger(
        fotoId
      ) ||
      fotoId <= 0
    ) {
      throw new Error(
        'Ongeldig foto-ID.'
      );
    }

    const foto =
      await this.fotoRepo
        .findById(
          fotoId
        );

    if (!foto) {
      throw new Error(
        'Foto niet gevonden.'
      );
    }

    if (
      Number(
        foto.werkorder_id
      ) !== werkorderId
    ) {
      throw new Error(
        'Foto hoort niet bij deze werkorder.'
      );
    }

    const werkorder =
      await this.werkorderRepo
        .findById(
          werkorderId
        );

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    if (
      werkorder.is_voltooid
    ) {
      throw new Error(
        'Foto’s van een voltooide werkorder kunnen niet worden verwijderd.'
      );
    }

    const hasAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!hasAccess) {
      throw new Error(
        'U heeft geen toestemming om een foto van dit concept te verwijderen.'
      );
    }

    await this.fotoRepo.delete(
      fotoId
    );

    return foto;
  }
}