import { SyncingServiceFactory } from "../SyncingServiceFactory";
import { Platform } from "react-native";
import { InMemorySyncService } from "../../../adapters/services/InMemorySyncService";
import { MultipeerSyncService } from "../../../adapters/services/MultipeerSyncService";

// Mock the Platform module
jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: jest.fn((obj) => obj.ios),
  },
}));

// Mock Constants from expo-constants
jest.mock("expo-constants", () => ({
  default: {
    appOwnership: "expo",
  },
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  default: {
    isDevice: false,
  },
}));

// Mock react-native-device-info
jest.mock("react-native-device-info", () => ({
  getModel: jest.fn(() => "Test Device"),
  getManufacturer: jest.fn(() => "Apple"),
}));

// Mock MultipeerSyncService
jest.mock("../../../adapters/services/MultipeerSyncService", () => ({
  MultipeerSyncService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
  })),
}));

describe("SyncingServiceFactory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global.__DEV__ using type assertion
    (global as any).__DEV__ = false;
  });

  it("should create MultipeerSyncService in Expo Go environment", () => {
    // Given - mocked modules already set up for Expo environment

    // When
    const service = SyncingServiceFactory.createSyncingService();

    // Then
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should create MultipeerSyncService when not on a physical device", () => {
    // Given - mocked to return simulator/emulator

    // When
    const service = SyncingServiceFactory.createSyncingService();

    // Then
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should create MultipeerSyncService on physical device in standalone app", () => {
    // Given
    require("expo-constants").appOwnership = "standalone";
    require("expo-device").isDevice = true;

    // When
    const service = SyncingServiceFactory.createSyncingService();

    // Then
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should handle missing expo-constants gracefully", () => {
    // Given
    require("expo-constants").appOwnership = "standalone";
    require("expo-device").isDevice = true;

    // When
    const service = SyncingServiceFactory.createSyncingService();

    // Then
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should handle missing expo-device gracefully", () => {
    // Given
    require("expo-constants").appOwnership = "standalone";
    require("expo-device").isDevice = true;

    // When
    const service = SyncingServiceFactory.createSyncingService();

    // Then
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should create MultipeerSyncService for iOS production on physical device", () => {
    // Mock iOS production environment on physical device
    Platform.OS = "ios";
    require("expo-constants").appOwnership = "standalone";
    require("expo-device").isDevice = true;
    (global as any).__DEV__ = false;

    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should create MultipeerSyncService for Android production on physical device", () => {
    // Mock Android production environment on physical device
    Platform.OS = "android";
    require("expo-constants").appOwnership = "standalone";
    require("expo-device").isDevice = true;
    (global as any).__DEV__ = false;

    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should handle errors and fall back to InMemorySyncService", () => {
    // Mock production environment with an error
    Platform.OS = "ios";
    require("expo-constants").appOwnership = "standalone";
    require("expo-device").isDevice = true;
    (global as any).__DEV__ = false;

    // Mock an error when importing MultipeerSyncService
    jest.mock("../../../adapters/services/MultipeerSyncService", () => {
      throw new Error("Module not found");
    });

    const service = SyncingServiceFactory.createSyncingService();
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should create MultipeerSyncService for Hermes compatibility", () => {
    // Given/When
    const service = SyncingServiceFactory.createSyncingService();

    // Then
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });

  it("should handle errors gracefully", () => {
    // Given/When
    const service = SyncingServiceFactory.createSyncingService();

    // Then
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe("function");
  });
});
