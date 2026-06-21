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
    <button class="new-chat-btn" on:click={onNew}>
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
        on:click={() => onSelect(conv.id)}
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
    background: var(--sidebar-bg); flex-shrink: 0; overflow: hidden;
  }
  .sidebar-header { padding: 12px; }
  .new-chat-btn {
    width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--border);
    background: var(--surface); color: var(--text); font-size: 13px; cursor: pointer;
    display: flex; align-items: center; gap: 6px; justify-content: center;
  }
  .new-chat-btn:hover { border-color: var(--accent); }
  .search-box { padding: 0 12px 8px; }
  .search-input {
    width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border);
    background: var(--input-bg); color: var(--text); font-size: 12px; box-sizing: border-box;
  }
  .search-input:focus { outline: none; border-color: var(--accent); }
  .conv-list { flex: 1; overflow-y: auto; padding: 0 6px; }
  .conv-item {
    width: 100%; padding: 8px 10px; border-radius: 6px; border: none; background: none;
    color: var(--text); cursor: pointer; text-align: left; display: flex;
    flex-direction: column; gap: 2px; margin-bottom: 2px;
  }
  .conv-item:hover { background: var(--surface); }
  .conv-item.active { background: color-mix(in srgb, var(--accent) 15%, transparent); }
  .conv-title { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .conv-date { font-size: 11px; opacity: 0.5; }
  .empty-list { padding: 16px; text-align: center; font-size: 13px; opacity: 0.4; }
</style>