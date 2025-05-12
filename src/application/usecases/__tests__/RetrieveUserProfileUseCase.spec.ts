import { RetrieveUserProfileUseCase } from "../RetrieveUserProfileUseCase";
import { UserProfile, Gender } from "../../../domain/UserProfile";
import { UserProfileRepository } from "../../../ports/repositories/UserProfileRepository";

class MockUserProfileRepository implements UserProfileRepository {
  private mockProfile: UserProfile | null = null;
  shouldThrowError = false;

  constructor(profile: UserProfile | null = null) {
    this.mockProfile = profile;
  }

  async retrieve(): Promise<UserProfile | null> {
    if (this.shouldThrowError) {
      throw new Error("Mock repository error");
    }
    return this.mockProfile;
  }

  async save(userProfile: UserProfile): Promise<UserProfile> {
    this.mockProfile = userProfile;
    return userProfile;
  }

  async update(profile: UserProfile): Promise<void> {
    this.mockProfile = profile;
  }

  async reset(): Promise<void> {
    this.mockProfile = null;
  }
}

describe("RetrieveUserProfileUseCase", () => {
  let useCase: RetrieveUserProfileUseCase;
  let repository: MockUserProfileRepository;
  let testProfile: UserProfile;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    testProfile = createTestProfile();
    repository = new MockUserProfileRepository(testProfile);
    useCase = new RetrieveUserProfileUseCase(repository);

    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  function createTestProfile(): UserProfile {
    return {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: new Date(1990, 0, 1),
      gender: "male" as Gender,
    };
  }

  test("should retrieve user profile when profile exists", async () => {
    const result = await useCase.execute();

    expect(result).not.toBeNull();
    expect(result).toBe(testProfile);
  });

  test("should return null when no profile exists", async () => {
    repository = new MockUserProfileRepository(null);
    useCase = new RetrieveUserProfileUseCase(repository);

    const result = await useCase.execute();

    expect(result).toBeNull();
  });

  test("should propagate repository errors", async () => {
    repository.shouldThrowError = true;

    await expect(useCase.execute()).rejects.toThrow("Mock repository error");
    expect(console.error).toHaveBeenCalled();
  });
});
