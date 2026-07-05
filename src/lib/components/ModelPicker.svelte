<script lang="ts">
  import type { Model } from '$lib/api/types';
  import { deduplicateModels, categorizeModels, sortModels } from '$lib/api/dedup';
  import type { ModelGroup, GroupedModels } from '$lib/api/dedup';

  let {
    models = [] as Model[],
    currentModel = '',
    zdrSet = new Set<string>(),
    zdrOnly = false,
    popularModelIds = [] as string[],
    onSelect = (_id: string) => {},
    onClose = (_e?: Event) => {},
  } = $props();

  type SortKey = 'context' | 'price' | 'alpha';
  let sortBy = $state<SortKey>('context');
  let searchQuery = $state('');
  let selectedGroup = $state<ModelGroup>('flagship');

  // Tab definitions — short consumer-friendly labels
  const TABS: { key: ModelGroup; label: string }[] = [
    { key: 'flagship', label: 'Popular' },
    { key: 'fast', label: 'Everyday' },
    { key: 'specialized', label: 'Task' },
    { key: 'all', label: 'All' },
  ];

  // ---- data pipeline ----

  let deduped = $derived(deduplicateModels(models));

  let zdrFiltered = $derived.by(() => {
    if (!zdrOnly) return deduped;
    return deduped.filter((m) => zdrSet.has(m.id));
  });

  let groups = $derived(categorizeModels(zdrFiltered, popularModelIds));

  let sortedGroups = $derived.by(() => {
    const result: GroupedModels = {
      flagship: sortModels(groups.flagship, sortBy),
      fast: sortModels(groups.fast, sortBy),
      specialized: sortModels(groups.specialized, sortBy),
      all: sortModels(groups.all, sortBy),
    };
    return result;
  });

  let activeItems = $derived(sortedGroups[selectedGroup]);
  let activeCount = $derived(activeItems.length);

  let searchResults = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    let list = deduped;
    if (zdrOnly) list = list.filter((m) => zdrSet.has(m.id));
    return sortModels(
      list.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          (m.name && m.name.toLowerCase().includes(q)),
      ),
      sortBy,
    );
  });

  let isSearching = $derived(searchQuery.trim().length > 0);

  // ---- helpers ----

  function getPricingLabel(m: Model): string {
    if (m.id.endsWith(':free')) return 'Free';
    const p = m.pricing;
    if (!p) return '';
    const prompt = parseFloat(p.prompt) * 1_000_000;
    if (prompt > 0) return `$${prompt.toFixed(2)}/M`;
    return '';
  }

  function hasSearchPreview(id: string): boolean {
    return id.includes('search-preview');
  }
</script>

<!-- Overlay -->
<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="overlay" role="presentation" onclick={() => onClose()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}></div>

<div class="panel">
  <!-- Header -->
  <div class="panel-header">
    <h3>Choose a model</h3>
    <button class="close-btn" aria-label="Close" onclick={() => onClose()}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>

  <!-- Search -->
  <div class="search-box">
    <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    <input
      type="text"
      placeholder="Search models..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <!-- Sort bar -->
  <div class="filter-bar">
    <div class="sort-group">
      <button class="sort-btn" class:active={sortBy === 'context'} onclick={() => sortBy = 'context'}>Size</button>
      <button class="sort-btn" class:active={sortBy === 'price'} onclick={() => sortBy = 'price'}>Price</button>
      <button class="sort-btn" class:active={sortBy === 'alpha'} onclick={() => sortBy = 'alpha'}>A-Z</button>
    </div>
    <span class="model-count">{isSearching ? searchResults.length : activeCount} models</span>
  </div>

  <!-- Tab bar (hidden when searching) -->
  {#if !isSearching}
    <div class="tab-bar">
      {#each TABS as tab}
        <button
          class="tab-btn"
          class:active={selectedGroup === tab.key}
          onclick={() => selectedGroup = tab.key}
        >
          {tab.label}
        </button>
      {/each}
    </div>
  {/if}

  <!-- Model list -->
  <div class="model-list">
    {#if isSearching}
      {#if searchResults.length > 0}
        {#each searchResults as model (model.id)}
          {@render ModelItem({ model })}
        {/each}
      {:else}
        <div class="empty-models">No models match your search</div>
      {/if}
    {:else if activeItems.length > 0}
      {#each activeItems as model (model.id)}
        {@render ModelItem({ model })}
      {/each}
    {:else}
      <div class="empty-models">No models in this category</div>
    {/if}
  </div>
</div>

{#snippet ModelItem({ model }: { model: Model })}
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
        {#if !zdrOnly && zdrSet.has(model.id)}
          <span class="chiclet zdr" title="Zero Data Retention">ZDR</span>
        {/if}
        {#if hasSearchPreview(model.id)}
          <span class="chiclet search" title="Web search enabled">search</span>
        {/if}
      </span>
    </div>
    <div class="model-meta">
      {#if getPricingLabel(model)}
        <span class="model-price">{getPricingLabel(model)}</span>
      {/if}
      {#if model.contextLength}
        <span class="model-ctx">{(model.contextLength / 1000).toFixed(0)}k</span>
      {/if}
    </div>
  </button>
{/snippet}

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 50; }
  .panel {
    position: fixed; top: 0; right: 0; height: 100vh; width: 380px; max-width: 90vw;
    background: var(--sidebar-bg); border-left: 1px solid var(--border);
    z-index: 51; display: flex; flex-direction: column; box-shadow: -8px 0 24px rgba(0,0,0,0.2);
  }

  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid var(--border);
  }
  .panel-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
  .close-btn {
    background: none; border: none; color: var(--text); cursor: pointer;
    opacity: 0.4; padding: 2px; border-radius: 4px;
  }
  .close-btn:hover { opacity: 1; background: var(--surface); }

  .search-box {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-bottom: 1px solid var(--border); position: relative;
  }
  .search-icon { position: absolute; left: 20px; opacity: 0.35; pointer-events: none; }
  .search-input {
    width: 100%; padding: 7px 10px 7px 30px; border-radius: 6px;
    border: 1px solid var(--border); background: var(--input-bg);
    color: var(--text); font-size: 13px; font-family: inherit; box-sizing: border-box;
  }
  .search-input:focus { outline: none; border-color: var(--accent); }
  .search-input::placeholder { opacity: 0.35; }

  .filter-bar {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .sort-group { display: flex; gap: 1px; }
  .sort-btn {
    padding: 4px 10px; border-radius: 5px; border: none; background: none;
    color: var(--text); font-size: 11px; cursor: pointer; opacity: 0.5;
    font-family: inherit; font-weight: 500;
  }
  .sort-btn:hover { opacity: 0.8; background: var(--surface); }
  .sort-btn.active { opacity: 1; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
  .model-count { margin-left: auto; font-size: 11px; opacity: 0.35; }
  .chiclet {
    font-size: 10px; font-weight: 600; padding: 1px 5px; border-radius: 3px;
    flex-shrink: 0; letter-spacing: 0.3px;
  }
  .chiclet.zdr { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
  .chiclet.search { background: color-mix(in srgb, #10b981 15%, transparent); color: #10b981; }

  /* Tab bar */
  .tab-bar {
    display: flex; padding: 8px 12px; gap: 6px; flex-shrink: 0;
    border-bottom: 1px solid var(--border);
  }
  .tab-btn {
    flex: 1; padding: 7px 4px; border-radius: 8px; border: none;
    background: var(--surface); color: var(--text);
    font-size: 12px; font-weight: 500; cursor: pointer;
    font-family: inherit; opacity: 0.6;
    transition: background 0.12s, opacity 0.12s; white-space: nowrap;
    text-align: center;
  }
  .tab-btn:hover { opacity: 0.85; }
  .tab-btn.active { opacity: 1; background: var(--accent); color: var(--sidebar-bg); font-weight: 600; }

  .model-list { flex: 1; overflow-y: auto; padding: 4px 8px 12px; }

  .model-item {
    width: 100%; padding: 9px 12px; border-radius: 6px; border: none; background: none;
    color: var(--text); cursor: pointer; text-align: left; display: flex;
    justify-content: space-between; align-items: center; margin-bottom: 1px;
    box-sizing: border-box;
  }
  .model-item:hover { background: var(--surface); }
  .model-item.active { background: color-mix(in srgb, var(--accent) 12%, transparent); }
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

  .empty-models { padding: 24px; text-align: center; opacity: 0.4; font-size: 13px; }
</style>