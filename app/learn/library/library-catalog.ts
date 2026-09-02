import { DRIVE_MATERIALS, driveMaterialCategory, type DriveMaterial } from "@/app/lib/drive-materials";
import { DRIVE_PDF_GUIDES, drivePdfCategory, type DrivePdfGuide } from "@/app/lib/drive-pdf-guides";
import { LEARNING_MATERIALS, type DemoTier, type LearningMaterial } from "@/app/lib/demo-data";
import { ACTIVE_DRIVE_RECORD_KEY_SET, ACTIVE_PDF_FILENAME_SET } from "@/app/lib/active-library-selection";

const VAULT_LEGACY_PDF_FILENAMES = new Set(["roadmap_4week.pdf"]);
const SECOND_SEAT_DEMO_SHELL_SLUGS = new Set([
  "metrics-pipeline-mock",
  "queue-backlog-mock",
  "resume-signal-lab",
  "negotiation-rehearsal",
]);

export type LibraryCatalog = {
  materials: readonly LearningMaterial[];
  pdfGuides: readonly DrivePdfGuide[];
  driveMaterials: readonly DriveMaterial[];
};

export type LibraryCategorySummary = {
  categories: readonly string[];
  counts: Readonly<Record<string, number>>;
  total: number;
};

export function getLibraryCatalog(isLive: boolean, profileId: DemoTier): LibraryCatalog {
  return {
    // Keep the source catalogue intact, but do not surface the four generic
    // practice shells in the learner-facing Second Seat library.
    materials: profileId === "practice"
      ? LEARNING_MATERIALS.filter((material) => !SECOND_SEAT_DEMO_SHELL_SLUGS.has(material.slug))
      : LEARNING_MATERIALS,
    pdfGuides: isLive
      ? DRIVE_PDF_GUIDES.filter((guide) => ACTIVE_PDF_FILENAME_SET.has(guide.filename) && !VAULT_LEGACY_PDF_FILENAMES.has(guide.filename))
      : DRIVE_PDF_GUIDES.filter((guide) => ACTIVE_PDF_FILENAME_SET.has(guide.filename)),
    // Keep the same curated, high-value supporting records visible in both
    // learner plans. The complete source archive remains available for
    // restoration, while low-value records stay outside the active catalog.
    driveMaterials: DRIVE_MATERIALS.filter((material) => ACTIVE_DRIVE_RECORD_KEY_SET.has(`${material.kind}:${material.filename}`)),
  };
}

export function getLibraryCategorySummary(isLive: boolean, profileId: DemoTier): LibraryCategorySummary {
  const catalog = getLibraryCatalog(isLive, profileId);
  const counts = new Map<string, number>();
  const add = (category: string) => counts.set(category, (counts.get(category) ?? 0) + 1);

  catalog.materials.forEach((material) => add(material.category));
  catalog.pdfGuides.forEach((guide) => add(drivePdfCategory(guide.filename)));
  catalog.driveMaterials.forEach((material) => add(driveMaterialCategory(material.filename)));

  return {
    categories: ["All", ...counts.keys()],
    counts: Object.fromEntries(counts),
    total: catalog.materials.length + catalog.pdfGuides.length + catalog.driveMaterials.length,
  };
}
