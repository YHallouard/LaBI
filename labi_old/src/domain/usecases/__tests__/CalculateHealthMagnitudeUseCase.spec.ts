import { CalculateHealthMagnitudeUseCase } from "../CalculateHealthMagnitudeUseCase";
import { GetAnalysesUseCase } from "../GetAnalysesUseCase";
import { InMemoryBiologicalAnalysisRepository } from "../../../adapters/repositories/InMemoryBiologicalAnalysisRepository";
import {
  BiologicalAnalysis,
  LabValue,
} from "../../../domain/entities/BiologicalAnalysis";
import { GetReferenceRangeUseCase } from "../GetReferenceRangeUseCase";
import { ReferenceRangeCalculator } from "../../../domain/services/ReferenceRangeCalculator";
import { UserProfileRepository } from "../../../ports/repositories/UserProfileRepository";

// Mock the config
jest.mock("../../../config/LabConfig", () => ({
  LAB_VALUE_KEYS: ["Hémoglobine", "Leucocytes"],
}));

describe("CalculateHealthMagnitudeUseCase", () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let getAnalysesUseCase: GetAnalysesUseCase;
  let getReferenceRangeUseCase: GetReferenceRangeUseCase;
  let useCase: CalculateHealthMagnitudeUseCase;

  beforeEach(() => {
    repository = new InMemoryBiologicalAnalysisRepository();
    getAnalysesUseCase = new GetAnalysesUseCase(repository);

    const mockUserProfileRepository: jest.Mocked<UserProfileRepository> = {
      retrieve: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      reset: jest.fn(),
    };

    const referenceRangeCalculator = new ReferenceRangeCalculator();
    getReferenceRangeUseCase = new GetReferenceRangeUseCase(
      referenceRangeCalculator,
      mockUserProfileRepository
    );

    jest
      .spyOn(getReferenceRangeUseCase, "execute")
      .mockImplementation((labKey: string) => {
        if (labKey === "Hémoglobine") {
          return { min: 13.0, max: 18.0 };
        }
        if (labKey === "Leucocytes") {
          return { min: 4.0, max: 11.0 };
        }
        return { min: 0, max: 1 };
      });

    useCase = new CalculateHealthMagnitudeUseCase(
      getAnalysesUseCase,
      getReferenceRangeUseCase
    );
  });

  it("should return an empty array when there are no analyses", async () => {
    // Given
    repository.setAnalyses([]);

    // When
    const result = await useCase.execute();

    // Then
    expect(result).toEqual([]);
  });

  it("should calculate magnitude for a single analysis with complete data", async () => {
    // Given
    const analysis: BiologicalAnalysis = {
      id: "1",
      date: new Date("2023-01-01T12:00:00.000Z"),
      Hémoglobine: { value: 15, unit: "g/dL" } as LabValue,
      Leucocytes: { value: 6, unit: "giga/L" } as LabValue,
    };
    repository.setAnalyses([analysis]);

    // When
    const result = await useCase.execute();

    // Then
    expect(result.length).toBe(1);
    expect(result[0].date).toEqual(analysis.date);

    const normHg = (15 - 13.0) / (18.0 - 13.0) - 0.5; // (15 - 13) / 5 - 0.5 = 2/5 - 0.5 = 0.4 - 0.5 = -0.1
    const normLeuco = (6 - 4.0) / (11.0 - 4.0) - 0.5; // (6 - 4) / 7 - 0.5 = 2/7 - 0.5 approx 0.2857 - 0.5 = -0.2143

    const values = [normHg, normLeuco];
    const attentionMask = values.map((v) => (Math.abs(v) > 0.5 ? 1 : 0)); // [0, 0]
    const squaredValuesWithAttention = values.map(
      (v, idx) => v * v + attentionMask[idx]
    );
    const meanOfSquares =
      squaredValuesWithAttention.reduce((a, b) => a + b, 0) /
      squaredValuesWithAttention.length;
    const expectedMagnitude = Math.sqrt(meanOfSquares);

    expect(result[0].magnitude).toBeCloseTo(expectedMagnitude);
  });

  it("should correctly fill missing data and calculate magnitude", async () => {
    // Given
    const analyses: BiologicalAnalysis[] = [
      {
        id: "1",
        date: new Date("2023-01-01"),
        Hémoglobine: { value: 14, unit: "g/dL" },
        Leucocytes: { value: null, unit: "giga/L" },
      },
      {
        id: "2",
        date: new Date("2023-02-01"),
        Hémoglobine: { value: 15, unit: "g/dL" },
        Leucocytes: { value: 7, unit: "giga/L" },
      },
      {
        id: "3",
        date: new Date("2023-03-01"),
        Hémoglobine: { value: null, unit: "g/dL" },
        Leucocytes: { value: 8, unit: "giga/L" },
      },
    ];
    repository.setAnalyses(analyses);

    // When
    const result = await useCase.execute();

    // Then
    expect(result.length).toBe(3);

    // Expected normalized values (without filling)
    const normHg1 = (14 - 13) / (18 - 13) - 0.5; // 0.2 - 0.5 = -0.3
    const normHg2 = (15 - 13) / (18 - 13) - 0.5; // 0.4 - 0.5 = -0.1
    const normLeuco2 = (7 - 4) / (11 - 4) - 0.5; // 3/7 - 0.5 approx -0.0714
    const normLeuco3 = (8 - 4) / (11 - 4) - 0.5; // 4/7 - 0.5 approx 0.0714

    // After filling
    const filledNormHg = [normHg1, normHg2, normHg2]; // last one is ffilled
    const filledNormLeuco = [normLeuco2, normLeuco2, normLeuco3]; // first one is bfilled

    // Expected magnitudes
    // Note: attention mask is 0 for all these values as they are all < 0.5 in absolute value.
    const expectedMagnitude1 = Math.sqrt(
      (filledNormHg[0] ** 2 + filledNormLeuco[0] ** 2) / 2
    );
    const expectedMagnitude2 = Math.sqrt(
      (filledNormHg[1] ** 2 + filledNormLeuco[1] ** 2) / 2
    );
    const expectedMagnitude3 = Math.sqrt(
      (filledNormHg[2] ** 2 + filledNormLeuco[2] ** 2) / 2
    );

    expect(result[0].magnitude).toBeCloseTo(expectedMagnitude1);
    expect(result[1].magnitude).toBeCloseTo(expectedMagnitude2);
    expect(result[2].magnitude).toBeCloseTo(expectedMagnitude3);
  });
});
