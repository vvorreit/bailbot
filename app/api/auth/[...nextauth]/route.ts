import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

const handler = NextAuth(authOptions);

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export { handler as GET };

export async function POST(req: NextRequest, context: any) {
  const ip = getIp(req);
  // 10 tentatives par IP par minute
  if (!await rateLimit(`auth:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 }
    );
  }
  return handler(req, context);
}
