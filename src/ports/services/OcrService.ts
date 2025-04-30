export interface OcrResult {
  crpValue: number;
  extractedDate?: Date;
}

export interface OcrService {
  extractDataFromPdf(pdfPath: string): Promise<OcrResult>;
} 