export interface SyncDeviceInfo {
  id: string;
  name: string;
}

export enum SyncRole {
  SENDER = 'SENDER',
  RECEIVER = 'RECEIVER'
}

export enum SyncStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  TRANSFERRING = 'TRANSFERRING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface SyncProgress {
  status: SyncStatus;
  progress: number;
  message?: string;
}

export interface SyncingServicePort {
  initialize(): Promise<void>;
  startAdvertising(deviceName: string): Promise<void>;
  stopAdvertising(): Promise<void>;
  startScanning(): Promise<void>;
  stopScanning(): Promise<void>;
  getDiscoveredDevices(): SyncDeviceInfo[];
  connectToDevice(deviceId: string): Promise<boolean>;
  sendData(data: any): Promise<boolean>;
  receiveData(): Promise<any>;
  onDeviceDiscovered(callback: (device: SyncDeviceInfo) => void): void;
  onConnectionStateChanged(callback: (connected: boolean, deviceId?: string) => void): void;
  onTransferProgress(callback: (progress: SyncProgress) => void): void;
  disconnect(): Promise<void>;
} 