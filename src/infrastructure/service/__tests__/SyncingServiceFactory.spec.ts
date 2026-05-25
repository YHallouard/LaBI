import { SyncingServiceFactory } from '../SyncingServiceFactory';
import { ZeroconfTcpSyncService } from '../../../adapters/services/ZeroconfTcpSyncService';
import { InMemorySyncService } from '../../../adapters/services/InMemorySyncService';

jest.mock('../../../adapters/services/ZeroconfTcpSyncService', () => ({
  ZeroconfTcpSyncService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
  })),
}));

jest.mock('../../../adapters/services/InMemorySyncService', () => ({
  InMemorySyncService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
  })),
}));

describe('SyncingServiceFactory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a ZeroconfTcpSyncService by default', () => {
    const service = SyncingServiceFactory.createSyncingService();
    expect(ZeroconfTcpSyncService).toHaveBeenCalledTimes(1);
    expect(typeof service.initialize).toBe('function');
  });

  it('falls back to InMemorySyncService when ZeroconfTcpSyncService throws', () => {
    (ZeroconfTcpSyncService as jest.Mock).mockImplementationOnce(() => {
      throw new Error('native module unavailable');
    });
    const service = SyncingServiceFactory.createSyncingService();
    expect(InMemorySyncService).toHaveBeenCalledTimes(1);
    expect(typeof service.initialize).toBe('function');
  });
});
