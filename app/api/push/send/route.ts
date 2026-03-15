import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { userId, title, body, url, icon } = await req.json();
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "userId, title et body requis" }, { status: 400 });
  }

  const result = await sendPushToUser(userId, { title, body, url, icon });
  return NextResponse.json(result);
}
