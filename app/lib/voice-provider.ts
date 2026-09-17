export type VoiceTranscriptEvent = {
  speaker: "candidate" | "interviewer";
  text: string;
  final: boolean;
  at: string;
};

export type VoiceToolRequest = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type VoiceProviderCredential = {
  token: string;
  model: string;
  websocketUrl: string;
  config: Record<string, unknown>;
  expireTime: string;
  resumeFromTranscript: boolean;
};

export interface VoiceProvider {
  connect(credential: VoiceProviderCredential): Promise<void>;
  sendAudio(audio: Int16Array): void;
  onTranscript(handler: (event: VoiceTranscriptEvent) => void): void;
  onToolCall(handler: (request: VoiceToolRequest) => Promise<Record<string, unknown>>): void;
  end(): void;
}
