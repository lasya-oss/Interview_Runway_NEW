import type {
  VoiceProvider,
  VoiceProviderCredential,
  VoiceToolRequest,
  VoiceTranscriptEvent,
} from "@/app/lib/voice-provider";

type StatusHandler = (status: "connected" | "reconnecting" | "disconnected") => void;

export class GeminiLiveVoiceProvider implements VoiceProvider {
  private credential: VoiceProviderCredential | null = null;
  private socket: WebSocket | null = null;
  private transcriptHandler: (event: VoiceTranscriptEvent) => void = () => undefined;
  private toolHandler: (request: VoiceToolRequest) => Promise<Record<string, unknown>> = async () => ({ error: "Tool handler unavailable" });
  private audioHandler: (base64: string) => void = () => undefined;
  private interruptionHandler: () => void = () => undefined;
  private statusHandler: StatusHandler = () => undefined;
  private latencyHandler: (milliseconds: number) => void = () => undefined;
  private resumptionHandle: string | null = null;
  private stopped = false;
  private reconnecting = false;
  private reconnects = 0;
  private beganInterview = false;
  private candidateFinishedAt = 0;
  private latencyRecordedForTurn = true;

  async connect(credential: VoiceProviderCredential) {
    this.credential = credential;
    this.stopped = false;
    await this.openSocket(null);
  }

  sendAudio(audio: Int16Array) {
    if (this.socket?.readyState !== WebSocket.OPEN || !audio.length) return;
    this.socket.send(JSON.stringify({
      realtimeInput: {
        audio: { data: bytesToBase64(new Uint8Array(audio.buffer, audio.byteOffset, audio.byteLength)), mimeType: "audio/pcm;rate=16000" },
      },
    }));
  }

  onTranscript(handler: (event: VoiceTranscriptEvent) => void) {
    this.transcriptHandler = handler;
  }

  onToolCall(handler: (request: VoiceToolRequest) => Promise<Record<string, unknown>>) {
    this.toolHandler = handler;
  }

  onAudio(handler: (base64: string) => void) {
    this.audioHandler = handler;
  }

  onInterrupted(handler: () => void) {
    this.interruptionHandler = handler;
  }

  onStatus(handler: StatusHandler) {
    this.statusHandler = handler;
  }

  onLatency(handler: (milliseconds: number) => void) {
    this.latencyHandler = handler;
  }

  end() {
    this.stopped = true;
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      this.socket.close(1000, "Interview ended");
    }
    this.socket = null;
  }

  private openSocket(handle: string | null) {
    const credential = this.credential;
    if (!credential) return Promise.reject(new Error("Voice credential unavailable"));
    if (Date.now() >= Date.parse(credential.expireTime)) {
      return Promise.reject(new Error("Voice credential expired"));
    }
    return new Promise<void>((resolve, reject) => {
      const url = `${credential.websocketUrl}?access_token=${encodeURIComponent(credential.token)}`;
      const socket = new WebSocket(url);
      this.socket = socket;
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        socket.close();
        reject(new Error("Voice provider connection timed out"));
      }, 12_000);

      socket.onopen = () => {
        const config = structuredClone(credential.config);
        config.sessionResumption = handle ? { handle } : {};
        socket.send(JSON.stringify({ setup: { model: `models/${credential.model}`, ...config } }));
      };
      socket.onmessage = (event) => {
        void this.handleMessage(event.data).then((setupComplete) => {
          if (!setupComplete || settled) return;
          settled = true;
          window.clearTimeout(timeout);
          this.reconnects = 0;
          this.statusHandler("connected");
          if (!this.beganInterview) {
            this.beganInterview = true;
            socket.send(JSON.stringify({
              clientContent: {
                turns: [{ role: "user", parts: [{ text: credential.resumeFromTranscript
                  ? "Resume this mock interview from the supplied transcript. Continue with the next natural interviewer turn without repeating prior questions."
                  : "Begin the mock interview now. Introduce yourself in one sentence and ask the first question." }] }],
                turnComplete: true,
              },
            }));
          }
          resolve();
        }).catch((error) => {
          if (!settled) {
            settled = true;
            window.clearTimeout(timeout);
            reject(error);
          }
        });
      };
      socket.onerror = () => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timeout);
          reject(new Error("Voice provider connection failed"));
        }
      };
      socket.onclose = () => {
        window.clearTimeout(timeout);
        if (!settled) {
          settled = true;
          reject(new Error("Voice provider closed during setup"));
        }
        if (!this.stopped && this.socket === socket) void this.reconnect();
      };
    });
  }

  private async handleMessage(data: unknown) {
    const text = typeof data === "string" ? data : data instanceof Blob ? await data.text() : "";
    if (!text) return false;
    const message = JSON.parse(text) as Record<string, unknown>;
    if (message.setupComplete) return true;
    const resumption = asRecord(message.sessionResumptionUpdate);
    if (resumption?.resumable === true && typeof resumption.newHandle === "string") {
      this.resumptionHandle = resumption.newHandle;
    }
    if (message.goAway && !this.stopped) window.setTimeout(() => void this.reconnect(), 100);
    const content = asRecord(message.serverContent);
    if (content) {
      const input = asRecord(content.inputTranscription);
      if (typeof input?.text === "string" && input.text.trim()) {
        this.candidateFinishedAt = performance.now();
        this.latencyRecordedForTurn = false;
        this.transcriptHandler({ speaker: "candidate", text: input.text, final: false, at: new Date().toISOString() });
      }
      const output = asRecord(content.outputTranscription);
      if (typeof output?.text === "string" && output.text.trim()) {
        this.transcriptHandler({ speaker: "interviewer", text: output.text, final: false, at: new Date().toISOString() });
      }
      const modelTurn = asRecord(content.modelTurn);
      const parts = Array.isArray(modelTurn?.parts) ? modelTurn.parts : [];
      for (const part of parts) {
        const inlineData = asRecord(asRecord(part)?.inlineData);
        if (typeof inlineData?.data === "string") {
          if (!this.latencyRecordedForTurn && this.candidateFinishedAt > 0) {
            this.latencyRecordedForTurn = true;
            this.latencyHandler(Math.round(performance.now() - this.candidateFinishedAt));
          }
          this.audioHandler(inlineData.data);
        }
      }
      if (content.interrupted === true) this.interruptionHandler();
      if (content.turnComplete === true) {
        const at = new Date().toISOString();
        this.transcriptHandler({ speaker: "candidate", text: "", final: true, at });
        this.transcriptHandler({ speaker: "interviewer", text: "", final: true, at });
      }
    }
    const toolCall = asRecord(message.toolCall);
    const calls = Array.isArray(toolCall?.functionCalls) ? toolCall.functionCalls : [];
    if (calls.length) await this.handleTools(calls);
    return false;
  }

  private async handleTools(calls: unknown[]) {
    const responses = await Promise.all(calls.map(async (value) => {
      const call = asRecord(value);
      const request: VoiceToolRequest = {
        id: typeof call?.id === "string" ? call.id : crypto.randomUUID(),
        name: typeof call?.name === "string" ? call.name : "unknown",
        arguments: asRecord(call?.args) ?? {},
      };
      try {
        const response = await this.toolHandler(request);
        return { id: request.id, name: request.name, response };
      } catch {
        return { id: request.id, name: request.name, response: { error: "Tool execution failed", scheduling: "WHEN_IDLE" } };
      }
    }));
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ toolResponse: { functionResponses: responses } }));
    }
  }

  private async reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;
    try {
      while (!this.stopped && this.credential && this.reconnects < 3) {
        if (!this.resumptionHandle || Date.now() >= Date.parse(this.credential.expireTime)) break;
        this.reconnects += 1;
        this.statusHandler("reconnecting");
        const previous = this.socket;
        this.socket = null;
        if (previous?.readyState === WebSocket.OPEN) previous.close(1000, "Resuming session");
        await new Promise((resolve) => window.setTimeout(resolve, 350 * this.reconnects));
        try {
          await this.openSocket(this.resumptionHandle);
          return;
        } catch {
          // Retry with the latest resumption handle while the credential lives.
        }
      }
      if (!this.stopped) this.statusHandler("disconnected");
    } finally {
      this.reconnecting = false;
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}
