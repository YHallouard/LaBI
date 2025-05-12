import { ReferenceRangeCalculator } from "../ReferenceRangeCalculator";
import { UserProfile, Gender } from "../../UserProfile";

describe("ReferenceRangeCalculator", () => {
  let calculator: ReferenceRangeCalculator;
  let maleAdultProfile: UserProfile;
  let femaleAdultProfile: UserProfile;
  let childProfile: UserProfile;
  let seniorProfile: UserProfile;

  beforeEach(() => {
    calculator = new ReferenceRangeCalculator();

    maleAdultProfile = createMaleAdultProfile();
    femaleAdultProfile = createFemaleAdultProfile();
    childProfile = createChildProfile();
    seniorProfile = createSeniorProfile();
  });

  function createMaleAdultProfile(): UserProfile {
    return {
      id: "test-male-adult",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      birthDate: new Date(new Date().getFullYear() - 35, 0, 1),
      gender: "male" as Gender,
    };
  }

  function createFemaleAdultProfile(): UserProfile {
    return {
      id: "test-female-adult",
      firstName: "Jane",
      lastName: "Doe",
      name: "Jane Doe",
      birthDate: new Date(new Date().getFullYear() - 28, 0, 1),
      gender: "female" as Gender,
    };
  }

  function createChildProfile(): UserProfile {
    return {
      id: "test-child",
      firstName: "Alex",
      lastName: "Child",
      name: "Child",
      birthDate: new Date(new Date().getFullYear() - 8, 0, 1),
      gender: "male" as Gender,
    };
  }

  function createSeniorProfile(): UserProfile {
    return {
      id: "test-senior",
      firstName: "Martha",
      lastName: "Senior",
      name: "Senior",
      birthDate: new Date(new Date().getFullYear() - 75, 0, 1),
      gender: "female" as Gender,
    };
  }

  describe("hemoglobin reference range", () => {
    test("should return appropriate reference range for adult male", () => {
      const labKey = "Hémoglobine";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        maleAdultProfile
      );

      expect(result.min).toBe(130);
      expect(result.max).toBe(180);
    });

    test("should return appropriate reference range for adult female", () => {
      const labKey = "Hémoglobine";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        femaleAdultProfile
      );

      expect(result.min).toBe(115);
      expect(result.max).toBe(175);
    });

    test("should return age-appropriate reference range for child", () => {
      const labKey = "Hémoglobine";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        childProfile
      );

      expect(result.min).toBe(111);
      expect(result.max).toBe(147);
    });

    test("should return age-appropriate reference range for senior", () => {
      const labKey = "Hémoglobine";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        seniorProfile
      );

      expect(result.min).toBe(118);
      expect(result.max).toBe(150);
    });
  });

  describe("CRP reference range", () => {
    test("should return standard reference range for male", () => {
      const labKey = "Proteine C Reactive";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        maleAdultProfile
      );

      expect(result.min).toBe(0);
      expect(result.max).toBe(5.0);
    });

    test("should return female-specific reference range for female", () => {
      const labKey = "Proteine C Reactive";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        femaleAdultProfile
      );

      expect(result.min).toBe(0);
      expect(result.max).toBe(5.6);
    });
  });

  describe("reference ranges without profile", () => {
    test("should return default reference ranges when profile is null", () => {
      const labKey = "Hémoglobine";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        null
      );

      expect(result.min).toBe(13.0);
      expect(result.max).toBe(18.0);
    });
  });

  describe("historical analysis", () => {
    test("should calculate age at the time of analysis", () => {
      const labKey = "Hémoglobine";

      // Analysis date 10 years ago
      const analysisDate = new Date(new Date().getFullYear() - 10, 0, 1);

      // Profile is now 35, but was 25 at time of analysis
      const profile = { ...maleAdultProfile };

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        profile
      );

      expect(result.min).toBe(130);
      expect(result.max).toBe(180);
    });
  });
});
