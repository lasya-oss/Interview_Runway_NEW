import type { DemoTier } from "@/app/lib/demo-data";

export const LIBRARY_PLAN_ORDER: readonly DemoTier[] = [
  "foundation",
  "practice",
  "premium",
];

const LIBRARY_PLAN_RANK: Readonly<Record<DemoTier, number>> = {
  foundation: 0,
  practice: 1,
  premium: 2,
};

/**
 * Library access is cumulative up to the active plan. The upstream access
 * list remains a server-side ceiling so a stale profile cannot unlock more
 * than the account is entitled to use.
 */
export function entitledLibraryPlans(
  profileId: DemoTier,
  availablePlans: readonly DemoTier[] = [],
): DemoTier[] {
  const candidates = availablePlans.length ? availablePlans : [profileId];
  const highestAvailablePlan = candidates.reduce<DemoTier>(
    (highest, plan) => LIBRARY_PLAN_RANK[plan] > LIBRARY_PLAN_RANK[highest] ? plan : highest,
    "foundation",
  );
  const highestRank = Math.min(
    LIBRARY_PLAN_RANK[profileId],
    LIBRARY_PLAN_RANK[highestAvailablePlan],
  );
  return LIBRARY_PLAN_ORDER.filter((plan) => LIBRARY_PLAN_RANK[plan] <= highestRank);
}
