import { OcrResult, OcrService } from "../../ports/services/OcrService";
import { ProgressProcessor } from "../../ports/services/ProgressProcessor";
import * as FileSystem from "expo-file-system";
import { Mistral } from "@mistralai/mistralai";
import {
  LAB_VALUE_CATEGORIES,
  LAB_VALUE_KEYS,
  LAB_VALUE_UNITS,
} from "../../config/LabConfig";

interface UploadedFile {
  id: string;
}

export class MistralOcrService implements OcrService {
  private readonly apiKey: string;
  private readonly client: Mistral;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Mistral({
      apiKey: this.apiKey,
    });
  }

  async extractDataFromPdf(
    pdfPath: string,
    progressProcessor?: ProgressProcessor
  ): Promise<OcrResult> {
    try {
      console.log("Reading PDF file...");

      const base64String = await this.readPdfAsBase64(pdfPath);
      const mockFile = this.createMockFileFromBase64(base64String);

      console.log("PDF file read successfully");

      try {
        const uploadedPdf = await this.uploadFile(mockFile);
        console.log("File uploaded successfully:", uploadedPdf);

        const signedUrl = await this.getSignedUrlForFile(uploadedPdf.id);
        console.log("Signed URL:", signedUrl);

        try {
          // Process each category separately
          const result: OcrResult = {
            extractedDate: new Date(),
          } as OcrResult;

          // Extract date first with a minimal request
          if (progressProcessor) {
            progressProcessor.onStepStarted("Extracting date");
          }
          const dateResponse = await this.sendChatCompletionRequestForDate(
            signedUrl.url
          );
          const dateContent = this.extractContentFromResponse(dateResponse);
          const dateData = this.extractDateFromText(dateContent);

          if (dateData.extractedDate) {
            result.extractedDate = dateData.extractedDate;
          }

          console.log("Extracted date:", result.extractedDate);
          if (progressProcessor) {
            progressProcessor.onStepCompleted("Extracting date");
          }

          // Process each category separately
          for (const [category, labKeys] of Object.entries(
            LAB_VALUE_CATEGORIES
          )) {
            const stepName = `Analyzing ${category}`;
            console.log(
              `Processing category: ${category} with ${labKeys.length} lab values`
            );

            if (progressProcessor) {
              progressProcessor.onStepStarted(stepName);
            }

            const categoryResponse =
              await this.sendChatCompletionRequestForCategory(
                signedUrl.url,
                category,
                labKeys
              );
            const categoryContent =
              this.extractContentFromResponse(categoryResponse);
            const categoryData = this.extractDataFromText(categoryContent);

            console.log(`Extracted data for ${category}:`, categoryData);

            // Merge category data into result
            this.mergeDataIntoResult(result, categoryData);

            if (progressProcessor) {
              progressProcessor.onStepCompleted(stepName);
            }
          }

          console.log("Final merged result:", result);
          return result;
        } catch (apiError) {
          console.error("API error:", apiError);
          return this.createFallbackResult();
        }
      } finally {
        // Cleanup if needed
      }
    } catch (error) {
      console.error("Error in OCR service:", error);
      throw error;
    }
  }

  private async readPdfAsBase64(pdfPath: string): Promise<string> {
    return await FileSystem.readAsStringAsync(pdfPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  private createMockFileFromBase64(base64String: string): {
    name: string;
    type: string;
    data: string;
  } {
    return {
      name: "document.pdf",
      type: "application/pdf",
      data: base64String,
    };
  }

  private async uploadFile(file: {
    name: string;
    type: string;
    data: string;
  }): Promise<UploadedFile> {
    const formData = this.createFormDataForUpload(file);
    return await this.sendFileUploadRequest(formData);
  }

  private createFormDataForUpload(file: {
    name: string;
    type: string;
    data: string;
  }): FormData {
    const formData = new FormData();
    formData.append("purpose", "ocr");
    formData.append("file", {
      uri: `data:${file.type};base64,${file.data}`,
      name: file.name,
      type: file.type,
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } as any);
    return formData;
  }

  private async sendFileUploadRequest(
    formData: FormData
  ): Promise<UploadedFile> {
    const response = await fetch("https://api.mistral.ai/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async getSignedUrlForFile(fileId: string): Promise<{ url: string }> {
    return await this.client.files.getSignedUrl({
      fileId: fileId,
    });
  }

  private async sendChatCompletionRequestForCategory(
    documentUrl: string,
    category: string,
    labKeys: string[]
  ) {
    return await this.client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: this.createSystemPromptForCategory(category, labKeys),
        },
        {
          role: "user",
          content: this.createUserPromptWithDocumentUrlForCategory(
            documentUrl,
            category,
            labKeys
          ),
        },
      ],
    });
  }

  private async sendChatCompletionRequestForDate(documentUrl: string) {
    return await this.client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content:
            'Extract only the DATE of the laboratory analysis. It should be in the header of the first page. Return in JSON format: {"DATE": "YYYY-MM-DD"}. No other text.',
        },
        {
          role: "user",
          content: this.createUserPromptWithDocumentUrlForDate(documentUrl),
        },
      ],
    });
  }

  private createSystemPromptForCategory(
    category: string,
    labKeys: string[]
  ): string {
    return `Please extract only the following laboratory values from the "${category}" category: ${labKeys
      .map((key) => `${key} (${LAB_VALUE_UNITS[key]})`)
      .join(", ")}. 

IMPORTANT: For any lab values not found in the document, use null instead of omitting them. Format must be: {"lab_value_name": null} for missing values.

Return only JSON data with no additional text or explanation.`;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private createUserPromptWithDocumentUrlForCategory(
    documentUrl: string,
    category: string,
    labKeys: string[]
  ): any[] {
    return [
      {
        type: "text",
        text: `Extrait uniquement les valeurs suivantes de la catégorie "${category}" dans cette analyse de laboratoire sous forme de json: ${labKeys.join(
          ", "
        )}. 
                    
IMPORTANT: Pour les valeurs qui ne sont pas présentes dans le document, utilise null au lieu de les omettre.

Exemple attendu: 
{
  "${labKeys[0]}": {"value": 4.5, "unit": "${LAB_VALUE_UNITS[labKeys[0]]}"},
  "${labKeys[1]}": null
}`,
      },
      {
        type: "document_url",
        documentUrl: documentUrl,
      },
    ];
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private createUserPromptWithDocumentUrlForDate(documentUrl: string): any[] {
    return [
      {
        type: "text",
        text: `Extrait uniquement la DATE de cette analyse de laboratoire au format YYYY-MM-DD.
        
Retourne seulement: {"DATE": "YYYY-MM-DD"}`,
      },
      {
        type: "document_url",
        documentUrl: documentUrl,
      },
    ];
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private extractContentFromResponse(chatResponse: any): string {
    if (!chatResponse.choices || chatResponse.choices.length === 0) {
      throw new Error("Invalid response format from Mistral API");
    }

    const content = chatResponse.choices[0]?.message?.content as string;
    if (!content) {
      throw new Error("No content in Mistral API response");
    }

    return content;
  }

  private extractDateFromText(text: string): { extractedDate?: Date } {
    try {
      const cleanedText = this.removeJsonMarkersFromText(text);
      const extractedData = JSON.parse(cleanedText);

      const result: { extractedDate?: Date } = {};

      if (extractedData.DATE) {
        try {
          console.log("Found DATE in response:", extractedData.DATE);
          result.extractedDate = new Date(extractedData.DATE);
          console.log("Parsed date:", result.extractedDate);
        } catch (dateError) {
          console.error("Error parsing date:", dateError);
        }
      }

      return result;
    } catch (parseError) {
      console.log("JSON parsing failed for date", parseError);
      return {};
    }
  }

  private extractDataFromText(text: string): {
    [key: string]: { value: number; unit: string } | null;
  } {
    try {
      const cleanedText = this.removeJsonMarkersFromText(text);
      const extractedData = JSON.parse(cleanedText);
      console.log("Parsed JSON data:", extractedData);

      const mappedData: {
        [key: string]: { value: number; unit: string } | null;
      } = {};

      // Map only the keys present in the response
      for (const key of Object.keys(extractedData)) {
        if (LAB_VALUE_KEYS.includes(key)) {
          if (extractedData[key] && extractedData[key].value) {
            mappedData[key] = {
              value: parseFloat(extractedData[key].value),
              unit: extractedData[key].unit || LAB_VALUE_UNITS[key] || "",
            };
          } else if (extractedData[key] === null) {
            mappedData[key] = null;
          }
        }
      }

      return mappedData;
    } catch (parseError) {
      console.log("JSON parsing failed, returning empty object", parseError);
      return {};
    }
  }

  private removeJsonMarkersFromText(text: string): string {
    return text.replace(/^```json\n|```$/g, "");
  }

  private mergeDataIntoResult(
    result: OcrResult,
    categoryData: { [key: string]: { value: number; unit: string } | null }
  ): void {
    // Merge the category data into the result
    for (const [key, value] of Object.entries(categoryData)) {
      result[key] = value;
    }
  }

  private createFallbackResult(): OcrResult {
    console.log("Using fallback values due to API error");
    const fallbackResult = {} as OcrResult;

    fallbackResult.extractedDate = new Date();

    LAB_VALUE_KEYS.forEach((key) => {
      fallbackResult[key] = { value: 0, unit: LAB_VALUE_UNITS[key] || "" };
    });

    return fallbackResult;
  }
}
