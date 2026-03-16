export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { executerPurgeRGPD } from '@/lib/rgpd-purge';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  try {
    const result = await executerPurgeRGPD();
    console.log('[cron:rgpd-purge]', JSON.stringify(result));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[cron:rgpd-purge] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la purge RGPD' },
      { status: 500 }
    );
  }
}
