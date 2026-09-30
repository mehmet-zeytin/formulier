import nodemailer from 'nodemailer';
import type {
  Werkorder,
  Materiaal
} from '../models/Werkorder';

type MateriaalInput =
  Omit<Materiaal, 'werkorder_id'>;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  ignoreTLS: process.env.SMTP_IGNORE_TLS === 'true',
  ...(process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      }
    : {}),
});

const escapeHtml = (
  value: string
): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export class EmailService {

  async sendWerkorderNotification(
    werkorder: Werkorder,
    materialen: MateriaalInput[]
  ): Promise<void> {
    const materialenHtml =
      materialen.length > 0
        ? materialen
            .map(
              m =>
                `<li>${escapeHtml(m.naam)} — ${m.aantal} ${escapeHtml(m.eenheid || '')} (${escapeHtml(m.tip)})</li>`
            )
            .join('')
        : '<li>Geen materialen ingevuld</li>';

    const html = `
      <h2>Nieuw Opleverformulier Werkorder</h2>

      <p>
        <strong>Werkorder ID:</strong>
        ${escapeHtml(
          String(
            werkorder.werkorder_id
          )
        )}
      </p>

      <p>
        <strong>Datum:</strong>
        ${escapeHtml(
          String(
            werkorder.datum
          )
        )}
      </p>

      <p>
        <strong>Aankomsttijd:</strong>
        ${escapeHtml(
          String(
            werkorder.aankomsttijd ??
            ''
          )
        )}
        —
        <strong>Eindtijd:</strong>
        ${escapeHtml(
          String(
            werkorder.eindtijd ??
            ''
          )
        )}
      </p>

      <p>
        <strong>Status:</strong>
        ${escapeHtml(
          String(
            werkorder.status ??
            ''
          )
        )}
      </p>

      <p>
        <strong>Uitgevoerde werkzaamheden:</strong>
        <br>
        ${escapeHtml(
          String(
            werkorder
              .uitgevoerde_werkzaamheden ??
            ''
          )
        )}
      </p>

      <h3>Materialen</h3>

      <ul>
        ${materialenHtml}
      </ul>
    `;

    try {
      await transporter.sendMail({
        from: `"Samen ICT Werkorders" <${process.env.SMTP_FROM}>`,

        to:
          'helpdesk@samenict.nl',

        subject:
          `Nieuw Werkorder: ${werkorder.werkorder_id}`,

        html,
      });
    } catch (error) {
      console.error(
        'E-mail kan niet worden verzonden:',
        error
      );
    }
  }

  async sendWerkorderAssignedNotification(
    toEmail: string,
    werkorderNumber: string,
    werkorderId: number
  ): Promise<void> {
    const safeEmail =
      escapeHtml(toEmail);

    const safeWerkorderNumber =
      escapeHtml(werkorderNumber);

    const frontendUrl =
      (
        process.env.FRONTEND_URL ||
        ''
      ).replace(/\/$/, '');

    const werkorderUrl =
      `${frontendUrl}/werkorders/${werkorderId}`;

    try {
      await transporter.sendMail({
        from:
          `"Samen ICT Werkorders" <${process.env.SMTP_FROM}>`,

        to: toEmail,

        subject:
          `Werkorder ${werkorderNumber} is aan jou toegewezen`,

        text:
          `Werkorder ${werkorderNumber} is aan jou toegewezen. Log in op het werkorderformulier om de werkorder te bekijken.`,

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #222;
            "
          >
            <h2>
              Nieuwe werkorder toegewezen
            </h2>

            <p>
              Er is een werkorder aan jou
              toegewezen.
            </p>

            <p>
              <strong>Werkorder:</strong>
              ${safeWerkorderNumber}
            </p>

            <p>
              Je kunt de werkorder bekijken
              via het werkorderformulier.
            </p>

            ${
              frontendUrl
                ? `
                  <p>
                    <a
                      href="${werkorderUrl}"
                      style="
                        display: inline-block;
                        padding: 10px 16px;
                        background: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                      "
                    >
                      Werkorder bekijken
                    </a>
                  </p>
                `
                : ''
            }

            <p
              style="
                margin-top: 24px;
                font-size: 13px;
                color: #666;
              "
            >
              Deze e-mail is automatisch
              verzonden door Samen ICT Werkorders.
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error(
        `E-mail voor toegewezen werkorder kon niet worden verzonden naar ${safeEmail}:`,
        error
      );
    }
  }

  async sendTransferRequestNotification(
    toEmail: string,
    werkorderNumber: string,
    fromEmail: string | null,
    requestedByEmail: string,
    reason: string
  ): Promise<void> {
    const safeWerkorderNumber =
      escapeHtml(
        werkorderNumber
      );

    const safeFromEmail =
      escapeHtml(
        fromEmail ||
        'Onbekend'
      );

    const safeRequestedByEmail =
      escapeHtml(
        requestedByEmail
      );

    const safeReason =
      escapeHtml(
        reason
      );

    const html = `
      <h2>Nieuw overdrachtsverzoek</h2>

      <p>
        Er staat een nieuw overdrachtsverzoek
        voor u klaar.
      </p>

      <p>
        <strong>Werkorder:</strong>
        ${safeWerkorderNumber}
      </p>

      <p>
        <strong>Van:</strong>
        ${safeFromEmail}
      </p>

      <p>
        <strong>Aangevraagd door:</strong>
        ${safeRequestedByEmail}
      </p>

      <p>
        <strong>Reden:</strong>
        ${safeReason}
      </p>

      <p>
        Log in op het werkorderformulier
        om deze overdracht te accepteren
        of te weigeren.
      </p>
    `;

    try {
      await transporter.sendMail({
      from: `"Samen ICT Werkorders" <${process.env.SMTP_FROM}>`,
      
  to: toEmail,

  subject:
    `Overdrachtsverzoek werkorder ${werkorderNumber}`,

  html,
});
    } catch (error) {
      console.error(
        'E-mail voor overdrachtsverzoek kan niet worden verzonden:',
        error
      );
    }
  }
}