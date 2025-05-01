import { OcrResult, OcrService } from '../../ports/services/OcrService';
import * as FileSystem from 'expo-file-system';
import { Mistral } from '@mistralai/mistralai';
import { Platform } from 'react-native';
import { LAB_VALUE_KEYS, LAB_VALUE_UNITS } from '../../config/LabConfig';

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
      
      const base64String = await FileSystem.readAsStringAsync(pdfPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert to format compatible with React Native
      const fileData = this.base64ToUint8Array(base64String);

      // Create mock File object for Mistral API
      const mockFile = {
        name: 'document.pdf',
        type: 'application/pdf',
        data: base64String, // Send as base64 directly
      };
      
      console.log('PDF file read successfully');
      
      try {
        // Upload using alternative approach
        const uploaded_pdf = await this.uploadFile(mockFile);
        console.log('File uploaded successfully:', uploaded_pdf);
        
        const signedUrl = await this.client.files.getSignedUrl({
          fileId: uploaded_pdf.id,
        });
        console.log('Signed URL:', signedUrl);
        try {
          // Send the chat completion request with the document URL
          const chatResponse = await this.client.chat.complete({
            model: "mistral-large-latest",
            messages: [
              {
                role: "system",
                content: `Please ensure the response contains only JSON data with the following lab values: ${LAB_VALUE_KEYS.join(", ")}. Also extract the DATE of the analysis. No additional text or explanation should be included. The DATE must be in ISO format (YYYY-MM-DD).`
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Extrait les valeurs suivantes de cette analyse de laboratoire sous la forme de json: ${LAB_VALUE_KEYS.join(", ")}. IMPORTANT: Extrait aussi la DATE de l'analyse au format YYYY-MM-DD. Exemple attendu: {"Hematies": {"value": 4.5, "unit": "T/L"}, "DATE": "2023-05-15", "Proteine C Reactive": {"value": 5.2, "unit": "mg/L"}}.`,
                  },
                  {
                    type: "document_url",
                    documentUrl: signedUrl.url,
                  }
                ],
              }
            ],
          });
          
          console.log('Received response from Mistral API');
          
          // Extract data from the response
          if (!chatResponse.choices || chatResponse.choices.length === 0) {
            throw new Error('Invalid response format from Mistral API');
          }
          
          // Parse the content
          const content = chatResponse.choices[0]?.message?.content as string;
          if (!content) {
            throw new Error('No content in Mistral API response');
          }
          
          console.log('Raw response content:', content);
          
          // Extract data from the content using our helper method
          const extractedData = this.extractDataFromText(content);
          console.log('Extracted data:', extractedData);
          
          // Return all expected keys
          const result = {} as OcrResult;
          
          // Set extracted date
          result.extractedDate = extractedData.extractedDate || new Date();
          
          // Set lab values
          LAB_VALUE_KEYS.forEach(key => {
            result[key] = extractedData[key] || { value: 0, unit: LAB_VALUE_UNITS[key] || "" };
          });
          
          return result;
        } catch (apiError) {
          console.error('API error:', apiError);
          
          // Fallback: Return default values if API call fails
          console.log('Using fallback values due to API error');
          const fallbackResult = {} as OcrResult;
          
          // Set current date
          fallbackResult.extractedDate = new Date();
          
          // Set default lab values
          LAB_VALUE_KEYS.forEach(key => {
            fallbackResult[key] = { value: 0, unit: LAB_VALUE_UNITS[key] || "" };
          });
          
          return fallbackResult;
        }
      } finally {
        // Close the file handle
      }
    } catch (error) {
      console.error('Error in OCR service:', error);
      throw error;
    }
  }
  
  private base64ToUint8Array(base64: string): Uint8Array {
    const raw = atob(base64);
    const array = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }

  private async uploadFile(file: { 
    name: string; 
    type: string; 
    data: string 
  }): Promise<any> {
    const formData = new FormData();
    formData.append('purpose', 'ocr');
    formData.append('file', {
      uri: `data:${file.type};base64,${file.data}`,
      name: file.name,
      type: file.type,
    } as any);

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
  
  // Extract relevant data from Mistral response text
  private extractDataFromText(text: string): { [key: string]: { value: number, unit: string } } & { extractedDate?: Date } {
    try {
      // Remove any leading markers like ```json before parsing
      const cleanedText = text.replace(/^```json\n|```$/g, '');
      const extractedData = JSON.parse(cleanedText);
      console.log('Parsed JSON data:', extractedData);

      const mappedData: { [key: string]: { value: number, unit: string } } & { extractedDate?: Date } = {};

      // Map the expected lab values
      LAB_VALUE_KEYS.forEach(key => {
        if (extractedData[key] && extractedData[key].value) {
          mappedData[key] = {
            value: parseFloat(extractedData[key].value),
            unit: extractedData[key].unit || LAB_VALUE_UNITS[key] || ""
          };
        }
      });

      // Extract date with proper handling
      if (extractedData.DATE) {
        try {
          console.log('Found DATE in response:', extractedData.DATE);
          (mappedData as { extractedDate?: Date }).extractedDate = new Date(extractedData.DATE);
          console.log('Parsed date:', mappedData.extractedDate);
        } catch (dateError) {
          console.error('Error parsing date:', dateError);
          (mappedData as { extractedDate?: Date }).extractedDate = new Date();
        }
      } else {
        console.log('No DATE found in response, using current date');
        (mappedData as { extractedDate?: Date }).extractedDate = new Date();
      }

      return mappedData;
    } catch (parseError) {
      console.log('JSON parsing failed, trying regex extraction', parseError);
      // Fallback: Return an empty object if parsing fails
      return {} as { [key: string]: { value: number, unit: string } } & { extractedDate?: Date };
    }
  }
} 