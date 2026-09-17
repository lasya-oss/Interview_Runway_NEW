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
  completionActivity: text("completion_activity").notNull().default("{}"),
  focusedSeconds: integer("focused_seconds").notNull().default(0),
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

export const voiceCandidateProfiles = sqliteTable("voice_candidate_profiles", {
  userEmail: text("user_email").primaryKey(),
  profileId: text("profile_id").notNull(),
  profileRevision: integer("profile_revision").notNull(),
  profileJson: text("profile_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const voiceSessions = sqliteTable(
  "voice_sessions",
  {
    id: text("id").primaryKey(),
    userEmail: text("user_email").notNull(),
    interviewType: text("interview_type").notNull(),
    persona: text("persona").notNull(),
    language: text("language").notNull().default("en"),
    jobDescription: text("job_description"),
    candidateProfile: text("candidate_profile"),
    status: text("status").notNull().default("ready"),
    tokenId: text("token_id"),
    consentAt: text("consent_at"),
    audioRetentionApproved: integer("audio_retention_approved", { mode: "boolean" })
      .notNull()
      .default(false),
    audioObjectPrefix: text("audio_object_prefix"),
    createdAt: text("created_at").notNull(),
    startedAt: text("started_at"),
    endedAt: text("ended_at"),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("voice_sessions_user_created_idx").on(table.userEmail, table.createdAt),
    index("voice_sessions_user_status_idx").on(table.userEmail, table.status),
  ],
);

// Kept after a learner deletes session content so monthly quotas cannot be
// reset by deleting transcripts. It contains no interview content.
export const voiceSessionUsage = sqliteTable(
  "voice_session_usage",
  {
    sessionId: text("session_id").primaryKey(),
    userEmail: text("user_email").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("voice_session_usage_user_created_idx").on(table.userEmail, table.createdAt)],
);

export const voiceTurns = sqliteTable(
  "voice_turns",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => voiceSessions.id, { onDelete: "cascade" }),
    speaker: text("speaker").notNull(),
    text: text("text").notNull(),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at").notNull(),
    toolCalls: text("tool_calls"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("voice_turns_session_started_idx").on(table.sessionId, table.startedAt)],
);

export const voiceScores = sqliteTable("voice_scores", {
  sessionId: text("session_id")
    .primaryKey()
    .references(() => voiceSessions.id, { onDelete: "cascade" }),
  rubricVersion: text("rubric_version").notNull(),
  perAnswer: text("per_answer").notNull(),
  sessionVerdict: text("session_verdict").notNull(),
  strengths: text("strengths").notNull(),
  gaps: text("gaps").notNull(),
  recommendedDrills: text("recommended_drills").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  createdAt: text("created_at").notNull(),
});

export const voiceReportDeliveries = sqliteTable(
  "voice_report_deliveries",
  {
    deliveryKey: text("delivery_key").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => voiceSessions.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    messageId: text("message_id"),
    failureCode: text("failure_code"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    sentAt: text("sent_at"),
  },
  (table) => [
    uniqueIndex("voice_report_deliveries_session_unique").on(table.sessionId),
    index("voice_report_deliveries_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const meetingCopilotProfileDeliveries = sqliteTable(
  "meeting_copilot_profile_deliveries",
  {
    deliveryKey: text("delivery_key").primaryKey(),
    ownerHash: text("owner_hash").notNull(),
    profileId: text("profile_id").notNull(),
    profileRevision: integer("profile_revision").notNull(),
    eventId: text("event_id").notNull(),
    status: text("status").notNull().default("pending"),
    messageId: text("message_id"),
    failureCode: text("failure_code"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    sentAt: text("sent_at"),
  },
  (table) => [
    uniqueIndex("meeting_copilot_profile_deliveries_owner_profile_revision_unique").on(
      table.ownerHash,
      table.profileId,
      table.profileRevision,
    ),
    index("meeting_copilot_profile_deliveries_owner_created_idx").on(
      table.ownerHash,
      table.createdAt,
    ),
  ],
);

export const meetingCopilotBridgeTokenConsumptions = sqliteTable(
  "meeting_copilot_bridge_token_consumptions",
  {
    tokenHash: text("token_hash").primaryKey(),
    ownerHash: text("owner_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    consumedAt: text("consumed_at").notNull(),
  },
  (table) => [
    index("meeting_copilot_bridge_token_consumptions_expires_idx").on(
      table.expiresAt,
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
