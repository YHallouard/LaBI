import { Platform } from 'react-native';
import { SyncingServicePort } from '../../ports/services/SyncingServicePort';
import { InMemorySyncService } from '../../adapters/services/InMemorySyncService';

export class SyncingServiceFactory {
  static createSyncingService(): SyncingServicePort {
    let isExpo = false;
    let isPhysicalDevice = false;
    let constants = null;
    let expoDevice = null;
    
    try {
      constants = require('expo-constants');
      isExpo = constants.appOwnership === 'expo';
      console.log(`[SyncFactory] Constants.appOwnership: ${constants.appOwnership}`);
      

      expoDevice = require('expo-device');
      isPhysicalDevice = expoDevice.isDevice;
      
      console.log(`[SyncFactory] Environment Details:`);
      console.log(`  - Expo: ${isExpo}`);
      console.log(`  - PhysicalDevice: ${isPhysicalDevice}`);
      console.log(`  - Platform: ${Platform.OS}`);
      console.log(`  - DevMode: ${__DEV__}`);
      console.log(`  - Constants.appOwnership: ${constants?.appOwnership}`);
      console.log(`  - ExpoDevice.isDevice: ${expoDevice?.isDevice}`);
      console.log(`  - ExpoDevice.deviceType: ${expoDevice?.deviceType}`);
    } catch (error) {
      console.log("Error checking environment:", error);

      isExpo = true;
      isPhysicalDevice = false;
    }
    
    // Use InMemory implementation only in Expo Go or simulators/emulators
    if (isExpo || !isPhysicalDevice) {
      console.log(`[SyncFactory] Using InMemoryMultipeerSyncService - Reason: isExpo=${isExpo}, isPhysicalDevice=${isPhysicalDevice}`);
      return new InMemorySyncService();
    }
    
    try {
      console.log(`[SyncFactory] Attempting to use MultipeerSyncService on physical ${Platform.OS} device`);
      const { MultipeerSyncService } = require('../../adapters/services/MultipeerSyncService');
      const service = new MultipeerSyncService();
      console.log('[SyncFactory] Successfully created MultipeerSyncService');
      return service;
    } catch (error) {
      console.log(`[SyncFactory] Error creating MultipeerSyncService: ${error}. Falling back to InMemory implementation.`);
      return new InMemorySyncService();
    }
  }
} 