export const ANALYTICS_EVENTS = [
  "hero_signal_cta_clicked",
  "diagnostic_started",
  "diagnostic_completed",
  "signal_report_shared",
  "demo_tier_selected",
  "demo_action_completed",
  "pricing_tier_viewed",
  "checkout_started",
  "checkout_completed",
  "practice_first_session_completed",
  "mock_score_recorded",
  "learner_story_consent_captured",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const detail = { event, ...payload };
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer ??= [];
  analyticsWindow.dataLayer.push(detail);
  window.dispatchEvent(new CustomEvent("interviewrunway:analytics", { detail }));
}
