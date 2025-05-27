declare module 'react-native-multipeer-connectivity' {
  export interface RNPeer {
    id: string;
    displayName: string;
  }

  export enum PeerState {
    notConnected = 0,
    connecting = 1,
    connected = 2
  }

  export interface InitSessionOptions {
    displayName: string;
    serviceType: string;
    discoveryInfo?: Record<string, string>;
  }

  export interface MPCSession {
    peerID: string;
    browse(): Promise<void>;
    advertize(): Promise<void>;
    stopBrowsing(): Promise<void>;
    stopAdvertizing(): Promise<void>;
    invite(peerID: string): Promise<void>;
    invite(options: {
      peerID: string;
      timeout?: number;
      context?: Record<string, any>;
    }): Promise<void>;
    sendText(id: string, text: string): Promise<void>;
    disconnect(): Promise<void>;
    
    onStartAdvertisingError(fn: (event: { text: string }) => void): any;
    onReceivedPeerInvitation(fn: (event: {
      peer: RNPeer;
      context?: Record<string, any>;
      handler: (accept: boolean) => Promise<void>;
    }) => void): any;
    onStartBrowsingError(fn: (event: { text: string }) => void): any;
    onFoundPeer(fn: (event: {
      peer: RNPeer;
      discoveryInfo?: Record<string, string>;
    }) => void): any;
    onLostPeer(fn: (event: { peer: RNPeer }) => void): any;
    onPeerStateChanged(fn: (event: {
      peer: RNPeer;
      state: PeerState;
    }) => void): any;
    onReceivedText(fn: (event: {
      peer: RNPeer;
      text: string;
    }) => void): any;
  }

  export function initSession(options: InitSessionOptions): MPCSession;
} 