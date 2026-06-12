import { AgentStep } from "./AgentStep";
import { AgentEventBus } from "./AgentEventBus";
import { RetryPolicy } from "./RetryPolicy";
import {
  buildCategorySchema,
  CategoryExtractionDTO,
  LabValueDTO,
} from "../../domain/schemas/LabSchemas";
import { LAB_VALUE_UNITS } from "../../config/LabConfig";
import { LlmService } from "../../ports/services/LlmService";

/** stepId émis sur l'EventBus pour une catégorie — utilisé par l'UI pour mapper les étapes. */
export function categoryStepId(category: string): string {
  return `extract-category-${slugify(category)}`;
}

export class CategoryExtractionStep extends AgentStep<CategoryExtractionDTO> {
  constructor(
    private readonly llmService: LlmService,
    private readonly documentUrl: string,
    private readonly category: string,
    private readonly labKeys: string[],
    bus: AgentEventBus,
    retryPolicy?: RetryPolicy
  ) {
    super(categoryStepId(category), `Analyzing ${category}`, bus, retryPolicy);
  }

  protected async execute(attempt: number): Promise<CategoryExtractionDTO> {
    const schema = buildCategorySchema(this.labKeys);
    const expectedFields = this.labKeys
      .map((key) => `${key} (unité ${LAB_VALUE_UNITS[key] ?? "?"})`)
      .join(", ");

    const baseSystem = `Tu es un expert en analyses biologiques.
Tu extrais des valeurs de laboratoire depuis un PDF d'analyse médicale.
Catégorie ciblée: "${this.category}".
Champs attendus: ${expectedFields}.
Pour chaque champ:
- Si la valeur est présente dans le document: renvoie { "value": <nombre>, "unit": "<unité>" }
- Si la valeur est absente: renvoie null
Ne JAMAIS inventer une valeur.
Convertis les unités si possible vers les unités attendues.`;

    const systemPrompt =
      attempt === 1
        ? baseSystem
        : `${baseSystem}

ATTENTION: ta tentative précédente a produit un JSON invalide ou non conforme au schéma.
Renvoie STRICTEMENT un objet JSON avec une clé pour chaque champ listé, et value en number ou null.`;

    const userPrompt = `Extrait uniquement les valeurs de la catégorie "${this.category}" de ce PDF d'analyse biologique.`;

    const result = (await this.llmService.generateObject(
      schema,
      {
        documentUrl: this.documentUrl,
        systemPrompt,
        userPrompt,
      },
      { onReasoningDelta: (delta) => this.emitThinking(delta) }
    )) as CategoryExtractionDTO;

    this.emitExtractedValues(result);
    return result;
  }

  private emitExtractedValues(data: CategoryExtractionDTO): void {
    for (const labKey of this.labKeys) {
      const value = data[labKey];
      if (value && this.isValidLabValue(value)) {
        this.bus.emit({
          type: "value.extracted",
          labKey,
          value: this.normalizeUnit(labKey, value),
        });
      }
    }
  }

  private isValidLabValue(value: LabValueDTO): boolean {
    return (
      value !== null &&
      typeof value === "object" &&
      "value" in value &&
      (value.value === null || typeof value.value === "number") &&
      typeof value.unit === "string"
    );
  }

  private normalizeUnit(labKey: string, value: LabValueDTO): LabValueDTO {
    const expectedUnit = LAB_VALUE_UNITS[labKey];
    if (!expectedUnit) return value;
    return {
      value: value.value,
      unit: value.unit && value.unit.length > 0 ? value.unit : expectedUnit,
    };
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
