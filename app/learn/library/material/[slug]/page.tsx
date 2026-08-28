import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberShell } from "@/app/components/member-shell";
import {
  driveMaterialCategory,
  driveMaterialCompanionAssetHref,
  driveMaterialKindLabel,
  driveMaterialTitle,
  driveMaterialPrimaryAssetHref,
  findDriveMaterial,
  formatMaterialSize,
  DRIVE_MATERIALS,
} from "@/app/lib/drive-materials";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { DRIVE_MATERIAL_CONTENT } from "@/app/lib/drive-material-content";
import { MaterialViewer } from "../../material-viewer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drive material | Learner workspace",
  robots: { index: false, follow: false },
};

function materialNumber(id: string) {
  const index = DRIVE_MATERIALS.findIndex((material) => material.id === id);
  return index >= 0 ? String(index + 1).padStart(3, "0") : "—";
}

export default async function DriveMaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const material = findDriveMaterial(slug);
  if (!material) notFound();

  const profile = await requireDemoProfile(`/learn/library/material/${slug}`);
  const category = driveMaterialCategory(material.filename);
  const kind = driveMaterialKindLabel(material.kind);
  const title = driveMaterialTitle(material.filename);
  const number = materialNumber(material.id);

  return (
    <MemberShell profile={profile} active="library">
      <article className="member-page material-workspace drive-material-workspace">
        <nav className="material-breadcrumb" aria-label="Breadcrumb">
          <Link href="/learn/library">Library</Link><span>/</span><span>{category}</span><span>/</span><strong>{number}</strong>
        </nav>

        <header className="material-header">
          <div>
            <p className="member-kicker">{material.collection} · {kind}</p>
            <h1>{title}</h1>
            <p>Original material from the supplied Drive folder, catalogued and discoverable inside the InterviewRunway workspace.</p>
          </div>
          <dl>
            <div><dt>Record</dt><dd>{number}</dd></div>
            <div><dt>Format</dt><dd>{kind}</dd></div>
            <div><dt>Size</dt><dd>{formatMaterialSize(material.bytes)}</dd></div>
          </dl>
        </header>

        <div className="material-layout">
          <section className="material-stage drive-material-stage" aria-labelledby="drive-material-stage-title">
            <div className="material-stage-top"><span>Drive archive / {number}</span><b>Original file preserved</b></div>
            <div className="library-material-viewer" aria-labelledby="drive-material-stage-title">
              <div className="library-material-viewer-label"><span>Open material</span><b>{kind}</b></div>
              <h2 id="drive-material-stage-title">{title}</h2>
              <MaterialViewer
                fileId={material.id}
                filename={material.filename}
                mimeType={material.mimeType}
                title={title}
                content={DRIVE_MATERIAL_CONTENT[material.id]}
                assetUrl={driveMaterialPrimaryAssetHref(material)}
                fallbackAssetUrl={driveMaterialCompanionAssetHref(material)}
              />
            </div>
            <div className="material-stage-controls"><span>01</span><i><b /></i><span>{category}</span></div>
          </section>

          <aside className="material-notes drive-material-notes">
            <p className="member-kicker">Source record</p>
            <div>
              <span>Collection</span>
              <p>{material.collection}</p>
            </div>
          </aside>
        </div>
      </article>
    </MemberShell>
  );
}
