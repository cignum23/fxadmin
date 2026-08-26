import nodemailer from "nodemailer";

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function boolFromEnv(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  return ["1", "true", "yes"].includes(value.toLowerCase());
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST ?? process.env.HOST;
  const user = process.env.SMTP_USER ?? process.env.USER;
  const pass = process.env.SMTP_PASS ?? process.env.PASS;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = boolFromEnv(process.env.SMTP_SECURE) ?? port === 465;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured. Set HOST, USER, and PASS or SMTP_HOST, SMTP_USER, and SMTP_PASS.");
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from: process.env.SMTP_FROM ?? `FX Admin <${user}>`,
  };
}

export async function sendMail(payload: MailPayload) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    ...payload,
  });
}
