import type { Metadata } from "next";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WhatsApp Support | Learner workspace",
  robots: { index: false, follow: false },
};

const SUPPORT_TOPICS = [
  {
    title: "Using Interview Runway",
    detail: "Find the right workspace, learning material, practice flow, or feedback step for what you need to do next.",
  },
  {
    title: "Meeting Copilot guidance",
    detail: "Understand how to prepare, when to use the companion, and how its outputs support your next action.",
  },
  {
    title: "Plugins and Plugin Core",
    detail: "Clarify which available plugin supports a task and where it fits into your Interview Runway workflow.",
  },
  {
    title: "Feature-related questions",
    detail: "Learn what a feature does, where to find it, and the most useful way to apply it.",
  },
  {
    title: "Troubleshooting and usage issues",
    detail: "Get practical product guidance when a page, workflow, or expected action is unclear.",
  },
  {
    title: "General product guidance",
    detail: "Ask where to begin, how the parts work together, or what a sensible next step looks like for your goal.",
  },
] as const;

export default async function WhatsAppSupportPage() {
  const profile = await requireDemoProfile("/learn/whatsapp-support");

  if (!profile.access.practice) {
    return (
      <div className="member-page">
        <LockedMemberPanel
          tier="The Second Seat"
          title="WhatsApp Support is part of the Second Seat."
          body="WhatsApp Support is available to learners with active Second Seat access."
        />
      </div>
    );
  }

  return (
    <div className="member-page whatsapp-support-page">
      <section className="whatsapp-support-hero" aria-labelledby="whatsapp-support-title">
        <div className="whatsapp-support-copy">
          <div className="whatsapp-support-meta">
            <p className="member-kicker">Second Seat · product support</p>
            <span className="whatsapp-support-state"><i /> Coming soon</span>
          </div>
          <h1 id="whatsapp-support-title">WhatsApp Support</h1>
          <p className="whatsapp-support-question">Need help using Interview Runway?</p>
          <p className="whatsapp-support-description">
            Get support from the Vivid Labs team when you need help using Meeting Copilot,
            plugins, or any part of your Interview Runway experience.
          </p>
        </div>

        <aside className="whatsapp-support-availability" aria-label="WhatsApp Support availability">
          <div className="whatsapp-support-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">
              <path d="M10 25v-3a14 14 0 0 1 28 0v3" />
              <path d="M10 24h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-1a3 3 0 0 1-3-3V24Z" />
              <path d="M38 24h-4a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3V24Z" />
              <path d="M38 36v1a5 5 0 0 1-5 5h-5" />
              <circle cx="25" cy="42" r="2" />
              <path d="M20 29c1.2 1.5 2.5 2.2 4 2.2s2.8-.7 4-2.2" />
            </svg>
          </div>
          <span>Support channel</span>
          <strong>In preparation</strong>
          <p>WhatsApp Support is being prepared and will be available soon.</p>
        </aside>
      </section>

      <section className="whatsapp-support-topics" aria-labelledby="whatsapp-support-topics-title">
        <header>
          <p className="member-kicker">Support topics</p>
          <h2 id="whatsapp-support-topics-title">Guidance for the moments that slow you down.</h2>
        </header>
        <ul>
          {SUPPORT_TOPICS.map((topic, index) => (
            <li key={topic.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{topic.title}</h3>
                <p>{topic.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <footer>
          <span>What happens next</span>
          <p>Once ready, this page will provide the verified way to start a support conversation. No setup is required today.</p>
        </footer>
      </section>
    </div>
  );
}
