import { getD1 } from "@/db";

export type MeetingCopilotBridgeTokenStore = {
  consume(input: {
    tokenId: string;
    ownerKey: string;
    expiresAt: string;
    now?: Date;
  }): Promise<"consumed" | "replayed">;
};

type ConsumedTokenRow = {
  token_hash: string;
};

export function createMeetingCopilotBridgeTokenStore(
  getDatabase: typeof getD1 = getD1,
): MeetingCopilotBridgeTokenStore {
  return {
    async consume({ tokenId, ownerKey, expiresAt, now = new Date() }) {
      const database = await getDatabase();
      const [tokenHash, ownerHash] = await Promise.all([
        sha256Hex(`meeting-copilot:bridge-token:v1\0${tokenId}`),
        sha256Hex(`meeting-copilot:owner:v1\0${ownerKey}`),
      ]);
      const consumed = await database
        .prepare(
          `INSERT INTO meeting_copilot_bridge_token_consumptions (
             token_hash, owner_hash, expires_at, consumed_at
           ) VALUES (?, ?, ?, ?)
           ON CONFLICT(token_hash) DO NOTHING
           RETURNING token_hash`,
        )
        .bind(tokenHash, ownerHash, expiresAt, now.toISOString())
        .first<ConsumedTokenRow>();

      return consumed ? "consumed" : "replayed";
    },
  };
}

export const meetingCopilotBridgeTokenStore = createMeetingCopilotBridgeTokenStore();

async function sha256Hex(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
