"use client";
import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

let globalSetToasts: React.Dispatch<React.SetStateAction<Toast[]>> | null = null;
let toastCounter = 0;

export function addToast(type: ToastType, message: string, duration = 4000) {
  const id = `toast-${++toastCounter}-${Date.now()}`;
  const toast: Toast = { id, type, message, duration };
  globalSetToasts?.((prev) => [...prev, toast]);
  if (duration > 0) {
    setTimeout(() => {
      globalSetToasts?.((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }
  return id;
}

export function dismissToast(id: string) {
  globalSetToasts?.((prev) => prev.filter((t) => t.id !== id));
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  globalSetToasts = setToasts;

  const toast = useCallback((type: ToastType, message: string, duration = 4000) => {
    return addToast(type, message, duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  return { toasts, toast, dismiss };
}
