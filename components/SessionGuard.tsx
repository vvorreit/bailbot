"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * Déconnecte automatiquement l'utilisateur si son token a été invalidé
 * (ex: changement de mot de passe depuis un autre appareil).
 */
export default function SessionGuard() {
  const { data: session } = useSession();

  useEffect(() => {
    const error = (session as any)?.error;
    if (error === "SessionInvalidated" || error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/auth/signin" });
    }
  }, [session]);

  return null;
}
