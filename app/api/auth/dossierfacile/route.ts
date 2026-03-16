/**
 * DossierFacile Connect — Callback OAuth2
 *
 * GET /api/auth/dossierfacile?code=xxx&state=yyy
 *
 * Flux :
 *   1. Vérifie le state CSRF (cookie df_oauth_state)
 *   2. Échange le code contre un access_token (token endpoint Keycloak)
 *   3. Appelle GET /dfc/tenant/profile pour récupérer le dossier locataire
 *   4. Stocke le profil JSON dans un cookie de session temporaire (30 minutes)
 *   5. Redirige vers /dashboard?dossier=loaded pour déclencher le pré-remplissage
 *
 * Pour passer en prod : mettre à jour les env vars DOSSIERFACILE_* uniquement.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3011";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // L'utilisateur a refusé l'accès ou une erreur côté DossierFacile
  if (error) {
    console.warn("[DossierFacile Connect] OAuth error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(`${BASE_URL}/dashboard?dossier=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${BASE_URL}/dashboard?dossier=error&reason=missing_params`);
  }

  // ─── Vérification CSRF ──────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const storedState = cookieStore.get("df_oauth_state")?.value;

  // Supprime le cookie CSRF immédiatement (usage unique)
  cookieStore.delete("df_oauth_state");

  if (!storedState || storedState !== state) {
    console.error("[DossierFacile Connect] State CSRF mismatch");
    return NextResponse.redirect(`${BASE_URL}/dashboard?dossier=error&reason=csrf`);
  }

  const clientId = process.env.DOSSIERFACILE_CLIENT_ID;
  const clientSecret = process.env.DOSSIERFACILE_CLIENT_SECRET;
  const ssoUrl = process.env.DOSSIERFACILE_SSO_URL ?? "https://sso.dossierfacile.logement.gouv.fr";
  const apiUrl = process.env.DOSSIERFACILE_API_URL ?? "https://api.dossierfacile.fr";
  const redirectUri =
    process.env.DOSSIERFACILE_REDIRECT_URI ?? `${BASE_URL}/api/auth/dossierfacile`;

  if (!clientId || !clientSecret) {
    console.error("[DossierFacile Connect] Missing CLIENT_ID or CLIENT_SECRET");
    return NextResponse.redirect(`${BASE_URL}/dossierfacile-connect`);
  }

  try {
    // ─── Échange du code contre un access_token ─────────────────────────────
    const tokenUrl = `${ssoUrl}/auth/realms/dossier-facile/protocol/openid-connect/token`;

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[DossierFacile Connect] Token exchange failed:", tokenRes.status, errBody);
      return NextResponse.redirect(`${BASE_URL}/dashboard?dossier=error&reason=token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    if (!accessToken) {
      console.error("[DossierFacile Connect] No access_token in response");
      return NextResponse.redirect(`${BASE_URL}/dashboard?dossier=error&reason=no_token`);
    }

    // ─── Appel à l'API profil locataire ─────────────────────────────────────
    const profileRes = await fetch(`${apiUrl}/dfc/tenant/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      console.error("[DossierFacile Connect] Profile fetch failed:", profileRes.status);
      return NextResponse.redirect(`${BASE_URL}/dashboard?dossier=error&reason=profile_fetch`);
    }

    const profile = await profileRes.json();

    // ─── Stockage temporaire en cookie (30 min) ──────────────────────────────
    // Le cookie sera lu côté client au chargement du dashboard
    const profileJson = JSON.stringify(profile);
    cookieStore.set("df_profile", profileJson, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1800,
      path: "/",
    });

    return NextResponse.redirect(`${BASE_URL}/dashboard?dossier=loaded`);
  } catch (err) {
    console.error("[DossierFacile Connect] Unexpected error:", err);
    return NextResponse.redirect(`${BASE_URL}/dashboard?dossier=error&reason=unexpected`);
  }
}
