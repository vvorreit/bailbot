import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const travaux = await prisma.travaux.findFirst({
    where: { id, userId: user.id },
    include: { documents: true },
  });

  if (!travaux) return NextResponse.json({ error: "Travaux introuvables" }, { status: 404 });
  return NextResponse.json({ travaux });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.travaux.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Travaux introuvables" }, { status: 404 });

  const body = await req.json();
  const travaux = await prisma.travaux.update({
    where: { id },
    data: {
      titre: body.titre ?? existing.titre,
      bienId: body.bienId ?? existing.bienId,
      description: body.description !== undefined ? body.description : existing.description,
      categorie: body.categorie ?? existing.categorie,
      statut: body.statut ?? existing.statut,
      montantDevis: body.montantDevis !== undefined ? (body.montantDevis ? (isNaN(parseFloat(body.montantDevis)) ? existing.montantDevis : parseFloat(body.montantDevis)) : null) : existing.montantDevis,
      montantReel: body.montantReel !== undefined ? (body.montantReel ? (isNaN(parseFloat(body.montantReel)) ? existing.montantReel : parseFloat(body.montantReel)) : null) : existing.montantReel,
      dateDebut: body.dateDebut !== undefined ? (body.dateDebut ? new Date(body.dateDebut) : null) : existing.dateDebut,
      dateFin: body.dateFin !== undefined ? (body.dateFin ? new Date(body.dateFin) : null) : existing.dateFin,
      artisanNom: body.artisanNom !== undefined ? body.artisanNom : existing.artisanNom,
      artisanTel: body.artisanTel !== undefined ? body.artisanTel : existing.artisanTel,
      artisanEmail: body.artisanEmail !== undefined ? body.artisanEmail : existing.artisanEmail,
      deductible: body.deductible !== undefined ? body.deductible : existing.deductible,
      notes: body.notes !== undefined ? body.notes : existing.notes,
    },
    include: { documents: true },
  });

  return NextResponse.json({ travaux });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.travaux.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Travaux introuvables" }, { status: 404 });

  await prisma.travaux.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
