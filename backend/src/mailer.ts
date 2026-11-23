import nodemailer from 'nodemailer';

type MailOptions = {
  to: string;
  subject: string;
  html: string;
  /** En desarrollo se imprime en consola si no hay SMTP configurado. */
  devLink?: string;
};

/**
 * Envía un correo por SMTP. Si no hay SMTP configurado (desarrollo),
 * imprime el enlace de la acción en la consola para poder probar.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  const { to, subject, html, devLink } = options;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || 'Shopping <no-reply@shopping.app>';

  if (!host || !user || !pass) {
    console.log(`\n[mailer:dev] Sin SMTP configurado. Enlace para ${to}:`);
    console.log(`  ${devLink ?? '(sin enlace)'}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, html });
}
