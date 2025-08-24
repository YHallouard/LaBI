import {
  CreateCardinalSplineUseCase,
  Point,
} from "../CreateCardinalSplineUseCase";

describe("CreateCardinalSplineUseCase", () => {
  let useCase: CreateCardinalSplineUseCase;

  beforeEach(() => {
    useCase = new CreateCardinalSplineUseCase();
  });

  test("Given an empty points array When executing the use case Then it should return an empty string", () => {
    // Given
    const emptyPoints: Point[] = [];

    // When
    const result = useCase.execute(emptyPoints);

    // Then
    expect(result).toBe("");
  });

  test("Given a single point When executing the use case Then it should return an empty string", () => {
    // Given
    const singlePoint: Point[] = [{ x: 10, y: 20 }];

    // When
    const result = useCase.execute(singlePoint);

    // Then
    expect(result).toBe("");
  });

  test("Given two points When executing the use case Then it should return a cubic bezier curve path", () => {
    // Given
    const twoPoints: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];

    // When
    const result = useCase.execute(twoPoints, 0.2);

    // Then
    expect(result).toMatch(/^M 0,0 C .+ 100,100$/);
    expect(result).toContain("M 0,0");
    expect(result).toContain("100,100");
  });

  test("Given three points When executing the use case Then it should create smooth curves between all points", () => {
    // Given
    const threePoints: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
    ];

    // When
    const result = useCase.execute(threePoints, 0.2);

    // Then
    expect(result).toMatch(/^M 0,0 C .+ 50,100 C .+ 100,0$/);
    expect(result.split("C")).toHaveLength(3); // M + 2 C commands for 3 points
  });

  test("Given different tension values When executing the use case Then it should produce different curves", () => {
    // Given
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
    ];

    // When
    const resultLowTension = useCase.execute(points, 0.1);
    const resultHighTension = useCase.execute(points, 0.5);

    // Then
    expect(resultLowTension).not.toBe(resultHighTension);
    expect(resultLowTension).toMatch(/^M 0,0 C/);
    expect(resultHighTension).toMatch(/^M 0,0 C/);
  });

  test("Given default tension When executing the use case Then it should use 0.2 as default tension", () => {
    // Given
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];

    // When
    const resultWithDefaultTension = useCase.execute(points);
    const resultWithExplicitTension = useCase.execute(points, 0.2);

    // Then
    expect(resultWithDefaultTension).toBe(resultWithExplicitTension);
  });

  test("Given four points When executing the use case Then it should handle first and last segments correctly", () => {
    // Given
    const fourPoints: Point[] = [
      { x: 0, y: 0 },
      { x: 33, y: 50 },
      { x: 66, y: 100 },
      { x: 100, y: 0 },
    ];

    // When
    const result = useCase.execute(fourPoints, 0.2);

    // Then
    expect(result).toMatch(/^M 0,0/); // Starts with move command
    expect(result.split("C")).toHaveLength(4); // M + 3 C commands for 4 points
    expect(result).toContain("100,0"); // Ends at last point
  });
});
