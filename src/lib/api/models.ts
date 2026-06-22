import type { Model } from './types';
import { MODEL_BUCKETS } from './types';

/**
 * Categorize models into friendly buckets (smartest, fast, creative, free, code, vision, other)
 * and sort each bucket by capability (context_length descending).
 */
export function categorizeModels(models: Model[]): Record<string, Model[]> {
  const buckets: Record<string, Model[]> = {};
  for (const b of MODEL_BUCKETS) buckets[b.key] = [];
  buckets.other = [];

  for (const m of models) {
    const id = m.id;
    const isFree = id.endsWith(':free');
    const isVision = m.architecture?.input_modalities?.includes('image');
    const isCode = id.includes('coder') || id.includes('code') || id.includes('deepseek');
    const isCreative = id.includes('sonnet') || id.includes('mistral-large');
    const isSmart = id.includes('opus') || id.includes('gpt-5') || id.includes('gemini-2.5-pro') || id.includes('sonnet-4');
    const isFast = id.includes('mini') || id.includes('haiku') || id.includes('flash') || id.includes('llama-3');

    if (isFree) buckets.free.push(m);
    if (isSmart) buckets.smartest.push(m);
    if (isFast && !isSmart) buckets.fast.push(m);
    if (isCreative && !isSmart) buckets.creative.push(m);
    if (isCode && !isSmart && !isFast) buckets.code.push(m);
    if (isVision && !buckets.smartest.includes(m) && !buckets.fast.includes(m)) buckets.vision.push(m);
    if (!isFree && !isSmart && !isFast && !isCreative && !isCode && !isVision) buckets.other.push(m);
  }

  // Sort each bucket by capability descending (context_length), fallback to name
  const sortByCapability = (a: Model, b: Model) =>
    (b.context_length || 0) - (a.context_length || 0) || a.id.localeCompare(b.id);

  for (const key of Object.keys(buckets)) {
    buckets[key].sort(sortByCapability);
  }

  // Limit Smartest to top 10, others to top 30
  buckets.smartest = buckets.smartest.slice(0, 10);
  for (const key of Object.keys(buckets)) {
    if (key !== 'smartest') buckets[key] = buckets[key].slice(0, 30);
  }

  return buckets;
}