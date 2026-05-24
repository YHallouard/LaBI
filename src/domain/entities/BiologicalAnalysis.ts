export interface LabValue {
  value: number | null;
  unit: string;
}

export interface BiologicalAnalysis {
  id: string;
  date: Date;
  pdfSource?: string;

  // Dynamically include all lab values using index signature
  [key: string]: string | Date | LabValue | null | undefined;
}

export function createEmptyBiologicalAnalysis(generateId: () => string): BiologicalAnalysis {
  return { id: generateId(), date: new Date() };
}
