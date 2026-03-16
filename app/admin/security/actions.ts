"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSecurityReport } from '@/lib/security-audit';
import { executerPurgeRGPD } from '@/lib/rgpd-purge';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error('Non authentifié');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') throw new Error('Accès réservé aux administrateurs');
  return session;
}

export async function getSecurityReportAction() {
  await requireAdmin();
  return await getSecurityReport();
}

export async function executePurgeAction() {
  await requireAdmin();
  return await executerPurgeRGPD();
}
