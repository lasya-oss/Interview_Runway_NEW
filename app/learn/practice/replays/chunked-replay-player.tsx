export function ChunkedReplayPlayer({
  parts,
  title,
}: {
  parts: readonly string[];
  title: string;
}) {
  const relativeSource = parts[0]?.replace(/\.part-\d{2}$/, "") ?? null;
  const configuredAssetOrigin = readReplayAssetOrigin();
  const source = relativeSource && configuredAssetOrigin
    ? new URL(relativeSource, configuredAssetOrigin).toString()
    : relativeSource;

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

function readReplayAssetOrigin() {
  const value = process.env.REPLAY_ASSET_ORIGIN?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? `${url.origin}/` : null;
  } catch {
    return null;
  }
}
