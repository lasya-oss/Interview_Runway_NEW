import {
  DRIVE_MATERIALS,
  driveMaterialCompanionAssetHref,
  driveMaterialPrimaryAssetHref,
  driveMaterialSlug,
  type DriveMaterial,
} from "@/app/lib/drive-materials";
import { DRIVE_MATERIAL_CONTENT } from "@/app/lib/drive-material-content";
import type { DrivePdfGuide } from "@/app/lib/drive-pdf-guides";
import type { LearningMaterial } from "@/app/lib/demo-data";

export type LibraryMaterialViewerSource = {
  fileId: string;
  filename: string;
  mimeType: string;
  title: string;
  content?: string | null;
  assetUrl?: string | null;
  fallbackAssetUrl?: string | null;
};

function pdfSource(filename: string, fileId: string, title: string): LibraryMaterialViewerSource {
  return {
    fileId,
    filename,
    mimeType: "application/pdf",
    title,
    assetUrl: `/pdf-guides/${encodeURIComponent(filename)}`,
  };
}

export function driveMaterialViewerSource(material: DriveMaterial, title = material.filename): LibraryMaterialViewerSource {
  return {
    fileId: material.id,
    filename: material.filename,
    mimeType: material.mimeType,
    title,
    content: DRIVE_MATERIAL_CONTENT[material.id],
    assetUrl: driveMaterialPrimaryAssetHref(material),
    fallbackAssetUrl: driveMaterialCompanionAssetHref(material),
  };
}

export function drivePdfViewerSource(guide: DrivePdfGuide, title: string): LibraryMaterialViewerSource {
  return pdfSource(guide.filename, guide.id, title);
}

function filenameFromPath(pathname: string) {
  const filename = pathname.split("/").filter(Boolean).pop() ?? "material.pdf";
  return decodeURIComponent(filename);
}

/**
 * Resolve the first-party source behind a LearningMaterial card. Some legacy
 * cards point at a Drive material route or a Library PDF query; the viewer
 * needs the underlying asset rather than either page shell.
 */
export function learningMaterialViewerSource(material: LearningMaterial): LibraryMaterialViewerSource | null {
  const href = material.demoAsset?.href;
  if (!href) return null;

  const url = new URL(href, "https://interviewrunway.invalid");
  const driveMaterialMatch = url.pathname.match(/^\/learn\/library\/material\/([^/]+)$/);
  if (driveMaterialMatch) {
    const driveMaterial = DRIVE_MATERIALS.find((candidate) => driveMaterialSlug(candidate) === driveMaterialMatch[1]);
    return driveMaterial ? driveMaterialViewerSource(driveMaterial, material.title) : null;
  }

  const pdfFilename = url.searchParams.get("pdf");
  if (pdfFilename) return pdfSource(pdfFilename, `learning-${material.slug}`, material.title);

  const filename = filenameFromPath(url.pathname);
  const mimeType = /\.pdf$/i.test(filename) ? "application/pdf" : "application/octet-stream";
  return {
    fileId: `learning-${material.slug}`,
    filename,
    mimeType,
    title: material.title,
    assetUrl: `${url.pathname}${url.search}`,
  };
}
