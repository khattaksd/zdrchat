<script lang="ts">

  import { OpenRouterClient } from "$lib/api/openrouter";
  import type { Model } from "$lib/api/types";
  import ChatArea from "$lib/components/ChatArea.svelte";
  import ModelPicker from "$lib/components/ModelPicker.svelte";
  import SettingsPanel from "$lib/components/SettingsPanel.svelte";
  import ConversationsPanel from "$lib/components/ConversationsPanel.svelte";
  import StatusBar from "$lib/components/StatusBar.svelte";
  import WelcomeOverlay from "$lib/components/WelcomeOverlay.svelte";
  import type { Message } from "$lib/db/dexie";
  import {
    addMessage,
    createConversation,
    db,
    deleteConversation,
    getConversationMessages,
    getSetting,
    setSetting,
  } from "$lib/db/dexie";
  import { chat } from "$lib/store/chat.svelte.ts";
  import { settings } from "$lib/store/settings.svelte.ts";
  import { status } from "$lib/store/status.svelte.ts";
  import { onMount } from "svelte";

  let client: OpenRouterClient | null = null;
  let inputText = $state("");

  let showConversations = $state(false);
  let showModelPicker = $state(false);
  let showSettings = $state(false);
  let messagesEnd: HTMLDivElement | undefined = $state();
  let inputEl: HTMLTextAreaElement | undefined = $state();

  let _density: string = $state("cozy");

  onMount(async () => {
    // Load persisted settings
    const savedKey = await getSetting("apiKey", "");
    const savedTheme = await getSetting("theme", "dark");
    const savedModel = await getSetting("defaultModel", "");
    const savedZdr = await getSetting("zdrOnly", true);
    const savedNoTrain = await getSetting("noTraining", true);
    const savedDensity = await getSetting("density", "cozy");

    if (savedKey) settings.apiKey = savedKey;
    settings.theme = savedTheme as any;
    applyTheme(savedTheme);
    _density = savedDensity;
    applyDensity(savedDensity);
    if (savedModel) settings.defaultModel = savedModel;
    settings.zdrOnly = savedZdr;
    settings.noTraining = savedNoTrain;

    // Load conversations
    const convs = await db.conversations
      .orderBy("updatedAt")
      .reverse()
      .toArray();
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
    window.addEventListener("online", () => {
      status.isOnline = true;
    });
    window.addEventListener("offline", () => {
      status.isOnline = false;
    });
  });

  async function initClient(key: string) {
    client = new OpenRouterClient(key);
    try {
      const [models, zdrSet] = await Promise.all([
        client.fetchModels(),
        client.fetchZdrEndpoints(),
      ]);

      // Tag each model with ZDR availability
      // ZDR endpoint modelId matches model.id (base slug, no version suffix)
      for (const m of models) {
        m.hasZdrEndpoint = zdrSet.has(m.id);
      }

      settings.models = models;

      // Fetch popular models from rankings (refresh if > 24h old)
      const lastFetch = settings.popularModelAsOf ? new Date(settings.popularModelAsOf) : null;
      const needsRefresh = !lastFetch || (Date.now() - lastFetch.getTime()) > 24 * 60 * 60 * 1000;
      if (needsRefresh) {
        const popular = await client.fetchPopularModels();
        settings.popularModelIds = popular.ids;
        settings.popularModelAsOf = popular.asOf;
      }

      if (!settings.defaultModel && models.length > 0) {
        const smartModel = models.find(
          (m) =>
            m.id.startsWith("anthropic/claude-sonnet") ||
            m.id.startsWith("anthropic/claude-opus"),
        );
        const id = smartModel?.id || models[0].id;
        settings.defaultModel = id;
        const found = models.find((m) => m.id === id);
        if (found) status.currentModel = found;
      }

      const [keyInfo, credits] = await Promise.all([
        client.fetchKeyInfo(),
        client.fetchCredits(),
      ]);
      settings.creditBalance = keyInfo.limitRemaining;
      status.creditBalance = keyInfo.limitRemaining;
    } catch (e) {
      console.error("Failed to initialize API client:", e);
    }
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || !client || chat.isStreaming) return;

    try {
      let convId = chat.activeConversationId;
      if (!convId) {
        const conv = await createConversation(
          settings.defaultModel,
          text.slice(0, 50),
        );
        convId = conv.id;
        chat.activeConversationId = conv.id;
        chat.conversations = [conv, ...chat.conversations];
      }

      inputText = "";
      chat.error = null;

      const userMsg = await addMessage({
        conversationId: convId,
        role: "user",
        content: text,
        modelId: settings.defaultModel,
      });
      chat.messages = [...chat.messages, userMsg];

      const allMsgs = await getConversationMessages(convId);
      const apiMessages = allMsgs.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const conv = chat.conversations.find((c) => c.id === convId);
      if (conv?.systemPrompt) {
        apiMessages.unshift({ role: "system", content: conv.systemPrompt });
      }

      chat.isStreaming = true;
      chat.streamingContent = "";
      chat.streamingReasoning = "";
      let fullContent = "";
      let fullReasoning = "";
      let lastTokensIn = 0;
      let lastTokensOut = 0;
      let lastCost = 0;

      try {
        const stream = client.streamCompletion({
          model: settings.defaultModel,
          messages: apiMessages as any,
          zdrOnly: settings.zdrOnly || undefined,
          noTraining: settings.noTraining || undefined,
        });

        for await (const chunk of stream) {
          fullContent += chunk.content;
          chat.streamingContent += chunk.content;

          if (chunk.reasoning) {
            fullReasoning += chunk.reasoning;
            chat.streamingReasoning += chunk.reasoning;
          }

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
        const rawMsg = err.message || "Stream failed";
        chat.error = rawMsg.startsWith("ZDR_ENFORCED:")
          ? rawMsg.replace("ZDR_ENFORCED:", "")
          : rawMsg;
        chat.isStreaming = false;
        return;
      }

      const assistantMsg = await addMessage({
        conversationId: convId,
        role: "assistant",
        content: fullContent || "(no response)",
        reasoning: fullReasoning || undefined,
        modelId: settings.defaultModel,
        tokensIn: lastTokensIn || undefined,
        tokensOut: lastTokensOut || undefined,
        costUsd: lastCost || undefined,
      });
      chat.messages = [...chat.messages, assistantMsg];
      chat.streamingContent = "";
      chat.streamingReasoning = "";

      if (allMsgs.length <= 1) {
        const title = text.length > 60 ? text.slice(0, 57) + "..." : text;
        await db.conversations.update(convId, { title });
        chat.conversations = chat.conversations.map((c) =>
          c.id === convId ? { ...c, title } : c,
        );
      }
    } catch (err: any) {
      chat.error = err.message || "Something went wrong";
    } finally {
      chat.isStreaming = false;
      setTimeout(() => messagesEnd?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
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
    setTimeout(() => messagesEnd?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function newConversation() {
    chat.activeConversationId = null;
    chat.messages = [];
    chat.streamingContent = "";
    chat.streamingReasoning = "";
    chat.error = null;
    status.sessionTokensIn = 0;
    status.sessionTokensOut = 0;
    status.sessionCost = 0;
  }

  async function handleDeleteConversation(id: string) {
    await deleteConversation(id);
    chat.conversations = chat.conversations.filter(c => c.id !== id);
    if (chat.activeConversationId === id) {
      newConversation();
    }
  }

  function applyTheme(theme: string) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function applyDensity(density: string) {
    document.documentElement.setAttribute("data-density", density);
  }

  function recalcSessionTotals(msgs: Message[]) {
    let inTokens = 0,
      outTokens = 0,
      cost = 0;
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
    setSetting("apiKey", key);
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
        <button
          class="btn-icon"
          onclick={() => (showConversations = !showConversations)}
          title="Conversations"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      <div class="header-center">
        <a
          href="https://zdr.chat"
          target="_blank"
          rel="noopener"
          class="logo"
          title="ZDR Chat — visit ZDR.chat"
        >
          <span class="logo-zdr">ZDR</span><span class="logo-dot">.</span><span
            class="logo-chat">chat</span
          >
        </a>
      </div>

      <div class="header-right">
        <button
          class="btn-icon"
          onclick={() => (showModelPicker = !showModelPicker)}
          title="Change model"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3M1 15h3M20 15h3"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
        </button>
        <button
          class="btn-icon"
          onclick={() => (showSettings = !showSettings)}
          title="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </header>

    <main class="main-content">
      <ChatArea
        bind:inputText
        bind:messagesEnd
        bind:inputEl
        handleSend={sendMessage}
        {handleKeydown}
        onToggleModelPicker={() => (showModelPicker = !showModelPicker)}
        modelName={settings.defaultModel.split('/').pop()?.replace(/-/g, ' ') || ''}
      />
    </main>

    <!-- Status Bar -->
    <StatusBar
      online={status.isOnline}
      tokensIn={status.sessionTokensIn}
      tokensOut={status.sessionTokensOut}
      cost={status.sessionCost}
      creditBalance={status.creditBalance}
    />

    <!-- Model Picker Overlay -->
    {#if showModelPicker}
      <ModelPicker
        models={settings.models}
        currentModel={settings.defaultModel}
        zdrSet={new Set(
          settings.models.filter((m) => m.hasZdrEndpoint).map((m) => m.id),
        )}
        zdrOnly={settings.zdrOnly}
        popularModelIds={settings.popularModelIds}
        onSelect={(modelId: string) => {
          settings.defaultModel = modelId;
          const model = settings.models.find((m) => m.id === modelId);
          if (model) status.currentModel = model;
          setSetting("defaultModel", modelId);
          showModelPicker = false;
        }}
        onClose={() => (showModelPicker = false)}
      />
    {/if}

    <!-- Settings Panel -->
    {#if showSettings}
      <SettingsPanel
        apiKey={settings.apiKey}
        theme={settings.theme}
        creditBalance={settings.creditBalance}
        storageInfo={{ conversations: chat.conversations.length }}
        zdrOnly={settings.zdrOnly}
        noTraining={settings.noTraining}
        onUpdateKey={(key: string) => {
          settings.apiKey = key;
          setSetting("apiKey", key);
          initClient(key);
        }}
        onUpdateTheme={(t: string) => {
          settings.theme = t as any;
          applyTheme(t);
          setSetting("theme", t);
        }}
        onUpdateZdrOnly={(v: boolean) => {
          settings.zdrOnly = v;
          setSetting("zdrOnly", v);
        }}
        density={_density}
        onUpdateDensity={(d: string) => {
          _density = d;
          applyDensity(d);
          setSetting("density", d);
        }}
        onUpdateNoTraining={(v: boolean) => {
          settings.noTraining = v;
          setSetting("noTraining", v);
        }}
        onClose={() => (showSettings = false)}
      />
    {/if}

    <!-- Conversations panel -->
    {#if showConversations}
      <ConversationsPanel
        conversations={chat.conversations}
        activeId={chat.activeConversationId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={handleDeleteConversation}
        onClose={() => showConversations = false}
      />
    {/if}
  </div>
{/if}

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: var(--bg);
    color: var(--text);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    height: 52px;
    flex-shrink: 0;
    background: var(--header-bg);
    z-index: 10;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-center {
    display: flex;
    align-items: center;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .logo {
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0;
    font-size: var(--font-lg);
    font-weight: 700;
    letter-spacing: -0.5px;
    user-select: none;
  }
  .logo-zdr {
    color: var(--accent);
  }
  .logo-dot {
    color: var(--text-secondary);
    opacity: 0.4;
  }
  .logo-chat {
    color: var(--text);
    opacity: 0.7;
    font-weight: 400;
  }

  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    font-size: 18px;
    line-height: 1;
    color: var(--text);
    opacity: 0.7;
  }
  .btn-icon:hover {
    opacity: 1;
    background: var(--surface);
  }



  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
  }

  @media (max-width: 480px) {
    .header {
      padding: 4px 10px;
      height: 44px;
    }
    .btn-icon {
      padding: 4px;
      font-size: 16px;
    }
  }
</style>
