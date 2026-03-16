"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALL_DIAGNOSTIC_TYPES,
  DIAGNOSTICS_CONFIG,
  calculerDateExpiration,
  getStatutDiagnostic,
  type DiagnosticType,
} from "@/lib/diagnostics-config";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Non autorise");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

async function getTeamUserIds(teamId: string): Promise<string[]> {
  const members = await prisma.user.findMany({
    where: { teamId },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

async function getUserBienIds(user: { id: string; teamId: string | null; teamRole: string | null }) {
  if (user.teamId) {
    const isAdmin = user.teamRole === "OWNER" || user.teamRole === "ADMIN";
    if (isAdmin) {
      const memberIds = await getTeamUserIds(user.teamId);
      return { userId: { in: memberIds } };
    }
    return { OR: [{ userId: user.id }, { assigneA: user.id }] };
  }
  return { userId: user.id };
}

export interface DiagnosticAvecStatut {
  id: string | null;
  bienId: string;
  type: DiagnosticType;
  nom: string;
  description: string;
  obligatoire: string;
  legalRef: string;
  conseils: string;
  dateRealisation: string | null;
  dateExpiration: string | null;
  fichierUrl: string | null;
  fichierNom: string | null;
  notes: string | null;
  nonConcerne: boolean;
  statut: string;
  validiteLabel: string;
}

export async function getDiagnosticsForBien(bienId: string): Promise<DiagnosticAvecStatut[]> {
  const user = await getUser();

  const userFilter = await getUserBienIds(user);
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, ...userFilter },
  });
  if (!bien) throw new Error("Bien introuvable");

  const diagnostics = await prisma.diagnosticBien.findMany({
    where: { bienId },
  });

  const diagMap = new Map(diagnostics.map((d) => [d.type, d]));

  return ALL_DIAGNOSTIC_TYPES.map((type) => {
    const config = DIAGNOSTICS_CONFIG[type];
    const diag = diagMap.get(type) || null;
    const statut = getStatutDiagnostic(
      diag ? { dateExpiration: diag.dateExpiration, nonConcerne: diag.nonConcerne, dateRealisation: diag.dateRealisation } : null,
      type
    );

    let validiteLabel = "Illimite";
    if (config.validiteAns) validiteLabel = `${config.validiteAns} ans`;
    else if (config.validiteMois) validiteLabel = `${config.validiteMois} mois`;

    return {
      id: diag?.id ?? null,
      bienId,
      type,
      nom: config.nom,
      description: config.description,
      obligatoire: config.obligatoire,
      legalRef: config.legalRef,
      conseils: config.conseils,
      dateRealisation: diag?.dateRealisation?.toISOString() ?? null,
      dateExpiration: diag?.dateExpiration?.toISOString() ?? null,
      fichierUrl: diag?.fichierUrl ?? null,
      fichierNom: diag?.fichierNom ?? null,
      notes: diag?.notes ?? null,
      nonConcerne: diag?.nonConcerne ?? false,
      statut,
      validiteLabel,
    };
  });
}

export async function upsertDiagnostic(
  bienId: string,
  type: DiagnosticType,
  data: {
    dateRealisation?: string | null;
    dateExpiration?: string | null;
    fichierUrl?: string | null;
    fichierNom?: string | null;
    notes?: string | null;
    nonConcerne?: boolean;
  }
): Promise<{ success: boolean }> {
  const user = await getUser();

  const userFilter = await getUserBienIds(user);
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, ...userFilter },
  });
  if (!bien) throw new Error("Bien introuvable");

  const dateRealisation = data.dateRealisation ? new Date(data.dateRealisation) : null;
  let dateExpiration: Date | null = null;

  if (data.dateExpiration) {
    dateExpiration = new Date(data.dateExpiration);
  } else if (dateRealisation) {
    dateExpiration = calculerDateExpiration(type, dateRealisation);
  }

  await prisma.diagnosticBien.upsert({
    where: { bienId_type: { bienId, type } },
    create: {
      bienId,
      userId: user.id,
      type,
      dateRealisation,
      dateExpiration,
      fichierUrl: data.fichierUrl ?? null,
      fichierNom: data.fichierNom ?? null,
      notes: data.notes ?? null,
      nonConcerne: data.nonConcerne ?? false,
      alerteEnvoyee30j: false,
      alerteEnvoyee7j: false,
    },
    update: {
      dateRealisation,
      dateExpiration,
      fichierUrl: data.fichierUrl ?? undefined,
      fichierNom: data.fichierNom ?? undefined,
      notes: data.notes ?? undefined,
      nonConcerne: data.nonConcerne ?? undefined,
      alerteEnvoyee30j: false,
      alerteEnvoyee7j: false,
      updatedAt: new Date(),
    },
  });

  return { success: true };
}

export async function deleteDiagnostic(id: string): Promise<{ success: boolean }> {
  const user = await getUser();

  const diag = await prisma.diagnosticBien.findUnique({ where: { id } });
  if (!diag) throw new Error("Diagnostic introuvable");

  const userFilter = await getUserBienIds(user);
  const bien = await prisma.bien.findFirst({
    where: { id: diag.bienId, ...userFilter },
  });
  if (!bien) throw new Error("Non autorise");

  await prisma.diagnosticBien.delete({ where: { id } });
  return { success: true };
}

export interface DiagnosticExpirant {
  id: string;
  bienId: string;
  adresse: string;
  type: string;
  nom: string;
  dateExpiration: string;
  joursRestants: number;
  userId: string;
  userEmail: string;
  alerteEnvoyee30j: boolean;
  alerteEnvoyee7j: boolean;
}

export async function getDiagnosticsExpirantBientot(joursAvant: number): Promise<DiagnosticExpirant[]> {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() + joursAvant);

  const diagnostics = await prisma.diagnosticBien.findMany({
    where: {
      nonConcerne: false,
      dateExpiration: {
        lte: dateLimite,
        gte: new Date(),
      },
    },
  });

  if (diagnostics.length === 0) return [];

  const bienIds = [...new Set(diagnostics.map((d) => d.bienId))];
  const userIds = [...new Set(diagnostics.map((d) => d.userId))];

  const biens = await prisma.bien.findMany({
    where: { id: { in: bienIds } },
    select: { id: true, adresse: true },
  });
  const bienMap = new Map(biens.map((b) => [b.id, b.adresse]));

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.email]));

  const now = new Date();

  return diagnostics.map((d) => ({
    id: d.id,
    bienId: d.bienId,
    adresse: bienMap.get(d.bienId) || "",
    type: d.type,
    nom: DIAGNOSTICS_CONFIG[d.type as DiagnosticType]?.nom || d.type,
    dateExpiration: d.dateExpiration!.toISOString(),
    joursRestants: Math.ceil((d.dateExpiration!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    userId: d.userId,
    userEmail: userMap.get(d.userId) || "",
    alerteEnvoyee30j: d.alerteEnvoyee30j,
    alerteEnvoyee7j: d.alerteEnvoyee7j,
  }));
}

export async function getAllDiagnosticsForUser(): Promise<{
  bienId: string;
  adresse: string;
  diagnostics: DiagnosticAvecStatut[];
}[]> {
  const user = await getUser();

  const userFilter = await getUserBienIds(user);
  const biens = await prisma.bien.findMany({
    where: userFilter,
    select: { id: true, adresse: true },
    orderBy: { adresse: "asc" },
  });

  if (biens.length === 0) return [];

  const bienIds = biens.map((b) => b.id);
  const diagnostics = await prisma.diagnosticBien.findMany({
    where: { bienId: { in: bienIds } },
  });

  const diagByBien = new Map<string, typeof diagnostics>();
  for (const d of diagnostics) {
    const arr = diagByBien.get(d.bienId) || [];
    arr.push(d);
    diagByBien.set(d.bienId, arr);
  }

  return biens.map((bien) => {
    const bienDiags = diagByBien.get(bien.id) || [];
    const diagMap = new Map(bienDiags.map((d) => [d.type, d]));

    const diagList: DiagnosticAvecStatut[] = ALL_DIAGNOSTIC_TYPES.map((type) => {
      const config = DIAGNOSTICS_CONFIG[type];
      const diag = diagMap.get(type) || null;
      const statut = getStatutDiagnostic(
        diag ? { dateExpiration: diag.dateExpiration, nonConcerne: diag.nonConcerne, dateRealisation: diag.dateRealisation } : null,
        type
      );

      let validiteLabel = "Illimite";
      if (config.validiteAns) validiteLabel = `${config.validiteAns} ans`;
      else if (config.validiteMois) validiteLabel = `${config.validiteMois} mois`;

      return {
        id: diag?.id ?? null,
        bienId: bien.id,
        type,
        nom: config.nom,
        description: config.description,
        obligatoire: config.obligatoire,
        legalRef: config.legalRef,
        conseils: config.conseils,
        dateRealisation: diag?.dateRealisation?.toISOString() ?? null,
        dateExpiration: diag?.dateExpiration?.toISOString() ?? null,
        fichierUrl: diag?.fichierUrl ?? null,
        fichierNom: diag?.fichierNom ?? null,
        notes: diag?.notes ?? null,
        nonConcerne: diag?.nonConcerne ?? false,
        statut,
        validiteLabel,
      };
    });

    return {
      bienId: bien.id,
      adresse: bien.adresse,
      diagnostics: diagList,
    };
  });
}

export async function getNbDiagnosticsExpires(): Promise<number> {
  const user = await getUser();

  const userFilter = await getUserBienIds(user);
  const biens = await prisma.bien.findMany({
    where: userFilter,
    select: { id: true },
  });

  if (biens.length === 0) return 0;

  const bienIds = biens.map((b) => b.id);

  const expired = await prisma.diagnosticBien.count({
    where: {
      bienId: { in: bienIds },
      nonConcerne: false,
      dateExpiration: { lte: new Date() },
    },
  });

  return expired;
}
