import { AgentStep } from "./AgentStep";
import { AgentEventBus } from "./AgentEventBus";
import { RetryPolicy } from "./RetryPolicy";
import {
  ExtractedDateSchema,
  ExtractedDateDTO,
} from "../../domain/schemas/LabSchemas";
import { LlmService } from "../../ports/services/LlmService";

export class DateExtractionStep extends AgentStep<Date> {
  constructor(
    private readonly llmService: LlmService,
    private readonly documentUrl: string,
    bus: AgentEventBus,
    retryPolicy?: RetryPolicy
  ) {
    super("extract-date", "Extracting analysis date", bus, retryPolicy);
  }

  protected async execute(attempt: number): Promise<Date> {
    const systemPrompt =
      attempt === 1
        ? `You extract the date of a laboratory analysis from a PDF document.
Return strictly the date in YYYY-MM-DD format.
The date is usually in the header of the first page.`
        : `You extract the date of a laboratory analysis from a PDF document.
Your previous response was invalid. The date MUST be in strict YYYY-MM-DD format (e.g. 2024-03-15).
Return strictly the date as { "date": "YYYY-MM-DD" }.`;

    const userPrompt = `Extrait la date de cette analyse de laboratoire au format YYYY-MM-DD.`;

    const result: ExtractedDateDTO = await this.llmService.generateObject(
      ExtractedDateSchema,
      {
        documentUrl: this.documentUrl,
        systemPrompt,
        userPrompt,
      },
      { onReasoningDelta: (delta) => this.emitThinking(delta) }
    );

    const parsed = new Date(result.date);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date returned by LLM: ${result.date}`);
    }
    return parsed;
  }
}
