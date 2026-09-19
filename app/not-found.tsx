import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink, PageHero, PageShell } from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you asked for does not exist. Return home or open your InterviewRunway workspace.",
  robots: { follow: false, index: false },
};

export default function NotFound() {
  return (
    <PageShell>
      <PageHero
        eyebrow="404 · PAGE NOT FOUND"
        title="This runway doesn't exist."
        body="The page you asked for moved or never took off. Head back home, or open your workspace to keep building signal."
      >
        <div className="hero-actions">
          <CtaLink href="/">Back to homepage</CtaLink>
          <Link className="text-link" href="/learn">Open workspace <span aria-hidden="true">→</span></Link>
        </div>
      </PageHero>
    </PageShell>
  );
}
