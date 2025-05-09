import {
  LAB_VALUE_KEYS,
  LAB_VALUE_UNITS,
  LAB_VALUE_REFERENCE_RANGES,
} from "../LabConfig";

describe("LabConfig", () => {
  describe("LAB_VALUE_KEYS", () => {
    it("should contain the correct number of lab value keys", () => {
      // Given/When - importing the keys
      // Then
      expect(LAB_VALUE_KEYS.length).toBe(27);
    });

    it("should contain all expected lab value keys", () => {
      // Given
      const expectedKeys = [
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
        "Transaminases TGO",
        "Transaminases TGP",
        "Proteine C Reactive",
        "Ferritine",
        "Vitamine B9",
        "Vitamine B12",
        "Glycémie",
        "Hémoglobine Glyquée",
        "Cholesterol HDL",
        "Cholesterol LDL",
        "Triglycérides",
        "Gamma GT",
        "Score de fibrose hépatique",
        "TSH",
      ];

      // When/Then
      expect(LAB_VALUE_KEYS).toEqual(expectedKeys);
    });
  });

  describe("LAB_VALUE_UNITS", () => {
    it("should contain the correct number of units", () => {
      // Given/When
      const unitKeys = Object.keys(LAB_VALUE_UNITS);

      // Then
      expect(unitKeys.length).toBe(27);
    });

    it("should contain units for all lab values", () => {
      // Given/When
      const unitKeys = Object.keys(LAB_VALUE_UNITS);

      // Then
      LAB_VALUE_KEYS.forEach((key) => {
        expect(unitKeys).toContain(key);
      });
    });

    it("should have correct units for each lab value", () => {
      // Given/When/Then
      expect(LAB_VALUE_UNITS["Hematies"]).toBe("T/L");
      expect(LAB_VALUE_UNITS["Hémoglobine"]).toBe("g/dL");
      expect(LAB_VALUE_UNITS["Hématocrite"]).toBe("%");
      expect(LAB_VALUE_UNITS["VGM"]).toBe("fl");
      expect(LAB_VALUE_UNITS["TCMH"]).toBe("pg");
      expect(LAB_VALUE_UNITS["CCMH"]).toBe("g/dL");
      expect(LAB_VALUE_UNITS["Leucocytes"]).toBe("giga/L");
      expect(LAB_VALUE_UNITS["Polynucléaires neutrophiles"]).toBe("giga/L");
      expect(LAB_VALUE_UNITS["Polynucléaires éosinophiles"]).toBe("giga/L");
      expect(LAB_VALUE_UNITS["Polynucléaires basophiles"]).toBe("giga/L");
      expect(LAB_VALUE_UNITS["Lymphocytes"]).toBe("giga/L");
      expect(LAB_VALUE_UNITS["Monocytes"]).toBe("giga/L");
      expect(LAB_VALUE_UNITS["Plaquettes"]).toBe("giga/L");
      expect(LAB_VALUE_UNITS["Proteine C Reactive"]).toBe("mg/L");
      expect(LAB_VALUE_UNITS["Ferritine"]).toBe("μg/L");
      expect(LAB_VALUE_UNITS["Vitamine B9"]).toBe("ng/mL");
      expect(LAB_VALUE_UNITS["Vitamine B12"]).toBe("pg/mL");
      expect(LAB_VALUE_UNITS["Glycémie"]).toBe("g/l");
      expect(LAB_VALUE_UNITS["Hémoglobine Glyquée"]).toBe("%");
      expect(LAB_VALUE_UNITS["Cholesterol HDL"]).toBe("g/l");
      expect(LAB_VALUE_UNITS["Cholesterol LDL"]).toBe("g/l");
      expect(LAB_VALUE_UNITS["Triglycérides"]).toBe("g/l");
      expect(LAB_VALUE_UNITS["Transaminases TGO"]).toBe("U/L");
      expect(LAB_VALUE_UNITS["Transaminases TGP"]).toBe("U/L");
      expect(LAB_VALUE_UNITS["Gamma GT"]).toBe("U/L");
      expect(LAB_VALUE_UNITS["Score de fibrose hépatique"]).toBe("%");
      expect(LAB_VALUE_UNITS["TSH"]).toBe("mUI/L");
    });
  });

  describe("LAB_VALUE_REFERENCE_RANGES", () => {
    it("should contain the correct number of reference ranges", () => {
      // Given/When
      const rangeKeys = Object.keys(LAB_VALUE_REFERENCE_RANGES);

      // Then
      expect(rangeKeys.length).toBe(27);
    });

    it("should contain reference ranges for all lab values", () => {
      // Given/When
      const rangeKeys = Object.keys(LAB_VALUE_REFERENCE_RANGES);

      // Then
      LAB_VALUE_KEYS.forEach((key) => {
        expect(rangeKeys).toContain(key);
      });
    });

    it("should have valid min and max values for each range", () => {
      // Given/When/Then
      Object.entries(LAB_VALUE_REFERENCE_RANGES).forEach(([key, range]) => {
        expect(range).toHaveProperty("min");
        expect(range).toHaveProperty("max");
        expect(typeof range.min).toBe("number");
        expect(typeof range.max).toBe("number");
        expect(range.min).toBeLessThan(range.max);
        expect(LAB_VALUE_KEYS).toContain(key);
      });
    });

    it("should have correct reference ranges for each lab value", () => {
      // Given/When/Then
      expect(LAB_VALUE_REFERENCE_RANGES["Hematies"]).toEqual({
        min: 4.28,
        max: 6.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Hémoglobine"]).toEqual({
        min: 13.0,
        max: 18.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Hématocrite"]).toEqual({
        min: 39.0,
        max: 53.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["VGM"]).toEqual({
        min: 78.0,
        max: 98.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["TCMH"]).toEqual({
        min: 26.0,
        max: 34.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["CCMH"]).toEqual({
        min: 31.0,
        max: 36.5,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Leucocytes"]).toEqual({
        min: 4.0,
        max: 11.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Polynucléaires neutrophiles"]).toEqual(
        { min: 1.4, max: 7.7 }
      );
      expect(LAB_VALUE_REFERENCE_RANGES["Polynucléaires éosinophiles"]).toEqual(
        { min: 0.02, max: 0.63 }
      );
      expect(LAB_VALUE_REFERENCE_RANGES["Polynucléaires basophiles"]).toEqual({
        min: 0.0,
        max: 0.11,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Lymphocytes"]).toEqual({
        min: 1.0,
        max: 4.8,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Monocytes"]).toEqual({
        min: 0.18,
        max: 1.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Plaquettes"]).toEqual({
        min: 150.0,
        max: 400.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Proteine C Reactive"]).toEqual({
        min: 0.0,
        max: 5.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Ferritine"]).toEqual({
        min: 22.0,
        max: 322.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Vitamine B9"]).toEqual({
        min: 3.89,
        max: 26.8,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Vitamine B12"]).toEqual({
        min: 197.0,
        max: 771.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Glycémie"]).toEqual({
        min: 0.74,
        max: 1.06,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Hémoglobine Glyquée"]).toEqual({
        min: 4.0,
        max: 6.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Cholesterol HDL"]).toEqual({
        min: 0.4,
        max: 10.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Cholesterol LDL"]).toEqual({
        min: 0.0,
        max: 1.6,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Triglycérides"]).toEqual({
        min: 0.0,
        max: 1.5,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Transaminases TGO"]).toEqual({
        min: 0.0,
        max: 40.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Transaminases TGP"]).toEqual({
        min: 0.0,
        max: 40.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Gamma GT"]).toEqual({
        min: 0.0,
        max: 38.0,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["Score de fibrose hépatique"]).toEqual({
        min: 0.0,
        max: 2.67,
      });
      expect(LAB_VALUE_REFERENCE_RANGES["TSH"]).toEqual({
        min: 0.55,
        max: 4.78,
      });
    });
  });

  describe("Configuration consistency", () => {
    it("should have same keys in all configuration objects", () => {
      // Given
      const unitKeys = Object.keys(LAB_VALUE_UNITS);
      const rangeKeys = Object.keys(LAB_VALUE_REFERENCE_RANGES);

      // When/Then
      expect(unitKeys).toEqual(expect.arrayContaining(LAB_VALUE_KEYS));
      expect(rangeKeys).toEqual(expect.arrayContaining(LAB_VALUE_KEYS));
      expect(LAB_VALUE_KEYS).toEqual(expect.arrayContaining(unitKeys));
      expect(LAB_VALUE_KEYS).toEqual(expect.arrayContaining(rangeKeys));
    });
  });
});
