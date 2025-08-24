import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { ZoomInWrapper } from "../ZoomInWrapper";

describe("ZoomInWrapper", () => {
  it("renders children correctly", () => {
    const { getByText } = render(
      <ZoomInWrapper>
        <Text>Test Content</Text>
      </ZoomInWrapper>
    );

    expect(getByText("Test Content")).toBeTruthy();
  });

  it("applies custom duration and delay", () => {
    const { getByText } = render(
      <ZoomInWrapper duration={1000} delay={500}>
        <Text>Test Content</Text>
      </ZoomInWrapper>
    );

    expect(getByText("Test Content")).toBeTruthy();
  });

  it("applies custom scale values", () => {
    const { getByText } = render(
      <ZoomInWrapper initialScale={0.1} finalScale={1.2}>
        <Text>Test Content</Text>
      </ZoomInWrapper>
    );

    expect(getByText("Test Content")).toBeTruthy();
  });

  it("applies custom style", () => {
    const customStyle = { backgroundColor: "red" };
    const { getByText } = render(
      <ZoomInWrapper style={customStyle}>
        <Text>Test Content</Text>
      </ZoomInWrapper>
    );

    expect(getByText("Test Content")).toBeTruthy();
  });
});
