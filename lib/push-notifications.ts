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

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? "/dashboard",
          icon: payload.icon ?? "/icon-192x192.png",
        })
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        expiredIds.push(sub.id);
      }
      failed++;
    }
  }

  if (expiredIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: expiredIds } },
    });
  }

  return { sent, failed };
}
