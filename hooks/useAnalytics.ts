"use client";
import { useCallback } from "react";
import { trackEvent, trackPageView } from "@/lib/analytics";

type AnalyticsEvent =
  | "page_view"
  | "dossier_created"
  | "bail_generated"
  | "ocr_used"
  | "payment_recorded"
  | "quittance_generated"
  | "search_used"
  | "onboarding_completed";

export function useAnalytics() {
  const track = useCallback(
    (event: AnalyticsEvent, properties?: Record<string, unknown>) => {
      trackEvent(event, properties);
    },
    []
  );

  const pageView = useCallback((url: string) => {
    trackPageView(url);
  }, []);

  return { track, pageView };
}
