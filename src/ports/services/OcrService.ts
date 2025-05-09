import { LabValue } from "../../domain/entities/BiologicalAnalysis";
import { ProgressProcessor } from "./ProgressProcessor";

export interface OcrResult {
  extractedDate: Date;
  [key: string]: Date | LabValue | null | undefined;
}

export interface OcrService {
  extractDataFromPdf(
    pdfPath: string,
    progressProcessor?: ProgressProcessor
  ): Promise<OcrResult>;
}
