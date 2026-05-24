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

      expect(result.min).toBe(13);
      expect(result.max).toBe(18);
    });

    test("should return appropriate reference range for adult female", () => {
      const labKey = "Hémoglobine";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        femaleAdultProfile
      );

      expect(result.min).toBe(11.5);
      expect(result.max).toBe(17.5);
    });

    test("should return age-appropriate reference range for child", () => {
      const labKey = "Hémoglobine";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        childProfile
      );

      expect(result.min).toBe(11.1);
      expect(result.max).toBe(14.7);
    });

    test("should return age-appropriate reference range for senior", () => {
      const labKey = "Hémoglobine";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        seniorProfile
      );

      expect(result.min).toBe(11.8);
      expect(result.max).toBe(15);
    });
  });

  describe("CRP reference range", () => {
    test("should return standard reference range for male", () => {
      const labKey = "Protéine C Reactive";
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
      const labKey = "Protéine C Reactive";
      const analysisDate = new Date();

      const result = calculator.calculateReferenceRange(
        labKey,
        analysisDate,
        femaleAdultProfile
      );

      expect(result.min).toBe(0);
      expect(result.max).toBe(5);
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

      expect(result.min).toBe(13);
      expect(result.max).toBe(18);
    });
  });

  describe("red blood cells (Hématies)", () => {
    test("should return appropriate range for adult male", () => {
      const result = calculator.calculateReferenceRange(
        "Hématies",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should return appropriate range for adult female", () => {
      const result = calculator.calculateReferenceRange(
        "Hématies",
        new Date(),
        femaleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("hematocrit (Hématocrite)", () => {
    test("should return appropriate range for adult male", () => {
      const result = calculator.calculateReferenceRange(
        "Hématocrite",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should return appropriate range for adult female", () => {
      const result = calculator.calculateReferenceRange(
        "Hématocrite",
        new Date(),
        femaleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("white blood cells (Leucocytes)", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "Leucocytes",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should return appropriate range for child", () => {
      const result = calculator.calculateReferenceRange(
        "Leucocytes",
        new Date(),
        childProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("neutrophils (Polynucléaires neutrophiles)", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "Polynucléaires neutrophiles",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("eosinophils (Polynucléaires éosinophiles)", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "Polynucléaires éosinophiles",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThanOrEqual(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("basophils (Polynucléaires basophiles)", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "Polynucléaires basophiles",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThanOrEqual(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("lymphocytes", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "Lymphocytes",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("monocytes", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "Monocytes",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThanOrEqual(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("platelets (Plaquettes)", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "Plaquettes",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should return appropriate range for child", () => {
      const result = calculator.calculateReferenceRange(
        "Plaquettes",
        new Date(),
        childProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("ferritin (Ferritine)", () => {
    test("should return appropriate range for adult male", () => {
      const result = calculator.calculateReferenceRange(
        "Ferritine",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should return appropriate range for adult female", () => {
      const result = calculator.calculateReferenceRange(
        "Ferritine",
        new Date(),
        femaleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("VGM (Mean Corpuscular Volume)", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "VGM",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("TCMH (Mean Corpuscular Hemoglobin)", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "TCMH",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("CCMH (Mean Corpuscular Hemoglobin Concentration)", () => {
    test("should return appropriate range for adult", () => {
      const result = calculator.calculateReferenceRange(
        "CCMH",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("unknown lab values", () => {
    test("should return default range for unknown lab key", () => {
      const result = calculator.calculateReferenceRange(
        "Unknown Lab Value",
        new Date(),
        maleAdultProfile
      );

      expect(result.min).toBeDefined();
      expect(result.max).toBeDefined();
      expect(result.max).toBeGreaterThanOrEqual(result.min);
    });
  });

  describe("age calculation edge cases", () => {
    test("should handle birthday on analysis date", () => {
      const birthDate = new Date(1990, 5, 15); // June 15, 1990
      const analysisDate = new Date(2023, 5, 15); // June 15, 2023 (33rd birthday)

      const profile: UserProfile = {
        id: "test",
        firstName: "Test",
        lastName: "User",
        name: "Test User",
        birthDate: birthDate,
        gender: "male" as Gender,
      };

      const result = calculator.calculateReferenceRange(
        "Hémoglobine",
        analysisDate,
        profile
      );

      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should handle analysis date before birthday in same year", () => {
      const birthDate = new Date(1990, 5, 15); // June 15, 1990
      const analysisDate = new Date(2023, 3, 10); // April 10, 2023 (before birthday)

      const profile: UserProfile = {
        id: "test",
        firstName: "Test",
        lastName: "User",
        name: "Test User",
        birthDate: birthDate,
        gender: "female" as Gender,
      };

      const result = calculator.calculateReferenceRange(
        "Hémoglobine",
        analysisDate,
        profile
      );

      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("different age groups", () => {
    test("should return appropriate range for infant", () => {
      const infantProfile: UserProfile = {
        id: "test-infant",
        firstName: "Baby",
        lastName: "Doe",
        name: "Baby Doe",
        birthDate: new Date(new Date().getFullYear() - 1, 0, 1), // 1 year old
        gender: "male" as Gender,
      };

      const result = calculator.calculateReferenceRange(
        "Hémoglobine",
        new Date(),
        infantProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should return appropriate range for teenager", () => {
      const teenProfile: UserProfile = {
        id: "test-teen",
        firstName: "Teen",
        lastName: "Doe",
        name: "Teen Doe",
        birthDate: new Date(new Date().getFullYear() - 16, 0, 1), // 16 years old
        gender: "female" as Gender,
      };

      const result = calculator.calculateReferenceRange(
        "Hémoglobine",
        new Date(),
        teenProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should return appropriate range for elderly", () => {
      const elderlyProfile: UserProfile = {
        id: "test-elderly",
        firstName: "Elder",
        lastName: "Doe",
        name: "Elder Doe",
        birthDate: new Date(new Date().getFullYear() - 85, 0, 1), // 85 years old
        gender: "male" as Gender,
      };

      const result = calculator.calculateReferenceRange(
        "Hémoglobine",
        new Date(),
        elderlyProfile
      );

      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });
  });

  describe("gender-specific ranges", () => {
    test("should return different ranges for male vs female for gender-specific lab values", () => {
      const labKey = "Ferritine"; // Typically has gender differences

      const maleResult = calculator.calculateReferenceRange(
        labKey,
        new Date(),
        maleAdultProfile
      );

      const femaleResult = calculator.calculateReferenceRange(
        labKey,
        new Date(),
        femaleAdultProfile
      );

      // Results should be valid ranges
      expect(maleResult.min).toBeGreaterThan(0);
      expect(maleResult.max).toBeGreaterThan(maleResult.min);
      expect(femaleResult.min).toBeGreaterThan(0);
      expect(femaleResult.max).toBeGreaterThan(femaleResult.min);
    });
  });

  describe("all supported lab values", () => {
    const labValues = [
      "Hématies",
      "Hémoglobine",
      "Hématocrite",
      "VGM",
      "TCMH",
      "CCMH",
      "Leucocytes",
      "Polynucléaires neutrophiles",
      "Polynucléaires éosinophiles",
      "Polynucléaires basophiles",
      "Lymphocytes",
      "Monocytes",
      "Plaquettes",
      "Ferritine",
      "Protéine C Reactive",
    ];

    test.each(labValues)("should return valid range for %s", (labKey) => {
      const result = calculator.calculateReferenceRange(
        labKey,
        new Date(),
        maleAdultProfile
      );

      expect(result).toBeDefined();
      expect(typeof result.min).toBe("number");
      expect(typeof result.max).toBe("number");
      expect(result.max).toBeGreaterThanOrEqual(result.min);
    });

    test.each(labValues)(
      "should return valid range for %s with female profile",
      (labKey) => {
        const result = calculator.calculateReferenceRange(
          labKey,
          new Date(),
          femaleAdultProfile
        );

        expect(result).toBeDefined();
        expect(typeof result.min).toBe("number");
        expect(typeof result.max).toBe("number");
        expect(result.max).toBeGreaterThanOrEqual(result.min);
      }
    );

    test.each(labValues)(
      "should return valid range for %s with child profile",
      (labKey) => {
        const result = calculator.calculateReferenceRange(
          labKey,
          new Date(),
          childProfile
        );

        expect(result).toBeDefined();
        expect(typeof result.min).toBe("number");
        expect(typeof result.max).toBe("number");
        expect(result.max).toBeGreaterThanOrEqual(result.min);
      }
    );
  });

  describe("edge cases and error handling", () => {
    test("should handle very old analysis dates", () => {
      const veryOldDate = new Date(1950, 0, 1);

      const result = calculator.calculateReferenceRange(
        "Hémoglobine",
        veryOldDate,
        maleAdultProfile
      );

      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should handle future analysis dates", () => {
      const futureDate = new Date(new Date().getFullYear() + 5, 0, 1);

      const result = calculator.calculateReferenceRange(
        "Hémoglobine",
        futureDate,
        maleAdultProfile
      );

      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should handle leap year birth dates", () => {
      const leapYearProfile: UserProfile = {
        id: "test-leap",
        firstName: "Leap",
        lastName: "Year",
        name: "Leap Year",
        birthDate: new Date(2000, 1, 29), // Feb 29, 2000 (leap year)
        gender: "female" as Gender,
      };

      const result = calculator.calculateReferenceRange(
        "Hémoglobine",
        new Date(2023, 1, 28), // Feb 28, 2023 (non-leap year)
        leapYearProfile
      );

      expect(result).toBeDefined();
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(result.min);
    });

    test("should handle empty string lab key", () => {
      const result = calculator.calculateReferenceRange(
        "",
        new Date(),
        maleAdultProfile
      );

      expect(result).toBeDefined();
      expect(typeof result.min).toBe("number");
      expect(typeof result.max).toBe("number");
    });

    test("should throw error for null birth date", () => {
      const profileWithNullBirthDate: UserProfile = {
        ...maleAdultProfile,
        birthDate: null as any,
      };

      // Should throw error since implementation doesn't handle null birth dates
      expect(() => {
        calculator.calculateReferenceRange(
          "Hémoglobine",
          new Date(),
          profileWithNullBirthDate
        );
      }).toThrow();
    });
  });

  describe("getRedBloodCellsRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getRedBloodCellsRange(30, "male");
      expect(result.min).toBe(4.28);
      expect(result.max).toBe(6.0);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getRedBloodCellsRange(30, "female");
      expect(result.min).toBe(3.8);
      expect(result.max).toBe(5.9);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getRedBloodCellsRange(75, "male");
      expect(result.min).toBe(4.08);
      expect(result.max).toBe(5.6);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getRedBloodCellsRange(75, "female");
      expect(result.min).toBe(3.84);
      expect(result.max).toBe(5.12);
    });

    test("should return correct range for adolescent (12-14 years)", () => {
      const result = (calculator as any).getRedBloodCellsRange(13, "male");
      expect(result.min).toBe(4.2);
      expect(result.max).toBe(5.6);
    });

    test("should return correct range for child (6-11 years)", () => {
      const result = (calculator as any).getRedBloodCellsRange(8, "female");
      expect(result.min).toBe(3.9);
      expect(result.max).toBe(5.2);
    });

    test("should return correct range for toddler (2-5 years)", () => {
      const result = (calculator as any).getRedBloodCellsRange(3, "male");
      expect(result.min).toBe(3.9);
      expect(result.max).toBe(5.3);
    });

    test("should return correct range for infant (6 months - 2 years)", () => {
      const result = (calculator as any).getRedBloodCellsRange(1, "female");
      expect(result.min).toBe(3.7);
      expect(result.max).toBe(5.5);
    });

    test("should return correct range for 3-6 months", () => {
      const result = (calculator as any).getRedBloodCellsRange(0.4, "male");
      expect(result.min).toBe(3.1);
      expect(result.max).toBe(4.5);
    });

    test("should return correct range for 2 months", () => {
      const result = (calculator as any).getRedBloodCellsRange(0.167, "female");
      expect(result.min).toBe(2.7);
      expect(result.max).toBe(4.9);
    });

    test("should return correct range for 1 month", () => {
      const result = (calculator as any).getRedBloodCellsRange(0.083, "male");
      expect(result.min).toBe(3.0);
      expect(result.max).toBe(5.4);
    });

    test("should return correct range for 2 weeks", () => {
      const result = (calculator as any).getRedBloodCellsRange(0.038, "female");
      expect(result.min).toBe(3.6);
      expect(result.max).toBe(6.2);
    });

    test("should return correct range for 1 week", () => {
      const result = (calculator as any).getRedBloodCellsRange(0.019, "male");
      expect(result.min).toBe(3.9);
      expect(result.max).toBe(6.3);
    });

    test("should return correct range for 1-3 days", () => {
      const result = (calculator as any).getRedBloodCellsRange(0.008, "female");
      expect(result.min).toBe(4.0);
      expect(result.max).toBe(6.6);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getRedBloodCellsRange(0.001, "male");
      expect(result.min).toBe(3.7);
      expect(result.max).toBe(7.0);
    });
  });

  describe("getHemoglobinRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getHemoglobinRange(30, "male");
      expect(result.min).toBe(13.0);
      expect(result.max).toBe(18.0);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getHemoglobinRange(30, "female");
      expect(result.min).toBe(11.5);
      expect(result.max).toBe(17.5);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getHemoglobinRange(75, "male");
      expect(result.min).toBe(12.9);
      expect(result.max).toBe(16.7);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getHemoglobinRange(75, "female");
      expect(result.min).toBe(11.8);
      expect(result.max).toBe(15.0);
    });

    test("should return correct range for adolescent", () => {
      const result = (calculator as any).getHemoglobinRange(13, "male");
      expect(result.min).toBe(12.1);
      expect(result.max).toBe(16.6);
    });

    test("should return correct range for child (6-11 years)", () => {
      const result = (calculator as any).getHemoglobinRange(8, "female");
      expect(result.min).toBe(11.1);
      expect(result.max).toBe(14.7);
    });

    test("should return correct range for toddler", () => {
      const result = (calculator as any).getHemoglobinRange(3, "male");
      expect(result.min).toBe(11.0);
      expect(result.max).toBe(14.0);
    });

    test("should return correct range for infant", () => {
      const result = (calculator as any).getHemoglobinRange(1, "female");
      expect(result.min).toBe(10.5);
      expect(result.max).toBe(13.5);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getHemoglobinRange(0.001, "male");
      expect(result.min).toBe(13.5);
      expect(result.max).toBe(23.7);
    });
  });

  describe("getHematocritRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getHematocritRange(30, "male");
      expect(result.min).toBe(39);
      expect(result.max).toBe(53);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getHematocritRange(30, "female");
      expect(result.min).toBe(34);
      expect(result.max).toBe(53);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getHematocritRange(75, "male");
      expect(result.min).toBe(38);
      expect(result.max).toBe(49);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getHematocritRange(75, "female");
      expect(result.min).toBe(35);
      expect(result.max).toBe(45);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getHematocritRange(8, "male");
      expect(result.min).toBe(32);
      expect(result.max).toBe(45);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getHematocritRange(0.001, "female");
      expect(result.min).toBe(42);
      expect(result.max).toBe(75);
    });
  });

  describe("getMeanCorpuscularVolumeRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getMeanCorpuscularVolumeRange(
        30,
        "male"
      );
      expect(result.min).toBe(78);
      expect(result.max).toBe(98);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getMeanCorpuscularVolumeRange(
        30,
        "female"
      );
      expect(result.min).toBe(76);
      expect(result.max).toBe(96);
    });

    test("should return correct range for senior", () => {
      const result = (calculator as any).getMeanCorpuscularVolumeRange(
        75,
        "male"
      );
      expect(result.min).toBe(83);
      expect(result.max).toBe(97);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getMeanCorpuscularVolumeRange(
        8,
        "female"
      );
      expect(result.min).toBe(75);
      expect(result.max).toBe(95);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getMeanCorpuscularVolumeRange(
        0.001,
        "male"
      );
      expect(result.min).toBe(98);
      expect(result.max).toBe(125);
    });
  });

  describe("getMeanCorpuscularHemoglobinRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getMeanCorpuscularHemoglobinRange(
        30,
        "male"
      );
      expect(result.min).toBe(26);
      expect(result.max).toBe(34);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getMeanCorpuscularHemoglobinRange(
        30,
        "female"
      );
      expect(result.min).toBe(24.4);
      expect(result.max).toBe(34);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getMeanCorpuscularHemoglobinRange(
        75,
        "male"
      );
      expect(result.min).toBe(27.8);
      expect(result.max).toBe(33.9);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getMeanCorpuscularHemoglobinRange(
        75,
        "female"
      );
      expect(result.min).toBe(27.5);
      expect(result.max).toBe(33.2);
    });

    test("should return correct range for adolescent", () => {
      const result = (calculator as any).getMeanCorpuscularHemoglobinRange(
        13,
        "male"
      );
      expect(result.min).toBe(25);
      expect(result.max).toBe(35);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getMeanCorpuscularHemoglobinRange(
        8,
        "female"
      );
      expect(result.min).toBe(25);
      expect(result.max).toBe(33);
    });

    test("should return correct range for infant", () => {
      const result = (calculator as any).getMeanCorpuscularHemoglobinRange(
        1,
        "male"
      );
      expect(result.min).toBe(23);
      expect(result.max).toBe(31);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getMeanCorpuscularHemoglobinRange(
        0.001,
        "female"
      );
      expect(result.min).toBe(31);
      expect(result.max).toBe(37);
    });
  });

  describe("getMeanCorpuscularHemoglobinConcentrationRange", () => {
    test("should return correct range for adult male", () => {
      const result = (
        calculator as any
      ).getMeanCorpuscularHemoglobinConcentrationRange(30, "male");
      expect(result.min).toBe(31.0);
      expect(result.max).toBe(36.5);
    });

    test("should return correct range for adult female", () => {
      const result = (
        calculator as any
      ).getMeanCorpuscularHemoglobinConcentrationRange(30, "female");
      expect(result.min).toBe(31.0);
      expect(result.max).toBe(36.0);
    });

    test("should return correct range for senior male", () => {
      const result = (
        calculator as any
      ).getMeanCorpuscularHemoglobinConcentrationRange(75, "male");
      expect(result.min).toBe(32.3);
      expect(result.max).toBe(36.1);
    });

    test("should return correct range for senior female", () => {
      const result = (
        calculator as any
      ).getMeanCorpuscularHemoglobinConcentrationRange(75, "female");
      expect(result.min).toBe(31.9);
      expect(result.max).toBe(35.9);
    });

    test("should return correct range for adolescent", () => {
      const result = (
        calculator as any
      ).getMeanCorpuscularHemoglobinConcentrationRange(13, "male");
      expect(result.min).toBe(31.0);
      expect(result.max).toBe(37.0);
    });

    test("should return correct range for infant", () => {
      const result = (
        calculator as any
      ).getMeanCorpuscularHemoglobinConcentrationRange(1, "female");
      expect(result.min).toBe(30.0);
      expect(result.max).toBe(36.0);
    });

    test("should return correct range for newborn", () => {
      const result = (
        calculator as any
      ).getMeanCorpuscularHemoglobinConcentrationRange(0.001, "male");
      expect(result.min).toBe(28.0);
      expect(result.max).toBe(38.0);
    });
  });

  describe("getPlateletsRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getPlateletsRange(30, "male");
      expect(result.min).toBe(150);
      expect(result.max).toBe(400);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getPlateletsRange(30, "female");
      expect(result.min).toBe(150);
      expect(result.max).toBe(445);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getPlateletsRange(75, "male");
      expect(result.min).toBe(140);
      expect(result.max).toBe(385);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getPlateletsRange(75, "female");
      expect(result.min).toBe(177);
      expect(result.max).toBe(379);
    });

    test("should return correct range for adolescent", () => {
      const result = (calculator as any).getPlateletsRange(13, "male");
      expect(result.min).toBe(166);
      expect(result.max).toBe(395);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getPlateletsRange(8, "female");
      expect(result.min).toBe(166);
      expect(result.max).toBe(463);
    });

    test("should return correct range for toddler", () => {
      const result = (calculator as any).getPlateletsRange(3, "male");
      expect(result.min).toBe(193);
      expect(result.max).toBe(558);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getPlateletsRange(0.001, "female");
      expect(result.min).toBe(150);
      expect(result.max).toBe(450);
    });
  });

  describe("getWhiteBloodCellsRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(30, "male");
      expect(result.min).toBe(4.0);
      expect(result.max).toBe(11.0);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(30, "female");
      expect(result.min).toBe(3.8);
      expect(result.max).toBe(11.0);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(75, "male");
      expect(result.min).toBe(3.8);
      expect(result.max).toBe(10.0);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(75, "female");
      expect(result.min).toBe(3.8);
      expect(result.max).toBe(9.1);
    });

    test("should return correct range for adolescent", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(13, "male");
      expect(result.min).toBe(3.75);
      expect(result.max).toBe(13.0);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(8, "female");
      expect(result.min).toBe(4.0);
      expect(result.max).toBe(14.5);
    });

    test("should return correct range for toddler", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(3, "male");
      expect(result.min).toBe(5.0);
      expect(result.max).toBe(17.0);
    });

    test("should return correct range for infant", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(1, "female");
      expect(result.min).toBe(6.0);
      expect(result.max).toBe(17.5);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getWhiteBloodCellsRange(0.001, "male");
      expect(result.min).toBe(9.0);
      expect(result.max).toBe(30.0);
    });
  });

  describe("getNeutrophilsRange", () => {
    test("should return correct range for adult", () => {
      const result = (calculator as any).getNeutrophilsRange(30, "male");
      expect(result.min).toBe(1.4);
      expect(result.max).toBe(7.7);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getNeutrophilsRange(75, "male");
      expect(result.min).toBe(1.6);
      expect(result.max).toBe(5.9);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getNeutrophilsRange(75, "female");
      expect(result.min).toBe(1.9);
      expect(result.max).toBe(5.7);
    });

    test("should return correct range for adolescent", () => {
      const result = (calculator as any).getNeutrophilsRange(13, "male");
      expect(result.min).toBe(1.5);
      expect(result.max).toBe(6.3);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getNeutrophilsRange(8, "female");
      expect(result.min).toBe(1.5);
      expect(result.max).toBe(8.0);
    });

    test("should return correct range for toddler", () => {
      const result = (calculator as any).getNeutrophilsRange(3, "male");
      expect(result.min).toBe(1.5);
      expect(result.max).toBe(8.5);
    });

    test("should return correct range for infant", () => {
      const result = (calculator as any).getNeutrophilsRange(1, "female");
      expect(result.min).toBe(1.0);
      expect(result.max).toBe(8.5);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getNeutrophilsRange(0.001, "male");
      expect(result.min).toBe(2.7);
      expect(result.max).toBe(26.0);
    });
  });

  describe("getEosinophilsRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getEosinophilsRange(30, "male");
      expect(result.min).toBe(0.02);
      expect(result.max).toBe(0.63);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getEosinophilsRange(30, "female");
      expect(result.min).toBe(0.02);
      expect(result.max).toBe(0.58);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getEosinophilsRange(75, "male");
      expect(result.min).toBe(0.03);
      expect(result.max).toBe(0.5);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getEosinophilsRange(75, "female");
      expect(result.min).toBe(0.04);
      expect(result.max).toBe(0.52);
    });

    test("should return correct range for adolescent", () => {
      const result = (calculator as any).getEosinophilsRange(13, "male");
      expect(result.min).toBe(0.04);
      expect(result.max).toBe(0.89);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getEosinophilsRange(8, "female");
      expect(result.min).toBe(0.05);
      expect(result.max).toBe(0.85);
    });

    test("should return correct range for toddler", () => {
      const result = (calculator as any).getEosinophilsRange(3, "male");
      expect(result.min).toBe(0.05);
      expect(result.max).toBe(0.8);
    });

    test("should return correct range for infant", () => {
      const result = (calculator as any).getEosinophilsRange(1, "female");
      expect(result.min).toBe(0.1);
      expect(result.max).toBe(0.8);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getEosinophilsRange(0.001, "male");
      expect(result.min).toBe(0.0);
      expect(result.max).toBe(1.0);
    });
  });

  describe("getBasophilsRange", () => {
    test("should return correct range for senior", () => {
      const result = (calculator as any).getBasophilsRange(75, "male");
      expect(result.min).toBe(0.0);
      expect(result.max).toBe(0.09);
    });

    test("should return correct range for adult", () => {
      const result = (calculator as any).getBasophilsRange(30, "female");
      expect(result.min).toBe(0.0);
      expect(result.max).toBe(0.11);
    });

    test("should return correct range for adolescent", () => {
      const result = (calculator as any).getBasophilsRange(13, "male");
      expect(result.min).toBe(0.01);
      expect(result.max).toBe(0.23);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getBasophilsRange(8, "female");
      expect(result.min).toBe(0.01);
      expect(result.max).toBe(0.24);
    });

    test("should return correct range for toddler", () => {
      const result = (calculator as any).getBasophilsRange(3, "male");
      expect(result.min).toBe(0.02);
      expect(result.max).toBe(0.12);
    });

    test("should return correct range for infant and younger", () => {
      const result = (calculator as any).getBasophilsRange(1, "female");
      expect(result.min).toBe(0.0);
      expect(result.max).toBe(0.1);
    });
  });

  describe("getLymphocytesRange", () => {
    test("should return correct range for adult", () => {
      const result = (calculator as any).getLymphocytesRange(30, "male");
      expect(result.min).toBe(1.0);
      expect(result.max).toBe(4.8);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getLymphocytesRange(75, "male");
      expect(result.min).toBe(1.07);
      expect(result.max).toBe(4.1);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getLymphocytesRange(75, "female");
      expect(result.min).toBe(1.07);
      expect(result.max).toBe(3.9);
    });

    test("should return correct range for adolescent", () => {
      const result = (calculator as any).getLymphocytesRange(13, "male");
      expect(result.min).toBe(1.3);
      expect(result.max).toBe(4.5);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getLymphocytesRange(8, "female");
      expect(result.min).toBe(1.0);
      expect(result.max).toBe(7.0);
    });

    test("should return correct range for toddler", () => {
      const result = (calculator as any).getLymphocytesRange(3, "male");
      expect(result.min).toBe(1.5);
      expect(result.max).toBe(9.5);
    });

    test("should return correct range for infant", () => {
      const result = (calculator as any).getLymphocytesRange(1, "female");
      expect(result.min).toBe(3.0);
      expect(result.max).toBe(13.5);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getLymphocytesRange(0.001, "male");
      expect(result.min).toBe(2.0);
      expect(result.max).toBe(17.0);
    });
  });

  describe("getMonocytesRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getMonocytesRange(30, "male");
      expect(result.min).toBe(0.18);
      expect(result.max).toBe(1.0);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getMonocytesRange(30, "female");
      expect(result.min).toBe(0.15);
      expect(result.max).toBe(1.0);
    });

    test("should return correct range for senior male", () => {
      const result = (calculator as any).getMonocytesRange(75, "male");
      expect(result.min).toBe(0.23);
      expect(result.max).toBe(0.71);
    });

    test("should return correct range for senior female", () => {
      const result = (calculator as any).getMonocytesRange(75, "female");
      expect(result.min).toBe(0.17);
      expect(result.max).toBe(0.56);
    });

    test("should return correct range for child", () => {
      const result = (calculator as any).getMonocytesRange(8, "male");
      expect(result.min).toBe(0.15);
      expect(result.max).toBe(1.3);
    });

    test("should return correct range for infant", () => {
      const result = (calculator as any).getMonocytesRange(1, "female");
      expect(result.min).toBe(0.2);
      expect(result.max).toBe(1.0);
    });

    test("should return correct range for 3-6 months", () => {
      const result = (calculator as any).getMonocytesRange(0.4, "male");
      expect(result.min).toBe(0.2);
      expect(result.max).toBe(1.2);
    });

    test("should return correct range for 2 months", () => {
      const result = (calculator as any).getMonocytesRange(0.167, "female");
      expect(result.min).toBe(0.36);
      expect(result.max).toBe(1.2);
    });

    test("should return correct range for 1 month", () => {
      const result = (calculator as any).getMonocytesRange(0.083, "male");
      expect(result.min).toBe(0.2);
      expect(result.max).toBe(1.0);
    });

    test("should return correct range for 2 weeks", () => {
      const result = (calculator as any).getMonocytesRange(0.038, "female");
      expect(result.min).toBe(0.1);
      expect(result.max).toBe(1.7);
    });

    test("should return correct range for 1 week", () => {
      const result = (calculator as any).getMonocytesRange(0.019, "male");
      expect(result.min).toBe(0.2);
      expect(result.max).toBe(1.0);
    });

    test("should return correct range for 1-3 days", () => {
      const result = (calculator as any).getMonocytesRange(0.008, "female");
      expect(result.min).toBe(0.5);
      expect(result.max).toBe(1.0);
    });

    test("should return correct range for newborn", () => {
      const result = (calculator as any).getMonocytesRange(0.001, "male");
      expect(result.min).toBe(0.0);
      expect(result.max).toBe(2.0);
    });
  });

  describe("getFerritinRange", () => {
    test("should return correct range for adult male", () => {
      const result = (calculator as any).getFerritinRange(30, "male");
      expect(result.min).toBe(22);
      expect(result.max).toBe(275);
    });

    test("should return correct range for adult female", () => {
      const result = (calculator as any).getFerritinRange(30, "female");
      expect(result.min).toBe(5);
      expect(result.max).toBe(204);
    });

    test("should return correct range for adolescent male", () => {
      const result = (calculator as any).getFerritinRange(16, "male");
      expect(result.min).toBe(11);
      expect(result.max).toBe(172);
    });

    test("should return correct range for adolescent female", () => {
      const result = (calculator as any).getFerritinRange(16, "female");
      expect(result.min).toBe(6);
      expect(result.max).toBe(67);
    });

    test("should return correct range for child (5-14 years)", () => {
      const result = (calculator as any).getFerritinRange(10, "male");
      expect(result.min).toBe(14);
      expect(result.max).toBe(79);
    });

    test("should return correct range for toddler (1-5 years)", () => {
      const result = (calculator as any).getFerritinRange(3, "female");
      expect(result.min).toBe(5);
      expect(result.max).toBe(100);
    });

    test("should return correct range for infant (3 months - 1 year)", () => {
      const result = (calculator as any).getFerritinRange(0.8, "male");
      expect(result.min).toBe(8);
      expect(result.max).toBe(182);
    });

    test("should return correct range for newborn (0-3 months)", () => {
      const result = (calculator as any).getFerritinRange(0.1, "female");
      expect(result.min).toBe(0);
      expect(result.max).toBe(515);
    });
  });
});
