import type { Metadata } from "next";
import { isActivePdfFilename } from "@/app/lib/active-library-selection";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { getLibraryCategorySummary } from "./library-catalog";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Library | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ pdf?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedPdf = Array.isArray(params.pdf) ? params.pdf[0] : params.pdf;
  const initialPdfFilename = requestedPdf && isActivePdfFilename(requestedPdf) ? requestedPdf : null;
  const profile = await requireDemoProfile("/learn/library");
  const isLive = profile.isLive === true;

  return (
    <div className="member-page">
      <LibraryClient
        profileId={profile.id}
        isLive={isLive}
        googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""}
        loginHint={profile.email}
        categorySummary={getLibraryCategorySummary(isLive, profile.id)}
        initialPdfFilename={initialPdfFilename}
      />
    </div>
  );
}
