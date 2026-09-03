import bcrypt
  from 'bcrypt';

import jwt
  from 'jsonwebtoken';

import {
  UserRepository
} from '../repositories/UserRepository';

import {
  WerkorderRepository
} from '../repositories/WerkorderRepository';

import type {
  UserRole
} from '../models/User';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: UserRole;
  tokenVersion: number;
}
const BCRYPT_ROUNDS =
  12;

const DUMMY_PASSWORD_HASH =
  bcrypt.hashSync(
    'dummy-password-for-timing-check',
    BCRYPT_ROUNDS
  );

export class AuthService {
  private userRepo =
    new UserRepository();

  private werkorderRepo =
    new WerkorderRepository();

  async login(
    email: string,
    password: string
  ): Promise<string> {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await this.userRepo
        .findActiveByEmail(
          normalizedEmail
        );

    const passwordHash =
      user
        ?.password_hash ??
      DUMMY_PASSWORD_HASH;

    const isPasswordValid =
      await bcrypt.compare(
        password,
        passwordHash
      );

    if (
      !user ||
      !isPasswordValid
    ) {
      throw new Error(
        'E-mail of wachtwoord is onjuist.'
      );
    }

    const jwtSecret =
      process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET is niet geconfigureerd.'
      );
    }

    const payload:
      AuthTokenPayload = {
        userId:
          user.id,

        email:
          user.email,

        role:
          user.role,

        tokenVersion:
          user.token_version
      };

    return jwt.sign(
      payload,
      jwtSecret,
      {
        expiresIn:
          '8h'
      }
    );
  }

  async getUsers(
    requesterRole: UserRole
  ) {
    if (
      requesterRole !== 'owner' &&
      requesterRole !== 'admin'
    ) {
      throw new Error(
        'U heeft geen toestemming om gebruikers te bekijken.'
      );
    }

    const users =
      await this.userRepo
        .findAllActive();

    if (
      requesterRole === 'owner'
    ) {
      return users;
    }

    /*
     * Admin ziet owner wel,
     * maar frontend kan deze
     * niet aanpassen.
     */
    return users;
  }

  async getDeletedUsers(
    requesterRole: UserRole
  ) {
    if (
      requesterRole !== 'owner'
    ) {
      throw new Error(
        'Alleen de owner kan verwijderde gebruikers bekijken.'
      );
    }

    return this.userRepo
      .findAllDeleted();
  }

  async createUser(
    email: string,
    password: string,

    role:
      | 'admin'
      | 'medewerker',

    requesterRole: UserRole
  ): Promise<number> {
    if (
      requesterRole !== 'owner' &&
      requesterRole !== 'admin'
    ) {
      throw new Error(
        'U heeft geen toestemming om gebruikers aan te maken.'
      );
    }

    if (
      requesterRole === 'admin' &&
      role !== 'medewerker'
    ) {
      throw new Error(
        'Een admin kan alleen medewerkers aanmaken.'
      );
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      throw new Error(
        'Het e-mailadres is verplicht.'
      );
    }

    if (
      !password
    ) {
      throw new Error(
        'Het wachtwoord is verplicht.'
      );
    }

    if (
      password.length < 8
    ) {
      throw new Error(
        'Het wachtwoord moet minimaal 8 tekens bevatten.'
      );
    }

    if (
      role !== 'admin' &&
      role !== 'medewerker'
    ) {
      throw new Error(
        'Ongeldige gebruikersrol.'
      );
    }

    const existingUser =
      await this.userRepo
        .findByEmail(
          normalizedEmail
        );

    if (existingUser) {
      if (
        existingUser.is_deleted
      ) {
        throw new Error(
          'Er bestaat een verwijderde gebruiker met dit e-mailadres. Herstel deze gebruiker in plaats van een nieuwe aan te maken.'
        );
      }

      throw new Error(
        'Er bestaat al een gebruiker met dit e-mailadres.'
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    return this.userRepo
      .create(
        normalizedEmail,
        passwordHash,
        role
      );
  }

  async changeUserRole(
    targetUserId: number,

    newRole:
      | 'admin'
      | 'medewerker',

    requesterId: number,
    requesterRole: UserRole
  ): Promise<void> {
    if (
      requesterRole !== 'owner' &&
      requesterRole !== 'admin'
    ) {
      throw new Error(
        'U heeft geen toestemming om gebruikersrollen te wijzigen.'
      );
    }

    const targetUser =
      await this.userRepo
        .findById(
          targetUserId
        );

    if (
      !targetUser ||
      targetUser.is_deleted
    ) {
      throw new Error(
        'Gebruiker niet gevonden.'
      );
    }

    if (
      targetUser.id ===
      requesterId
    ) {
      throw new Error(
        'U kunt uw eigen rol niet wijzigen.'
      );
    }

    if (
      targetUser.role ===
      'owner'
    ) {
      throw new Error(
        'De rol van de owner kan niet worden gewijzigd.'
      );
    }

    if (
      newRole !== 'admin' &&
      newRole !== 'medewerker'
    ) {
      throw new Error(
        'Ongeldige gebruikersrol.'
      );
    }

    if (
      requesterRole ===
        'admin' &&
      (
        targetUser.role !==
          'medewerker' ||
        newRole !==
          'medewerker'
      )
    ) {
      throw new Error(
        'Een admin kan alleen medewerkers beheren.'
      );
    }

    const updated =
      await this.userRepo
        .updateRole(
          targetUserId,
          newRole
        );

    if (!updated) {
      throw new Error(
        'De gebruikersrol kon niet worden gewijzigd.'
      );
    }
  }

  async changeUserPassword(
    targetUserId: number,
    password: string,

    requesterId: number,
    requesterRole: UserRole
  ): Promise<void> {
    if (
      requesterRole !== 'owner' &&
      requesterRole !== 'admin'
    ) {
      throw new Error(
        'U heeft geen toestemming om wachtwoorden te wijzigen.'
      );
    }

    if (
      password.length < 8
    ) {
      throw new Error(
        'Het wachtwoord moet minimaal 8 tekens bevatten.'
      );
    }

    const targetUser =
      await this.userRepo
        .findById(
          targetUserId
        );

    if (
      !targetUser ||
      targetUser.is_deleted
    ) {
      throw new Error(
        'Gebruiker niet gevonden.'
      );
    }

    if (
      requesterRole ===
        'admin' &&
      targetUser.role !==
        'medewerker'
    ) {
      throw new Error(
        'Een admin kan alleen het wachtwoord van medewerkers wijzigen.'
      );
    }

    if (
      targetUser.role ===
        'owner' &&
      targetUser.id !==
        requesterId
    ) {
      throw new Error(
        'Het wachtwoord van de owner kan niet door een andere gebruiker worden gewijzigd.'
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const updated =
      await this.userRepo
        .updatePassword(
          targetUserId,
          passwordHash
        );

    if (!updated) {
      throw new Error(
        'Het wachtwoord kon niet worden gewijzigd.'
      );
    }
  }

  async deleteUser(
    targetUserId: number,
    requesterId: number,
    requesterRole: UserRole
  ): Promise<void> {
    if (
      requesterRole !== 'owner' &&
      requesterRole !== 'admin'
    ) {
      throw new Error(
        'U heeft geen toestemming om gebruikers te verwijderen.'
      );
    }

    if (
      targetUserId ===
      requesterId
    ) {
      throw new Error(
        'U kunt uw eigen account niet verwijderen.'
      );
    }

    const targetUser =
      await this.userRepo
        .findById(
          targetUserId
        );

    if (
      !targetUser ||
      targetUser.is_deleted
    ) {
      throw new Error(
        'Gebruiker niet gevonden.'
      );
    }

    if (
      targetUser.role ===
      'owner'
    ) {
      throw new Error(
        'De owner kan niet worden verwijderd.'
      );
    }

    if (
      requesterRole ===
        'admin' &&
      targetUser.role !==
        'medewerker'
    ) {
      throw new Error(
        'Een admin kan alleen medewerkers verwijderen.'
      );
    }

    /*
    * Controleer eerst of deze
    * gebruiker nog verantwoordelijk
    * is voor openstaande concepten.
    */
    const hasOpenDrafts =
      await this.werkorderRepo
        .hasOpenDraftsAssignedToUser(
          targetUserId
        );

    if (
      hasOpenDrafts
    ) {
      throw new Error(
        'Deze gebruiker kan niet worden verwijderd omdat er nog openstaande concepten aan deze gebruiker zijn toegewezen. Draag deze concepten eerst over aan een andere gebruiker.'
      );
    }

    const deleted =
      await this.userRepo
        .softDelete(
          targetUserId
        );

    if (!deleted) {
      throw new Error(
        'De gebruiker kon niet worden verwijderd.'
      );
    }
  }

  async restoreUser(
    targetUserId: number,
    requesterRole: UserRole
  ): Promise<void> {
    if (
      requesterRole !== 'owner'
    ) {
      throw new Error(
        'Alleen de owner kan verwijderde gebruikers herstellen.'
      );
    }

    const targetUser =
      await this.userRepo
        .findById(
          targetUserId
        );

    if (
      !targetUser ||
      !targetUser.is_deleted
    ) {
      throw new Error(
        'Verwijderde gebruiker niet gevonden.'
      );
    }

    const restored =
      await this.userRepo
        .restore(
          targetUserId
        );

    if (!restored) {
      throw new Error(
        'De gebruiker kon niet worden hersteld.'
      );
    }
  }
}