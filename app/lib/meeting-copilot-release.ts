/**
 * The Meeting Copilot is a local companion application. Keep its upstream
 * provenance and launch contract together so the Second Seat entry points
 * cannot silently drift to different releases.
 */
export const MEETING_COPILOT_RELEASE = {
  repository: "https://github.com/vividlabsai/meeting-copilot",
  branch: "codex/interview-profile-context",
  commit: "6c0b0498c3ac8b651dd8d4c46ab23ab0392e9c1b",
  uiVersion: "20260909-profile-copy-v1",
  launchUrl: "http://127.0.0.1:8123/",
} as const;
