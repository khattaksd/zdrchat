<script lang="ts">
  import type { Conversation } from '$lib/db/dexie';

  let {
    conversations = [] as Conversation[],
    activeId = null as string | null,
    onSelect = (_id: string) => {},
    onNew = (_e?: Event) => {},
    onDelete = (_id: string) => {},
    onClose = (_e?: Event) => {},
  } = $props();

  let searchQuery = $state('');
  let filtered = $derived(
    searchQuery
      ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : conversations
  );

  function getDateGroup(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const day = 86_400_000;

    if (diff < day) return 'Today';
    if (diff < 2 * day) return 'Yesterday';
    if (diff < 7 * day) return 'This Week';
    if (diff < 30 * day) return 'This Month';
    return 'Older';
  }

  type Group = { label: string; convs: Conversation[] };
  let groups = $derived.by(() => {
    const map = new Map<string, Conversation[]>();
    for (const c of filtered) {
      const key = getDateGroup(c.updatedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
    const result: Group[] = [];
    for (const label of order) {
      if (map.has(label)) result.push({ label, convs: map.get(label)! });
    }
    return result;
  });

  let deletingId = $state<string | null>(null);

  function confirmDelete(e: Event, id: string) {
    e.stopPropagation();
    deletingId = id;
  }

  function executeDelete(id: string) {
    deletingId = null;
    onDelete(id);
  }

  function cancelDelete() {
    deletingId = null;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="overlay" role="presentation" onclick={() => onClose()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}></div>

<div class="panel">
  <div class="panel-header">
    <h3>Conversations</h3>
    <button class="close-btn" onclick={() => onClose()}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>

  <div class="panel-body">
    <button class="new-chat-btn" onclick={() => { onNew(); onClose(); }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        New conversation
    </button>

    <div class="search-box">
      <input
        type="text"
        placeholder="Search..."
        bind:value={searchQuery}
        class="search-input"
      />
    </div>

    <div class="conv-list">
      {#each groups as group}
        <div class="group-label">{group.label}</div>
        {#each group.convs as conv (conv.id)}
          <button
            class="conv-item"
            class:active={conv.id === activeId}
            onclick={() => {
              cancelDelete();
              onSelect(conv.id);
              onClose();
            }}
          >
            <span class="conv-title">{conv.title}</span>
            {#if deletingId === conv.id}
              <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
              <div class="delete-overlay" role="presentation" onclick={(e) => { e.stopPropagation(); }}>
                <span class="delete-prompt">Delete?</span>
                <span class="delete-confirm" role="button" tabindex="0" onclick={(e) => { e.stopPropagation(); executeDelete(conv.id); }} onkeydown={(e) => { if (e.key === 'Enter') executeDelete(conv.id); }}>Yes</span>
                <span class="delete-cancel" role="button" tabindex="0" onclick={(e) => { e.stopPropagation(); cancelDelete(); }} onkeydown={(e) => { if (e.key === 'Enter') cancelDelete(); }}>No</span>
              </div>
            {:else}
              <span
                class="delete-btn"
                role="button"
                tabindex="0"
                onclick={(e) => confirmDelete(e, conv.id)}
                onkeydown={(e) => { if (e.key === 'Enter') confirmDelete(e, conv.id); }}
                title="Delete conversation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </span>
            {/if}
          </button>
        {/each}
      {:else}
        {#if filtered.length === 0 && !searchQuery}
          <div class="empty-list">No conversations yet</div>
        {:else if filtered.length === 0 && searchQuery}
          <div class="empty-list">No matches</div>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 50; }
  .panel {
    position: fixed; top: 0; left: 0; height: 100vh; width: 320px; max-width: 85vw;
    background: var(--sidebar-bg); border-right: 1px solid var(--border);
    z-index: 51; display: flex; flex-direction: column; box-shadow: 8px 0 24px rgba(0,0,0,0.2);
  }
  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; border-bottom: 1px solid var(--border);
  }
  .panel-header h3 { margin: 0; font-size: 16px; }
  .close-btn { background: none; border: none; color: var(--text); font-size: 18px; cursor: pointer; opacity: 0.5; }
  .close-btn:hover { opacity: 1; }
  .panel-body { flex: 1; overflow-y: auto; padding: 12px 16px; }

  .new-chat-btn {
    width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); font-size: 14px; cursor: pointer;
    display: flex; align-items: center; gap: 6px; justify-content: center; margin-bottom: 8px;
  }
  .new-chat-btn:hover { border-color: var(--accent); }

  .search-box { margin-bottom: 8px; }
  .search-input {
    width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border);
    background: var(--input-bg); color: var(--text); font-size: 13px; box-sizing: border-box;
  }
  .search-input:focus { outline: none; border-color: var(--accent); }

  .conv-list {}
  .group-label {
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    padding: 8px 4px 2px; opacity: 0.4;
  }
  .conv-item {
    width: 100%; padding: 8px 10px; border-radius: 6px; border: none; background: none;
    color: var(--text); cursor: pointer; text-align: left;
    display: flex; align-items: center; gap: 6px; margin-bottom: 2px; position: relative;
  }
  .conv-item:hover { background: var(--surface); }
  .conv-item.active { background: color-mix(in srgb, var(--accent) 15%, transparent); }
  .conv-title { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3; }

  .delete-btn {
    display: none; background: none; border: none; cursor: pointer;
    padding: 4px; border-radius: 4px; color: var(--text); opacity: 0.4;
    flex-shrink: 0; line-height: 1;
  }
  .conv-item:hover .delete-btn { display: flex; align-items: center; }
  .delete-btn:hover { opacity: 1; background: var(--surface); color: #ef4444; }

  .delete-overlay {
    display: flex; align-items: center; gap: 4px; font-size: 12px; flex-shrink: 0;
  }
  .delete-prompt { opacity: 0.6; }
  .delete-confirm, .delete-cancel {
    padding: 2px 6px; border-radius: 4px; border: none;
    font-size: 12px; cursor: pointer; font-family: inherit;
  }
  .delete-confirm { background: #ef4444; color: white; }
  .delete-confirm:hover { background: #dc2626; }
  .delete-cancel { background: var(--surface); color: var(--text); }
  .delete-cancel:hover { background: var(--border); }

  .empty-list { padding: 24px; text-align: center; font-size: 13px; opacity: 0.4; }
</style>