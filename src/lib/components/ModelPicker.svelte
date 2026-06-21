<script lang="ts">
  import type { Model } from '../api/types';
  import { MODEL_BUCKETS } from '../api/types';

  let {
    models = [] as Model[],
    buckets = {} as Record<string, Model[]>,
    currentModel = '',
    onSelect = (_id: string) => {},
    onClose = () => {},
  } = $props();

  let activeTab = $state('smartest');
  let filteredModels = $derived(
    (buckets[activeTab] || [])
  );

  let allModels = $derived(
    (activeTab === 'all' ? models : filteredModels).slice(0, 50)
  );

  function getPricingLabel(m: Model): string {
    if (m.id.endsWith(':free')) return 'Free';
    const p = m.pricing;
    if (!p) return '';
    const prompt = parseFloat(p.prompt) * 1_000_000;
    if (prompt > 0) return `$${prompt.toFixed(2)}/M`;
    return '';
  }
</script>

<!-- Overlay backdrop -->
<div class="overlay" on:click={onClose}></div>

<div class="modal">
  <div class="modal-header">
    <h3>Choose a model</h3>
    <button class="close-btn" on:click={onClose}>✕</button>
  </div>

  <div class="tabs">
    {#each MODEL_BUCKETS as bucket}
      <button
        class="tab"
        class:active={activeTab === bucket.key}
        on:click={() => activeTab = bucket.key}
      >{bucket.label}</button>
    {/each}
    <button
      class="tab"
      class:active={activeTab === 'all'}
      on:click={() => activeTab = 'all'}
    >All</button>
  </div>

  <div class="model-list">
    {#each allModels as model (model.id)}
      <button
        class="model-item"
        class:active={model.id === currentModel}
        on:click={() => onSelect(model.id)}
      >
        <div class="model-info">
          <span class="model-name">{model.name || model.id}</span>
          <span class="model-id">{model.id}</span>
        </div>
        <div class="model-meta">
          {#if getPricingLabel(model)}
            <span class="model-price">{getPricingLabel(model)}</span>
          {/if}
          {#if model.context_length}
            <span class="model-ctx">{(model.context_length / 1000).toFixed(0)}k ctx</span>
          {/if}
        </div>
      </button>
    {:else}
      <div class="empty-models">No models in this category</div>
    {/each}
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 50; }
  .modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 480px; max-width: 90vw; max-height: 70vh; display: flex; flex-direction: column;
    background: var(--sidebar-bg); border: 1px solid var(--border); border-radius: 16px;
    z-index: 51; box-shadow: 0 16px 48px rgba(0,0,0,0.3);
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }
  .modal-header h3 { margin: 0; font-size: 16px; }
  .close-btn { background: none; border: none; color: var(--text); font-size: 18px; cursor: pointer; opacity: 0.5; }
  .close-btn:hover { opacity: 1; }
  .tabs {
    display: flex; gap: 4px; padding: 8px 12px; overflow-x: auto;
    border-bottom: 1px solid var(--border); flex-shrink: 0;
  }
  .tab {
    padding: 5px 10px; border-radius: 6px; border: none; background: none;
    color: var(--text); font-size: 12px; cursor: pointer; white-space: nowrap; opacity: 0.6;
  }
  .tab:hover { opacity: 0.9; background: var(--surface); }
  .tab.active { opacity: 1; background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
  .model-list { flex: 1; overflow-y: auto; padding: 8px; }
  .model-item {
    width: 100%; padding: 10px 12px; border-radius: 8px; border: none; background: none;
    color: var(--text); cursor: pointer; text-align: left; display: flex;
    justify-content: space-between; align-items: center; margin-bottom: 2px;
  }
  .model-item:hover { background: var(--surface); }
  .model-item.active { background: color-mix(in srgb, var(--accent) 15%, transparent); }
  .model-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .model-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .model-id { font-size: 11px; opacity: 0.4; font-family: monospace; }
  .model-meta { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
  .model-price { font-size: 11px; opacity: 0.6; }
  .model-ctx { font-size: 11px; opacity: 0.4; }
  .empty-models { padding: 24px; text-align: center; opacity: 0.4; font-size: 13px; }
</style>