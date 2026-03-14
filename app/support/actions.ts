"use server";

import { getTransporter } from "@/lib/mailer";

function esc(str: string) {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const TYPE_LABELS: Record<string, string> = {
  suggestion: "Suggestion",
  incident: "Incident / Bug",
  evolution: "Demande d'évolution",
};

export async function sendSupportEmail(formData: FormData) {
  const type    = esc((formData.get("type")    as string) ?? "");
  const name    = esc((formData.get("name")    as string) ?? "");
  const email   = esc((formData.get("email")   as string) ?? "");
  const phone   = esc((formData.get("phone")   as string) ?? "");
  const subject = esc((formData.get("subject") as string) ?? "");
  const message = esc((formData.get("message") as string) ?? "");

  if (!type || !name || !email || !message) return { success: false };

  const typeLabel = TYPE_LABELS[type] ?? type;

  const phoneRow = phone
    ? `<tr><td style="padding:6px 0;color:#64748b;font-weight:600">Téléphone</td><td style="padding:6px 0">${phone}</td></tr>`
    : "";

  const subjectRow = subject
    ? `<tr><td style="padding:6px 0;color:#64748b;font-weight:600">Objet</td><td style="padding:6px 0">${subject}</td></tr>`
    : "";

  const typeBadgeColor = type === "incident" ? "#ef4444" : type === "evolution" ? "#8b5cf6" : "#2563eb";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0f172a;padding:24px 32px;border-radius:16px 16px 0 0">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;background:#2563eb;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:18px">O</div>
          <span style="color:white;font-weight:900;font-size:18px;letter-spacing:-0.5px">BailBot Support</span>
        </div>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px">
        <span style="display:inline-block;background:${typeBadgeColor};color:white;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;padding:4px 12px;border-radius:999px;margin-bottom:20px">${typeLabel}</span>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr><td style="padding:6px 0;color:#64748b;font-weight:600;width:140px">Nom</td><td style="padding:6px 0">${name}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-weight:600">Email</td><td style="padding:6px 0"><a href="mailto:${email}" style="color:#2563eb">${email}</a></td></tr>
          ${phoneRow}
          ${subjectRow}
        </table>
        <div style="background:#f8fafc;border-left:4px solid ${typeBadgeColor};padding:16px 20px;border-radius:0 8px 8px 0">
          <p style="margin:0;color:#1e293b;line-height:1.6;white-space:pre-wrap">${message}</p>
        </div>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: "contact@bailbot.fr",
      replyTo: email,
      subject: `[${typeLabel}] ${subject || name}`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}
