import { Platform } from 'react-native';
import { SyncingServicePort } from '../../ports/services/SyncingServicePort';
import { InMemoryMultipeerSyncService } from '../../adapters/services/InMemoryMultipeerSyncService';

export class SyncingServiceFactory {
  static createSyncingService(): SyncingServicePort {
    // Always use InMemoryMultipeerSyncService in Expo Go or development mode
    const isDevMode = __DEV__;
    let isExpo = false;
    
    try {
      // Check if we're in Expo Go
      const Constants = require('expo-constants');
      isExpo = Constants.appOwnership === 'expo';
    } catch (error) {
      console.log("Error checking Expo environment:", error);
    }
    
    // Always use InMemory implementation in Expo Go
    if (isExpo || isDevMode) {
      console.log('Using InMemoryMultipeerSyncService for device syncing');
      return new InMemoryMultipeerSyncService();
    }
    
    // For production native builds, dynamically import the platform-specific implementation
    try {
      if (Platform.OS === 'ios') {
        const { IOSMultipeerSyncService } = require('../../adapters/services/IOSMultipeerSyncService');
        return new IOSMultipeerSyncService();
      } else if (Platform.OS === 'android') {
        const { AndroidMultipeerSyncService } = require('../../adapters/services/AndroidMultipeerSyncService');
        return new AndroidMultipeerSyncService();
      } else {
        throw new Error(`Platform ${Platform.OS} is not supported for syncing`);
      }
    } catch (error) {
      console.log(`Error initializing native sync service: ${error}. Falling back to InMemory implementation.`);
      return new InMemoryMultipeerSyncService();
    }
  }
} 