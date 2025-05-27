import { SQLiteBiologicalAnalysisRepository } from '../SQLiteBiologicalAnalysisRepository';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import { DatabaseStoragePort } from '../../../ports/infrastructure/DatabaseStoragePort';

// Mock database implementation
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

// Mock database storage port
const mockDatabaseStorage: DatabaseStoragePort = {
  getDatabase: jest.fn().mockResolvedValue(mockDb),
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  databaseExists: jest.fn().mockResolvedValue(true),
  deleteDatabase: jest.fn().mockResolvedValue(undefined),
  resetDatabase: jest.fn().mockResolvedValue(undefined),
  exportData: jest.fn().mockResolvedValue({
    biological_analyses: [],
    user_profile: []
  }),
  importData: jest.fn().mockResolvedValue(undefined)
};

describe('SQLiteBiologicalAnalysisRepository', () => {
  let repository: SQLiteBiologicalAnalysisRepository;
  let sampleAnalysis: BiologicalAnalysis;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    repository = new SQLiteBiologicalAnalysisRepository(mockDatabaseStorage);
    
    // Wait for initialization to complete
    await repository.initialize();
    
    sampleAnalysis = {
      id: 'test-id',
      date: new Date('2023-06-15T10:00:00.000Z'),
      pdfSource: 'file://test.pdf'
    };
  });

  test('should save analysis without throwing', async () => {
    await expect(repository.save(sampleAnalysis)).resolves.not.toThrow();
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  test('should get all analyses', async () => {
    const analyses = await repository.getAll();
    expect(analyses.length).toBe(1);
    expect(analyses[0].id).toBe('test-id');
    expect(mockDb.getAllAsync).toHaveBeenCalled();
  });

  test('should get analysis by ID', async () => {
    const analysis = await repository.getById('test-id');
    expect(analysis).not.toBeNull();
    if (analysis) {
      expect(analysis.id).toBe('test-id');
    }
    expect(mockDb.getFirstAsync).toHaveBeenCalled();
  });

  test('should delete analysis without throwing', async () => {
    await expect(repository.deleteById('test-id')).resolves.not.toThrow();
    expect(mockDb.runAsync).toHaveBeenCalled();
  });
}); 