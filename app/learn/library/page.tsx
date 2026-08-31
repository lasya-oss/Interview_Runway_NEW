import type { Metadata } from "next";
import { MemberShell } from "@/app/components/member-shell";
import { DRIVE_MATERIALS } from "@/app/lib/drive-materials";
import { DRIVE_PDF_GUIDES } from "@/app/lib/drive-pdf-guides";
import { LEARNING_MATERIALS } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Library | Learner workspace",
  robots: { index: false, follow: false },
};

const VAULT_LEGACY_PDF_FILENAMES = new Set(["roadmap_4week.pdf"]);

export default async function LibraryPage() {
  const profile = await requireDemoProfile("/learn/library");

  return (
    <MemberShell profile={profile} active="library">
      <div className="member-page">
        <LibraryClient
          profileId={profile.id}
          isLive={profile.isLive === true}
          googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""}
          loginHint={profile.email}
          materials={LEARNING_MATERIALS}
          pdfGuides={profile.isLive ? DRIVE_PDF_GUIDES.filter((guide) => !VAULT_LEGACY_PDF_FILENAMES.has(guide.filename)) : DRIVE_PDF_GUIDES}
          driveMaterials={DRIVE_MATERIALS}
        />
      </div>
    </MemberShell>
  );
}
