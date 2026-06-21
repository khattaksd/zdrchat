import { OpenRouter as OpenRouterSDK } from '@openrouter/sdk';
import type { Model } from './types';

export class OpenRouterClient {
  private sdk: OpenRouterSDK;
  private _models: Model[] | null = null;

  constructor(apiKey: string) {
    this.sdk = new OpenRouterSDK({ apiKey });
  }

  async fetchModels(force = false): Promise<Model[]> {
    if (this._models && !force) return this._models;
    const res = await this.sdk.models.list();
    const models = (res as any)?.data ?? res ?? [];
    this._models = models as Model[];
    return this._models;
  }

  async fetchCredits(): Promise<{ total: number; used: number; free: number; payg: number }> {
    try {
      const res: any = await this.sdk.credits.getCredits();
      const c = res?.data ?? res?.credits ?? res ?? {};
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

  async fetchKeyInfo(): Promise<{ isFreeTier: boolean; expiresAt: string | null }> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: 'Bearer ' + (this.sdk as any).apiKey },
      });
      if (!res.ok) return { isFreeTier: true, expiresAt: null };
      const d = await res.json();
      return {
        isFreeTier: d?.data?.is_free_tier ?? true,
        expiresAt: d?.data?.expires_at ?? null,
      };
    } catch {
      return { isFreeTier: true, expiresAt: null };
    }
  }

  /**
   * Streaming chat completion via the official OpenRouter SDK.
   * Note: We do NOT send provider.zdr or dataCollection per-request.
   * Those settings should be configured at the OpenRouter account level:
   * https://openrouter.ai/settings/privacy
   */
  async *streamCompletion(params: {
    model: string;
    messages: { role: string; content: string | any[] }[];
  }): AsyncGenerator<{ content: string; done: boolean; usage?: { prompt_tokens: number; completion_tokens: number } }> {
    const body = {
      chatRequest: {
        model: params.model,
        messages: params.messages,
        stream: true,
      },
    };

    try {
      const stream: any = await this.sdk.chat.send(body);

      for await (const chunk of stream) {
        const choice = chunk?.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta?.content ?? '';
        const finishReason = choice.finish_reason;

        if (delta || finishReason != null) {
          yield {
            content: delta,
            done: finishReason != null,
            usage: chunk.usage ? {
              prompt_tokens: chunk.usage.prompt_tokens ?? 0,
              completion_tokens: chunk.usage.completion_tokens ?? 0,
            } : undefined,
          };
        }
      }
    } catch (err: any) {
      const status = err?.status || err?.cause?.status;
      const msg = err?.message || String(err);

      // Detect account-level ZDR enforcement
      if (msg.includes('No endpoints found matching your data policy') || msg.includes('data policy')) {
        throw new Error(
          'ZDR_ENFORCED:Your OpenRouter account has Zero Data Retention enforced globally.\n' +
          'Only ZDR-compliant models are available.\n' +
          'Configure this at: https://openrouter.ai/settings/privacy'
        );
      }

      // Rate limit
      if (status === 429 || msg.includes('429') || msg.includes('Too Many Requests')) {
        throw new Error('Rate limited by OpenRouter. Please wait a moment before sending another message.');
      }

      throw err;
    }
  }
}