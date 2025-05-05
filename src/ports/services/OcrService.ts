import { LabValue } from "../../domain/entities/BiologicalAnalysis";

export interface OcrResult {
  extractedDate: Date;
  [key: string]: Date | LabValue | null | undefined;
}

export interface OcrService {
  extractDataFromPdf(pdfPath: string): Promise<OcrResult>;
}
