<script lang="ts">
  import MaskedInput from './MaskedInput.svelte';

  let {
    onSubmit = (_key: string) => {},
  } = $props();

  let keyInputText = $state('');

  function handleSubmit() {
    if (keyInputText.trim()) {
      onSubmit(keyInputText);
      keyInputText = '';
    }
  }
</script>

<div class="welcome-overlay">
  <div class="welcome-center">
    <svg class="welcome-logo" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="20" fill="#10B981"/>
      <text x="50" y="68" font-family="system-ui, sans-serif" font-size="52" font-weight="bold" fill="#0F172A" text-anchor="middle">Z</text>
    </svg>
    <h1 class="welcome-title">Your Private AI</h1>
    <p class="welcome-tagline">No account · No servers · No tracking</p>

    <div class="welcome-input-row">
      <MaskedInput bind:value={keyInputText} placeholder="Paste your OpenRouter key" name="openrouter_key" onkeydown={(e) => { if (e.key === 'Enter') handleSubmit(); }} />
      <button
        class="welcome-connect-btn"
        disabled={!keyInputText.trim()}
        onclick={handleSubmit}
      >
        Connect
      </button>
    </div>

    <p class="welcome-key-note">
      🔑 Your key stays in this browser. Never sent anywhere except to OpenRouter.
    </p>
    <p class="welcome-cta">
      Need a key? <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">Get one at openrouter.ai</a>
    </p>

    <p class="welcome-pricing">
      No subscription. Add $1 to OpenRouter and start chatting — free models also available.
    </p>
    <p class="welcome-ethics">
      Independent project. Not affiliated with OpenRouter. Built for privacy, not profit.
    </p>

    <div class="welcome-footer">
      <div class="welcome-footer-tagline">Made for the privacy-conscious</div>
      <div class="welcome-footer-links">
        <a href="https://zdr.chat" target="_blank" rel="noopener">ZDR.chat</a>
        <span class="welcome-dot">·</span>
        <a href="https://github.com/khattaksd/zdrchat" target="_blank" rel="noopener">GitHub</a>
        <span class="welcome-dot">·</span>
        <a href="https://zdr.chat/privacy" target="_blank" rel="noopener">Privacy</a>
      </div>
    </div>
  </div>
  <span class="welcome-build">{__BUILD_TIME__}</span>
</div>

<style>
  .welcome-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: var(--bg);
    display: flex; align-items: center; justify-content: center;
  }
  .welcome-center {
    text-align: center;
    max-width: clamp(400px, 42vw, 700px);
    width: 100%;
    padding: clamp(20px, 3vw, 48px);
  }
  .welcome-logo {
    margin-bottom: clamp(20px, 3vw, 40px);
    display: block; margin-left: auto; margin-right: auto;
    width: clamp(80px, 9vw, 150px);
    height: auto;
  }
  .welcome-title {
    margin: 0 0 clamp(8px, 1vw, 16px);
    font-size: clamp(28px, 3.5vw, 64px);
    font-weight: 700;
    color: var(--text);
  }
  .welcome-tagline {
    margin: 0 0 clamp(24px, 3.5vw, 48px);
    font-size: clamp(15px, 1.8vw, 30px);
    color: var(--text-secondary); opacity: 0.7;
  }
  .welcome-input-row {
    display: flex; gap: 8px;
    margin-bottom: 16px;
    max-width: 500px;
    margin-left: auto; margin-right: auto;
    --mi-font-size: 16px;
    --mi-py: 12px;
    --mi-px: 16px;
    --mi-radius: 10px;
  }
  .welcome-connect-btn {
    padding: 12px 24px;
    border-radius: 10px; border: none;
    background: var(--accent); color: white;
    font-size: 16px;
    font-weight: 600; cursor: pointer; white-space: nowrap;
  }
  .welcome-connect-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .welcome-key-note {
    font-size: clamp(13px, 1.2vw, 20px);
    opacity: 0.55; margin: 0 0 clamp(16px, 2.5vw, 36px);
  }
  .welcome-cta {
    font-size: clamp(14px, 1.3vw, 22px);
    margin: 0 0 0;
  }
  .welcome-cta a { color: var(--accent); text-decoration: none; }
  .welcome-cta a:hover { text-decoration: underline; }
  .welcome-pricing {
    font-size: clamp(13px, 1.1vw, 18px);
    opacity: 0.65;
    margin: clamp(12px, 2vw, 28px) 0 0;
  }
  .welcome-ethics {
    font-size: clamp(12px, 1vw, 16px);
    opacity: 0.45;
    margin: clamp(4px, 0.5vw, 8px) 0 clamp(32px, 5vw, 72px);
  }
  .welcome-footer {
    font-size: clamp(13px, 1.1vw, 18px);
    color: var(--text-secondary); opacity: 0.5;
    display: flex; flex-direction: column; align-items: center; gap: clamp(4px, 0.6vw, 10px);
  }
  .welcome-footer-tagline { opacity: 0.8; }
  .welcome-footer-links { display: flex; align-items: center; gap: clamp(4px, 0.6vw, 10px); }
  .welcome-footer a { color: inherit; text-decoration: none; }
  .welcome-footer a:hover { opacity: 0.8; }
  .welcome-dot { opacity: 0.4; }
  .welcome-build {
    position: fixed; bottom: clamp(8px, 1.2vw, 24px); right: clamp(12px, 1.5vw, 32px);
    font-family: monospace;
    font-size: clamp(11px, 0.9vw, 15px);
    opacity: 0.45;
    color: var(--text);
  }
</style>