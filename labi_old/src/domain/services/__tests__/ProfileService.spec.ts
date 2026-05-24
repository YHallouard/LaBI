import { ProfileService } from "../ProfileService";
import { RetrieveUserProfileUseCase } from "../../usecases/RetrieveUserProfileUseCase";
import { UserProfileRepository } from "../../../ports/repositories/UserProfileRepository";

jest.mock("../../usecases/RetrieveUserProfileUseCase");

describe("ProfileService", () => {
  let profileService: ProfileService;
  let mockUserProfileRepository: jest.Mocked<UserProfileRepository>;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockUserProfileRepository = {
      retrieve: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      reset: jest.fn(),
    };

    mockExecute = jest.fn();
    (RetrieveUserProfileUseCase as jest.Mock).mockImplementation(() => ({
      execute: mockExecute,
    }));

    // Reset singleton instance and get fresh instance
    ProfileService.resetInstance();
    profileService = ProfileService.getInstance();
    profileService.initialize(mockUserProfileRepository);
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  function setupMockProfileResponse(profile: any): void {
    mockExecute.mockResolvedValue(profile);
  }

  describe("singleton pattern", () => {
    test("should return the same instance on multiple calls", () => {
      const instance1 = ProfileService.getInstance();
      const instance2 = ProfileService.getInstance();

      expect(instance1).toBe(instance2);
    });

    test("should create new instance when previous instance is reset", () => {
      const instance1 = ProfileService.getInstance();
      ProfileService.resetInstance();
      const instance2 = ProfileService.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("initialization", () => {
    test("should initialize with user profile repository", () => {
      expect(profileService).toBeInstanceOf(ProfileService);
      expect(RetrieveUserProfileUseCase).toHaveBeenCalledWith(
        mockUserProfileRepository
      );
    });

    test("should not reinitialize if already initialized", () => {
      const newRepository = {
        retrieve: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        reset: jest.fn(),
      };

      profileService.initialize(newRepository);

      // Should still use the original repository
      expect(RetrieveUserProfileUseCase).toHaveBeenCalledTimes(1);
      expect(RetrieveUserProfileUseCase).toHaveBeenCalledWith(
        mockUserProfileRepository
      );
    });

    test("should throw error if not initialized", async () => {
      ProfileService.resetInstance();
      const uninitializedService = ProfileService.getInstance();

      await expect(uninitializedService.checkProfileExists()).rejects.toThrow(
        "ProfileService is not initialized. Call initialize() first."
      );
    });
  });

  describe("checkProfileExists", () => {
    test("should return true when user has a profile", async () => {
      const mockProfile = { id: "1", firstName: "Test", lastName: "User" };
      setupMockProfileResponse(mockProfile);

      const result = await profileService.checkProfileExists();

      expect(result).toBe(true);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    test("should return false when user has no profile", async () => {
      setupMockProfileResponse(null);

      const result = await profileService.checkProfileExists();

      expect(result).toBe(false);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    test("should return false when an error occurs", async () => {
      mockExecute.mockRejectedValue(new Error("Database error"));

      const result = await profileService.checkProfileExists();

      expect(result).toBe(false);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    test("should use cached result on subsequent calls", async () => {
      setupMockProfileResponse({
        id: "1",
        firstName: "Test",
        lastName: "User",
      });
      await profileService.checkProfileExists();
      mockExecute.mockClear();

      const result = await profileService.checkProfileExists();

      expect(result).toBe(true);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    test("should handle concurrent calls", async () => {
      const mockProfile = { id: "1", firstName: "Test", lastName: "User" };
      setupMockProfileResponse(mockProfile);

      // Call checkProfileExists multiple times concurrently
      const promises = [
        profileService.checkProfileExists(),
        profileService.checkProfileExists(),
        profileService.checkProfileExists(),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true]);
      // Due to concurrent calls, the first call might not have completed when others start
      // So we expect at least 1 call, but it could be more depending on timing
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe("setProfileExists", () => {
    test("should update profile status when called", async () => {
      profileService.setProfileExists(true);

      const result = await profileService.checkProfileExists();

      expect(result).toBe(true);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    test("should update profile status to false", async () => {
      // First set to true
      profileService.setProfileExists(true);
      await profileService.checkProfileExists(); // This should use cached value

      // Then set to false
      profileService.setProfileExists(false);
      const result = await profileService.checkProfileExists();

      expect(result).toBe(false);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    test("should mark profile as checked when set", async () => {
      profileService.setProfileExists(true);

      // Should not call the use case since it's marked as checked
      await profileService.checkProfileExists();

      expect(mockExecute).not.toHaveBeenCalled();
    });
  });

  describe("resetProfileCheck", () => {
    test("should clear cached status and query again on next check", async () => {
      setupMockProfileResponse({
        id: "1",
        firstName: "Test",
        lastName: "User",
      });
      await profileService.checkProfileExists();
      mockExecute.mockClear();

      profileService.resetProfileCheck();
      await profileService.checkProfileExists();

      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    test("should reset to false when no profile exists after reset", async () => {
      setupMockProfileResponse(null);
      await profileService.checkProfileExists();
      mockExecute.mockClear();

      profileService.resetProfileCheck();
      const result = await profileService.checkProfileExists();

      expect(result).toBe(false);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    test("should handle errors after reset", async () => {
      setupMockProfileResponse({
        id: "1",
        firstName: "Test",
        lastName: "User",
      });
      await profileService.checkProfileExists();
      mockExecute.mockClear();

      profileService.resetProfileCheck();
      mockExecute.mockRejectedValue(new Error("Database error"));

      const result = await profileService.checkProfileExists();

      expect(result).toBe(false);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    test("should handle RetrieveUserProfileUseCase execution errors", async () => {
      mockExecute.mockRejectedValue(new Error("Use case execution failed"));

      const result = await profileService.checkProfileExists();

      expect(result).toBe(false);
    });

    test("should handle null profile response", async () => {
      setupMockProfileResponse(null);

      const result = await profileService.checkProfileExists();

      expect(result).toBe(false);
    });

    test("should handle undefined profile response", async () => {
      setupMockProfileResponse(undefined);

      const result = await profileService.checkProfileExists();

      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("should handle multiple reset and check cycles", async () => {
      setupMockProfileResponse({
        id: "1",
        firstName: "Test",
        lastName: "User",
      });

      // First check
      await profileService.checkProfileExists();
      expect(mockExecute).toHaveBeenCalledTimes(1);

      // Reset and check again
      profileService.resetProfileCheck();
      await profileService.checkProfileExists();
      expect(mockExecute).toHaveBeenCalledTimes(2);

      // Reset and check again
      profileService.resetProfileCheck();
      await profileService.checkProfileExists();
      expect(mockExecute).toHaveBeenCalledTimes(3);
    });

    test("should handle setProfileExists after resetProfileCheck", async () => {
      setupMockProfileResponse({
        id: "1",
        firstName: "Test",
        lastName: "User",
      });
      await profileService.checkProfileExists();
      mockExecute.mockClear();

      profileService.resetProfileCheck();
      profileService.setProfileExists(false);

      const result = await profileService.checkProfileExists();
      expect(result).toBe(false);
      // setProfileExists marks the profile as checked, so no need to call execute
      expect(mockExecute).not.toHaveBeenCalled();
    });

    test("should maintain cache across multiple instances", async () => {
      setupMockProfileResponse({
        id: "1",
        firstName: "Test",
        lastName: "User",
      });

      // First instance checks profile
      await profileService.checkProfileExists();
      expect(mockExecute).toHaveBeenCalledTimes(1);

      // Get another instance (should be the same singleton)
      const anotherInstance = ProfileService.getInstance();
      mockExecute.mockClear();

      // Second instance should use cached result
      const result = await anotherInstance.checkProfileExists();
      expect(result).toBe(true);
      expect(mockExecute).not.toHaveBeenCalled();
    });
  });
});
