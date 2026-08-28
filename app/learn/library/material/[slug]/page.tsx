import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberShell } from "@/app/components/member-shell";
import {
  driveMaterialCategory,
  driveMaterialKindLabel,
  driveMaterialTitle,
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

function materialDecision(kind: string) {
  if (kind === "template") return "Use this editable template as the working surface for a real interview-preparation task.";
  if (kind === "transcript" || kind === "caption" || kind === "mock-script") return "Read the written record alongside the relevant practice or explainer material.";
  if (kind === "narrated" || kind === "silent" || kind === "mock-audio") return "Open the original media when you want another pass through the explanation or mock-interview exchange.";
  if (kind === "storyboard") return "Use the production record to understand the visual sequence behind the learning material.";
  return "Use this evidence record to trace how the supplied learning material was assembled and checked.";
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
              />
            </div>
            <p>Material context</p>
            <h2 className="library-material-decision">{materialDecision(material.kind)}</h2>
            <div className="material-stage-controls"><span>01</span><i><b /></i><span>{category}</span></div>
          </section>

          <aside className="material-notes drive-material-notes">
            <p className="member-kicker">Source record</p>
            <blockquote>Keep the original asset intact; use the Library record to decide when it belongs in your preparation loop.</blockquote>
            <div>
              <span>Collection</span>
              <p>{material.collection}</p>
            </div>
            <div className="drive-material-source-link">
              <span>In-site viewer</span>
              <strong>Open</strong>
              <small>The original material opens inside InterviewRunway and remains unchanged.</small>
            </div>
          </aside>
        </div>

        <footer className="material-next-step">
          <div><p className="member-kicker">Back to the archive</p><h2>Keep the next decision close to the material.</h2><p>This context page catalogues the supplied file without rewriting, moving, or modifying the original Drive asset.</p></div>
          <Link className="member-primary-button" href="/learn/library">Return to Library <span aria-hidden="true">↗</span></Link>
        </footer>
      </article>
    </MemberShell>
  );
}
