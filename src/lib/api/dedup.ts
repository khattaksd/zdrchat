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

  // Sort: free models last, then by context_length descending
  result.sort((a, b) => {
    const aFree = a.id.endsWith(':free') ? 1 : 0;
    const bFree = b.id.endsWith(':free') ? 1 : 0;
    if (aFree !== bFree) return aFree - bFree;
    return (b.context_length ?? 0) - (a.context_length ?? 0);
  });

  return result;
}