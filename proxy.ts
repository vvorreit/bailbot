import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/api/",
  "/auth/",
  "/onboarding",
  "/locataire/",
  "/proprietaire/",
  "/depot/",
  "/_next/",
  "/sw.js",
  "/favicon",
  "/icon-",
  "/manifest",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip static files
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // Only check dashboard and admin routes
  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Not authenticated → redirect to signin
  if (!token) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to onboarding if not completed
  if (token.onboardingCompleted === false) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
