import type { Metadata } from "next";
import { PageShell } from "@/app/components/site-chrome";
import { DiagnosticClient } from "./diagnostic-client";

export const metadata: Metadata = {
  title: "Interview Signal Check",
  description: "Run a free six-dimension InterviewRunway diagnostic and leave with one concrete next action.",
  alternates: { canonical: "/diagnostic" },
};

export default function DiagnosticPage() {
  return (
    <PageShell>
      <main className="signal-check-page">
        <DiagnosticClient />
      </main>
    </PageShell>
  );
}
