"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  driveMaterialCategory,
  driveMaterialKindLabel,
  driveMaterialTitle,
  type DriveMaterial,
} from "@/app/lib/drive-materials";
import { drivePdfCategory, drivePdfTitle, type DrivePdfGuide } from "@/app/lib/drive-pdf-guides";
import type { DemoTier, LearningMaterial } from "@/app/lib/demo-data";
import { DriveMaterialShelf } from "./drive-material-shelf";
import { PdfGuideShelf } from "./pdf-guide-shelf";

const TIER_ORDER: Record<DemoTier, number> = { foundation: 0, practice: 1, premium: 2 };

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  All: "Browse the full library",
  "System design": "Architecture choices and trade-offs",
  "DSA patterns": "Signals, invariants, and problem solving",
  Behavioural: "Evidence-led stories and communication",
  "Remote career": "Remote role, offer, and work guidance",
  Roadmaps: "Sequenced plans and checkpoints",
  Operations: "Planning, review, and interview execution",
  "Company research": "Company context for sharper answers",
  "Coding mock": "Timed coding practice and replay",
  "Behavioural mock": "Recorded behavioural practice",
  "Recruiter mock": "Recruiter-screen scenarios",
  "Manager mock": "Manager-led interview scenarios",
  "Mock interview": "Practice sessions to pressure-test thinking",
  "Production archive": "Source files from the production archive",
  Reference: "Supporting guides and references",
};

function accessLabel(tier: DemoTier) {
  if (tier === "foundation") return "Vault";
  if (tier === "practice") return "The Second Seat";
  return "Human Calibration";
}

function materialAccessLabel(material: LearningMaterial, unlocked: boolean, isLive: boolean) {
  if (!unlocked) return `Requires ${accessLabel(material.tier)}`;
  if (isLive && material.tier === "foundation") {
    return material.availability === "included"
      ? "Included with Vault"
      : "Vault preview · review pending";
  }
  return `Included with ${accessLabel(material.tier)}`;
}

function materialOpenLabel(material: LearningMaterial, unlocked: boolean, isLive: boolean) {
  if (!unlocked) return "Compare access";
  if (isLive && material.tier === "foundation") {
    return material.availability === "included" ? "Open lesson" : "Open preview";
  }
  return "Open sample";
}

export function LibraryClient({
  profileId,
  isLive = false,
  googleClientId = "",
  loginHint = null,
  materials,
  pdfGuides,
  driveMaterials,
}: {
  profileId: DemoTier;
  isLive?: boolean;
  googleClientId?: string;
  loginHint?: string | null;
  materials: readonly LearningMaterial[];
  pdfGuides: readonly DrivePdfGuide[];
  driveMaterials: readonly DriveMaterial[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "included" | "locked">("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const categories = useMemo(() => ["All", ...new Set([
    ...materials.map((material) => material.category),
    ...pdfGuides.map((guide) => drivePdfCategory(guide.filename)),
    ...driveMaterials.map((material) => driveMaterialCategory(material.filename)),
  ])], [driveMaterials, materials, pdfGuides]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const add = (itemCategory: string) => counts.set(itemCategory, (counts.get(itemCategory) ?? 0) + 1);
    materials.forEach((material) => add(material.category));
    pdfGuides.forEach((guide) => add(drivePdfCategory(guide.filename)));
    driveMaterials.forEach((material) => add(driveMaterialCategory(material.filename)));
    return counts;
  }, [driveMaterials, materials, pdfGuides]);

  const totalResourceCount = materials.length + pdfGuides.length + driveMaterials.length;

  const results = useMemo(() => materials.filter((material) => {
    const unlocked = TIER_ORDER[profileId] >= TIER_ORDER[material.tier];
    const included = unlocked && (!isLive || material.tier !== "foundation" || material.availability === "included");
    const matchesScope = scope === "all" || (scope === "included" ? included : !unlocked);
    const matchesCategory = !category || category === "All" || material.category === category;
    const haystack = `${material.title} ${material.description} ${material.category} ${material.format} ${material.tags.join(" ")}`.toLowerCase();
    return matchesScope && matchesCategory && (!deferredQuery || haystack.includes(deferredQuery));
  }), [category, deferredQuery, isLive, materials, profileId, scope]);

  const pdfResults = useMemo(() => {
    if (scope === "locked") return [];
    return pdfGuides.filter((guide) => {
      const title = drivePdfTitle(guide.filename);
      const guideCategory = drivePdfCategory(guide.filename);
      const haystack = `${title} ${guide.filename} ${guideCategory} PDF guide`.toLowerCase();
      return (!category || category === "All" || guideCategory === category) && (!deferredQuery || haystack.includes(deferredQuery));
    });
  }, [category, deferredQuery, pdfGuides, scope]);

  const driveResults = useMemo(() => {
    if (scope === "locked") return [];
    return driveMaterials.filter((material) => {
      const title = driveMaterialTitle(material.filename);
      const materialCategory = driveMaterialCategory(material.filename);
      const kind = driveMaterialKindLabel(material.kind);
      const haystack = `${title} ${material.filename} ${material.collection} ${materialCategory} ${kind}`.toLowerCase();
      return (!category || category === "All" || materialCategory === category) && (!deferredQuery || haystack.includes(deferredQuery));
    });
  }, [category, deferredQuery, driveMaterials, scope]);

  const resultCount = results.length + pdfResults.length + driveResults.length;
  const clearFilters = () => {
    setQuery("");
    setCategory(null);
    setScope("all");
  };

  const renderResults = (showSummary: boolean) => (
    <>
      {showSummary ? (
        <div className="library-results-heading" aria-live="polite">
          <span>{category ? `${category} · ` : ""}{resultCount.toString().padStart(2, "0")} records shown</span>
          <small>{category ? "Selected category · click another card to switch" : "All categories · no category selected"}</small>
        </div>
      ) : null}

      {results.length ? (
        <div className="library-record-list">
          {results.map((material) => {
            const unlocked = TIER_ORDER[profileId] >= TIER_ORDER[material.tier];
            const hasDirectAsset = unlocked && material.demoAsset;
            return (
              <article className={`library-record ${unlocked ? "is-unlocked" : "is-locked"}`} key={material.slug}>
                <span className="library-record-number">{material.number}</span>
                <div className="library-record-copy">
                  <small>{material.category} · {material.format}</small>
                  <h2>{material.title}</h2>
                  <p>{material.description}</p>
                  <div>{material.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <div className="library-record-meta">
                  <span>{material.duration} · {material.level}</span>
                  <small>{material.reviewed}<br />{material.roadmap}</small>
                  <b>{materialAccessLabel(material, unlocked, isLive)}</b>
                  {unlocked && material.progress > 0 && !isLive ? <i aria-label={`${material.progress}% sample progress`}><span style={{ width: `${material.progress}%` }} /></i> : null}
                  {hasDirectAsset ? (
                    <a href={material.demoAsset.href} target="_blank" rel="noreferrer">
                      Open actual content <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <Link href={unlocked ? `/learn/material/${material.slug}` : "/pricing"}>{materialOpenLabel(material, unlocked, isLive)} <span aria-hidden="true">↗</span></Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : !pdfResults.length && !driveResults.length ? (
        <div className="library-empty">
          <strong>No library records match those filters.</strong>
          <button type="button" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : null}

      {pdfResults.length ? (
        <section className="library-pdf-section" aria-labelledby="library-pdf-title">
          <div className="member-section-heading">
            <div>
              <p className="member-kicker">Drive PDF guides</p>
              <h2 id="library-pdf-title">Read the material behind the roadmap.</h2>
            </div>
            <span>{pdfResults.length} guides available</span>
          </div>
          <PdfGuideShelf guides={pdfResults} startNumber={materials.length + 1} />
        </section>
      ) : null}

      {driveResults.length ? (
        <DriveMaterialShelf
          materials={driveResults}
          startNumber={materials.length + pdfGuides.length + 1}
          googleClientId={googleClientId}
          loginHint={loginHint}
        />
      ) : null}
    </>
  );

  return (
    <div className="library-workspace">
      <section className="library-heading">
        <div>
          <p className="member-kicker">Member material library</p>
          <h1>Everything has a place in the plan.</h1>
          <p>Search the library by the interview decision it helps you make. Learning records, PDF guides, and the supplied Drive archive now sit in the same searchable workspace.</p>
        </div>
        <div className="library-index" aria-label={`${isLive ? "Vault" : "Sample"} catalogue summary: 1000+ Resources Available`}>
          <strong>1000+</strong>
          <span>Resources<br />Available</span>
        </div>
      </section>

      <section className="library-controls" aria-label="Library filters">
        <label className="library-search">
          <span>Search materials</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Try “trade-offs” or “behavioural”" />
        </label>
        <div className="library-scope" aria-label="Access filter">
          {(["all", "included", "locked"] as const).map((value) => (
            <button className={scope === value ? "is-active" : ""} type="button" onClick={() => setScope(value)} key={value}>
              {value === "all" ? "All records" : value === "included" ? "Included" : "Higher tiers"}
            </button>
          ))}
        </div>
      </section>

      {category ? (
        <section id="library-category-results" className="library-category-view" aria-label={`${category} category view`}>
          <header className="library-category-view__header">
            <button className="library-category-back" type="button" onClick={() => setCategory(null)}>
              <span aria-hidden="true">←</span> Back to categories
            </button>
            <div>
              <p className="member-kicker">Open category</p>
              <h2>{category}</h2>
              <p>{CATEGORY_DESCRIPTIONS[category] ?? "Resources for this interview-prep theme"}</p>
            </div>
            <div className="library-category-view__count">
              <strong>{resultCount.toLocaleString("en-IN")}</strong>
              <span>matching<br />records</span>
            </div>
          </header>
          <div className="library-category-view__records">{renderResults(false)}</div>
        </section>
      ) : (
        <>
          <div className="library-category-grid" aria-label="Material categories">
            {categories.map((item) => (
              <button
                className={`library-category-card${category === item ? " is-active" : ""}`}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                aria-expanded={category === item}
                aria-controls="library-category-results"
                key={item}
              >
                <span className="library-category-card__topline">
                  <b>{item}</b>
                  <i>{(item === "All" ? totalResourceCount : categoryCounts.get(item) ?? 0).toLocaleString("en-IN")}</i>
                </span>
                <small>{CATEGORY_DESCRIPTIONS[item] ?? "Resources for this interview-prep theme"}</small>
              </button>
            ))}
          </div>

          <section id="library-category-results" className="library-category-results" aria-label="All library records">
            {renderResults(true)}
          </section>
        </>
      )}
    </div>
  );
}
