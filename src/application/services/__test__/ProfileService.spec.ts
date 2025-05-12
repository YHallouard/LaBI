import { ProfileService } from "../ProfileService";
import { RetrieveUserProfileUseCase } from "../../usecases/RetrieveUserProfileUseCase";

jest.mock("../../usecases/RetrieveUserProfileUseCase");
jest.mock("../../../adapters/repositories/SQLiteUserProfileRepository");

describe("ProfileService", () => {
  let profileService: ProfileService;
  let mockExecute: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockExecute = jest.fn();
    (RetrieveUserProfileUseCase as jest.Mock).mockImplementation(() => ({
      execute: mockExecute,
    }));

    resetProfileServiceInstance();
    profileService = ProfileService.getInstance();
  });

  function resetProfileServiceInstance(): void {
    // @ts-expect-error - accessing private static field for testing
    ProfileService.instance = undefined;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  function setupMockProfileResponse(profile: any): void {
    mockExecute.mockResolvedValue(profile);
  }

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
  });

  describe("setProfileExists", () => {
    test("should update profile status when called", async () => {
      profileService.setProfileExists(true);

      const result = await profileService.checkProfileExists();

      expect(result).toBe(true);
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
  });
});
