import { prisma } from '@/lib/db';

/**
 * Génère un numéro de quittance séquentiel au format QUI-YYYY-NNNN
 * Ex: QUI-2026-0001, QUI-2026-0042
 */
export async function generateQuittanceNumero(year?: number): Promise<string> {
  const y = year ?? new Date().getFullYear();
  const prefix = `QUI-${y}-`;

  const last = await prisma.quittanceAuto.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });

  let nextNum = 1;
  if (last?.numero) {
    const suffix = last.numero.replace(prefix, '');
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}
