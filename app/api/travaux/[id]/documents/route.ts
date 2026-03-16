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
  const travaux = await prisma.travaux.findFirst({ where: { id, userId: user.id } });
  if (!travaux) return NextResponse.json({ error: "Travaux introuvables" }, { status: 404 });

  const documents = await prisma.travauxDocument.findMany({
    where: { travauxId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ documents });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const travaux = await prisma.travaux.findFirst({ where: { id, userId: user.id } });
  if (!travaux) return NextResponse.json({ error: "Travaux introuvables" }, { status: 404 });

  const body = await req.json();
  const { nom, type, url, taille } = body;

  if (!nom || !type || !url) {
    return NextResponse.json({ error: "Champs requis manquants (nom, type, url)" }, { status: 400 });
  }

  const document = await prisma.travauxDocument.create({
    data: {
      travauxId: id,
      nom,
      type,
      url,
      taille: taille ? parseInt(taille) : null,
    },
  });

  return NextResponse.json({ document }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const travaux = await prisma.travaux.findFirst({ where: { id, userId: user.id } });
  if (!travaux) return NextResponse.json({ error: "Travaux introuvables" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");
  if (!docId) return NextResponse.json({ error: "docId requis" }, { status: 400 });

  const doc = await prisma.travauxDocument.findFirst({ where: { id: docId, travauxId: id } });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  await prisma.travauxDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
