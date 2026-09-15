import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { ACTIVE_DRIVE_RECORD_KEY_SET, ACTIVE_PDF_FILENAME_SET } from "@/app/lib/active-library-selection";
import {
  DRIVE_MATERIALS,
  driveMaterialCategory,
  driveMaterialCompanionFilename,
} from "@/app/lib/drive-materials";
import { DRIVE_PDF_GUIDES, drivePdfCategory } from "@/app/lib/drive-pdf-guides";

const root = process.cwd();
const publicPdfRoot = join(root, "public", "pdf-guides");
const publicDriveRoot = join(root, "public", "drive-materials");
const archiveRoot = join(root, "library-archive");
const archivePdfRoot = join(archiveRoot, "pdf-guides");
const archiveDriveRoot = join(archiveRoot, "drive-materials");

if (existsSync(archiveRoot)) {
  throw new Error("library-archive already exists; refusing to overwrite an existing backup");
}

mkdirSync(archivePdfRoot, { recursive: true });
mkdirSync(archiveDriveRoot, { recursive: true });

const activeDriveRecords = DRIVE_MATERIALS.filter((material) =>
  ACTIVE_DRIVE_RECORD_KEY_SET.has(`${material.kind}:${material.filename}`),
);
const activeDriveFileNames = new Set<string>();
const retainedCompanionFileNames = new Set<string>();

for (const material of activeDriveRecords) {
  activeDriveFileNames.add(material.filename);
  const companion = driveMaterialCompanionFilename(material);
  if (companion) retainedCompanionFileNames.add(companion);
}

type ArchivedFile = {
  originalPath: string;
  archivePath: string;
  bytes: number;
  sha256: string;
};

function moveFile(sourceRoot: string, relativeName: string, destinationRoot: string): ArchivedFile {
  const source = join(sourceRoot, relativeName);
  const destination = join(destinationRoot, basename(relativeName));
  if (!existsSync(source)) throw new Error(`Expected source file is missing: ${relativeName}`);
  if (existsSync(destination)) throw new Error(`Archive target already exists: ${relativeName}`);

  const bytes = readFileSync(source);
  renameSync(source, destination);
  return {
    originalPath: source.slice(root.length + 1),
    archivePath: destination.slice(root.length + 1),
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

const archivedPdfFiles: ArchivedFile[] = [];
for (const guide of DRIVE_PDF_GUIDES) {
  if (!ACTIVE_PDF_FILENAME_SET.has(guide.filename)) {
    archivedPdfFiles.push(moveFile(publicPdfRoot, guide.filename, archivePdfRoot));
  }
}

const archivedDriveFiles: ArchivedFile[] = [];
const driveFiles = readFileNames(publicDriveRoot);
for (const filename of driveFiles) {
  if (activeDriveFileNames.has(filename) || retainedCompanionFileNames.has(filename)) continue;
  archivedDriveFiles.push(moveFile(publicDriveRoot, filename, archiveDriveRoot));
}

const archivedPdfRecords = DRIVE_PDF_GUIDES
  .filter((guide) => !ACTIVE_PDF_FILENAME_SET.has(guide.filename))
  .map((guide) => ({
    ...guide,
    category: drivePdfCategory(guide.filename),
    localArchivePath: `library-archive/pdf-guides/${guide.filename}`,
  }));

const archivedDriveRecords = DRIVE_MATERIALS
  .filter((material) => !ACTIVE_DRIVE_RECORD_KEY_SET.has(`${material.kind}:${material.filename}`))
  .map((material) => ({
    ...material,
    category: driveMaterialCategory(material.filename),
    localArchivePath: archivedDriveFiles.find((file) => file.originalPath === `public/drive-materials/${material.filename}`)?.archivePath ?? null,
    localAssetStatus: existsSync(join(publicDriveRoot, material.filename)) ? "retained-as-active-or-companion" : "archived-or-not-mirrored",
  }));

const manifest = {
  generatedAt: new Date().toISOString(),
  purpose: "Reversible archive for the Library curation requested on 2026-09-02.",
  activeCatalog: {
    authoredLessons: 19,
    pdfGuides: DRIVE_PDF_GUIDES.filter((guide) => ACTIVE_PDF_FILENAME_SET.has(guide.filename)).length,
    driveRecords: activeDriveRecords.length,
    totalNonLive: 19 + ACTIVE_PDF_FILENAME_SET.size + activeDriveRecords.length,
    totalLive: 19 + ACTIVE_PDF_FILENAME_SET.size - 1 + activeDriveRecords.length,
  },
  archived: {
    pdfRecords: archivedPdfRecords.length,
    driveRecords: archivedDriveRecords.length,
    localPdfFiles: archivedPdfFiles.length,
    localDriveFiles: archivedDriveFiles.length,
  },
  archivedPdfRecords,
  archivedDriveRecords,
  archivedPdfFiles,
  archivedDriveFiles,
};

writeFileSync(join(archiveRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

function readFileNames(directory: string) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}
