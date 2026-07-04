<script lang="ts">
  import type { Model } from '$lib/api/types';
  import { deduplicateModels } from '$lib/api/dedup';

  let {
    models = [] as Model[],
    currentModel = '',
    zdrSet = new Set<string>(),
    zdrOnly = false,
    onSelect = (_id: string) => {},
    onClose = (_e?: Event) => {},
  } = $props();

  type SortKey = 'context' | 'price' | 'alpha';
  let sortBy = $state<SortKey>('context');
  let searchQuery = $state('');

  // Deduplicate models once on init
  let deduped = $derived(deduplicateModels(models));

  let filtered = $derived.by(() => {
    let list = deduped;
    // ZDR filter
    if (zdrOnly) {
      list = list.filter((m) => zdrSet.has(m.id));
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          (m.name && m.name.toLowerCase().includes(q))
      );
    }
    return list;
  });

  function getPriceNum(m: Model): number {
    if (!m.pricing) return Infinity;
    const p = parseFloat(m.pricing.prompt);
    return isNaN(p) ? Infinity : p * 1_000_000;
  }

  let sortedModels = $derived.by(() => {
    const sorted = [...filtered];
    switch (sortBy) {
      case 'context':
        sorted.sort((a, b) => (b.context_length || 0) - (a.context_length || 0) || a.id.localeCompare(b.id));
        break;
      case 'price':
        sorted.sort((a, b) => getPriceNum(a) - getPriceNum(b) || a.id.localeCompare(b.id));
        break;
      case 'alpha':
        sorted.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
        break;
    }
    return sorted;
  });

  function getPricingLabel(m: Model): string {
    if (m.id.endsWith(':free')) return 'Free';
    const p = m.pricing;
    if (!p) return '';
    const prompt = parseFloat(p.prompt) * 1_000_000;
    if (prompt > 0) return `$${prompt.toFixed(2)}/M`;
    return '';
  }

  function isSearchPreview(id: string): boolean {
    return id.includes('search-preview');
  }
</script>

<!-- Overlay -->
<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="overlay" role="presentation" onclick={() => onClose()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}></div>

<div class="panel">
  <div class="panel-header">
    <h3>Choose a model</h3>
    <button class="close-btn" onclick={() => onClose()}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>

  <div class="search-box">
    <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    <input
      type="text"
      placeholder="Search models..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <div class="filter-bar">
    <div class="sort-group">
      <button class="sort-btn" class:active={sortBy === 'context'} onclick={() => sortBy = 'context'}>Size</button>
      <button class="sort-btn" class:active={sortBy === 'price'} onclick={() => sortBy = 'price'}>Price</button>
      <button class="sort-btn" class:active={sortBy === 'alpha'} onclick={() => sortBy = 'alpha'}>A-Z</button>
    </div>
    {#if zdrOnly}
      <span class="acronym-badge zdr" title="ZDR enforced — only ZDR-compliant models shown">ZDR</span>
    {/if}
    <span class="model-count">{sortedModels.length} models</span>
  </div>

  <div class="model-list">
    {#each sortedModels as model (model.id)}
      <button
        class="model-item"
        class:active={model.id === currentModel}
        onclick={() => onSelect(model.id)}
      >
        <div class="model-info">
          <span class="model-name">
            {model.name || model.id}
            {#if model.id === currentModel}
              <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            {/if}
          </span>
          <span class="model-id-row">
            <span class="model-id">{model.id}</span>
            {#if zdrSet.has(model.id)}
              <span class="acronym-badge zdr" title="Zero Data Retention">ZDR</span>
            {/if}
            {#if isSearchPreview(model.id)}
              <span class="acronym-badge search" title="Web search enabled">search</span>
            {/if}
          </span>
        </div>
        <div class="model-meta">
          {#if getPricingLabel(model)}
            <span class="model-price">{getPricingLabel(model)}</span>
          {/if}
          {#if model.context_length}
            <span class="model-ctx">{(model.context_length / 1000).toFixed(0)}k</span>
          {/if}
        </div>
      </button>
    {:else}
      <div class="empty-models">No models match your search</div>
    {/each}
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 50; }
  .panel {
    position: fixed; top: 0; right: 0; height: 100vh; width: 380px; max-width: 90vw;
    background: var(--sidebar-bg); border-left: 1px solid var(--border);
    z-index: 51; display: flex; flex-direction: column; box-shadow: -8px 0 24px rgba(0,0,0,0.2);
  }
  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }
  .panel-header h3 { margin: 0; font-size: 16px; }
  .close-btn { background: none; border: none; color: var(--text); font-size: 18px; cursor: pointer; opacity: 0.5; padding: 4px; }
  .close-btn:hover { opacity: 1; }

  .search-box {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-bottom: 1px solid var(--border);
    position: relative;
  }
  .search-icon {
    position: absolute; left: 20px; opacity: 0.4; pointer-events: none;
  }
  .search-input {
    width: 100%; padding: 8px 10px 8px 30px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--input-bg);
    color: var(--text); font-size: 13px; font-family: inherit;
    box-sizing: border-box;
  }
  .search-input:focus { outline: none; border-color: var(--accent); }
  .search-input::placeholder { opacity: 0.4; }

  .filter-bar {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .sort-group { display: flex; gap: 2px; }
  .sort-btn {
    padding: 3px 8px; border-radius: 4px; border: none; background: none;
    color: var(--text); font-size: 11px; cursor: pointer; opacity: 0.5;
    font-family: inherit;
  }
  .sort-btn:hover { opacity: 0.8; background: var(--surface); }
  .sort-btn.active { opacity: 1; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
  .model-count { margin-left: auto; font-size: 11px; opacity: 0.35; }

  .model-list { flex: 1; overflow-y: auto; padding: 8px; }
  .model-item {
    width: 100%; padding: 10px 12px; border-radius: 8px; border: none; background: none;
    color: var(--text); cursor: pointer; text-align: left; display: flex;
    justify-content: space-between; align-items: center; margin-bottom: 2px;
  }
  .model-item:hover { background: var(--surface); }
  .model-item.active { background: color-mix(in srgb, var(--accent) 15%, transparent); }
  .model-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .model-name {
    font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    display: flex; align-items: center; gap: 4px;
  }
  .check-icon { flex-shrink: 0; color: var(--accent); }
  .model-id-row { display: flex; align-items: center; gap: 4px; }
  .model-id { font-size: 11px; opacity: 0.4; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .model-meta { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
  .model-price { font-size: 11px; opacity: 0.6; }
  .model-ctx { font-size: 11px; opacity: 0.4; }
  .acronym-badge {
    font-size: 10px; font-weight: 600; padding: 1px 5px; border-radius: 3px;
    flex-shrink: 0; letter-spacing: 0.3px;
  }
  .acronym-badge.zdr { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
  .acronym-badge.search { background: color-mix(in srgb, #10b981 15%, transparent); color: #10b981; }
  .empty-models { padding: 24px; text-align: center; opacity: 0.4; font-size: 13px; }
</style>