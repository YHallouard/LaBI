import { BiologicalAnalysis, LabValue } from '../../domain/entities/BiologicalAnalysis';
import { BiologicalAnalysisRepository } from '../../ports/repositories/BiologicalAnalysisRepository';

export class UpdateAnalysisUseCase {
  constructor(
    private readonly repository: BiologicalAnalysisRepository
  ) {}

  /**
   * Met à jour une analyse biologique existante
   * @param analysis L'analyse mise à jour
   * @returns L'analyse mise à jour
   */
  async execute(analysis: BiologicalAnalysis): Promise<BiologicalAnalysis> {
    // Vérifier que l'ID existe
    if (!analysis.id) {
      throw new Error('Analysis ID is required for update');
    }
    
    // Vérifier que l'analyse existe
    const existingAnalysis = await this.repository.getById(analysis.id);
    if (!existingAnalysis) {
      throw new Error(`Analysis with ID ${analysis.id} not found`);
    }
    
    // Sauvegarder les mises à jour
    await this.repository.save(analysis);
    
    // Retourner l'analyse mise à jour
    return analysis;
  }

  /**
   * Met à jour une valeur spécifique d'une analyse biologique
   * @param analysisId L'ID de l'analyse à mettre à jour
   * @param labKey Le nom de la valeur à mettre à jour
   * @param value La nouvelle valeur
   * @param unit L'unité (optionnelle, conserve l'existante si non fournie)
   * @returns L'analyse mise à jour
   */
  async updateLabValue(
    analysisId: string, 
    labKey: string, 
    value: number, 
    unit?: string
  ): Promise<BiologicalAnalysis> {
    // Récupérer l'analyse existante
    const analysis = await this.repository.getById(analysisId);
    if (!analysis) {
      throw new Error(`Analysis with ID ${analysisId} not found`);
    }
    
    // Récupérer la valeur existante pour conserver l'unité si non fournie
    const existingLabValue = (analysis as any)[labKey] as LabValue | undefined;
    const updatedUnit = unit || (existingLabValue?.unit || '');
    
    // Mettre à jour la valeur
    (analysis as any)[labKey] = {
      value: value,
      unit: updatedUnit
    };
    
    // Sauvegarder les mises à jour
    await this.repository.save(analysis);
    
    // Retourner l'analyse mise à jour
    return analysis;
  }

  /**
   * Met à jour la date d'une analyse biologique
   * @param analysisId L'ID de l'analyse à mettre à jour
   * @param date La nouvelle date
   * @returns L'analyse mise à jour
   */
  async updateDate(
    analysisId: string,
    date: Date
  ): Promise<BiologicalAnalysis> {
    // Récupérer l'analyse existante
    const analysis = await this.repository.getById(analysisId);
    if (!analysis) {
      throw new Error(`Analysis with ID ${analysisId} not found`);
    }
    
    // Mettre à jour la date
    analysis.date = date;
    
    // Sauvegarder les mises à jour
    await this.repository.save(analysis);
    
    // Retourner l'analyse mise à jour
    return analysis;
  }
}
