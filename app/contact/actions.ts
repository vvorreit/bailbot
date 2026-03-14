"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimit";
import { getTransporter, smtpConfigured } from "@/lib/mailer";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendContactEmail(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // 5 envois par IP par heure
  if (!await rateLimit(`contact:${ip}`, 5, 60 * 60_000)) {
    return { success: false };
  }

  const name = escapeHtml((formData.get('name') as string) ?? "");
  const company = escapeHtml((formData.get('company') as string) ?? "");
  const email = escapeHtml((formData.get('email') as string) ?? "");
  const shops = escapeHtml((formData.get('shops') as string) ?? "");
  const message = escapeHtml((formData.get('message') as string) ?? "");

  if (!smtpConfigured()) return { success: false };

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: 'contact@bailbot.fr',
      subject: `Nouveau Devis Franchise : ${company}`,
      html: `
        <h1>Nouvelle demande de devis BailBot</h1>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Enseigne :</strong> ${company}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Nombre de magasins :</strong> ${shops}</p>
        <p><strong>Message :</strong></p>
        <p>${message}</p>
      `,
    });

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}
