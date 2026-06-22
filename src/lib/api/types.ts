// Types used by our app layer (SDK handles raw API types)

export interface Model {
  id: string;
  name?: string;
  canonicalSlug?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
    web_search?: string;
  };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
  /** Set by our app after cross-referencing ZDR endpoint list */
  hasZdrEndpoint?: boolean;
}

export const MODEL_BUCKETS = [
  { key: 'smartest', label: '🌟 Smartest', desc: 'Best for complex thinking' },
  { key: 'fast', label: '⚡ Fastest', desc: 'Best for everyday quick answers' },
  { key: 'creative', label: '🎨 Creative', desc: 'Great for writing & brainstorming' },
  { key: 'free', label: '💰 Free', desc: '$0 per message (rate limited)' },
  { key: 'code', label: '💻 Code', desc: 'Best at programming tasks' },
  { key: 'vision', label: '👁️ Vision', desc: 'Can see and analyze images' },
] as const;

export type ModelBucket = typeof MODEL_BUCKETS[number]['key'];