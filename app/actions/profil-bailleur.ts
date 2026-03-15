"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface ProfilBailleur {
  nom: string;
  prenom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  siret?: string;
  iban?: string;
}

export async function getProfilBailleur(): Promise<ProfilBailleur | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { profilBailleur: true },
  });

  if (!user?.profilBailleur) return null;
  return user.profilBailleur as ProfilBailleur;
}

export async function saveProfilBailleur(data: ProfilBailleur): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: 'Non authentifié' };

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { profilBailleur: data as any },
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
