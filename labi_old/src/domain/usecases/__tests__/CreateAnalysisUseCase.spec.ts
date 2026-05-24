import { CreateAnalysisUseCase } from "../CreateAnalysisUseCase";
import { InMemoryBiologicalAnalysisRepository } from "../../../adapters/repositories/InMemoryBiologicalAnalysisRepository";
import { createEmptyBiologicalAnalysis } from "../../entities/BiologicalAnalysis";

let idCounter = 0;
const generateId = () => `test-id-${++idCounter}`;

describe("CreateAnalysisUseCase", () => {
  let repository: InMemoryBiologicalAnalysisRepository;
  let useCase: CreateAnalysisUseCase;

  beforeEach(() => {
    idCounter = 0;
    repository = new InMemoryBiologicalAnalysisRepository();
    useCase = new CreateAnalysisUseCase(repository);
  });

  it("persists the analysis and returns it", async () => {
    // Given
    const analysis = createEmptyBiologicalAnalysis(generateId);

    // When
    const result = await useCase.execute(analysis);

    // Then
    const saved = repository._getSavedAnalyses();
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(result.id);
  });

  it("keeps the provided id when it is already set", async () => {
    // Given
    const analysis = { id: "fixed-id", date: new Date() };

    // When
    const result = await useCase.execute(analysis);

    // Then
    expect(result.id).toBe("fixed-id");
  });

  it("generates an id when none is provided", async () => {
    // Given
    const analysis = { id: "", date: new Date() };

    // When
    const result = await useCase.execute(analysis);

    // Then
    expect(result.id).not.toBe("");
    expect(result.id.length).toBeGreaterThan(0);
  });

  it("calls save exactly once", async () => {
    // Given
    const analysis = createEmptyBiologicalAnalysis(generateId);
    const saveSpy = jest.spyOn(repository, "save");

    // When
    await useCase.execute(analysis);

    // Then
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it("propagates repository errors", async () => {
    // Given
    const analysis = createEmptyBiologicalAnalysis(generateId);
    repository._setShouldFailSave(true);

    // When / Then
    await expect(useCase.execute(analysis)).rejects.toThrow(
      "Save analysis failed"
    );
  });
});
