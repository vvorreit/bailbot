/**
 * DossierFacile Connect — Route d'initiation OAuth2
 *
 * GET /api/auth/dossierfacile/connect
 *
 * Génère un state CSRF aléatoire, stocke en cookie, redirige vers DossierFacile SSO.
 * En prod : changer les env vars DOSSIERFACILE_* — aucun code à modifier.
 *
 * Si DOSSIERFACILE_CLIENT_ID n'est pas configuré, renvoie 501 (dégradé gracieux).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET() {
  const clientId = process.env.DOSSIERFACILE_CLIENT_ID;
  const ssoUrl = process.env.DOSSIERFACILE_SSO_URL ?? "https://sso.dossierfacile.logement.gouv.fr";
  const redirectUri =
    process.env.DOSSIERFACILE_REDIRECT_URI ??
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3011"}/api/auth/dossierfacile`;

  // Dégradé gracieux : si pas de CLIENT_ID configuré, renvoie vers la page d'instruction
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/dossierfacile-connect", process.env.NEXTAUTH_URL ?? "http://localhost:3011")
    );
  }

  // Génère un state CSRF aléatoire (32 bytes hex = 64 chars)
  const state = randomBytes(32).toString("hex");

  // Stocke le state dans un cookie httpOnly sécurisé (5 minutes)
  const cookieStore = await cookies();
  cookieStore.set("df_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300, // 5 minutes
    path: "/",
  });

  // Construit l'URL d'autorisation DossierFacile SSO (Keycloak OpenID Connect)
  const authUrl = new URL(
    `${ssoUrl}/auth/realms/dossier-facile/protocol/openid-connect/auth`
  );
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid dossier");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
