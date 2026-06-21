<script lang="ts">
  let { online = true, modelName = '', tokensIn = 0, tokensOut = 0, cost = 0, creditBalance = null as number | null, onModelClick = () => {} } = $props();

  function formatTokens(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function formatCost(n: number): string {
    if (n === 0) return '$0.00';
    if (n < 0.0001) return '$' + n.toFixed(7);
    if (n < 0.01) return '$' + n.toFixed(6);
    return '$' + n.toFixed(4);
  }

  let healthColor = $derived(online ? 'var(--accent)' : '#ef4444');
  let healthLabel = $derived(online ? 'live' : 'offline');
</script>

<footer class="status-bar">
  <div class="status-left">
    <button class="status-model" onclick={onModelClick} title="Click to change model">
      {modelName || 'No model selected'} <span class="model-chevron">▼</span>
    </button>
  </div>

  <div class="status-center">
    <span class="status-stat" title="Input tokens this session">↑ {formatTokens(tokensIn)}</span>
    <span class="status-stat" title="Output tokens this session">↓ {formatTokens(tokensOut)}</span>
    <span class="status-stat status-stat-cost" title="Estimated cost this session">{formatCost(cost)}</span>
  </div>

  <div class="status-right">
    {#if creditBalance !== null}
      <span class="status-credit" title="OpenRouter credit balance">${creditBalance.toFixed(2)}</span>
    {/if}
    <span class="status-health" style="color: {healthColor}" title="{healthLabel === 'live' ? 'Connected to OpenRouter' : 'Offline'}">
      ● {healthLabel}
    </span>
  </div>
</footer>

<style>
  .status-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 var(--pad-lg); height: 40px; border-top: 1px solid var(--border);
    background: var(--header-bg); font-size: var(--font-base); flex-shrink: 0; gap: var(--pad-sm);
  }
  .status-left, .status-center, .status-right {
    display: flex; align-items: center; gap: var(--pad-sm);
  }
  .status-left { flex: 1; }
  .status-center { justify-content: center; flex: 1; }
  .status-right { justify-content: flex-end; flex: 1; }
  .status-bar > :not(:last-child)::after {
    content: ''; display: inline-block; width: 1px; height: 16px;
    background: var(--border); opacity: 0.5; margin-left: var(--pad-sm);
  }
  .status-model {
    background: none; border: none; color: var(--text); font-family: inherit;
    font-size: inherit; font-weight: 500; cursor: pointer;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    max-width: 220px; opacity: 0.7; padding: 2px 6px; border-radius: 4px;
    transition: all 0.15s ease;
  }
  .status-model:hover { opacity: 1; background: var(--surface); transform: scale(1.1); }
  .model-chevron { font-size: 9px; opacity: 0.5; margin-left: 2px; }
  .status-stat {
    opacity: 0.75; padding: 2px 6px; border-radius: 4px;
    transition: all 0.15s ease; cursor: default; position: relative;
  }
  .status-stat:hover {
    opacity: 1; background: var(--surface); transform: scale(1.35); z-index: 2;
  }
  .status-stat-cost {
    color: var(--accent); font-weight: 500; opacity: 0.9;
    padding: 2px 6px; border-radius: 4px;
    transition: all 0.15s ease; cursor: default; position: relative;
  }
  .status-stat-cost:hover {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    transform: scale(1.35); z-index: 2;
  }
  .status-credit {
    opacity: 0.9; color: var(--accent); font-weight: 600;
    padding: 2px 8px; border-radius: 4px;
    transition: all 0.15s ease; cursor: default; position: relative;
  }
  .status-credit:hover {
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    transform: scale(1.35); z-index: 2;
  }
  .status-health {
    font-weight: 600; padding: 2px 6px; border-radius: 4px;
    transition: all 0.15s ease; cursor: default; position: relative;
  }
  .status-health:hover { background: var(--surface); transform: scale(1.35); z-index: 2; }
</style>