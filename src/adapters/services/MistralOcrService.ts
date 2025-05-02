import { OcrResult, OcrService } from '../../ports/services/OcrService';
import * as FileSystem from 'expo-file-system';
import { Mistral } from '@mistralai/mistralai';
import { LAB_VALUE_KEYS, LAB_VALUE_UNITS } from '../../config/LabConfig';

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

  async extractDataFromPdf(pdfPath: string): Promise<OcrResult> {
    try {
      console.log('Reading PDF file...');
      
      const base64String = await this.readPdfAsBase64(pdfPath);
      const mockFile = this.createMockFileFromBase64(base64String);
      
      console.log('PDF file read successfully');
      
      try {
        const uploadedPdf = await this.uploadFile(mockFile);
        console.log('File uploaded successfully:', uploadedPdf);
        
        const signedUrl = await this.getSignedUrlForFile(uploadedPdf.id);
        console.log('Signed URL:', signedUrl);

        try {
          const chatResponse = await this.sendChatCompletionRequest(signedUrl.url);
          console.log('Received response from Mistral API');
          
          const content = this.extractContentFromResponse(chatResponse);
          console.log('Raw response content:', content);
          
          const extractedData = this.extractDataFromText(content);
          console.log('Extracted data:', extractedData);
          
          return this.createResultFromExtractedData(extractedData);
        } catch (apiError) {
          console.error('API error:', apiError);
          return this.createFallbackResult();
        }
      } finally {
      }
    } catch (error) {
      console.error('Error in OCR service:', error);
      throw error;
    }
  }

  private async readPdfAsBase64(pdfPath: string): Promise<string> {
    return await FileSystem.readAsStringAsync(pdfPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  private createMockFileFromBase64(base64String: string): { name: string; type: string; data: string } {
    return {
      name: 'document.pdf',
      type: 'application/pdf',
      data: base64String,
    };
  }

  private async uploadFile(file: { 
    name: string; 
    type: string; 
    data: string 
  }): Promise<UploadedFile> {
    const formData = this.createFormDataForUpload(file);
    return await this.sendFileUploadRequest(formData);
  }

  private createFormDataForUpload(file: { name: string; type: string; data: string }): FormData {
    const formData = new FormData();
    formData.append('purpose', 'ocr');
    formData.append('file', {
      uri: `data:${file.type};base64,${file.data}`,
      name: file.name,
      type: file.type,
    } as any);
    return formData;
  }

  private async sendFileUploadRequest(formData: FormData): Promise<UploadedFile> {
    const response = await fetch('https://api.mistral.ai/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
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

  private async sendChatCompletionRequest(documentUrl: string) {
    return await this.client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: this.createSystemPrompt()
        },
        {
          role: "user",
          content: this.createUserPromptWithDocumentUrl(documentUrl)
        }
      ],
    });
  }

  private createSystemPrompt(): string {
    return `Please ensure the response contains only JSON data with the following lab values in their respective units: ${LAB_VALUE_KEYS.map(key => `${key} (${LAB_VALUE_UNITS[key]})`).join(", ")}. Also extract the DATE of the analysis. 

IMPORTANT: For any lab values not found in the document, use null instead of omitting them. Format must be: {"lab_name": null} for missing values.

The DATE must be in ISO format (YYYY-MM-DD). No additional text or explanation should be included.`;
  }

  private createUserPromptWithDocumentUrl(documentUrl: string): any[] {
    return [
      {
        type: "text",
        text: `Extrait les valeurs suivantes de cette analyse de laboratoire sous la forme de json: ${LAB_VALUE_KEYS.join(", ")}. 
                    
IMPORTANT: 
1. Extrait aussi la DATE de l'analyse au format YYYY-MM-DD.
2. Pour les valeurs qui ne sont pas présentes dans le document, utilise null au lieu de les omettre.

Exemple attendu: 
{
  "Hematies": {"value": 4.5, "unit": "T/L"}, 
  "DATE": "2023-05-15", 
  "Proteine C Reactive": {"value": 5.2, "unit": "mg/L"},
  "Vitamine B9": null,
  "Vitamine B12": null
}`,
      },
      {
        type: "document_url",
        documentUrl: documentUrl,
      }
    ];
  }

  private extractContentFromResponse(chatResponse: any): string {
    if (!chatResponse.choices || chatResponse.choices.length === 0) {
      throw new Error('Invalid response format from Mistral API');
    }
    
    const content = chatResponse.choices[0]?.message?.content as string;
    if (!content) {
      throw new Error('No content in Mistral API response');
    }
    
    return content;
  }
  
  private extractDataFromText(text: string): { [key: string]: { value: number, unit: string } | null } & { extractedDate?: Date } {
    try {
      const cleanedText = this.removeJsonMarkersFromText(text);
      const extractedData = JSON.parse(cleanedText);
      console.log('Parsed JSON data:', extractedData);

      const mappedData = this.mapExtractedDataToStandardFormat(extractedData);
      this.parseAndAddDateToMappedData(mappedData, extractedData);

      return mappedData;
    } catch (parseError) {
      console.log('JSON parsing failed, trying regex extraction', parseError);
      return {} as { [key: string]: { value: number, unit: string } | null } & { extractedDate?: Date };
    }
  }

  private removeJsonMarkersFromText(text: string): string {
    return text.replace(/^```json\n|```$/g, '');
  }

  private mapExtractedDataToStandardFormat(extractedData: any): { [key: string]: { value: number, unit: string } | null } & { extractedDate?: Date } {
    const mappedData: { [key: string]: { value: number, unit: string } | null } & { extractedDate?: Date } = {};

    LAB_VALUE_KEYS.forEach(key => {
      if (extractedData[key] && extractedData[key].value) {
        mappedData[key] = {
          value: parseFloat(extractedData[key].value),
          unit: extractedData[key].unit || LAB_VALUE_UNITS[key] || ""
        };
      } else if (extractedData[key] === null) {
        mappedData[key] = null;
      }
    });

    return mappedData;
  }

  private parseAndAddDateToMappedData(
    mappedData: { [key: string]: { value: number, unit: string } | null } & { extractedDate?: Date },
    extractedData: any
  ): void {
    if (extractedData.DATE) {
      try {
        console.log('Found DATE in response:', extractedData.DATE);
        mappedData.extractedDate = new Date(extractedData.DATE);
        console.log('Parsed date:', mappedData.extractedDate);
      } catch (dateError) {
        console.error('Error parsing date:', dateError);
        mappedData.extractedDate = new Date();
      }
    } else {
      console.log('No DATE found in response, using current date');
      mappedData.extractedDate = new Date();
    }
  }

  private createResultFromExtractedData(
    extractedData: { [key: string]: { value: number, unit: string } | null } & { extractedDate?: Date }
  ): OcrResult {
    const result = {} as OcrResult;
    
    result.extractedDate = extractedData.extractedDate || new Date();
    
    LAB_VALUE_KEYS.forEach(key => {
      result[key] = extractedData[key] !== undefined ? extractedData[key] : null;
    });
    
    return result;
  }

  private createFallbackResult(): OcrResult {
    console.log('Using fallback values due to API error');
    const fallbackResult = {} as OcrResult;
    
    fallbackResult.extractedDate = new Date();
    
    LAB_VALUE_KEYS.forEach(key => {
      fallbackResult[key] = { value: 0, unit: LAB_VALUE_UNITS[key] || "" };
    });
    
    return fallbackResult;
  }
}
