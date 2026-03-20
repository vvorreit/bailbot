import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const { pathname } = req.nextUrl;

    // Si l'utilisateur a un compte OAuth sans consentement DPA
    // → rediriger vers la page d'acceptation (sauf si déjà dessus ou sur les pages auth/legal)
    if (
      token?.needsDpaAcceptance === true &&
      !pathname.startsWith("/auth/dpa-required") &&
      !pathname.startsWith("/auth/signout") &&
      !pathname.startsWith("/legal") &&
      !pathname.startsWith("/api/auth")
    ) {
      return NextResponse.redirect(new URL("/auth/dpa-required", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/dpa-required",
  ],
};
