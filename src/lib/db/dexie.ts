import Dexie, { type Table } from 'dexie';

// ── Types ──────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  systemPrompt?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  tokensIn?: number;
  tokensOut?: number;
  modelId?: string;
  costUsd?: number;
  error?: string;
}

export interface Attachment {
  id: string;
  conversationId: string;
  name: string;
  mime: string;
  size: number;
  blob: Blob;
  hash: string;
  kind: 'image' | 'pdf' | 'text' | 'other';
  createdAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
}

// ── Database ───────────────────────────────────────────

class ChatDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  attachments!: Table<Attachment, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('ZDRChatDB');

    // v1
    this.version(1).stores({
      conversations: 'id, updatedAt',
      messages: 'id, conversationId, createdAt, [conversationId+createdAt]',
      attachments: 'id, conversationId, hash',
      settings: 'key',
    });
  }
}

export const db = new ChatDatabase();

// ── Helpers ────────────────────────────────────────────

export const uid = () => crypto.randomUUID();

// Monotonic clock for stable ordering
let _clock = 0;
export const now = (): number => {
  const t = Date.now();
  _clock = t > _clock ? t : _clock + 1;
  return _clock;
};

// ── CRUD Helpers ───────────────────────────────────────

export async function createConversation(modelId: string, title?: string): Promise<Conversation> {
  const conv: Conversation = {
    id: uid(),
    title: title || 'New conversation',
    modelId,
    createdAt: now(),
    updatedAt: now(),
  };
  await db.conversations.add(conv);
  return conv;
}

export async function deleteConversation(id: string) {
  await db.transaction('rw', db.conversations, db.messages, db.attachments, async () => {
    await db.messages.where('conversationId').equals(id).delete();
    await db.attachments.where('conversationId').equals(id).delete();
    await db.conversations.delete(id);
  });
}

export async function addMessage(msg: Omit<Message, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): Promise<Message> {
  const message: Message = {
    id: msg.id || uid(),
    createdAt: msg.createdAt || now(),
    ...msg,
  };
  await db.messages.add(message);
  // Update conversation timestamp
  await db.conversations.update(msg.conversationId, { updatedAt: now() });
  return message;
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  return db.messages
    .where('[conversationId+createdAt]')
    .between([conversationId, 0], [conversationId, Infinity])
    .toArray();
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const record = await db.settings.get(key);
  return (record?.value as T) ?? defaultValue;
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}