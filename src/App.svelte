<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { chatStore } from './lib/store/chat';
  import { settingsStore } from './lib/store/settings';
  import { statusStore } from './lib/store/status';
  import { OpenRouterClient } from './lib/api/openrouter';
  import { db, createConversation, addMessage, getConversationMessages, getSetting, setSetting } from './lib/db/dexie';
  import type { Conversation, Message } from './lib/db/dexie';
  import type { Model } from './lib/api/types';
  import { MODEL_BUCKETS } from './lib/api/types';
  import StatusBar from './lib/components/StatusBar.svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import ModelPicker from './lib/components/ModelPicker.svelte';
  import SettingsPanel from './lib/components/SettingsPanel.svelte';

  // Reactive: $chatStore etc auto-subscribe in templates
  // For imperative reads in script, use get() or local $state mirrors

  let client: OpenRouterClient | null = null;
  let inputText = $state('');
  let keyInputText = $state('');
  let showSidebar = $state(true);
  let showModelPicker = $state(false);
  let showSettings = $state(false);
  let messagesEnd: HTMLDivElement | undefined = $state();
  let inputEl: HTMLTextAreaElement | undefined = $state();
  let modelsByBucket: Record<string, Model[]> = $state({});

  // Local mirrors for reactive script access (templates use $chatStore directly)
  let _streaming = $state(false);
  let _streamingContent = $state('');
  let _error: string | null = $state(null);
  let _messages: Message[] = $state([]);
  let _activeConvId: string | null = $state(null);
  let _conversations: Conversation[] = $state([]);
  let _apiKey = $state('');
  let _defaultModel = $state('');
  let _models: Model[] = $state([]);
  let _zdrOnly = $state(false);
  let _noTraining = $state(false);
  let _theme: string = $state('dark');
  let _density: string = $state('cozy');
  let _creditBalance: number | null = $state(null);
  let _online = $state(true);
  let _tokensIn = $state(0);
  let _tokensOut = $state(0);
  let _sessionCost = $state(0);

  // Sync from stores on mount
  onMount(async () => {
    const s = get(settingsStore);
    _apiKey = s.apiKey;
    _theme = s.theme;
    _defaultModel = s.defaultModel;
    _zdrOnly = s.zdrOnly;
    _noTraining = s.noTraining;
    _creditBalance = s.creditBalance;
    _models = s.models;

    const c = get(chatStore);
    _conversations = c.conversations;
    _activeConvId = c.activeConversationId;
    _messages = c.messages;
    _streaming = c.isStreaming;
    _streamingContent = c.streamingContent;
    _error = c.error;

    const st = get(statusStore);
    _online = st.isOnline;
    _tokensIn = st.sessionTokensIn;
    _tokensOut = st.sessionTokensOut;
    _sessionCost = st.sessionCost;

    // Load persisted settings
    const savedKey = await getSetting('apiKey', '');
    const savedTheme = await getSetting('theme', 'dark');
    const savedModel = await getSetting('defaultModel', '');
    const savedZdr = await getSetting('zdrOnly', false);
    const savedNoTrain = await getSetting('noTraining', false);

    if (savedKey) {
      _apiKey = savedKey;
      settingsStore.setApiKey(savedKey);
    }
    _theme = savedTheme;
    settingsStore.setTheme(savedTheme as any);
    applyTheme(savedTheme);

    // Load persisted density
    const savedDensity = await getSetting('density', 'cozy');
    _density = savedDensity;
    applyDensity(savedDensity);

    if (savedModel) {
      _defaultModel = savedModel;
      settingsStore.setDefaultModel(savedModel);
    }
    _zdrOnly = savedZdr;
    settingsStore.setZdrOnly(savedZdr);
    _noTraining = savedNoTrain;
    settingsStore.setNoTraining(savedNoTrain);

    // Load conversations
    const convs = await db.conversations.orderBy('updatedAt').reverse().toArray();
    _conversations = convs;
    chatStore.setConversations(convs);

    // Load messages for active conversation
    if (_activeConvId) {
      const msgs = await getConversationMessages(_activeConvId);
      _messages = msgs;
      chatStore.setMessages(msgs);
      recalcSessionTotals(msgs);
    }

    // If there's a key, initialize client
    if (savedKey) {
      await initClient(savedKey);
    }

    settingsStore.setIsInitialized(true);

    // Online/offline detection
    _online = navigator.onLine;
    statusStore.setIsOnline(navigator.onLine);
    window.addEventListener('online', () => { _online = true; statusStore.setIsOnline(true); });
    window.addEventListener('offline', () => { _online = false; statusStore.setIsOnline(false); });
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

      _models = models;
      settingsStore.setModels(models);
      categorizeModels(models);

      if (!_defaultModel && models.length > 0) {
        const smartModel = models.find(m => m.id.startsWith('anthropic/claude-sonnet') || m.id.startsWith('anthropic/claude-opus'));
        const id = smartModel?.id || models[0].id;
        _defaultModel = id;
        settingsStore.setDefaultModel(id);
        const found = models.find(m => m.id === id);
        if (found) statusStore.setCurrentModel(found);
      }

      const [keyInfo, credits] = await Promise.all([
        client.fetchKeyInfo(),
        client.fetchCredits(),
      ]);
      _creditBalance = keyInfo.limitRemaining;
      settingsStore.setCreditBalance(keyInfo.limitRemaining);
      statusStore.setCreditBalance(keyInfo.limitRemaining);
    } catch (e) {
      console.error('Failed to initialize API client:', e);
    }
  }

  function categorizeModels(models: Model[]) {
    const buckets: Record<string, Model[]> = {};
    for (const b of MODEL_BUCKETS) buckets[b.key] = [];
    buckets.other = [];

    // Sort helper: context_length descending (most capable first), fallback to name
    const sortByCapability = (a: Model, b: Model) => (b.context_length || 0) - (a.context_length || 0) || a.id.localeCompare(b.id);

    for (const m of models) {
      const id = m.id;
      const isFree = id.endsWith(':free');
      const isVision = m.architecture?.input_modalities?.includes('image');
      const isCode = id.includes('coder') || id.includes('code') || id.includes('deepseek');
      const isCreative = id.includes('sonnet') || id.includes('mistral-large');
      const isSmart = id.includes('opus') || id.includes('gpt-5') || id.includes('gemini-2.5-pro') || id.includes('sonnet-4');
      const isFast = id.includes('mini') || id.includes('haiku') || id.includes('flash') || id.includes('llama-3');

      if (isFree) buckets.free.push(m);
      if (isSmart) buckets.smartest.push(m);
      if (isFast && !isSmart) buckets.fast.push(m);
      if (isCreative && !isSmart) buckets.creative.push(m);
      if (isCode && !isSmart && !isFast) buckets.code.push(m);
      if (isVision && !buckets.smartest.includes(m) && !buckets.fast.includes(m)) buckets.vision.push(m);
      if (!isFree && !isSmart && !isFast && !isCreative && !isCode && !isVision) buckets.other.push(m);
    }

    // Sort each bucket by capability descending
    for (const key of Object.keys(buckets)) {
      buckets[key].sort(sortByCapability);
    }

    // Limit Smartest to top 10, others to top 30
    buckets.smartest = buckets.smartest.slice(0, 10);
    for (const key of Object.keys(buckets)) {
      if (key !== 'smartest') buckets[key] = buckets[key].slice(0, 30);
    }

    modelsByBucket = buckets;
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || !client || _streaming) return;

    try {
      let convId = _activeConvId;
      if (!convId) {
        const conv = await createConversation(_defaultModel, text.slice(0, 50));
        convId = conv.id;
        _activeConvId = conv.id;
        chatStore.setActiveConversation(conv.id);
        _conversations = [conv, ..._conversations];
        chatStore.setConversations(_conversations);
      }

      inputText = '';
      _error = null;
      chatStore.setError(null);

      const userMsg = await addMessage({
        conversationId: convId,
        role: 'user',
        content: text,
        modelId: _defaultModel,
      });
      _messages = [..._messages, userMsg];
      chatStore.addMessage(userMsg);

      const allMsgs = await getConversationMessages(convId);
      const apiMessages = allMsgs.map(m => ({ role: m.role, content: m.content }));

      const conv = _conversations.find(c => c.id === convId);
      if (conv?.systemPrompt) {
        apiMessages.unshift({ role: 'system', content: conv.systemPrompt });
      }

      _streaming = true;
      _streamingContent = '';
      chatStore.setIsStreaming(true);
      chatStore.setStreamingContent('');
      let fullContent = '';
      let lastTokensIn = 0;
      let lastTokensOut = 0;
      let lastCost = 0;

      let stream;
      try {
        stream = client.streamCompletion({
          model: _defaultModel,
          messages: apiMessages as any,
        });

        for await (const chunk of stream) {
          fullContent += chunk.content;
          _streamingContent += chunk.content;
          chatStore.appendStreamingContent(chunk.content);

          if (chunk.done && chunk.usage) {
            lastTokensIn = chunk.usage.prompt_tokens;
            lastTokensOut = chunk.usage.completion_tokens;
            lastCost = chunk.usage.cost ?? 0;
            _tokensIn += lastTokensIn;
            _tokensOut += lastTokensOut;
            _sessionCost += lastCost;
            statusStore.addTokens(lastTokensIn, lastTokensOut, lastCost);
          }
        }
      } catch (err: any) {
        const rawMsg = err.message || 'Stream failed';
        _error = rawMsg.startsWith('ZDR_ENFORCED:') ? rawMsg.replace('ZDR_ENFORCED:', '') : rawMsg;
        chatStore.setError(_error);
        _streaming = false;
        chatStore.setIsStreaming(false);
        return;
      }

      const assistantMsg = await addMessage({
        conversationId: convId,
        role: 'assistant',
        content: fullContent || '(no response)',
        modelId: _defaultModel,
        tokensIn: lastTokensIn || undefined,
        tokensOut: lastTokensOut || undefined,
        costUsd: lastCost || undefined,
      });
      _messages = [..._messages, assistantMsg];
      chatStore.addMessage(assistantMsg);
      _streamingContent = '';
      chatStore.setStreamingContent('');

      if (allMsgs.length <= 1) {
        const title = text.length > 60 ? text.slice(0, 57) + '...' : text;
        await db.conversations.update(convId, { title });
        _conversations = _conversations.map(c => c.id === convId ? { ...c, title } : c);
        chatStore.setConversations(_conversations);
      }

    } catch (err: any) {
      _error = err.message || 'Something went wrong';
      chatStore.setError(_error);
    } finally {
      _streaming = false;
      chatStore.setIsStreaming(false);
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
    _activeConvId = id;
    chatStore.setActiveConversation(id);
    const msgs = await getConversationMessages(id);
    _messages = msgs;
    chatStore.setMessages(msgs);
    recalcSessionTotals(msgs);
    _error = null;
    chatStore.setError(null);
    setTimeout(() => messagesEnd?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function newConversation() {
    _activeConvId = null;
    chatStore.setActiveConversation(null);
    _messages = [];
    chatStore.setMessages([]);
    _streamingContent = '';
    chatStore.setStreamingContent('');
    _error = null;
    chatStore.setError(null);
    statusStore.resetSession();
    _tokensIn = 0;
    _tokensOut = 0;
    _sessionCost = 0;
  }

  function applyTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const themes = ['dark', 'light', 'sepia', 'nord', 'catppuccin', 'tokyo-night'];
    const idx = themes.indexOf(_theme);
    const next = themes[(idx + 1) % themes.length];
    _theme = next;
    settingsStore.setTheme(next as any);
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
    const model = _models.find(m => m.id === id);
    return model?.name || id.split('/').pop() || id;
  }

  function recalcSessionTotals(msgs: Message[]) {
    let inTokens = 0, outTokens = 0, cost = 0;
    for (const m of msgs) {
      inTokens += m.tokensIn ?? 0;
      outTokens += m.tokensOut ?? 0;
      cost += m.costUsd ?? 0;
    }
    _tokensIn = inTokens;
    _tokensOut = outTokens;
    _sessionCost = cost;
    statusStore.resetSession();
    if (cost > 0) statusStore.addTokens(inTokens, outTokens, cost);
  }

  function handleApiKeySubmit(key: string) {
    _apiKey = key;
    settingsStore.setApiKey(key);
    setSetting('apiKey', key);
    initClient(key);
  }
</script>

{#if !_apiKey}
  <!-- Full-screen welcome overlay -->
  <div class="welcome-overlay">
    <div class="welcome-center">
      <svg class="welcome-logo" viewBox="0 0 100 100">
        <rect width="100" height="100" rx="20" fill="#10B981"/>
        <text x="50" y="68" font-family="system-ui, sans-serif" font-size="52" font-weight="bold" fill="#0F172A" text-anchor="middle">Z</text>
      </svg>
      <h1 class="welcome-title">Your Private AI</h1>
      <p class="welcome-tagline">No account · No servers · No tracking</p>

      <div class="welcome-input-row">
        <input
          type="password"
          class="welcome-key-input"
          placeholder="Paste your OpenRouter key"
          bind:value={keyInputText}
          onkeydown={(e) => { if (e.key === 'Enter') { handleApiKeySubmit(keyInputText); keyInputText = ''; } }}
        />
        <button
          class="welcome-connect-btn"
          disabled={!keyInputText.trim()}
          onclick={() => { handleApiKeySubmit(keyInputText); keyInputText = ''; }}
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

      <div class="welcome-footer">
        <div class="welcome-footer-tagline">Made for the privacy-conscious</div>
        <div class="welcome-footer-links">
          <a href="https://zdr.chat" target="_blank" rel="noopener">zdr.chat</a>
          <span class="welcome-dot">·</span>
          <a href="https://github.com/khattaksd/zdrchat" target="_blank" rel="noopener">GitHub</a>
          <span class="welcome-dot">·</span>
          <a href="https://openrouter.ai/settings/privacy" target="_blank" rel="noopener">Privacy</a>
        </div>
      </div>
    </div>
    <span class="welcome-build">{__BUILD_TIME__}</span>
  </div>
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
      <a href="https://zdr.chat" target="_blank" rel="noopener" class="logo" title="ZDR Chat — visit zdr.chat">
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
        conversations={_conversations}
        activeId={_activeConvId}
        onSelect={selectConversation}
        onNew={newConversation}
      />
    </div>

    <!-- Main content -->
    <main class="main-content">
      {#if !_apiKey}
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
      {:else if !_activeConvId && _messages.length === 0}
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
              disabled={!inputText.trim() || _streaming}
              onclick={sendMessage}
            >➤</button>
          </div>
        </div>
      {:else}
        <!-- Chat messages -->
        <div class="messages-area">
          {#each _messages as msg (msg.id)}
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
          {#if _streaming && _streamingContent}
            <div class="message assistant">
              <div class="message-avatar">🤖</div>
              <div class="message-content">
                <div class="message-text streaming">{_streamingContent}<span class="cursor">|</span></div>
              </div>
            </div>
          {/if}

          <!-- Error -->
          {#if _error}
            <div class="message error">
              <div class="message-avatar">⚠️</div>
              <div class="message-content">
                <div class="message-text error-text">{_error}</div>
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
            disabled={_streaming}
            rows="1"
          ></textarea>
          <button
            class="btn-send"
            disabled={!inputText.trim() || _streaming}
            onclick={sendMessage}
          >➤</button>
        </div>
      {/if}
    </main>
  </div>

  <!-- Status Bar -->
  <StatusBar
    online={_online}
    modelName={getModelDisplay(_defaultModel)}
    tokensIn={_tokensIn}
    tokensOut={_tokensOut}
    cost={_sessionCost}
    creditBalance={_creditBalance}
    onModelClick={() => showModelPicker = !showModelPicker}
  />

  <!-- Model Picker Overlay -->
  {#if showModelPicker}
    <ModelPicker
      models={_models}
      buckets={modelsByBucket}
      currentModel={_defaultModel}
      zdrSet={new Set(_models.filter(m => m.hasZdrEndpoint).map(m => m.id))}
      onSelect={(modelId: string) => {
        _defaultModel = modelId;
        settingsStore.setDefaultModel(modelId);
        const model = _models.find(m => m.id === modelId);
        if (model) statusStore.setCurrentModel(model);
        setSetting('defaultModel', modelId);
        showModelPicker = false;
      }}
      onClose={() => showModelPicker = false}
    />
  {/if}

  <!-- Settings Panel -->
  {#if showSettings}
    <SettingsPanel
      apiKey={_apiKey}
      theme={_theme}
      creditBalance={_creditBalance}
      storageInfo={{ conversations: _conversations.length }}
      onUpdateKey={(key: string) => {
        _apiKey = key;
        settingsStore.setApiKey(key);
        setSetting('apiKey', key);
        initClient(key);
      }}
      onUpdateTheme={(t: string) => {
        _theme = t;
        settingsStore.setTheme(t as any);
        applyTheme(t);
        setSetting('theme', t);
      }}
      onClose={() => showSettings = false}
    />
  {/if}
</div>
{/if}

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
    display: flex; gap: clamp(8px, 1vw, 16px);
    margin-bottom: clamp(12px, 1.5vw, 24px);
  }
  .welcome-key-input {
    flex: 1;
    padding: clamp(12px, 1.5vw, 24px) clamp(16px, 2vw, 32px);
    border-radius: clamp(10px, 1.2vw, 16px);
    border: 1px solid var(--border); background: var(--input-bg);
    color: var(--text);
    font-size: clamp(15px, 1.4vw, 24px);
    font-family: monospace;
  }
  .welcome-key-input:focus { outline: none; border-color: var(--accent); }
  .welcome-connect-btn {
    padding: clamp(12px, 1.5vw, 24px) clamp(24px, 3vw, 48px);
    border-radius: clamp(10px, 1.2vw, 16px); border: none;
    background: var(--accent); color: white;
    font-size: clamp(15px, 1.4vw, 24px);
    font-weight: 600; cursor: pointer; white-space: nowrap;
  }
  .welcome-connect-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .welcome-key-note {
    font-size: clamp(13px, 1.2vw, 20px);
    opacity: 0.55; margin: 0 0 clamp(16px, 2.5vw, 36px);
  }
  .welcome-cta {
    font-size: clamp(14px, 1.3vw, 22px);
    margin: 0 0 clamp(32px, 5vw, 72px);
  }
  .welcome-cta a { color: var(--accent); text-decoration: none; }
  .welcome-cta a:hover { text-decoration: underline; }
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