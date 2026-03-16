"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface CronStatusEntry {
  cronName: string;
  lastRun: {
    id: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    result: unknown;
    error: string | null;
  } | null;
  recentRuns: {
    id: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    error: string | null;
  }[];
}

const CRON_NAMES = [
  "quittances-auto",
  "indexation-irl",
  "rappels-impayes",
  "rgpd-purge",
  "alertes-diagnostics",
  "alertes-bails",
  "alertes-echeances",
  "relances-candidats",
  "revision-irl",
  "cleanup-depot",
];

export async function getCronStatus(): Promise<CronStatusEntry[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("Acces refuse");
  }

  const results: CronStatusEntry[] = [];

  for (const cronName of CRON_NAMES) {
    const recentRuns = await prisma.cronRun.findMany({
      where: { cronName },
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    const lastRun = recentRuns[0] || null;

    results.push({
      cronName,
      lastRun: lastRun
        ? {
            id: lastRun.id,
            status: lastRun.status,
            startedAt: lastRun.startedAt.toISOString(),
            finishedAt: lastRun.finishedAt?.toISOString() ?? null,
            result: lastRun.result,
            error: lastRun.error,
          }
        : null,
      recentRuns: recentRuns.map((r) => ({
        id: r.id,
        status: r.status,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
        error: r.error,
      })),
    });
  }

  return results;
}

export async function triggerCron(cronName: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    throw new Error("Acces refuse");
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3011";
  const cronSecret = process.env.CRON_SECRET || "";

  try {
    const res = await fetch(`${baseUrl}/api/cron/${cronName}`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
