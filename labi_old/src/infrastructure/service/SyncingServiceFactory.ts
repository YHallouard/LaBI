import { Platform } from "react-native";
import { SyncingServicePort } from "../../ports/services/SyncingServicePort";
import { InMemorySyncService } from "../../adapters/services/InMemorySyncService";
import { MultipeerSyncService } from "../../adapters/services/MultipeerSyncService";
import { AndroidFileSyncService } from "../../adapters/services/AndroidFileSyncService";

export class SyncingServiceFactory {
  static createSyncingService(): SyncingServicePort {
    try {
      console.log(`[SyncFactory] Environment Details:`);
      console.log(`  - Platform: ${Platform.OS}`);
      console.log(`  - DevMode: ${__DEV__}`);

      if (Platform.OS === "android") {
        console.log(
          `[SyncFactory] Using AndroidFileSyncService (file export/import)`
        );
        return new AndroidFileSyncService();
      }

      console.log(`[SyncFactory] Using MultipeerSyncService for iOS`);
      return new MultipeerSyncService();
    } catch (error) {
      console.log("Error in SyncingServiceFactory:", error);
      console.log("[SyncFactory] Falling back to InMemorySyncService");
      return new InMemorySyncService();
    }
  }
}
