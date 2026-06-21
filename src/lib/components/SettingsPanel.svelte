<script lang="ts">
  let {
    apiKey = '',
    theme = 'dark',
    creditBalance = null as number | null,
    storageInfo = {} as Record<string, any>,
    onUpdateKey = (_key: string) => {},
    onUpdateTheme = (_t: string) => {},
    onClose = () => {},
  } = $props();

  let localKey = $state(apiKey);
  let showKey = $state(false);

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
<div class="overlay" onclick={onClose}></div>

<div class="panel">
  <div class="panel-header">
    <h3>⚙️ Settings</h3>
    <button class="close-btn" onclick={onClose}>✕</button>
  </div>

  <div class="panel-body">
    <!-- API Key -->
    <section class="section">
      <h4>API Key</h4>
      <div class="key-row">
        <div class="key-input-wrapper">
          <input
            type={showKey ? 'text' : 'password'}
            bind:value={localKey}
            placeholder="sk-or-v1-..."
            class="input"
          />
          <button class="toggle-vis" onclick={() => showKey = !showKey}>
            {showKey ? '🙈' : '👁️'}
          </button>
        </div>
        <button class="btn-sm" onclick={() => onUpdateKey(localKey)} disabled={!localKey.trim()}>Update</button>
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
      <p class="note" style="margin-bottom: 12px;">
        Data retention and training policies are controlled at your OpenRouter account level.
        Configure them once and they apply to all requests from this key.
      </p>
      <a
        href="https://openrouter.ai/settings/privacy"
        target="_blank"
        rel="noopener"
        class="privacy-link"
      >
        ⚙️ OpenRouter Privacy Settings →
      </a>
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
  .key-input-wrapper { flex: 1; display: flex; align-items: center; border: 1px solid var(--border); border-radius: 8px; background: var(--input-bg); overflow: hidden; }
  .input { flex: 1; padding: 8px 12px; border: none; background: none; color: var(--text); font-size: 13px; font-family: monospace; }
  .input:focus { outline: none; }
  .toggle-vis { background: none; border: none; padding: 8px; cursor: pointer; opacity: 0.5; font-size: 14px; }
  .toggle-vis:hover { opacity: 1; }
  .btn-sm { padding: 8px 14px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 13px; cursor: pointer; white-space: nowrap; }
  .btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
  .note { font-size: 12px; opacity: 0.5; margin: 8px 0 0; }

  .theme-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .theme-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 12px; cursor: pointer; }
  .theme-btn:hover { border-color: var(--accent); }
  .theme-btn.active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, transparent); }

  .toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 0; font-size: 13px; cursor: pointer;
  }
  .toggle-row input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent); }
  .stat-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; opacity: 0.7; }
  .privacy-link {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); font-size: 13px;
    text-decoration: none; cursor: pointer;
  }
  .privacy-link:hover { border-color: var(--accent); }
</style>