"use client";

import { useEffect, useRef, useState } from "react";

type ReplayPlayerState = "loading" | "ready" | "buffering" | "error";

export function ChunkedReplayVideo({
  partCount,
  source,
  title,
}: {
  partCount: number;
  source: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerState, setPlayerState] = useState<ReplayPlayerState>("loading");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncReadyState = window.requestAnimationFrame(() => {
      if (video.error) {
        setPlayerState("error");
      } else if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        setPlayerState("ready");
      }
    });

    return () => window.cancelAnimationFrame(syncReadyState);
  }, [source]);

  const retryPlayback = () => {
    setPlayerState("loading");
    videoRef.current?.load();
  };

  const showBufferingState = () => {
    const video = videoRef.current;

    if (!video || video.error) return;

    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      setPlayerState("loading");
    } else if (!video.paused && !video.ended) {
      setPlayerState("buffering");
    }
  };

  return (
    <div
      aria-busy={playerState === "loading" || playerState === "buffering"}
      style={{ display: "grid", height: "100%", width: "100%" }}
    >
      <video
        ref={videoRef}
        aria-label={`${title} video`}
        controls
        data-replay-part-count={partCount}
        onCanPlay={() => setPlayerState("ready")}
        onEnded={() => setPlayerState("ready")}
        onError={() => setPlayerState("error")}
        onLoadedMetadata={() => setPlayerState("ready")}
        onLoadStart={() => setPlayerState("loading")}
        onPause={() => setPlayerState((state) => (state === "buffering" ? "ready" : state))}
        onPlaying={() => setPlayerState("ready")}
        onStalled={showBufferingState}
        onWaiting={showBufferingState}
        playsInline
        preload="metadata"
        src={source}
        style={{ gridArea: "1 / 1" }}
      />

      {playerState !== "ready" ? (
        <div
          className="practice-replay-video-state"
          role={playerState === "error" ? "alert" : "status"}
          style={{
            alignContent: "normal",
            alignItems: "center",
            alignSelf: "start",
            background: playerState === "buffering" ? "rgba(2, 10, 15, 0.78)" : "#020a0f",
            border: "1px solid rgba(208, 225, 232, 0.2)",
            borderRadius: 10,
            gap: 10,
            gridArea: "1 / 1",
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            height: "auto",
            justifyItems: "start",
            justifySelf: "center",
            margin: 12,
            minHeight: 0,
            padding: "10px 12px",
            pointerEvents: playerState === "buffering" ? "none" : "auto",
            textAlign: "left",
            width: "min(520px, calc(100% - 24px))",
            zIndex: 1,
          }}
        >
          <span aria-hidden="true">{playerState === "error" ? "!" : "??????"}</span>
          <p>
            {playerState === "loading"
              ? "Loading replay and video details???"
              : playerState === "buffering"
                ? "Buffering replay??? Playback will resume automatically."
                : "The replay could not be loaded. Check your connection and try again."}
          </p>
          {playerState === "loading" || playerState === "error" ? (
            <button type="button" onClick={retryPlayback}>
              Retry replay <span aria-hidden="true">???</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
