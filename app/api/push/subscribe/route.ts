import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Subscription invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, pushSubscriptions: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const existing = (user.pushSubscriptions as any[]) ?? [];
  const alreadyExists = existing.some((s: any) => s.endpoint === subscription.endpoint);

  if (!alreadyExists) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pushSubscriptions: [...existing, subscription],
      },
    });
  }

  return NextResponse.json({ success: true });
}
