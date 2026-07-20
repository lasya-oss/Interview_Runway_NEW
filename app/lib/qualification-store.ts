import { getD1 } from "@/db";
import type { QualificationApplicationInput } from "@/app/lib/qualification";

export type QualificationApplicationRecord = QualificationApplicationInput & {
  id: string;
  status: "submitted";
  notificationStatus: "pending" | "sent" | "failed";
  notificationAttempts: number;
  notificationLastError: string | null;
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

let schemaReady: Promise<void> | null = null;

export async function createQualificationApplication(
  input: QualificationApplicationInput,
): Promise<QualificationApplicationRecord> {
  await ensureQualificationSchema();
  const database = await getD1();
  const now = new Date().toISOString();
  const record: QualificationApplicationRecord = {
    ...input,
    id: crypto.randomUUID(),
    status: "submitted",
    notificationStatus: "pending",
    notificationAttempts: 0,
    notificationLastError: null,
    notifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await database
    .prepare(
      `INSERT INTO qualification_applications (
        id, account_email, phase_one_status, phase_two_status,
        whatsapp_support_person, target_role, visible_gap, additional_context,
        consent, status, notification_status, notification_attempts,
        notification_last_error, notified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      record.id,
      record.accountEmail,
      record.phaseOneStatus,
      record.phaseTwoStatus,
      record.whatsappSupportPerson,
      record.targetRole,
      record.visibleGap,
      record.additionalContext,
      1,
      record.status,
      record.notificationStatus,
      record.notificationAttempts,
      record.notificationLastError,
      record.notifiedAt,
      record.createdAt,
      record.updatedAt,
    )
    .run();

  return record;
}

export async function countRecentQualificationApplications(
  accountEmail: string,
  since: string,
): Promise<number> {
  await ensureQualificationSchema();
  const database = await getD1();
  const result = await database
    .prepare(
      "SELECT COUNT(*) AS count FROM qualification_applications WHERE account_email = ? AND created_at >= ?",
    )
    .bind(accountEmail.trim().toLowerCase(), since)
    .first<{ count: number }>();

  return Number(result?.count ?? 0);
}

export async function recordQualificationNotification(
  applicationId: string,
  outcome: { status: "sent" | "failed"; error?: string },
): Promise<void> {
  await ensureQualificationSchema();
  const database = await getD1();
  const now = new Date().toISOString();

  await database
    .prepare(
      `UPDATE qualification_applications
       SET notification_status = ?,
           notification_attempts = notification_attempts + 1,
           notification_last_error = ?,
           notified_at = ?,
           updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      outcome.status,
      outcome.error?.slice(0, 500) ?? null,
      outcome.status === "sent" ? now : null,
      now,
      applicationId,
    )
    .run();
}

async function ensureQualificationSchema(): Promise<void> {
  schemaReady ??= initializeQualificationSchema().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

async function initializeQualificationSchema(): Promise<void> {
  const database = await getD1();
  await database.batch([
    database.prepare(
      `CREATE TABLE IF NOT EXISTS qualification_applications (
        id text PRIMARY KEY NOT NULL,
        account_email text NOT NULL,
        phase_one_status text NOT NULL,
        phase_two_status text NOT NULL,
        whatsapp_support_person text NOT NULL,
        target_role text NOT NULL,
        visible_gap text NOT NULL,
        additional_context text,
        consent integer NOT NULL,
        status text DEFAULT 'submitted' NOT NULL,
        notification_status text DEFAULT 'pending' NOT NULL,
        notification_attempts integer DEFAULT 0 NOT NULL,
        notification_last_error text,
        notified_at text,
        created_at text NOT NULL,
        updated_at text NOT NULL
      )`,
    ),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS qualification_applications_email_created_idx ON qualification_applications (account_email, created_at)",
    ),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS qualification_applications_notification_created_idx ON qualification_applications (notification_status, created_at)",
    ),
  ]);
}
