import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";
import { ProfileService } from "../services/ProfileService";

export class ResetDatabaseUseCase {
  private readonly storagePort: DatabaseStoragePort;

  constructor(storagePort: DatabaseStoragePort) {
    this.storagePort = storagePort;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async execute(): Promise<any> {
    try {
      console.log("Executing database reset use case...");

      await this.notifyProfileServiceReset();
      const db = await this.resetDatabaseTables();
      await this.waitForChangesToPropagate(500);

      return db;
    } catch (error) {
      return this.handleResetError(error);
    }
  }

  private async notifyProfileServiceReset(): Promise<void> {
    const profileService = ProfileService.getInstance();
    profileService.setProfileExists(false);
    console.log("Notified ProfileService that profile no longer exists");
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private async resetDatabaseTables(): Promise<any> {
    const db = await this.storagePort.resetDatabase();
    console.log("Database tables reset and recreated successfully");
    return db;
  }

  private async waitForChangesToPropagate(delayMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private handleResetError(error: any): never {
    console.error("Error in ResetDatabaseUseCase:", error);

    if (error instanceof Error) {
      if (this.isReadOnlyError(error)) {
        throw new Error(
          "Database is in read-only mode. Try restarting the app or check file permissions."
        );
      } else if (this.isClosedResourceError(error)) {
        throw new Error(
          "Database connection was closed. Try restarting the app."
        );
      }
      throw error;
    }

    throw new Error("Failed to reset database");
  }

  private isReadOnlyError(error: Error): boolean {
    return error.message.includes("readonly database");
  }

  private isClosedResourceError(error: Error): boolean {
    return error.message.includes("closed resource");
  }
}
