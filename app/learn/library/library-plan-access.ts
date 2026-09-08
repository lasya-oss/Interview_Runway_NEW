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
 * Library access is cumulative even when an upstream access list contains
 * only the highest entitled plan.
 */
export function entitledLibraryPlans(
  profileId: DemoTier,
  availablePlans: readonly DemoTier[] = [],
): DemoTier[] {
  const candidates = availablePlans.length ? availablePlans : [profileId];
  const highestPlan = candidates.reduce<DemoTier>(
    (highest, plan) => LIBRARY_PLAN_RANK[plan] > LIBRARY_PLAN_RANK[highest] ? plan : highest,
    "foundation",
  );
  const highestRank = LIBRARY_PLAN_RANK[highestPlan];
  return LIBRARY_PLAN_ORDER.filter((plan) => LIBRARY_PLAN_RANK[plan] <= highestRank);
}
