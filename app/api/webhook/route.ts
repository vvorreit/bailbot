import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is missing");
    }
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = session.subscription as string;
      const metadata = session.metadata || {};

      const plan = (metadata.plan as string) || "SOLO";

      // 1. Abonnement ÉQUIPE
      if (metadata.teamId) {
        await prisma.team.update({
          where: { id: metadata.teamId },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: session.customer as string,
            plan: "PRO",
          },
        });
        console.log(`Team ${metadata.teamId} upgraded to PRO (${plan})`);
      }
      // 2. Abonnement PERSO
      else if (metadata.userId) {
        await prisma.user.update({
          where: { id: metadata.userId },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: session.customer as string,
            isPro: true,
            plan,
          },
        });
        console.log(`User ${metadata.userId} upgraded to ${plan}`);
      } else {
        console.warn("checkout.session.completed sans metadata teamId/userId", session.id);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as unknown as Record<string, unknown>;
      const sub = invoice.subscription;
      const subscriptionId = typeof sub === 'string' ? sub : (sub as { id?: string })?.id ?? 'unknown';
      const attemptCount = typeof invoice.attempt_count === 'number' ? invoice.attempt_count : '?';
      console.warn(`Paiement échoué pour subscription ${subscriptionId}. Tentative ${attemptCount}`);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      const team = await prisma.team.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
      if (team) {
        await prisma.team.update({
          where: { id: team.id },
          data: { plan: "FREE" },
        });
        console.log(`Team ${team.id} downgraded to FREE`);
      } else {
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isPro: false },
          });
          console.log(`User ${user.id} downgraded to FREE`);
        } else {
          console.warn(`customer.subscription.deleted : aucun team/user trouvé pour ${subscriptionId}`);
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const isActive = subscription.status === "active" || subscription.status === "trialing";

      const team = await prisma.team.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
      if (team) {
        await prisma.team.update({
          where: { id: team.id },
          data: { plan: isActive ? "PRO" : "FREE" },
        });
      } else {
        const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: subscriptionId } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { isPro: isActive },
          });
        }
      }
    }
  } catch (err) {
    console.error(`Erreur traitement webhook ${event.type}:`, err);
    // Retourner 500 pour que Stripe retente
    return new NextResponse("Webhook processing error", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
