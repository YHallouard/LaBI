import { ReferenceRangeCalculator } from "../../../domain/services/ReferenceRangeCalculator";
import { UserProfile } from "../../../domain/UserProfile";
import { UserProfileRepository } from "../../../ports/repositories/UserProfileRepository";
import { GetReferenceRangeUseCase } from "../GetReferenceRangeUseCase";

class MockUserProfileRepository implements UserProfileRepository {
  private profile: UserProfile | null = null;

  constructor(profile: UserProfile | null = null) {
    this.profile = profile;
  }

  async retrieve(): Promise<UserProfile | null> {
    return this.profile;
  }

  async save(userProfile: UserProfile): Promise<UserProfile> {
    this.profile = userProfile;
    return userProfile;
  }

  async update(profile: UserProfile): Promise<void> {
    this.profile = profile;
  }

  async reset(): Promise<void> {
    this.profile = null;
  }
}

describe("GetReferenceRangeUseCase", () => {
  const mockReferenceRangeCalculator = new ReferenceRangeCalculator();
  let service: GetReferenceRangeUseCase;
  const userProfile: UserProfile = {
    id: "1",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    birthDate: new Date("1980-01-01"),
    gender: "male",
  };

  beforeEach(async () => {
    service = new GetReferenceRangeUseCase(
      mockReferenceRangeCalculator,
      new MockUserProfileRepository(userProfile)
    );
    await service.initialize();
  });

  it("should properly initialize and calculate reference range based on user profile", () => {
    const testDate = new Date("2022-01-01");
    const range = service.execute("Hematies", testDate);

    expect(range).toBeDefined();
    expect(range.min).toBeGreaterThan(0);
    expect(range.max).toBeGreaterThan(range.min);
  });

  it("should use default ranges when user profile is null", async () => {
    const nullProfileService = createServiceWithNullProfile();
    await nullProfileService.initialize();
    
    const testDate = new Date("2022-01-01");
    const range = nullProfileService.execute("Hematies", testDate);

    expect(range).toBeDefined();
    expect(range.min).toBeGreaterThan(0);
    expect(range.max).toBeGreaterThan(range.min);
  });

  function createServiceWithNullProfile(): GetReferenceRangeUseCase {
    // Create service with null user profile
    return new GetReferenceRangeUseCase(
      mockReferenceRangeCalculator,
      new MockUserProfileRepository(null)
    );
  }
}); 