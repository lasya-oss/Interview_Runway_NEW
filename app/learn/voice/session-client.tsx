"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GeminiLiveVoiceProvider } from "@/app/lib/voice-providers/gemini-live";
import type { VoiceProviderCredential, VoiceTranscriptEvent, VoiceToolRequest } from "@/app/lib/voice-provider";
import type { VoiceSession, VoiceTurn } from "@/app/lib/voice-session-store";

type LocalTurn = VoiceTurn & { latencyMs?: number };
type Phase = "consent" | "connecting" | "live" | "reconnecting" | "ending" | "error";

export function VoiceSessionClient({ session }: { session: VoiceSession }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("consent");
  const [microphoneConsent, setMicrophoneConsent] = useState(Boolean(session.consentAt));
  const [retainAudio, setRetainAudio] = useState(session.audioRetentionApproved);
  const [turns, setTurns] = useState<LocalTurn[]>(() => [...(session.turns ?? [])]);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => session.startedAt ? Math.max(0, Math.floor((Date.now() - Date.parse(session.startedAt)) / 1_000)) : 0);
  const [error, setError] = useState("");
  const [audioWarning, setAudioWarning] = useState("");
  const [latencies, setLatencies] = useState<number[]>([]);
  const providerRef = useRef<GeminiLiveVoiceProvider | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderStopRef = useRef<Promise<void> | null>(null);
  const mixDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const scheduledSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextPlaybackAtRef = useRef(0);
  const currentTurnRef = useRef<Record<"candidate" | "interviewer", LocalTurn | null>>({ candidate: null, interviewer: null });
  const turnsRef = useRef<LocalTurn[]>([...(session.turns ?? [])]);
  const micSamplesRef = useRef<number[]>([]);
  const uploadChainRef = useRef<Promise<void>>(Promise.resolve());
  const audioSequenceRef = useRef(0);
  const latestLatencyRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    if (phase !== "live" && phase !== "reconnecting") return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((value) => {
        const next = value + 1;
        if (next >= 30 * 60) void endSession();
        return next;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  // endSession intentionally reads mutable refs and should not restart this timer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "live" && phase !== "reconnecting") return;
    const timer = window.setInterval(() => void persistTurns(), 4_000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => cleanupMedia(), []);

  async function startSession() {
    if (!microphoneConsent) return;
    setError("");
    setPhase("connecting");
    try {
      const consentResponse = await fetch(`/api/voice/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ microphoneConsent: true, retainAudio }),
      });
      if (!consentResponse.ok) throw new Error(await responseError(consentResponse, "Consent could not be saved"));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      mediaStreamRef.current = stream;
      const context = new AudioContext({ latencyHint: "interactive" });
      audioContextRef.current = context;
      await context.audioWorklet.addModule("/voice-pcm-worklet.js");
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(context, "interview-runway-pcm");
      workletRef.current = worklet;
      const silent = context.createGain();
      silent.gain.value = 0;
      source.connect(worklet).connect(silent).connect(context.destination);
      worklet.port.onmessage = (event: MessageEvent<Float32Array>) => handleMicSamples(event.data, context.sampleRate);

      if (retainAudio) setupRecorder(context, source);

      const tokenResponse = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const tokenBody = await tokenResponse.json() as { credential?: VoiceProviderCredential; error?: string };
      if (!tokenResponse.ok || !tokenBody.credential) throw new Error(tokenBody.error || "Voice provider is unavailable");

      const provider = new GeminiLiveVoiceProvider();
      providerRef.current = provider;
      provider.onTranscript(handleTranscript);
      provider.onToolCall(runTool);
      provider.onAudio(playAudio);
      provider.onInterrupted(stopPlayback);
      provider.onLatency((milliseconds) => {
        latestLatencyRef.current = milliseconds;
        const interviewer = currentTurnRef.current.interviewer;
        if (interviewer && interviewer.latencyMs === undefined) {
          interviewer.latencyMs = milliseconds;
          latestLatencyRef.current = undefined;
          setTurns([...turnsRef.current]);
        }
        setLatencies((values) => [...values.slice(-29), milliseconds]);
      });
      provider.onStatus((status) => {
        if (status === "reconnecting") setPhase("reconnecting");
        if (status === "connected") setPhase("live");
        if (status === "disconnected") {
          setError("The live connection dropped. Your transcript is safe; reconnect to continue or end for a report.");
          setPhase("error");
        }
      });
      await provider.connect(tokenBody.credential);
      recorderRef.current?.start(5_000);
      setPhase("live");
    } catch (caught) {
      cleanupMedia();
      setError(microphoneError(caught));
      setPhase("error");
    }
  }

  function setupRecorder(context: AudioContext, microphone: MediaStreamAudioSourceNode) {
    if (typeof MediaRecorder === "undefined") throw new Error("This browser cannot retain session audio");
    const destination = context.createMediaStreamDestination();
    mixDestinationRef.current = destination;
    microphone.connect(destination);
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error("This browser cannot retain session audio");
    const recorder = new MediaRecorder(destination.stream, { mimeType, audioBitsPerSecond: 64_000 });
    recorder.ondataavailable = (event) => {
      if (!event.data.size) return;
      const sequence = audioSequenceRef.current++;
      uploadChainRef.current = uploadChainRef.current
        .then(async () => {
          const response = await fetch(`/api/voice/sessions/${session.id}/audio?sequence=${sequence}`, {
            method: "PUT",
            headers: { "Content-Type": event.data.type || mimeType },
            body: event.data,
          });
          if (!response.ok) throw new Error("approved audio upload failed");
        })
        .catch(() => {
          setAudioWarning("One approved audio segment could not be retained. The transcript and report will still complete.");
        });
    };
    recorderRef.current = recorder;
  }

  function handleMicSamples(samples: Float32Array, sourceRate: number) {
    if (phase === "ending") return;
    const pending = micSamplesRef.current;
    for (const sample of samples) pending.push(sample);
    const frameSize = Math.max(1, Math.round(sourceRate * 0.04));
    while (pending.length >= frameSize) {
      const frame = new Float32Array(pending.splice(0, frameSize));
      providerRef.current?.sendAudio(floatToPcm16(resample(frame, sourceRate, 16_000)));
    }
  }

  function handleTranscript(event: VoiceTranscriptEvent) {
    const current = currentTurnRef.current[event.speaker];
    if (event.final) {
      if (current) {
        current.endedAt = event.at;
        currentTurnRef.current[event.speaker] = null;
        setTurns([...turnsRef.current]);
      }
      return;
    }
    const next = current ?? {
      id: crypto.randomUUID(),
      speaker: event.speaker,
      text: "",
      startedAt: event.at,
      endedAt: event.at,
      toolCalls: [],
      ...(event.speaker === "interviewer" && latestLatencyRef.current !== undefined
        ? { latencyMs: latestLatencyRef.current }
        : {}),
    } satisfies LocalTurn;
    if (!current && event.speaker === "interviewer") latestLatencyRef.current = undefined;
    next.text = mergeTranscript(next.text, event.text);
    next.endedAt = event.at;
    if (!current) {
      currentTurnRef.current[event.speaker] = next;
      const updated = [...turnsRef.current, next];
      turnsRef.current = updated;
      setTurns(updated);
    } else {
      setTurns([...turnsRef.current]);
    }
  }

  async function runTool(request: VoiceToolRequest) {
    const response = await fetch(`/api/voice/sessions/${session.id}/tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: request.id, name: request.name, arguments: request.arguments }),
    });
    const body = await response.json() as { result?: Record<string, unknown>; scheduling?: string; error?: string };
    if (!response.ok || !body.result) return { error: body.error || "Lookup failed", scheduling: "WHEN_IDLE" };
    return { result: body.result, scheduling: body.scheduling ?? "WHEN_IDLE" };
  }

  function playAudio(base64: string) {
    const context = audioContextRef.current;
    if (!context) return;
    const bytes = base64ToBytes(base64);
    const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const buffer = context.createBuffer(1, samples.length, 24_000);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) channel[index] = samples[index] / 0x8000;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    if (mixDestinationRef.current) source.connect(mixDestinationRef.current);
    const startAt = Math.max(context.currentTime + 0.02, nextPlaybackAtRef.current);
    nextPlaybackAtRef.current = startAt + buffer.duration;
    scheduledSourcesRef.current.add(source);
    source.onended = () => scheduledSourcesRef.current.delete(source);
    source.start(startAt);
  }

  function stopPlayback() {
    for (const source of scheduledSourcesRef.current) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    scheduledSourcesRef.current.clear();
    nextPlaybackAtRef.current = audioContextRef.current?.currentTime ?? 0;
  }

  async function persistTurns() {
    const snapshot = turnsRef.current.filter((turn) => turn.text.trim()).map((turn) => ({
      id: turn.id,
      speaker: turn.speaker,
      text: turn.text,
      startedAt: turn.startedAt,
      endedAt: turn.endedAt,
      ...(turn.latencyMs === undefined ? {} : { latencyMs: turn.latencyMs }),
    }));
    if (!snapshot.length) return;
    const response = await fetch(`/api/voice/sessions/${session.id}/turns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turns: snapshot }),
    });
    if (!response.ok) console.warn("Voice transcript checkpoint failed");
  }

  async function stopRecorder() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorderStopRef.current = new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
    });
    recorder.stop();
    await recorderStopRef.current;
    await uploadChainRef.current;
  }

  async function endSession() {
    if (phase === "ending") return;
    setPhase("ending");
    setError("");
    try {
      await persistTurns();
      await stopRecorder();
      providerRef.current?.end();
      const response = await fetch(`/api/voice/sessions/${session.id}/close`, { method: "POST" });
      if (!response.ok) throw new Error(await responseError(response, "Session could not be closed"));
      cleanupMedia();
      router.push(`/learn/voice/${session.id}/report`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Session could not be closed");
      setPhase("error");
    }
  }

  async function reconnectSession() {
    setError("");
    try {
      await stopRecorder();
    } catch {
      setAudioWarning("The final approved audio segment could not be retained. The transcript is safe.");
    }
    cleanupMedia();
    await startSession();
  }

  function cleanupMedia() {
    providerRef.current?.end();
    providerRef.current = null;
    workletRef.current?.disconnect();
    workletRef.current = null;
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    recorderRef.current = null;
    for (const track of mediaStreamRef.current?.getTracks() ?? []) track.stop();
    mediaStreamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
  }

  const remainingSeconds = Math.max(0, 30 * 60 - elapsedSeconds);
  const latency = percentileSummary(latencies);

  if (phase === "consent") {
    return (
      <section className="voice-consent-card">
        <p className="member-kicker">Mic check + consent</p>
        <h1>Before the interviewer joins.</h1>
        <p>Your microphone streams directly from this browser to Google Gemini Live. Interview Runway stores the transcript and score until you delete the session.</p>
        <label><input type="checkbox" checked={microphoneConsent} onChange={(event) => setMicrophoneConsent(event.target.checked)} /><span><strong>I allow microphone access for this 30-minute session.</strong><small>Interruptions are supported; there is no push-to-talk.</small></span></label>
        <label><input type="checkbox" checked={retainAudio} onChange={(event) => setRetainAudio(event.target.checked)} /><span><strong>Keep a private audio recording in Interview Runway.</strong><small>Optional. Approved audio is stored in R2 until you delete the session. Opting out still keeps transcript and scores.</small></span></label>
        <p className="voice-privacy-note">Interview Runway does not use session content for model training. Google-generated audio may carry SynthID.</p>
        <button className="member-primary-button" type="button" disabled={!microphoneConsent} onClick={startSession}>Allow mic and start ↗</button>
        <Link href="/learn/voice">Cancel</Link>
      </section>
    );
  }

  return (
    <section className="voice-live-room" data-phase={phase}>
      <header>
        <div><p className="member-kicker">Live voice mock</p><h1>{session.interviewType === "behavioral" ? "Behavioral / STAR" : "Role-specific Q&A"}</h1></div>
        <div className="voice-live-clock"><i /><strong>{formatClock(remainingSeconds)}</strong><small>{phase === "reconnecting" ? "reconnecting" : phase}</small></div>
      </header>
      <div className="voice-live-grid">
        <div className="voice-stage">
          <div className="voice-orb" aria-hidden="true"><i /><i /><span /></div>
          <strong>{phase === "connecting" ? "Connecting interviewer…" : phase === "reconnecting" ? "Restoring the conversation…" : phase === "ending" ? "Saving your interview…" : "Listening · interrupt any time"}</strong>
          <p>{session.persona === "hiring_manager" ? "Hiring manager" : "Peer engineer"} · English · direct browser audio</p>
          {latency.count ? <small>Observed turn latency · p50 {latency.p50} ms · p95 {latency.p95} ms · n={latency.count}</small> : <small>Turn latency appears after the first answer.</small>}
          {audioWarning ? <small className="voice-audio-warning">{audioWarning}</small> : null}
          <button type="button" className="voice-end-button" disabled={phase === "connecting" || phase === "ending"} onClick={endSession}>End interview and score</button>
        </div>
        <div className="voice-transcript" aria-live="polite">
          <div className="member-panel-label"><span>Live transcript</span><b>CHECKPOINTS EVERY 4 SEC</b></div>
          <div>
            {turns.length ? turns.map((turn) => (
              <article key={turn.id} data-speaker={turn.speaker}>
                <span>{turn.speaker === "candidate" ? "You" : "Interviewer"}</span>
                <p>{turn.text}</p>
                {turn.latencyMs !== undefined ? <small>{turn.latencyMs} ms response</small> : null}
              </article>
            )) : <p className="voice-transcript-empty">The first question will appear here.</p>}
          </div>
        </div>
      </div>
      {error ? <div className="voice-error" role="alert"><p>{error}</p><button type="button" onClick={reconnectSession}>Reconnect</button><button type="button" onClick={endSession}>End and score saved transcript</button></div> : null}
    </section>
  );
}

function mergeTranscript(current: string, incoming: string) {
  const clean = incoming.trim();
  if (!current) return clean;
  if (clean.startsWith(current)) return clean;
  if (current.endsWith(clean)) return current;
  return `${current} ${clean}`.replace(/\s+/g, " ").trim();
}

function resample(input: Float32Array, sourceRate: number, targetRate: number) {
  if (sourceRate === targetRate) return input;
  const ratio = sourceRate / targetRate;
  const length = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const start = Math.floor(index * ratio);
    const end = Math.min(input.length, Math.max(start + 1, Math.floor((index + 1) * ratio)));
    let sum = 0;
    for (let source = start; source < end; source += 1) sum += input[source];
    output[index] = sum / (end - start);
  }
  return output;
}

function floatToPcm16(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]));
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function formatClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function percentileSummary(values: readonly number[]) {
  if (!values.length) return { count: 0, p50: 0, p95: 0 };
  const ordered = [...values].sort((left, right) => left - right);
  return {
    count: ordered.length,
    p50: ordered[Math.ceil(ordered.length * 0.5) - 1],
    p95: ordered[Math.ceil(ordered.length * 0.95) - 1],
  };
}

async function responseError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : fallback;
}

function microphoneError(error: unknown) {
  if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")) {
    return "Microphone access was denied. Allow it in the browser site controls, then reconnect.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") return "No microphone was found on this device.";
  return error instanceof Error ? error.message : "The microphone could not start";
}
