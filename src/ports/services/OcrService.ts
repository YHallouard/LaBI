import { LabValue } from "../../domain/entities/BiologicalAnalysis";
import { ProgressProcessor } from "./ProgressProcessor";
import type { AgentEventBus } from "../../application/agents/AgentEventBus";

export interface OcrResult {
  extractedDate: Date;
  missingCategories?: string[];
  [key: string]: Date | LabValue | null | undefined | string[];
}

export interface OcrService {
  extractDataFromPdf(
    pdfPath: string,
    progressProcessor?: ProgressProcessor
  ): Promise<OcrResult>;
  getEventBus?(): AgentEventBus | undefined;
}
