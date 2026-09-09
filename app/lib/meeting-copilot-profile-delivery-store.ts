import { getD1 } from "@/db";

export const MAX_NEW_MEETING_COPILOT_PROFILE_DELIVERIES_PER_HOUR = 10;
const DELIVERY_WINDOW_MILLISECONDS = 60 * 60 * 1_000;

export type MeetingCopilotProfileDeliveryStatus =
  | "pending"
  | "sent"
  | "failed"
  | "indeterminate";

export type MeetingCopilotProfileDeliveryRecord = {
  deliveryKey: string;
  status: MeetingCopilotProfileDeliveryStatus;
  messageId: string | null;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

export type MeetingCopilotProfileDeliveryReservation =
  | { kind: "reserved"; record: MeetingCopilotProfileDeliveryRecord }
  | { kind: "existing"; record: MeetingCopilotProfileDeliveryRecord }
  | { kind: "rate-limited" };

export type MeetingCopilotProfileDeliveryStore = {
  reserve(input: {
    ownerKey: string;
    profileId: string;
    profileRevision: number;
    eventId: string;
    now?: Date;
  }): Promise<MeetingCopilotProfileDeliveryReservation>;
  complete(input: {
    deliveryKey: string;
    status: Exclude<MeetingCopilotProfileDeliveryStatus, "pending">;
    messageId?: string | null;
    failureCode?: string | null;
    now?: Date;
  }): Promise<void>;
};

type DeliveryRow = {
  delivery_key: string;
  status: string;
  message_id: string | null;
  failure_code: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

export function createMeetingCopilotProfileDeliveryStore(
  getDatabase: typeof getD1 = getD1,
): MeetingCopilotProfileDeliveryStore {
  return {
    async reserve({ ownerKey, profileId, profileRevision, eventId, now = new Date() }) {
      const database = await getDatabase();
      const ownerHash = await sha256Hex(`owner\0${ownerKey}`);
      const deliveryKey = await sha256Hex(
        `delivery\0${ownerHash}\0${profileId}\0${profileRevision}`,
      );
      const timestamp = now.toISOString();
      const windowStart = new Date(now.getTime() - DELIVERY_WINDOW_MILLISECONDS).toISOString();
      const inserted = await database
        .prepare(
          `INSERT INTO meeting_copilot_profile_deliveries (
             delivery_key, owner_hash, profile_id, profile_revision, event_id,
             status, message_id, failure_code, created_at, updated_at, sent_at
           )
           SELECT ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?, ?, NULL
           WHERE (
             SELECT COUNT(*)
             FROM meeting_copilot_profile_deliveries
             WHERE owner_hash = ? AND created_at >= ?
           ) < ?
           ON CONFLICT(owner_hash, profile_id, profile_revision) DO NOTHING
           RETURNING delivery_key, status, message_id, failure_code,
                     created_at, updated_at, sent_at`,
        )
        .bind(
          deliveryKey,
          ownerHash,
          profileId,
          profileRevision,
          eventId,
          timestamp,
          timestamp,
          ownerHash,
          windowStart,
          MAX_NEW_MEETING_COPILOT_PROFILE_DELIVERIES_PER_HOUR,
        )
        .first<DeliveryRow>();

      if (inserted) return { kind: "reserved", record: parseDeliveryRow(inserted) };

      const existing = await database
        .prepare(
          `SELECT delivery_key, status, message_id, failure_code,
                  created_at, updated_at, sent_at
           FROM meeting_copilot_profile_deliveries
           WHERE owner_hash = ? AND profile_id = ? AND profile_revision = ?
           LIMIT 1`,
        )
        .bind(ownerHash, profileId, profileRevision)
        .first<DeliveryRow>();

      return existing
        ? { kind: "existing", record: parseDeliveryRow(existing) }
        : { kind: "rate-limited" };
    },

    async complete({ deliveryKey, status, messageId = null, failureCode = null, now = new Date() }) {
      const database = await getDatabase();
      const timestamp = now.toISOString();
      const result = await database
        .prepare(
          `UPDATE meeting_copilot_profile_deliveries
           SET status = ?, message_id = ?, failure_code = ?, updated_at = ?, sent_at = ?
           WHERE delivery_key = ? AND status = 'pending'`,
        )
        .bind(
          status,
          boundedMetadata(messageId, 512),
          boundedMetadata(failureCode, 64),
          timestamp,
          status === "sent" ? timestamp : null,
          deliveryKey,
        )
        .run();

      if (Number(result.meta?.changes ?? 0) !== 1) {
        throw new Error("Meeting Copilot delivery state could not be finalized");
      }
    },
  };
}

export const meetingCopilotProfileDeliveryStore =
  createMeetingCopilotProfileDeliveryStore();

function parseDeliveryRow(row: DeliveryRow): MeetingCopilotProfileDeliveryRecord {
  if (!isDeliveryStatus(row.status)) {
    throw new Error("Meeting Copilot delivery state is invalid");
  }
  return {
    deliveryKey: row.delivery_key,
    status: row.status,
    messageId: row.message_id,
    failureCode: row.failure_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
  };
}

function isDeliveryStatus(value: string): value is MeetingCopilotProfileDeliveryStatus {
  return value === "pending"
    || value === "sent"
    || value === "failed"
    || value === "indeterminate";
}

function boundedMetadata(value: string | null, maximum: number) {
  if (value === null) return null;
  const cleaned = value.replace(/[\r\n\0]/g, " ").trim();
  return cleaned ? cleaned.slice(0, maximum) : null;
}

async function sha256Hex(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
