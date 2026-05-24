import {
  CreateLinePathUseCase,
  DataPoint,
  ChartDimensions,
} from "../CreateLinePathUseCase";

describe("CreateLinePathUseCase", () => {
  let useCase: CreateLinePathUseCase;

  beforeEach(() => {
    useCase = new CreateLinePathUseCase();
  });

  const mockChartDimensions: ChartDimensions = {
    width: 200,
    height: 100,
    paddingTop: 10,
    paddingRight: 10,
    paddingBottom: 10,
    paddingLeft: 10,
  };

  test("Given no data points When executing the use case Then it should return an empty string", () => {
    // Given
    const emptyData: DataPoint[] = [];

    // When
    const result = useCase.execute(
      emptyData,
      0,
      100,
      0,
      10,
      mockChartDimensions
    );

    // Then
    expect(result).toBe("");
  });

  test("Given a single data point When executing the use case Then it should return an empty string", () => {
    // Given
    const singlePoint: DataPoint[] = [{ timestamp: 1000, value: 5 }];

    // When
    const result = useCase.execute(
      singlePoint,
      0,
      100,
      0,
      10,
      mockChartDimensions
    );

    // Then
    expect(result).toBe("");
  });

  test("Given two data points When executing the use case Then it should return a valid SVG path", () => {
    // Given
    const twoPoints: DataPoint[] = [
      { timestamp: 0, value: 0 },
      { timestamp: 100, value: 10 },
    ];

    // When
    const result = useCase.execute(
      twoPoints,
      0,
      100,
      0,
      10,
      mockChartDimensions
    );

    // Then
    expect(result).toMatch(/^M \d+(\.\d+)?,\d+(\.\d+)? C/);
    expect(result).toContain("M ");
    expect(result).toContain("C ");
  });

  test("Given multiple data points When executing the use case Then it should create a smooth curve", () => {
    // Given
    const multiplePoints: DataPoint[] = [
      { timestamp: 0, value: 0 },
      { timestamp: 50, value: 5 },
      { timestamp: 100, value: 10 },
    ];

    // When
    const result = useCase.execute(
      multiplePoints,
      0,
      100,
      0,
      10,
      mockChartDimensions
    );

    // Then
    expect(result).toMatch(/^M \d+(\.\d+)?,\d+(\.\d+)? C/);
    expect(result.split("C")).toHaveLength(3); // M + 2 C commands for 3 points
  });

  test("Given data points with null values When executing the use case Then it should treat null as 0", () => {
    // Given
    const dataWithNulls: DataPoint[] = [
      { timestamp: 0, value: null },
      { timestamp: 100, value: 10 },
    ];

    // When
    const result = useCase.execute(
      dataWithNulls,
      0,
      100,
      0,
      10,
      mockChartDimensions
    );

    // Then
    expect(result).toMatch(/^M \d+(\.\d+)?,\d+(\.\d+)? C/);
    expect(result).not.toBe("");
  });

  test("Given different tension values When executing the use case Then it should produce different curves", () => {
    // Given
    const dataPoints: DataPoint[] = [
      { timestamp: 0, value: 0 },
      { timestamp: 50, value: 5 },
      { timestamp: 100, value: 10 },
    ];

    // When
    const resultLowTension = useCase.execute(
      dataPoints,
      0,
      100,
      0,
      10,
      mockChartDimensions,
      0.1
    );
    const resultHighTension = useCase.execute(
      dataPoints,
      0,
      100,
      0,
      10,
      mockChartDimensions,
      0.5
    );

    // Then
    expect(resultLowTension).not.toBe(resultHighTension);
    expect(resultLowTension).toMatch(/^M/);
    expect(resultHighTension).toMatch(/^M/);
  });
});
