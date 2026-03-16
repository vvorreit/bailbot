export const dynamic = "force-dynamic";

import { getDiagnosticsForBien } from "@/app/actions/diagnostics-gestion";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DiagnosticsBienClient from "./DiagnosticsBienClient";

export default async function DiagnosticsBienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/signin");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/auth/signin");

  const bien = await prisma.bien.findFirst({
    where: { id, userId: user.id },
    select: { id: true, adresse: true },
  });
  if (!bien) redirect("/dashboard");

  const diagnostics = await getDiagnosticsForBien(id);

  return <DiagnosticsBienClient bienId={bien.id} adresse={bien.adresse} diagnostics={diagnostics} />;
}
