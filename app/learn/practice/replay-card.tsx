import Link from "next/link";
import { formatMegabytes, PRACTICE_REPLAYS } from "@/app/lib/practice-replays";

export function PracticeReplayCollection() {
  return (
    <section className="practice-replay-collection" aria-labelledby="practice-replay-title">
      <div className="practice-replay-heading">
        <div>
          <p className="member-kicker">The Second Seat · Practice library</p>
          <h2 id="practice-replay-title">Mock interview replays.</h2>
          <p>Review a real supplied replay after your own attempt. These recordings are practice evidence, not teaching lessons or scored sessions.</p>
        </div>
        <span>{PRACTICE_REPLAYS.length.toString().padStart(2, "0")} replays</span>
      </div>

      <div className="practice-replay-list">
        {PRACTICE_REPLAYS.map((replay, index) => (
          <article className="practice-replay-card" key={replay.slug}>
            <div className="practice-replay-card-index"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
            <div className="practice-replay-card-copy">
              <small>{replay.category} · {replay.kind}</small>
              <h3>{replay.title}</h3>
              <p>{replay.description}</p>
              <div className="practice-replay-tags"><span>{replay.collection}</span><span>{formatMegabytes(replay.sourceBytes)}</span><span>Original MP4</span></div>
            </div>
            <div className="practice-replay-card-action">
              <span>Access · {replay.accessTier}</span>
              <Link className="member-action-button" href={`/learn/practice/replays/${replay.slug}`}>Open replay <span aria-hidden="true">↗</span></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
