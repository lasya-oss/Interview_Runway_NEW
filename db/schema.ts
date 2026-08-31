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

export const learnerProgress = sqliteTable("learner_progress", {
  userEmail: text("user_email").primaryKey(),
  completedTaskIds: text("completed_task_ids").notNull().default("[]"),
  progressPercent: integer("progress_percent").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const secondSeatSessions = sqliteTable(
  "second_seat_sessions",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    mockId: text("mock_id").notNull(),
    status: text("status").notNull().default("in_progress"),
    answers: text("answers").notNull().default("[]"),
    evaluation: text("evaluation"),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("second_seat_sessions_user_updated_idx").on(
      table.userEmail,
      table.updatedAt,
    ),
    index("second_seat_sessions_user_status_idx").on(
      table.userEmail,
      table.status,
    ),
  ],
);

export const paddleEvents = sqliteTable("paddle_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  occurredAt: text("occurred_at").notNull(),
  processedAt: text("processed_at").notNull(),
});

export const qualificationApplications = sqliteTable(
  "qualification_applications",
  {
    id: text("id").primaryKey(),
    accountEmail: text("account_email").notNull(),
    phaseOneStatus: text("phase_one_status").notNull(),
    phaseTwoStatus: text("phase_two_status").notNull(),
    whatsappSupportPerson: text("whatsapp_support_person").notNull(),
    targetRole: text("target_role").notNull(),
    visibleGap: text("visible_gap").notNull(),
    additionalContext: text("additional_context"),
    consent: integer("consent", { mode: "boolean" }).notNull(),
    status: text("status").notNull().default("submitted"),
    notificationStatus: text("notification_status").notNull().default("pending"),
    notificationAttempts: integer("notification_attempts").notNull().default(0),
    notificationLastError: text("notification_last_error"),
    notifiedAt: text("notified_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("qualification_applications_email_created_idx").on(
      table.accountEmail,
      table.createdAt,
    ),
    index("qualification_applications_notification_created_idx").on(
      table.notificationStatus,
      table.createdAt,
    ),
  ],
);
