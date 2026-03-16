import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/auth/dossierfacile/profile
 * Lit le cookie httpOnly df_profile et le renvoie au client, puis le supprime.
 */
export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("df_profile")?.value;

  if (!raw) {
    return NextResponse.json({ profile: null });
  }

  cookieStore.delete("df_profile");

  try {
    const profile = JSON.parse(raw);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: null });
  }
}
