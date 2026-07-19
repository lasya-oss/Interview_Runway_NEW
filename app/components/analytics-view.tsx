"use client";

import { useEffect, useRef } from "react";
import { trackEvent, type AnalyticsEvent, type AnalyticsPayload } from "@/app/lib/analytics";

export function AnalyticsView({ event, payload = {} }: { event: AnalyticsEvent; payload?: AnalyticsPayload }) {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      trackEvent(event, payload);
      observer.disconnect();
    }, { threshold: 0.65 });
    observer.observe(marker);
    return () => observer.disconnect();
  }, [event, payload]);

  return <span className="analytics-view-marker" ref={markerRef} aria-hidden="true" />;
}
