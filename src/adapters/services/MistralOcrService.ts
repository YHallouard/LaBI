import { OcrResult, OcrService } from "../../ports/services/OcrService";
import { ProgressProcessor } from "../../ports/services/ProgressProcessor";
import { LAB_VALUE_KEYS, LAB_VALUE_UNITS } from "../../config/LabConfig";
import { AgentEventBus } from "../../application/agents/AgentEventBus";
import {
  LabExtractionAgent,
  LabExtractionResult,
} from "../../application/agents/LabExtractionAgent";
import { LlmService } from "../../ports/services/LlmService";
import { MistralLlmService } from "./MistralLlmService";
import { MistralFileUploader } from "./MistralFileUploader";
import { CategoryExtractionDTO } from "../../domain/schemas/LabSchemas";

export class MistralOcrService implements OcrService {
  private readonly fileUploader: MistralFileUploader;
  private readonly llmService: LlmService;
  private readonly bus: AgentEventBus;

  constructor(
    apiKey: string,
    options?: {
      fileUploader?: MistralFileUploader;
      llmService?: LlmService;
      eventBus?: AgentEventBus;
    }
  ) {
    this.fileUploader =
      options?.fileUploader ?? new MistralFileUploader(apiKey);
    this.llmService = options?.llmService ?? new MistralLlmService(apiKey);
    this.bus = options?.eventBus ?? new AgentEventBus();
  }

  getEventBus(): AgentEventBus {
    return this.bus;
  }

  async extractDataFromPdf(
    pdfPath: string,
    progressProcessor?: ProgressProcessor
  ): Promise<OcrResult> {
    const unsubscribe = this.bridgeBusToProgressProcessor(progressProcessor);

    try {
      const signedUrl = await this.fileUploader.uploadAndGetSignedUrl(pdfPath);
      const agent = new LabExtractionAgent(this.llmService, this.bus);
      const result = await agent.run(signedUrl.url);
      return this.toOcrResult(result);
    } finally {
      unsubscribe();
    }
  }

  private toOcrResult(extraction: LabExtractionResult): OcrResult {
    const result: OcrResult = {
      extractedDate: extraction.extractedDate,
    };

    for (const [, data] of Object.entries(extraction.byCategory)) {
      this.mergeCategoryIntoResult(result, data);
    }

    if (extraction.missingCategories.length > 0) {
      (result as Record<string, unknown>).missingCategories =
        extraction.missingCategories;
    }

    return result;
  }

  private mergeCategoryIntoResult(
    result: OcrResult,
    data: CategoryExtractionDTO
  ): void {
    for (const [key, value] of Object.entries(data)) {
      if (!LAB_VALUE_KEYS.includes(key)) continue;
      if (value === null) continue;
      if (typeof value.value !== "number") continue;
      result[key] = {
        value: value.value,
        unit: value.unit && value.unit.length > 0
          ? value.unit
          : LAB_VALUE_UNITS[key] ?? "",
      };
    }
  }

  private bridgeBusToProgressProcessor(
    processor?: ProgressProcessor
  ): () => void {
    if (!processor) return () => {};
    return this.bus.on((event) => {
      if (event.type === "step.started") {
        processor.onStepStarted(event.label);
      } else if (event.type === "step.completed") {
        processor.onStepCompleted(event.label);
      }
    });
  }
}
