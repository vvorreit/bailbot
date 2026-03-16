import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    const bienId = formData.get("bienId") as string | null;
    const bailId = formData.get("bailId") as string | null;
    const docType = (formData.get("type") as string) || "autre";

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "documents", user.id);
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/documents/${user.id}/${filename}`;

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        bienId: bienId || null,
        bailId: bailId || null,
        nom: file.name,
        type: docType,
        url,
        taille: buffer.length,
      },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
