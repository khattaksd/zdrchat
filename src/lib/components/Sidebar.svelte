<script lang="ts">
  import type { Conversation } from '../db/dexie';

  let {
    conversations = [] as Conversation[],
    activeId = null as string | null,
    onSelect = (_id: string) => {},
    onNew = () => {},
  } = $props();

  let searchQuery = $state('');
  let filtered = $derived(
    searchQuery
      ? conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : conversations
  );
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <button class="new-chat-btn" onclick={onNew}>
      <span class="icon">✏️</span> New chat
    </button>
  </div>

  <div class="search-box">
    <input
      type="text"
      placeholder="Search conversations..."
      bind:value={searchQuery}
      class="search-input"
    />
  </div>

  <div class="conv-list">
    {#each filtered as conv (conv.id)}
      <button
        class="conv-item"
        class:active={conv.id === activeId}
        onclick={() => onSelect(conv.id)}
      >
        <span class="conv-title">{conv.title}</span>
        <span class="conv-date">{new Date(conv.updatedAt).toLocaleDateString()}</span>
      </button>
    {:else}
      <div class="empty-list">No conversations yet</div>
    {/each}
  </div>
</aside>

<style>
  .sidebar {
    width: 260px; display: flex; flex-direction: column; border-right: 1px solid var(--border);
    background: var(--sidebar-bg); flex-shrink: 0; overflow: hidden; height: 100%;
  }
  .sidebar-header { padding: var(--pad-md); }
  .new-chat-btn {
    width: 100%; padding: var(--pad-sm); border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); font-size: var(--font-base); cursor: pointer;
    display: flex; align-items: center; gap: 6px; justify-content: center;
  }
  .new-chat-btn:hover { border-color: var(--accent); }
  .search-box { padding: 0 var(--pad-md) var(--pad-sm); }
  .search-input {
    width: 100%; padding: var(--pad-xs) var(--pad-sm); border-radius: 6px; border: 1px solid var(--border);
    background: var(--input-bg); color: var(--text); font-size: var(--font-sm); box-sizing: border-box;
  }
  .search-input:focus { outline: none; border-color: var(--accent); }
  .conv-list { flex: 1; overflow-y: auto; padding: 0 6px; }
  .conv-item {
    width: 100%; padding: var(--pad-sm) var(--pad-sm); border-radius: 6px; border: none; background: none;
    color: var(--text); cursor: pointer; text-align: left; display: flex;
    flex-direction: column; gap: var(--pad-xs); margin-bottom: 2px;
  }
  .conv-item:hover { background: var(--surface); }
  .conv-item.active { background: color-mix(in srgb, var(--accent) 15%, transparent); }
  .conv-title { font-size: var(--font-base); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .conv-date { font-size: var(--font-xs); opacity: 0.5; }
  .empty-list { padding: var(--pad-lg); text-align: center; font-size: var(--font-base); opacity: 0.4; }
</style>