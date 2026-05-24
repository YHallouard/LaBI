import { RetrieveUserProfileUseCase } from "../RetrieveUserProfileUseCase";
import { UserProfile, Gender } from "../../../domain/UserProfile";
import { InMemoryUserProfileRepository } from "../../../adapters/repositories/InMemoryUserProfileRepository";

describe("RetrieveUserProfileUseCase", () => {
  let useCase: RetrieveUserProfileUseCase;
  let repository: InMemoryUserProfileRepository;
  let testProfile: UserProfile;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    testProfile = createTestProfile();
    repository = new InMemoryUserProfileRepository(testProfile);
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
    repository = new InMemoryUserProfileRepository(null);
    useCase = new RetrieveUserProfileUseCase(repository);

    const result = await useCase.execute();

    expect(result).toBeNull();
  });

  test("should propagate repository errors", async () => {
    repository = new InMemoryUserProfileRepository(null, true);
    useCase = new RetrieveUserProfileUseCase(repository);

    await expect(useCase.execute()).rejects.toThrow("Repository error");
  });
});
