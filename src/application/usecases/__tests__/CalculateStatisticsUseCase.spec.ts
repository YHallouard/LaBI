import { CalculateStatisticsUseCase } from '../CalculateStatisticsUseCase';
import { DataPoint } from '../GetAnalysesUseCase';

describe('CalculateStatisticsUseCase', () => {
  let useCase: CalculateStatisticsUseCase;

  beforeEach(() => {
    useCase = new CalculateStatisticsUseCase();
  });

  test('Given an empty data array When executing the use case Then it should return zeros for all statistics', () => {
    // Given
    const emptyData: DataPoint[] = [];
    const refRange = { min: 1, max: 5 };
    
    // When
    const result = useCase.execute(emptyData, refRange);
    
    // Then
    expect(result.latestValue).toBe(0);
    expect(result.averageValue).toBe(0);
    expect(result.maxPointValue).toBe(0);
  });

  test('Given a data array with multiple points When executing the use case Then it should calculate correct statistics', () => {
    // Given
    const data: DataPoint[] = [
      { date: new Date('2023-01-01'), value: 2.5, timestamp: 1672531200000 },
      { date: new Date('2023-02-01'), value: 3.5, timestamp: 1675209600000 },
      { date: new Date('2023-03-01'), value: 4.5, timestamp: 1677628800000 }
    ];
    const refRange = { min: 2, max: 4 };
    
    // When
    const result = useCase.execute(data, refRange);
    
    // Then
    expect(result.latestValue).toBe(4.5); // Last value
    expect(result.averageValue).toBe(3.5); // (2.5 + 3.5 + 4.5) / 3
    expect(result.maxPointValue).toBe(4.5); // Highest value
  });

  test('Given a data array with null values When executing the use case Then it should handle nulls by using 0', () => {
    // Given
    const data: DataPoint[] = [
      { date: new Date('2023-01-01'), value: null, timestamp: 1672531200000 },
      { date: new Date('2023-02-01'), value: 3.5, timestamp: 1675209600000 },
      { date: new Date('2023-03-01'), value: null, timestamp: 1677628800000 }
    ];
    const refRange = { min: 2, max: 4 };
    
    // When
    const result = useCase.execute(data, refRange);
    
    // Then
    expect(result.latestValue).toBe(0); // Last value is null, so 0
    expect(result.averageValue).toBe(3.5 / 3); // (0 + 3.5 + 0) / 3
    expect(result.maxPointValue).toBe(3.5); // Highest value
  });
}); 