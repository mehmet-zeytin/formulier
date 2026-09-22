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
  unlink
} from 'fs/promises';

import path
  from 'path';

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

const getToday = (): string => {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      '0'
    );

  return (
    `${year}-${month}-${day}`
  );
};

const isValidDateString = (
  value: string
): boolean => {
  /*
   * Alleen exact:
   *
   * YYYY-MM-DD
   *
   * accepteren.
   */
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(value);

  if (!match) {
    return false;
  }

  const year =
    Number(match[1]);

  const month =
    Number(match[2]);

  const day =
    Number(match[3]);

  /*
   * Voorkomt onrealistische
   * jaartallen.
   */
  if (
    year < 1900 ||
    year > 9999
  ) {
    return false;
  }

  if (
    month < 1 ||
    month > 12
  ) {
    return false;
  }

  if (
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  /*
   * JavaScript maakt bijvoorbeeld
   * 2026-02-31 automatisch maart.
   *
   * Daarom controleren we de
   * onderdelen opnieuw.
   */
  return (
    date.getFullYear() ===
      year &&
    date.getMonth() ===
      month - 1 &&
    date.getDate() ===
      day
  );
};

const validateWerkorderDate = (
  datum: string
): void => {
  if (!datum) {
    throw new Error(
      'De datum is verplicht.'
    );
  }

  if (
    !isValidDateString(
      datum
    )
  ) {
    throw new Error(
      'Voer een geldige datum in.'
    );
  }

  /*
   * YYYY-MM-DD kan na de
   * bovenstaande validatie veilig
   * alfabetisch vergeleken worden.
   */
  if (
    datum > getToday()
  ) {
    throw new Error(
      'De datum mag niet in de toekomst liggen.'
    );
  }
};

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

  private async canAccessWerkorder(
    werkorder: Werkorder,
    userId: number,
    role: UserRole
  ): Promise<boolean> {
    if (
      this.hasGlobalAccess(
        role
      )
    ) {
      return true;
    }

    if (
      werkorder.assigned_to ===
      userId
    ) {
      return true;
    }

    if (
      !werkorder.id
    ) {
      return false;
    }

    return this.werkorderRepo
      .hasUserAccess(
        werkorder.id,
        userId
      );
  }

  async createWerkorder(
    input: WerkorderInput
  ): Promise<number> {
    validateWerkorderDate(
      input.werkorder.datum
    );

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
      await this.werkorderRepo
        .create(
          input.werkorder,
          input.createdBy
        );

    for (
      const materiaal
      of input.materialen
    ) {
      await this.materiaalRepo
        .create({
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

    validateWerkorderDate(
      datum
    );

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

    const canAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!canAccess) {
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
      undefined
    ) {
      if (
        typeof updates.datum !==
        'string'
      ) {
        throw new Error(
          'Voer een geldige datum in.'
        );
      }

      validateWerkorderDate(
        updates.datum
      );
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

    const canAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!canAccess) {
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
                (
                  typeof allowedTips
                )[number]
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
            !materiaal.naam
              .trim()
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

    const canAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!canAccess) {
      throw new Error(
        'U heeft geen toestemming om dit concept te voltooien.'
      );
    }

    /*
     * Ook hier opnieuw controleren.
     *
     * Zo kan een oud foutief concept
     * niet alsnog worden voltooid.
     */
    validateWerkorderDate(
      werkorder.datum
    );

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

    if (
      hasMissingField
    ) {
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

    const canAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!canAccess) {
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

  async transferDraft(
    id: number,
    newUserId: number,
    reason: string,
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
        'Een voltooide werkorder kan niet worden overgedragen.'
      );
    }

    const canAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!canAccess) {
      throw new Error(
        'U heeft geen toestemming om dit concept over te dragen.'
      );
    }

    if (
      !Number.isInteger(
        newUserId
      ) ||
      newUserId <= 0
    ) {
      throw new Error(
        'Ongeldige gebruiker.'
      );
    }

    const normalizedReason =
      reason.trim();

    if (
      !normalizedReason
    ) {
      throw new Error(
        'Een reden voor de overdracht is verplicht.'
      );
    }

    if (
      normalizedReason.length >
      1000
    ) {
      throw new Error(
        'De reden voor de overdracht is te lang.'
      );
    }

    if (
      werkorder.assigned_to ===
      newUserId
    ) {
      throw new Error(
        'Dit concept is al aan deze gebruiker toegewezen.'
      );
    }

    const newUser =
      await this.werkorderRepo
        .findUserById(
          newUserId
        );

    if (!newUser) {
      throw new Error(
        'De geselecteerde gebruiker bestaat niet of kan geen werkorders toegewezen krijgen.'
      );
    }

    const changedByUser =
      await this.werkorderRepo
        .findAnyUserById(
          userId
        );

    if (!changedByUser) {
      throw new Error(
        'De huidige gebruiker kon niet worden gevonden.'
      );
    }

    let previousUserEmail:
      | string
      | null = null;

    if (
      werkorder.assigned_to
    ) {
      const previousUser =
        await this.werkorderRepo
          .findAnyUserById(
            werkorder.assigned_to
          );

      previousUserEmail =
        previousUser?.email ??
        null;
    }

    const transferred =
      await this.werkorderRepo
        .transferAssigneeWithHistory(
          id,

          werkorder.assigned_to ??
            null,

          previousUserEmail,

          newUser.id,

          newUser.email,

          userId,

          changedByUser.email,

          normalizedReason
        );

    if (!transferred) {
      throw new Error(
        'Het concept kon niet worden overgedragen.'
      );
    }
  }

  async getAssignmentHistory(
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

    const canAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!canAccess) {
      throw new Error(
        'U heeft geen toegang tot deze werkorder.'
      );
    }

    return this.werkorderRepo
      .getAssignmentHistory(
        id
      );
  }

  async getWerkorderAccess(
    id: number,
    userId: number,
    role: UserRole
  ): Promise<number[]> {
    const werkorder =
      await this.werkorderRepo
        .findById(id);

    if (!werkorder) {
      throw new Error(
        'Werkorder niet gevonden.'
      );
    }

    const canAccess =
      await this.canAccessWerkorder(
        werkorder,
        userId,
        role
      );

    if (!canAccess) {
      throw new Error(
        'U heeft geen toegang tot deze werkorder.'
      );
    }

    return this.werkorderRepo
      .getAccessUserIds(
        id
      );
  }

  async updateWerkorderAccess(
    id: number,
    userIds: number[],
    grantedBy: number,
    role: UserRole
  ): Promise<void> {
    if (
      role !== 'owner'
    ) {
      throw new Error(
        'Alleen de owner kan extra toegang beheren.'
      );
    }

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
        'De toegang van een voltooide werkorder kan niet worden gewijzigd.'
      );
    }

    if (
      !Array.isArray(
        userIds
      )
    ) {
      throw new Error(
        'De lijst met gebruikers is ongeldig.'
      );
    }

    const uniqueUserIds =
      [
        ...new Set(
          userIds
            .map(Number)
            .filter(
              value =>
                Number.isInteger(
                  value
                ) &&
                value > 0
            )
        )
      ];

    const assignableUsers =
      await this.werkorderRepo
        .findAssignableUsers();

    const allowedUserIds =
      new Set(
        assignableUsers.map(
          user =>
            user.id
        )
      );

    if (
      uniqueUserIds.some(
        value =>
          !allowedUserIds.has(
            value
          )
      )
    ) {
      throw new Error(
        'Een of meer geselecteerde gebruikers zijn ongeldig.'
      );
    }

    const filteredUserIds =
      uniqueUserIds.filter(
        value =>
          value !==
          werkorder.assigned_to
      );

    await this.werkorderRepo
      .replaceAccess(
        id,
        filteredUserIds,
        grantedBy
      );
  }

  async deleteWerkorder(
  id: number,
  role: UserRole
): Promise<void> {
  if (
    role !== 'owner'
  ) {
    throw new Error(
      'Alleen de owner kan werkorders verwijderen.'
    );
  }

  const werkorder =
    await this.werkorderRepo
      .findById(id);

  if (!werkorder) {
    throw new Error(
      'Werkorder niet gevonden.'
    );
  }

  /*
   * Foto-paden eerst ophalen.
   *
   * Zodra de werkorder wordt
   * verwijderd, worden de foto-
   * records via ON DELETE CASCADE
   * ook verwijderd.
   */
  const fotoPaths =
    await this.werkorderRepo
      .getFotoPaths(id);

  const deleted =
    await this.werkorderRepo
      .deletePermanent(id);

  if (!deleted) {
    throw new Error(
      'De werkorder kon niet worden verwijderd.'
    );
  }

  /*
   * De database is nu correct
   * verwijderd.
   *
   * Daarna ruimen we de fysieke
   * fotobestanden op.
   */
  for (
    const fotoPath
    of fotoPaths
  ) {
    try {
      const fileName =
        path.basename(
          fotoPath
        );

      const absolutePath =
        path.resolve(
          process.cwd(),
          'uploads',
          fileName
        );

      await unlink(
        absolutePath
      );
    } catch (
      error: unknown
    ) {
      /*
       * Een ontbrekend bestand mag
       * de reeds geslaagde database-
       * verwijdering niet terugdraaien.
       */
      console.error(
        'Foto kon niet worden verwijderd:',
        error
      );
    }
  }
}

  async getAssignableUsers() {
    return this.werkorderRepo
      .findAssignableUsers();
  }
}