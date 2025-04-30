import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';
import { Database, getDatabase } from '../../infrastructure/database/DatabaseInitializer';

export class SQLiteBiologicalAnalysisRepository implements BiologicalAnalysisRepository {
  private db: Database;

  constructor() {
    this.db = getDatabase();
  }

  async save(analysis: BiologicalAnalysis): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO biological_analyses (id, date, crp_value, pdf_source) 
           VALUES (?, ?, ?, ?)`,
          [
            analysis.id,
            analysis.date.toISOString(),
            analysis.crpValue,
            analysis.pdfSource || null
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getAll(): Promise<BiologicalAnalysis[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM biological_analyses ORDER BY date DESC',
          [],
          (_, result) => {
            const analyses: BiologicalAnalysis[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              const row = result.rows.item(i);
              analyses.push({
                id: row.id,
                date: new Date(row.date),
                crpValue: row.crp_value,
                pdfSource: row.pdf_source
              });
            }
            resolve(analyses);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getById(id: string): Promise<BiologicalAnalysis | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM biological_analyses WHERE id = ?',
          [id],
          (_, result) => {
            if (result.rows.length === 0) {
              resolve(null);
              return;
            }
            
            const row = result.rows.item(0);
            resolve({
              id: row.id,
              date: new Date(row.date),
              crpValue: row.crp_value,
              pdfSource: row.pdf_source
            });
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async deleteById(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM biological_analyses WHERE id = ?',
          [id],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }
} 