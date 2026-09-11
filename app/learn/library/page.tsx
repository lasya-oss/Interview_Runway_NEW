import type { Metadata } from "next";
import { isActivePdfFilename } from "@/app/lib/active-library-selection";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { findRoadmapTask } from "@/app/lib/roadmap-data";
import { getLibraryCategorySummary, getLibraryCatalog } from "./library-catalog";
import { LibraryClient } from "./library-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Library | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    pdf?: string | string[];
    from?: string | string[];
    task?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requestedPdf = Array.isArray(params.pdf) ? params.pdf[0] : params.pdf;
  const initialPdfFilename = requestedPdf && isActivePdfFilename(requestedPdf) ? requestedPdf : null;
  const requestedOrigin = Array.isArray(params.from) ? params.from[0] : params.from;
  const requestedTask = Array.isArray(params.task) ? params.task[0] : params.task;
  const returnTo = initialPdfFilename && requestedOrigin === "roadmap" && requestedTask && findRoadmapTask(requestedTask)
    ? `/learn/roadmap#roadmap-task-${encodeURIComponent(requestedTask)}`
    : null;
  const profile = await requireDemoProfile("/learn/library");
  const isLive = profile.isLive === true;

  return (
    <div className="member-page">
      <LibraryClient
        profileId={profile.id}
        availablePlans={profile.availablePlans}
        isLive={isLive}
        googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""}
        loginHint={profile.email}
        categorySummary={getLibraryCategorySummary(isLive, profile.id)}
        initialPdfFilename={initialPdfFilename}
        initialCatalog={initialPdfFilename ? getLibraryCatalog(isLive, profile.id) : null}
        returnTo={returnTo}
      />
    </div>
  );
}
