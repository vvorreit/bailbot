import { prisma } from "@/lib/db";
import { sendMail, smtpConfigured } from "@/lib/mailer";

/**
 * Log cron execution start/end in CronRun table.
 * Sends alert email on failure if ADMIN_EMAIL is set.
 */
export async function logCronStart(cronName: string): Promise<string> {
  const run = await prisma.cronRun.create({
    data: {
      cronName,
      status: "RUNNING",
    },
  });
  return run.id;
}

export async function logCronSuccess(runId: string, result?: unknown): Promise<void> {
  await prisma.cronRun.update({
    where: { id: runId },
    data: {
      status: "SUCCESS",
      finishedAt: new Date(),
      result: result ? JSON.parse(JSON.stringify(result)) : undefined,
    },
  });
}

export async function logCronFailure(runId: string, error: string): Promise<void> {
  await prisma.cronRun.update({
    where: { id: runId },
    data: {
      status: "FAILURE",
      finishedAt: new Date(),
      error,
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && smtpConfigured()) {
    try {
      const run = await prisma.cronRun.findUnique({ where: { id: runId } });
      await sendMail({
        to: adminEmail,
        subject: `[BailBot ALERTE] Cron echoue : ${run?.cronName || "inconnu"}`,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #fef2f2; border-radius: 12px; padding: 32px 24px; border: 1px solid #fecaca;">
    <h2 style="color: #991b1b; margin-top: 0;">Cron en echec</h2>
    <p><strong>Nom :</strong> ${run?.cronName || "inconnu"}</p>
    <p><strong>Date :</strong> ${new Date().toLocaleString("fr-FR")}</p>
    <p><strong>Erreur :</strong></p>
    <pre style="background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${error}</pre>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    BailBot · contact@optibot.fr
  </p>
</div>`,
      });
    } catch {
      console.error("[cron-logger] Failed to send alert email");
    }
  }
}

/**
 * Wrapper to run a cron function with automatic logging.
 */
export async function withCronLogging<T>(
  cronName: string,
  fn: () => Promise<T>
): Promise<T> {
  const runId = await logCronStart(cronName);
  try {
    const result = await fn();
    await logCronSuccess(runId, result);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logCronFailure(runId, msg);
    throw err;
  }
}
