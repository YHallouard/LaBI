import Zeroconf from 'react-native-zeroconf';
import TcpSocket from 'react-native-tcp-socket';
import type Socket from 'react-native-tcp-socket/lib/types/Socket';
import type Server from 'react-native-tcp-socket/lib/types/Server';

import {
  SyncingServicePort,
  SyncDeviceInfo,
  SyncStatus,
  SyncProgress,
} from '../../ports/services/SyncingServicePort';

const SYNC_SERVICE_TYPE = 'hemea-sync';
const SYNC_PORT = 47834;

interface DiscoveredDevice extends SyncDeviceInfo {
  host: string;
  port: number;
}

// Messages are delimited by \0 (null byte, never present in valid JSON)
const MSG_DELIMITER = '\0';

export class ZeroconfTcpSyncService implements SyncingServicePort {
  private zeroconf = new Zeroconf();
  private server: Server | null = null;
  private activeSocket: Socket | null = null;
  private incomingBuffer = '';
  private deviceName = 'Héméa';
  private serviceName = '';
  private isAdvertising = false;

  private discoveredDevices: Map<string, DiscoveredDevice> = new Map();

  private deviceDiscoveredCallback: ((device: SyncDeviceInfo) => void) | null = null;
  private connectionStateCallback: ((connected: boolean, deviceId?: string) => void) | null = null;
  private transferProgressCallback: ((progress: SyncProgress) => void) | null = null;
  private autoDataReceptionCallback: ((data: unknown) => void) | null = null;
  private receiveDataResolver: ((data: unknown) => void) | null = null;

  async initialize(): Promise<void> {
    // Server starts only when advertising (toggle ON)
  }

  async startAdvertising(name: string): Promise<void> {
    if (this.isAdvertising) return;
    this.deviceName = name;
    const suffix = Math.random().toString(16).slice(2, 6);
    this.serviceName = `${name} [${suffix}]`;
    this.isAdvertising = true;

    if (!this.server) {
      this.startTcpServer();
    }

    try {
      this.zeroconf.publishService(SYNC_SERVICE_TYPE, 'tcp', 'local.', this.serviceName, SYNC_PORT, { displayName: name });
      console.log(`[ZeroconfTCP] Advertising as: ${this.serviceName} on port ${SYNC_PORT}`);
    } catch (e) {
      this.isAdvertising = false;
      throw e;
    }
  }

  async stopAdvertising(): Promise<void> {
    this.isAdvertising = false;
    try {
      this.zeroconf.unpublishService(this.serviceName);
    } catch { /* ok */ }

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
        setTimeout(resolve, 1000);
      });
      this.server = null;
    }
  }

  async startScanning(): Promise<void> {
    this.discoveredDevices.clear();

    // Remove only our JS-level listeners — never call removeDeviceListeners()
    // which destroys the native DeviceEventEmitter bridge and silently breaks
    // all future event delivery.
    this.zeroconf.removeAllListeners('resolved');
    this.zeroconf.removeAllListeners('remove');
    this.zeroconf.removeAllListeners('error');

    this.zeroconf.scan(SYNC_SERVICE_TYPE, 'tcp', 'local.');

    this.zeroconf.on('resolved', (service: {
      name: string;
      host: string;
      port: number;
      addresses?: string[];
      txt?: Record<string, string>;
    }) => {
      // Ignore ourselves — compare unique mDNS service name
      if (service.name === this.serviceName) return;

      const host = service.addresses?.[0] ?? service.host;
      const displayName = service.txt?.displayName ?? service.name;
      const device: DiscoveredDevice = {
        id: service.name,
        name: displayName,
        host,
        port: service.port,
      };

      // Deduplicate: if the same physical device re-advertised (new mDNS
      // suffix), remove the stale entry so it doesn't appear twice.
      for (const [key, existing] of this.discoveredDevices) {
        if (existing.name === displayName && key !== service.name) {
          this.discoveredDevices.delete(key);
        }
      }

      this.discoveredDevices.set(service.name, device);
      console.log(`[ZeroconfTCP] Discovered: ${displayName} @ ${host}:${service.port}`);
      this.deviceDiscoveredCallback?.(device);
    });

    this.zeroconf.on('remove', (name: string) => {
      this.discoveredDevices.delete(name);
    });

    this.zeroconf.on('error', (err: unknown) => {
      console.error('[ZeroconfTCP] Scan error:', err);
    });
  }

  async stopScanning(): Promise<void> {
    this.zeroconf.stop();
    this.zeroconf.removeAllListeners('resolved');
    this.zeroconf.removeAllListeners('remove');
    this.zeroconf.removeAllListeners('error');
    this.discoveredDevices.clear();
  }

  getDiscoveredDevices(): SyncDeviceInfo[] {
    return Array.from(this.discoveredDevices.values());
  }

  clearDiscoveredDevices(): void {
    this.discoveredDevices.clear();
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    const device = this.discoveredDevices.get(deviceId);
    if (!device) {
      console.error('[ZeroconfTCP] Device not in discovered list:', deviceId);
      return false;
    }

    return new Promise<boolean>((resolve) => {
      let didConnect = false;

      const socket = TcpSocket.createConnection(
        { port: device.port, host: device.host },
        () => {
          didConnect = true;
          this.incomingBuffer = '';
          this.activeSocket = socket;
          this.setupSocketListeners(socket, deviceId);
          this.connectionStateCallback?.(true, deviceId);
          this.updateProgress(SyncStatus.CONNECTED, 0);
          resolve(true);
        },
      );

      // only for connect-phase failure; setupSocketListeners handles post-connect errors
      socket.once('error', (err) => {
        console.error('[ZeroconfTCP] Connect error:', err);
        if (!didConnect) resolve(false);
      });
    });
  }

  async sendData(data: unknown): Promise<boolean> {
    if (!this.activeSocket) {
      console.error('[ZeroconfTCP] sendData: no active socket');
      return false;
    }
    try {
      const message = JSON.stringify(data) + MSG_DELIMITER;
      this.activeSocket.write(message);
      this.updateProgress(SyncStatus.COMPLETED, 100, 'Données envoyées avec succès');
      return true;
    } catch (e) {
      console.error('[ZeroconfTCP] sendData error:', e);
      this.updateProgress(SyncStatus.ERROR, 0, `Échec de l'envoi : ${e}`);
      return false;
    }
  }

  async receiveData(): Promise<unknown> {
    return new Promise<unknown>((resolve) => {
      this.receiveDataResolver = resolve;
    });
  }

  setAutoDataReceptionCallback(callback: (data: unknown) => void): void {
    this.autoDataReceptionCallback = callback;
  }

  onDeviceDiscovered(callback: (device: SyncDeviceInfo) => void): void {
    this.deviceDiscoveredCallback = callback;
  }

  onConnectionStateChanged(callback: (connected: boolean, deviceId?: string) => void): void {
    this.connectionStateCallback = callback;
  }

  onTransferProgress(callback: (progress: SyncProgress) => void): void {
    this.transferProgressCallback = callback;
  }

  async disconnect(): Promise<void> {
    try {
      this.activeSocket?.destroy();
      this.activeSocket = null;
      this.incomingBuffer = '';
      this.updateProgress(SyncStatus.IDLE, 0);
    } catch (e) {
      console.error('[ZeroconfTCP] disconnect error:', e);
    }
  }

  // ── Private ──────────────────────────────────────────────────────

  private startTcpServer(): void {
    try {
      this.server = TcpSocket.createServer((socket) => {
        console.log('[ZeroconfTCP] Incoming peer connection');
        this.incomingBuffer = '';
        this.activeSocket = socket as unknown as Socket;
        this.setupSocketListeners(socket as unknown as Socket, 'incoming');
        this.connectionStateCallback?.(true, 'incoming');
        this.updateProgress(SyncStatus.CONNECTED, 0);
      });

      this.server.listen({ port: SYNC_PORT, host: '0.0.0.0' }, () => {
        console.log(`[ZeroconfTCP] TCP server listening on :${SYNC_PORT}`);
      });

      this.server.on('error', (err) => {
        console.error('[ZeroconfTCP] Server error:', err);
      });
    } catch (e) {
      console.error('[ZeroconfTCP] Failed to start server:', e);
    }
  }

  private setupSocketListeners(socket: Socket, deviceId: string): void {
    socket.on('data', (chunk) => {
      const str = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      this.incomingBuffer += str;
      this.drainBuffer();
    });

    socket.on('close', () => {
      if (this.activeSocket === socket) {
        this.activeSocket = null;
        this.connectionStateCallback?.(false, deviceId);
      }
    });

    socket.on('error', (err) => {
      console.error('[ZeroconfTCP] Socket error:', err);
      this.updateProgress(SyncStatus.ERROR, 0, `Erreur réseau : ${err.message}`);
    });
  }

  private drainBuffer(): void {
    let boundary: number;
    while ((boundary = this.incomingBuffer.indexOf(MSG_DELIMITER)) !== -1) {
      const msgStr = this.incomingBuffer.slice(0, boundary);
      this.incomingBuffer = this.incomingBuffer.slice(boundary + 1);

      if (!msgStr) continue;

      try {
        const parsed: unknown = JSON.parse(msgStr);
        this.dispatchData(parsed);
      } catch (e) {
        console.error('[ZeroconfTCP] Message parse error:', e);
        this.updateProgress(SyncStatus.ERROR, 0, 'Erreur de décodage des données');
      }
    }
  }

  private dispatchData(data: unknown): void {
    if (this.receiveDataResolver) {
      this.receiveDataResolver(data);
      this.receiveDataResolver = null;
    } else if (this.autoDataReceptionCallback) {
      this.autoDataReceptionCallback(data);
    } else {
      console.warn('[ZeroconfTCP] Received data but no listener is registered — data dropped');
    }
  }

  private updateProgress(status: SyncStatus, progress: number, message?: string): void {
    this.transferProgressCallback?.({ status, progress, message });
  }
}
