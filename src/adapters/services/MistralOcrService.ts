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
  private readonly apiKey: string;
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
    this.apiKey = apiKey;
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

    let fileId: string | undefined;
    try {
      this.bus.emit({
        type: "step.started",
        stepId: "upload-to-mistral",
        label: "Uploading document to Mistral",
      });
      const uploadResult = await this.fileUploader.uploadAndGetSignedUrl(
        pdfPath
      );
      fileId = uploadResult.fileId;
      this.bus.emit({
        type: "step.completed",
        stepId: "upload-to-mistral",
        label: "Uploading document to Mistral",
        durationMs: 0,
      });

      const agent = new LabExtractionAgent(this.llmService, this.bus);
      const result = await agent.run(uploadResult.signedUrl.url);
      return this.toOcrResult(result);
    } finally {
      if (fileId) {
        this.bus.emit({
          type: "step.started",
          stepId: "delete-from-mistral",
          label: "Delete document from Mistral",
        });
        try {
          await this.fileUploader.deleteFile(fileId);
        } catch {
          /* best-effort cleanup */
        }
        this.bus.emit({
          type: "step.completed",
          stepId: "delete-from-mistral",
          label: "Delete document from Mistral",
          durationMs: 0,
        });
      }
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
        unit:
          value.unit && value.unit.length > 0
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

  private async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`File deletion failed: ${response.statusText}`);
    }
  }
}
