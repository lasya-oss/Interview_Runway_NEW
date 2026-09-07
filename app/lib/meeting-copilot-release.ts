/**
 * The Meeting Copilot is a local companion application. Keep its upstream
 * provenance and launch contract together so the Second Seat entry points
 * cannot silently drift to different releases.
 */
export const MEETING_COPILOT_RELEASE = {
  repository: "https://github.com/vividlabsai/meeting-copilot",
  branch: "codex/interview-profile-context",
  commit: "1411f4d870c264d5827043e0c4dc61520254528a",
  uiVersion: "20260905-clue-coaching-v1",
  launchUrl: "http://127.0.0.1:8123/",
} as const;
