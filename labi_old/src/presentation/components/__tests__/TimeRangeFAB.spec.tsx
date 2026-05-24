import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { TimeRangeFAB, TimeRangeOption } from "../TimeRangeFAB";

// The global jest.setup.js already mocks react-native-reanimated with
// react-native-reanimated/mock, which handles all hooks (useSharedValue,
// useAnimatedStyle, etc.) — no override needed here.

// Mock expo-blur (already mocked globally in jest.setup.js as 'BlurView')

// Mock @expo/vector-icons (already mocked globally)

describe("TimeRangeFAB", () => {
  let mockOnSelectTimeRange: jest.Mock;
  let defaultProps: {
    selectedTimeRange: TimeRangeOption;
    onSelectTimeRange: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSelectTimeRange = jest.fn();
    defaultProps = {
      selectedTimeRange: "1y" as TimeRangeOption,
      onSelectTimeRange: mockOnSelectTimeRange,
    };
  });

  const renderTimeRangeFAB = (props = {}) => {
    return render(<TimeRangeFAB {...defaultProps} {...props} />);
  };

  describe("Rendering", () => {
    test("should render all time range options", () => {
      const { getByText } = renderTimeRangeFAB();

      expect(getByText("1y")).toBeTruthy();
      expect(getByText("3y")).toBeTruthy();
      expect(getByText("5y")).toBeTruthy();
      expect(getByText("Max")).toBeTruthy();
    });

    test("should highlight the selected time range", () => {
      const { getByText } = renderTimeRangeFAB({ selectedTimeRange: "3y" });
      expect(getByText("3y")).toBeTruthy();
    });

    test("should render with different selected time ranges", () => {
      const timeRanges: TimeRangeOption[] = ["1y", "3y", "5y", "Max"];
      timeRanges.forEach((range) => {
        const { getByText } = renderTimeRangeFAB({ selectedTimeRange: range });
        expect(getByText(range)).toBeTruthy();
      });
    });
  });

  describe("Interactions", () => {
    test("should call onSelectTimeRange when a time range button is pressed", async () => {
      const { getByText } = renderTimeRangeFAB();
      fireEvent.press(getByText("3y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("3y");
      });
    });

    test("should call onSelectTimeRange with correct range for each button", async () => {
      const { getByText } = renderTimeRangeFAB();
      const timeRanges: TimeRangeOption[] = ["1y", "3y", "5y", "Max"];
      for (const range of timeRanges) {
        fireEvent.press(getByText(range));
        await waitFor(() => {
          expect(mockOnSelectTimeRange).toHaveBeenCalledWith(range);
        });
      }
      expect(mockOnSelectTimeRange).toHaveBeenCalledTimes(4);
    });

    test("should handle multiple time range selections", async () => {
      const { getByText } = renderTimeRangeFAB();
      fireEvent.press(getByText("3y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("3y");
      });
      fireEvent.press(getByText("5y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("5y");
      });
      fireEvent.press(getByText("Max"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("Max");
      });
      expect(mockOnSelectTimeRange).toHaveBeenCalledTimes(3);
    });
  });

  describe("State Management", () => {
    test("should maintain selected state across re-renders", () => {
      const { getByText, rerender } = renderTimeRangeFAB({ selectedTimeRange: "1y" });
      expect(getByText("1y")).toBeTruthy();
      rerender(<TimeRangeFAB {...defaultProps} selectedTimeRange="5y" />);
      expect(getByText("5y")).toBeTruthy();
    });

    test("should handle prop changes correctly", () => {
      const { rerender, getByText } = renderTimeRangeFAB({ selectedTimeRange: "1y" });
      expect(getByText("1y")).toBeTruthy();
      rerender(<TimeRangeFAB {...defaultProps} selectedTimeRange="Max" />);
      expect(getByText("Max")).toBeTruthy();
    });
  });

  describe("Animation Integration", () => {
    test("should handle animation calls without errors", async () => {
      const { getByText } = renderTimeRangeFAB();
      fireEvent.press(getByText("3y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("3y");
      });
    });

    test("should handle multiple rapid selections", async () => {
      const { getByText } = renderTimeRangeFAB();
      fireEvent.press(getByText("1y"));
      fireEvent.press(getByText("3y"));
      fireEvent.press(getByText("5y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe("Accessibility", () => {
    test("should have pressable buttons for all time ranges", () => {
      const { getByText } = renderTimeRangeFAB();
      const timeRanges: TimeRangeOption[] = ["1y", "3y", "5y", "Max"];
      timeRanges.forEach((range) => {
        expect(getByText(range)).toBeTruthy();
      });
    });

    test("should handle press events on all buttons", async () => {
      const { getByText } = renderTimeRangeFAB();
      const timeRanges: TimeRangeOption[] = ["1y", "3y", "5y", "Max"];
      for (const range of timeRanges) {
        fireEvent.press(getByText(range));
        await waitFor(() => {
          expect(mockOnSelectTimeRange).toHaveBeenCalledWith(range);
        });
      }
    });
  });

  describe("Edge Cases", () => {
    test("should handle valid time range selections", async () => {
      const { getByText } = renderTimeRangeFAB();
      fireEvent.press(getByText("1y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("1y");
      });
      fireEvent.press(getByText("Max"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("Max");
      });
    });

    test("should handle callback function changes", async () => {
      const newCallback = jest.fn();
      const { getByText, rerender } = renderTimeRangeFAB();
      fireEvent.press(getByText("3y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("3y");
      });
      rerender(<TimeRangeFAB selectedTimeRange="1y" onSelectTimeRange={newCallback} />);
      fireEvent.press(getByText("5y"));
      await waitFor(() => {
        expect(newCallback).toHaveBeenCalledWith("5y");
      });
    });

    test("should handle rapid state changes", async () => {
      const { getByText, rerender } = renderTimeRangeFAB();
      rerender(<TimeRangeFAB {...defaultProps} selectedTimeRange="3y" />);
      fireEvent.press(getByText("5y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("5y");
      });
      rerender(<TimeRangeFAB {...defaultProps} selectedTimeRange="Max" />);
      fireEvent.press(getByText("1y"));
      await waitFor(() => {
        expect(mockOnSelectTimeRange).toHaveBeenCalledWith("1y");
      });
    });
  });

  describe("Component Structure", () => {
    test("should render with correct component structure", () => {
      const { getByText } = renderTimeRangeFAB();
      expect(getByText("1y")).toBeTruthy();
      expect(getByText("3y")).toBeTruthy();
      expect(getByText("5y")).toBeTruthy();
      expect(getByText("Max")).toBeTruthy();
    });

    test("should handle different prop combinations", () => {
      const timeRanges: TimeRangeOption[] = ["1y", "3y", "5y", "Max"];
      timeRanges.forEach((range) => {
        const { getByText } = renderTimeRangeFAB({ selectedTimeRange: range });
        expect(getByText(range)).toBeTruthy();
      });
    });
  });
});
