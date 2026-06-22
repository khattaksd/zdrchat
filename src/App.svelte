<script lang="ts">
  import { onMount } from 'svelte';
  import { chat } from '$lib/store/chat.svelte.ts';
  import { settings } from '$lib/store/settings.svelte.ts';
  import { status } from '$lib/store/status.svelte.ts';
  import { OpenRouterClient } from '$lib/api/openrouter';
  import { db, createConversation, addMessage, getConversationMessages, getSetting, setSetting } from '$lib/db/dexie';
  import type { Conversation, Message } from '$lib/db/dexie';
  import type { Model } from '$lib/api/types';
  import { MODEL_BUCKETS } from '$lib/api/types';
  import { categorizeModels } from '$lib/api/models';
  import StatusBar from '$lib/components/StatusBar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import ModelPicker from '$lib/components/ModelPicker.svelte';
  import SettingsPanel from '$lib/components/SettingsPanel.svelte';
  import WelcomeOverlay from '$lib/components/WelcomeOverlay.svelte';

  let client: OpenRouterClient | null = null;
  let inputText = $state('');

  let showSidebar = $state(true);
  let showModelPicker = $state(false);
  let showSettings = $state(false);
  let messagesEnd: HTMLDivElement | undefined = $state();
  let inputEl: HTMLTextAreaElement | undefined = $state();
  let modelsByBucket: Record<string, Model[]> = $state({});
  let _density: string = $state('cozy');

  onMount(async () => {
    // Load persisted settings
    const savedKey = await getSetting('apiKey', '');
    const savedTheme = await getSetting('theme', 'dark');
    const savedModel = await getSetting('defaultModel', '');
    const savedZdr = await getSetting('zdrOnly', false);
    const savedNoTrain = await getSetting('noTraining', false);
    const savedDensity = await getSetting('density', 'cozy');

    if (savedKey) settings.apiKey = savedKey;
    settings.theme = savedTheme as any;
    applyTheme(savedTheme);
    _density = savedDensity;
    applyDensity(savedDensity);
    if (savedModel) settings.defaultModel = savedModel;
    settings.zdrOnly = savedZdr;
    settings.noTraining = savedNoTrain;

    // Load conversations
    const convs = await db.conversations.orderBy('updatedAt').reverse().toArray();
    chat.conversations = convs;

    // Load messages for active conversation
    if (chat.activeConversationId) {
      const msgs = await getConversationMessages(chat.activeConversationId);
      chat.messages = msgs;
      recalcSessionTotals(msgs);
    }

    // If there's a key, initialize client
    if (savedKey) {
      await initClient(savedKey);
    }

    settings.isInitialized = true;

    // Online/offline detection
    status.isOnline = navigator.onLine;
    window.addEventListener('online', () => { status.isOnline = true; });
    window.addEventListener('offline', () => { status.isOnline = false; });
  });

  async function initClient(key: string) {
    client = new OpenRouterClient(key);
    try {
      const [models, zdrSet] = await Promise.all([
        client.fetchModels(),
        client.fetchZdrEndpoints(),
      ]);

      // Tag each model with ZDR availability
      for (const m of models) {
        m.hasZdrEndpoint = zdrSet.has(m.id);
      }

      settings.models = models;
      modelsByBucket = categorizeModels(models);

      if (!settings.defaultModel && models.length > 0) {
        const smartModel = models.find(m => m.id.startsWith('anthropic/claude-sonnet') || m.id.startsWith('anthropic/claude-opus'));
        const id = smartModel?.id || models[0].id;
        settings.defaultModel = id;
        const found = models.find(m => m.id === id);
        if (found) status.currentModel = found;
      }

      const [keyInfo, credits] = await Promise.all([
        client.fetchKeyInfo(),
        client.fetchCredits(),
      ]);
      settings.creditBalance = keyInfo.limitRemaining;
      status.creditBalance = keyInfo.limitRemaining;
    } catch (e) {
      console.error('Failed to initialize API client:', e);
    }
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || !client || chat.isStreaming) return;

    try {
      let convId = chat.activeConversationId;
      if (!convId) {
        const conv = await createConversation(settings.defaultModel, text.slice(0, 50));
        convId = conv.id;
        chat.activeConversationId = conv.id;
        chat.conversations = [conv, ...chat.conversations];
      }

      inputText = '';
      chat.error = null;

      const userMsg = await addMessage({
        conversationId: convId,
        role: 'user',
        content: text,
        modelId: settings.defaultModel,
      });
      chat.messages = [...chat.messages, userMsg];

      const allMsgs = await getConversationMessages(convId);
      const apiMessages = allMsgs.map(m => ({ role: m.role, content: m.content }));

      const conv = chat.conversations.find(c => c.id === convId);
      if (conv?.systemPrompt) {
        apiMessages.unshift({ role: 'system', content: conv.systemPrompt });
      }

      chat.isStreaming = true;
      chat.streamingContent = '';
      let fullContent = '';
      let lastTokensIn = 0;
      let lastTokensOut = 0;
      let lastCost = 0;

      try {
        const stream = client.streamCompletion({
          model: settings.defaultModel,
          messages: apiMessages as any,
        });

        for await (const chunk of stream) {
          fullContent += chunk.content;
          chat.streamingContent += chunk.content;

          if (chunk.done && chunk.usage) {
            lastTokensIn = chunk.usage.prompt_tokens;
            lastTokensOut = chunk.usage.completion_tokens;
            lastCost = chunk.usage.cost ?? 0;
            status.sessionTokensIn += lastTokensIn;
            status.sessionTokensOut += lastTokensOut;
            status.sessionCost += lastCost;
          }
        }
      } catch (err: any) {
        const rawMsg = err.message || 'Stream failed';
        chat.error = rawMsg.startsWith('ZDR_ENFORCED:') ? rawMsg.replace('ZDR_ENFORCED:', '') : rawMsg;
        chat.isStreaming = false;
        return;
      }

      const assistantMsg = await addMessage({
        conversationId: convId,
        role: 'assistant',
        content: fullContent || '(no response)',
        modelId: settings.defaultModel,
        tokensIn: lastTokensIn || undefined,
        tokensOut: lastTokensOut || undefined,
        costUsd: lastCost || undefined,
      });
      chat.messages = [...chat.messages, assistantMsg];
      chat.streamingContent = '';

      if (allMsgs.length <= 1) {
        const title = text.length > 60 ? text.slice(0, 57) + '...' : text;
        await db.conversations.update(convId, { title });
        chat.conversations = chat.conversations.map(c => c.id === convId ? { ...c, title } : c);
      }

    } catch (err: any) {
      chat.error = err.message || 'Something went wrong';
    } finally {
      chat.isStreaming = false;
      setTimeout(() => messagesEnd?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function selectConversation(id: string) {
    chat.activeConversationId = id;
    const msgs = await getConversationMessages(id);
    chat.messages = msgs;
    recalcSessionTotals(msgs);
    chat.error = null;
    setTimeout(() => messagesEnd?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function newConversation() {
    chat.activeConversationId = null;
    chat.messages = [];
    chat.streamingContent = '';
    chat.error = null;
    status.sessionTokensIn = 0;
    status.sessionTokensOut = 0;
    status.sessionCost = 0;
  }

  function applyTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const themes = ['dark', 'light', 'sepia', 'nord', 'catppuccin', 'tokyo-night'];
    const idx = themes.indexOf(settings.theme);
    const next = themes[(idx + 1) % themes.length];
    settings.theme = next as any;
    applyTheme(next);
    setSetting('theme', next);
  }

  function toggleDensity() {
    const modes = ['tight', 'cozy', 'sparse'];
    const idx = modes.indexOf(_density);
    const next = modes[(idx + 1) % modes.length];
    _density = next;
    applyDensity(next);
    setSetting('density', next);
  }

  function applyDensity(density: string) {
    document.documentElement.setAttribute('data-density', density);
  }

  function getModelDisplay(id: string): string {
    const model = settings.models.find(m => m.id === id);
    return model?.name || id.split('/').pop() || id;
  }

  function recalcSessionTotals(msgs: Message[]) {
    let inTokens = 0, outTokens = 0, cost = 0;
    for (const m of msgs) {
      inTokens += m.tokensIn ?? 0;
      outTokens += m.tokensOut ?? 0;
      cost += m.costUsd ?? 0;
    }
    status.sessionTokensIn = inTokens;
    status.sessionTokensOut = outTokens;
    status.sessionCost = cost;
  }

  function handleApiKeySubmit(key: string) {
    settings.apiKey = key;
    setSetting('apiKey', key);
    initClient(key);
  }
</script>

{#if !settings.apiKey}
  <WelcomeOverlay onSubmit={handleApiKeySubmit} />
{:else}
  <div class="app-shell">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <button class="btn-icon" onclick={() => showSidebar = !showSidebar} title="Toggle sidebar">
        <span class="icon">☰</span>
      </button>
    </div>

    <div class="header-center">
      <a href="https://zdr.chat" target="_blank" rel="noopener" class="logo" title="ZDR Chat — visit ZDR.chat">
        <span class="logo-zdr">ZDR</span><span class="logo-dot">.</span><span class="logo-chat">chat</span>
      </a>
    </div>

    <div class="header-right">
      <button class="btn-icon" onclick={() => showSettings = !showSettings} title="Settings">⚙️</button>
      <button class="btn-icon" onclick={toggleTheme} title="Toggle theme">🎨</button>
      <button class="btn-icon" onclick={toggleDensity} title="Density: {_density}">
        {#if _density === 'tight'}📏{:else if _density === 'cozy'}📐{:else}📖{/if}
      </button>
    </div>
  </header>

  <div class="layout">
    <!-- Sidebar -->
    <div class="sidebar-wrapper" class:collapsed={!showSidebar}>
      <Sidebar
        conversations={chat.conversations}
        activeId={chat.activeConversationId}
        onSelect={selectConversation}
        onNew={newConversation}
      />
    </div>

    <!-- Main content -->
    <main class="main-content">
      {#if !settings.apiKey}
        <!-- Welcome / Key Entry -->
        <div class="welcome">
          <div class="welcome-card">
            <h1>🔒 ZDR Chat</h1>
            <p class="welcome-sub">Private AI chat. No account. No tracking.</p>
            <div class="welcome-steps">
              <div class="step">
                <span class="step-num">1</span>
                <span>Go to <a href="https://openrouter.ai/keys" target="_blank" rel="noopener">openrouter.ai/keys</a> — create a free account and copy your key</span>
              </div>
              <div class="step">
                <span class="step-num">2</span>
                <span>Paste it below to start chatting privately</span>
              </div>
            </div>
            <div class="key-input-row">
              <input
                type="password"
                class="key-input"
                placeholder="sk-or-v1-..."
                bind:value={inputText}
                onkeydown={(e) => { if (e.key === 'Enter') { handleApiKeySubmit(inputText); inputText = ''; } }}
              />
              <button
                class="btn-primary"
                disabled={!inputText.trim()}
                onclick={() => { handleApiKeySubmit(inputText); inputText = ''; }}
              >Connect</button>
            </div>
            <p class="key-note">🔑 Your key stays on this device. Never sent anywhere except to OpenRouter.</p>
          </div>
        </div>
      {:else if !chat.activeConversationId && chat.messages.length === 0}
        <!-- Empty state -->
        <div class="empty-state">
          <div class="empty-content">
            <h2>Your private AI awaits</h2>
            <p>Type a message or upload a document to start chatting.</p>
            <p class="empty-privacy">🔒 Everything stays in this browser. Even we can't see it.</p>
          </div>
          <div class="input-area">
            <textarea
              bind:this={inputEl}
              class="chat-input"
              placeholder="Type your message..."
              bind:value={inputText}
              onkeydown={handleKeydown}
              rows="1"
            ></textarea>
            <button
              class="btn-send"
              disabled={!inputText.trim() || chat.isStreaming}
              onclick={sendMessage}
            >➤</button>
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

        <!-- Input area -->
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
            onclick={sendMessage}
          >➤</button>
        </div>
      {/if}
    </main>
  </div>

  <!-- Status Bar -->
  <StatusBar
    online={status.isOnline}
    modelName={getModelDisplay(settings.defaultModel)}
    tokensIn={status.sessionTokensIn}
    tokensOut={status.sessionTokensOut}
    cost={status.sessionCost}
    creditBalance={status.creditBalance}
    onModelClick={() => showModelPicker = !showModelPicker}
  />

  <!-- Model Picker Overlay -->
  {#if showModelPicker}
    <ModelPicker
      models={settings.models}
      buckets={modelsByBucket}
      currentModel={settings.defaultModel}
      zdrSet={new Set(settings.models.filter(m => m.hasZdrEndpoint).map(m => m.id))}
      onSelect={(modelId: string) => {
        settings.defaultModel = modelId;
        const model = settings.models.find(m => m.id === modelId);
        if (model) status.currentModel = model;
        setSetting('defaultModel', modelId);
        showModelPicker = false;
      }}
      onClose={() => showModelPicker = false}
    />
  {/if}

  <!-- Settings Panel -->
  {#if showSettings}
    <SettingsPanel
      apiKey={settings.apiKey}
      theme={settings.theme}
      creditBalance={settings.creditBalance}
      storageInfo={{ conversations: chat.conversations.length }}
      onUpdateKey={(key: string) => {
        settings.apiKey = key;
        setSetting('apiKey', key);
        initClient(key);
      }}
      onUpdateTheme={(t: string) => {
        settings.theme = t as any;
        applyTheme(t);
        setSetting('theme', t);
      }}
      onClose={() => showSettings = false}
    />
  {/if}
</div>
{/if}

<style>
  .app-shell { display: flex; flex-direction: column; height: 100vh; background: var(--bg); color: var(--text); }

  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 16px; border-bottom: 1px solid var(--border); height: 52px;
    flex-shrink: 0; background: var(--header-bg); z-index: 10;
  }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .header-center {
    display: flex; align-items: center; position: absolute; left: 50%;
    transform: translateX(-50%);
  }
  .header-right { display: flex; align-items: center; gap: 4px; }

  .logo {
    text-decoration: none; display: flex; align-items: center; gap: 0;
    font-size: var(--font-lg); font-weight: 700; letter-spacing: -0.5px;
    user-select: none;
  }
  .logo-zdr { color: var(--accent); }
  .logo-dot { color: var(--text-secondary); opacity: 0.4; }
  .logo-chat { color: var(--text); opacity: 0.7; font-weight: 400; }

  .sidebar-wrapper {
    width: 260px; overflow: hidden; flex-shrink: 0; height: 100%;
    transition: width 0.25s ease, opacity 0.25s ease;
  }
  .sidebar-wrapper.collapsed {
    width: 0; opacity: 0;
  }

  .btn-icon {
    background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px;
    font-size: 18px; line-height: 1; color: var(--text); opacity: 0.7;
  }
  .btn-icon:hover { opacity: 1; background: var(--surface); }

  .layout { display: flex; flex: 1; overflow: hidden; }

  .main-content {
    flex: 1; display: flex; flex-direction: column; overflow: hidden;
    position: relative;
  }

  /* Welcome */
  .welcome {
    flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .welcome-card {
    max-width: 480px; width: 100%; padding: 32px; border-radius: 16px;
    background: var(--surface); border: 1px solid var(--border);
  }
  .welcome-card h1 { margin: 0 0 var(--pad-sm); font-size: var(--font-xl); }
  .welcome-sub { margin: 0 0 var(--pad-xl); font-size: var(--font-md); opacity: 0.7; }
  .welcome-steps { margin-bottom: var(--pad-xl); }
  .step { display: flex; align-items: flex-start; gap: var(--pad-md); margin-bottom: var(--pad-md); font-size: var(--font-md); }
  .step-num {
    width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: white;
    display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600;
    flex-shrink: 0;
  }
  .key-input-row { display: flex; gap: 8px; }
  .key-input {
    flex: 1; padding: var(--pad-md); border-radius: 8px; border: 1px solid var(--border);
    background: var(--input-bg); color: var(--text); font-size: var(--font-md); font-family: monospace;
  }
  .key-input:focus { outline: none; border-color: var(--accent); }
  .key-note { margin: 12px 0 0; font-size: 12px; opacity: 0.6; }

  .btn-primary {
    padding: 10px 20px; border-radius: 8px; border: none; background: var(--accent); color: white;
    font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;
  }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Empty state */
  .empty-state {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 24px; gap: 24px;
  }
  .empty-content { text-align: center; }
  .empty-content h2 { margin: 0 0 var(--pad-sm); font-size: var(--font-xl); }
  .empty-content p { margin: 0; font-size: var(--font-md); opacity: 0.7; }
  .empty-privacy { margin-top: var(--pad-sm) !important; font-size: var(--font-sm) !important; }

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
    .sidebar-wrapper:not(.collapsed) { position: fixed; left: 0; top: 52px; bottom: 40px; z-index: 20; }
  }
</style>