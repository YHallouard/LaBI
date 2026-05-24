import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { EmptyState } from "../EmptyState";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("EmptyState Component", () => {
  beforeEach(() => mockPush.mockClear());

  it("renders correctly with given props", () => {
    const { getByText } = render(
      <EmptyState
        message="No data available"
        subMessage="Please upload a report"
        iconName="file-tray-outline"
      />
    );

    expect(getByText("No data available")).toBeTruthy();
    expect(getByText("Please upload a report")).toBeTruthy();
    expect(getByText("Upload Report")).toBeTruthy();
  });

  it("navigates to upload screen on button press", () => {
    const { getByText } = render(
      <EmptyState
        message="No data available"
        subMessage="Please upload a report"
        iconName="file-tray-outline"
      />
    );

    fireEvent.press(getByText("Upload Report"));
    expect(mockPush).toHaveBeenCalledWith("/upload");
  });
});
