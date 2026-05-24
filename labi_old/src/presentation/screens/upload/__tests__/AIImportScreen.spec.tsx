import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { AIImportScreen } from "../AIImportScreen";

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

describe("AIImportScreen", () => {
  it("shows the select button when api key is valid", () => {
    // Given
    const analyzePdfUseCase = {} as any;

    // When
    const { getByText } = render(
      <AIImportScreen
        analyzePdfUseCase={analyzePdfUseCase}
        isLoadingApiKey={false}
        apiKeyError={null}
        checkAndLoadApiKey={jest.fn()}
      />
    );

    // Then
    expect(getByText("Select & Analyze PDF")).toBeTruthy();
  });

  it("shows loading when isLoadingApiKey is true", () => {
    // When
    const { getByText } = render(
      <AIImportScreen
        analyzePdfUseCase={null}
        isLoadingApiKey={true}
        apiKeyError={null}
        checkAndLoadApiKey={jest.fn()}
      />
    );

    // Then
    expect(getByText("Loading configuration...")).toBeTruthy();
  });

  it("shows the api key error message when no valid key", () => {
    // When
    const { getByText } = render(
      <AIImportScreen
        analyzePdfUseCase={null}
        isLoadingApiKey={false}
        apiKeyError="API key not set"
        checkAndLoadApiKey={jest.fn()}
      />
    );

    // Then
    expect(getByText("API key not set")).toBeTruthy();
  });

  it("the select button is disabled when no valid api key", () => {
    const { getByText } = render(
      <AIImportScreen
        analyzePdfUseCase={null}
        isLoadingApiKey={false}
        apiKeyError="API key not set"
        checkAndLoadApiKey={jest.fn()}
      />
    );

    // When pressing the disabled button
    fireEvent.press(getByText("Select & Analyze PDF"));

    // Then: no PDF picker was opened (no crash, button is disabled)
    const DocumentPicker = require("expo-document-picker");
    expect(DocumentPicker.getDocumentAsync).not.toHaveBeenCalled();
  });
});
