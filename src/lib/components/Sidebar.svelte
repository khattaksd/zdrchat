<script lang="ts">
  import type { Conversation } from '$lib/db/dexie';

  let {
    conversations = [] as Conversation[],
    activeId = null as string | null,
    onSelect = (_id: string) => {},
    onNew = (_e?: Event) => {},
    onDelete = (_id: string) => {},
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

  function confirmDelete(e: MouseEvent, id: string) {
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

<aside class="sidebar">
  <div class="sidebar-header">
    <button class="new-chat-btn" onclick={() => onNew()}>
      <span class="icon">✏️</span>
      <span>New chat</span>
    </button>
  </div>

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
          }}
          role="button"
          tabindex="0"
        >
          <span class="conv-title">{conv.title}</span>
          {#if deletingId === conv.id}
            <div class="delete-overlay" onclick={(e) => e.stopPropagation()}>
              <span class="delete-prompt">Delete?</span>
              <button class="delete-confirm" onclick={(e) => { e.stopPropagation(); executeDelete(conv.id); }}>Yes</button>
              <button class="delete-cancel" onclick={(e) => { e.stopPropagation(); cancelDelete(); }}>No</button>
            </div>
          {:else}
            <button
              class="delete-btn"
              onclick={(e) => confirmDelete(e, conv.id)}
              title="Delete conversation"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
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
</aside>

<style>
  .sidebar {
    width: 260px; display: flex; flex-direction: column;
    background: var(--sidebar-bg); flex-shrink: 0; overflow: hidden; height: 100%;
  }
  .sidebar-header { padding: var(--pad-md) var(--pad-md) var(--pad-xs); }
  .new-chat-btn {
    width: 100%; padding: var(--pad-sm); border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); font-size: var(--font-base); cursor: pointer;
    display: flex; align-items: center; gap: 6px; justify-content: center;
    transition: border-color 0.15s ease;
  }
  .new-chat-btn:hover { border-color: var(--accent); }
  .new-chat-btn .icon { font-size: 14px; }

  .search-box { padding: var(--pad-xs) var(--pad-md); }
  .search-input {
    width: 100%; padding: var(--pad-xs) var(--pad-sm); border-radius: 6px; border: 1px solid var(--border);
    background: var(--input-bg); color: var(--text); font-size: var(--font-sm); box-sizing: border-box;
  }
  .search-input:focus { outline: none; border-color: var(--accent); }

  .conv-list { flex: 1; overflow-y: auto; padding: 0 6px; }
  .group-label {
    font-size: var(--font-xs); font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.5px; padding: var(--pad-xs) var(--pad-sm) 2px;
    opacity: 0.4; margin-top: var(--pad-xs);
  }
  .conv-item {
    width: 100%; padding: var(--pad-sm) var(--pad-sm);
    border-radius: 6px; border: none; background: none;
    color: var(--text); cursor: pointer; text-align: left;
    display: flex; align-items: center; gap: var(--pad-xs);
    margin-bottom: 2px; position: relative;
    transition: background 0.1s ease;
  }
  .conv-item:hover { background: var(--surface); }
  .conv-item.active { background: color-mix(in srgb, var(--accent) 15%, transparent); }

  .conv-title {
    flex: 1; font-size: var(--font-base); overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; line-height: 1.3;
  }

  .delete-btn {
    display: none; background: none; border: none; cursor: pointer;
    padding: 4px; border-radius: 4px; color: var(--text); opacity: 0.4;
    flex-shrink: 0; line-height: 1;
  }
  .conv-item:hover .delete-btn { display: flex; align-items: center; }
  .delete-btn:hover { opacity: 1; background: var(--surface); color: #ef4444; }

  .delete-overlay {
    display: flex; align-items: center; gap: 4px;
    font-size: var(--font-xs); flex-shrink: 0;
  }
  .delete-prompt { opacity: 0.6; }
  .delete-confirm, .delete-cancel {
    padding: 2px 6px; border-radius: 4px; border: none;
    font-size: var(--font-xs); cursor: pointer; font-family: inherit;
  }
  .delete-confirm { background: #ef4444; color: white; }
  .delete-confirm:hover { background: #dc2626; }
  .delete-cancel { background: var(--surface); color: var(--text); }
  .delete-cancel:hover { background: var(--border); }

  .empty-list {
    padding: var(--pad-lg); text-align: center;
    font-size: var(--font-base); opacity: 0.4;
  }
</style>