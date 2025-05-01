/**
 * Configuration centralisée pour les valeurs de laboratoire
 */

// Liste des clés des valeurs de laboratoire disponibles
export const LAB_VALUE_KEYS = [
  "Hematies", 
  "Hémoglobine", 
  "Hématocrite", 
  "VGM", 
  "TCMH", 
  "CCMH",
  "Leucocytes", 
  "Polynucléaires neutrophiles", 
  "Polynucléaires éosinophiles",
  "Polynucléaires basophiles", 
  "Lymphocytes", 
  "Monocytes", 
  "Plaquettes",
  "Proteine C Reactive"
];

// Unités pour chaque valeur de laboratoire
export const LAB_VALUE_UNITS: Record<string, string> = {
  "Hematies": "T/L",
  "Hémoglobine": "g/dL",
  "Hématocrite": "%",
  "VGM": "fl",
  "TCMH": "pg",
  "CCMH": "g/dL",
  "Leucocytes": "giga/L",
  "Polynucléaires neutrophiles": "giga/L",
  "Polynucléaires éosinophiles": "giga/L",
  "Polynucléaires basophiles": "giga/L",
  "Lymphocytes": "giga/L",
  "Monocytes": "giga/L",
  "Plaquettes": "giga/L",
  "Proteine C Reactive": "mg/L"
};

export const LAB_VALUE_REFERENCE_RANGES: Record<string, { min: number; max: number }> = {
  "Hematies": { min: 4.28, max: 6.0 },
  "Hémoglobine": { min: 13.0, max: 18.0 },
  "Hématocrite": { min: 39.0, max: 53.0 },
  "VGM": { min: 78.0, max: 98.0 },
  "TCMH": { min: 26.0, max: 34.0 },
  "CCMH": { min: 31.0, max: 36.5 },
  "Leucocytes": { min: 4.0, max: 11.0 },
  "Polynucléaires neutrophiles": { min: 1.40, max: 7.70 },
  "Polynucléaires éosinophiles": { min: 0.02, max: 0.63 },
  "Polynucléaires basophiles": { min: 0.0, max: 0.11 },
  "Lymphocytes": { min: 1.0, max: 4.80 },
  "Monocytes": { min: 0.18, max: 1.0 },
  "Plaquettes": { min: 150.0, max: 400.0 },
  "Proteine C Reactive": { min: 0.0, max: 5.0 }
}; 