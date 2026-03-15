import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/cron/cleanup-depot — appelé par un cron externe (Vercel Cron, etc.)
export async function GET(req: NextRequest) {
  // Optionnel : vérifier un secret pour sécuriser l'endpoint
  const secret = req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const result = await prisma.depotToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  console.log(`[cron:cleanup-depot] Supprimé ${result.count} token(s) expirés`);
  return NextResponse.json({ deleted: result.count, timestamp: new Date().toISOString() });
}
