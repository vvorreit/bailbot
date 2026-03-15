// ─── BailBot — Hook Raccourcis Clavier ────────────────────────────────────────

import { useEffect } from "react";

/**
 * Enregistre des raccourcis clavier.
 * Format des touches : 'mod+k', 'mod+shift+e', '?', etc.
 * 'mod' = Ctrl (Windows/Linux) ou Cmd (macOS).
 */
export function useShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore si on est dans un input/textarea/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        // Exception : Mod+K peut fonctionner partout pour focus la recherche
        const key = buildKey(e);
        if (key !== "mod+k") return;
      }

      const key = buildKey(e);
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

function buildKey(e: KeyboardEvent): string {
  return [
    e.ctrlKey || e.metaKey ? "mod" : "",
    e.shiftKey ? "shift" : "",
    e.key.toLowerCase(),
  ]
    .filter(Boolean)
    .join("+");
}
