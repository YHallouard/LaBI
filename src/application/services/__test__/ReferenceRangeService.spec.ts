import { ReferenceRangeService } from "../ReferenceRangeService";
import { ReferenceRangeCalculator } from "../../../domain/services/ReferenceRangeCalculator";
import { UserProfile } from "../../../domain/UserProfile";
import { UserProfileRepository } from "../../../ports/repositories/UserProfileRepository";

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

describe("ReferenceRangeService", () => {
  let referenceRangeCalculator: ReferenceRangeCalculator;
  let userProfileRepository: UserProfileRepository;
  let service: ReferenceRangeService;
  let adultMaleProfile: UserProfile;

  beforeEach(() => {
    referenceRangeCalculator = new ReferenceRangeCalculator();
    adultMaleProfile = createAdultMaleProfile();
    userProfileRepository = new MockUserProfileRepository(adultMaleProfile);
    service = new ReferenceRangeService(
      referenceRangeCalculator,
      userProfileRepository
    );
  });

  function createAdultMaleProfile(): UserProfile {
    return {
      id: "test-user",
      firstName: "John",
      lastName: "Doe",
      birthDate: new Date(new Date().getFullYear() - 30, 0, 1),
      gender: "male" as const,
    };
  }

  function createServiceWithNullProfile(): ReferenceRangeService {
    const nullProfileRepository = new MockUserProfileRepository(null);
    return new ReferenceRangeService(
      referenceRangeCalculator,
      nullProfileRepository
    );
  }

  function createFemaleProfileFrom(maleProfile: UserProfile): UserProfile {
    return {
      ...maleProfile,
      gender: "female" as const,
      id: "test-female-user",
    };
  }

  describe("initialize", () => {
    test("should load user profile when available", async () => {
      await service.initialize();

      const referenceRange = service.getReferenceRange(
        "Hémoglobine",
        new Date()
      );

      expect(referenceRange.min).toBe(130);
      expect(referenceRange.max).toBe(180);
    });
  });

  describe("getReferenceRange", () => {
    test("should return gender-specific values for CRP", async () => {
      await service.initialize();

      const maleRange = service.getReferenceRange(
        "Proteine C Reactive",
        new Date()
      );

      expect(maleRange.min).toBe(0);
      expect(maleRange.max).toBe(5.0);

      await switchToFemaleProfile();

      const femaleRange = service.getReferenceRange(
        "Proteine C Reactive",
        new Date()
      );
      expect(femaleRange.min).toBe(0);
      expect(femaleRange.max).toBe(5.6);
    });

    test("should use default values when no profile exists", async () => {
      service = createServiceWithNullProfile();

      await service.initialize();
      const referenceRange = service.getReferenceRange(
        "Hémoglobine",
        new Date()
      );

      expect(referenceRange.min).toBe(13.0);
      expect(referenceRange.max).toBe(18.0);
    });
  });

  async function switchToFemaleProfile(): Promise<void> {
    const femaleProfile = createFemaleProfileFrom(adultMaleProfile);
    await userProfileRepository.save(femaleProfile);
    await service.initialize();
  }
});
