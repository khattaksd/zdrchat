<script lang="ts">
  let { online = true, modelName = '', tokensIn = 0, tokensOut = 0, cost = 0, creditBalance = null as number | null } = $props();

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
    <span class="status-model" title="Current model">{modelName || 'No model selected'}</span>
  </div>

  <div class="status-center">
    <span class="status-stat" title="Input tokens this session">↑ {formatTokens(tokensIn)}</span>
    <span class="status-stat" title="Output tokens this session">↓ {formatTokens(tokensOut)}</span>
    <span class="status-stat" title="Estimated cost this session">{formatCost(cost)}</span>
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
    padding: 4px 16px; height: 32px; border-top: 1px solid var(--border);
    background: var(--header-bg); font-size: 12px; flex-shrink: 0; gap: 12px;
  }
  .status-left, .status-center, .status-right {
    display: flex; align-items: center; gap: 10px;
  }
  .status-left { flex: 1; }
  .status-center { justify-content: center; flex: 1; }
  .status-right { justify-content: flex-end; flex: 1; }
  .privacy-badge { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: color-mix(in srgb, var(--accent) 15%, transparent); }
  .status-model { opacity: 0.7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
  .status-stat { opacity: 0.6; }
  .status-credit { opacity: 0.6; }
  .status-health { font-weight: 500; }
</style>