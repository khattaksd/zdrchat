import type { Model } from './types';

/**
 * Strip date suffixes (YYYY-MM-DD) and variant tags from a model ID
 * to get the base family name.
 *
 * Examples:
 *   openai/gpt-4o-2024-11-20        → openai/gpt-4o
 *   openai/gpt-4o-mini-2024-07-18   → openai/gpt-4o-mini
 *   openai/gpt-4o-search-preview     → openai/gpt-4o (specialized variant)
 *   ~anthropic/claude-sonnet-latest  → anthropic/claude-sonnet-latest
 */
function baseFamily(modelId: string): string {
  // Strip tilde prefix
  const cleaned = modelId.replace(/^~/, '');
  // Strip date suffix: -YYYY-MM-DD or -YYYY-MM-DD:tag at end
  return cleaned.replace(/-\d{4}-\d{2}-\d{2}(:\w+)?$/, '');
}

/**
 * Deduplicate models: keep only the best variant per model family.
 *
 * Rules:
 * 1. Drop tilde-prefixed "latest" aliases (redundant — base model already points to latest)
 * 2. For date-versioned models (same base, different snapshot dates), keep the
 *    base name variant (no date suffix) since it always points to the latest snapshot.
 * 3. Search-preview variants are kept but tagged — they're valid for web search use.
 */
export function deduplicateModels(models: Model[]): Model[] {
  // Separate tilde aliases — we'll drop them
  const tildeIds = new Set(
    models.filter((m) => m.id.startsWith('~')).map((m) => m.id)
  );

  // Group non-tilde models by base family
  const families = new Map<string, Model[]>();
  for (const m of models) {
    if (tildeIds.has(m.id)) continue;
    const fam = baseFamily(m.id);
    if (!families.has(fam)) families.set(fam, []);
    families.get(fam)!.push(m);
  }

  // Within each family, pick the best variant:
  // - Prefer the exact base name match (no date suffix)
  // - Otherwise keep the one with the highest `created` timestamp
  const result: Model[] = [];
  for (const [fam, variants] of families) {
    if (variants.length === 1) {
      result.push(variants[0]);
      continue;
    }

    // Look for a variant whose id matches the family exactly
    const exact = variants.find((v) => v.id === fam);
    if (exact) {
      result.push(exact);
      continue;
    }

    // Fallback: keep the newest by created timestamp
    variants.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
    result.push(variants[0]);
  }

  // Sort: free models last, then by contextLength descending
  result.sort((a, b) => {
    const aFree = a.id.endsWith(':free') ? 1 : 0;
    const bFree = b.id.endsWith(':free') ? 1 : 0;
    if (aFree !== bFree) return aFree - bFree;
    return (b.contextLength ?? 0) - (a.contextLength ?? 0);
  });

  return result;
}

/* ------------------------------------------------------------------ */
/* Model grouping for the side panel (collapsible sections)           */
/* ------------------------------------------------------------------ */

export type ModelGroup = 'flagship' | 'fast' | 'specialized' | 'all';

export interface GroupedModels {
  flagship: Model[];
  fast: Model[];
  specialized: Model[];
  all: Model[];
}

/** Look up a model's price per 1M prompt tokens (number, or Infinity). */
export function getPriceNum(m: Model): number {
  if (!m.pricing) return Infinity;
  const p = parseFloat(m.pricing.prompt);
  return isNaN(p) ? Infinity : p * 1_000_000;
}

/**
 * Extract a family key from a model ID by stripping trailing version numbers.
 * Models in the same family (e.g. claude-sonnet-4, -4.5, -4.6, -5) share a key.
 *
 * Examples:
 *   openai/gpt-5.5          → openai/gpt
 *   anthropic/claude-sonnet-5 → anthropic/claude-sonnet
 *   deepseek/deepseek-r1    → deepseek/deepseek-r1  (r1 is a distinct line)
 *   deepseek/deepseek-v3.2  → deepseek/deepseek
 */
function familyKey(id: string): string {
  const i = id.lastIndexOf('/');
  if (i === -1) return id;
  const provider = id.slice(0, i);
  let name = id.slice(i + 1);
  // Strip trailing version: -5, -5.1, -4.6, -v3.2
  name = name.replace(/[-v]?\d+(\.\d+)*$/, '');
  if (!name) return id;
  return provider + '/' + name;
}

/**
 * From a list of popular model permaslugs (from OpenRouter rankings),
 * cross-reference with the full deduped model list, then keep only the
 * latest (by `created`) within each family.
 * Returns a short list of ~15-25 models.
 */
export function selectPopularModels(
  popularPermaslugs: string[],
  allModels: Model[],
): Model[] {
  // Strip date suffixes and :free tags from permaslugs to match deduped model IDs
  const normalize = (slug: string): string =>
    slug
      .replace(/-\d{8}(:\w+)?$/g, '')
      .replace(/-\d{4}-\d{2}-\d{2}(:\w+)?$/g, '')
      .replace(/:free$/g, '');

  // Build a ranked map of normalized slugs → original rank
  const rankedOrder = new Map<string, number>();
  const slugSet = new Set<string>();
  popularPermaslugs.forEach((s, i) => {
    const norm = normalize(s);
    if (norm && norm !== 'other') {
      rankedOrder.set(norm, i);
      slugSet.add(norm);
    }
  });

  // Match against deduped model IDs using the normalized form
  const matched = allModels.filter((m) => slugSet.has(m.id));

  // Group matched models by family key
  const families = new Map<string, Model[]>();
  for (const m of matched) {
    const fk = familyKey(m.id);
    if (!families.has(fk)) families.set(fk, []);
    families.get(fk)!.push(m);
  }

  // Within each family, keep the one with the highest `created` timestamp
  const result: Model[] = [];
  for (const [, members] of families) {
    members.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
    result.push(members[0]);
  }

  // Sort by the original ranking (popularity) order
  result.sort((a, b) => {
    const ra = rankedOrder.get(a.id) ?? 999;
    const rb = rankedOrder.get(b.id) ?? 999;
    return ra - rb;
  });

  return result;
}

function isFree(m: Model): boolean {
  return m.id.endsWith(':free');
}

function isOpenrouterSpecial(m: Model): boolean {
  return m.id.startsWith('openrouter/');
}

function isSearchPreview(m: Model): boolean {
  return m.id.includes('search-preview');
}

function isCodeModel(m: Model): boolean {
  const id = m.id.toLowerCase();
  return /\bcoder\b|\bcodex\b/.test(id) || id.includes('-code');
}

function isVisionModel(m: Model): boolean {
  const mods = (m.architecture as Record<string, unknown> | null)?.input_modalities;
  return Array.isArray(mods) && (mods as string[]).includes('image');
}

function isReasoningModel(m: Model): boolean {
  const id = m.id.toLowerCase();
  return /\bo[13]-/.test(id) || /deep-research/.test(id) || /\br1\b/.test(id);
}

/**
 * Sort a list of models by the given key, in place.
 */
export function sortModels(models: Model[], key: 'context' | 'price' | 'alpha'): Model[] {
  const copy = [...models];
  switch (key) {
    case 'context':
      copy.sort((a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0) || a.id.localeCompare(b.id));
      break;
    case 'price':
      copy.sort((a, b) => getPriceNum(a) - getPriceNum(b) || a.id.localeCompare(b.id));
      break;
    case 'alpha':
      copy.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
      break;
  }
  return copy;
}

/**
 * Assign deduplicated models to groups: flagship (from rankings), everyday, task, all.
 * @param models - deduplicated model list
 * @param popularPermaslugs - model permaslugs from OpenRouter daily rankings
 */
export function categorizeModels(
  models: Model[],
  popularPermaslugs?: string[],
): GroupedModels {
  // Build the popular group from rankings, falling back to empty if unavailable
  let flagship: Model[] = [];
  if (popularPermaslugs && popularPermaslugs.length > 0) {
    flagship = selectPopularModels(popularPermaslugs, models);
  }

  // Track which model IDs are already in flagship so we don't duplicate
  const flagshipIds = new Set(flagship.map((m) => m.id));

  const fast: Model[] = [];
  const specialized: Model[] = [];
  const other: Model[] = [];

  for (const m of models) {
    if (flagshipIds.has(m.id)) continue;

    if (isFree(m) || isOpenrouterSpecial(m)) {
      other.push(m);
      continue;
    }

    if (isSearchPreview(m)) {
      specialized.push(m);
      continue;
    }

    if (isCodeModel(m) || isVisionModel(m) || isReasoningModel(m)) {
      specialized.push(m);
      continue;
    }

    const price = getPriceNum(m);
    const ctx = m.contextLength ?? 0;

    if (price < 1 && ctx >= 8000) {
      fast.push(m);
      continue;
    }

    other.push(m);
  }

  return { flagship, fast, specialized, all: other };
}