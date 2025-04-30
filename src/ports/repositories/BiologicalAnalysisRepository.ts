import { BiologicalAnalysis } from '../../domain/entities/BiologicalAnalysis';

export interface BiologicalAnalysisRepository {
  save(analysis: BiologicalAnalysis): Promise<void>;
  getAll(): Promise<BiologicalAnalysis[]>;
  getById(id: string): Promise<BiologicalAnalysis | null>;
  deleteById(id: string): Promise<void>;
} 