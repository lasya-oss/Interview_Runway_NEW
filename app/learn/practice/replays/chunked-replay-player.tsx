"use client";

import { useEffect, useState } from "react";

type ReplayState = "loading" | "ready" | "error";

export function ChunkedReplayPlayer({
  parts,
  title,
}: {
  parts: readonly string[];
  title: string;
}) {
  const [source, setSource] = useState<string | null>(null);
  const [state, setState] = useState<ReplayState>("loading");
  const [message, setMessage] = useState("Loading the original replay…");
  const partKey = parts.join("|");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let objectUrl: string | null = null;

    const loadReplay = async () => {
      try {
        const chunks = await Promise.all(
          parts.map(async (part) => {
            const response = await fetch(part, {
              signal: controller.signal,
              cache: "force-cache",
            });
            if (!response.ok) throw new Error("The replay could not be loaded.");
            return response.blob();
          }),
        );
        if (!active) return;

        objectUrl = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
        setSource(objectUrl);
        setState("ready");
        setMessage("");
      } catch (error) {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "The replay could not be loaded.");
      }
    };

    void loadReplay();

    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [partKey, parts]);

  if (source) {
    return <video aria-label={`${title} video`} controls playsInline preload="metadata" src={source} />;
  }

  return (
    <div
      className="practice-replay-video-state"
      data-replay-part-count={parts.length}
      aria-live="polite"
      aria-busy={state === "loading"}
    >
      <span aria-hidden="true">{state === "loading" ? "···" : "!"}</span>
      <p>{message}</p>
    </div>
  );
}
