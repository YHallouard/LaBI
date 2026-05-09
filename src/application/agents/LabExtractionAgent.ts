import { AgentEventBus } from "./AgentEventBus";
import { CategoryExtractionStep } from "./CategoryExtractionStep";
import { DateExtractionStep } from "./DateExtractionStep";
import { RetryPolicy } from "./RetryPolicy";
import { LAB_VALUE_CATEGORIES } from "../../config/LabConfig";
import { CategoryExtractionDTO } from "../../domain/schemas/LabSchemas";
import { LlmService } from "../../ports/services/LlmService";

export interface LabExtractionResult {
  extractedDate: Date;
  byCategory: Record<string, CategoryExtractionDTO>;
  missingCategories: string[];
}

export class LabExtractionAgent {
  constructor(
    private readonly llmService: LlmService,
    private readonly bus: AgentEventBus,
    private readonly retryPolicy?: RetryPolicy
  ) {}

  async run(documentUrl: string): Promise<LabExtractionResult> {
    const dateStep = new DateExtractionStep(
      this.llmService,
      documentUrl,
      this.bus,
      this.retryPolicy
    );

    const categories = Object.entries(LAB_VALUE_CATEGORIES);
    const categorySteps = categories.map(
      ([category, labKeys]) =>
        new CategoryExtractionStep(
          this.llmService,
          documentUrl,
          category,
          labKeys,
          this.bus,
          this.retryPolicy
        )
    );

    const [dateResult, ...categoryResults] = await Promise.allSettled([
      dateStep.run(),
      ...categorySteps.map((step) => step.run()),
    ]);

    const extractedDate =
      dateResult.status === "fulfilled" ? dateResult.value : new Date();

    const byCategory: Record<string, CategoryExtractionDTO> = {};
    const missingCategories: string[] = [];

    categories.forEach(([category], i) => {
      const result = categoryResults[i];
      if (result.status === "fulfilled") {
        byCategory[category] = result.value;
      } else {
        missingCategories.push(category);
      }
    });

    if (missingCategories.length === categories.length) {
      throw new Error(
        "Toutes les catégories ont échoué lors de l'extraction LLM"
      );
    }

    if (missingCategories.length > 0) {
      this.bus.emit({ type: "analysis.partial", missingCategories });
    }

    const biomarkerCount = countExtractedBiomarkers(byCategory);
    this.bus.emit({ type: "analysis.completed", biomarkerCount });

    return { extractedDate, byCategory, missingCategories };
  }
}

function countExtractedBiomarkers(
  byCategory: Record<string, CategoryExtractionDTO>
): number {
  let count = 0;
  for (const data of Object.values(byCategory)) {
    for (const value of Object.values(data)) {
      if (value && value.value !== null) count++;
    }
  }
  return count;
}
