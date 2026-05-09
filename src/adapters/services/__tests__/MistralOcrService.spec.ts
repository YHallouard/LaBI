jest.mock("expo-file-system", () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: "base64" },
}));

jest.mock("@mistralai/mistralai", () => ({
  Mistral: jest.fn().mockImplementation(() => ({
    files: { getSignedUrl: jest.fn() },
  })),
}));

jest.mock("../MistralFileUploader", () => ({
  MistralFileUploader: jest.fn().mockImplementation(() => ({
    uploadAndGetSignedUrl: jest
      .fn()
      .mockResolvedValue({ url: "https://signed.example.com/x" }),
  })),
}));

import { MistralOcrService } from "../MistralOcrService";
import { MistralFileUploader } from "../MistralFileUploader";
import { LlmService } from "../../../ports/services/LlmService";
import { AgentEventBus, AgentEvent } from "../../../application/agents/AgentEventBus";
import { LAB_VALUE_CATEGORIES } from "../../../config/LabConfig";
import { LabValue } from "../../../domain/entities/BiologicalAnalysis";

const buildSuccessfulFakeLlm = (
  failingCategories: string[] = []
): LlmService => ({
  async generateObject(_schema, ctx) {
    if (ctx.systemPrompt.includes("date of a laboratory analysis")) {
      return { date: "2024-03-15" } as never;
    }

    for (const cat of failingCategories) {
      if (ctx.systemPrompt.includes(`"${cat}"`)) {
        throw new Error("category failure");
      }
    }

    const match = ctx.systemPrompt.match(/Catégorie ciblée: "([^"]+)"/);
    const category = match?.[1];
    const labKeys =
      LAB_VALUE_CATEGORIES[category as keyof typeof LAB_VALUE_CATEGORIES] ?? [];
    const result: Record<string, { value: number; unit: string } | null> = {};
    for (const key of labKeys) {
      result[key] = { value: 1.0, unit: "X" };
    }
    return result as never;
  },
});

describe("MistralOcrService (refactored)", () => {
  const apiKey = "test-key";
  const pdfPath = "file://test.pdf";

  beforeEach(() => {
    jest.clearAllMocks();
    (MistralFileUploader as jest.Mock).mockImplementation(() => ({
      uploadAndGetSignedUrl: jest
        .fn()
        .mockResolvedValue({ url: "https://signed.example.com/x" }),
    }));
  });

  it("returns OcrResult with extracted date and lab values", async () => {
    const llm = buildSuccessfulFakeLlm();
    const bus = new AgentEventBus();
    const service = new MistralOcrService(apiKey, {
      llmService: llm,
      eventBus: bus,
    });

    const result = await service.extractDataFromPdf(pdfPath);

    expect(result.extractedDate).toBeInstanceOf(Date);
    expect(result.extractedDate.toISOString()).toContain("2024-03-15");

    const firstKey = LAB_VALUE_CATEGORIES["Hématologie"][0];
    expect(result[firstKey]).toBeDefined();
    expect((result[firstKey] as LabValue).value).toBe(1.0);
  });

  it("does not include zeros for missing categories — they are absent", async () => {
    const llm = buildSuccessfulFakeLlm(["Vitamines"]);
    const bus = new AgentEventBus();
    const service = new MistralOcrService(apiKey, {
      llmService: llm,
      eventBus: bus,
    });

    const result = await service.extractDataFromPdf(pdfPath);

    for (const labKey of LAB_VALUE_CATEGORIES["Vitamines"]) {
      expect(result[labKey]).toBeUndefined();
    }
    expect(result.missingCategories).toEqual(["Vitamines"]);
  });

  it("bridges agent events to the legacy ProgressProcessor", async () => {
    const llm = buildSuccessfulFakeLlm();
    const bus = new AgentEventBus();
    const service = new MistralOcrService(apiKey, {
      llmService: llm,
      eventBus: bus,
    });
    const processor = {
      onStepStarted: jest.fn(),
      onStepCompleted: jest.fn(),
    };

    await service.extractDataFromPdf(pdfPath, processor);

    expect(processor.onStepStarted).toHaveBeenCalledWith(
      "Extracting analysis date"
    );
    expect(processor.onStepCompleted).toHaveBeenCalledWith(
      "Extracting analysis date"
    );
    expect(processor.onStepStarted).toHaveBeenCalledWith(
      expect.stringMatching(/^Analyzing /)
    );
  });

  it("exposes the AgentEventBus for live UI subscription", async () => {
    const bus = new AgentEventBus();
    const llm = buildSuccessfulFakeLlm();
    const service = new MistralOcrService(apiKey, {
      llmService: llm,
      eventBus: bus,
    });

    const events: AgentEvent[] = [];
    service.getEventBus().on((e) => events.push(e));

    await service.extractDataFromPdf(pdfPath);

    expect(events.some((e) => e.type === "analysis.completed")).toBe(true);
    expect(events.filter((e) => e.type === "value.extracted").length).toBeGreaterThan(0);
  });

  it("propagates upload errors", async () => {
    (MistralFileUploader as jest.Mock).mockImplementation(() => ({
      uploadAndGetSignedUrl: jest.fn().mockRejectedValue(new Error("net down")),
    }));
    const service = new MistralOcrService(apiKey, {
      llmService: buildSuccessfulFakeLlm(),
    });

    await expect(service.extractDataFromPdf(pdfPath)).rejects.toThrow("net down");
  });
});
