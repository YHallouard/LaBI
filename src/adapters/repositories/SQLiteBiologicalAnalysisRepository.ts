import {
  BiologicalAnalysis,
  LabValue,
} from "../../domain/entities/BiologicalAnalysis";
import { BiologicalAnalysisRepository } from "../../ports/repositories/BiologicalAnalysisRepository";
import { getDatabase } from "../../infrastructure/database/DatabaseInitializer";
import type { Database } from "../../adapters/infrastructure/SQLiteDatabaseStorage";
import { LAB_VALUE_KEYS } from "../../config/LabConfig";

export class SQLiteBiologicalAnalysisRepository
  implements BiologicalAnalysisRepository
{
  private db: Database | null = null;
  private initialized: Promise<void>;

  constructor() {
    this.initialized = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await getDatabase();
      await this.ensureLabValuesColumn();
    } catch (error) {
      console.error("Error initializing repository:", error);
      throw error;
    }
  }

  private async ensureLabValuesColumn() {
    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const columnsInfo = await this.fetchTableColumnsInfo(
        "biological_analyses"
      );
      const hasLabValues = this.checkIfColumnExists(columnsInfo, "lab_values");

      if (!hasLabValues) {
        await this.addLabValuesColumn();
      }
    } catch (error) {
      console.error("Error checking or adding lab_values column:", error);
    }
  }

  private async fetchTableColumnsInfo(
    tableName: string
  ): Promise<{ name: string }[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    return await this.db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(${tableName})`
    );
  }

  private checkIfColumnExists(
    columns: { name: string }[],
    columnName: string
  ): boolean {
    return columns.some((col) => col.name === columnName);
  }

  private async addLabValuesColumn(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }
    console.log("Adding lab_values column to biological_analyses table");
    await this.db.runAsync(
      "ALTER TABLE biological_analyses ADD COLUMN lab_values TEXT"
    );
  }

  async save(analysis: BiologicalAnalysis): Promise<void> {
    await this.initialized;

    try {
      const labValuesJson = this.extractAndSerializeLabValues(analysis);
      await this.insertOrUpdateAnalysis(analysis, labValuesJson);
    } catch (error) {
      console.error("Error saving analysis:", error);
      throw error;
    }
  }

  private extractAndSerializeLabValues(analysis: BiologicalAnalysis): string {
    const labValues: Record<string, LabValue> = {};

    LAB_VALUE_KEYS.forEach((field) => {
      if (analysis[field as keyof BiologicalAnalysis]) {
        labValues[field] = analysis[
          field as keyof BiologicalAnalysis
        ] as LabValue;
      }
    });

    return JSON.stringify(labValues);
  }

  private async insertOrUpdateAnalysis(
    analysis: BiologicalAnalysis,
    labValuesJson: string
  ): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    await this.db.runAsync(
      `INSERT OR REPLACE INTO biological_analyses (id, date, pdf_source, lab_values) 
       VALUES (?, ?, ?, ?)`,
      [
        analysis.id,
        analysis.date.toISOString(),
        analysis.pdfSource || null,
        labValuesJson,
      ]
    );
  }

  async getAll(): Promise<BiologicalAnalysis[]> {
    await this.initialized;

    try {
      const rows = await this.fetchAllAnalysesFromDatabase();
      return this.mapRowsToAnalyses(rows);
    } catch (error) {
      console.error("Error getting all analyses:", error);
      throw error;
    }
  }

  private async fetchAllAnalysesFromDatabase() {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return await this.db.getAllAsync<{
      id: string;
      date: string;
      pdf_source: string | null;
      lab_values: string | null;
    }>("SELECT * FROM biological_analyses ORDER BY date DESC");
  }

  private mapRowsToAnalyses(
    rows: {
      id: string;
      date: string;
      pdf_source: string | null;
      lab_values: string | null;
    }[]
  ): BiologicalAnalysis[] {
    return rows.map((row) => this.createAnalysisFromRow(row));
  }

  async getById(id: string): Promise<BiologicalAnalysis | null> {
    await this.initialized;

    try {
      const row = await this.fetchAnalysisById(id);

      if (!row) {
        return null;
      }

      return this.createAnalysisFromRow(row);
    } catch (error) {
      console.error("Error getting analysis by ID:", error);
      throw error;
    }
  }

  private async fetchAnalysisById(id: string) {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    return await this.db.getFirstAsync<{
      id: string;
      date: string;
      pdf_source: string | null;
      lab_values: string | null;
    }>("SELECT * FROM biological_analyses WHERE id = ?", [id]);
  }

  private createAnalysisFromRow(row: {
    id: string;
    date: string;
    pdf_source: string | null;
    lab_values: string | null;
  }): BiologicalAnalysis {
    const analysis: BiologicalAnalysis = {
      id: row.id,
      date: new Date(row.date),
      pdfSource: row.pdf_source || undefined,
    };

    if (row.lab_values) {
      this.addLabValuesToAnalysis(analysis, row.lab_values);
    }

    return analysis;
  }

  private addLabValuesToAnalysis(
    analysis: BiologicalAnalysis,
    labValuesJson: string
  ): void {
    try {
      const labValues = JSON.parse(labValuesJson);
      Object.entries(labValues).forEach(([key, value]) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        (analysis as any)[key] = value;
      });
    } catch (e) {
      console.error("Error parsing lab values JSON:", e);
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.initialized;

    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      await this.db.runAsync("DELETE FROM biological_analyses WHERE id = ?", [
        id,
      ]);
    } catch (error) {
      console.error("Error deleting analysis:", error);
      throw error;
    }
  }
}
