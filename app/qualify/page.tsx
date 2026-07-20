import type { Metadata } from "next";
import Link from "next/link";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { PageShell } from "@/app/components/site-chrome";
import { QualificationForm } from "./qualification-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Check Phase 3 qualification",
  description: "Apply for evidence-led Human Calibration after completing InterviewRunway Foundation and the Second Seat.",
  alternates: { canonical: "/qualify" },
};

export default async function QualificationPage() {
  const user = await getChatGPTUser();

  return (
    <PageShell>
      <div className="qualification-page">
        <section className="qualification-hero" aria-labelledby="qualification-title">
          <div className="qualification-hero__field" aria-hidden="true"><i /><i /><i /><span>03</span></div>
          <div className="container qualification-hero__layout">
            <div>
              <p className="eyebrow">PHASE 03 · HUMAN CALIBRATION</p>
              <h1 id="qualification-title">Human time begins with <em>evidence.</em></h1>
              <p>Phase 3 is not a public checkout. It is reserved for learners who completed the earlier work and can show a persistent gap that AI practice and expert WhatsApp guidance did not resolve.</p>
            </div>
            <aside aria-label="Phase 3 admission path">
              <span>ENTRY CONDITION</span>
              <ol>
                <li><b>01</b><p><strong>Foundation complete</strong><small>A working interview baseline exists.</small></p></li>
                <li><b>02</b><p><strong>Second Seat evidence</strong><small>Repeated practice exposes the same gap.</small></p></li>
                <li><b>03</b><p><strong>Human judgment earns a job</strong><small>Scope and availability are reviewed before a quote.</small></p></li>
              </ol>
            </aside>
          </div>
        </section>

        <section className="qualification-application" aria-labelledby="qualification-form-title">
          <div className="container qualification-application__layout">
            <header>
              <p className="eyebrow">QUALIFICATION CHECK</p>
              <h2 id="qualification-form-title">Connect your record. Name the remaining gap.</h2>
              <p>We review the learning sequence, the WhatsApp support context, and the evidence behind your request. If Phase 3 is appropriate, you receive the proposed scope and quote before deciding anything.</p>
              <Link className="text-link" href="/premium">Review how Human Calibration works <span aria-hidden="true">→</span></Link>
            </header>
            <QualificationForm defaultEmail={user?.email ?? ""} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
