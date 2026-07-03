<script lang="ts">
  let {
    online = true, tokensIn = 0, tokensOut = 0, cost = 0,
    creditBalance = null as number | null,
  } = $props();

  let buildTime = __BUILD_TIME__;

  let formatTokens = (n: number): string =>
    n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);

  let formatCost = (n: number): string => {
    if (n === 0) return '$0';
    if (n < 0.01) return '$' + n.toFixed(6);
    return '$' + n.toFixed(4);
  };

  let healthColor = $derived(online ? 'var(--accent)' : '#ef4444');
  let healthLabel = $derived(online ? 'live' : 'offline');
</script>

<footer class="status-bar">
  <div class="status-left">
    <span class="stat" title="Input tokens this session">
      <span class="stat-arrow">↑</span> {formatTokens(tokensIn)}
    </span>
    <span class="stat" title="Output tokens this session">
      <span class="stat-arrow">↓</span> {formatTokens(tokensOut)}
    </span>
    <span class="stat stat-cost" title="Estimated cost this session">
      {formatCost(cost)}
    </span>
  </div>

  <div class="status-right">
    {#if creditBalance !== null}
      <span class="stat stat-credit" title="OpenRouter credit balance">
        ${creditBalance.toFixed(2)}
      </span>
    {/if}
    <span class="stat stat-health" style="color: {healthColor}" title="{healthLabel === 'live' ? 'Connected to OpenRouter' : 'Offline'}">
      ● <span class="health-label">{healthLabel}</span>
    </span>
    <span class="status-build" title="Build time">{buildTime}</span>
  </div>
</footer>

<style>
  .status-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 var(--pad-lg); height: 44px;
    border-top: 1px solid var(--border);
    background: var(--header-bg); font-size: var(--font-md);
    flex-shrink: 0; gap: var(--pad-sm);
  }
  .status-left, .status-right {
    display: flex; align-items: center; gap: 4px;
  }
  .status-left { flex: 1; min-width: 0; }
  .status-right { justify-content: flex-end; flex-shrink: 0; gap: 4px; }

  .stat {
    padding: 4px 10px; border-radius: 6px;
    transition: all 0.15s ease; cursor: default; position: relative;
    white-space: nowrap; font-weight: 500;
  }
  .stat:hover {
    background: var(--surface); transform: scale(1.2); z-index: 2;
  }
  .stat-arrow { opacity: 0.6; }
  .stat-cost {
    color: var(--accent); font-weight: 600;
  }
  .stat-cost:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .stat-credit {
    color: var(--accent); font-weight: 600;
  }
  .stat-credit:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }
  .stat-health {
    font-weight: 600;
  }
  .stat-health:hover { background: var(--surface); }

  .status-build {
    font-family: monospace; font-size: calc(var(--font-xs)); opacity: 0.35;
    padding: 2px 6px; border-radius: 4px; cursor: default;
    white-space: nowrap;
  }
  .status-build:hover { opacity: 0.7; background: var(--surface); }

  @media (max-width: 640px) {
    .status-bar { padding: 0 var(--pad-md); gap: 2px; }
    .status-build { display: none; }
  }
  @media (max-width: 480px) {
    .stat { padding: 3px 6px; }
    .health-label { display: none; }
  }
</style>