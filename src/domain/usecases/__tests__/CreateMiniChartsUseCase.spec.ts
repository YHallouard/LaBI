import { CreateMiniChartsUseCase } from "../CreateMiniChartsUseCase";
import { DataPoint, ChartDimensions } from "../CreateLinePathUseCase";
import { GetReferenceRangeUseCase } from "../GetReferenceRangeUseCase";
import { ReferenceRangeCalculator } from "../../../domain/services/ReferenceRangeCalculator";
import { UserProfileRepository } from "../../../ports/repositories/UserProfileRepository";

// Mock dependencies
class MockReferenceRangeCalculator extends ReferenceRangeCalculator {
  calculateReferenceRange(): { min: number; max: number } {
    return { min: 5, max: 15 };
  }
}

class MockUserProfileRepository implements UserProfileRepository {
  async retrieve(): Promise<any> {
    return null;
  }
  async save(): Promise<any> {
    return null;
  }
  async update(): Promise<void> {}
  async reset(): Promise<void> {}
}

// Mock the GetReferenceRangeUseCase
class MockGetReferenceRangeUseCase extends GetReferenceRangeUseCase {
  constructor() {
    super(new MockReferenceRangeCalculator(), new MockUserProfileRepository());
  }

  execute(labKey: string, date: Date): { min: number; max: number } {
    return { min: 5, max: 15 };
  }

  async initialize(): Promise<void> {
    // Mock implementation
  }
}

describe("CreateMiniChartsUseCase", () => {
  let useCase: CreateMiniChartsUseCase;
  let mockGetReferenceRangeUseCase: MockGetReferenceRangeUseCase;

  beforeEach(() => {
    useCase = new CreateMiniChartsUseCase();
    mockGetReferenceRangeUseCase = new MockGetReferenceRangeUseCase();
  });

  const mockChartDimensions: ChartDimensions = {
    width: 120,
    height: 60,
    paddingTop: 5,
    paddingRight: 2,
    paddingBottom: 5,
    paddingLeft: 2,
  };

  test("Given no data When executing the use case Then it should return null", () => {
    // Given
    const emptyData: DataPoint[] = [];

    // When
    const result = useCase.execute(
      emptyData,
      "Hémoglobine",
      mockChartDimensions,
      mockGetReferenceRangeUseCase
    );

    // Then
    expect(result).toBeNull();
  });

  test("Given valid data When executing the use case Then it should return chart data with line path and reference areas", () => {
    // Given
    const validData: DataPoint[] = [
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 12 },
      { timestamp: 3000, value: 8 },
    ];

    // When
    const result = useCase.execute(
      validData,
      "Hémoglobine",
      mockChartDimensions,
      mockGetReferenceRangeUseCase
    );

    // Then
    expect(result).not.toBeNull();
    expect(result!.linePath).toMatch(/^M \d+(\.\d+)?,\d+(\.\d+)?/);
    expect(result!.referenceAreaPaths).toHaveLength(1);
    expect(result!.referenceAreaPaths[0]).toContain("M ");
    expect(result!.referenceAreaPaths[0]).toContain("Z");
  });

  test("Given single data point When executing the use case Then it should return chart data", () => {
    // Given
    const singlePoint: DataPoint[] = [{ timestamp: 1000, value: 10 }];

    // When
    const result = useCase.execute(
      singlePoint,
      "Hémoglobine",
      mockChartDimensions,
      mockGetReferenceRangeUseCase
    );

    // Then
    expect(result).not.toBeNull();
    expect(result!.linePath).toBe(""); // Line path should be empty for single point
    expect(result!.referenceAreaPaths).toHaveLength(1);
  });

  test("Given data with null values When executing the use case Then it should handle nulls correctly", () => {
    // Given
    const dataWithNulls: DataPoint[] = [
      { timestamp: 1000, value: null },
      { timestamp: 2000, value: 12 },
      { timestamp: 3000, value: null },
    ];

    // When
    const result = useCase.execute(
      dataWithNulls,
      "Hémoglobine",
      mockChartDimensions,
      mockGetReferenceRangeUseCase
    );

    // Then
    expect(result).not.toBeNull();
    expect(result!.linePath).toMatch(/^M \d+(\.\d+)?,\d+(\.\d+)?/);
    expect(result!.referenceAreaPaths).toHaveLength(1);
  });

  test("Given multiple data points spanning time When executing the use case Then it should create appropriate reference ranges", () => {
    // Given
    const longTimeSpanData: DataPoint[] = [
      { timestamp: new Date("2020-01-01").getTime(), value: 10 },
      { timestamp: new Date("2021-01-01").getTime(), value: 12 },
      { timestamp: new Date("2022-01-01").getTime(), value: 8 },
      { timestamp: new Date("2023-01-01").getTime(), value: 11 },
    ];

    // When
    const result = useCase.execute(
      longTimeSpanData,
      "Hémoglobine",
      mockChartDimensions,
      mockGetReferenceRangeUseCase
    );

    // Then
    expect(result).not.toBeNull();
    expect(result!.linePath).toMatch(/^M \d+(\.\d+)?,\d+(\.\d+)?/);
    expect(result!.referenceAreaPaths).toHaveLength(1);
    expect(result!.referenceAreaPaths[0]).toContain("Z"); // Should be closed path
  });
});
