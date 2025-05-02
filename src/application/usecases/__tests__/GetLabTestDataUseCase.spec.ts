import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import { GetLabTestDataUseCase, DataPoint } from '../GetAnalysesUseCase';

describe('GetLabTestDataUseCase', () => {
  let useCase: GetLabTestDataUseCase;
  let mockAnalyses: BiologicalAnalysis[];

  beforeEach(() => {
    useCase = new GetLabTestDataUseCase();
    
    // Set up mock analyses with various value types
    mockAnalyses = [
      // Analysis with normal values
      {
        id: '1',
        date: new Date('2023-01-01'),
        "Hemoglobine": { value: 14.5, unit: 'g/dL' },
        "Leucocytes": { value: 7.8, unit: 'giga/L' }
      },
      // Analysis with a zero value
      {
        id: '2',
        date: new Date('2023-01-15'),
        "Hemoglobine": { value: 0, unit: 'g/dL' },
        "Leucocytes": { value: 8.2, unit: 'giga/L' }
      },
      // Analysis with a null value
      {
        id: '3',
        date: new Date('2023-02-01'),
        "Hemoglobine": null,
        "Leucocytes": { value: 6.5, unit: 'giga/L' }
      },
      // Analysis with a NaN value
      {
        id: '4',
        date: new Date('2023-02-15'),
        "Hemoglobine": { value: NaN, unit: 'g/dL' },
        "Leucocytes": { value: 9.1, unit: 'giga/L' }
      },
      // Analysis with a missing key
      {
        id: '5',
        date: new Date('2023-03-01'),
        "Leucocytes": { value: 7.2, unit: 'giga/L' }
      }
    ] as unknown as BiologicalAnalysis[];
  });

  test('Given a set of analyses When executed with a valid lab key Then it returns valid data points', () => {
    // Given
    const labKey = "Hemoglobine";
    
    // When
    const result = useCase.execute(mockAnalyses, labKey);
    
    // Then
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(14.5);
    expect(result[0].date).toEqual(new Date('2023-01-01'));
  });

  test('Given a set of analyses When executed with a different lab key Then it returns data points for that key', () => {
    // Given
    const labKey = "Leucocytes";
    
    // When
    const result = useCase.execute(mockAnalyses, labKey);
    
    // Then
    expect(result).toHaveLength(5);
    expect(result.map(point => point.value)).toEqual([7.8, 8.2, 6.5, 9.1, 7.2]);
  });

  test('Given a set of analyses When executed with a non-existent lab key Then it returns an empty array', () => {
    // Given
    const labKey = "NonExistentKey";
    
    // When
    const result = useCase.execute(mockAnalyses, labKey);
    
    // Then
    expect(result).toHaveLength(0);
  });

  test('Given a set of analyses When executed Then it filters out null, NaN, and zero values', () => {
    // Given
    const labKey = "Hemoglobine";
    
    // When
    const result = useCase.execute(mockAnalyses, labKey);
    
    // Then
    expect(result).toHaveLength(1);
    // Should only include the first analysis with valid value 14.5
    // Analyses with value 0, null, NaN, or missing key should be filtered out
    expect(result[0].value).toBe(14.5);
  });
}); 