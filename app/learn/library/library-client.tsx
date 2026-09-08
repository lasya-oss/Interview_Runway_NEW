"use client";

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
import { LibraryMaterialDialog } from "./library-material-dialog";
import { formatLibraryRecordNumber, LIBRARY_OPEN_LABEL } from "./library-copy";
import { learningMaterialViewerSource } from "./library-material-source";
import { entitledLibraryPlans } from "./library-plan-access";
import { VaultStartHere } from "./library-start-here";
import { PdfGuideShelf } from "./pdf-guide-shelf";

const TIER_ORDER: Record<DemoTier, number> = { foundation: 0, practice: 1, premium: 2 };
const EMPTY_MATERIALS: readonly LearningMaterial[] = [];
const EMPTY_PDF_GUIDES: readonly DrivePdfGuide[] = [];
const EMPTY_DRIVE_MATERIALS: readonly DriveMaterial[] = [];

const LIBRARY_PLANS: readonly {
  id: DemoTier;
  label: string;
  detail: string;
  description: string;
}[] = [
  {
    id: "foundation",
    label: "Vault",
    detail: "Foundation library",
    description: "Build the core interview patterns, evidence, and role materials.",
  },
  {
    id: "practice",
    label: "Second Seat",
    detail: "Vault + practice library",
    description: "Add interview-shaped rounds, replays, and correction material.",
  },
  {
    id: "premium",
    label: "Human Calibration",
    detail: "Complete library",
    description: "Bring the full preparation, practice, and calibration material together.",
  },
];

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
  return LIBRARY_PLANS.find((plan) => plan.id === tier)?.label ?? "Library";
}

function materialAccessLabel(plan: DemoTier) {
  return `Available in ${accessLabel(plan)}`;
}

function isMaterialInPlan(material: LearningMaterial, plan: DemoTier, isLive: boolean) {
  if (TIER_ORDER[material.tier] > TIER_ORDER[plan]) return false;
  // Live learners see the same released records as the existing catalogue.
  // Unreleased Vault previews stay out of every plan's live view.
  return !(isLive && material.tier === "foundation" && material.availability !== "included");
}

function isPreviewContentUnavailable(material: LearningMaterial, isLive: boolean) {
  // Live Library actions must never send an entitled learner to the generic
  // decision-lab shell when the catalog has no supplied source asset. Demo
  // profiles still use that shell as their representative sample experience.
  return isLive && !material.demoAsset;
}

export function LibraryClient({
  profileId,
  availablePlans = [],
  isLive = false,
  googleClientId = "",
  loginHint = null,
  categorySummary,
  initialPdfFilename = null,
  initialCatalog = null,
}: {
  profileId: DemoTier;
  availablePlans?: readonly DemoTier[];
  isLive?: boolean;
  googleClientId?: string;
  loginHint?: string | null;
  categorySummary: LibraryCategorySummary;
  initialPdfFilename?: string | null;
  initialCatalog?: LibraryCatalog | null;
}) {
  const [catalog, setCatalog] = useState<LibraryCatalog | null>(initialCatalog);
  const [query, setQuery] = useState(initialPdfFilename ?? "");
  const [category, setCategory] = useState<string | null>(initialPdfFilename ? "All" : null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const hasSearchQuery = deferredQuery.length > 0;
  const entitledPlanIds = useMemo(
    () => entitledLibraryPlans(profileId, availablePlans),
    [availablePlans, profileId],
  );
  const entitledPlans = useMemo(() => new Set(entitledPlanIds), [entitledPlanIds]);
  // The authenticated profile normally is entitled, but fail closed if an
  // inconsistent/stale profile ever arrives with a narrower access list.
  const defaultPlan = entitledPlanIds.includes(profileId)
    ? profileId
    : entitledPlanIds.at(-1) ?? null;
  const [selectedPlan, setSelectedPlan] = useState<DemoTier | null>(() => defaultPlan);
  const totalResourceCount = categorySummary.total;
  const resourceCountLabel = totalResourceCount >= 100
    ? "100+"
    : totalResourceCount.toLocaleString("en-IN");

  useEffect(() => {
    if (initialCatalog) return;
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
  }, [initialCatalog, isLive, profileId]);

  const planCatalogs = useMemo(() => {
    const source = catalog ?? {
      materials: EMPTY_MATERIALS,
      pdfGuides: EMPTY_PDF_GUIDES,
      driveMaterials: EMPTY_DRIVE_MATERIALS,
    };
    return Object.fromEntries(LIBRARY_PLANS.map((plan) => [
      plan.id,
      {
        materials: source.materials.filter((material) => isMaterialInPlan(material, plan.id, isLive)),
        pdfGuides: source.pdfGuides,
        driveMaterials: source.driveMaterials,
      },
    ])) as Record<DemoTier, LibraryCatalog>;
  }, [catalog, isLive]);

  const selectedCatalog = selectedPlan ? planCatalogs[selectedPlan] : null;
  const materials = selectedCatalog?.materials ?? EMPTY_MATERIALS;
  const pdfGuides = selectedCatalog?.pdfGuides ?? EMPTY_PDF_GUIDES;
  const driveMaterials = selectedCatalog?.driveMaterials ?? EMPTY_DRIVE_MATERIALS;

  const selectedCategorySummary = useMemo<LibraryCategorySummary>(() => {
    if (!selectedCatalog) return categorySummary;
    const counts = new Map<string, number>();
    const add = (value: string) => counts.set(value, (counts.get(value) ?? 0) + 1);
    selectedCatalog.materials.forEach((material) => add(material.category));
    selectedCatalog.pdfGuides.forEach((guide) => add(drivePdfCategory(guide.filename)));
    selectedCatalog.driveMaterials.forEach((material) => add(driveMaterialCategory(material.filename)));
    return {
      categories: ["All", ...counts.keys()],
      counts: Object.fromEntries(counts),
      total: selectedCatalog.materials.length + selectedCatalog.pdfGuides.length + selectedCatalog.driveMaterials.length,
    };
  }, [categorySummary, selectedCatalog]);

  const categories = selectedCategorySummary.categories;
  const categoryCounts = selectedCategorySummary.counts;

  const results = useMemo(() => materials.filter((material) => {
    const matchesCategory = !category || category === "All" || material.category === category;
    const haystack = `${material.title} ${material.description} ${material.category} ${material.format} ${material.tags.join(" ")}`.toLowerCase();
    return matchesCategory && (!deferredQuery || haystack.includes(deferredQuery));
  }), [category, deferredQuery, materials]);

  const pdfResults = useMemo(() => {
    return pdfGuides.filter((guide) => {
      const title = drivePdfTitle(guide.filename);
      const guideCategory = drivePdfCategory(guide.filename);
      const haystack = `${title} ${guide.filename} ${guideCategory} PDF guide`.toLowerCase();
      return (!category || category === "All" || guideCategory === category) && (!deferredQuery || haystack.includes(deferredQuery));
    });
  }, [category, deferredQuery, pdfGuides]);

  const driveResults = useMemo(() => {
    return driveMaterials.filter((material) => {
      const title = driveMaterialTitle(material.filename);
      const materialCategory = driveMaterialCategory(material.filename);
      const kind = driveMaterialKindLabel(material.kind);
      const haystack = `${title} ${material.filename} ${material.collection} ${materialCategory} ${kind}`.toLowerCase();
      return (!category || category === "All" || materialCategory === category) && (!deferredQuery || haystack.includes(deferredQuery));
    });
  }, [category, deferredQuery, driveMaterials]);

  const resultCount = results.length + pdfResults.length + driveResults.length;
  const clearFilters = () => {
    setQuery("");
    setCategory(null);
  };

  const openSearchResults = (value: string) => {
    setQuery(value);
    // Search is scoped to the selected plan and always searches across its
    // categories. Keeping results in a dedicated view prevents them from being
    // hidden below Start Here and the plan picker while a learner is typing.
    setCategory(value.trim() ? "All" : null);
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
          {results.map((material, index) => {
            const hasDirectAsset = material.demoAsset;
            const contentUnavailable = isPreviewContentUnavailable(material, isLive);
            return (
              <article className="library-record is-unlocked" key={material.slug}>
                <span className="library-record-number">{formatLibraryRecordNumber(index + 1)}</span>
                <div className="library-record-copy">
                  <small>{material.category} · {material.format}</small>
                  <h2>{material.title}</h2>
                  <p>{material.description}</p>
                  <div>{material.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
                <div className="library-record-meta">
                  <span>{material.duration} · {material.level}</span>
                  <small>{material.reviewed}<br />{material.roadmap}</small>
                  <b>{materialAccessLabel(selectedPlan ?? profileId)}</b>
                  {material.progress > 0 && !isLive ? <i aria-label={`${material.progress}% sample progress`}><span style={{ width: `${material.progress}%` }} /></i> : null}
                  {contentUnavailable ? (
                    <div
                      className="library-record-content-unavailable"
                      role="status"
                      aria-label={`${material.title} content unavailable`}
                    >
                      <strong>Content unavailable</strong>
                      <small>Source material not supplied yet</small>
                    </div>
                  ) : hasDirectAsset ? (
                    <LibraryMaterialDialog
                      source={learningMaterialViewerSource(material)}
                      title={material.title}
                      eyebrow={`${material.category} · ${material.format}`}
                      description="Open the material here without leaving InterviewRunway."
                      buttonLabel={LIBRARY_OPEN_LABEL}
                      googleClientId={googleClientId}
                      loginHint={loginHint}
                    />
                  ) : (
                    <LibraryMaterialDialog
                      source={null}
                      title={material.title}
                      eyebrow={`${material.category} · ${material.format}`}
                      description="This representative sample opens inside InterviewRunway."
                      buttonLabel={LIBRARY_OPEN_LABEL}
                      googleClientId={googleClientId}
                      loginHint={loginHint}
                      emptyState={
                        <div className="library-material-state library-material-content-unavailable" role="status">
                          <strong>Sample preview</strong>
                          <p>This representative material does not have a supplied source file.</p>
                        </div>
                      }
                    />
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
            startNumber={results.length + 1}
            initialFilename={initialPdfFilename}
          />
        </section>
      ) : null}

      {driveResults.length ? (
        <DriveMaterialShelf
          materials={driveResults}
          startNumber={results.length + pdfResults.length + 1}
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

      {selectedPlan ? (
        <>
          <section className="library-controls" aria-label="Library search">
            <label className="library-search">
              <span>Search materials</span>
              <input value={query} onChange={(event) => openSearchResults(event.target.value)} type="search" placeholder="Try “trade-offs” or “behavioural”" />
            </label>
            <div className="library-controls__context">
              <span>Plan library</span>
              <strong>{accessLabel(selectedPlan)}</strong>
            </div>
          </section>

          {hasSearchQuery ? (
            <section className="library-search-results" aria-label="Search results">
              <div className="library-category-view__header">
                <div>
                  <p className="member-kicker">Search results</p>
                  <h2>Matches in {accessLabel(selectedPlan)}</h2>
                  <p>Showing materials that match “{query.trim()}” across this plan.</p>
                </div>
                <div className="library-category-view__count">
                  <strong>{resultCount.toLocaleString("en-IN")}</strong>
                  <span>matching<br />materials</span>
                </div>
              </div>
              {renderResults(true)}
            </section>
          ) : selectedPlan === profileId ? (
            <VaultStartHere
              catalog={catalog}
              isLive={isLive}
              plan={profileId === "premium" ? "human-calibration" : profileId === "practice" ? "second-seat" : "vault"}
              googleClientId={googleClientId}
              loginHint={loginHint}
            />
          ) : null}
        </>
      ) : null}

      <section className="library-plan-picker" aria-labelledby="library-plan-picker-title">
        <div className="library-plan-picker__intro">
          <div>
            <p className="member-kicker">Your Library</p>
            <h2 id="library-plan-picker-title">Switch between your plan libraries.</h2>
            <p>Your current plan is selected automatically. Use these library views to browse the categories and materials available to this account.</p>
          </div>
          <span className="library-plan-picker__inventory">All {resourceCountLabel}<br />catalogued resources</span>
        </div>
        <div className="library-plan-grid">
          {LIBRARY_PLANS.map((plan) => {
            const isAvailable = entitledPlans.has(plan.id);
            const isSelected = selectedPlan === plan.id;
            const planCatalog = planCatalogs[plan.id];
            const planCount = planCatalog.materials.length + planCatalog.pdfGuides.length + planCatalog.driveMaterials.length;
            return (
              <button
                className={`library-plan-card${isSelected ? " is-selected" : ""}${isAvailable ? "" : " is-unavailable"}`}
                type="button"
                onClick={() => {
                  if (!isAvailable) return;
                  setSelectedPlan(plan.id);
                  setCategory(null);
                  setQuery("");
                }}
                aria-pressed={isSelected}
                aria-disabled={!isAvailable}
                aria-label={`${plan.label} plan — ${isAvailable ? "unlocked" : "locked"}`}
                data-library-plan={plan.id}
                data-access-state={isAvailable ? "unlocked" : "locked"}
                disabled={!isAvailable}
                key={plan.id}
              >
                <span className="library-plan-card__index">0{plan.id === "foundation" ? 1 : plan.id === "practice" ? 2 : 3}</span>
                <span className="library-plan-card__label">{plan.label}</span>
                <strong>{plan.detail}</strong>
                <p>{plan.description}</p>
                <span className="library-plan-card__footer">
                  {isAvailable ? `${planCount.toLocaleString("en-IN")} materials` : "🔒 Locked"}
                  <b aria-hidden="true">{isSelected ? "✓" : isAvailable ? "↗" : "🔒"}</b>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selectedPlan && !hasSearchQuery && category ? (
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
      ) : selectedPlan && !hasSearchQuery ? (
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
      ) : (
        <section id="library-category-results" className="library-category-results library-category-results--plan-first" aria-label="Plan-first Library guidance">
          <div className="library-category-prompt">
            <strong>Choose a plan to open its categories.</strong>
            <span>Then choose a category to view its materials.</span>
          </div>
        </section>
      )}
    </div>
  );
}
