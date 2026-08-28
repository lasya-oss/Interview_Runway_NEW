import Link from "next/link";
import {
  driveMaterialCategory,
  driveMaterialKindLabel,
  driveMaterialHref,
  driveMaterialTitle,
  formatMaterialSize,
  type DriveMaterial,
} from "@/app/lib/drive-materials";

export function DriveMaterialShelf({
  materials,
  startNumber,
}: {
  materials: readonly DriveMaterial[];
  startNumber: number;
}) {
  return (
    <section className="library-drive-material-section" aria-labelledby="library-drive-material-title">
      <div className="member-section-heading">
        <div>
          <p className="member-kicker">Drive material archive</p>
          <h2 id="library-drive-material-title">Every supporting file, in its proper place.</h2>
        </div>
        <span>{materials.length} source records available</span>
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
              <span className="library-record-number">{String(startNumber + index).padStart(3, "0")}</span>
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
                <small>InterviewRunway context record</small>
                <b>Included in Library</b>
                <Link href={driveMaterialHref(material)}>
                  Open <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
