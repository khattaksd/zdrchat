import type { Conversation, Message } from '$lib/db/dexie';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  /** Reasoning text being streamed from reasoning models */
  streamingReasoning: string;
  error: string | null;
}

export const chat = $state<ChatState>({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  streamingReasoning: '',
  error: null,
});