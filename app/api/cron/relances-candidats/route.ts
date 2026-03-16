import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail, escapeHtml } from '@/lib/mailer';
import { getTemplate } from '@/lib/templates-relance-candidat';

// GET /api/cron/relances-candidats — déclenché quotidiennement par Vercel Cron
// Header Authorization: Bearer CRON_SECRET requis
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const now = new Date();
  const j1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // J-1
  const j3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // J-3
  const j7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // J-7

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3011';
  let envoyees = 0;
  const erreurs: string[] = [];

  // ─── J+1 : EN_ATTENTE créées il y a ≥ 1 jour ─────────────────────────────
  const aRelancer1 = await prisma.relanceCandidat.findMany({
    where: {
      statut: 'EN_ATTENTE',
      createdAt: { lte: j1 },
    },
  });

  for (const r of aRelancer1) {
    try {
      const depot = await prisma.depotToken.findUnique({ where: { token: r.depotToken } });
      if (!depot) continue;

      const gestionnaire = await prisma.user.findUnique({ where: { id: r.userId } });
      const tpl = getTemplate(1, {
        bienAdresse: depot.bienAdresse,
        lienDepot: `${baseUrl}/depot/${r.depotToken}`,
        nomGestionnaire: gestionnaire?.rechercheMasquee ? undefined : (gestionnaire?.name ?? undefined),
      });

      await sendMail({ to: r.email, subject: tpl.sujet, html: tpl.corps });
      await prisma.relanceCandidat.update({
        where: { id: r.id },
        data: { statut: 'RELANCE_1', sequence: 1, derniereRelance: now },
      });
      envoyees++;
    } catch (e: unknown) {
      erreurs.push(`J+1 relance ${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ─── J+3 : RELANCE_1 dont derniereRelance ≥ 2 jours ─────────────────────
  const aRelancer2 = await prisma.relanceCandidat.findMany({
    where: {
      statut: 'RELANCE_1',
      derniereRelance: { lte: j3 },
    },
  });

  for (const r of aRelancer2) {
    try {
      const depot = await prisma.depotToken.findUnique({ where: { token: r.depotToken } });
      if (!depot) continue;

      const gestionnaire = await prisma.user.findUnique({ where: { id: r.userId } });
      const tpl = getTemplate(2, {
        bienAdresse: depot.bienAdresse,
        lienDepot: `${baseUrl}/depot/${r.depotToken}`,
        nomGestionnaire: gestionnaire?.rechercheMasquee ? undefined : (gestionnaire?.name ?? undefined),
      });

      await sendMail({ to: r.email, subject: tpl.sujet, html: tpl.corps });
      await prisma.relanceCandidat.update({
        where: { id: r.id },
        data: { statut: 'RELANCE_2', sequence: 2, derniereRelance: now },
      });
      envoyees++;
    } catch (e: unknown) {
      erreurs.push(`J+3 relance ${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ─── J+7 : RELANCE_2 dont derniereRelance ≥ 4 jours ─────────────────────
  const aRelancer3 = await prisma.relanceCandidat.findMany({
    where: {
      statut: 'RELANCE_2',
      derniereRelance: { lte: j7 },
    },
  });

  for (const r of aRelancer3) {
    try {
      const depot = await prisma.depotToken.findUnique({ where: { token: r.depotToken } });
      if (!depot) continue;

      const gestionnaire = await prisma.user.findUnique({ where: { id: r.userId } });
      const tpl = getTemplate(3, {
        bienAdresse: depot.bienAdresse,
        lienDepot: `${baseUrl}/depot/${r.depotToken}`,
        nomGestionnaire: gestionnaire?.rechercheMasquee ? undefined : (gestionnaire?.name ?? undefined),
      });

      await sendMail({ to: r.email, subject: tpl.sujet, html: tpl.corps });
      await prisma.relanceCandidat.update({
        where: { id: r.id },
        data: { statut: 'RELANCE_3', sequence: 3, derniereRelance: now },
      });

      // Notifier le gestionnaire à J+7
      if (gestionnaire?.email) {
        await sendMail({
          to: gestionnaire.email,
          subject: `[BailBot] Candidat non réactif — ${depot.bienAdresse}`,
          html: `<p>Le candidat <strong>${escapeHtml(r.email)}</strong> n'a pas complété son dossier pour
            <strong>${escapeHtml(depot.bienAdresse)}</strong> malgré 3 relances.
            <a href="${baseUrl}/dashboard/candidats">Consultez le tableau de bord</a> pour prendre une décision.</p>`,
        });
      }
      envoyees++;
    } catch (e: unknown) {
      erreurs.push(`J+7 relance ${r.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`[cron/relances-candidats] ${envoyees} emails envoyés, ${erreurs.length} erreurs`);

  return NextResponse.json({
    success: true,
    envoyees,
    erreurs: erreurs.length > 0 ? erreurs : undefined,
  });
}
