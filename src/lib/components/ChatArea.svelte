<script lang="ts">
  import { chat } from '$lib/store/chat.svelte.ts';
  import { renderMarkdown } from '$lib/markdown';
  import type { Message } from '$lib/db/dexie';

  let {
    inputText = $bindable(''),
    messagesEnd = $bindable<HTMLDivElement | undefined>(undefined),
    inputEl = $bindable<HTMLTextAreaElement | undefined>(undefined),
    handleSend = undefined as (() => void) | undefined,
    handleKeydown = undefined as ((e: KeyboardEvent) => void) | undefined,
    onToggleModelPicker = undefined as (() => void) | undefined,
    onResend = undefined as (() => void) | undefined,
    modelName = '',
  } = $props();

  // Auto-focus input on mount and when starting a new conversation
  $effect(() => {
    if (!chat.activeConversationId && chat.messages.length === 0 && inputEl) {
      inputEl.focus();
    }
  });

  let expandedReasoning = $state<Record<string, boolean>>({});
  /** id of the message whose copy action recently succeeded (for checkmark feedback) */
  let copiedId = $state<string | null>(null);

  function toggleReasoning(id: string) {
    expandedReasoning[id] = !expandedReasoning[id];
  }

  async function copyResponse(msg: Message) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(msg.content);
      } else {
        // Fallback for non-secure contexts
        const ta = document.createElement('textarea');
        ta.value = msg.content;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      copiedId = msg.id;
      setTimeout(() => {
        if (copiedId === msg.id) copiedId = null;
      }, 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  // ── File attach (.txt / .md only) ────────────────────
  const ATTACH_WARN_BYTES = 50_000; // ~12k tokens
  const ATTACH_MAX_BYTES = 1_000_000; // hard cap
  const ATTACH_EXTENSIONS = ['txt', 'md', 'markdown'];

  let fileInputEl = $state<HTMLInputElement | undefined>();
  let fileError = $state<string | null>(null);
  let pendingFile = $state<{
    name: string;
    size: number;
    content: string;
    ext: 'txt' | 'md';
  } | null>(null);

  function formatBytes(bytes: number): string {
    if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  }

  function openFilePicker() {
    fileError = null;
    fileInputEl?.click();
  }

  async function handleFiles(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file
    fileError = null;
    if (!file) return;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ATTACH_EXTENSIONS.includes(ext)) {
      fileError = 'Only .txt and .md files are supported right now.';
      return;
    }
    if (file.size > ATTACH_MAX_BYTES) {
      fileError = `"${file.name}" is ${formatBytes(file.size)} — larger than the ${formatBytes(ATTACH_MAX_BYTES)} limit.`;
      return;
    }

    const content = await file.text();
    pendingFile = {
      name: file.name,
      size: file.size,
      content,
      ext: ext === 'txt' ? 'txt' : 'md',
    };
  }

  function confirmAttachment() {
    if (!pendingFile) return;
    const fence = pendingFile.ext === 'md' ? 'md' : 'text';
    const block = `[Attached file: ${pendingFile.name}]\n\n\`\`\`${fence}\n${pendingFile.content.trim()}\n\`\`\``;
    inputText = inputText ? inputText + '\n\n' + block : block;
    pendingFile = null;
    fileError = null;
  }

  function cancelAttachment() {
    pendingFile = null;
    fileError = null;
  }
</script>

{#if !chat.activeConversationId && chat.messages.length === 0}
  <!-- Empty state -->
  <div class="empty-state">
    <div class="empty-content">
      <h2>{modelName || 'a model'}</h2>
      <p>Type a message below to begin.</p>
    </div>
  </div>
{:else}
  <!-- Chat messages -->
  <div class="messages-area">
    {#each chat.messages as msg (msg.id)}
      <div class="message" class:user={msg.role === 'user'} class:assistant={msg.role === 'assistant'}>
        <div class="message-content">
          {#if msg.reasoning}
            <div class="reasoning-section">
              <button
                class="reasoning-toggle"
                onclick={() => toggleReasoning(msg.id)}
              >
                <span class="reasoning-icon">
                  {#if expandedReasoning[msg.id]}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  {:else}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  {/if}
                </span>
                <span class="reasoning-label">{expandedReasoning[msg.id] ? 'Hide reasoning' : 'Show reasoning'}</span>
              </button>
              {#if expandedReasoning[msg.id]}
                <div class="reasoning-content"><div class="markdown">{@html renderMarkdown(msg.reasoning)}</div></div>
              {/if}
            </div>
          {/if}
          <div class="message-text"><div class="markdown">{@html renderMarkdown(msg.content)}</div></div>
          {#if msg.tokensIn}
            <div class="message-meta">{msg.tokensIn}↑ {msg.tokensOut}↓</div>
          {/if}
          {#if msg.role === 'assistant'}
            <div class="message-actions">
              <button
                class="copy-btn"
                class:copied={copiedId === msg.id}
                title={copiedId === msg.id ? 'Copied!' : 'Copy response'}
                onclick={() => copyResponse(msg)}
              >
                {#if copiedId === msg.id}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                {:else}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                {/if}
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/each}

    <!-- Streaming message -->
    {#if chat.isStreaming && (chat.streamingContent || chat.streamingReasoning)}
      <div class="message assistant">
        <div class="message-content">
          {#if chat.streamingReasoning}
            <div class="reasoning-section">
              <button
                class="reasoning-toggle"
                onclick={() => toggleReasoning('streaming')}
              >
                <span class="reasoning-icon">
                  {expandedReasoning['streaming'] ? '▼' : '▶'}
                </span>
                <span class="reasoning-label">
                  {expandedReasoning['streaming'] ? 'Hide reasoning' : 'Show reasoning'}
                </span>
              </button>
              {#if expandedReasoning['streaming']}
                <div class="reasoning-content reasoning-streaming"><div class="markdown">{@html renderMarkdown(chat.streamingReasoning)}</div><span class="cursor">|</span></div>
              {/if}
            </div>
          {/if}
          <div class="message-text streaming"><div class="markdown">{@html renderMarkdown(chat.streamingContent)}</div><span class="cursor">|</span></div>
        </div>
      </div>
    {/if}

    <!-- Error -->
    {#if chat.error}
      <div class="message error">
        <div class="message-content">
          <div class="message-text error-text">{chat.error}</div>
          {#if onResend}
            <button class="btn-resend" onclick={() => onResend()} title="Retry the last prompt without repeating it">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Resend
            </button>
          {/if}
        </div>
      </div>
    {/if}

    <div bind:this={messagesEnd}></div>
  </div>
{/if}

<!-- Input area — always at bottom -->
<div class="input-area">
  <input
    type="file"
    bind:this={fileInputEl}
    class="file-input"
    accept=".txt,.md,.markdown,text/plain,text/markdown"
    onchange={handleFiles}
    hidden
  />
  <textarea
    bind:this={inputEl}
    class="chat-input"
    placeholder="Type your message..."
    bind:value={inputText}
    onkeydown={handleKeydown}
    disabled={chat.isStreaming}
    rows="1"
  ></textarea>
  <button
    class="btn-attach"
    disabled={chat.isStreaming}
    onclick={openFilePicker}
    title="Attach a .txt/.md file"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  </button>
  <button
    class="btn-send"
    disabled={!inputText.trim() || chat.isStreaming}
    onclick={handleSend}
    aria-label="Send message"
    title="Send"
  >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m5 12h14M12 5l7 7-7 7"/>
      </svg>
    </button>
</div>

{#if fileError}
  <div class="file-error-banner">
    <span>{fileError}</span>
    <button class="file-error-close" onclick={() => (fileError = null)} aria-label="Dismiss">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>
{/if}

{#if pendingFile}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="attach-overlay" role="presentation" onclick={cancelAttachment}>
    <div class="attach-modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()}>
      <div class="attach-header">
        <h4>Attach file</h4>
        <button class="attach-close" onclick={cancelAttachment} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="attach-meta">
        <span class="attach-name" title={pendingFile.name}>{pendingFile.name}</span>
        <span class="attach-type">.{pendingFile.ext}</span>
        <span class="attach-size">{formatBytes(pendingFile.size)}</span>
      </div>
      <pre class="attach-preview">{pendingFile.content.slice(0, 2000)}{pendingFile.content.length > 2000 ? '\n… (preview truncated)' : ''}</pre>
      {#if pendingFile.size > ATTACH_WARN_BYTES}
        <div class="attach-warning">
          ⚠️ This file is {formatBytes(pendingFile.size)} — roughly {Math.round(pendingFile.size / 4)} tokens. It will use a lot of context; consider trimming it to the relevant part before sending.
        </div>
      {/if}
      <div class="attach-actions">
        <button class="attach-cancel" onclick={cancelAttachment}>Cancel</button>
        <button class="attach-confirm" onclick={confirmAttachment}>Add to message</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Empty state */
  .empty-state {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .empty-content { text-align: center; }
  .empty-content h2 { margin: 0 0 var(--pad-sm); font-size: var(--font-xl); }
  .empty-content p { margin: 0; font-size: var(--font-md); opacity: 0.7; }

  /* Messages */
  .messages-area {
    flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px;
  }
  .message {
    display: flex; gap: 12px; padding: 12px 16px; border-radius: 12px;
    max-width: 85%; animation: fadeIn 0.2s ease;
  }
  .message.user { background: var(--user-msg); align-self: flex-end; }
  .message.assistant { background: var(--assistant-msg); align-self: flex-start; }
  .message.error { background: var(--error-bg); align-self: center; border: 1px solid var(--error-border); }

  .message-text { font-size: var(--font-md); line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .message-meta { font-size: var(--font-xs); opacity: 0.5; margin-top: var(--pad-xs); }

  /* Copy action on assistant responses */
  .message-actions {
    display: flex; justify-content: flex-end; margin-top: var(--pad-xs);
  }
  .copy-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 6px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text-secondary); cursor: pointer; opacity: 0.55;
    transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .copy-btn:hover { opacity: 1; color: var(--accent); border-color: var(--accent); }
  .copy-btn.copied { opacity: 1; color: var(--accent); border-color: var(--accent); }
  .streaming .cursor { animation: blink 0.8s infinite; }
  .error-text { color: var(--error); }
  .btn-resend {
    display: inline-flex; align-items: center; gap: 6px; margin-top: var(--pad-sm);
    padding: 6px 12px; border-radius: 8px; cursor: pointer; font-family: inherit;
    font-size: var(--font-sm); font-weight: 500; color: var(--accent);
    background: var(--surface); border: 1px solid var(--accent);
  }
  .btn-resend:hover { background: var(--accent); color: white; }

  /* Reasoning */
  .reasoning-section {
    margin-bottom: var(--pad-sm);
  }
  .reasoning-toggle {
    display: inline-flex; align-items: center; gap: 4px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 2px 8px; cursor: pointer;
    font-size: var(--font-xs); color: var(--text-secondary);
    font-family: inherit;
  }
  .reasoning-toggle:hover {
    border-color: var(--accent); color: var(--accent);
  }
  .reasoning-icon { font-size: 10px; }
  .reasoning-label { font-size: var(--font-xs); }
  .reasoning-content {
    margin-top: var(--pad-xs); padding: var(--pad-sm);
    background: var(--reasoning-bg); border-radius: 8px;
    border-left: 3px solid var(--accent);
    font-size: var(--font-sm); line-height: 1.5;
    white-space: pre-wrap; word-break: break-word;
    opacity: 0.85; max-height: 300px; overflow-y: auto;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

  /* Input */
  .input-area {
    display: flex; align-items: center; gap: 8px; padding: 12px 16px;
    border-top: 1px solid var(--border);
    background: var(--header-bg);
  }
  .btn-attach {
    width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text-secondary); font-size: 18px; cursor: pointer;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    transition: opacity 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .btn-attach:hover { color: var(--accent); border-color: var(--accent); opacity: 1; }
  .btn-attach:disabled { opacity: 0.4; cursor: not-allowed; }

  /* File error banner */
  .file-error-banner {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 8px 16px; background: var(--error-bg); border-top: 1px solid var(--error-border);
    color: var(--error); font-size: var(--font-sm);
  }
  .file-error-close {
    background: none; border: none; color: var(--error); cursor: pointer; opacity: 0.6;
    display: flex; align-items: center; padding: 2px;
  }
  .file-error-close:hover { opacity: 1; }

  /* Attach modal */
  .attach-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 60;
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .attach-modal {
    width: min(560px, 100%); max-height: 85vh; display: flex; flex-direction: column;
    background: var(--bg); color: var(--text); border: 1px solid var(--border);
    border-radius: 12px; box-shadow: 0 12px 48px rgba(0,0,0,0.3); overflow: hidden;
  }
  .attach-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--header-bg);
  }
  .attach-header h4 { margin: 0; font-size: 15px; }
  .attach-close {
    background: none; border: none; color: var(--text); opacity: 0.5; cursor: pointer;
    display: flex; align-items: center; padding: 4px;
  }
  .attach-close:hover { opacity: 1; }
  .attach-meta {
    display: flex; align-items: center; gap: 8px; padding: 10px 16px 0;
    font-size: var(--font-sm);
  }
  .attach-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .attach-type {
    flex-shrink: 0; padding: 1px 6px; border-radius: 4px; background: var(--surface);
    border: 1px solid var(--border); font-size: var(--font-xs); text-transform: uppercase; opacity: 0.7;
  }
  .attach-size { color: var(--text-secondary); flex-shrink: 0; }
  .attach-preview {
    flex: 1; margin: 10px 16px 0; padding: 10px; border-radius: 8px;
    background: var(--input-bg); border: 1px solid var(--border);
    font-family: monospace; font-size: var(--font-xs); line-height: 1.5;
    white-space: pre-wrap; word-break: break-word; overflow-y: auto; max-height: 40vh; min-height: 80px;
  }
  .attach-warning {
    margin: 10px 16px 0; padding: 8px 10px; border-radius: 8px;
    background: color-mix(in srgb, #f59e0b 15%, transparent);
    border: 1px solid color-mix(in srgb, #f59e0b 50%, transparent);
    font-size: var(--font-sm); line-height: 1.4;
  }
  .attach-actions {
    display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px;
  }
  .attach-cancel, .attach-confirm {
    padding: 7px 14px; border-radius: 8px; cursor: pointer; font-family: inherit;
    font-size: var(--font-sm); font-weight: 500;
  }
  .attach-cancel { background: var(--surface); border: 1px solid var(--border); color: var(--text); }
  .attach-cancel:hover { background: var(--border); }
  .attach-confirm { background: var(--accent); border: 1px solid var(--accent); color: white; }
  .attach-confirm:hover { opacity: 0.9; }
  .chat-input {
    flex: 1; min-height: 40px; max-height: 200px; padding: 8px 14px; border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--input-bg); color: var(--text); font-size: var(--font-md); resize: none;
    font-family: inherit; line-height: 1.4; field-sizing: content;
  }
  .chat-input:focus { outline: none; border-color: var(--accent); }
  .chat-input:disabled { opacity: 0.5; }
  .btn-send {
    width: 40px; height: 40px; border-radius: 10px; border: none; background: var(--accent);
    color: white; font-size: 18px; cursor: pointer; flex-shrink: 0; display: flex;
    align-items: center; justify-content: center;
  }
  .btn-send:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (max-width: 768px) {
    .message { max-width: 92%; }
  }
</style>