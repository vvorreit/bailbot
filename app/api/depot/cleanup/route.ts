import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/depot/cleanup — nettoyage des tokens expirés
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await prisma.depotToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return NextResponse.json({ deleted: result.count, timestamp: new Date().toISOString() });
}
