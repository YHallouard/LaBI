import { OcrResult, OcrService } from '../../ports/services/OcrService';
import { LabValue } from '../../domain/entities/BiologicalAnalysis';

/**
 * In-memory implementation of OcrService for testing purposes.
 * Returns predefined results instead of actually analyzing PDFs.
 */
export class InMemoryOcrService implements OcrService {
  private defaultResults: Partial<OcrResult>;

  /**
   * Initialize the in-memory OCR service with default results.
   * @param defaultResults Optional default OCR results to return
   */
  constructor(defaultResults?: Partial<OcrResult>) {
    this.defaultResults = defaultResults || {
      extractedDate: new Date(),
      Hematies: { value: 4.5, unit: 'T/L' },
      'Proteine C Reactive': { value: 5.2, unit: 'mg/L' }
    };
  }

  /**
   * Set custom results for a specific PDF path.
   * @param pdfPath The PDF path to set results for
   * @param results The OCR results to return for this PDF
   */
  setResultForPdf(pdfPath: string, results: Partial<OcrResult>): void {
    this.defaultResults = { ...this.defaultResults, ...results };
  }

  /**
   * Mock extraction of data from a PDF file.
   * @param pdfPath The path to the PDF file (not actually used except for logging)
   * @returns The predefined OCR results
   */
  async extractDataFromPdf(pdfPath: string): Promise<OcrResult> {
    console.log(`InMemoryOcrService: Mock extracting data from ${pdfPath}`);
    
    // Create result with all lab values present
    const result: OcrResult = {
      extractedDate: this.defaultResults.extractedDate || new Date(),
    };
    
    // Add all other values from default results
    Object.entries(this.defaultResults).forEach(([key, value]) => {
      if (key !== 'extractedDate') {
        (result as any)[key] = value;
      }
    });
    
    return result;
  }
} 