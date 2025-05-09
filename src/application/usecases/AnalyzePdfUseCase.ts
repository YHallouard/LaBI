import { v4 as uuidv4 } from "uuid";
import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";
import { OcrService, OcrResult } from "../../ports/services/OcrService";
import { LAB_VALUE_KEYS } from "../../config/LabConfig";
import { AnalysisProgressAdapter } from "../../adapters/services/AnalysisProgressAdapter";
import { ProcessingStepCallback } from "../../ports/services/ProgressProcessor";

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

  async execute(pdfPath: string): Promise<BiologicalAnalysis> {
    try {
      // Start the extraction process
      this.notifyStepStarted("Uploading document");

      // Create a progress adapter to track OCR progress
      const progressProcessor = new AnalysisProgressAdapter(
        (step) => this.notifyStepStarted(step),
        (step) => this.notifyStepCompleted(step)
      );

      // Mark upload as complete after a short delay
      setTimeout(() => {
        this.notifyStepCompleted("Uploading document");
      }, 1000);

      // Extract data with progress tracking
      const ocrResult = await this.ocrService.extractDataFromPdf(
        pdfPath,
        progressProcessor
      );

      // Create and save the analysis
      const analysis: BiologicalAnalysis = {
        id: uuidv4(),
        date: ocrResult.extractedDate,
        pdfSource: pdfPath,
      };

      // Add all the lab values to the analysis
      this.addLabValuesToAnalysis(analysis, ocrResult);

      // Save the analysis
      this.notifyStepStarted("Saving analysis");
      await this.repository.save(analysis);
      this.notifyStepCompleted("Saving analysis");

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
      if (ocrResult[key] !== undefined && ocrResult[key] !== null) {
        (analysis as Record<string, unknown>)[key] = ocrResult[key];
      }
    });
  }
}
