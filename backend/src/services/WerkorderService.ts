import {
  WerkorderRepository
} from '../repositories/WerkorderRepository';

import {
  MateriaalRepository
} from '../repositories/MateriaalRepository';

import {
  FotoRepository
} from '../repositories/FotoRepository';

import {
  Werkorder,
  Materiaal
} from '../models/Werkorder';

import type {
  UserRole
} from '../models/User';

import {
  EmailService
} from './EmailService';

interface WerkorderInput {
  werkorder: Werkorder;
  materialen: Omit<
    Materiaal,
    'werkorder_id'
  >[];
  createdBy: number;
}

export class WerkorderService {
  private werkorderRepo =
    new WerkorderRepository();

  private materiaalRepo =
    new MateriaalRepository();

  private fotoRepo =
    new FotoRepository();

  private emailService =
    new EmailService();

  private hasGlobalAccess(
    role: UserRole
  ): boolean {
    return (
      role === 'owner' ||
      role === 'admin'
    );
  }

  async createWerkorder(
    input: WerkorderInput
  ): Promise<number> {
    if (
      !input.werkorder.status
    ) {
      throw new Error(
        'Het statusveld is verplicht.'
      );
    }

    for (
      const materiaal
      of input.materialen
    ) {
      if (
        materiaal.aantal < 0
      ) {
        throw new Error(
          `De hoeveelheid van een materiaal mag niet negatief zijn: ${materiaal.naam}`
        );
      }
    }

    const werkorderId =
      await this.werkorderRepo.create(
        input.werkorder,
        input.createdBy
      );

    for (
      const materiaal
      of input.materialen
    ) {
      await this.materiaalRepo.create({
        ...materiaal,
        werkorder_id:
          werkorderId
      });
    }

    await this.emailService
      .sendWerkorderNotification(
        input.werkorder,
        input.materialen
      );

    return werkorderId;
  }

  async createDraft(
    werkorderId: string,
    datum: string,
    createdBy: number
  ): Promise<number> {
    const normalizedWerkorderId =
      werkorderId.trim();

    if (
      !normalizedWerkorderId
    ) {
      throw new Error(
        'Het werkorder-ID is verplicht.'
      );
    }

    if (!datum) {
      throw new Error(
        'De datum is verplicht.'
      );
    }

    const parsedDate =
      new Date(
        `${datum}T00:00:00`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      throw new Error(
        'Er is een geldige datum vereist.'
      );
    }

    return this.werkorderRepo
      .createDraft(
        normalizedWerkorderId,
        datum,
        createdBy
      );
  }

  async getDrafts(
    userId: number,
    role: UserRole
  ): Promise<Werkorder[]> {
    if (
      this.hasGlobalAccess(
        role
      )
    ) {
      return this.werkorderRepo
        .findAllDrafts();
    }

    return this.werkorderRepo
      .findDraftsByUser(
        userId
      );
  }

  async updateDraft(
    id: number,
    updates:
      Partial<Werkorder>,
    userId: number,
    role: UserRole
  ): Promise<void> {
    const werkorder =
      await this.werkorderRepo
        .findById(id);

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    if (
      werkorder.is_voltooid
    ) {
      throw new Error(
        'Een voltooide werkorder kan niet worden gewijzigd.'
      );
    }

    const hasGlobalAccess =
      this.hasGlobalAccess(
        role
      );

    const isCreator =
      werkorder.created_by ===
      userId;

    if (
      !hasGlobalAccess &&
      !isCreator
    ) {
      throw new Error(
        'U heeft geen toestemming om dit concept te wijzigen.'
      );
    }

    if (
      updates.status !==
        undefined &&
      updates.status !==
        null &&
      ![
        'Voltooid',
        'Niet Voltooid',
        'In Afwachting'
      ].includes(
        updates.status
      )
    ) {
      throw new Error(
        'Ongeldige werkorderstatus.'
      );
    }

    if (
      updates.werkorder_id !==
        undefined &&
      typeof
        updates.werkorder_id ===
        'string' &&
      !updates.werkorder_id
        .trim()
    ) {
      throw new Error(
        'Het werkorder-ID mag niet leeg zijn.'
      );
    }

    if (
      updates.datum !==
        undefined &&
      typeof updates.datum ===
        'string'
    ) {
      const parsedDate =
        new Date(
          `${updates.datum}T00:00:00`
        );

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        throw new Error(
          'Er is een geldige datum vereist.'
        );
      }
    }

    const updated =
      await this.werkorderRepo
        .updateDraft(
          id,
          updates
        );

    if (!updated) {
      throw new Error(
        'Er zijn geen geldige velden aangeleverd om bij te werken.'
      );
    }
  }

  async updateDraftMaterialen(
    id: number,
    materialen: Omit<
      Materiaal,
      'id' |
      'werkorder_id'
    >[],
    userId: number,
    role: UserRole
  ): Promise<void> {
    const werkorder =
      await this.werkorderRepo
        .findById(id);

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    if (
      werkorder.is_voltooid
    ) {
      throw new Error(
        'De materialen van een voltooide werkorder kunnen niet worden gewijzigd.'
      );
    }

    const hasGlobalAccess =
      this.hasGlobalAccess(
        role
      );

    const isCreator =
      werkorder.created_by ===
      userId;

    if (
      !hasGlobalAccess &&
      !isCreator
    ) {
      throw new Error(
        'U heeft geen toestemming om de materialen van dit concept te wijzigen.'
      );
    }

    const allowedTips = [
      'klant',
      'bedrijf',
      'verkoop'
    ] as const;

    const normalizedMaterialen =
      materialen.map(
        (
          materiaal,
          index
        ) => {
          if (
            typeof materiaal !==
              'object' ||
            materiaal === null
          ) {
            throw new Error(
              `Materiaal ${index + 1} is ongeldig.`
            );
          }

          if (
            !allowedTips.includes(
              materiaal.tip as
                (typeof allowedTips)[number]
            )
          ) {
            throw new Error(
              `Het type van materiaal ${index + 1} is ongeldig.`
            );
          }

          if (
            typeof
              materiaal.naam !==
              'string' ||
            !materiaal.naam.trim()
          ) {
            throw new Error(
              `De naam van materiaal ${index + 1} is verplicht.`
            );
          }

          const aantal =
            Number(
              materiaal.aantal
            );

          if (
            !Number.isFinite(
              aantal
            ) ||
            aantal < 0
          ) {
            throw new Error(
              `De hoeveelheid van materiaal ${index + 1} is ongeldig.`
            );
          }

          let eenheid:
            | string
            | undefined;

          if (
            materiaal.eenheid !==
              undefined &&
            materiaal.eenheid !==
              null
          ) {
            if (
              typeof
                materiaal.eenheid !==
                'string'
            ) {
              throw new Error(
                `De eenheid van materiaal ${index + 1} is ongeldig.`
              );
            }

            eenheid =
              materiaal.eenheid
                .trim() ||
              undefined;
          }

          return {
            tip:
              materiaal.tip,

            naam:
              materiaal.naam
                .trim(),

            aantal,

            eenheid
          };
        }
      );

    await this.materiaalRepo
      .replaceForWerkorder(
        id,
        normalizedMaterialen
      );
  }

  async completeDraft(
    id: number,
    userId: number,
    role: UserRole
  ): Promise<void> {
    const werkorder =
      await this.werkorderRepo
        .findById(id);

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    if (
      werkorder.is_voltooid
    ) {
      throw new Error(
        'De werkorder is al voltooid.'
      );
    }

    const hasGlobalAccess =
      this.hasGlobalAccess(
        role
      );

    const isCreator =
      werkorder.created_by ===
      userId;

    if (
      !hasGlobalAccess &&
      !isCreator
    ) {
      throw new Error(
        'U heeft geen toestemming om dit concept te voltooien.'
      );
    }

    const requiredFields = [
      werkorder.werkorder_id,
      werkorder.aankomsttijd,
      werkorder.eindtijd,
      werkorder.datum,
      werkorder
        .uitgevoerde_werkzaamheden,
      werkorder.status
    ];

    const hasMissingField =
      requiredFields.some(
        value =>
          value === null ||
          value === undefined ||
          String(value)
            .trim() === ''
      );

    if (hasMissingField) {
      throw new Error(
        'Alle verplichte velden moeten worden ingevuld voordat het concept kan worden voltooid.'
      );
    }

    const completed =
      await this.werkorderRepo
        .completeDraft(id);

    if (!completed) {
      throw new Error(
        'Het concept kon niet worden voltooid.'
      );
    }
  }

  async getAllWerkorders(
    userId: number,
    role: UserRole
  ): Promise<Werkorder[]> {
    if (
      this.hasGlobalAccess(
        role
      )
    ) {
      return this.werkorderRepo
        .findAll();
    }

    return this.werkorderRepo
      .findByUser(
        userId
      );
  }

  async getWerkorderDetail(
    id: number,
    userId: number,
    role: UserRole
  ) {
    const werkorder =
      await this.werkorderRepo
        .findById(id);

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    const hasGlobalAccess =
      this.hasGlobalAccess(
        role
      );

    const isCreator =
      werkorder.created_by ===
      userId;

    if (
      !hasGlobalAccess &&
      !isCreator
    ) {
      throw new Error(
        'U heeft geen toegang tot deze werkorder.'
      );
    }

    const materialen =
      await this.materiaalRepo
        .findByWerkorderId(
          id
        );

    const fotos =
      await this.fotoRepo
        .findByWerkorderId(
          id
        );

    return {
      ...werkorder,
      materialen,
      fotos
    };
  }
}