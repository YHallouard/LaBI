import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { EmptyState } from "../EmptyState";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../../types/navigation";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

const mockNavigation: StackNavigationProp<HomeStackParamList, "HomeScreen"> = {
  navigate: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("EmptyState Component", () => {
  it("renders correctly with given props", () => {
    const { getByText, getByTestId } = render(
      <EmptyState
        navigation={mockNavigation}
        message="No data available"
        subMessage="Please upload a report"
        iconName="file-tray-outline"
      />
    );

    expect(getByText("No data available")).toBeTruthy();
    expect(getByText("Please upload a report")).toBeTruthy();
    expect(getByTestId("icon")).toBeTruthy();
  });

  it("navigates to Upload screen on button press", () => {
    const { getByText } = render(
      <EmptyState
        navigation={mockNavigation}
        message="No data available"
        subMessage="Please upload a report"
        iconName="file-tray-outline"
      />
    );

    fireEvent.press(getByText("Upload Report"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Upload");
  });
});
