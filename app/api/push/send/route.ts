import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { userId, title, body, url, icon } = await req.json();
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "userId, title et body requis" }, { status: 400 });
  }

  try {
    const result = await sendPushToUser(userId, { title, body, url, icon });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[push/send] Erreur:", err);
    return NextResponse.json({ error: "Erreur envoi notification" }, { status: 500 });
  }
}
