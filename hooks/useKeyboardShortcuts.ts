"use client";
import { useEffect } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const modKey = shortcut.meta || shortcut.ctrl;
        const modPressed = e.metaKey || e.ctrlKey;

        if (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (!modKey || modPressed) &&
          (!shortcut.shift || e.shiftKey)
        ) {
          if (isInput && modKey) {
            e.preventDefault();
            shortcut.handler();
            return;
          }
          if (!isInput) {
            e.preventDefault();
            shortcut.handler();
            return;
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}
