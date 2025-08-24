import { Platform } from "react-native";
import { SyncingServicePort } from "../../ports/services/SyncingServicePort";
import { InMemorySyncService } from "../../adapters/services/InMemorySyncService";
import { MultipeerSyncService } from "../../adapters/services/MultipeerSyncService";

export class SyncingServiceFactory {
  static createSyncingService(): SyncingServicePort {
    try {
      console.log(`[SyncFactory] Environment Details:`);
      console.log(`  - Platform: ${Platform.OS}`);
      console.log(`  - DevMode: ${__DEV__}`);

      if (!__DEV__) {
        console.log(`[SyncFactory] Using MultipeerSyncService for production`);
        return new MultipeerSyncService();
      } else {
        console.log(
          `[SyncFactory] Using InMemorySyncService for development/testing`
        );
        // return new InMemorySyncService();
        return new MultipeerSyncService();
      }
    } catch (error) {
      console.log("Error in SyncingServiceFactory:", error);
      console.log("[SyncFactory] Falling back to InMemorySyncService");
      return new InMemorySyncService();
    }
  }
}
