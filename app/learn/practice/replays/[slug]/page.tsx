import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockedMemberPanel, MemberShell } from "@/app/components/member-shell";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { findPracticeReplay, formatMegabytes, getPracticeReplayNumber } from "@/app/lib/practice-replays";
import { findRoadmapTask } from "@/app/lib/roadmap-data";
import { ChunkedReplayPlayer } from "../chunked-replay-player";
import { DriveReplayPlayer } from "../drive-replay-player";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mock replay | Practice workspace",
  robots: { index: false, follow: false },
};

export default async function PracticeReplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const replay = findPracticeReplay(slug);
  if (!replay) notFound();

  const profile = await requireDemoProfile(`/learn/practice/replays/${slug}`);

  if (!profile.access.practice) {
    return (
      <MemberShell profile={profile} active="practice">
        <div className="member-page">
          <LockedMemberPanel
            tier={replay.accessTier}
            title="This replay belongs to the practice layer."
            body="The replay is kept out of the Vault catalogue. Unlock The Second Seat to review mock interview recordings and practice evidence."
          />
        </div>
      </MemberShell>
    );
  }

  const linkedRoadmapTask = replay.roadmapTaskId ? findRoadmapTask(replay.roadmapTaskId) : null;
  const linkedRoadmapHref = linkedRoadmapTask
    ? linkedRoadmapTask.learning.kind === "material"
      ? `/learn/material/${linkedRoadmapTask.learning.slug}`
      : `/learn/roadmap/task/${linkedRoadmapTask.id}`
    : null;
  const linkedRoadmapLabel = linkedRoadmapTask?.learning.kind === "material"
    ? "Open linked learning material"
    : "Open linked roadmap task";
  const replayNumber = getPracticeReplayNumber(replay.slug);
  const workspaceUser = replay.storage === "google-drive-api" ? await getChatGPTUser() : null;
  const isStaticReplay = replay.storage === "static-public" || replay.storage === "static-public-chunked";

  return (
    <MemberShell profile={profile} active="practice">
      <article className="member-page practice-replay-page">
        <nav className="material-breadcrumb" aria-label="Breadcrumb">
          <Link href="/learn/practice">Practice</Link><span>/</span><span>{replay.category}</span><span>/</span><strong>Replay {replayNumber}</strong>
        </nav>

        <header className="practice-replay-header">
          <div>
            <p className="member-kicker">{replay.collection} · {replay.kind}</p>
            <h1>{replay.title}</h1>
            <p>{replay.description}</p>
          </div>
          <dl>
            <div><dt>Access</dt><dd>{replay.accessTier}</dd></div>
            <div><dt>Source</dt><dd>Original MP4</dd></div>
            <div><dt>File</dt><dd>{formatMegabytes(replay.sourceBytes)}</dd></div>
          </dl>
        </header>

        <div className="practice-replay-layout">
          <section className="practice-replay-player" aria-labelledby="practice-replay-player-title">
            <div className="practice-replay-player-top"><span id="practice-replay-player-title">Replay / {replay.category.toLowerCase()} / {replayNumber}</span><b>Source unchanged</b></div>
            <div className="practice-replay-frame">
              {replay.storage === "static-public" && replay.videoPath ? (
                <video aria-label={`${replay.title} video`} controls playsInline preload="metadata" src={replay.videoPath} />
              ) : replay.storage === "static-public-chunked" && replay.videoParts ? (
                <ChunkedReplayPlayer parts={replay.videoParts} title={replay.title} />
              ) : (
                <DriveReplayPlayer
                  clientId={process.env.GOOGLE_CLIENT_ID?.trim() ?? ""}
                  fileId={replay.sourceFileId ?? ""}
                  loginHint={workspaceUser?.email ?? null}
                  title={replay.title}
                />
              )}
            </div>
            <p className="practice-replay-player-note">
              {isStaticReplay
                ? "This original MP4 is served directly by InterviewRunway, so it plays without a Google Drive sign-in or permission prompt. It is not transcoded or edited."
                : "Playback uses your existing InterviewRunway sign-in and a read-only Google Drive permission for this replay. The original MP4 is not transcoded or edited by InterviewRunway."}
            </p>
          </section>

          <aside className="practice-replay-notes">
            <p className="member-kicker">Study objective</p>
            <h2>{replay.objective}</h2>
            <div>
              <span>Replay type</span>
              <p>{replay.kind}. Pause before each next turn and write down the decision or explanation you would give.</p>
            </div>
            <div>
              <span>Transcript / captions</span>
              <p>{replay.transcript}. No transcript is presented as available until one has been produced and reviewed.</p>
            </div>
          </aside>
        </div>

        <footer className="practice-replay-next-step">
          <div>
            <p className="member-kicker">Connected practice</p>
            <h2>Use the replay to sharpen the {replay.category.toLowerCase()} signal.</h2>
            <p>{linkedRoadmapTask ? `This replay supplements “${linkedRoadmapTask.title}”; it does not replace the task’s learning brief or mark it complete.` : "This replay is a practice supplement and does not mark a roadmap task complete."}</p>
          </div>
          <div className="practice-replay-next-actions">
            {linkedRoadmapHref ? <Link className="member-primary-button" href={linkedRoadmapHref}>{linkedRoadmapLabel} <span aria-hidden="true">↗</span></Link> : null}
            <Link href="/learn/practice">Back to Practice</Link>
          </div>
        </footer>
      </article>
    </MemberShell>
  );
}
