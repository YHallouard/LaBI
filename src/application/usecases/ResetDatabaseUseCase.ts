import { DatabaseStoragePort } from "../../ports/infrastructure/DatabaseStoragePort";

export class ResetDatabaseUseCase {
  private readonly storagePort: DatabaseStoragePort;

  constructor(storagePort: DatabaseStoragePort) {
    this.storagePort = storagePort;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async execute(): Promise<any> {
    try {
      console.log("Executing database reset use case...");

      // Use the integrated resetDatabase method from the port
      const newDatabase = await this.storagePort.resetDatabase();
      console.log("Database reset and reinitialized successfully");

      return newDatabase;
    } catch (error) {
      console.error("Error in ResetDatabaseUseCase:", error);
      throw new Error("Failed to reset database");
    }
  }
}
