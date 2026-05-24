import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { UploadScreen } from "../UploadScreen";

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
import { InMemoryBiologicalAnalysisRepository } from "../../../../adapters/repositories/InMemoryBiologicalAnalysisRepository";
import { CreateAnalysisUseCase } from "../../../../domain/usecases/CreateAnalysisUseCase";
import { GetReferenceRangeUseCase } from "../../../../domain/usecases/GetReferenceRangeUseCase";
import { ReferenceRangeCalculator } from "../../../../domain/services/ReferenceRangeCalculator";

jest.mock("../../../../presentation/components/AnalysisEditModal", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    AnalysisEditModal: ({ visible, title }: { visible: boolean; title: string }) =>
      visible
        ? React.createElement(View, { testID: "mock-modal" },
            React.createElement(Text, null, title))
        : null,
  };
});

const buildDeps = () => {
  const repo = new InMemoryBiologicalAnalysisRepository();
  const createAnalysisUseCase = new CreateAnalysisUseCase(repo);
  const calculator = new ReferenceRangeCalculator();
  const getReferenceRangeUseCase = new GetReferenceRangeUseCase(
    calculator,
    {} as any
  );
  return { createAnalysisUseCase, getReferenceRangeUseCase, repo };
};

describe("UploadScreen (choice page)", () => {
  beforeEach(() => { mockPush.mockClear(); mockBack.mockClear(); });

  it("renders two choice cards", () => {
    // Given
    const { createAnalysisUseCase, getReferenceRangeUseCase } = buildDeps();

    // When
    const { getByText } = render(
      <UploadScreen
        createAnalysisUseCase={createAnalysisUseCase}
        getReferenceRangeUseCase={getReferenceRangeUseCase}
      />
    );

    // Then
    expect(getByText("Import par IA")).toBeTruthy();
    expect(getByText("Import manuel")).toBeTruthy();
  });

  it("navigates to AIImportScreen when AI card is pressed", () => {
    // Given
    const { createAnalysisUseCase, getReferenceRangeUseCase } = buildDeps();

    const { getByText } = render(
      <UploadScreen
        createAnalysisUseCase={createAnalysisUseCase}
        getReferenceRangeUseCase={getReferenceRangeUseCase}
      />
    );

    // When
    fireEvent.press(getByText("Import par IA"));

    // Then
    expect(mockPush).toHaveBeenCalledWith("/upload/ai-import");
  });

  it("opens the manual modal when manual card is pressed", async () => {
    // Given
    const { createAnalysisUseCase, getReferenceRangeUseCase } = buildDeps();

    const { getByText, queryByTestId } = render(
      <UploadScreen
        createAnalysisUseCase={createAnalysisUseCase}
        getReferenceRangeUseCase={getReferenceRangeUseCase}
      />
    );

    expect(queryByTestId("mock-modal")).toBeNull();

    // When
    fireEvent.press(getByText("Import manuel"));

    // Then
    await waitFor(() => {
      expect(queryByTestId("mock-modal")).toBeTruthy();
    });
  });
});
