import type { Metadata } from "next";
import { MemberShell } from "@/app/components/member-shell";
import { LEARNING_MATERIALS } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Library | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function LibraryPage() {
  const profile = await requireDemoProfile("/learn/library");

  return (
    <MemberShell profile={profile} active="library">
      <div className="member-page">
        <LibraryClient profileId={profile.id} materials={LEARNING_MATERIALS} />
      </div>
    </MemberShell>
  );
}
