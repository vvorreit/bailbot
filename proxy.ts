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

async function proxyHandler(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.includes(".")) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  if (token.onboardingCompleted === false) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export default proxyHandler;
export const proxy = proxyHandler;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
