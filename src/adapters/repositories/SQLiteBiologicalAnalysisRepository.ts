import { BiologicalAnalysis, LabValue } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';
import { Database, getDatabase } from '../../infrastructure/database/DatabaseInitializer';
import { LAB_VALUE_KEYS } from '../../config/LabConfig';

export class SQLiteBiologicalAnalysisRepository implements BiologicalAnalysisRepository {
  private db: Database;

  constructor() {
    this.db = getDatabase();
    this.ensureLabValuesColumn();
  }

  // Ensure the lab_values column exists
  private async ensureLabValuesColumn() {
    try {
      // Check if lab_values column exists
      const result = await this.db.getAllAsync<{name: string}>(
        "PRAGMA table_info(biological_analyses)"
      );
      
      const hasLabValues = result.some(col => col.name === 'lab_values');
      
      if (!hasLabValues) {
        console.log('Adding lab_values column to biological_analyses table');
        await this.db.runAsync(
          "ALTER TABLE biological_analyses ADD COLUMN lab_values TEXT"
        );
      }
    } catch (error) {
      console.error('Error checking or adding lab_values column:', error);
    }
  }

  async save(analysis: BiologicalAnalysis): Promise<void> {
    try {
      // Extract lab values into a separate object
      const labValues: Record<string, LabValue> = {};
      LAB_VALUE_KEYS.forEach(field => {
        if (analysis[field as keyof BiologicalAnalysis]) {
          labValues[field] = analysis[field as keyof BiologicalAnalysis] as LabValue;
        }
      });
      
      // Convert lab values to JSON
      const labValuesJson = JSON.stringify(labValues);
      
      await this.db.runAsync(
        `INSERT OR REPLACE INTO biological_analyses (id, date, pdf_source, lab_values) 
         VALUES (?, ?, ?, ?)`,
        [
          analysis.id,
          analysis.date.toISOString(),
          analysis.pdfSource || null,
          labValuesJson
        ]
      );
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }

  async getAll(): Promise<BiologicalAnalysis[]> {
    console.log('Repository.getAll() called');
    try {
      console.log('About to execute getAllAsync query');
      const rows = await this.db.getAllAsync<{
        id: string;
        date: string;
        pdf_source: string | null;
        lab_values: string | null;
      }>(
        'SELECT * FROM biological_analyses ORDER BY date DESC'
      );
      
      console.log('Query executed successfully');
      console.log('Fetching all analyses...');
      console.log('Number of analyses found:', rows.length);
      
      const analyses = rows.map(row => {
        // Create base analysis object
        const analysis: BiologicalAnalysis = {
          id: row.id,
          date: new Date(row.date),
          pdfSource: row.pdf_source || undefined
        };
        
        // Parse and add lab values if they exist
        if (row.lab_values) {
          try {
            const labValues = JSON.parse(row.lab_values);
            Object.entries(labValues).forEach(([key, value]) => {
              (analysis as any)[key] = value;
            });
          } catch (e) {
            console.error('Error parsing lab values JSON:', e);
          }
        }
        
        return analysis;
      });
      
      console.log('Analyses mapped:', analyses.length);
      return analyses;
    } catch (error) {
      console.error('Error getting all analyses:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<BiologicalAnalysis | null> {
    try {
      const row = await this.db.getFirstAsync<{
        id: string;
        date: string;
        pdf_source: string | null;
        lab_values: string | null;
      }>(
        'SELECT * FROM biological_analyses WHERE id = ?',
        [id]
      );
      
      if (!row) {
        return null;
      }
      
      // Create base analysis object
      const analysis: BiologicalAnalysis = {
        id: row.id,
        date: new Date(row.date),
        pdfSource: row.pdf_source || undefined
      };
      
      // Parse and add lab values if they exist
      if (row.lab_values) {
        try {
          const labValues = JSON.parse(row.lab_values);
          Object.entries(labValues).forEach(([key, value]) => {
            (analysis as any)[key] = value;
          });
        } catch (e) {
          console.error('Error parsing lab values JSON:', e);
        }
      }
      
      return analysis;
    } catch (error) {
      console.error('Error getting analysis by ID:', error);
      throw error;
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.db.runAsync(
        'DELETE FROM biological_analyses WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  }
} 