import { v4 as uuidv4 } from 'uuid';
import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';
import { OcrService } from '../../ports/services/OcrService';

export class AnalyzePdfUseCase {
  constructor(
    private readonly ocrService: OcrService,
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  async execute(pdfPath: string, manualDate?: Date): Promise<BiologicalAnalysis> {
    // Extract data from PDF using OCR service
    const ocrResult = await this.ocrService.extractDataFromPdf(pdfPath);
    
    // Create a new analysis record
    const analysis: BiologicalAnalysis = {
      id: uuidv4(),
      date: manualDate || ocrResult.extractedDate || new Date(),
      crpValue: ocrResult.crpValue,
      pdfSource: pdfPath
    };
    
    // Save the analysis to the repository
    await this.repository.save(analysis);
    
    return analysis;
  }
} 