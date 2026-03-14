"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { generatePayloadString, type AutofillPayload } from "@/lib/autofill";
import { randomBytes } from "crypto";

async function getSession() {
  return await getServerSession(authOptions);
}

export async function getUserDashboardData() {
  try {
    const session = await getSession();
    if (!session?.user?.email) return null;

    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        clientCount: true,
        isPro: true,
        plan: true,
        syncToken: true,
        role: true,
        createdAt: true,
      }
    });

    if (user && !user.syncToken) {
      user = await prisma.user.update({
        where: { email: session.user.email },
        data: { syncToken: randomBytes(16).toString("hex") },
        select: {
          clientCount: true,
          isPro: true,
          plan: true,
          syncToken: true,
          role: true,
          createdAt: true,
        }
      });
    }

    if (user) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: { lastActiveAt: new Date() }
      });
    }

    return user;
  } catch (error) {
    console.error("Erreur getUserDashboardData:", error);
    return null;
  }
}

export async function generateAutofillPayload(payload: AutofillPayload): Promise<string> {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorisé");

  return generatePayloadString(payload);
}

export async function incrementClientCountInDB() {
  try {
    const session = await getSession();
    if (!session?.user?.email) throw new Error("Non autorisé");

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        clientCount: { increment: 1 },
        lastActiveAt: new Date(),
      }
    });

    return user.clientCount;
  } catch (error) {
    console.error("Erreur incrementClientCountInDB:", error);
    throw error;
  }
}

export async function createCheckoutSession(plan: "SOLO" | "DUO") {
  const priceId = plan === "SOLO"
    ? process.env.STRIPE_PRICE_SOLO
    : process.env.STRIPE_PRICE_DUO;

  if (!priceId) throw new Error(`Plan Stripe non configuré : STRIPE_PRICE_${plan}`);
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { team: true }
  });

  if (!user) throw new Error("Utilisateur introuvable");

  let customerId: string | null = null;
  let isTeamBilling = false;

  // Logique de facturation d'équipe
  if (user.teamId) {
    if (user.teamRole !== "OWNER") {
      throw new Error("Seul l'administrateur de l'équipe peut gérer la facturation.");
    }
    isTeamBilling = true;
    customerId = user.team?.stripeCustomerId || null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.team?.name || `Équipe de ${user.name}`,
        metadata: { teamId: user.teamId }
      });
      customerId = customer.id;
      await prisma.team.update({
        where: { id: user.teamId },
        data: { stripeCustomerId: customerId }
      });
    }
  } else {
    // Facturation personnelle (Legacy / Solo)
    customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      });
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId!,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    tax_id_collection: { enabled: true },
    automatic_tax: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
    metadata: isTeamBilling ? { teamId: user.teamId, plan } : { userId: user.id, plan },
    subscription_data: {
      metadata: isTeamBilling ? { teamId: user.teamId, plan } : { userId: user.id, plan }
    }
  });

  return { url: checkoutSession.url };
}

export async function upgradePlan(newPlan: "SOLO" | "DUO") {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { stripeSubscriptionId: true, plan: true }
  });

  if (!user?.stripeSubscriptionId) throw new Error("Aucun abonnement actif.");
  if (user.plan === newPlan) throw new Error("Vous êtes déjà sur ce plan.");

  const newPriceId = newPlan === "DUO"
    ? process.env.STRIPE_PRICE_DUO
    : process.env.STRIPE_PRICE_SOLO;

  if (!newPriceId) throw new Error(`Plan Stripe non configuré : STRIPE_PRICE_${newPlan}`);

  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
  const itemId = subscription.items.data[0]?.id;
  if (!itemId) throw new Error("Abonnement introuvable.");

  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: "always_invoice",
    metadata: { plan: newPlan },
  });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { plan: newPlan },
  });

  return { success: true };
}

export async function createPortalSession() {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { team: true }
  });

  if (!user) throw new Error("Utilisateur introuvable");

  let customerId: string | null = null;

  if (user.teamId) {
    if (user.teamRole !== "OWNER") {
      throw new Error("Seul l'administrateur peut accéder au portail de facturation.");
    }
    customerId = user.team?.stripeCustomerId || null;
  } else {
    customerId = user.stripeCustomerId;
  }

  if (!customerId) throw new Error("Aucun abonnement actif trouvé.");

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  });

  return { url: portalSession.url };
}
