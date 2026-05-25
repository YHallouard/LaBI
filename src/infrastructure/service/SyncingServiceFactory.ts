import { SyncingServicePort } from '../../ports/services/SyncingServicePort';
import { ZeroconfTcpSyncService } from '../../adapters/services/ZeroconfTcpSyncService';
import { InMemorySyncService } from '../../adapters/services/InMemorySyncService';

export class SyncingServiceFactory {
  static createSyncingService(): SyncingServicePort {
    try {
      return new ZeroconfTcpSyncService();
    } catch (error) {
      console.warn('[SyncFactory] ZeroconfTcpSyncService failed, falling back to InMemory:', error);
      return new InMemorySyncService();
    }
  }
}
