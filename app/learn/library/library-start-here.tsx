"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  driveMaterialCategory,
  driveMaterialHref,
  driveMaterialKindLabel,
  driveMaterialTitle,
  type DriveMaterial,
} from "@/app/lib/drive-materials";
import {
  drivePdfCategory,
  drivePdfPreviewHref,
  drivePdfTitle,
  type DrivePdfGuide,
} from "@/app/lib/drive-pdf-guides";
import type { LearningMaterial } from "@/app/lib/demo-data";
import type { LibraryCatalog } from "./library-catalog";

export const VAULT_START_HERE_DOMAINS = [
  {
    id: "coding",
    label: "Coding & algorithms",
    detail: "Pattern recognition, invariants, and dry runs",
  },
  {
    id: "system-design",
    label: "System design",
    detail: "Architecture, scale, reliability, and trade-offs",
  },
  {
    id: "behavioural",
    label: "Behavioural & leadership",
    detail: "Stories, ownership, influence, and communication",
  },
  {
    id: "remote",
    label: "Remote work & compensation",
    detail: "Contracts, payments, time zones, and offers",
  },
  {
    id: "career",
    label: "Career materials",
    detail: "Resume, LinkedIn, outreach, and role positioning",
  },
  {
    id: "company",
    label: "Company research",
    detail: "Public context for sharper company answers",
  },
  {
    id: "execution",
    label: "Interview execution",
    detail: "Planning, review, and interview-day readiness",
  },
] as const;

type StartHereDomain = (typeof VAULT_START_HERE_DOMAINS)[number]["id"];
type StartHereLevel = "basics" | "intermediate" | "advanced";

const LEVELS: readonly { id: StartHereLevel; label: string; detail: string }[] = [
  { id: "basics", label: "Basics", detail: "Start with the core idea and vocabulary." },
  { id: "intermediate", label: "Intermediate", detail: "Build fluency through decisions and practice." },
  { id: "advanced", label: "Advanced", detail: "Pressure-test edge cases and interview depth." },
];

type StartHereRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  format: string;
  level: StartHereLevel;
  domain: StartHereDomain;
  href: string;
  action: string;
  external?: boolean;
};

function domainForLibraryRecord(category: string, filename = ""): StartHereDomain | null {
  const normalizedCategory = category.toLowerCase();
  const normalizedFilename = filename.toLowerCase();

  // These are intentionally canonical signals from the catalog, not loose
  // keyword matches. A record is surfaced only when its source category or
  // filename family directly identifies the preparation focus.
  if (normalizedCategory === "dsa patterns" || normalizedFilename.startsWith("dsa_")) return "coding";
  if (normalizedCategory === "system design" || normalizedFilename.startsWith("sysdesign_") || normalizedFilename.startsWith("template_system-design-")) return "system-design";
  if (normalizedCategory === "behavioural" || normalizedFilename.startsWith("behavioral_") || normalizedFilename.startsWith("template_behavioral-")) return "behavioural";
  if (normalizedCategory === "remote career" || normalizedFilename.startsWith("remote_") || normalizedFilename.startsWith("template_negotiation-")) return "remote";
  if (normalizedCategory === "career signal" || normalizedFilename.startsWith("career_") || /template_(?:us-ats-resume|title-translation-guide|remote-cover-letter|outreach-|linkedin-)/.test(normalizedFilename)) return "career";
  if (normalizedCategory === "company research" || normalizedFilename.startsWith("company_")) return "company";
  if (normalizedCategory === "roadmaps" || normalizedCategory === "operations" || /template_(?:weekly-prep-tracker|recruiter-screen-notes|interview-availability)/.test(normalizedFilename)) return "execution";
  return null;
}

function levelFromLearningMaterial(material: LearningMaterial): StartHereLevel {
  if (/senior|staff/i.test(material.level)) return "advanced";
  if (/intermediate/i.test(material.level)) return "intermediate";
  return "basics";
}

function levelFromFilename(filename: string, source: "pdf" | "narrated" | "template"): StartHereLevel {
  const value = filename.toLowerCase();
  if (source === "template") return "basics";
  if (source === "narrated") return /_(?:02|03)\./.test(value) ? "intermediate" : "basics";
  if (/failure-modes|dry-run-workbook|bar-raiser|final-review|final-prep|hiring-manager|six-to-eight|evidence-and-metrics|multiple-offers|comp-benchmarking|advance-tax-calendar/.test(value)) {
    return "advanced";
  }
  if (/problem-ladder|tradeoff-matrix|interview-drill|follow-up-bank|capacity-workbook|scoring-rubric|answer-lab|resume-review|resume-projects|linkedin-skills|portfolio|referral|recruiter|cover-letter|gap-handling|total-comp|company_/.test(value)) {
    return "intermediate";
  }
  return "basics";
}

function recordFromLearningMaterial(material: LearningMaterial): StartHereRecord | null {
  const domain = domainForLibraryRecord(material.category);
  if (!domain) return null;
  const hasDirectAsset = Boolean(material.demoAsset);
  return {
    id: `lesson-${material.slug}`,
    title: material.title,
    description: material.description,
    category: material.category,
    format: material.format,
    level: levelFromLearningMaterial(material),
    domain,
    href: hasDirectAsset ? material.demoAsset!.href : `/learn/material/${material.slug}`,
    action: hasDirectAsset ? "Open actual content" : "Open lesson",
    external: hasDirectAsset,
  };
}

function recordFromPdfGuide(guide: DrivePdfGuide): StartHereRecord | null {
  const category = drivePdfCategory(guide.filename);
  const domain = domainForLibraryRecord(category, guide.filename);
  if (!domain) return null;
  return {
    id: `pdf-${guide.id}`,
    title: drivePdfTitle(guide.filename),
    description: `Original ${category.toLowerCase()} guide from the Vault Library.`,
    category,
    format: "PDF guide",
    level: levelFromFilename(guide.filename, "pdf"),
    domain,
    href: drivePdfPreviewHref(guide.id) ?? "#",
    action: "Open guide",
    external: true,
  };
}

function recordFromDriveMaterial(material: DriveMaterial): StartHereRecord | null {
  const category = driveMaterialCategory(material.filename);
  const domain = domainForLibraryRecord(category, material.filename);
  if (!domain) return null;
  const kind = driveMaterialKindLabel(material.kind);
  return {
    id: `drive-${material.id}`,
    title: driveMaterialTitle(material.filename),
    description: `Original ${kind.toLowerCase()} from the Vault production library.`,
    category,
    format: kind,
    level: levelFromFilename(material.filename, material.kind === "template" ? "template" : "narrated"),
    domain,
    href: driveMaterialHref({ id: material.id, filename: material.filename }),
    action: material.kind === "template" ? "Open template" : "Open explainer",
  };
}

function buildStartHereRecords(catalog: LibraryCatalog, isLive: boolean): readonly StartHereRecord[] {
  const records: StartHereRecord[] = [];

  catalog.materials.forEach((material) => {
    if (material.tier !== "foundation" || (isLive && material.availability !== "included")) return;
    const record = recordFromLearningMaterial(material);
    if (record) records.push(record);
  });

  catalog.pdfGuides.forEach((guide) => {
    const record = recordFromPdfGuide(guide);
    if (record) records.push(record);
  });

  // Supporting transcripts, captions, storyboards, manifests, and Second Seat
  // mock files stay in the existing Library archive; this path surfaces only
  // primary Vault lessons, guides, explainers, and editable templates.
  catalog.driveMaterials.forEach((material) => {
    if (material.kind !== "narrated" && material.kind !== "template") return;
    const record = recordFromDriveMaterial(material);
    if (record) records.push(record);
  });

  return records;
}

export function VaultStartHere({
  catalog,
  isLive,
}: {
  catalog: LibraryCatalog | null;
  isLive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<StartHereDomain | "">("");
  const allRecords = useMemo(() => (catalog ? buildStartHereRecords(catalog, isLive) : []), [catalog, isLive]);
  const matchingRecords = useMemo(
    () => allRecords.filter((record) => !domain || record.domain === domain),
    [allRecords, domain],
  );
  const hasSelection = Boolean(domain);

  const clearSelection = () => {
    setDomain("");
  };

  return (
    <section className="library-start-here" aria-labelledby="library-start-here-title">
      <div className="library-start-here__intro">
        <div>
          <p className="member-kicker">A guided first step</p>
          <h2 id="library-start-here-title">New to interview preparation?</h2>
          <p>Not sure where to start? Build your preparation from the right foundation.</p>
        </div>
        <button
          className="library-start-here__toggle"
          type="button"
          aria-expanded={open}
          aria-controls="library-start-here-panel"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide guide" : "Start here"} <span aria-hidden="true">{open ? "↑" : "↓"}</span>
        </button>
      </div>

      {open ? (
        <div id="library-start-here-panel" className="library-start-here__panel">
          <div className="library-start-here__copy">
            <p className="member-kicker">Choose your focus</p>
            <p>These fixed paths are based on the Vault’s existing lesson, guide, explainer, and template metadata. Each focus shows only directly relevant primary material.</p>
          </div>

          <div className="library-start-here__filters" aria-label="Start here filters">
            <label>
              <span>Choose your focus</span>
              <select value={domain} onChange={(event) => setDomain(event.target.value as StartHereDomain | "")}>
                <option value="">Select a focus</option>
                {VAULT_START_HERE_DOMAINS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
              </select>
              <small>{domain ? VAULT_START_HERE_DOMAINS.find((item) => item.id === domain)?.detail : "Choose the interview decision you want to practise."}</small>
            </label>
            {hasSelection ? <button className="library-start-here__clear" type="button" onClick={clearSelection}>Clear selection</button> : null}
          </div>

          {!catalog ? (
            <div className="library-start-here__loading" aria-busy="true">Loading the Vault starting paths…</div>
          ) : !hasSelection ? (
            <div className="library-start-here__prompt">Select a focus to see the directly relevant Library content.</div>
          ) : (
            <div className="library-start-here__results" aria-live="polite">
              <div className="library-start-here__summary">
                <strong>{matchingRecords.length.toLocaleString("en-IN")}</strong>
                <span>{matchingRecords.length === 1 ? "matching item" : "matching items"}</span>
              </div>
              {LEVELS.map((level) => {
                const records = matchingRecords.filter((record) => record.level === level.id);
                return (
                  <section className="library-start-here__level" aria-labelledby={`library-start-here-${level.id}`} key={level.id}>
                    <header>
                      <div>
                        <p className="member-kicker">{level.detail}</p>
                        <h3 id={`library-start-here-${level.id}`}>{level.label}</h3>
                      </div>
                      <span>{records.length.toLocaleString("en-IN")} {records.length === 1 ? "item" : "items"}</span>
                    </header>
                    {records.length ? (
                      <div className="library-start-here__resource-grid">
                        {records.map((record) => (
                          <article className="library-start-here__resource" key={record.id}>
                            <small>{record.category} · {record.format}</small>
                            <h4>{record.title}</h4>
                            <p>{record.description}</p>
                            <Link href={record.href} target={record.external ? "_blank" : undefined} rel={record.external ? "noreferrer" : undefined}>
                              {record.action} <span aria-hidden="true">↗</span>
                            </Link>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="library-start-here__empty">No matching Vault material at this level.</p>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
