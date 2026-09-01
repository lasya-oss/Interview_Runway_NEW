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

export const VAULT_START_HERE_ROLES = [
  {
    id: "backend",
    label: "Backend engineer",
    detail: "APIs, data, services, and reliable delivery",
  },
  {
    id: "platform",
    label: "Platform / infrastructure engineer",
    detail: "Distributed systems, scale, and operations",
  },
  {
    id: "product",
    label: "Frontend / full-stack engineer",
    detail: "Product delivery, coding, and system fluency",
  },
  {
    id: "leadership",
    label: "Engineering lead / manager",
    detail: "Influence, execution, and people-facing signals",
  },
] as const;

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

type StartHereRole = (typeof VAULT_START_HERE_ROLES)[number]["id"];
type StartHereDomain = (typeof VAULT_START_HERE_DOMAINS)[number]["id"];
type StartHereLevel = "basics" | "intermediate" | "advanced";

const ALL_ROLES: readonly StartHereRole[] = ["backend", "platform", "product", "leadership"];
const ENGINEERING_ROLES: readonly StartHereRole[] = ["backend", "platform", "product"];
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
  roles: readonly StartHereRole[];
  domains: readonly StartHereDomain[];
  href: string;
  action: string;
  external?: boolean;
};

function domainsForCategory(category: string, filename = ""): readonly StartHereDomain[] {
  const value = `${category} ${filename}`.toLowerCase();
  if (/dsa|coding|algorithm|binary|bfs|dfs|pointer|graph|heap|trie|backtrack/.test(value)) return ["coding"];
  if (/system[- ]design|sysdesign|architecture|api[- ]gateway|database|cach|queue|storage|observability|consistency/.test(value)) return ["system-design"];
  if (/behavio|story|star|ownership|leadership|influence|manager|communication/.test(value)) return ["behavioural"];
  if (/career|resume|linkedin|recruiter|outreach|referral|portfolio|cover[- ]letter|title[- ]translation|ats[- ]resume/.test(value)) return ["career"];
  if (/remote|compensation|contract|tax|payment|timezone|relocation|visa|negotiation/.test(value)) return ["remote"];
  if (/company|employer/.test(value)) return ["company"];
  if (/roadmap|operations|planning|weekly[- ]prep|interview[- ]day|interview[- ]availability|debrief|run[- ]sheet|mock|practice|tracker/.test(value)) return ["execution"];
  return [];
}

function rolesForDomains(domains: readonly StartHereDomain[]): readonly StartHereRole[] {
  if (domains.includes("coding")) return ENGINEERING_ROLES;
  return ALL_ROLES;
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
  const domains = domainsForCategory(material.category, `${material.title} ${material.tags.join(" ")}`);
  if (!domains.length) return null;
  const hasDirectAsset = Boolean(material.demoAsset);
  return {
    id: `lesson-${material.slug}`,
    title: material.title,
    description: material.description,
    category: material.category,
    format: material.format,
    level: levelFromLearningMaterial(material),
    roles: rolesForDomains(domains),
    domains,
    href: hasDirectAsset ? material.demoAsset!.href : `/learn/material/${material.slug}`,
    action: hasDirectAsset ? "Open actual content" : "Open lesson",
    external: hasDirectAsset,
  };
}

function recordFromPdfGuide(guide: DrivePdfGuide): StartHereRecord | null {
  const category = drivePdfCategory(guide.filename);
  const domains = domainsForCategory(category, guide.filename);
  if (!domains.length) return null;
  return {
    id: `pdf-${guide.id}`,
    title: drivePdfTitle(guide.filename),
    description: `Original ${category.toLowerCase()} guide from the Vault Library.`,
    category,
    format: "PDF guide",
    level: levelFromFilename(guide.filename, "pdf"),
    roles: rolesForDomains(domains),
    domains,
    href: drivePdfPreviewHref(guide.id) ?? "#",
    action: "Open guide",
    external: true,
  };
}

function recordFromDriveMaterial(material: DriveMaterial): StartHereRecord | null {
  const category = driveMaterialCategory(material.filename);
  const domains = domainsForCategory(category, material.filename);
  if (!domains.length) return null;
  const kind = driveMaterialKindLabel(material.kind);
  return {
    id: `drive-${material.id}`,
    title: driveMaterialTitle(material.filename),
    description: `Original ${kind.toLowerCase()} from the Vault production library.`,
    category,
    format: kind,
    level: levelFromFilename(material.filename, material.kind === "template" ? "template" : "narrated"),
    roles: rolesForDomains(domains),
    domains,
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

function matchesRecord(record: StartHereRecord, role: StartHereRole | "", domain: StartHereDomain | "") {
  return (!role || record.roles.includes(role)) && (!domain || record.domains.includes(domain));
}

export function VaultStartHere({
  catalog,
  isLive,
}: {
  catalog: LibraryCatalog | null;
  isLive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<StartHereRole | "">("");
  const [domain, setDomain] = useState<StartHereDomain | "">("");
  const allRecords = useMemo(() => (catalog ? buildStartHereRecords(catalog, isLive) : []), [catalog, isLive]);
  const matchingRecords = useMemo(
    () => allRecords.filter((record) => matchesRecord(record, role, domain)),
    [allRecords, domain, role],
  );
  const hasSelection = Boolean(role || domain);

  const clearSelection = () => {
    setRole("");
    setDomain("");
  };

  return (
    <section className="library-start-here" aria-labelledby="library-start-here-title">
      <div className="library-start-here__intro">
        <div>
          <p className="member-kicker">A guided first step</p>
          <h2 id="library-start-here-title">New to interview preparation?</h2>
          <p>Not sure where to start? Begin with the right foundation.</p>
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
            <p className="member-kicker">Choose your starting point</p>
            <p>These fixed paths are based on the Vault’s existing lessons, guides, explainers, and templates. Choose either selector, or use both to narrow the route.</p>
          </div>

          <div className="library-start-here__filters" aria-label="Start here filters">
            <label>
              <span>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value as StartHereRole | "")}>
                <option value="">Any role</option>
                {VAULT_START_HERE_ROLES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
              </select>
              <small>{role ? VAULT_START_HERE_ROLES.find((item) => item.id === role)?.detail : "Choose the closest role family."}</small>
            </label>
            <label>
              <span>Domain</span>
              <select value={domain} onChange={(event) => setDomain(event.target.value as StartHereDomain | "")}>
                <option value="">Any domain</option>
                {VAULT_START_HERE_DOMAINS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
              </select>
              <small>{domain ? VAULT_START_HERE_DOMAINS.find((item) => item.id === domain)?.detail : "Choose the decision you want to practise."}</small>
            </label>
            {hasSelection ? <button className="library-start-here__clear" type="button" onClick={clearSelection}>Clear selection</button> : null}
          </div>

          {!catalog ? (
            <div className="library-start-here__loading" aria-busy="true">Loading the Vault starting paths…</div>
          ) : !hasSelection ? (
            <div className="library-start-here__prompt">Select a role or domain to see the matching Library content.</div>
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
