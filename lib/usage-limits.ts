const USAGE_KEY = "bailbot_usage_count";
const PAID_KEY = "bailbot_paid_plan";
const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_LIMIT ?? 3);

export function getUsageCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(USAGE_KEY) ?? "0", 10);
}

export function incrementUsage(): void {
  if (typeof window === "undefined") return;
  const current = getUsageCount();
  localStorage.setItem(USAGE_KEY, String(current + 1));
}

export function isLimitReached(): boolean {
  if (typeof window === "undefined") return false;
  const hasPaidPlan = localStorage.getItem(PAID_KEY) === "true";
  if (hasPaidPlan) return false;
  return getUsageCount() >= FREE_LIMIT;
}

export function resetUsage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USAGE_KEY);
}

export function setPaidPlan(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(PAID_KEY, "true");
  } else {
    localStorage.removeItem(PAID_KEY);
  }
}
