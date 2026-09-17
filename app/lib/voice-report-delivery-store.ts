import { getD1 } from "@/db";

export type VoiceReportDeliveryStatus = "pending" | "sent" | "failed" | "indeterminate";

export type VoiceReportDeliveryRecord = {
  deliveryKey: string;
  sessionId: string;
  status: VoiceReportDeliveryStatus;
  messageId: string | null;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

type DeliveryRow = {
  delivery_key: string;
  session_id: string;
  status: string;
  message_id: string | null;
  failure_code: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

export async function reserveVoiceReportDelivery(sessionId: string, now = new Date()) {
  const database = await getD1();
  const deliveryKey = await sha256Hex(`voice-report\0${sessionId}`);
  const timestamp = now.toISOString();
  const inserted = await database.prepare(
    `INSERT INTO voice_report_deliveries (
       delivery_key, session_id, status, message_id, failure_code,
       created_at, updated_at, sent_at
     ) VALUES (?, ?, 'pending', NULL, NULL, ?, ?, NULL)
     ON CONFLICT(session_id) DO NOTHING
     RETURNING delivery_key, session_id, status, message_id, failure_code,
               created_at, updated_at, sent_at`,
  ).bind(deliveryKey, sessionId, timestamp, timestamp).first<DeliveryRow>();
  if (inserted) return { kind: "reserved" as const, record: parseRow(inserted) };
  const existing = await database.prepare(
    `SELECT delivery_key, session_id, status, message_id, failure_code,
            created_at, updated_at, sent_at
     FROM voice_report_deliveries WHERE session_id = ? LIMIT 1`,
  ).bind(sessionId).first<DeliveryRow>();
  if (!existing) throw new Error("Voice report delivery could not be reserved");
  return { kind: "existing" as const, record: parseRow(existing) };
}

export async function completeVoiceReportDelivery(input: {
  deliveryKey: string;
  status: Exclude<VoiceReportDeliveryStatus, "pending">;
  messageId?: string | null;
  failureCode?: string | null;
  now?: Date;
}) {
  const timestamp = (input.now ?? new Date()).toISOString();
  const result = await (await getD1()).prepare(
    `UPDATE voice_report_deliveries
     SET status = ?, message_id = ?, failure_code = ?, updated_at = ?, sent_at = ?
     WHERE delivery_key = ? AND status = 'pending'`,
  ).bind(
    input.status,
    bounded(input.messageId ?? null, 512),
    bounded(input.failureCode ?? null, 64),
    timestamp,
    input.status === "sent" ? timestamp : null,
    input.deliveryKey,
  ).run();
  if (Number(result.meta?.changes ?? 0) !== 1) {
    throw new Error("Voice report delivery state could not be finalized");
  }
}

function parseRow(row: DeliveryRow): VoiceReportDeliveryRecord {
  if (!isStatus(row.status)) throw new Error("Voice report delivery state is invalid");
  return {
    deliveryKey: row.delivery_key,
    sessionId: row.session_id,
    status: row.status,
    messageId: row.message_id,
    failureCode: row.failure_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
  };
}

function isStatus(value: string): value is VoiceReportDeliveryStatus {
  return value === "pending" || value === "sent" || value === "failed" || value === "indeterminate";
}

function bounded(value: string | null, maximum: number) {
  if (!value) return null;
  const cleaned = value.replace(/[\r\n\0]/g, " ").trim();
  return cleaned ? cleaned.slice(0, maximum) : null;
}

async function sha256Hex(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
