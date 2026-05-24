import type { z } from "zod";

export type ReasoningEffort = "none" | "low" | "medium" | "high";

export interface LlmCallContext {
  documentUrl: string;
  systemPrompt: string;
  userPrompt: string;
}

export interface LlmCallOptions {
  model?: string;
  temperature?: number;
  reasoningEffort?: ReasoningEffort;
  maxAttempts?: number;
}

export interface LlmService {
  generateObject<T>(
    schema: z.ZodSchema<T>,
    ctx: LlmCallContext,
    options?: LlmCallOptions
  ): Promise<T>;
}
