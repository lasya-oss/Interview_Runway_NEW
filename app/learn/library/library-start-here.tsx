"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  driveMaterialCategory,
  driveMaterialKindLabel,
  driveMaterialPreviewHref,
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
export type StartHerePlan = "vault" | "second-seat";

const START_HERE_COPY: Record<StartHerePlan, {
  eyebrow: string;
  title: string;
  intro: string;
  panelEyebrow: string;
  panelDescription: string;
  loading: string;
  selectionPrompt: string;
  levelPrompt: string;
  empty: string;
}> = {
  vault: {
    eyebrow: "A guided first step",
    title: "New to interview preparation?",
    intro: "Not sure where to start? Build your preparation from the right foundation.",
    panelEyebrow: "Choose your focus",
    panelDescription: "These guided paths group the Vault’s existing lessons, guides, explainers, and templates. Each focus shows only material directly related to it.",
    loading: "Loading the Vault starting paths…",
    selectionPrompt: "Select a focus to see the directly relevant Library materials.",
    levelPrompt: "Choose a level to view only its relevant Vault materials.",
    empty: "No matching Vault material at this level.",
  },
  "second-seat": {
    eyebrow: "A guided first practice",
    title: "New to interview preparation?",
    intro: "Not sure where to start? Build your next practice round from the right foundation.",
    panelEyebrow: "Choose your practice focus",
    panelDescription: "These guided paths combine the Vault foundation with the Second Seat’s existing practice material. Each focus shows material directly related to your next round.",
    loading: "Loading the Second Seat starting paths…",
    selectionPrompt: "Select a focus to see the directly relevant Second Seat materials.",
    levelPrompt: "Choose a level to view only its relevant Second Seat materials.",
    empty: "No matching Second Seat material at this level.",
  },
};

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

function domainForLibraryRecord(category: string, filename = "", context = ""): StartHereDomain | null {
  const normalizedCategory = category.toLowerCase();
  const normalizedFilename = filename.toLowerCase();
  const normalizedContext = `${category} ${filename} ${context}`.toLowerCase();

  // These are intentionally canonical signals from the catalog, not loose
  // keyword matches. A record is surfaced only when its source category or
  // filename family directly identifies the preparation focus.
  if (normalizedCategory === "dsa patterns" || normalizedFilename.startsWith("dsa_")) return "coding";
  if (normalizedCategory === "system design" || normalizedFilename.startsWith("sysdesign_") || normalizedFilename.startsWith("template_system-design-")) return "system-design";
  if (normalizedCategory === "behavioural" || normalizedFilename.startsWith("behavioral_") || normalizedFilename.startsWith("template_behavioral-")) return "behavioural";
  if (normalizedCategory === "remote career" || normalizedFilename.startsWith("remote_") || normalizedFilename.startsWith("template_negotiation-")) return "remote";
  if (normalizedCategory === "career profile" || normalizedFilename.startsWith("career_") || /template_(?:us-ats-resume|title-translation-guide|remote-cover-letter|outreach-|linkedin-)/.test(normalizedFilename)) return "career";
  if (normalizedCategory === "company research" || normalizedFilename.startsWith("company_")) return "company";
  if (normalizedCategory === "roadmaps" || normalizedCategory === "operations" || /template_(?:weekly-prep-tracker|recruiter-screen-notes|interview-availability)/.test(normalizedFilename)) return "execution";
  if (normalizedCategory === "ai practice") {
    if (/negotiat|compensation|\busd\b/.test(normalizedContext)) return "remote";
    if (/design|service|pipeline|queue|backlog|metrics|delivery|scale|reliability/.test(normalizedContext)) return "system-design";
    return "execution";
  }
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
  const domain = domainForLibraryRecord(material.category, "", `${material.title} ${material.description} ${material.tags.join(" ")}`);
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
    href: driveMaterialPreviewHref(material),
    action: material.kind === "template" ? "Open template" : "Open explainer",
    external: true,
  };
}

function buildStartHereRecords(catalog: LibraryCatalog, isLive: boolean, plan: StartHerePlan): readonly StartHereRecord[] {
  const records: StartHereRecord[] = [];

  catalog.materials.forEach((material) => {
    const belongsToPlan = material.tier === "foundation" || (plan === "second-seat" && material.tier === "practice");
    if (!belongsToPlan || (isLive && material.tier === "foundation" && material.availability !== "included")) return;
    const record = recordFromLearningMaterial(material);
    if (record) records.push(record);
  });

  catalog.pdfGuides.forEach((guide) => {
    const record = recordFromPdfGuide(guide);
    if (record) records.push(record);
  });

  // Supporting transcripts, captions, storyboards, manifests, and Second Seat
  // mock files stay in the existing Library archive; this path surfaces only
  // primary lessons, guides, explainers, and editable templates.
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
  plan = "vault",
}: {
  catalog: LibraryCatalog | null;
  isLive: boolean;
  plan?: StartHerePlan;
}) {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<StartHereDomain | "">("");
  const [selectedLevel, setSelectedLevel] = useState<StartHereLevel | "">("");
  const learningPathRef = useRef<HTMLDivElement>(null);
  const copy = START_HERE_COPY[plan];
  const allRecords = useMemo(() => (catalog ? buildStartHereRecords(catalog, isLive, plan) : []), [catalog, isLive, plan]);
  const matchingRecords = useMemo(
    () => allRecords.filter((record) => !domain || record.domain === domain),
    [allRecords, domain],
  );
  const hasSelection = Boolean(domain);

  useEffect(() => {
    if (!domain || !catalog) return;
    const frame = window.requestAnimationFrame(() => {
      learningPathRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      learningPathRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [catalog, domain]);

  const clearSelection = () => {
    setDomain("");
    setSelectedLevel("");
  };

  return (
    <section className="library-start-here" aria-labelledby="library-start-here-title">
      <div className="library-start-here__intro">
        <div>
          <p className="member-kicker">{copy.eyebrow}</p>
          <h2 id="library-start-here-title">{copy.title}</h2>
          <p>{copy.intro}</p>
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
            <p className="member-kicker">{copy.panelEyebrow}</p>
            <p>{copy.panelDescription}</p>
          </div>

          <div className="library-start-here__filters" aria-label="Start here filters">
            <label>
              <span>Choose your focus</span>
              <select
                value={domain}
                onChange={(event) => {
                  setDomain(event.target.value as StartHereDomain | "");
                  setSelectedLevel("");
                }}
              >
                <option value="">Select a focus</option>
                {VAULT_START_HERE_DOMAINS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
              </select>
              <small>{domain ? VAULT_START_HERE_DOMAINS.find((item) => item.id === domain)?.detail : "Choose the interview decision you want to practise."}</small>
            </label>
            {hasSelection ? <button className="library-start-here__clear" type="button" onClick={clearSelection}>Clear selection</button> : null}
          </div>

          {!catalog ? (
            <div className="library-start-here__loading" aria-busy="true">{copy.loading}</div>
          ) : !hasSelection ? (
            <div className="library-start-here__prompt">{copy.selectionPrompt}</div>
          ) : (
            <div
              ref={learningPathRef}
              className="library-start-here__results"
              aria-live="polite"
              tabIndex={-1}
            >
              <div className="library-start-here__summary">
                <strong>{matchingRecords.length.toLocaleString("en-IN")}</strong>
                <span>{matchingRecords.length === 1 ? "directly relevant material" : "directly relevant materials"}</span>
              </div>
              <div className="library-start-here__levels" aria-label={`${matchingRecords.length.toLocaleString("en-IN")} materials by learning level`}>
                {LEVELS.map((level) => {
                  const count = matchingRecords.filter((record) => record.level === level.id).length;
                  const selected = selectedLevel === level.id;
                  return (
                    <button
                      className={`library-start-here__level-card${selected ? " is-selected" : ""}`}
                      type="button"
                      aria-expanded={selected}
                      aria-label={`${level.label}: ${count} ${count === 1 ? "material" : "materials"}. ${selected ? "Selected" : "Show level"}`}
                      onClick={() => setSelectedLevel(level.id)}
                      key={level.id}
                    >
                      <span className="library-start-here__level-card-label">{level.label}</span>
                      <span className="library-start-here__level-card-count">
                        <strong>{count.toLocaleString("en-IN")}</strong>
                        <small>{count === 1 ? "material" : "materials"}</small>
                      </span>
                      <p>{level.detail}</p>
                      <span className="library-start-here__level-card-action">{selected ? "Selected level" : "View level"} <b aria-hidden="true">↗</b></span>
                    </button>
                  );
                })}
              </div>

              {selectedLevel ? (() => {
                const level = LEVELS.find((item) => item.id === selectedLevel)!;
                const records = matchingRecords.filter((record) => record.level === selectedLevel);
                return (
                  <section
                    className="library-start-here__selected-level"
                    aria-labelledby={`library-start-here-${selectedLevel}`}
                    id={`library-start-here-${selectedLevel}-records`}
                  >
                    <header>
                      <div>
                        <p className="member-kicker">{level.detail}</p>
                        <h3 id={`library-start-here-${selectedLevel}`}>{level.label}</h3>
                      </div>
                      <span>{records.length.toLocaleString("en-IN")} {records.length === 1 ? "material" : "materials"}</span>
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
                      <p className="library-start-here__empty">{copy.empty}</p>
                    )}
                  </section>
                );
              })() : (
                <p className="library-start-here__prompt">{copy.levelPrompt}</p>
              )}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
