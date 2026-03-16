import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const request = await prisma.signatureRequest.findUnique({
    where: { token },
    select: {
      id: true,
      documentType: true,
      documentId: true,
      signataire: true,
      signedAt: true,
      expiresAt: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Signature introuvable" }, { status: 404 });
  }

  return NextResponse.json({ signature: request });
}
