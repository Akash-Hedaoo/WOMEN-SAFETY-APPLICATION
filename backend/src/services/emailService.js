const nodemailer = require('nodemailer');

const isConfigured = () => Boolean(
  process.env.MAILTRAP_SMTP_HOST
  && process.env.MAILTRAP_SMTP_PORT
  && process.env.MAILTRAP_SMTP_USER
  && process.env.MAILTRAP_SMTP_PASS
);

const transporter = isConfigured()
  ? nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: Number(process.env.MAILTRAP_SMTP_PORT),
    auth: { user: process.env.MAILTRAP_SMTP_USER, pass: process.env.MAILTRAP_SMTP_PASS }
  })
  : null;

async function sendGuardianEmail({ to, subject, text }) {
  if (!to) return { success: false, error: 'Guardian email is unavailable' };
  if (!transporter) return { success: false, error: 'Email provider is not configured' };

  try {
    await transporter.sendMail({
      from: process.env.MAILTRAP_FROM || 'Safe-Era <alerts@safe-era.local>',
      to,
      subject,
      text
    });
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Delivery failed:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendGuardianEmail };
