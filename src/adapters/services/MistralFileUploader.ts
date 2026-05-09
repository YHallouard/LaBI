import * as FileSystem from "expo-file-system";
import { Mistral } from "@mistralai/mistralai";

export interface UploadedFile {
  id: string;
}

export interface SignedUrl {
  url: string;
}

export class MistralFileUploader {
  private readonly apiKey: string;
  private readonly client: Mistral;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Mistral({ apiKey });
  }

  async uploadAndGetSignedUrl(pdfPath: string): Promise<SignedUrl> {
    const base64String = await this.readPdfAsBase64(pdfPath);
    const file = {
      name: "document.pdf",
      type: "application/pdf",
      data: base64String,
    };
    const uploaded = await this.uploadFile(file);
    return await this.getSignedUrlForFile(uploaded.id);
  }

  private async readPdfAsBase64(pdfPath: string): Promise<string> {
    return await FileSystem.readAsStringAsync(pdfPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
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

  private async getSignedUrlForFile(fileId: string): Promise<SignedUrl> {
    return await this.client.files.getSignedUrl({ fileId });
  }
}
