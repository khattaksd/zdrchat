<script lang="ts">
  let {
    apiKey = '',
    theme = 'dark',
    creditBalance = null as number | null,
    storageInfo = {} as Record<string, any>,
    zdrOnly = false,
    noTraining = false,
    onUpdateKey = (_key: string) => {},
    onUpdateTheme = (_t: string) => {},
    onUpdateZdrOnly = (_v: boolean) => {},
    onUpdateNoTraining = (_v: boolean) => {},
    onClose = (_e?: Event) => {},
  } = $props();

  import MaskedInput from './MaskedInput.svelte';
  // svelte-ignore state_referenced_locally
  let localKey = $state(apiKey);

  function handleKeySubmit() {
    if (localKey.trim()) onUpdateKey(localKey);
  }

  const themes = [
    { value: 'dark', label: '🌙 Dark' },
    { value: 'light', label: '☀️ Light' },
    { value: 'sepia', label: '📜 Sepia' },
    { value: 'nord', label: '❄️ Nord' },
    { value: 'catppuccin', label: '🫘 Catppuccin' },
    { value: 'tokyo-night', label: '🌃 Tokyo Night' },
  ];
</script>

<!-- Overlay -->
<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="overlay" role="presentation" onclick={() => onClose()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}></div>

<div class="panel">
  <div class="panel-header">
    <h3>⚙️ Settings</h3>
    <button class="close-btn" onclick={() => onClose()}>✕</button>
  </div>

  <div class="panel-body">
    <!-- API Key -->
    <section class="section">
      <h4>API Key</h4>
      <div class="key-row">
        <MaskedInput bind:value={localKey} placeholder="sk-or-v1-..." name="openrouter_key" onkeydown={(e) => { if (e.key === 'Enter') handleKeySubmit(); }} />
        <button class="btn-sm" disabled={!localKey.trim()} onclick={handleKeySubmit}>Update</button>
      </div>
      <p class="note">🔑 Stored in your browser only. Never sent anywhere except to OpenRouter.</p>
    </section>

    <!-- Theme -->
    <section class="section">
      <h4>Theme</h4>
      <div class="theme-grid">
        {#each themes as t}
          <button
            class="theme-btn"
            class:active={theme === t.value}
            onclick={() => onUpdateTheme(t.value)}
          >{t.label}</button>
        {/each}
      </div>
    </section>

    <!-- Privacy -->
    <section class="section">
      <h4>🔒 Privacy</h4>
      <label class="toggle-row">
        <input type="checkbox" checked={zdrOnly} onchange={(e) => onUpdateZdrOnly((e.target as HTMLInputElement).checked)} />
        <span><strong>ZDR</strong> (Zero Data Retention) — only use models that don't store your data</span>
      </label>
      <label class="toggle-row">
        <input type="checkbox" checked={noTraining} onchange={(e) => onUpdateNoTraining((e.target as HTMLInputElement).checked)} />
        <span><strong>ZDC</strong> (Zero Data Collection) — request-time enforcement: sends <code>dataCollection: 'deny'</code> to OpenRouter, which routes only to providers that don't train on your data</span>
      </label>
      <p class="note" style="margin-top: 8px;">
        <strong>ZDR</strong> can pre-filter models in the picker. <strong>ZDC</strong> is enforced at request time — if no provider supports it, OpenRouter returns an error.
      </p>
    </section>

    <!-- Ethics -->
    <section class="section">
      <h4>ℹ️ About</h4>
      <p class="note">
        ZDR Chat is an <strong>independent, open-source project</strong>. Not affiliated with OpenRouter.ai.
        We don't earn commissions, resell tokens, or track usage.
        Built for privacy, not profit.
      </p>
    </section>

    <!-- Account -->
    <section class="section">
      <h4>Account</h4>
      {#if creditBalance !== null}
        <div class="stat-row"><span>OpenRouter credits</span><span>${creditBalance.toFixed(2)}</span></div>
      {/if}
      <div class="stat-row"><span>Stored conversations</span><span>{storageInfo.conversations ?? 0}</span></div>
    </section>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 50; }
  .panel {
    position: fixed; top: 0; right: 0; height: 100vh; width: 360px; max-width: 90vw;
    background: var(--sidebar-bg); border-left: 1px solid var(--border);
    z-index: 51; display: flex; flex-direction: column; box-shadow: -8px 0 24px rgba(0,0,0,0.2);
  }
  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }
  .panel-header h3 { margin: 0; font-size: 16px; }
  .close-btn { background: none; border: none; color: var(--text); font-size: 18px; cursor: pointer; opacity: 0.5; }
  .close-btn:hover { opacity: 1; }
  .panel-body { flex: 1; overflow-y: auto; padding: 16px 20px; }
  .section { margin-bottom: 24px; }
  .section h4 { margin: 0 0 12px; font-size: 14px; opacity: 0.8; }
  .key-row { display: flex; gap: 8px; }
  .btn-sm { padding: 8px 14px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 13px; cursor: pointer; white-space: nowrap; }
  .btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
  .note { font-size: 12px; opacity: 0.5; margin: 8px 0 0; }

  .theme-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .theme-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 12px; cursor: pointer; }
  .theme-btn:hover { border-color: var(--accent); }
  .theme-btn.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, transparent); }

  .stat-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; opacity: 0.7; }
  .toggle-row {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; cursor: pointer; padding: 6px 0;
  }
  .toggle-row input { accent-color: var(--accent); width: 16px; height: 16px; }
</style>