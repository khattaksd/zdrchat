<script lang="ts">
  import { chat } from '$lib/store/chat.svelte.ts';

  let {
    inputText = $bindable(''),
    messagesEnd = $bindable<HTMLDivElement | undefined>(undefined),
    inputEl = $bindable<HTMLTextAreaElement | undefined>(undefined),
    handleSend = undefined as (() => void) | undefined,
    handleKeydown = undefined as ((e: KeyboardEvent) => void) | undefined,
  } = $props();
</script>

{#if !chat.activeConversationId && chat.messages.length === 0}
  <!-- Empty state -->
  <div class="empty-state">
    <div class="empty-content">
      <h2>Start a conversation</h2>
      <p>Type a message below to begin.</p>
    </div>
  </div>
{:else}
  <!-- Chat messages -->
  <div class="messages-area">
    {#each chat.messages as msg (msg.id)}
      <div class="message" class:user={msg.role === 'user'} class:assistant={msg.role === 'assistant'}>
        <div class="message-avatar">{msg.role === 'user' ? '🧑' : '🤖'}</div>
        <div class="message-content">
          <div class="message-text">{msg.content}</div>
          {#if msg.tokensIn}
            <div class="message-meta">{msg.tokensIn}↑ {msg.tokensOut}↓</div>
          {/if}
        </div>
      </div>
    {/each}

    <!-- Streaming message -->
    {#if chat.isStreaming && chat.streamingContent}
      <div class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-text streaming">{chat.streamingContent}<span class="cursor">|</span></div>
        </div>
      </div>
    {/if}

    <!-- Error -->
    {#if chat.error}
      <div class="message error">
        <div class="message-avatar">⚠️</div>
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
  >➤</button>
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
  .message-avatar { font-size: 22px; flex-shrink: 0; }
  .message-text { font-size: var(--font-md); line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .message-meta { font-size: var(--font-xs); opacity: 0.5; margin-top: var(--pad-xs); }
  .streaming .cursor { animation: blink 0.8s infinite; }
  .error-text { color: var(--error); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

  /* Input */
  .input-area {
    display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border);
    background: var(--header-bg);
  }
  .chat-input {
    flex: 1; padding: var(--pad-md); border-radius: 10px; border: 1px solid var(--border);
    background: var(--input-bg); color: var(--text); font-size: var(--font-md); resize: none;
    font-family: inherit; line-height: 1.4; max-height: 120px;
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