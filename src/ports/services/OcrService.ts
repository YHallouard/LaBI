import { LabValue } from '../../domain/entities/BiologicalAnalysis';
import { LAB_VALUE_KEYS } from '../../config/LabConfig';

export interface OcrResult {
  /**
   * The date of the medical analysis, extracted from the document.
   * Will be set to current date if extraction fails.
   */
  extractedDate: Date;
  
  // All lab values as key-value pairs
  [key: string]: Date | LabValue | null | undefined;
}

export interface OcrService {
  extractDataFromPdf(pdfPath: string): Promise<OcrResult>;
}
