export function ChunkedReplayPlayer({
  parts,
  title,
}: {
  parts: readonly string[];
  title: string;
}) {
  const source = parts[0]?.replace(/\.part-\d{2}$/, "") ?? null;

  if (!source) {
    return (
      <div className="practice-replay-video-state" aria-live="polite">
        <span aria-hidden="true">!</span>
        <p>The replay could not be loaded.</p>
      </div>
    );
  }

  return (
    <video
      aria-label={`${title} video`}
      controls
      data-replay-part-count={parts.length}
      playsInline
      preload="metadata"
      src={source}
    />
  );
}
