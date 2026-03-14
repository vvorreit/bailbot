"use server";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMail, smtpConfigured } from "@/lib/mailer";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!smtpConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "RESEND_API_KEY non défini dans les variables d'environnement",
    }, { status: 500 });
  }

  try {
    const result = await sendMail({
      to: (session.user as any).email,
      subject: "BailBot — Test email ✓",
      html: `<p>Email de test envoyé depuis BailBot à ${new Date().toISOString()}.<br/>Si vous recevez ceci, Resend est correctement configuré.</p>`,
    });

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
