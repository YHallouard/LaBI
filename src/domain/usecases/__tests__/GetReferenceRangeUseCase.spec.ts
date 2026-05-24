import { ReferenceRangeCalculator } from "../../../domain/services/ReferenceRangeCalculator";
import { UserProfile } from "../../../domain/UserProfile";
import { GetReferenceRangeUseCase } from "../GetReferenceRangeUseCase";
import { BiologicalAnalysis } from "../../../domain/entities/BiologicalAnalysis";
import { InMemoryUserProfileRepository } from "../../../adapters/repositories/InMemoryUserProfileRepository";

describe("GetReferenceRangeUseCase", () => {
  const givenReferenceRangeCalculator = new ReferenceRangeCalculator();
  let usecase: GetReferenceRangeUseCase;
  const userProfile: UserProfile = {
    id: "1",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    birthDate: new Date("1980-01-01"),
    gender: "male",
  };

  const mockAnalysis: BiologicalAnalysis = {
    id: "analysis-1",
    date: new Date("2022-01-01"),
    pdfSource: "test.pdf",
  };

  beforeEach(async () => {
    usecase = new GetReferenceRangeUseCase(
      givenReferenceRangeCalculator,
      new InMemoryUserProfileRepository(userProfile)
    );
    await usecase.initialize();
  });

  describe("initialize", () => {
    it("should properly initialize and load user profile", async () => {
      const testService = new GetReferenceRangeUseCase(
        givenReferenceRangeCalculator,
        new InMemoryUserProfileRepository(userProfile)
      );

      await testService.initialize();

      const testDate = new Date("2022-01-01");
      const range = testService.execute("Hématies", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });

    it("should handle repository errors during initialization", async () => {
      const errorUsecase = new GetReferenceRangeUseCase(
        givenReferenceRangeCalculator,
        new InMemoryUserProfileRepository(null, true)
      );

      await errorUsecase.initialize();

      const testDate = new Date("2022-01-01");
      const range = errorUsecase.execute("Hématies", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });

    it("should use default ranges when user profile is null", async () => {
      const nullProfileService = createServiceWithNullProfile();
      await nullProfileService.initialize();

      const testDate = new Date("2022-01-01");
      const range = nullProfileService.execute("Hématies", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });
  });

  describe("execute", () => {
    it("should calculate reference range based on user profile", () => {
      const testDate = new Date("2022-01-01");
      const range = usecase.execute("Hématies", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });

    it("should handle different lab keys", () => {
      const testDate = new Date("2022-01-01");
      const labKeys = ["Hématies", "Hémoglobine", "Leucocytes", "Plaquettes"];

      labKeys.forEach((labKey) => {
        const range = usecase.execute(labKey, testDate);
        expect(range).toBeDefined();
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThan(range.min);
      });
    });

    it("should handle different dates", () => {
      const labKey = "Hématies";
      const dates = [
        new Date("2020-01-01"),
        new Date("2022-06-15"),
        new Date("2025-12-31"),
      ];

      dates.forEach((date) => {
        const range = usecase.execute(labKey, date);
        expect(range).toBeDefined();
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThan(range.min);
      });
    });

    it("should work with null user profile", async () => {
      const nullProfileService = createServiceWithNullProfile();
      await nullProfileService.initialize();

      const testDate = new Date("2022-01-01");
      const range = nullProfileService.execute("Hématies", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });
  });

  describe("getForAnalysis", () => {
    it("should return reference range for analysis", () => {
      const range = usecase.getForAnalysis(mockAnalysis, "Hématies");

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });

    it("should use analysis date for calculation", () => {
      const analysisWithDifferentDate: BiologicalAnalysis = {
        ...mockAnalysis,
        date: new Date("2023-06-15"),
      };

      const range = usecase.getForAnalysis(
        analysisWithDifferentDate,
        "Hématies"
      );

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });

    it("should work with different lab keys", () => {
      const labKeys = ["Hémoglobine", "Leucocytes", "Plaquettes"];

      labKeys.forEach((labKey) => {
        const range = usecase.getForAnalysis(mockAnalysis, labKey);
        expect(range).toBeDefined();
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThan(range.min);
      });
    });

    it("should work with null user profile", async () => {
      const nullProfileService = createServiceWithNullProfile();
      await nullProfileService.initialize();

      const range = nullProfileService.getForAnalysis(mockAnalysis, "Hématies");

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });
  });

  describe("generateChartRangesByDates", () => {
    it("should generate reference ranges for multiple dates", () => {
      const labKey = "Hématies";
      const dates = [
        new Date("2022-01-01"),
        new Date("2022-06-15"),
        new Date("2022-12-31"),
      ];

      const ranges = usecase.generateChartRangesByDates(labKey, dates);

      expect(ranges).toHaveLength(3);
      ranges.forEach((range) => {
        expect(range).toBeDefined();
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThan(range.min);
      });
    });

    it("should handle empty dates array", () => {
      const labKey = "Hématies";
      const dates: Date[] = [];

      const ranges = usecase.generateChartRangesByDates(labKey, dates);

      expect(ranges).toHaveLength(0);
      expect(Array.isArray(ranges)).toBe(true);
    });

    it("should handle single date", () => {
      const labKey = "Hématies";
      const dates = [new Date("2022-01-01")];

      const ranges = usecase.generateChartRangesByDates(labKey, dates);

      expect(ranges).toHaveLength(1);
      expect(ranges[0]).toBeDefined();
      expect(ranges[0].min).toBeGreaterThan(0);
      expect(ranges[0].max).toBeGreaterThan(ranges[0].min);
    });

    it("should work with different lab keys", () => {
      const dates = [new Date("2022-01-01"), new Date("2022-06-15")];
      const labKeys = ["Hémoglobine", "Leucocytes", "Plaquettes"];

      labKeys.forEach((labKey) => {
        const ranges = usecase.generateChartRangesByDates(labKey, dates);
        expect(ranges).toHaveLength(2);
        ranges.forEach((range) => {
          expect(range).toBeDefined();
          expect(range.min).toBeGreaterThan(0);
          expect(range.max).toBeGreaterThan(range.min);
        });
      });
    });

    it("should work with null user profile", async () => {
      const nullProfileService = createServiceWithNullProfile();
      await nullProfileService.initialize();

      const labKey = "Hématies";
      const dates = [new Date("2022-01-01"), new Date("2022-06-15")];

      const ranges = nullProfileService.generateChartRangesByDates(
        labKey,
        dates
      );

      expect(ranges).toHaveLength(2);
      ranges.forEach((range) => {
        expect(range).toBeDefined();
        expect(range.min).toBeGreaterThan(0);
        expect(range.max).toBeGreaterThan(range.min);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle very old birth dates", async () => {
      const oldUserProfile: UserProfile = {
        ...userProfile,
        birthDate: new Date("1900-01-01"),
      };

      const oldUserService = new GetReferenceRangeUseCase(
        givenReferenceRangeCalculator,
        new InMemoryUserProfileRepository(oldUserProfile)
      );
      await oldUserService.initialize();

      const testDate = new Date("2022-01-01");
      const range = oldUserService.execute("Hématies", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });

    it("should handle future birth dates", async () => {
      const futureUserProfile: UserProfile = {
        ...userProfile,
        birthDate: new Date("2030-01-01"),
      };

      const futureUserService = new GetReferenceRangeUseCase(
        givenReferenceRangeCalculator,
        new InMemoryUserProfileRepository(futureUserProfile)
      );
      await futureUserService.initialize();

      const testDate = new Date("2022-01-01");
      const range = futureUserService.execute("Hématies", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });

    it("should handle female user profiles", async () => {
      const femaleUserProfile: UserProfile = {
        ...userProfile,
        gender: "female",
      };

      const femaleUserService = new GetReferenceRangeUseCase(
        givenReferenceRangeCalculator,
        new InMemoryUserProfileRepository(femaleUserProfile)
      );
      await femaleUserService.initialize();

      const testDate = new Date("2022-01-01");
      const range = femaleUserService.execute("Hémoglobine", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBeGreaterThan(0);
      expect(range.max).toBeGreaterThan(range.min);
    });

    it("should handle unknown lab keys", () => {
      const testDate = new Date("2022-01-01");
      const range = usecase.execute("UnknownLabKey", testDate);

      expect(range).toBeDefined();
      expect(range.min).toBe(0);
      expect(range.max).toBe(0);
    });
  });

  function createServiceWithNullProfile(): GetReferenceRangeUseCase {
    return new GetReferenceRangeUseCase(
      givenReferenceRangeCalculator,
      new InMemoryUserProfileRepository(null)
    );
  }
});
