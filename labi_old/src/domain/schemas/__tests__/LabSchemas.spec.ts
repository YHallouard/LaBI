import {
  LabValueSchema,
  ExtractedDateSchema,
  buildCategorySchema,
} from "../LabSchemas";

describe("LabSchemas", () => {
  describe("LabValueSchema", () => {
    it("accepts a numeric value with a unit", () => {
      const result = LabValueSchema.safeParse({ value: 4.5, unit: "T/L" });
      expect(result.success).toBe(true);
    });

    it("accepts a null value with a unit", () => {
      const result = LabValueSchema.safeParse({ value: null, unit: "T/L" });
      expect(result.success).toBe(true);
    });

    it("rejects when value is a string", () => {
      const result = LabValueSchema.safeParse({ value: "4.5", unit: "T/L" });
      expect(result.success).toBe(false);
    });

    it("rejects when unit is missing", () => {
      const result = LabValueSchema.safeParse({ value: 4.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("ExtractedDateSchema", () => {
    it("accepts YYYY-MM-DD", () => {
      const result = ExtractedDateSchema.safeParse({ date: "2024-03-15" });
      expect(result.success).toBe(true);
    });

    it("rejects DD/MM/YYYY", () => {
      const result = ExtractedDateSchema.safeParse({ date: "15/03/2024" });
      expect(result.success).toBe(false);
    });

    it("rejects garbage", () => {
      const result = ExtractedDateSchema.safeParse({ date: "not-a-date" });
      expect(result.success).toBe(false);
    });
  });

  describe("buildCategorySchema", () => {
    it("creates a schema with one nullable LabValue per key", () => {
      const schema = buildCategorySchema(["Hematies", "Hémoglobine"]);
      const valid = schema.safeParse({
        Hematies: { value: 4.5, unit: "T/L" },
        Hémoglobine: null,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects payload missing one required key", () => {
      const schema = buildCategorySchema(["Hematies", "Hémoglobine"]);
      const result = schema.safeParse({
        Hematies: { value: 4.5, unit: "T/L" },
      });
      expect(result.success).toBe(false);
    });

    it("rejects payload with non-numeric value", () => {
      const schema = buildCategorySchema(["Hematies"]);
      const result = schema.safeParse({
        Hematies: { value: "4.5", unit: "T/L" },
      });
      expect(result.success).toBe(false);
    });
  });
});
