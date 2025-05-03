import { BiologicalAnalysis, LabValue } from "../BiologicalAnalysis";

describe("BiologicalAnalysis", () => {
  describe("Given a biological analysis", () => {
    describe("When creating a new biological analysis", () => {
      it("Then should have the correct structure", () => {
        // Arrange
        const id = "123";
        const date = new Date("2023-01-01");
        const pdfSource = "test.pdf";

        // Act
        const analysis: BiologicalAnalysis = {
          id,
          date,
          pdfSource,
          "Proteine C reactive": {
            value: 5.2,
            unit: "mg/L",
          } as LabValue,
        };

        // Assert
        expect(analysis.id).toBe(id);
        expect(analysis.date).toBe(date);
        expect(analysis.pdfSource).toBe(pdfSource);
        expect((analysis["Proteine C reactive"] as LabValue).value).toBe(5.2);
        expect((analysis["Proteine C reactive"] as LabValue).unit).toBe("mg/L");
      });
    });
  });
});
