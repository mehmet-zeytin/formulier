import fs from 'fs';
import path from 'path';
import { Response } from 'express';

import type {
  AuthRequest
} from '../middleware/authMiddleware';

import {
  FotoService
} from '../services/FotoService';

type DetectedImageType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | null;

export class FotoController {
  private fotoService =
    new FotoService();

  private removeUploadedFile(
    filename:
      | string
      | undefined
  ): void {
    if (!filename) {
      return;
    }

    try {
      const filePath =
        path.join(
          __dirname,
          '../..',
          'uploads',
          filename
        );

      if (
        fs.existsSync(
          filePath
        )
      ) {
        fs.unlinkSync(
          filePath
        );
      }
    } catch (error) {
      console.error(
        'Kon geüpload bestand niet opruimen:',
        error
      );
    }
  }

  private detectImageType(
    filePath: string
  ): DetectedImageType {
    let fileDescriptor:
      | number
      | null = null;

    try {
      fileDescriptor =
        fs.openSync(
          filePath,
          'r'
        );

      const buffer =
        Buffer.alloc(12);

      const bytesRead =
        fs.readSync(
          fileDescriptor,
          buffer,
          0,
          buffer.length,
          0
        );

      if (
        bytesRead >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      ) {
        return 'image/png';
      }

      if (
        bytesRead >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      ) {
        return 'image/jpeg';
      }

      if (
        bytesRead >= 12 &&
        buffer.toString(
          'ascii',
          0,
          4
        ) === 'RIFF' &&
        buffer.toString(
          'ascii',
          8,
          12
        ) === 'WEBP'
      ) {
        return 'image/webp';
      }

      return null;
    } catch (error) {
      console.error(
        'Kon bestandstype niet controleren:',
        error
      );

      return null;
    } finally {
      if (
        fileDescriptor !==
        null
      ) {
        try {
          fs.closeSync(
            fileDescriptor
          );
        } catch (error) {
          console.error(
            'Kon bestand niet sluiten:',
            error
          );
        }
      }
    }
  }

  getFile = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const werkorderId =
        Number(
          req.params.werkorderId
        );

      const fotoId =
        Number(
          req.params.fotoId
        );

      const foto =
        await this.fotoService
          .getFotoForUser(
            werkorderId,
            fotoId,
            req.user.userId,
            req.user.role
          );

      /*
       * Alleen de bestandsnaam gebruiken.
       *
       * Hierdoor kan een eventueel
       * gemanipuleerd databasepad nooit
       * buiten uploads terechtkomen.
       */
      const filename =
        path.basename(
          foto.bestandspad
        );

      const uploadsDir =
        path.resolve(
          __dirname,
          '../..',
          'uploads'
        );

      const filePath =
        path.resolve(
          uploadsDir,
          filename
        );

      /*
       * Extra controle tegen
       * path traversal.
       */
      if (
        path.dirname(
          filePath
        ) !== uploadsDir
      ) {
        res.status(400).json({
          message:
            'Ongeldig bestandspad.'
        });

        return;
      }

      if (
        !fs.existsSync(
          filePath
        )
      ) {
        res.status(404).json({
          message:
            'Fotobestand niet gevonden.'
        });

        return;
      }

      res.setHeader(
        'Cache-Control',
        'private, no-store, no-cache, must-revalidate'
      );

      res.setHeader(
        'Pragma',
        'no-cache'
      );

      res.setHeader(
        'Expires',
        '0'
      );

      res.sendFile(
        filePath
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De foto kon niet worden geladen.';

      let status = 400;

      if (
        message ===
          'Werkorder niet gevonden.' ||
        message ===
          'Foto niet gevonden.' ||
        message ===
          'Foto hoort niet bij deze werkorder.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toegang tot deze foto.'
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };

  upload = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        this.removeUploadedFile(
          req.file?.filename
        );

        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const werkorderId =
        Number(
          req.params.werkorderId
        );

      if (
        !Number.isInteger(
          werkorderId
        ) ||
        werkorderId <= 0
      ) {
        this.removeUploadedFile(
          req.file?.filename
        );

        res.status(400).json({
          message:
            'Ongeldig werkorder-ID.'
        });

        return;
      }

      if (!req.file) {
        res.status(400).json({
          message:
            'Een fotobestand is verplicht.'
        });

        return;
      }

      const detectedType =
        this.detectImageType(
          req.file.path
        );

      if (
        detectedType === null ||
        detectedType !==
          req.file.mimetype
      ) {
        this.removeUploadedFile(
          req.file.filename
        );

        res.status(400).json({
          message:
            'Ongeldig bestandstype.'
        });

        return;
      }

      const beschrijving =
        typeof req.body
          ?.beschrijving ===
          'string'
          ? req.body
              .beschrijving
          : null;

      const genomenOp =
        typeof req.body
          ?.genomen_op ===
          'string'
          ? req.body
              .genomen_op
          : new Date()
              .toISOString();

      const bestandspad =
        `/uploads/${req.file.filename}`;

      const fotoId =
        await this.fotoService
          .createFoto({
            werkorderId,
            beschrijving,
            bestandspad,
            genomenOp,
            userId:
              req.user.userId,
            role:
              req.user.role
          });

      res.status(201).json({
        message:
          'Foto succesvol geüpload.',
        id:
          fotoId,
        pad:
          bestandspad,
        genomen_op:
          genomenOp
      });
    } catch (
      error: unknown
    ) {
      this.removeUploadedFile(
        req.file?.filename
      );

      const message =
        error instanceof Error
          ? error.message
          : 'De foto kon niet worden geüpload.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toestemming om een foto aan dit concept toe te voegen.'
      ) {
        status = 403;
      } else if (
        message ===
        'Er kan geen foto worden toegevoegd aan een voltooide werkorder.'
      ) {
        status = 409;
      }

      res.status(status).json({
        message
      });
    }
  };

  delete = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          message:
            'U moet ingelogd zijn.'
        });

        return;
      }

      const werkorderId =
        Number(
          req.params.werkorderId
        );

      const fotoId =
        Number(
          req.params.fotoId
        );

      if (
        !Number.isInteger(
          werkorderId
        ) ||
        werkorderId <= 0
      ) {
        res.status(400).json({
          message:
            'Ongeldig werkorder-ID.'
        });

        return;
      }

      if (
        !Number.isInteger(
          fotoId
        ) ||
        fotoId <= 0
      ) {
        res.status(400).json({
          message:
            'Ongeldig foto-ID.'
        });

        return;
      }

      const foto =
        await this.fotoService
          .deleteFoto(
            werkorderId,
            fotoId,
            req.user.userId,
            req.user.role
          );

      try {
        const filename =
          path.basename(
            foto.bestandspad
          );

        const filePath =
          path.join(
            __dirname,
            '../..',
            'uploads',
            filename
          );

        if (
          fs.existsSync(
            filePath
          )
        ) {
          fs.unlinkSync(
            filePath
          );
        }
      } catch (error) {
        console.error(
          'Kon fotobestand niet verwijderen:',
          error
        );
      }

      res.status(200).json({
        message:
          'Foto succesvol verwijderd.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De foto kon niet worden verwijderd.';

      let status = 400;

      if (
        message ===
          'Werkorder niet gevonden.' ||
        message ===
          'Foto niet gevonden.' ||
        message ===
          'Foto hoort niet bij deze werkorder.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toestemming om een foto van dit concept te verwijderen.'
      ) {
        status = 403;
      } else if (
        message ===
        'Foto’s van een voltooide werkorder kunnen niet worden verwijderd.'
      ) {
        status = 409;
      }

      res.status(status).json({
        message
      });
    }
  };
}