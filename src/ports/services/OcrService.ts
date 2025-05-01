import { LabValue } from '../../domain/entities/BiologicalAnalysis';

export interface OcrResult {
  /**
   * The date of the medical analysis, extracted from the document.
   * Will be set to current date if extraction fails.
   */
  extractedDate: Date;
  
  // All lab values as key-value pairs
  [key: string]: Date | LabValue | undefined;
  
  // Specific lab values that might be present
  Hematies?: LabValue;
  Hémoglobine?: LabValue;
  Hématocrite?: LabValue;
  VGM?: LabValue;
  TCMH?: LabValue;
  CCMH?: LabValue;
  Leucocytes?: LabValue;
  "Polynucléaires neutrophiles"?: LabValue;
  "Polynucléaires éosinophiles"?: LabValue;
  "Polynucléaires basophiles"?: LabValue;
  Lymphocytes?: LabValue;
  Monocytes?: LabValue;
  Plaquettes?: LabValue;
  "Proteine C Reactive"?: LabValue;
}

export interface OcrService {
  extractDataFromPdf(pdfPath: string): Promise<OcrResult>;
} 