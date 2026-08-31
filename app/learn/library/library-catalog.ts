import { DRIVE_MATERIALS, driveMaterialCategory, type DriveMaterial } from "@/app/lib/drive-materials";
import { DRIVE_PDF_GUIDES, drivePdfCategory, type DrivePdfGuide } from "@/app/lib/drive-pdf-guides";
import { LEARNING_MATERIALS, type LearningMaterial } from "@/app/lib/demo-data";

const VAULT_LEGACY_PDF_FILENAMES = new Set(["roadmap_4week.pdf"]);

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

export function getLibraryCatalog(isLive: boolean): LibraryCatalog {
  return {
    materials: LEARNING_MATERIALS,
    pdfGuides: isLive
      ? DRIVE_PDF_GUIDES.filter((guide) => !VAULT_LEGACY_PDF_FILENAMES.has(guide.filename))
      : DRIVE_PDF_GUIDES,
    driveMaterials: DRIVE_MATERIALS,
  };
}

export function getLibraryCategorySummary(isLive: boolean): LibraryCategorySummary {
  const catalog = getLibraryCatalog(isLive);
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
