"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  driveMaterialCategory,
  driveMaterialKindLabel,
  driveMaterialTitle,
} from "@/app/lib/drive-materials";
import { drivePdfCategory, drivePdfTitle, type DrivePdfGuide } from "@/app/lib/drive-pdf-guides";
import type { DemoTier, LearningMaterial } from "@/app/lib/demo-data";
import type { DriveMaterial } from "@/app/lib/drive-materials";
import type { LibraryCategorySummary, LibraryCatalog } from "./library-catalog";
import { DriveMaterialShelf } from "./drive-material-shelf";
import { VaultStartHere } from "./library-start-here";
import { PdfGuideShelf } from "./pdf-guide-shelf";

const TIER_ORDER: Record<DemoTier, number> = { foundation: 0, practice: 1, premium: 2 };
const EMPTY_MATERIALS: readonly LearningMaterial[] = [];
const EMPTY_PDF_GUIDES: readonly DrivePdfGuide[] = [];
const EMPTY_DRIVE_MATERIALS: readonly DriveMaterial[] = [];

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  All: "Browse all materials",
  "System design": "Architecture choices and trade-offs",
  "DSA patterns": "Patterns, invariants, and problem solving",
  Behavioural: "Evidence-led stories and communication",
  "Career profile": "Role targeting, evidence, and professional profile",
  "Remote career": "Remote role, offer, and work guidance",
  Roadmaps: "Step-by-step plans and tasks",
  Operations: "Interview planning, review, and execution",
  "Company research": "Company context for sharper answers",
  "Coding mock": "Timed coding practice and replay",
  "Behavioural mock": "Behavioural practice sessions",
  "Recruiter mock": "Recruiter-screen scenarios",
  "Manager mock": "Manager-led interview scenarios",
  "Mock interview": "Practice sessions to test your thinking",
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
  categorySummary,
  initialPdfFilename = null,
}: {
  profileId: DemoTier;
  isLive?: boolean;
  googleClientId?: string;
  loginHint?: string | null;
  categorySummary: LibraryCategorySummary;
  initialPdfFilename?: string | null;
}) {
  const [catalog, setCatalog] = useState<LibraryCatalog | null>(null);
  const [query, setQuery] = useState(initialPdfFilename ?? "");
  const [category, setCategory] = useState<string | null>(initialPdfFilename ? "All" : null);
  const [scope, setScope] = useState<"all" | "included" | "locked">("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const materials = catalog?.materials ?? EMPTY_MATERIALS;
  const pdfGuides = catalog?.pdfGuides ?? EMPTY_PDF_GUIDES;
  const driveMaterials = catalog?.driveMaterials ?? EMPTY_DRIVE_MATERIALS;
  const categories = categorySummary.categories;
  const totalResourceCount = categorySummary.total;
  const resourceCountLabel = totalResourceCount >= 100
    ? "100+"
    : totalResourceCount.toLocaleString("en-IN");

  useEffect(() => {
    let mounted = true;
    void import("./library-catalog")
      .then(({ getLibraryCatalog }) => {
        if (mounted) setCatalog(getLibraryCatalog(isLive, profileId));
      })
      .catch(() => {
        // Category summaries remain useful if the deferred catalogue chunk fails.
      });
    return () => {
      mounted = false;
    };
  }, [isLive, profileId]);

  const categoryCounts = categorySummary.counts;

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

  const openSearchResults = (value: string) => {
    setQuery(value);
    // Search and access scopes are global Library views when no category is open.
    // Opening the synthetic All category keeps the filtered records visible and
    // means clearing a query restores the complete result set.
    setCategory((current) => current ?? "All");
  };

  const renderResults = (showSummary: boolean) => (
    <>
      {showSummary ? (
        <div className="library-results-heading" aria-live="polite">
          <span>{category ? `${category} · ` : ""}{resultCount.toString().padStart(2, "0")} materials shown</span>
          <small>{category ? "Selected category · click another card to switch" : "All categories · no category selected"}</small>
        </div>
      ) : null}

      {!catalog ? (
        <div className="library-catalog-loading" aria-busy="true" aria-live="polite">
          <span /> Loading materials for this category…
        </div>
      ) : results.length ? (
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
                    <a className="library-record-action-button" href={material.demoAsset.href} target="_blank" rel="noreferrer">
                      Open actual content <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <Link className="library-record-action-button" href={unlocked ? `/learn/material/${material.slug}` : "/pricing"}>{materialOpenLabel(material, unlocked, isLive)} <span aria-hidden="true">↗</span></Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : !pdfResults.length && !driveResults.length ? (
        <div className="library-empty">
          <strong>No library materials match those filters.</strong>
          <button className="member-action-button member-action-button--quiet" type="button" onClick={clearFilters}>Clear filters</button>
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
          <PdfGuideShelf
            guides={pdfResults}
            startNumber={materials.length + 1}
            initialFilename={initialPdfFilename}
          />
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
          <p>Search the library by the interview decision it helps you make. Learning materials, PDF guides, and the supplied Drive archive now sit in the same searchable workspace.</p>
        </div>
        <div className="library-index" aria-label={`${isLive ? "Vault" : "Sample"} catalogue summary: ${resourceCountLabel} Resources Available`}>
          <strong>{resourceCountLabel}</strong>
          <span>Resources<br />Available</span>
        </div>
      </section>

      <section className="library-controls" aria-label="Library filters">
        <label className="library-search">
          <span>Search materials</span>
          <input value={query} onChange={(event) => openSearchResults(event.target.value)} type="search" placeholder="Try “trade-offs” or “behavioural”" />
        </label>
        <div className="library-scope" aria-label="Access filter">
          {(["all", "included", "locked"] as const).map((value) => (
            <button
              className={scope === value ? "is-active" : ""}
              type="button"
              onClick={() => {
                setScope(value);
                setCategory(value === "all" ? "All" : (current) => current ?? "All");
              }}
              key={value}
            >
              {value === "all" ? "All materials" : value === "included" ? "Included" : "Higher plans"}
            </button>
          ))}
        </div>
      </section>

      {profileId === "foundation" || profileId === "practice" ? (
        <VaultStartHere
          catalog={catalog}
          isLive={isLive}
          plan={profileId === "practice" ? "second-seat" : "vault"}
        />
      ) : null}

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
              <span>matching<br />materials</span>
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
                <i>{item === "All" ? resourceCountLabel : (categoryCounts[item] ?? 0).toLocaleString("en-IN")}</i>
                </span>
                <small>{CATEGORY_DESCRIPTIONS[item] ?? "Resources for this interview-prep theme"}</small>
              </button>
            ))}
          </div>

          <section id="library-category-results" className="library-category-results" aria-label="All library materials">
            <div className="library-category-prompt">
              <strong>Choose a category to view its materials.</strong>
              <span>Library materials stay hidden until you choose a learning theme.</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
