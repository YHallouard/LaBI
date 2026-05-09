import { CategoryExtractionStep } from "../CategoryExtractionStep";
import { AgentEventBus, AgentEvent } from "../AgentEventBus";
import { LlmService } from "../../../ports/services/LlmService";
import { CategoryExtractionDTO } from "../../../domain/schemas/LabSchemas";

const noDelayRetry = { maxAttempts: 3, baseDelayMs: 0, maxDelayMs: 0 };

function makeFakeLlm(
  impl: (attempt: number) => Promise<unknown>
): { service: LlmService; calls: number } {
  let calls = 0;
  const service: LlmService = {
    async generateObject() {
      calls++;
      return (await impl(calls)) as never;
    },
  };
  return {
    service,
    get calls() {
      return calls;
    },
  };
}

describe("CategoryExtractionStep", () => {
  const docUrl = "https://example.com/file.pdf";
  const labKeys = ["Hematies", "Hémoglobine"];
  const categoryName = "Hématologie";

  it("emits a value.extracted event for each non-null biomarker", async () => {
    const { service } = makeFakeLlm(async () => ({
      Hematies: { value: 4.5, unit: "T/L" },
      Hémoglobine: { value: 14.2, unit: "g/dL" },
    }));

    const bus = new AgentEventBus();
    const events: AgentEvent[] = [];
    bus.on((e) => events.push(e));

    const step = new CategoryExtractionStep(
      service,
      docUrl,
      categoryName,
      labKeys,
      bus,
      noDelayRetry
    );
    await step.run();

    const valueEvents = events.filter((e) => e.type === "value.extracted");
    expect(valueEvents).toHaveLength(2);
    expect(valueEvents.map((e) => (e.type === "value.extracted" ? e.labKey : null))).toEqual([
      "Hematies",
      "Hémoglobine",
    ]);
  });

  it("does not emit value.extracted for null biomarkers", async () => {
    const { service } = makeFakeLlm(async () => ({
      Hematies: { value: 4.5, unit: "T/L" },
      Hémoglobine: null,
    }));
    const bus = new AgentEventBus();
    const events: AgentEvent[] = [];
    bus.on((e) => events.push(e));

    const step = new CategoryExtractionStep(
      service,
      docUrl,
      categoryName,
      labKeys,
      bus,
      noDelayRetry
    );
    await step.run();

    const valueEvents = events.filter((e) => e.type === "value.extracted");
    expect(valueEvents).toHaveLength(1);
  });

  it("retries on failure and emits step.retry events", async () => {
    let attempt = 0;
    const service: LlmService = {
      async generateObject() {
        attempt++;
        if (attempt < 2) throw new Error("network error");
        return {
          Hematies: { value: 4.5, unit: "T/L" },
          Hémoglobine: null,
        } as unknown as CategoryExtractionDTO as never;
      },
    };

    const bus = new AgentEventBus();
    const events: AgentEvent[] = [];
    bus.on((e) => events.push(e));

    const step = new CategoryExtractionStep(
      service,
      docUrl,
      categoryName,
      labKeys,
      bus,
      noDelayRetry
    );
    await step.run();

    const retryEvents = events.filter((e) => e.type === "step.retry");
    expect(retryEvents).toHaveLength(1);
    expect(attempt).toBe(2);
  });

  it("emits step.failed and throws after max attempts", async () => {
    const service: LlmService = {
      async generateObject() {
        throw new Error("permanent");
      },
    };
    const bus = new AgentEventBus();
    const events: AgentEvent[] = [];
    bus.on((e) => events.push(e));

    const step = new CategoryExtractionStep(
      service,
      docUrl,
      categoryName,
      labKeys,
      bus,
      noDelayRetry
    );

    await expect(step.run()).rejects.toThrow("permanent");
    const failed = events.find((e) => e.type === "step.failed");
    expect(failed).toBeDefined();
  });

  it("falls back to expected unit when LLM omits the unit field", async () => {
    const { service } = makeFakeLlm(async () => ({
      Hematies: { value: 4.5, unit: "" },
      Hémoglobine: null,
    }));
    const bus = new AgentEventBus();
    const events: AgentEvent[] = [];
    bus.on((e) => events.push(e));

    const step = new CategoryExtractionStep(
      service,
      docUrl,
      categoryName,
      ["Hematies"],
      bus,
      noDelayRetry
    );
    await step.run();

    const extracted = events.find((e) => e.type === "value.extracted");
    expect(extracted?.type).toBe("value.extracted");
    if (extracted?.type === "value.extracted") {
      expect(extracted.value.unit).toBe("T/L");
    }
  });
});
