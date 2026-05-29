declare module 'react-native-zeroconf' {
  export interface ZeroconfService {
    name: string;
    fullName?: string;
    host: string;
    port: number;
    addresses: string[];
    txt?: Record<string, string>;
  }

  export default class Zeroconf {
    scan(type: string, protocol?: string, domain?: string): void;
    stop(): void;
    publishService(type: string, protocol: string, domain: string, name: string, port: number, txt?: Record<string, string>): void;
    unpublishService(name: string): void;
    removeDeviceListeners(): void;
    removeAllListeners(event?: string): void;
    on(event: 'resolved', handler: (service: ZeroconfService) => void): void;
    on(event: 'remove', handler: (name: string) => void): void;
    on(event: 'error', handler: (err: Error) => void): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
  }
}
