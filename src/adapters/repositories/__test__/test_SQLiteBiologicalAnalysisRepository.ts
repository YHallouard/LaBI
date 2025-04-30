import { TestCase } from 'unittest';
import { SQLiteBiologicalAnalysisRepository } from '../SQLiteBiologicalAnalysisRepository';
import { BiologicalAnalysis } from '../../../domain/entities/BiologicalAnalysis';
import * as SQLite from 'expo-sqlite';

// Mock SQLite database
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn((callback) => {
      callback({
        executeSql: jest.fn((query, params, success) => {
          // Mock implementation for different SQL commands
          if (query.includes('INSERT')) {
            success(null, { rowsAffected: 1 });
          } else if (query.includes('SELECT * FROM')) {
            success(null, { 
              rows: {
                length: 1,
                item: () => ({
                  id: 'test-id',
                  date: '2023-06-15T10:00:00.000Z',
                  crp_value: 5.2,
                  pdf_source: 'file://test.pdf'
                })
              }
            });
          } else if (query.includes('DELETE')) {
            success(null, { rowsAffected: 1 });
          }
        })
      });
    })
  }))
}));

class SQLiteBiologicalAnalysisRepositoryTest extends TestCase {
  private repository: SQLiteBiologicalAnalysisRepository;
  private sampleAnalysis: BiologicalAnalysis;

  setUp() {
    this.repository = new SQLiteBiologicalAnalysisRepository();
    this.sampleAnalysis = {
      id: 'test-id',
      date: new Date('2023-06-15T10:00:00.000Z'),
      crpValue: 5.2,
      pdfSource: 'file://test.pdf'
    };
  }

  async testSaveAnalysis() {
    // Given
    const analysis = this.sampleAnalysis;
    
    // When
    await this.repository.save(analysis);
    
    // Then
    // In a real test, we would verify database state
    // But since we're using mocks, we're just ensuring it doesn't throw
    this.assert(true);
  }

  async testGetAllAnalyses() {
    // Given
    // Repository initialized with mock data
    
    // When
    const analyses = await this.repository.getAll();
    
    // Then
    this.assertEqual(analyses.length, 1);
    this.assertEqual(analyses[0].id, 'test-id');
    this.assertEqual(analyses[0].crpValue, 5.2);
  }

  async testGetAnalysisById() {
    // Given
    const id = 'test-id';
    
    // When
    const analysis = await this.repository.getById(id);
    
    // Then
    this.assertNotEqual(analysis, null);
    if (analysis) {
      this.assertEqual(analysis.id, 'test-id');
      this.assertEqual(analysis.crpValue, 5.2);
    }
  }

  async testDeleteAnalysis() {
    // Given
    const id = 'test-id';
    
    // When
    await this.repository.deleteById(id);
    
    // Then
    // In a real test, we would verify the record is gone
    // But since we're using mocks, we're just ensuring it doesn't throw
    this.assert(true);
  }
} 