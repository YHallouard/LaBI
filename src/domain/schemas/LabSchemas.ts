import { z } from "zod";
import { LAB_VALUE_UNITS } from "../../config/LabConfig";

export const LabValueSchema = z.object({
  value: z.number().nullable(),
  unit: z.string(),
});

export type LabValueDTO = z.infer<typeof LabValueSchema>;

export const ExtractedDateSchema = z.object({
  date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "La date doit être au format YYYY-MM-DD"
    ),
});

export type ExtractedDateDTO = z.infer<typeof ExtractedDateSchema>;

export type CategoryExtractionDTO = Record<string, LabValueDTO | null>;

export function buildCategorySchema(
  labKeys: string[]
): z.ZodObject<Record<string, z.ZodNullable<typeof LabValueSchema>>> {
  const shape: Record<string, z.ZodNullable<typeof LabValueSchema>> = {};
  for (const key of labKeys) {
    const expectedUnit = LAB_VALUE_UNITS[key] ?? "";
    shape[key] = LabValueSchema.nullable().describe(
      `Valeur de ${key}${
        expectedUnit ? ` (unité attendue: ${expectedUnit})` : ""
      }, ou null si absente du document`
    );
  }
  return z.object(shape);
}
