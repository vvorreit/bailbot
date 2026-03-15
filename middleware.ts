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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip static files
  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  // Only check dashboard and app routes
  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.next();
  }

  // Redirect to onboarding if not completed
  if (token.onboardingCompleted === false) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
