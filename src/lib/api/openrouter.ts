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
      // SDK may return { credits: { ... } } or the credits directly
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

  /**
   * Streaming chat completion using the official OpenRouter SDK.
   *
   * Usage matches the SDK docs at https://github.com/OpenRouterTeam/typescript-sdk
   *
   * ```ts
   * const result = await client.chat.send({
   *   model: "openai/gpt-5",
   *   messages: [{ role: "user", content: "Hello" }],
   *   stream: true,
   *   provider: { zdr: true, sort: "price" },
   * });
   * for await (const chunk of result) { ... }
   * ```
   */
  async *streamCompletion(params: {
    model: string;
    messages: { role: string; content: string | any[] }[];
    zdrOnly?: boolean;
    noTraining?: boolean;
  }): AsyncGenerator<{ content: string; done: boolean; usage?: { prompt_tokens: number; completion_tokens: number } }> {
    // Build provider preferences matching SDK's ProviderPreferences
    const provider: Record<string, any> = {};
    if (params.zdrOnly) provider.zdr = true;
    if (params.noTraining) provider.dataCollection = 'deny';

    // Wrap in chatRequest as SDK's Zod validation expects:
    // { chatRequest: { model, messages, stream, provider: { zdr, dataCollection } } }
    const body: Record<string, any> = {
      chatRequest: {
        model: params.model,
        messages: params.messages,
        stream: true,
      },
    };
    if (Object.keys(provider).length > 0) {
      body.chatRequest.provider = provider;
    }

    // Send — returns EventStream<ChatStreamChunk> directly
    const stream: any = await this.sdk.chat.send(body);

    // Iterate over stream chunks
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
  }
}