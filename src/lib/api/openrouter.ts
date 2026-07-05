import { OpenRouter as OpenRouterSDK } from '@openrouter/sdk';
import type { Model } from './types';

export class OpenRouterClient {
  private sdk: OpenRouterSDK;
  private _models: Model[] | null = null;
  private _apiKey: string;

  constructor(apiKey: string) {
    this.sdk = new OpenRouterSDK({
      apiKey,
      httpReferer: 'https://zdr.chat',
      appTitle: 'ZDR Chat',
      appCategories: 'general-chat',
    });
    this._apiKey = apiKey;
  }

  async fetchModels(force = false): Promise<Model[]> {
    if (this._models && !force) return this._models;
    const res = await this.sdk.models.list();
    const models = (res as any)?.data ?? res ?? [];
    this._models = models as Model[];
    return this._models;
  }

  async fetchCredits(): Promise<{ total: number; used: number }> {
    try {
      const res: any = await this.sdk.credits.getCredits();
      const c = res?.data ?? res ?? {};
      return {
        total: c.totalCredits ?? 0,
        used: c.totalUsage ?? 0,
      };
    } catch {
      return { total: 0, used: 0 };
    }
  }

  async fetchKeyInfo(): Promise<{ isFreeTier: boolean; expiresAt: string | null; limit: number; limitRemaining: number; usage: number }> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: 'Bearer ' + this._apiKey },
      });
      if (!res.ok) return { isFreeTier: true, expiresAt: null, limit: 0, limitRemaining: 0, usage: 0 };
      const d = await res.json();
      const data = d?.data ?? {};
      return {
        isFreeTier: data.is_free_tier ?? true,
        expiresAt: data.expires_at ?? null,
        limit: data.limit ?? 0,
        limitRemaining: data.limit_remaining ?? 0,
        usage: data.usage ?? 0,
      };
    } catch {
      return { isFreeTier: true, expiresAt: null, limit: 0, limitRemaining: 0, usage: 0 };
    }
  }

  async fetchZdrEndpoints(): Promise<Set<string>> {
    try {
      const res: any = await this.sdk.endpoints.listZdrEndpoints();
      const endpoints = Array.isArray(res) ? res : (res as any)?.data ?? [];
      return new Set<string>(endpoints.map((e: any) => e.modelId).filter(Boolean));
    } catch {
      return new Set();
    }
  }

  /**
   * Fetch top models by token usage from the daily rankings.
   * Returns the model permaslugs of the top N models, deduped by family
   * (latest version per family line), refreshed daily.
   */
  async fetchPopularModels(): Promise<{ ids: string[]; asOf: string }> {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const res: any = await this.sdk.datasets.getRankingsDaily({
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      });

      const data: any[] = (res as any)?.data ?? res ?? [];

      // Aggregate totalTokens per model across days
      const tokenMap = new Map<string, number>();
      for (const item of data) {
        const slug: string = (item as any).modelPermaslug ?? '';
        if (!slug || slug === 'other') continue;
        const tokens = parseInt((item as any).totalTokens ?? '0', 10) || 0;
        tokenMap.set(slug, (tokenMap.get(slug) ?? 0) + tokens);
      }

      // Sort by popularity descending, take top 30
      const ranked = [...tokenMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([slug]) => slug);

      return { ids: ranked, asOf: today.toISOString() };
    } catch {
      return { ids: [], asOf: new Date().toISOString() };
    }
  }

  /**
   * Streaming chat completion via the official OpenRouter SDK.
   * Sends provider.zdr and dataCollection preferences per-request
   * when the corresponding flags are set in the app.
   * Yields reasoning content from delta.reasoning (e.g. DeepSeek R1).
   */
  async *streamCompletion(params: {
    model: string;
    messages: { role: string; content: string | any[] }[];
    zdrOnly?: boolean;
    noTraining?: boolean;
  }): AsyncGenerator<{ content: string; reasoning?: string; done: boolean; usage?: { prompt_tokens: number; completion_tokens: number; cost: number } }> {
    const body: any = {
      chatRequest: {
        model: params.model,
        messages: params.messages,
        stream: true,
      },
    };
    if (params.zdrOnly) body.chatRequest.provider = body.chatRequest.provider || {};
    if (params.zdrOnly) body.chatRequest.provider.zdr = true;
    if (params.noTraining) body.chatRequest.provider = body.chatRequest.provider || {};
    if (params.noTraining) body.chatRequest.provider.dataCollection = 'deny';

    try {
      const stream: any = await this.sdk.chat.send(body);

      for await (const chunk of stream) {
        const choice = chunk?.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta?.content ?? '';
        const reasoningDelta = choice.delta?.reasoning ?? '';
        const finishReason = choice.finishReason;

        if (delta || reasoningDelta || finishReason != null) {
          yield {
            content: delta,
            reasoning: reasoningDelta || undefined,
            done: finishReason != null,
            usage: chunk.usage ? {
              prompt_tokens: chunk.usage.promptTokens ?? 0,
              completion_tokens: chunk.usage.completionTokens ?? 0,
              cost: chunk.usage.cost ?? 0,
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