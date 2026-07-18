import type { Metadata } from "next";
import { PageShell } from "@/app/components/site-chrome";
import { DemoLoginClient } from "./demo-login-client";

export const metadata: Metadata = {
  title: "Explore the learner workspace",
  description: "Enter one of three sample InterviewRunway learner workspaces: Vault, AI Prep, or Premium coaching.",
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
            <p className="eyebrow">Member product preview</p>
            <h1 id="demo-login-title">Don’t imagine the product. <em>Enter it.</em></h1>
            <p>Choose a learner at a different point in the preparation system. The library, plan, practice data, feedback, and coaching access change with the account.</p>
            <div className="demo-login-principles">
              <span><b>01</b> One shared learning product</span>
              <span><b>02</b> Access changes by entitlement</span>
              <span><b>03</b> Realistic sample progress</span>
            </div>
          </div>
          <DemoLoginClient returnTo={returnTo} />
        </div>
      </section>
    </PageShell>
  );
}
