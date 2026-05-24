import { InMemoryBiologicalAnalysisRepository } from "../InMemoryBiologicalAnalysisRepository";
import { BiologicalAnalysis } from "../../../domain/entities/BiologicalAnalysis";

describe("InMemoryBiologicalAnalysisRepository", () => {
  let repository: InMemoryBiologicalAnalysisRepository;

  beforeEach(() => {
    repository = new InMemoryBiologicalAnalysisRepository();
  });

  describe("Basic Operations", () => {
    it("should save and retrieve biological analysis", async () => {
      const analysis: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test.pdf",
      };

      await repository.save(analysis);
      const retrieved = await repository.getById("test-1");

      expect(retrieved).toEqual(analysis);
    });

    it("should update existing analysis", async () => {
      const analysis1: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test.pdf",
      };

      const analysis2: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-02"),
        pdfSource: "updated.pdf",
      };

      await repository.save(analysis1);
      await repository.save(analysis2);

      const retrieved = await repository.getById("test-1");
      expect(retrieved).toEqual(analysis2);
    });

    it("should return all analyses sorted by date", async () => {
      const analysis1: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test1.pdf",
      };

      const analysis2: BiologicalAnalysis = {
        id: "test-2",
        date: new Date("2023-01-03"),
        pdfSource: "test2.pdf",
      };

      const analysis3: BiologicalAnalysis = {
        id: "test-3",
        date: new Date("2023-01-02"),
        pdfSource: "test3.pdf",
      };

      await repository.save(analysis1);
      await repository.save(analysis2);
      await repository.save(analysis3);

      const all = await repository.getAll();

      expect(all).toHaveLength(3);
      expect(all[0].id).toBe("test-2"); // Most recent first
      expect(all[1].id).toBe("test-3");
      expect(all[2].id).toBe("test-1");
    });

    it("should delete analysis by id", async () => {
      const analysis: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test.pdf",
      };

      await repository.save(analysis);
      await repository.deleteById("test-1");

      const retrieved = await repository.getById("test-1");
      expect(retrieved).toBeNull();
    });

    it("should return null for non-existent analysis", async () => {
      const retrieved = await repository.getById("non-existent");
      expect(retrieved).toBeNull();
    });
  });

  describe("Test Helper Methods", () => {
    it("should handle save failure when flag is set", async () => {
      repository._setShouldFailSave(true);

      const analysis: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test.pdf",
      };

      await expect(repository.save(analysis)).rejects.toThrow(
        "Save analysis failed"
      );
    });

    it("should get saved analyses through helper method", async () => {
      const analysis1: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test1.pdf",
      };

      const analysis2: BiologicalAnalysis = {
        id: "test-2",
        date: new Date("2023-01-02"),
        pdfSource: "test2.pdf",
      };

      await repository.save(analysis1);
      await repository.save(analysis2);

      const savedAnalyses = repository._getSavedAnalyses();

      expect(savedAnalyses).toHaveLength(2);
      expect(savedAnalyses).toContain(analysis1);
      expect(savedAnalyses).toContain(analysis2);
    });

    it("should clear all analyses", async () => {
      const analysis: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test.pdf",
      };

      await repository.save(analysis);
      await repository.clear();

      const all = await repository.getAll();
      expect(all).toHaveLength(0);
    });

    it("should set analyses through helper method", async () => {
      const analyses: BiologicalAnalysis[] = [
        {
          id: "test-1",
          date: new Date("2023-01-01"),
          pdfSource: "test1.pdf",
        },
        {
          id: "test-2",
          date: new Date("2023-01-02"),
          pdfSource: "test2.pdf",
        },
      ];

      repository.setAnalyses(analyses);

      const all = await repository.getAll();
      expect(all).toHaveLength(2);
      expect(all[0].id).toBe("test-2"); // Sorted by date
      expect(all[1].id).toBe("test-1");
    });
  });

  describe("Error Handling", () => {
    it("should handle save failure gracefully", async () => {
      repository._setShouldFailSave(true);

      const analysis: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test.pdf",
      };

      await expect(repository.save(analysis)).rejects.toThrow(
        "Save analysis failed"
      );
    });

    it("should not affect other operations when save fails", async () => {
      const analysis1: BiologicalAnalysis = {
        id: "test-1",
        date: new Date("2023-01-01"),
        pdfSource: "test1.pdf",
      };

      const analysis2: BiologicalAnalysis = {
        id: "test-2",
        date: new Date("2023-01-02"),
        pdfSource: "test2.pdf",
      };

      await repository.save(analysis1);
      repository._setShouldFailSave(true);

      await expect(repository.save(analysis2)).rejects.toThrow(
        "Save analysis failed"
      );

      // First analysis should still be there
      const retrieved = await repository.getById("test-1");
      expect(retrieved).toEqual(analysis1);
    });
  });
});
