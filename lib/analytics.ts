type AnalyticsEvent =
  | "page_view"
  | "dossier_created"
  | "bail_generated"
  | "ocr_used"
  | "payment_recorded"
  | "quittance_generated"
  | "search_used"
  | "onboarding_completed"
  | "error_boundary";

interface PostHogLike {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  opt_in_capturing: () => void;
  opt_out_capturing: () => void;
  has_opted_in_capturing: () => boolean;
}

let posthogInstance: PostHogLike | null = null;

const CONSENT_KEY = "bailbot_analytics_consent";

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "granted";
}

export function grantAnalyticsConsent() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, "granted");
  initPostHog();
}

export function revokeAnalyticsConsent() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, "denied");
  posthogInstance?.opt_out_capturing();
  posthogInstance = null;
}

async function initPostHog() {
  if (posthogInstance) return posthogInstance;
  if (!hasAnalyticsConsent()) return null;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return null;

  try {
    const { default: posthog } = await import("posthog-js");
    posthog.init(key, {
      api_host: host,
      persistence: "localStorage",
      autocapture: false,
      capture_pageview: false,
      opt_out_capturing_by_default: true,
      respect_dnt: true,
    });
    posthog.opt_in_capturing();
    posthogInstance = posthog;
    return posthog;
  } catch {
    return null;
  }
}

export async function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
) {
  if (!hasAnalyticsConsent()) return;
  const ph = await initPostHog();
  ph?.capture(event, properties);
}

export async function trackPageView(url: string) {
  await trackEvent("page_view", { url });
}
