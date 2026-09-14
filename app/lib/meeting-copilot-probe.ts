/**
 * Pure helpers for detecting the local Meeting Copilot companion.
 *
 * The companion always listens on port 8123 of the device loopback
 * interface, but depending on the machine `localhost` may resolve to a
 * different loopback address than `127.0.0.1`. Probing both spellings keeps
 * a live companion from being reported as "not running".
 */
export const MEETING_COPILOT_PROBE_TIMEOUT_MS = 2_500;

export function meetingCopilotProbeUrls(probeUrl: string): string[] {
  try {
    const parsed = new URL(probeUrl);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "127.0.0.1" || hostname === "localhost") {
      const alternate = new URL(probeUrl);
      alternate.hostname = hostname === "127.0.0.1" ? "localhost" : "127.0.0.1";
      const alternateUrl = alternate.toString();
      if (alternateUrl !== probeUrl) return [probeUrl, alternateUrl];
    }
  } catch {
    // Fall through and probe the configured URL only.
  }
  return [probeUrl];
}
