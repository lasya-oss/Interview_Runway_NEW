import { and, count, desc, eq, gte } from "drizzle-orm";
import { getD1, getDb } from "@/db";
import {
  checkoutSessions,
  entitlements,
  paddleEvents,
} from "@/db/schema";
import { VAULT_AMOUNT_MINOR, VAULT_CURRENCY } from "@/app/lib/paddle";

export type CheckoutSessionRecord = typeof checkoutSessions.$inferSelect;

const CHECKOUT_TTL_MS = 20 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export async function createVaultCheckoutSession(userEmail: string) {
  const now = new Date();
  const record: typeof checkoutSessions.$inferInsert = {
    id: crypto.randomUUID(),
    userEmail: normalizeEmail(userEmail),
    offer: "vault",
    expectedAmountMinor: VAULT_AMOUNT_MINOR,
    expectedCurrency: VAULT_CURRENCY,
    status: "pending",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CHECKOUT_TTL_MS).toISOString(),
  };

  await (await getDb()).insert(checkoutSessions).values(record);
  return record;
}

export async function countRecentCheckoutSessions(userEmail: string) {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const [result] = await (await getDb())
    .select({ value: count() })
    .from(checkoutSessions)
    .where(
      and(
        eq(checkoutSessions.userEmail, normalizeEmail(userEmail)),
        gte(checkoutSessions.createdAt, since),
      ),
    );

  return result?.value ?? 0;
}

export async function hasActiveVaultEntitlement(userEmail: string) {
  const [entitlement] = await (await getDb())
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userEmail, normalizeEmail(userEmail)),
        eq(entitlements.offer, "vault"),
        eq(entitlements.status, "active"),
      ),
    )
    .limit(1);

  return Boolean(entitlement);
}

export async function attachPaddleTransaction(
  checkoutSessionId: string,
  paddleTransactionId: string,
) {
  await (await getDb())
    .update(checkoutSessions)
    .set({
      paddleTransactionId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(checkoutSessions.id, checkoutSessionId));
}

export async function markCheckoutSessionFailed(checkoutSessionId: string) {
  await (await getDb())
    .update(checkoutSessions)
    .set({ status: "failed", updatedAt: new Date().toISOString() })
    .where(eq(checkoutSessions.id, checkoutSessionId));
}

export async function getCheckoutSession(checkoutSessionId: string) {
  const [session] = await (await getDb())
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.id, checkoutSessionId))
    .limit(1);

  return session ?? null;
}

export async function getCheckoutSessionForUser(
  checkoutSessionId: string,
  userEmail: string,
) {
  const [session] = await (await getDb())
    .select()
    .from(checkoutSessions)
    .where(
      and(
        eq(checkoutSessions.id, checkoutSessionId),
        eq(checkoutSessions.userEmail, normalizeEmail(userEmail)),
      ),
    )
    .orderBy(desc(checkoutSessions.createdAt))
    .limit(1);

  return session ?? null;
}

export async function paddleEventWasProcessed(eventId: string) {
  const [event] = await (await getDb())
    .select({ eventId: paddleEvents.eventId })
    .from(paddleEvents)
    .where(eq(paddleEvents.eventId, eventId))
    .limit(1);

  return Boolean(event);
}

export async function activateVaultEntitlement({
  eventId,
  eventType,
  occurredAt,
  session,
  transactionId,
}: {
  eventId: string;
  eventType: string;
  occurredAt: string;
  session: CheckoutSessionRecord;
  transactionId: string;
}) {
  const database = await getD1();
  const processedAt = new Date().toISOString();
  const entitlementId = crypto.randomUUID();

  await database.batch([
    database
      .prepare(
        `UPDATE checkout_sessions
         SET status = 'completed', paddle_transaction_id = ?, updated_at = ?, last_event_at = ?
         WHERE id = ? AND (last_event_at IS NULL OR last_event_at < ?)`,
      )
      .bind(
        transactionId,
        processedAt,
        occurredAt,
        session.id,
        occurredAt,
      ),
    database
      .prepare(
        `INSERT INTO entitlements
          (id, user_email, offer, status, paddle_transaction_id, created_at, updated_at, last_event_at)
         VALUES (?, ?, 'vault', 'active', ?, ?, ?, ?)
         ON CONFLICT(user_email, offer) DO UPDATE SET
          status = 'active',
          paddle_transaction_id = excluded.paddle_transaction_id,
          updated_at = excluded.updated_at,
          last_event_at = excluded.last_event_at
         WHERE entitlements.last_event_at < excluded.last_event_at`,
      )
      .bind(
        entitlementId,
        session.userEmail,
        transactionId,
        processedAt,
        processedAt,
        occurredAt,
      ),
    database
      .prepare(
        `INSERT INTO paddle_events (event_id, event_type, occurred_at, processed_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(eventId, eventType, occurredAt, processedAt),
  ]);
}

export async function revokeVaultEntitlement({
  eventId,
  eventType,
  occurredAt,
  transactionId,
}: {
  eventId: string;
  eventType: string;
  occurredAt: string;
  transactionId: string;
}) {
  const [entitlement] = await (await getDb())
    .select()
    .from(entitlements)
    .where(eq(entitlements.paddleTransactionId, transactionId))
    .limit(1);

  if (!entitlement) return false;

  const database = await getD1();
  const processedAt = new Date().toISOString();

  await database.batch([
    database
      .prepare(
        `UPDATE entitlements
         SET status = 'revoked', updated_at = ?, last_event_at = ?
         WHERE paddle_transaction_id = ? AND last_event_at < ?`,
      )
      .bind(processedAt, occurredAt, transactionId, occurredAt),
    database
      .prepare(
        `UPDATE checkout_sessions
         SET status = 'revoked', updated_at = ?, last_event_at = ?
         WHERE paddle_transaction_id = ? AND (last_event_at IS NULL OR last_event_at < ?)`,
      )
      .bind(processedAt, occurredAt, transactionId, occurredAt),
    database
      .prepare(
        `INSERT INTO paddle_events (event_id, event_type, occurred_at, processed_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(eventId, eventType, occurredAt, processedAt),
  ]);

  return true;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
