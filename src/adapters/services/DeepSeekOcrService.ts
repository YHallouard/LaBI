import { OcrResult, OcrService } from '../../ports/services/OcrService';
import * as FileSystem from 'expo-file-system';

export class DeepSeekOcrService implements OcrService {
  private readonly apiUrl: string = 'https://your-deepseek-api-endpoint.com';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractDataFromPdf(pdfPath: string): Promise<OcrResult> {
    try {
      // Read the PDF file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(pdfPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Call DeepSeek API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          pdf: fileBase64,
          extractFields: ['CRP'],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // In a real application, we would parse the response from DeepSeek
      // For this example, we'll simulate extracting CRP value
      // Replace this with actual DeepSeek response parsing
      let crpValue = 0;
      let extractedDate: Date | undefined;
      
      if (data && data.results) {
        // This is placeholder logic - adjust based on actual DeepSeek API response format
        if (data.results.CRP) {
          const match = data.results.CRP.match(/(\d+(\.\d+)?)/);
          if (match) {
            crpValue = parseFloat(match[1]);
          }
        }
        
        if (data.results.date) {
          extractedDate = new Date(data.results.date);
        }
      }
      
      // For demonstration purposes - remove in production
      if (crpValue === 0) {
        console.log("Simulating CRP extraction for example...");
        crpValue = Math.random() * 10; // Random value between 0-10 for demo
        extractedDate = new Date();
      }

      return {
        crpValue,
        extractedDate
      };
    } catch (error) {
      console.error('Error in OCR service:', error);
      throw error;
    }
  }
} 