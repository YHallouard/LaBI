import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';


export class InMemoryBiologicalAnalysisRepository implements BiologicalAnalysisRepository {
  private analyses: BiologicalAnalysis[] = [];

  async save(analysis: BiologicalAnalysis): Promise<void> {
    const existingIndex = this.findAnalysisIndex(analysis.id);
    
    if (this.isExistingAnalysis(existingIndex)) {
      this.updateExistingAnalysis(existingIndex, analysis);
    } else {
      this.addNewAnalysis(analysis);
    }
  }

  private findAnalysisIndex(id: string): number {
    return this.analyses.findIndex(a => a.id === id);
  }

  private isExistingAnalysis(index: number): boolean {
    return index >= 0;
  }

  private updateExistingAnalysis(index: number, analysis: BiologicalAnalysis): void {
    this.analyses[index] = analysis;
  }

  private addNewAnalysis(analysis: BiologicalAnalysis): void {
    this.analyses.push(analysis);
  }

  async getAll(): Promise<BiologicalAnalysis[]> {
    return this.getSortedAnalysesByDate();
  }

  private getSortedAnalysesByDate(): BiologicalAnalysis[] {
    return [...this.analyses].sort((a, b) => {
      return b.date.getTime() - a.date.getTime();
    });
  }

  async getById(id: string): Promise<BiologicalAnalysis | null> {
    const analysis = this.findAnalysisById(id);
    return analysis || null;
  }

  private findAnalysisById(id: string): BiologicalAnalysis | undefined {
    return this.analyses.find(a => a.id === id);
  }

  async deleteById(id: string): Promise<void> {
    this.removeAnalysisById(id);
  }

  private removeAnalysisById(id: string): void {
    this.analyses = this.analyses.filter(a => a.id !== id);
  }

  async clear(): Promise<void> {
    this.analyses = [];
  }
}
