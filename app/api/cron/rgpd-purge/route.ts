export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { executerPurgeRGPD } from '@/lib/rgpd-purge';
import { logCronStart, logCronSuccess, logCronFailure } from '@/lib/cron-logger';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const cronRunId = await logCronStart("rgpd-purge");
  try {
    const result = await executerPurgeRGPD();
    console.log('[cron:rgpd-purge]', JSON.stringify(result));
    await logCronSuccess(cronRunId, result);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[cron:rgpd-purge] Erreur:', error);
    await logCronFailure(cronRunId, msg);
    return NextResponse.json(
      { error: 'Erreur lors de la purge RGPD' },
      { status: 500 }
    );
  }
}
