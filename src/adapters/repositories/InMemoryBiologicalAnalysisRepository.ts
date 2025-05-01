import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';

/**
 * An in-memory implementation of BiologicalAnalysisRepository for testing purposes.
 * Stores analyses in memory rather than in a persistent database.
 */
export class InMemoryBiologicalAnalysisRepository implements BiologicalAnalysisRepository {
  private analyses: BiologicalAnalysis[] = [];

  /**
   * Save an analysis to the in-memory store.
   * If an analysis with the same ID exists, it will be updated.
   */
  async save(analysis: BiologicalAnalysis): Promise<void> {
    // Check if analysis with this id already exists
    const existingIndex = this.analyses.findIndex(a => a.id === analysis.id);
    
    if (existingIndex >= 0) {
      // Update existing analysis
      this.analyses[existingIndex] = analysis;
    } else {
      // Add new analysis
      this.analyses.push(analysis);
    }
  }

  /**
   * Retrieve all analyses from the in-memory store.
   * @returns Array of all analyses sorted by date (newest first)
   */
  async getAll(): Promise<BiologicalAnalysis[]> {
    // Return a copy of the analyses array, sorted by date (newest first)
    return [...this.analyses].sort((a, b) => {
      return b.date.getTime() - a.date.getTime();
    });
  }

  /**
   * Retrieve a specific analysis by ID.
   * @param id The ID of the analysis to retrieve
   * @returns The analysis if found, null otherwise
   */
  async getById(id: string): Promise<BiologicalAnalysis | null> {
    const analysis = this.analyses.find(a => a.id === id);
    return analysis || null;
  }

  /**
   * Delete an analysis from the in-memory store.
   * @param id The ID of the analysis to delete
   */
  async deleteById(id: string): Promise<void> {
    this.analyses = this.analyses.filter(a => a.id !== id);
  }

  /**
   * Clear all analyses from the in-memory store.
   * This method is specific to the in-memory implementation for testing
   */
  async clear(): Promise<void> {
    this.analyses = [];
  }
} 