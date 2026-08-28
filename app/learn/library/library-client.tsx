"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { drivePdfCategory, drivePdfHref, drivePdfTitle, type DrivePdfGuide } from "@/app/lib/drive-pdf-guides";
import type { DemoTier, LearningMaterial } from "@/app/lib/demo-data";

const TIER_ORDER: Record<DemoTier, number> = { foundation: 0, practice: 1, premium: 2 };

function accessLabel(tier: DemoTier) {
  if (tier === "foundation") return "Vault";
  if (tier === "practice") return "The Second Seat";
  return "Human Calibration";
}

export function LibraryClient({
  profileId,
  materials,
  pdfGuides,
}: {
  profileId: DemoTier;
  materials: readonly LearningMaterial[];
  pdfGuides: readonly DrivePdfGuide[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [scope, setScope] = useState<"all" | "included" | "locked">("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const categories = useMemo(() => ["All", ...new Set([
    ...materials.map((material) => material.category),
    ...pdfGuides.map((guide) => drivePdfCategory(guide.filename)),
  ])], [materials, pdfGuides]);

  const results = useMemo(() => materials.filter((material) => {
    const unlocked = TIER_ORDER[profileId] >= TIER_ORDER[material.tier];
    const matchesScope = scope === "all" || (scope === "included" ? unlocked : !unlocked);
    const matchesCategory = category === "All" || material.category === category;
    const haystack = `${material.title} ${material.description} ${material.category} ${material.format} ${material.tags.join(" ")}`.toLowerCase();
    return matchesScope && matchesCategory && (!deferredQuery || haystack.includes(deferredQuery));
  }), [category, deferredQuery, materials, profileId, scope]);

  const pdfResults = useMemo(() => {
    if (scope === "locked") return [];
    return pdfGuides.filter((guide) => {
      const title = drivePdfTitle(guide.filename);
      const guideCategory = drivePdfCategory(guide.filename);
      const haystack = `${title} ${guide.filename} ${guideCategory} PDF guide`.toLowerCase();
      return (category === "All" || guideCategory === category) && (!deferredQuery || haystack.includes(deferredQuery));
    });
  }, [category, deferredQuery, pdfGuides, scope]);

  const resultCount = results.length + pdfResults.length;

  return (
    <div className="library-workspace">
      <section className="library-heading">
        <div>
          <p className="member-kicker">Member material library</p>
          <h1>Everything has a place in the plan.</h1>
          <p>Search the library by the interview decision it helps you make. The PDF guide shelf below opens the original Drive material in its viewer, while the learning records show the product structure around it.</p>
        </div>
        <div className="library-index" aria-label="Sample catalogue summary">
          <strong>{(materials.length + pdfGuides.length).toString().padStart(2, "0")}</strong>
          <span>library<br />records</span>
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

      <div className="library-category-rail" aria-label="Material categories">
        {categories.map((item) => (
          <button className={category === item ? "is-active" : ""} type="button" onClick={() => setCategory(item)} key={item}>{item}</button>
        ))}
      </div>

      <div className="library-results-heading" aria-live="polite">
        <span>{resultCount.toString().padStart(2, "0")} records shown</span>
        <small>Learning records and PDF guides</small>
      </div>

      {results.length ? (
        <div className="library-record-list">
          {results.map((material) => {
            const unlocked = TIER_ORDER[profileId] >= TIER_ORDER[material.tier];
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
                  <b>{unlocked ? `Included with ${accessLabel(material.tier)}` : `Requires ${accessLabel(material.tier)}`}</b>
                  {unlocked && material.progress > 0 ? <i aria-label={`${material.progress}% sample progress`}><span style={{ width: `${material.progress}%` }} /></i> : null}
                  <Link href={unlocked ? `/learn/material/${material.slug}` : "/pricing"}>{unlocked ? "Open sample" : "Compare access"} <span aria-hidden="true">↗</span></Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : !pdfResults.length ? (
        <div className="library-empty">
          <strong>No library records match those filters.</strong>
          <button type="button" onClick={() => { setQuery(""); setCategory("All"); setScope("all"); }}>Clear filters</button>
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
          <div className="library-pdf-grid">
            {pdfResults.map((guide) => (
              <a className="library-pdf-card" href={drivePdfHref(guide.id)} target="_blank" rel="noreferrer" key={guide.id}>
                <span>PDF · {drivePdfCategory(guide.filename)}</span>
                <strong>{drivePdfTitle(guide.filename)}</strong>
                <small>{guide.filename}</small>
                <b>Open in Drive viewer ↗</b>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
