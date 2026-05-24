import { EditUserProfileUseCase } from "../EditUserProfileUseCase";
import { UserProfile, Gender } from "../../../domain/UserProfile";
import { UserProfileRepository } from "../../../ports/repositories/UserProfileRepository";

class MockUserProfileRepository implements UserProfileRepository {
  updateWasCalled = false;
  lastSavedProfile: UserProfile | null = null;
  shouldThrowError = false;

  async retrieve(): Promise<UserProfile | null> {
    return null;
  }

  async save(userProfile: UserProfile): Promise<UserProfile> {
    this.lastSavedProfile = userProfile;
    return userProfile;
  }

  async update(profile: UserProfile): Promise<void> {
    if (this.shouldThrowError) {
      throw new Error("Mock update error");
    }
    this.updateWasCalled = true;
    this.lastSavedProfile = profile;
  }

  async reset(): Promise<void> {
    this.lastSavedProfile = null;
  }
}

describe("EditUserProfileUseCase", () => {
  let useCase: EditUserProfileUseCase;
  let repository: MockUserProfileRepository;

  beforeEach(() => {
    repository = new MockUserProfileRepository();
    useCase = new EditUserProfileUseCase(repository);
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

  function createInvalidUserProfile(): UserProfile {
    return {
      id: "1",
      firstName: "",
      lastName: "",
      name: "",
      birthDate: new Date(1990, 0, 1),
      gender: "male" as Gender,
    };
  }

  test("should update valid user profile successfully", async () => {
    const validProfile = createValidUserProfile();

    const result = await useCase.execute(validProfile);

    expect(result).toBe(true);
    expect(repository.updateWasCalled).toBe(true);
    expect(repository.lastSavedProfile).toBe(validProfile);
  });

  test("should reject profile with missing required fields", async () => {
    const invalidProfile = createInvalidUserProfile();

    const result = await useCase.execute(invalidProfile);

    expect(result).toBe(false);
    expect(repository.updateWasCalled).toBe(false);
    expect(repository.lastSavedProfile).toBeNull();
  });

  test("should propagate repository errors", async () => {
    const validProfile = createValidUserProfile();
    repository.shouldThrowError = true;

    await expect(useCase.execute(validProfile)).rejects.toThrow(
      "Mock update error"
    );
  });

  test("should validate firstName field", async () => {
    const profile = createValidUserProfile();
    profile.firstName = "";

    const result = await useCase.execute(profile);

    expect(result).toBe(false);
    expect(repository.updateWasCalled).toBe(false);
  });

  test("should validate lastName field", async () => {
    const profile = createValidUserProfile();
    profile.lastName = "";

    const result = await useCase.execute(profile);

    expect(result).toBe(false);
    expect(repository.updateWasCalled).toBe(false);
  });
});
