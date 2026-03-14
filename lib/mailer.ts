import { Resend } from "resend";

// Instanciation lazy — évite le crash au build Docker (pas d'API key disponible)
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const smtpConfigured = () => Boolean(process.env.RESEND_API_KEY);

interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendMail(options: MailOptions) {
  if (!smtpConfigured()) {
    console.error("[mailer] RESEND_API_KEY manquant — mail non envoyé");
    throw new Error("RESEND_API_KEY manquant");
  }

  const from = options.from ?? process.env.SMTP_FROM ?? "OptiBot <contact@optibot.fr>";

  const result = await getResend().emails.send({
    from,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
    ...(options.replyTo ? { reply_to: options.replyTo } : {}),
  });

  if (result.error) {
    console.error("[mailer] Erreur Resend:", JSON.stringify(result.error));
    throw new Error(result.error.message);
  }

  console.log("[mailer] Mail envoyé — id:", result.data?.id, "→", options.to);
  return result;
}

/** Compatibilité avec l'ancien pattern getTransporter().sendMail() */
export function getTransporter() {
  return {
    sendMail: (options: MailOptions) => sendMail(options),
  };
}
