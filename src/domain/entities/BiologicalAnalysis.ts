export interface LabValue {
  value: number;
  unit: string;
}

export interface BiologicalAnalysis {
  id: string;
  date: Date;
  pdfSource?: string;
  
  // Add structured lab values
  Hematies?: LabValue;
  Hémoglobine?: LabValue;
  Hématocrite?: LabValue;
  VGM?: LabValue;
  TCMH?: LabValue;
  CCMH?: LabValue;
  Leucocytes?: LabValue;
  "Polynucléaires neutrophiles"?: LabValue;
  "Polynucléaires éosinophiles"?: LabValue;
  "Polynucléaires basophiles"?: LabValue;
  Lymphocytes?: LabValue;
  Monocytes?: LabValue;
  Plaquettes?: LabValue;
  "Proteine C Reactive"?: LabValue;
} 