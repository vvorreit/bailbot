/**
 * Feature flags — simple env-based system for critical crons.
 * Default: enabled (true) when the variable is not defined.
 *
 * Usage:
 *   if (!isFeatureEnabled('FEATURE_QUITTANCES_AUTO')) return skip response
 *
 * Override via env vars:
 *   FEATURE_QUITTANCES_AUTO=false  → disabled
 *   FEATURE_QUITTANCES_AUTO=true   → enabled (explicit)
 *   (not set)                      → enabled (default)
 */

export function isFeatureEnabled(flag: string): boolean {
  const value = process.env[flag];
  if (value === undefined || value === "") return true;
  return value === "true";
}

export const FEATURE_FLAGS = [
  "FEATURE_QUITTANCES_AUTO",
  "FEATURE_RAPPELS_IMPAYES",
  "FEATURE_INDEXATION_IRL",
  "FEATURE_RGPD_PURGE",
] as const;

export type FeatureFlagName = (typeof FEATURE_FLAGS)[number];

export function getAllFeatureFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const flag of FEATURE_FLAGS) {
    flags[flag] = isFeatureEnabled(flag);
  }
  return flags;
}
