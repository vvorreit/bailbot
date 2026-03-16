"use server";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encryptIfPresent, decryptIfPresent } from '@/lib/crypto';

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
    select: { id: true },
  });
  if (!user) return null;

  const row = await prisma.profilBailleurTable.findUnique({
    where: { userId: user.id },
  });
  if (!row) return null;

  return {
    nom: row.nom ?? '',
    prenom: row.prenom ?? '',
    adresse: row.adresse ?? '',
    codePostal: row.codePostal ?? '',
    ville: row.ville ?? '',
    telephone: row.telephone ?? '',
    email: row.email ?? '',
    siret: row.siret ?? undefined,
    iban: decryptIfPresent(row.iban) ?? undefined,
  };
}

export async function saveProfilBailleur(data: ProfilBailleur): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { ok: false, error: 'Non authentifié' };

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return { ok: false, error: 'Utilisateur introuvable' };

    const encryptedIban = encryptIfPresent(data.iban || null);

    await prisma.profilBailleurTable.upsert({
      where: { userId: user.id },
      update: {
        nom: data.nom,
        prenom: data.prenom,
        adresse: data.adresse,
        codePostal: data.codePostal,
        ville: data.ville,
        telephone: data.telephone,
        email: data.email,
        siret: data.siret ?? null,
        iban: encryptedIban,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        nom: data.nom,
        prenom: data.prenom,
        adresse: data.adresse,
        codePostal: data.codePostal,
        ville: data.ville,
        telephone: data.telephone,
        email: data.email,
        siret: data.siret ?? null,
        iban: encryptedIban,
      },
    });
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue';
    return { ok: false, error: message };
  }
}
