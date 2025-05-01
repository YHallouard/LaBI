import { v4 as uuidv4 } from 'uuid';
import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';
import { OcrService, OcrResult } from '../../ports/services/OcrService';
import { LAB_VALUE_KEYS } from '../../config/LabConfig';

export class AnalyzePdfUseCase {
  constructor(
    private readonly ocrService: OcrService,
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  async execute(pdfPath: string): Promise<BiologicalAnalysis> {
    // Extract data from PDF using OCR service
    const ocrResult = await this.ocrService.extractDataFromPdf(pdfPath);
    
    // Create a new analysis record with all lab values
    const analysis: BiologicalAnalysis = {
      id: uuidv4(),
      date: ocrResult.extractedDate,
      pdfSource: pdfPath,
    };
    
    // Add all lab values from the OCR result
    this.addLabValuesToAnalysis(analysis, ocrResult);
    
    // Save the analysis to the repository
    await this.repository.save(analysis);
    
    return analysis;
  }

  // Helper function to add lab values to the analysis
  private addLabValuesToAnalysis(analysis: BiologicalAnalysis, ocrResult: OcrResult): void {
    // Add all lab values from the OCR result using the centralized lab value keys
    LAB_VALUE_KEYS.forEach(key => {
      if (ocrResult[key]) {
        (analysis as any)[key] = ocrResult[key];
      }
    });
  }
} 