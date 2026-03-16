import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ shouldSkip: false });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, onboardingCompleted: true },
  });
  if (!user) return NextResponse.json({ shouldSkip: false });

  if (user.onboardingCompleted) return NextResponse.json({ shouldSkip: true });

  const bailCount = await prisma.bailActif.count({ where: { userId: user.id } });
  const bienCount = await prisma.bien.count({ where: { userId: user.id } });

  if (bailCount > 0 || bienCount > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: true },
    });
    return NextResponse.json({ shouldSkip: true });
  }

  return NextResponse.json({ shouldSkip: false });
}
