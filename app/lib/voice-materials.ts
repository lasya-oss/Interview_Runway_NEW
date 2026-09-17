import { getLibraryCatalog } from "@/app/learn/library/library-catalog";
import { DRIVE_MATERIAL_CONTENT } from "@/app/lib/drive-material-content";
import {
  driveMaterialCategory,
  driveMaterialSlug,
  driveMaterialTitle,
  type DriveMaterial,
} from "@/app/lib/drive-materials";
import type { VoiceRecommendedDrill } from "@/app/lib/voice-session-store";

const ACTIVE_MATERIALS = getLibraryCatalog(true, "foundation").driveMaterials;

export function resolveVoicePrepMaterial(topic: string) {
  const material = bestMaterial(topic);
  if (!material) return null;
  const content = DRIVE_MATERIAL_CONTENT[material.id]?.trim();
  return {
    slug: driveMaterialSlug(material),
    title: driveMaterialTitle(material.filename),
    category: driveMaterialCategory(material.filename),
    excerpt: content ? content.slice(0, 3_500) : null,
    href: `/learn/library/material/${driveMaterialSlug(material)}`,
  };
}

export function resolveVoiceRecommendedDrills(topics: readonly string[]) {
  const drills: VoiceRecommendedDrill[] = [];
  const seen = new Set<string>();
  for (const topic of topics) {
    const material = bestMaterial(topic);
    if (!material) continue;
    const slug = driveMaterialSlug(material);
    if (seen.has(slug)) continue;
    seen.add(slug);
    drills.push({
      slug,
      title: driveMaterialTitle(material.filename),
      reason: topic.trim().slice(0, 280) || "Practice the weakest evidence from this interview.",
    });
    if (drills.length === 3) break;
  }
  if (drills.length) return drills;
  return ACTIVE_MATERIALS.slice(0, 3).map((material) => ({
    slug: driveMaterialSlug(material),
    title: driveMaterialTitle(material.filename),
    reason: "Build a clearer, more specific interview response.",
  }));
}

function bestMaterial(topic: string): DriveMaterial | null {
  if (!ACTIVE_MATERIALS.length) return null;
  const terms = tokenize(topic);
  const ranked = ACTIVE_MATERIALS.map((material) => {
    const haystack = tokenize([
      material.filename,
      driveMaterialTitle(material.filename),
      driveMaterialCategory(material.filename),
    ].join(" "));
    const score = [...terms].reduce((total, term) => total + (haystack.has(term) ? 1 : 0), 0);
    return { material, score };
  }).sort((left, right) => right.score - left.score);
  return ranked[0]?.material ?? null;
}

function tokenize(value: string) {
  return new Set(
    value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length >= 3),
  );
}
