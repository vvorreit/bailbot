import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });

  const travaux = await prisma.travaux.findMany({
    where: { userId: user.id },
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ travaux });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });

  const body = await req.json();
  const { titre, bienId, categorie } = body;

  if (!titre || !bienId || !categorie) {
    return NextResponse.json({ error: "Champs requis manquants (titre, bienId, categorie)" }, { status: 400 });
  }

  const travaux = await prisma.travaux.create({
    data: {
      userId: user.id,
      bienId,
      titre,
      description: body.description || null,
      categorie,
      statut: body.statut || "A_FAIRE",
      montantDevis: body.montantDevis ? parseFloat(body.montantDevis) : null,
      montantReel: body.montantReel ? parseFloat(body.montantReel) : null,
      dateDebut: body.dateDebut ? new Date(body.dateDebut) : null,
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      artisanNom: body.artisanNom || null,
      artisanTel: body.artisanTel || null,
      artisanEmail: body.artisanEmail || null,
      deductible: body.deductible ?? true,
      notes: body.notes || null,
    },
    include: { documents: true },
  });

  return NextResponse.json({ travaux }, { status: 201 });
}
