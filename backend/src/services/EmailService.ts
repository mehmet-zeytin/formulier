import nodemailer from 'nodemailer';
import type { Werkorder, Materiaal } from '../models/Werkorder';

type MateriaalInput = Omit<Materiaal, 'werkorder_id'>;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export class EmailService {

  async sendWerkorderNotification(werkorder: Werkorder, materialen: MateriaalInput[]): Promise<void> {
    const materialenHtml = materialen.length > 0
      ? materialen.map(m => `<li>${m.naam} — ${m.aantal} ${m.eenheid || ''} (${m.tip})</li>`).join('')
      : '<li>Geen materialen ingevuld</li>';

    const html = `
      <h2>Nieuw Opleverformulier Werkorder</h2>
      <p><strong>Werkorder ID:</strong> ${werkorder.werkorder_id}</p>
      <p><strong>Datum:</strong> ${werkorder.datum}</p>
      <p><strong>Aankomsttijd:</strong> ${werkorder.aankomsttijd} — <strong>Eindtijd:</strong> ${werkorder.eindtijd}</p>
      <p><strong>Status:</strong> ${werkorder.status}</p>
      <p><strong>Uitgevoerde werkzaamheden:</strong><br>${werkorder.uitgevoerde_werkzaamheden}</p>
      <h3>Materialen</h3>
      <ul>${materialenHtml}</ul>
    `;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: 'helpdesk@samenict.nl',
        subject: `Nieuw Werkorder: ${werkorder.werkorder_id}`,
        html,
      });
    } catch (error) {
      console.error('E-posta gönderilemedi:', error);
    }
  }
}