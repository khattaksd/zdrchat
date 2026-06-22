import { writable } from 'svelte/store';
import type { Conversation, Message } from '$lib/db/dexie';

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

function createChatStore() {
  const { subscribe, update, set } = writable<ChatState>({
    conversations: [],
    activeConversationId: null,
    messages: [],
    isStreaming: false,
    streamingContent: '',
    error: null,
  });

  return {
    subscribe,
    setConversations: (conversations: Conversation[]) => update(s => ({ ...s, conversations })),
    setActiveConversation: (activeConversationId: string | null) => update(s => ({ ...s, activeConversationId })),
    setMessages: (messages: Message[]) => update(s => ({ ...s, messages })),
    addMessage: (msg: Message) => update(s => ({ ...s, messages: [...s.messages, msg] })),
    setIsStreaming: (isStreaming: boolean) => update(s => ({ ...s, isStreaming })),
    setStreamingContent: (streamingContent: string) => update(s => ({ ...s, streamingContent })),
    appendStreamingContent: (chunk: string) => update(s => ({ ...s, streamingContent: s.streamingContent + chunk })),
    setError: (error: string | null) => update(s => ({ ...s, error })),
    reset: () => set({
      conversations: [],
      activeConversationId: null,
      messages: [],
      isStreaming: false,
      streamingContent: '',
      error: null,
    }),
  };
}

export const chatStore = createChatStore();