import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ChoiceCard } from "../ChoiceCard";

describe("ChoiceCard", () => {
  const defaultProps = {
    title: "Import par IA",
    subtitle: "Importez un PDF",
    iconName: "sparkles" as const,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the title and subtitle", () => {
    // Given / When
    const { getByText } = render(<ChoiceCard {...defaultProps} />);

    // Then
    expect(getByText("Import par IA")).toBeTruthy();
    expect(getByText("Importez un PDF")).toBeTruthy();
  });

  it("renders the badge when provided", () => {
    // Given / When
    const { getByText } = render(
      <ChoiceCard {...defaultProps} badge="Recommandé" />
    );

    // Then
    expect(getByText("Recommandé")).toBeTruthy();
  });

  it("does not render a badge when not provided", () => {
    // Given / When
    const { queryByText } = render(<ChoiceCard {...defaultProps} />);

    // Then
    expect(queryByText("Recommandé")).toBeNull();
  });

  it("renders the hint when provided", () => {
    // Given / When
    const { getByText } = render(
      <ChoiceCard {...defaultProps} hint="~30 sec" />
    );

    // Then
    expect(getByText("~30 sec")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    // Given
    const onPress = jest.fn();
    const { getByText } = render(
      <ChoiceCard {...defaultProps} onPress={onPress} />
    );

    // When
    fireEvent.press(getByText("Import par IA"));

    // Then
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
