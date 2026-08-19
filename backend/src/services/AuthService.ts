import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import {
  UserRepository
} from '../repositories/UserRepository';

import type {
  UserRole
} from '../models/User';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export class AuthService {
  private userRepo =
    new UserRepository();

  async login(
    email: string,
    password: string
  ): Promise<string> {
    const user =
      await this.userRepo.findByEmail(
        email
      );

    if (!user) {
      throw new Error(
        'E-mail of wachtwoord is onjuist.'
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!isPasswordValid) {
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
        userId: user.id,
        email: user.email,
        role: user.role
      };

    return jwt.sign(
      payload,
      jwtSecret,
      {
        expiresIn: '8h'
      }
    );
  }

  async getUsers() {
    return this.userRepo.findAll();
  }

  async createUser(
    email: string,
    password: string,
    role: UserRole,
    actorRole: UserRole
  ): Promise<number> {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      throw new Error(
        'Het e-mailadres is verplicht.'
      );
    }

    if (!password) {
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

    /*
     * Een owner-account mag niet
     * via gebruikersbeheer worden
     * aangemaakt.
     */
    if (
      role === 'owner'
    ) {
      throw new Error(
        'Een owner-account kan niet via gebruikersbeheer worden aangemaakt.'
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

    /*
     * Een normale admin mag
     * alleen medewerkers aanmaken.
     */
    if (
      actorRole === 'admin' &&
      role !== 'medewerker'
    ) {
      throw new Error(
        'Alleen de owner kan nieuwe admins aanmaken.'
      );
    }

    if (
      actorRole !== 'owner' &&
      actorRole !== 'admin'
    ) {
      throw new Error(
        'U heeft geen toestemming om gebruikers aan te maken.'
      );
    }

    const existingUser =
      await this.userRepo.findByEmail(
        normalizedEmail
      );

    if (existingUser) {
      throw new Error(
        'Er bestaat al een gebruiker met dit e-mailadres.'
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    return this.userRepo.create(
      normalizedEmail,
      passwordHash,
      role
    );
  }

  async resetUserPassword(
    targetUserId: number,
    actorUserId: number,
    actorRole: UserRole,
    newPassword: string
  ): Promise<void> {
    const targetUser =
      await this.userRepo.findById(
        targetUserId
      );

    if (!targetUser) {
      throw new Error(
        'Gebruiker niet gevonden.'
      );
    }

    if (
      actorRole === 'medewerker'
    ) {
      throw new Error(
        'U heeft geen toestemming om wachtwoorden te wijzigen.'
      );
    }

    /*
     * Een normale admin mag alleen
     * medewerkers beheren.
     */
    if (
      actorRole === 'admin' &&
      targetUser.role !==
        'medewerker'
    ) {
      throw new Error(
        'Een admin kan alleen het wachtwoord van een medewerker wijzigen.'
      );
    }

    /*
     * Het owner-account mag niet
     * door een andere gebruiker
     * worden gewijzigd.
     */
    if (
      targetUser.role ===
        'owner' &&
      actorUserId !==
        targetUser.id
    ) {
      throw new Error(
        'Het owner-account kan niet door een andere gebruiker worden gewijzigd.'
      );
    }

    if (!newPassword) {
      throw new Error(
        'Het nieuwe wachtwoord is verplicht.'
      );
    }

    if (
      newPassword.length < 8
    ) {
      throw new Error(
        'Het wachtwoord moet minimaal 8 tekens bevatten.'
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    const updated =
      await this.userRepo
        .updatePasswordHash(
          targetUserId,
          passwordHash
        );

    if (!updated) {
      throw new Error(
        'Het wachtwoord kon niet worden gewijzigd.'
      );
    }
  }

  async changeUserRole(
    targetUserId: number,
    newRole: UserRole,
    actorUserId: number,
    actorRole: UserRole
  ): Promise<void> {
    /*
     * Alleen de owner mag
     * rollen wijzigen.
     */
    if (
      actorRole !== 'owner'
    ) {
      throw new Error(
        'Alleen de owner kan gebruikersrollen wijzigen.'
      );
    }

    /*
     * Owner is geen rol die via
     * gebruikersbeheer toegewezen
     * mag worden.
     */
    if (
      newRole !== 'admin' &&
      newRole !== 'medewerker'
    ) {
      throw new Error(
        'Een gebruiker kan alleen de rol admin of medewerker krijgen.'
      );
    }

    const targetUser =
      await this.userRepo.findById(
        targetUserId
      );

    if (!targetUser) {
      throw new Error(
        'Gebruiker niet gevonden.'
      );
    }

    /*
     * Het owner-account blijft
     * permanent owner.
     */
    if (
      targetUser.role ===
      'owner'
    ) {
      throw new Error(
        'De rol van het owner-account kan niet worden gewijzigd.'
      );
    }

    if (
      targetUserId ===
      actorUserId
    ) {
      throw new Error(
        'U kunt uw eigen rol niet wijzigen.'
      );
    }

    if (
      targetUser.role ===
      newRole
    ) {
      return;
    }

    const updated =
      await this.userRepo.updateRole(
        targetUserId,
        newRole
      );

    if (!updated) {
      throw new Error(
        'De gebruikersrol kon niet worden gewijzigd.'
      );
    }
  }

  async deleteUser(
    targetUserId: number,
    actorUserId: number,
    actorRole: UserRole
  ): Promise<void> {
    const targetUser =
      await this.userRepo.findById(
        targetUserId
      );

    if (!targetUser) {
      throw new Error(
        'Gebruiker niet gevonden.'
      );
    }

    if (
      targetUserId ===
      actorUserId
    ) {
      throw new Error(
        'U kunt uw eigen account niet verwijderen.'
      );
    }

    /*
     * Owner kan nooit verwijderd
     * worden via gebruikersbeheer.
     */
    if (
      targetUser.role ===
      'owner'
    ) {
      throw new Error(
        'Het owner-account kan niet worden verwijderd.'
      );
    }

    if (
      actorRole ===
      'medewerker'
    ) {
      throw new Error(
        'U heeft geen toestemming om gebruikers te verwijderen.'
      );
    }

    /*
     * Een normale admin mag
     * uitsluitend medewerkers
     * verwijderen.
     */
    if (
      actorRole === 'admin' &&
      targetUser.role !==
        'medewerker'
    ) {
      throw new Error(
        'Een admin kan alleen medewerkers verwijderen.'
      );
    }

    const deleted =
      await this.userRepo.deleteById(
        targetUserId
      );

    if (!deleted) {
      throw new Error(
        'De gebruiker kon niet worden verwijderd.'
      );
    }
  }
}