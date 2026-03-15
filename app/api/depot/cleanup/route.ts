import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/depot/cleanup — nettoyage des tokens expirés
export async function GET(req: NextRequest) {
  const result = await prisma.depotToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return NextResponse.json({ deleted: result.count, timestamp: new Date().toISOString() });
}
