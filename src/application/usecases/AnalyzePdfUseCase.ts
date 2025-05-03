import { v4 as uuidv4 } from "uuid";
import { BiologicalAnalysis } from "../../domain/entities/BiologicalAnalysis";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";
import { OcrService, OcrResult } from "../../ports/services/OcrService";
import { LAB_VALUE_KEYS } from "../../config/LabConfig";

export class AnalyzePdfUseCase {
  constructor(
    private readonly ocrService: OcrService,
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  async execute(pdfPath: string): Promise<BiologicalAnalysis> {
    const ocrResult = await this.ocrService.extractDataFromPdf(pdfPath);

    const analysis: BiologicalAnalysis = {
      id: uuidv4(),
      date: ocrResult.extractedDate,
      pdfSource: pdfPath,
    };

    this.addLabValuesToAnalysis(analysis, ocrResult);

    await this.repository.save(analysis);

    return analysis;
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
