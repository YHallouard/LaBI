import { OcrResult, OcrService } from "../../ports/services/OcrService";
import { ProgressProcessor } from "../../ports/services/ProgressProcessor";

export class InMemoryOcrService implements OcrService {
  private defaultResults: Partial<OcrResult>;

  constructor(defaultResults?: Partial<OcrResult>) {
    this.defaultResults = defaultResults || this.createDefaultOcrResults();
  }

  private createDefaultOcrResults(): Partial<OcrResult> {
    return {
      extractedDate: new Date(),
      Hematies: { value: 4.5, unit: "T/L" },
      "Proteine C Reactive": { value: 5.2, unit: "mg/L" },
    };
  }

  setResultForPdf(pdfPath: string, results: Partial<OcrResult>): void {
    this.defaultResults = { ...this.defaultResults, ...results };
  }

  async extractDataFromPdf(
    pdfPath: string,
    progressProcessor?: ProgressProcessor
  ): Promise<OcrResult> {
    this.logExtractionAttempt(pdfPath);
    if (progressProcessor) {
      progressProcessor.onStepStarted("Mock extraction");
    }
    const result = this.buildOcrResult();
    if (progressProcessor) {
      progressProcessor.onStepCompleted("Mock extraction");
    }
    return result;
  }

  private logExtractionAttempt(pdfPath: string): void {
    console.log(`InMemoryOcrService: Mock extracting data from ${pdfPath}`);
  }

  private buildOcrResult(): OcrResult {
    const result: OcrResult = {
      extractedDate: this.defaultResults.extractedDate || new Date(),
    };

    this.addLabValuesToResult(result);

    return result;
  }

  private addLabValuesToResult(result: OcrResult): void {
    Object.entries(this.defaultResults).forEach(([key, value]) => {
      if (key !== "extractedDate") {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (result as any)[key] = value;
      }
    });
  }
}
