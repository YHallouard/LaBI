import { File } from "expo-file-system";
import { Mistral } from "@mistralai/mistralai";

export interface UploadedFile {
  id: string;
}

export interface SignedUrl {
  url: string;
}

export interface UploadResult {
  fileId: string;
  signedUrl: SignedUrl;
}

export class MistralFileUploader {
  private readonly apiKey: string;
  private readonly client: Mistral;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Mistral({ apiKey });
  }

  async uploadAndGetSignedUrl(pdfPath: string): Promise<UploadResult> {
    const uploaded = await this.uploadFile(new File(pdfPath));
    const signedUrl = await this.getSignedUrlForFile(uploaded.id);
    return { fileId: uploaded.id, signedUrl };
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      console.warn(`Failed to delete file ${fileId}: ${response.statusText}`);
    }
  }

  private async uploadFile(file: File): Promise<UploadedFile> {
    const formData = this.createFormDataForUpload(file);
    return await this.sendFileUploadRequest(formData);
  }

  private createFormDataForUpload(file: File): FormData {
    const formData = new FormData();
    formData.append("purpose", "ocr");
    // Expo's WinterCG fetch only serializes string/Blob-like FormData parts
    // (it rejects RN's `{uri, name, type}` with "Unsupported FormDataPart
    // implementation"). expo-file-system's File implements Blob — its raw
    // bytes(), name and mime type feed the multipart part directly.
    formData.append("file", file as unknown as Blob);
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
