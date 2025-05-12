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
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    repository = new MockUserProfileRepository();
    useCase = new SaveUserProfileUseCase(repository);

    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
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
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0][0]).toContain(
      "Profile validation failed"
    );
  });

  test("should reject profile with missing lastName", async () => {
    const invalidProfile = createProfileWithoutLastName();

    const result = await useCase.execute(invalidProfile);

    expect(result).toBe(false);
    expect(repository.saveWasCalled).toBe(false);
    expect(repository.lastSavedProfile).toBeNull();
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0][0]).toContain(
      "Profile validation failed"
    );
  });

  test("should propagate repository errors", async () => {
    const validProfile = createValidUserProfile();
    repository.shouldThrowError = true;

    await expect(useCase.execute(validProfile)).rejects.toThrow(
      "Mock save error"
    );
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0][0]).toContain(
      "Error in SaveUserProfileUseCase:"
    );
  });
});
