"use client";

import {
  driveMaterialCategory,
  driveMaterialKindLabel,
  driveMaterialTitle,
  formatMaterialSize,
  type DriveMaterial,
} from "@/app/lib/drive-materials";
import { LibraryMaterialDialog } from "./library-material-dialog";
import { formatLibraryRecordNumber, LIBRARY_OPEN_LABEL } from "./library-copy";
import { driveMaterialViewerSource } from "./library-material-source";

export function DriveMaterialShelf({
  materials,
  startNumber,
  googleClientId = "",
  loginHint = null,
}: {
  materials: readonly DriveMaterial[];
  startNumber: number;
  googleClientId?: string;
  loginHint?: string | null;
}) {
  return (
    <section className="library-drive-material-section" aria-labelledby="library-drive-material-title">
      <div className="member-section-heading">
        <div>
          <p className="member-kicker">Drive material archive</p>
          <h2 id="library-drive-material-title">Every supporting file, in its proper place.</h2>
        </div>
        <span>{materials.length} source files available</span>
      </div>
      <p className="library-drive-material-intro">
        Templates, explainers, transcripts, captions, storyboards, mock audio, scripts, and evidence packs from the supplied course folder.
      </p>

      <div className="library-record-list library-drive-record-list">
        {materials.map((material, index) => {
          const category = driveMaterialCategory(material.filename);
          const kind = driveMaterialKindLabel(material.kind);
          const title = driveMaterialTitle(material.filename);

          return (
            <article className="library-record library-drive-record" key={material.id}>
              <span className="library-record-number">{formatLibraryRecordNumber(startNumber + index)}</span>
              <div className="library-record-copy">
                <small>{category} · {kind}</small>
                <h2>{title}</h2>
                <p>Original {kind.toLowerCase()} from the {material.collection.toLowerCase()} collection.</p>
                <div>
                  <span>{formatMaterialSize(material.bytes)}</span>
                  <span>Source preserved</span>
                </div>
              </div>
              <div className="library-record-meta">
                <span>{kind} · {formatMaterialSize(material.bytes)}</span>
                  <small>InterviewRunway material</small>
                  <b>Included in Library</b>
                <LibraryMaterialDialog
                  source={driveMaterialViewerSource(material, title)}
                  title={title}
                  eyebrow={`${category} · ${kind}`}
                  description="Open the material here without leaving InterviewRunway."
                  buttonLabel={LIBRARY_OPEN_LABEL}
                  buttonClassName="library-record-open"
                  buttonAriaLabel={`Open ${title} inside InterviewRunway`}
                  googleClientId={googleClientId}
                  loginHint={loginHint}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
