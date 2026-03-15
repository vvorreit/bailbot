"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  analyserTousDiagnostics,
  diagnosticsARenouveler,
  type DiagnosticExpiration,
} from "@/lib/diagnostics-expiration";

export interface AlerteDiagnostic {
  bienId: string;
  adresse: string;
  type: string;
  label: string;
  dateExpiration: string;
  joursRestants: number;
  criticite: "urgent" | "attention" | "valide" | "expire";
}

export async function getAlertesExpirationDiagnostics(): Promise<AlerteDiagnostic[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return [];

  const biens = await prisma.bien.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      adresse: true,
      dateDPE: true,
      dateElectricite: true,
      dateGaz: true,
      datePlomb: true,
      dateAmiante: true,
    },
  });

  const alertes: AlerteDiagnostic[] = [];

  for (const bien of biens) {
    const diagnostics = analyserTousDiagnostics({
      dateDPE: bien.dateDPE,
      dateElectricite: bien.dateElectricite,
      dateGaz: bien.dateGaz,
      datePlomb: bien.datePlomb,
      dateAmiante: bien.dateAmiante,
    });

    const aRenouveler = diagnosticsARenouveler(diagnostics, 90);

    for (const diag of aRenouveler) {
      alertes.push({
        bienId: bien.id,
        adresse: bien.adresse,
        type: diag.type,
        label: diag.label,
        dateExpiration: diag.dateExpiration.toISOString(),
        joursRestants: diag.joursRestants,
        criticite: diag.criticite,
      });
    }
  }

  return alertes.sort((a, b) => a.joursRestants - b.joursRestants);
}

export async function getDiagnosticsBien(bienId: string): Promise<DiagnosticExpiration[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return [];

  const bien = await prisma.bien.findFirst({
    where: { id: bienId, userId: user.id },
    select: {
      dateDPE: true,
      dateElectricite: true,
      dateGaz: true,
      datePlomb: true,
      dateAmiante: true,
    },
  });

  if (!bien) return [];

  return analyserTousDiagnostics({
    dateDPE: bien.dateDPE,
    dateElectricite: bien.dateElectricite,
    dateGaz: bien.dateGaz,
    datePlomb: bien.datePlomb,
    dateAmiante: bien.dateAmiante,
  });
}

export async function updateDiagnosticDates(
  bienId: string,
  dates: {
    dateDPE?: string | null;
    dateElectricite?: string | null;
    dateGaz?: string | null;
    datePlomb?: string | null;
    dateAmiante?: string | null;
  },
): Promise<{ success: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { success: false };

  const bien = await prisma.bien.findFirst({
    where: { id: bienId, userId: user.id },
  });
  if (!bien) return { success: false };

  await prisma.bien.update({
    where: { id: bienId },
    data: {
      dateDPE: dates.dateDPE ? new Date(dates.dateDPE) : dates.dateDPE === null ? null : undefined,
      dateElectricite: dates.dateElectricite ? new Date(dates.dateElectricite) : dates.dateElectricite === null ? null : undefined,
      dateGaz: dates.dateGaz ? new Date(dates.dateGaz) : dates.dateGaz === null ? null : undefined,
      datePlomb: dates.datePlomb ? new Date(dates.datePlomb) : dates.datePlomb === null ? null : undefined,
      dateAmiante: dates.dateAmiante ? new Date(dates.dateAmiante) : dates.dateAmiante === null ? null : undefined,
    },
  });

  return { success: true };
}
