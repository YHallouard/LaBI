import { LabExtractionAgent } from "../LabExtractionAgent";
import { AgentEventBus, AgentEvent } from "../AgentEventBus";
import { LlmService } from "../../../ports/services/LlmService";
import { LAB_VALUE_CATEGORIES } from "../../../config/LabConfig";

const noDelayRetry = { maxAttempts: 2, baseDelayMs: 0, maxDelayMs: 0 };

const buildSuccessfulFakeLlm = (
  failingCategories: string[] = []
): LlmService => ({
  async generateObject(_schema, ctx) {
    if (ctx.systemPrompt.includes("date of a laboratory analysis")) {
      return { date: "2024-03-15" } as never;
    }

    for (const failingCat of failingCategories) {
      if (ctx.systemPrompt.includes(`"${failingCat}"`)) {
        throw new Error(`Mock failure on category ${failingCat}`);
      }
    }

    const categoryMatch = ctx.systemPrompt.match(/Catégorie ciblée: "([^"]+)"/);
    const category = categoryMatch?.[1];
    if (!category) throw new Error("Could not parse category in prompt");

    const labKeys =
      LAB_VALUE_CATEGORIES[category as keyof typeof LAB_VALUE_CATEGORIES];
    if (!labKeys) throw new Error(`Unknown category ${category}`);

    const result: Record<string, { value: number; unit: string } | null> = {};
    for (const key of labKeys) {
      result[key] = { value: 1, unit: "X" };
    }
    return result as never;
  },
});

describe("LabExtractionAgent", () => {
  const docUrl = "https://example.com/lab.pdf";

  it("returns extracted date and all categories on success", async () => {
    const bus = new AgentEventBus();
    const agent = new LabExtractionAgent(
      buildSuccessfulFakeLlm(),
      bus,
      noDelayRetry
    );

    const result = await agent.run(docUrl);

    expect(result.extractedDate.toISOString()).toContain("2024-03-15");
    expect(result.missingCategories).toEqual([]);
    expect(Object.keys(result.byCategory)).toEqual(
      Object.keys(LAB_VALUE_CATEGORIES)
    );
  });

  it("emits analysis.completed with the total biomarker count", async () => {
    const bus = new AgentEventBus();
    const events: AgentEvent[] = [];
    bus.on((e) => events.push(e));

    const agent = new LabExtractionAgent(
      buildSuccessfulFakeLlm(),
      bus,
      noDelayRetry
    );
    await agent.run(docUrl);

    const completed = events.find((e) => e.type === "analysis.completed");
    expect(completed).toBeDefined();
    if (completed?.type === "analysis.completed") {
      const totalKeys = Object.values(LAB_VALUE_CATEGORIES).flat().length;
      expect(completed.biomarkerCount).toBe(totalKeys);
    }
  });

  it("saves partial results and emits analysis.partial when one category fails", async () => {
    const bus = new AgentEventBus();
    const events: AgentEvent[] = [];
    bus.on((e) => events.push(e));

    const agent = new LabExtractionAgent(
      buildSuccessfulFakeLlm(["Vitamines"]),
      bus,
      noDelayRetry
    );
    const result = await agent.run(docUrl);

    expect(result.missingCategories).toEqual(["Vitamines"]);
    expect(result.byCategory).not.toHaveProperty("Vitamines");
    expect(result.byCategory).toHaveProperty("Hématologie");

    const partial = events.find((e) => e.type === "analysis.partial");
    expect(partial).toBeDefined();
    if (partial?.type === "analysis.partial") {
      expect(partial.missingCategories).toEqual(["Vitamines"]);
    }
  });

  it("throws when all categories fail", async () => {
    const allCategories = Object.keys(LAB_VALUE_CATEGORIES);
    const bus = new AgentEventBus();
    const agent = new LabExtractionAgent(
      buildSuccessfulFakeLlm(allCategories),
      bus,
      noDelayRetry
    );
    await expect(agent.run(docUrl)).rejects.toThrow(
      /Toutes les catégories ont échoué/
    );
  });

  it("falls back to current date when date extraction fails", async () => {
    const llm: LlmService = {
      async generateObject(_schema, ctx) {
        if (ctx.systemPrompt.includes("date of a laboratory analysis")) {
          throw new Error("date failure");
        }
        return await buildSuccessfulFakeLlm().generateObject(_schema, ctx);
      },
    };

    const bus = new AgentEventBus();
    const agent = new LabExtractionAgent(llm, bus, noDelayRetry);
    const result = await agent.run(docUrl);
    expect(result.extractedDate).toBeInstanceOf(Date);
  });
});
