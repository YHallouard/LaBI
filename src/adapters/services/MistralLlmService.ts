import { generateObject } from "ai";
import { createMistral } from "@ai-sdk/mistral";
import type { z } from "zod";
import {
  LlmCallContext,
  LlmCallOptions,
  LlmService,
} from "../../ports/services/LlmService";

export const DEFAULT_MISTRAL_MODEL = "mistral-small-latest";

export class MistralLlmService implements LlmService {
  private readonly client: ReturnType<typeof createMistral>;

  constructor(apiKey: string) {
    this.client = createMistral({ apiKey });
  }

  async generateObject<T>(
    schema: z.ZodSchema<T>,
    ctx: LlmCallContext,
    options?: LlmCallOptions
  ): Promise<T> {
    const model = options?.model ?? DEFAULT_MISTRAL_MODEL;
    const reasoningEffort = options?.reasoningEffort ?? "high";

    const { object } = await generateObject({
      model: this.client(model),
      schema,
      maxRetries: 0,
      temperature: options?.temperature ?? 0,
      messages: [
        { role: "system", content: ctx.systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: ctx.userPrompt },
            {
              type: "file",
              data: ctx.documentUrl,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
      providerOptions: {
        mistral: {
          reasoningEffort,
        },
      },
    });

    return object as T;
  }
}
