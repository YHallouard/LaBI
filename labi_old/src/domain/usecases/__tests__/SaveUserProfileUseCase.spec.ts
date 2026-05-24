import { SaveUserProfileUseCase } from "../SaveUserProfileUseCase";
import { UserProfile, Gender } from "../../../domain/UserProfile";
import { UserProfileRepository } from "../../../ports/repositories/UserProfileRepository";

class MockUserProfileRepository implements UserProfileRepository {
  saveWasCalled = false;
  lastSavedProfile: UserProfile | null = null;
  shouldThrowError = false;

  async retrieve(): Promise<UserProfile | null> {
    return this.lastSavedProfile;
  }

  async save(userProfile: UserProfile): Promise<UserProfile> {
    if (this.shouldThrowError) {
      throw new Error("Mock save error");
    }
    this.saveWasCalled = true;
    this.lastSavedProfile = userProfile;
    return userProfile;
  }

  async update(profile: UserProfile): Promise<void> {
    this.lastSavedProfile = profile;
  }

  async reset(): Promise<void> {
    this.lastSavedProfile = null;
  }
}

describe("SaveUserProfileUseCase", () => {
  let useCase: SaveUserProfileUseCase;
  let repository: MockUserProfileRepository;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    repository = new MockUserProfileRepository();
    useCase = new SaveUserProfileUseCase(repository);

    // Setup console spy
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function createValidUserProfile(): UserProfile {
    return {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: new Date(1990, 0, 1),
      gender: "male" as Gender,
    };
  }

  function createProfileWithoutFirstName(): UserProfile {
    const profile = createValidUserProfile();
    profile.firstName = "";
    return profile;
  }

  function createProfileWithoutLastName(): UserProfile {
    const profile = createValidUserProfile();
    profile.lastName = "";
    return profile;
  }

  test("should save valid user profile successfully", async () => {
    const validProfile = createValidUserProfile();

    const result = await useCase.execute(validProfile);

    expect(result).toBe(true);
    expect(repository.saveWasCalled).toBe(true);
    expect(repository.lastSavedProfile).toBe(validProfile);
  });

  test("should reject profile with missing firstName", async () => {
    const invalidProfile = createProfileWithoutFirstName();

    const result = await useCase.execute(invalidProfile);

    expect(result).toBe(false);
    expect(repository.saveWasCalled).toBe(false);
    expect(repository.lastSavedProfile).toBeNull();
    // Test passes if validation fails correctly
  });

  test("should reject profile with missing lastName", async () => {
    const invalidProfile = createProfileWithoutLastName();

    const result = await useCase.execute(invalidProfile);

    expect(result).toBe(false);
    expect(repository.saveWasCalled).toBe(false);
    expect(repository.lastSavedProfile).toBeNull();
    // Test passes if validation fails correctly
  });

  test("should propagate repository errors", async () => {
    const validProfile = createValidUserProfile();
    repository.shouldThrowError = true;

    await expect(useCase.execute(validProfile)).rejects.toThrow(
      "Mock save error"
    );
    // Test passes if error is propagated correctly
  });
});
