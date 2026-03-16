"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface SearchResult {
  id: string;
  type: "bien" | "locataire" | "bail" | "candidature" | "travaux" | "document";
  label: string;
  sublabel?: string;
  href: string;
}

export async function searchGlobal(query: string): Promise<SearchResult[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || query.length < 2) return [];

  const userId = session.user.id;
  const q = query.trim();

  const [biens, bails, candidatures, travaux, documents] = await Promise.all([
    prisma.bien.findMany({
      where: { userId, adresse: { contains: q, mode: "insensitive" } },
      select: { id: true, adresse: true, loyer: true },
      take: 5,
    }),
    prisma.bailActif.findMany({
      where: {
        userId,
        OR: [
          { locataireNom: { contains: q, mode: "insensitive" } },
          { locataireEmail: { contains: q, mode: "insensitive" } },
          { descriptionLot: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, locataireNom: true, locataireEmail: true, descriptionLot: true },
      take: 5,
    }),
    prisma.candidatureLocal.findMany({
      where: {
        userId,
        dossier: { path: ["nom"], string_contains: q },
      },
      select: { id: true, dossier: true, statut: true },
      take: 5,
    }),
    prisma.travaux.findMany({
      where: {
        userId,
        OR: [
          { titre: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, titre: true, statut: true },
      take: 5,
    }),
    prisma.document.findMany({
      where: {
        userId,
        nom: { contains: q, mode: "insensitive" },
      },
      select: { id: true, nom: true, type: true },
      take: 5,
    }),
  ]);

  const results: SearchResult[] = [];

  for (const b of biens) {
    results.push({
      id: b.id,
      type: "bien",
      label: b.adresse,
      sublabel: `${b.loyer} €/mois`,
      href: `/dashboard/biens/${b.id}`,
    });
  }

  for (const b of bails) {
    results.push({
      id: b.id,
      type: "bail",
      label: b.locataireNom,
      sublabel: b.locataireEmail || b.descriptionLot || undefined,
      href: "/dashboard/bails",
    });
    results.push({
      id: `loc-${b.id}`,
      type: "locataire",
      label: b.locataireNom,
      sublabel: b.locataireEmail || undefined,
      href: "/dashboard/bails",
    });
  }

  for (const c of candidatures) {
    const dossier = c.dossier as Record<string, string> | null;
    results.push({
      id: c.id,
      type: "candidature",
      label: dossier?.nom || "Candidature",
      sublabel: c.statut,
      href: "/dashboard/candidatures",
    });
  }

  for (const t of travaux) {
    results.push({
      id: t.id,
      type: "travaux",
      label: t.titre,
      sublabel: t.statut,
      href: `/dashboard/travaux/${t.id}`,
    });
  }

  for (const d of documents) {
    results.push({
      id: d.id,
      type: "document",
      label: d.nom,
      sublabel: d.type,
      href: "/dashboard/documents",
    });
  }

  return results;
}
