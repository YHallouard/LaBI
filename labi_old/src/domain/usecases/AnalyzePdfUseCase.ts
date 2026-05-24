import { v4 as uuidv4 } from "uuid";
import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";
import { OcrService, OcrResult } from "../../ports/services/OcrService";
import { LAB_VALUE_KEYS } from "../../config/LabConfig";
import { AnalysisProgressAdapter } from "../../adapters/services/AnalysisProgressAdapter";
import { ProcessingStepCallback } from "../../ports/services/ProgressProcessor";
import { AgentEventBus } from "../../application/agents/AgentEventBus";

export class AnalyzePdfUseCase {
  private processingStepStartedCallback: ProcessingStepCallback | null = null;
  private processingStepCompletedCallback: ProcessingStepCallback | null = null;

  constructor(
    private readonly ocrService: OcrService,
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  onProcessingStepStarted(callback: ProcessingStepCallback): void {
    this.processingStepStartedCallback = callback;
  }

  onProcessingStepCompleted(callback: ProcessingStepCallback): void {
    this.processingStepCompletedCallback = callback;
  }

  removeProcessingListeners(): void {
    this.processingStepStartedCallback = null;
    this.processingStepCompletedCallback = null;
  }

  getEventBus(): AgentEventBus | undefined {
    return this.ocrService.getEventBus?.();
  }

  private notifyStepStarted(step: string): void {
    if (this.processingStepStartedCallback) {
      this.processingStepStartedCallback(step);
    }
  }

  private notifyStepCompleted(step: string): void {
    if (this.processingStepCompletedCallback) {
      this.processingStepCompletedCallback(step);
    }
  }

  private emitStepStartedOnBus(label: string, stepId: string): void {
    this.ocrService.getEventBus?.()?.emit({
      type: "step.started",
      stepId,
      label,
    });
  }

  private emitStepCompletedOnBus(
    label: string,
    stepId: string,
    durationMs: number
  ): void {
    this.ocrService.getEventBus?.()?.emit({
      type: "step.completed",
      stepId,
      label,
      durationMs,
    });
  }

  async execute(pdfPath: string): Promise<BiologicalAnalysis> {
    try {
      const progressProcessor = new AnalysisProgressAdapter(
        (step) => this.notifyStepStarted(step),
        (step) => this.notifyStepCompleted(step)
      );
      const ocrResult = await this.ocrService.extractDataFromPdf(
        pdfPath,
        progressProcessor
      );

      const analysis: BiologicalAnalysis = {
        id: uuidv4(),
        date: ocrResult.extractedDate,
        pdfSource: pdfPath,
      };

      this.addLabValuesToAnalysis(analysis, ocrResult);

      const savingLabel = "Saving analysis";
      const savingStepId = "saving-analysis";
      this.notifyStepStarted(savingLabel);
      this.emitStepStartedOnBus(savingLabel, savingStepId);
      await this.repository.save(analysis);
      this.emitStepCompletedOnBus(savingLabel, savingStepId, 0);
      this.notifyStepCompleted(savingLabel);

      return analysis;
    } catch (error) {
      console.error("Error in execute method:", error);
      throw error;
    }
  }

  private addLabValuesToAnalysis(
    analysis: BiologicalAnalysis,
    ocrResult: OcrResult
  ): void {
    LAB_VALUE_KEYS.forEach((key) => {
      const value = ocrResult[key];
      if (value !== undefined && value !== null && !(value instanceof Date)) {
        (analysis as Record<string, unknown>)[key] = value;
      }
    });
  }
}
