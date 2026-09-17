import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { voiceCandidateProfiles } from "@/db/schema";
import type { MeetingCopilotSavedProfileCopy } from "@/app/lib/meeting-copilot-profile-copy";

export const VOICE_CANDIDATE_PROFILE_SCHEMA_VERSION = 1 as const;

export type VoiceCandidateProfile = {
  schemaVersion: typeof VOICE_CANDIDATE_PROFILE_SCHEMA_VERSION;
  id: string;
  revision: number;
  name: string;
  focus: string;
  customGuidance: string;
  targetRole: string | null;
  resumeText: string;
  jobDescriptionText: string;
  updatedAt: string;
};

export async function saveVoiceCandidateProfile(
  email: string,
  saved: MeetingCopilotSavedProfileCopy,
) {
  const profile: VoiceCandidateProfile = {
    schemaVersion: VOICE_CANDIDATE_PROFILE_SCHEMA_VERSION,
    id: saved.profile.id,
    revision: saved.profile.revision,
    name: saved.profile.name,
    focus: saved.profile.focus,
    customGuidance: saved.profile.customGuidance,
    targetRole: saved.profile.targetRole?.trim() || null,
    resumeText: saved.profile.resume.text,
    jobDescriptionText: saved.profile.jobDescription.text,
    updatedAt: saved.profile.updatedAt,
  };
  const row = {
    userEmail: normalizeEmail(email),
    profileId: profile.id,
    profileRevision: profile.revision,
    profileJson: JSON.stringify(profile),
    updatedAt: profile.updatedAt,
  };
  await (await getDb())
    .insert(voiceCandidateProfiles)
    .values(row)
    .onConflictDoUpdate({
      target: voiceCandidateProfiles.userEmail,
      set: {
        profileId: row.profileId,
        profileRevision: row.profileRevision,
        profileJson: row.profileJson,
        updatedAt: row.updatedAt,
      },
      where: sql`${voiceCandidateProfiles.profileRevision} <= ${row.profileRevision}`,
    });
  return profile;
}

export async function getVoiceCandidateProfile(email: string) {
  const [record] = await (await getDb())
    .select({ profileJson: voiceCandidateProfiles.profileJson })
    .from(voiceCandidateProfiles)
    .where(eq(voiceCandidateProfiles.userEmail, normalizeEmail(email)))
    .limit(1);
  return parseVoiceCandidateProfile(record?.profileJson);
}

export function parseVoiceCandidateProfile(value: string | null | undefined) {
  if (!value) return null;
  try {
    const profile = JSON.parse(value) as Partial<VoiceCandidateProfile>;
    if (
      profile.schemaVersion !== VOICE_CANDIDATE_PROFILE_SCHEMA_VERSION
      || typeof profile.id !== "string"
      || !Number.isSafeInteger(profile.revision)
      || typeof profile.name !== "string"
      || typeof profile.focus !== "string"
      || typeof profile.customGuidance !== "string"
      || (profile.targetRole !== null && typeof profile.targetRole !== "string")
      || typeof profile.resumeText !== "string"
      || typeof profile.jobDescriptionText !== "string"
      || typeof profile.updatedAt !== "string"
    ) {
      return null;
    }
    return profile as VoiceCandidateProfile;
  } catch {
    return null;
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
