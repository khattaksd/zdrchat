import { OpenRouter as OpenRouterSDK } from '@openrouter/sdk';
import type { Model } from './types';

export class OpenRouterClient {
  private sdk: OpenRouterSDK;
  private _models: Model[] | null = null;

  constructor(apiKey: string) {
    this.sdk = new OpenRouterSDK({
      apiKey,
      // Use a consistent referer for rankings
      baseServer: { url: 'https://openrouter.ai/api/v1' },
    });
  }

  get raw(): OpenRouterSDK {
    return this.sdk;
  }

  async fetchModels(force = false): Promise<Model[]> {
    if (this._models && !force) return this._models;
    const res = await this.sdk.models.list();
    // The SDK returns typed data; extract model IDs as our Model type
    const models = (res as any)?.data ?? res ?? [];
    this._models = models as Model[];
    return this._models;
  }

  async fetchCredits(): Promise<{ total: number; used: number; free: number; payg: number }> {
    try {
      const res = await this.sdk.credits.getCredits();
      const c = (res as any)?.credits ?? res ?? {};
      return {
        total: c.total ?? 0,
        used: c.used ?? 0,
        free: c.free ?? 0,
        payg: c.payg ?? 0,
      };
    } catch {
      return { total: 0, used: 0, free: 0, payg: 0 };
    }
  }

  async fetchZdrEndpoints(): Promise<Set<string>> {
    try {
      const res = await this.sdk.endpoints.listZdrEndpoints();
      const endpoints = Array.isArray(res) ? res : (res as any)?.data ?? [];
      return new Set<string>(endpoints.map((e: any) => e.model_id).filter(Boolean));
    } catch {
      return new Set();
    }
  }

  /**
   * Streaming chat completion via the SDK.
   */
  async *streamCompletion(params: {
    model: string;
    messages: { role: string; content: string | any[] }[];
    zdrOnly?: boolean;
    noTraining?: boolean;
  }): AsyncGenerator<{ content: string; done: boolean; usage?: { prompt_tokens: number; completion_tokens: number } }> {
    const providerOpts: Record<string, any> = {};
    if (params.zdrOnly) providerOpts.zdr = true;
    if (params.noTraining) providerOpts.data_collection = 'deny';

    const body: Record<string, any> = {
      model: params.model,
      messages: params.messages,
      stream: true,
    };
    if (Object.keys(providerOpts).length) body.provider = providerOpts;

    try {
      const stream = await this.sdk.chat.send(body) as AsyncIterable<any>;

      for await (const chunk of stream) {
        const choice = chunk?.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta?.content ?? '';
        const done = choice.finish_reason !== null && choice.finish_reason !== undefined;

        if (delta || done) {
          yield {
            content: delta,
            done,
            usage: chunk.usage ? {
              prompt_tokens: chunk.usage.prompt_tokens ?? 0,
              completion_tokens: chunk.usage.completion_tokens ?? 0,
            } : undefined,
          };
        }
      }
    } catch (err: any) {
      throw new Error(err?.message || String(err));
    }
  }
}
