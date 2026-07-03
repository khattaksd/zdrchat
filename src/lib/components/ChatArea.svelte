<script lang="ts">
  import { chat } from '$lib/store/chat.svelte.ts';

  let {
    inputText = $bindable(''),
    messagesEnd = $bindable<HTMLDivElement | undefined>(undefined),
    inputEl = $bindable<HTMLTextAreaElement | undefined>(undefined),
    handleSend = undefined as (() => void) | undefined,
    handleKeydown = undefined as ((e: KeyboardEvent) => void) | undefined,
    onToggleModelPicker = undefined as (() => void) | undefined,
    modelName = '',
  } = $props();

  // Auto-focus input on mount and when starting a new conversation
  $effect(() => {
    if (!chat.activeConversationId && chat.messages.length === 0 && inputEl) {
      inputEl.focus();
    }
  });

  let expandedReasoning = $state<Record<string, boolean>>({});

  function toggleReasoning(id: string) {
    expandedReasoning[id] = !expandedReasoning[id];
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
                <div class="reasoning-content">{msg.reasoning}</div>
              {/if}
            </div>
          {/if}
          <div class="message-text">{msg.content}</div>
          {#if msg.tokensIn}
            <div class="message-meta">{msg.tokensIn}↑ {msg.tokensOut}↓</div>
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
                <div class="reasoning-content reasoning-streaming">{chat.streamingReasoning}<span class="cursor">|</span></div>
              {/if}
            </div>
          {/if}
          <div class="message-text streaming">{chat.streamingContent}<span class="cursor">|</span></div>
        </div>
      </div>
    {/if}

    <!-- Error -->
    {#if chat.error}
      <div class="message error">
        <div class="message-content">
          <div class="message-text error-text">{chat.error}</div>
        </div>
      </div>
    {/if}

    <div bind:this={messagesEnd}></div>
  </div>
{/if}

<!-- Input area — always at bottom -->
<div class="input-area">
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
    class="btn-send"
    disabled={!inputText.trim() || chat.isStreaming}
    onclick={handleSend}
  >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m5 12h14M12 5l7 7-7 7"/>
      </svg>
    </button>
</div>

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
  .streaming .cursor { animation: blink 0.8s infinite; }
  .error-text { color: var(--error); }

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