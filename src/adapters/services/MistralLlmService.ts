import { streamText, Output } from "ai";
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

    // streamText (au lieu de generateObject) pour recevoir les parts
    // "reasoning-delta" pendant que le modèle réfléchit — le provider
    // @ai-sdk/mistral mappe les chunks "thinking" de l'API Mistral vers
    // ces parts. L'objet final validé par le schéma reste `result.output`.
    const result = streamText({
      model: this.client(model),
      output: Output.object({ schema }),
      maxRetries: 0,
      temperature: options?.temperature ?? 0,
      system: ctx.systemPrompt,
      messages: [
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

    // streamText ne rejette pas par défaut : les erreurs arrivent comme
    // parts "error" dans le stream. On les capture pour les relancer avec
    // leur cause d'origine (sinon result.output rejette avec un
    // NoOutputGeneratedError opaque).
    let streamError: unknown;
    for await (const part of result.fullStream) {
      if (part.type === "reasoning-delta") {
        options?.onReasoningDelta?.(part.text);
      } else if (part.type === "error") {
        streamError = part.error;
      }
    }
    if (streamError) {
      throw streamError instanceof Error
        ? streamError
        : new Error(String(streamError));
    }

    return (await result.output) as T;
  }
}
