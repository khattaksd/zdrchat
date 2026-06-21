<script lang="ts">
  /**
   * MaskedInput — A text input that visually masks its value like a password,
   * with a show/hide toggle button.
   *
   * Unlike `type="password"`, this does NOT trigger password manager prompts,
   * autofill, or Chromium's "password form" warnings. The masking is purely
   * visual via CSS (-webkit-text-security), making it suitable for API keys,
   * tokens, and other sensitive non-password strings.
   *
   * Usage (two-way binding):
   *   <MaskedInput bind:value={apiKey} placeholder="..." />
   */
  let {
    value = $bindable(''),
    placeholder = '',
    name = '',
    class: className = '',
    onkeydown,
  }: {
    value?: string;
    placeholder?: string;
    name?: string;
    class?: string;
    onkeydown?: (e: KeyboardEvent) => void;
  } = $props();

  let masked = $state(true);

  function handleInput(e: Event) {
    value = (e.target as HTMLInputElement).value;
  }

  function handleKeydown(e: KeyboardEvent) {
    onkeydown?.(e);
  }

  function toggleMask() {
    masked = !masked;
  }
</script>

<div class="masked-input-wrapper {className}">
  <input
    type="text"
    autocomplete="off"
    inputmode="text"
    {name}
    {placeholder}
    {value}
    oninput={handleInput}
    onkeydown={handleKeydown}
    class="masked-input"
    class:masked
  />
  <button
    class="toggle-btn"
    onclick={toggleMask}
    type="button"
    title={masked ? 'Show key' : 'Hide key'}
    aria-label={masked ? 'Show API key' : 'Hide API key'}
  >
    {masked ? '👁️' : '🙈'}
  </button>
</div>

<style>
  .masked-input-wrapper {
    display: flex;
    align-items: center;
    flex: 1;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--input-bg);
    overflow: hidden;
  }
  .masked-input-wrapper:focus-within {
    border-color: var(--accent);
  }
  .masked-input {
    flex: 1;
    padding: 8px 12px;
    border: none;
    background: none;
    color: var(--text);
    font-size: 13px;
    font-family: monospace;
    outline: none;
  }
  .masked-input.masked {
    -webkit-text-security: disc;
  }
  .toggle-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    opacity: 0.5;
    font-size: 14px;
    line-height: 1;
    flex-shrink: 0;
  }
  .toggle-btn:hover {
    opacity: 1;
  }
</style>