import { SQLiteBiologicalAnalysisRepository } from '../SQLiteBiologicalAnalysisRepository';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import * as SQLite from 'expo-sqlite';

// Mock the DatabaseInitializer module
jest.mock('../../../infrastructure/database/DatabaseInitializer', () => {
  // Create a mock database
  const mockDb = {
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([{
      id: 'test-id',
      date: '2023-06-15T10:00:00.000Z',
      pdf_source: 'file://test.pdf',
      lab_values: '{"some_lab_value":{"value":5.2,"unit":"mg/L"}}'
    }]),
    getFirstAsync: jest.fn().mockResolvedValue({
      id: 'test-id',
      date: '2023-06-15T10:00:00.000Z',
      pdf_source: 'file://test.pdf',
      lab_values: '{"some_lab_value":{"value":5.2,"unit":"mg/L"}}'
    })
  };

  return {
    getDatabase: jest.fn().mockReturnValue(mockDb),
    initializeDatabase: jest.fn().mockResolvedValue(undefined)
  };
});

// Mock SQLite database
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn()
  }))
}));

describe('SQLiteBiologicalAnalysisRepository', () => {
  let repository: SQLiteBiologicalAnalysisRepository;
  let sampleAnalysis: BiologicalAnalysis;

  beforeEach(() => {
    repository = new SQLiteBiologicalAnalysisRepository();
    sampleAnalysis = {
      id: 'test-id',
      date: new Date('2023-06-15T10:00:00.000Z'),
      pdfSource: 'file://test.pdf'
    };
  });

  test('should save analysis without throwing', async () => {
    await expect(repository.save(sampleAnalysis)).resolves.not.toThrow();
  });

  test('should get all analyses', async () => {
    const analyses = await repository.getAll();
    expect(analyses.length).toBe(1);
    expect(analyses[0].id).toBe('test-id');
  });

  test('should get analysis by ID', async () => {
    const analysis = await repository.getById('test-id');
    expect(analysis).not.toBeNull();
    if (analysis) {
      expect(analysis.id).toBe('test-id');
    }
  });

  test('should delete analysis without throwing', async () => {
    await expect(repository.deleteById('test-id')).resolves.not.toThrow();
  });
}); 