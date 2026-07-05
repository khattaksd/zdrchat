// Types used by our app layer (SDK handles raw API types)

export interface Model {
  id: string;
  name?: string;
  description?: string;
  contextLength?: number;
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
  topProvider?: {
    contextLength?: number;
    max_completion_tokens?: number;
  };
  /** Set by our app after cross-referencing ZDR endpoint list */
  hasZdrEndpoint?: boolean;
}