/**
 * Configuration centralisée pour les valeurs de laboratoire
 */

export const LAB_VALUE_CATEGORIES = {
  Hématologie: [
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
  ],
  "Biochimie & Enzymologie": [
    "Transaminases TGO",
    "Transaminases TGP",
    "Proteine C Reactive",
    "Ferritine",
  ],
  Vitamines: ["Vitamine B9", "Vitamine B12"],
  "Autres Marqueurs": [
    "Glycémie",
    "Hémoglobine Glyquée",
    "Cholesterol HDL",
    "Cholesterol LDL",
    "Triglycérides",
    "Gamma GT",
    "Score de fibrose hépatique",
    "TSH",
  ],
};

export const LAB_VALUE_KEYS = Object.values(LAB_VALUE_CATEGORIES).flat();

export const LAB_VALUE_UNITS: Record<string, string> = {
  Hematies: "T/L",
  Hémoglobine: "g/dL",
  Hématocrite: "%",
  VGM: "fl",
  TCMH: "pg",
  CCMH: "g/dL",
  Leucocytes: "giga/L",
  "Polynucléaires neutrophiles": "giga/L",
  "Polynucléaires éosinophiles": "giga/L",
  "Polynucléaires basophiles": "giga/L",
  Lymphocytes: "giga/L",
  Monocytes: "giga/L",
  Plaquettes: "giga/L",
  "Proteine C Reactive": "mg/L",
  Ferritine: "μg/L",
  "Vitamine B9": "ng/mL",
  "Vitamine B12": "pg/mL",
  Glycémie: "g/l",
  "Hémoglobine Glyquée": "%",
  "Cholesterol HDL": "g/l",
  "Cholesterol LDL": "g/l",
  Triglycérides: "g/l",
  "Transaminases TGO": "U/L",
  "Transaminases TGP": "U/L",
  "Gamma GT": "U/L",
  "Score de fibrose hépatique": "%",
  TSH: "mUI/L",
  // Create configuration in settings to Add other mettrics to find and monitor
};

export const LAB_VALUE_REFERENCE_RANGES: Record<
  string,
  { min: number; max: number }
> = {
  Hematies: { min: 4.28, max: 6.0 },
  Hémoglobine: { min: 13.0, max: 18.0 },
  Hématocrite: { min: 39.0, max: 53.0 },
  VGM: { min: 78.0, max: 98.0 },
  TCMH: { min: 26.0, max: 34.0 },
  CCMH: { min: 31.0, max: 36.5 },
  Leucocytes: { min: 4.0, max: 11.0 },
  "Polynucléaires neutrophiles": { min: 1.4, max: 7.7 },
  "Polynucléaires éosinophiles": { min: 0.02, max: 0.63 },
  "Polynucléaires basophiles": { min: 0.0, max: 0.11 },
  Lymphocytes: { min: 1.0, max: 4.8 },
  Monocytes: { min: 0.18, max: 1.0 },
  Plaquettes: { min: 150.0, max: 400.0 },
  "Proteine C Reactive": { min: 0.0, max: 5.0 },
  Ferritine: { min: 22.0, max: 322.0 },
  "Vitamine B9": { min: 3.89, max: 26.8 },
  "Vitamine B12": { min: 197.0, max: 771.0 },
  Glycémie: { min: 0.74, max: 1.06 },
  // To configure in the future. For diadetical people -> Type I 6.5 to 7 and Type II 48 to 53
  "Hémoglobine Glyquée": { min: 4, max: 6 },
  "Cholesterol HDL": { min: 0.4, max: 10 },
  "Cholesterol LDL": { min: 0.0, max: 1.6 },
  Triglycérides: { min: 0.0, max: 1.5 },
  "Transaminases TGO": { min: 0.0, max: 40 },
  "Transaminases TGP": { min: 0.0, max: 40 },
  "Gamma GT": { min: 0.0, max: 38 },
  "Score de fibrose hépatique": { min: 0.0, max: 2.67 },
  TSH: { min: 0.55, max: 4.78 },
};
