import webPush from "web-push";
import { prisma } from "@/lib/db";

// Instanciation lazy — évite le crash au build Docker
let _configured = false;
function ensureVapid() {
  if (_configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquant");
  }
  webPush.setVapidDetails("mailto:contact@optibot.fr", publicKey, privateKey);
  _configured = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureVapid();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushSubscriptions: true },
  });

  const subscriptions = (user?.pushSubscriptions as any[]) ?? [];
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const validSubs: any[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        sub,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? "/dashboard",
          icon: payload.icon ?? "/icon-192x192.png",
        })
      );
      validSubs.push(sub);
      sent++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        failed++;
      } else {
        validSubs.push(sub);
        failed++;
      }
    }
  }

  // Nettoyer les subscriptions expirées
  if (validSubs.length !== subscriptions.length) {
    await prisma.user.update({
      where: { id: userId },
      data: { pushSubscriptions: validSubs },
    });
  }

  return { sent, failed };
}
