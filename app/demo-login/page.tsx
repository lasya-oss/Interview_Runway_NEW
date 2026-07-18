import type { Metadata } from "next";
import { PageShell } from "@/app/components/site-chrome";
import { DemoLoginClient } from "./demo-login-client";

export const metadata: Metadata = {
  title: "Choose an InterviewRunway demo",
  description: "Choose Vault, AI Prep, or Premium and enter a populated InterviewRunway learner workspace.",
  robots: { index: false, follow: false },
};

export default async function DemoLoginPage({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) {
  const { return_to: requestedReturnTo } = await searchParams;
  const returnTo = requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : "/learn";

  return (
    <PageShell>
      <section className="demo-login-page" aria-labelledby="demo-login-title">
        <div className="demo-login-atmosphere" aria-hidden="true"><i /><i /><span /></div>
        <div className="container demo-login-layout">
          <div className="demo-login-intro">
            <p className="eyebrow">Interactive product demo</p>
            <h1 id="demo-login-title">Choose a layer. <em>Enter the workspace.</em></h1>
            <p>No signup and no empty dashboard. Choose the access level you want to inspect; we will load a fictional learner with realistic progress, unlocked tools, and review-edition material.</p>
            <div className="demo-login-principles">
              <span><b>01</b> Pick Vault, AI Prep, or Premium</span>
              <span><b>02</b> Enter the populated workspace instantly</span>
              <span><b>03</b> Open real sample material inside</span>
            </div>
          </div>
          <DemoLoginClient returnTo={returnTo} />
        </div>
      </section>
    </PageShell>
  );
}
