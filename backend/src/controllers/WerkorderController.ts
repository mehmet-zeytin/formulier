import {
  Response
} from 'express';

import {
  WerkorderService
} from '../services/WerkorderService';

import {
  AuthRequest
} from '../middleware/authMiddleware';

export class WerkorderController {
  private werkorderService =
    new WerkorderService();

  create = async (
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

      const {
        werkorder,
        materialen
      } = req.body;

      if (
        !werkorder ||
        !Array.isArray(
          materialen
        )
      ) {
        res.status(400).json({
          message:
            'Werkorder en materialen zijn verplicht.'
        });

        return;
      }

      const newId =
        await this.werkorderService
          .createWerkorder({
            werkorder,
            materialen,

            createdBy:
              req.user.userId
          });

      res.status(201).json({
        message:
          'Werkorder succesvol aangemaakt.',

        id: newId
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De werkorder kon niet worden aangemaakt.';

      res.status(400).json({
        message
      });
    }
  };

  createDraft = async (
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

      const {
        werkorder_id,
        datum
      } = req.body;

      if (
        typeof werkorder_id !==
          'string' ||
        typeof datum !==
          'string'
      ) {
        res.status(400).json({
          message:
            'Werkorder-ID en datum zijn verplicht.'
        });

        return;
      }

      const draftId =
        await this.werkorderService
          .createDraft(
            werkorder_id,
            datum,
            req.user.userId
          );

      res.status(201).json({
        message:
          'Concept werkorder succesvol aangemaakt.',

        id: draftId
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Het concept kon niet worden aangemaakt.';

      res.status(400).json({
        message
      });
    }
  };

  getDrafts = async (
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

      const drafts =
        await this.werkorderService
          .getDrafts(
            req.user.userId,
            req.user.role
          );

      res.status(200).json(
        drafts
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Concepten konden niet worden geladen.';

      res.status(500).json({
        message
      });
    }
  };

  getAssignableUsers = async (
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

      const users =
        await this.werkorderService
          .getAssignableUsers();

      res.status(200).json(
        users
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Gebruikers konden niet worden geladen.';

      res.status(500).json({
        message
      });
    }
  };

  updateDraft = async (
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

      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      if (
        !req.body ||
        typeof req.body !==
          'object' ||
        Array.isArray(
          req.body
        )
      ) {
        res.status(400).json({
          message:
            'Er moeten velden worden aangeleverd om bij te werken.'
        });

        return;
      }

      await this.werkorderService
        .updateDraft(
          id,
          req.body,
          req.user.userId,
          req.user.role
        );

      res.status(200).json({
        message:
          'Concept succesvol bijgewerkt.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Het concept kon niet worden bijgewerkt.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toestemming om dit concept te wijzigen.'
      ) {
        status = 403;
      } else if (
        message ===
        'Een voltooide werkorder kan niet worden gewijzigd.'
      ) {
        status = 409;
      }

      res.status(status).json({
        message
      });
    }
  };

  updateMaterialen = async (
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

      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      const {
        materialen
      } = req.body;

      if (
        !Array.isArray(
          materialen
        )
      ) {
        res.status(400).json({
          message:
            'Materialen moet een lijst zijn.'
        });

        return;
      }

      await this.werkorderService
        .updateDraftMaterialen(
          id,
          materialen,
          req.user.userId,
          req.user.role
        );

      res.status(200).json({
        message:
          'Materialen van het concept succesvol bijgewerkt.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De materialen konden niet worden bijgewerkt.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toestemming om de materialen van dit concept te wijzigen.'
      ) {
        status = 403;
      } else if (
        message ===
        'De materialen van een voltooide werkorder kunnen niet worden gewijzigd.'
      ) {
        status = 409;
      }

      res.status(status).json({
        message
      });
    }
  };

  completeDraft = async (
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

      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      await this.werkorderService
        .completeDraft(
          id,
          req.user.userId,
          req.user.role
        );

      res.status(200).json({
        message:
          'Concept succesvol voltooid.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Het concept kon niet worden voltooid.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toestemming om dit concept te voltooien.'
      ) {
        status = 403;
      } else if (
        message ===
        'De werkorder is al voltooid.'
      ) {
        status = 409;
      }

      res.status(status).json({
        message
      });
    }
  };

  getAll = async (
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

      const werkorders =
        await this.werkorderService
          .getAllWerkorders(
            req.user.userId,
            req.user.role
          );

      res.status(200).json(
        werkorders
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Werkorders konden niet worden geladen.';

      res.status(500).json({
        message
      });
    }
  };

  getById = async (
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

      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      const detail =
        await this.werkorderService
          .getWerkorderDetail(
            id,
            req.user.userId,
            req.user.role
          );

      res.status(200).json(
        detail
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De werkorder kon niet worden geladen.';

      let status = 500;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toegang tot deze werkorder.'
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };

  transferDraft = async (
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

      const id =
        Number(
          req.params.id
        );

      const newUserId =
        Number(
          req.body?.userId
        );

      const reason =
        typeof req.body?.reason ===
          'string'
          ? req.body.reason
          : '';

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      if (
        !Number.isInteger(
          newUserId
        ) ||
        newUserId <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldige gebruiker vereist.'
        });

        return;
      }

      if (
        !reason.trim()
      ) {
        res.status(400).json({
          message:
            'Een reden voor de overdracht is verplicht.'
        });

        return;
      }

      await this.werkorderService
        .transferDraft(
          id,
          newUserId,
          reason,
          req.user.userId,
          req.user.role
        );

      res.status(200).json({
        message:
          'Concept succesvol overgedragen.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'Het concept kon niet worden overgedragen.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toestemming om dit concept over te dragen.'
      ) {
        status = 403;
      } else if (
        message ===
          'Een voltooide werkorder kan niet worden overgedragen.' ||
        message ===
          'Dit concept is al aan deze gebruiker toegewezen.'
      ) {
        status = 409;
      }

      res.status(status).json({
        message
      });
    }
  };

  getAssignmentHistory = async (
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

      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      const history =
        await this.werkorderService
          .getAssignmentHistory(
            id,
            req.user.userId,
            req.user.role
          );

      res.status(200).json(
        history
      );
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De overdrachtsgeschiedenis kon niet worden geladen.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toegang tot deze werkorder.'
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };

  getAccess = async (
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

      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      const userIds =
        await this.werkorderService
          .getWerkorderAccess(
            id,
            req.user.userId,
            req.user.role
          );

      res.status(200).json({
        userIds
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De toegangsrechten konden niet worden geladen.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'U heeft geen toegang tot deze werkorder.'
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };

  updateAccess = async (
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

      const id =
        Number(
          req.params.id
        );

      const {
        userIds
      } = req.body;

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      if (
        !Array.isArray(
          userIds
        )
      ) {
        res.status(400).json({
          message:
            'userIds moet een lijst zijn.'
        });

        return;
      }

      await this.werkorderService
        .updateWerkorderAccess(
          id,
          userIds,
          req.user.userId,
          req.user.role
        );

      res.status(200).json({
        message:
          'Extra toegang succesvol bijgewerkt.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De toegangsrechten konden niet worden bijgewerkt.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'Alleen de owner kan extra toegang beheren.'
      ) {
        status = 403;
      } else if (
        message ===
        'De toegang van een voltooide werkorder kan niet worden gewijzigd.'
      ) {
        status = 409;
      }

      res.status(status).json({
        message
      });
    }
  };

  deleteWerkorder = async (
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

      const id =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        res.status(400).json({
          message:
            'Er is een geldig werkorder-ID vereist.'
        });

        return;
      }

      await this.werkorderService
        .deleteWerkorder(
          id,
          req.user.role
        );

      res.status(200).json({
        message:
          'Werkorder succesvol verwijderd.'
      });
    } catch (
      error: unknown
    ) {
      const message =
        error instanceof Error
          ? error.message
          : 'De werkorder kon niet worden verwijderd.';

      let status = 400;

      if (
        message ===
        'Werkorder niet gevonden.'
      ) {
        status = 404;
      } else if (
        message ===
        'Alleen de owner kan werkorders verwijderen.'
      ) {
        status = 403;
      }

      res.status(status).json({
        message
      });
    }
  };
}