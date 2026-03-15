"use client";
import { useEffect, useRef, useCallback } from "react";

export function useAutoSave<T>(
  key: string,
  data: T,
  debounceMs = 2000
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const save = useCallback(() => {
    try {
      const serialized = JSON.stringify(data);
      if (serialized !== lastSavedRef.current) {
        localStorage.setItem(`autosave:${key}`, serialized);
        localStorage.setItem(`autosave:${key}:ts`, Date.now().toString());
        lastSavedRef.current = serialized;
      }
    } catch {
      /* quota exceeded or private browsing */
    }
  }, [key, data]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(save, debounceMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [save, debounceMs]);

  return { saveNow: save };
}

export function loadAutoSave<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`autosave:${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearAutoSave(key: string) {
  localStorage.removeItem(`autosave:${key}`);
  localStorage.removeItem(`autosave:${key}:ts`);
}
