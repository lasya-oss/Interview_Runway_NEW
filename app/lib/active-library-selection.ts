/**
 * Curated learner-facing Library selection.
 *
 * The source manifests remain complete so archived material can be restored,
 * while the website exposes only resources selected for depth, practical use,
 * and coverage of the interview-preparation workflow.
 */

export const ACTIVE_PDF_FILENAMES = [
  // System design: one core reference per topic plus focused drills.
  "sysdesign_api-gateway.pdf",
  "sysdesign_cache-invalidation.pdf",
  "sysdesign_caching.pdf",
  "sysdesign_cap-theorem.pdf",
  "sysdesign_capacity-estimation.pdf",
  "sysdesign_cdn.pdf",
  "sysdesign_chat-system-walkthrough.pdf",
  "sysdesign_consistent-hashing.pdf",
  "sysdesign_database-indexing.pdf",
  "sysdesign_database-replication.pdf",
  "sysdesign_database-sharding.pdf",
  "sysdesign_eventual-consistency.pdf",
  "sysdesign_fault-tolerance.pdf",
  "sysdesign_file-storage-service-walkthrough.pdf",
  "sysdesign_hot-keys.pdf",
  "sysdesign_id-generation.pdf",
  "sysdesign_job-scheduler-walkthrough.pdf",
  "sysdesign_load-balancing.pdf",
  "sysdesign_message-queues.pdf",
  "sysdesign_microservices-vs-monolith.pdf",
  "sysdesign_multi-region.pdf",
  "sysdesign_news-feed-walkthrough.pdf",
  "sysdesign_notification-system-walkthrough.pdf",
  "sysdesign_observability.pdf",
  "sysdesign_payment-system-walkthrough.pdf",
  "sysdesign_quorums.pdf",
  "sysdesign_rate-limiter-walkthrough.pdf",
  "sysdesign_rate-limiting.pdf",
  "sysdesign_ride-sharing-dispatch-walkthrough.pdf",
  "sysdesign_search-autocomplete-walkthrough.pdf",
  "sysdesign_service-discovery.pdf",
  "sysdesign_sql-vs-nosql.pdf",
  "sysdesign_thundering-herd.pdf",
  "sysdesign_url-shortener-walkthrough.pdf",
  "sysdesign_caching-interview-drill.pdf",
  "sysdesign_database-replication-interview-drill.pdf",
  "sysdesign_fault-tolerance-interview-drill.pdf",
  "sysdesign_message-queues-interview-drill.pdf",
  "sysdesign_observability-interview-drill.pdf",
  "sysdesign_rate-limiter-follow-up-bank.pdf",
  "sysdesign_url-shortener-capacity-workbook.pdf",
  "sysdesign_notification-system-capacity-workbook.pdf",

  // DSA: reusable pattern references plus a small set of practice ladders.
  "dsa_backtracking.pdf",
  "dsa_bfs.pdf",
  "dsa_binary-search.pdf",
  "dsa_bit-manipulation.pdf",
  "dsa_dfs.pdf",
  "dsa_dynamic-programming-1d.pdf",
  "dsa_dynamic-programming-2d.pdf",
  "dsa_fast-slow-pointers.pdf",
  "dsa_greedy.pdf",
  "dsa_hash-maps.pdf",
  "dsa_heap-priority-queue.pdf",
  "dsa_intervals.pdf",
  "dsa_monotonic-stack.pdf",
  "dsa_prefix-sum.pdf",
  "dsa_shortest-path.pdf",
  "dsa_sliding-window.pdf",
  "dsa_topological-sort.pdf",
  "dsa_trie.pdf",
  "dsa_two-pointers.pdf",
  "dsa_union-find.pdf",
  "dsa_bfs-problem-ladder.pdf",
  "dsa_binary-search-problem-ladder.pdf",
  "dsa_dynamic-programming-1d-problem-ladder.pdf",
  "dsa_sliding-window-problem-ladder.pdf",
  "dsa_two-pointers-problem-ladder.pdf",

  // Behavioural, career-profile, company-research, operations, and plan guides
  // with enough depth to support repeated preparation; short duplicate
  // worksheet handouts stay archived.
  "behavioral_question-bank.pdf",
  "career_target-role-evidence-map.pdf",
  "company_interview-loop-gap-map.pdf",
  "operations_evidence-comparison-correction-workbook.pdf",
  "operations_final-loop-interview-day-runbook.pdf",
  "operations_technical-baseline-scorecard.pdf",
  "operations_timed-technical-rehearsal-workbook.pdf",
  "roadmap_12week.pdf",
  "roadmap_4week.pdf",
] as const;

export const ACTIVE_DRIVE_FILENAMES = [
  // All editable templates are practical, learner-facing tools.
  "template_weekly-prep-tracker.docx",
  "template_us-ats-resume.docx",
  "template_title-translation-guide.docx",
  "template_thank-you.docx",
  "template_system-design-canvas.docx",
  "template_stay-in-touch.docx",
  "template_remote-cover-letter.docx",
  "template_recruiter-screen-notes.docx",
  "template_outreach-referral.docx",
  "template_outreach-recruiter.docx",
  "template_outreach-hiring-manager.docx",
  "template_negotiation-timeline-extension.docx",
  "template_interview-availability.docx",
  "template_linkedin-profile.docx",
  "template_negotiation-initial-counter.docx",
  "template_behavioral-story-bank.docx",
  "template_follow-up-recruiter.docx",
  "template_negotiation-multiple-offers.docx",

  // Primary explainers with first-party transcript companions.
  "dsa_sliding-window_01.mp4",
  "dsa_bfs_01.mp4",
  "dsa_binary-search_01.mp4",
  "dsa_dynamic-programming-1d_01.mp4",
  "dsa_two-pointers_01.mp4",
  "sysdesign_caching_01.mp4",
  "sysdesign_rate-limiting_01.mp4",
  "sysdesign_url-shortener_01.mp4",
  "sysdesign_notification-system_01.mp4",
  "sysdesign_load-balancing_01.mp4",
  "behavioral_ownership_01.mp4",
  "behavioral_star-method_01.mp4",
  "behavioral_failure-answers_01.mp4",
  "remote_async-collaboration_01.mp4",
  "behavioral_career-transitions_01.mp4",

  // Representative interview-shaped practice scripts.
  "mock_coding_sliding-window_01.md",
  "mock_coding_bfs-debugging_06.md",
  "mock_coding_dynamic-programming_05.md",
  "mock_sysdesign_url-shortener_01.md",
  "mock_sysdesign_notification-platform_02.md",
  "mock_sysdesign_file-storage_06.md",
  "mock_behavioral_ownership-failure_01.md",
  "mock_behavioral_conflict_02.md",
  "mock_recruiter_fullstack-contractor_06.md",
  "mock_recruiter_platform-eor_03.md",
] as const;

export const ACTIVE_PDF_FILENAME_SET = new Set<string>(ACTIVE_PDF_FILENAMES);
export const ACTIVE_DRIVE_FILENAME_SET = new Set<string>(ACTIVE_DRIVE_FILENAMES);
export const ACTIVE_DRIVE_RECORD_KEY_SET = new Set<string>(
  ACTIVE_DRIVE_FILENAMES.map((filename) => {
    const kind = filename.endsWith(".mp4") ? "narrated" : filename.startsWith("mock_") ? "mock-script" : "template";
    return `${kind}:${filename}`;
  }),
);

export function isActivePdfFilename(filename: string) {
  return ACTIVE_PDF_FILENAME_SET.has(filename);
}

export function isActiveDriveFilename(filename: string) {
  return ACTIVE_DRIVE_FILENAME_SET.has(filename);
}

export function isActiveDriveRecord(filename: string, kind: string) {
  return ACTIVE_DRIVE_RECORD_KEY_SET.has(`${kind}:${filename}`);
}
