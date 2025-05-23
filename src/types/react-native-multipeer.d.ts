declare module 'react-native-multipeer' {
  interface RNMultipeer {
    addEventListener(event: string, callback: (data: any) => void): void;
    removeEventListener(event: string, callback: (data: any) => void): void;
    advertise(serviceId: string, deviceName: string): Promise<void>;
    stopAdvertising(): Promise<void>;
    browse(serviceId: string): Promise<void>;
    stopBrowsing(): Promise<void>;
    invite(peerId: string): Promise<void>;
    send(data: string): Promise<void>;
  }

  const RNMultipeer: RNMultipeer;
  export default RNMultipeer;
} 