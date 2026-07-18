import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const checkoutSessions = sqliteTable(
  "checkout_sessions",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    offer: text("offer").notNull(),
    expectedAmountMinor: integer("expected_amount_minor").notNull(),
    expectedCurrency: text("expected_currency").notNull(),
    status: text("status").notNull().default("pending"),
    paddleTransactionId: text("paddle_transaction_id"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    expiresAt: text("expires_at").notNull(),
    lastEventAt: text("last_event_at"),
  },
  (table) => [
    uniqueIndex("checkout_sessions_paddle_transaction_unique").on(
      table.paddleTransactionId,
    ),
    index("checkout_sessions_user_created_idx").on(
      table.userEmail,
      table.createdAt,
    ),
  ],
);

export const entitlements = sqliteTable(
  "entitlements",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    offer: text("offer").notNull(),
    status: text("status").notNull(),
    paddleTransactionId: text("paddle_transaction_id").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    lastEventAt: text("last_event_at").notNull(),
  },
  (table) => [
    uniqueIndex("entitlements_user_offer_unique").on(
      table.userEmail,
      table.offer,
    ),
    uniqueIndex("entitlements_paddle_transaction_unique").on(
      table.paddleTransactionId,
    ),
  ],
);

export const paddleEvents = sqliteTable("paddle_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  occurredAt: text("occurred_at").notNull(),
  processedAt: text("processed_at").notNull(),
});
