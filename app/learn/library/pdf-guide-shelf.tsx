"use client";

import {
  drivePdfCategory,
  drivePdfTitle,
  type DrivePdfGuide,
} from "@/app/lib/drive-pdf-guides";
import { LibraryMaterialDialog } from "./library-material-dialog";
import { LIBRARY_OPEN_LABEL } from "./library-copy";
import { drivePdfViewerSource } from "./library-material-source";

export function PdfGuideShelf({
  guides,
  startNumber,
  initialFilename = null,
}: {
  guides: readonly DrivePdfGuide[];
  startNumber: number;
  initialFilename?: string | null;
}) {
  return (
      <div className="library-record-list library-pdf-record-list">
        {guides.map((guide, index) => {
          const title = drivePdfTitle(guide.filename);
          const category = drivePdfCategory(guide.filename);

          return (
            <article className="library-record library-pdf-record" key={guide.id}>
              <span className="library-record-number">{String(startNumber + index).padStart(2, "0")}</span>
              <div className="library-record-copy">
                <small>{category} · PDF guide</small>
                <h2>{title}</h2>
                <p>Original {category.toLowerCase()} material connected to the InterviewRunway learning path.</p>
                <div><span>Original PDF</span><span>Read in workspace</span></div>
              </div>
              <div className="library-record-meta">
                <span>PDF · Original guide</span>
                <small>In-app reader</small>
                <b>Included in Library</b>
                <LibraryMaterialDialog
                  source={drivePdfViewerSource(guide, title)}
                  title={title}
                  eyebrow={`${category} · PDF guide`}
                  description="Open the guide here without leaving InterviewRunway."
                  buttonLabel={LIBRARY_OPEN_LABEL}
                  buttonClassName="library-record-open"
                  buttonAriaLabel={`Open ${title} inside InterviewRunway`}
                  initialOpen={initialFilename === guide.filename}
                />
              </div>
            </article>
          );
        })}
      </div>
  );
}
