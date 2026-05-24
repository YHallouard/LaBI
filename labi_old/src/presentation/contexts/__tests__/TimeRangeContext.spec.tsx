import React from "react";
import { render, act } from "@testing-library/react-native";
import { View, Text } from "react-native";
import { TimeRangeProvider, useTimeRange } from "../TimeRangeContext";
import { TimeRangeOption } from "../../components/TimeRangeFAB";

// Test component that uses the TimeRange context
const TestComponent: React.FC = () => {
  const { selectedTimeRange, setSelectedTimeRange } = useTimeRange();

  return (
    <View>
      <Text testID="selected-time-range">{selectedTimeRange}</Text>
      <View testID="controls">
        <View testID="set-1y" onTouchEnd={() => setSelectedTimeRange("1y")} />
        <View testID="set-3y" onTouchEnd={() => setSelectedTimeRange("3y")} />
        <View testID="set-5y" onTouchEnd={() => setSelectedTimeRange("5y")} />
        <View testID="set-max" onTouchEnd={() => setSelectedTimeRange("Max")} />
      </View>
    </View>
  );
};

const renderWithTimeRangeProvider = () => {
  return render(
    <TimeRangeProvider>
      <TestComponent />
    </TimeRangeProvider>
  );
};

describe("TimeRangeContext", () => {
  describe("when TimeRangeProvider is rendered", () => {
    test("then it should provide default time range value", () => {
      // Given & When
      const { getByTestId } = renderWithTimeRangeProvider();

      // Then
      expect(getByTestId("selected-time-range")).toHaveTextContent("3y");
    });

    test("then it should render children without errors", () => {
      // Given & When
      const { getByTestId } = renderWithTimeRangeProvider();

      // Then
      expect(getByTestId("selected-time-range")).toBeTruthy();
      expect(getByTestId("controls")).toBeTruthy();
    });
  });

  describe("when useTimeRange is called outside provider", () => {
    test("then it should throw an error", () => {
      // Given
      const TestComponentOutsideProvider = () => {
        useTimeRange();
        return <View />;
      };

      // When & Then
      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow("useTimeRange must be used within a TimeRangeProvider");
    });
  });

  describe("when setSelectedTimeRange is called with 1y", () => {
    test("then it should update selectedTimeRange to 1y", () => {
      // Given
      const { getByTestId } = renderWithTimeRangeProvider();

      // When
      act(() => {
        getByTestId("set-1y").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("selected-time-range")).toHaveTextContent("1y");
    });
  });

  describe("when setSelectedTimeRange is called with 3y", () => {
    test("then it should update selectedTimeRange to 3y", () => {
      // Given
      const { getByTestId } = renderWithTimeRangeProvider();

      // When
      act(() => {
        getByTestId("set-3y").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("selected-time-range")).toHaveTextContent("3y");
    });
  });

  describe("when setSelectedTimeRange is called with 5y", () => {
    test("then it should update selectedTimeRange to 5y", () => {
      // Given
      const { getByTestId } = renderWithTimeRangeProvider();

      // When
      act(() => {
        getByTestId("set-5y").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("selected-time-range")).toHaveTextContent("5y");
    });
  });

  describe("when setSelectedTimeRange is called with Max", () => {
    test("then it should update selectedTimeRange to Max", () => {
      // Given
      const { getByTestId } = renderWithTimeRangeProvider();

      // When
      act(() => {
        getByTestId("set-max").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("selected-time-range")).toHaveTextContent("Max");
    });
  });

  describe("when multiple time range changes are performed", () => {
    test("then it should handle sequential changes correctly", () => {
      // Given
      const { getByTestId } = renderWithTimeRangeProvider();

      // When - Perform multiple time range changes
      act(() => {
        getByTestId("set-1y").props.onTouchEnd();
      });

      act(() => {
        getByTestId("set-5y").props.onTouchEnd();
      });

      act(() => {
        getByTestId("set-max").props.onTouchEnd();
      });

      act(() => {
        getByTestId("set-3y").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("selected-time-range")).toHaveTextContent("3y");
    });

    test("then it should maintain the last selected value", () => {
      // Given
      const { getByTestId } = renderWithTimeRangeProvider();

      // When - Change from default to 1y, then to Max
      act(() => {
        getByTestId("set-1y").props.onTouchEnd();
      });

      act(() => {
        getByTestId("set-max").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("selected-time-range")).toHaveTextContent("Max");
    });
  });

  describe("when TimeRangeProvider receives children", () => {
    test("then it should render children correctly", () => {
      // Given
      const TestChild = () => <Text testID="test-child">Child Component</Text>;

      // When
      const { getByTestId } = render(
        <TimeRangeProvider>
          <TestChild />
        </TimeRangeProvider>
      );

      // Then
      expect(getByTestId("test-child")).toBeTruthy();
      expect(getByTestId("test-child")).toHaveTextContent("Child Component");
    });
  });

  describe("when context values are accessed", () => {
    test("then it should provide the correct interface", () => {
      // Given
      const { getByTestId } = renderWithTimeRangeProvider();

      // When
      const selectedTimeRangeElement = getByTestId("selected-time-range");

      // Then
      expect(selectedTimeRangeElement).toBeTruthy();
      expect(typeof selectedTimeRangeElement.props.children).toBe("string");
    });
  });

  describe("when setSelectedTimeRange is called with invalid values", () => {
    test("then it should handle the value correctly", () => {
      // Given
      const TestComponentWithInvalidValue = () => {
        const { selectedTimeRange, setSelectedTimeRange } = useTimeRange();

        return (
          <View>
            <Text testID="selected-time-range">{selectedTimeRange}</Text>
            <View
              testID="set-invalid"
              onTouchEnd={() =>
                setSelectedTimeRange("invalid" as TimeRangeOption)
              }
            />
          </View>
        );
      };

      const { getByTestId } = render(
        <TimeRangeProvider>
          <TestComponentWithInvalidValue />
        </TimeRangeProvider>
      );

      // When
      act(() => {
        getByTestId("set-invalid").props.onTouchEnd();
      });

      // Then - Should still work even with invalid value
      expect(getByTestId("selected-time-range")).toHaveTextContent("invalid");
    });
  });

  describe("when multiple providers are nested", () => {
    test("then it should work correctly", () => {
      // Given
      const NestedTestComponent = () => {
        const { selectedTimeRange, setSelectedTimeRange } = useTimeRange();

        return (
          <View>
            <Text testID="nested-time-range">{selectedTimeRange}</Text>
            <View
              testID="nested-set-1y"
              onTouchEnd={() => setSelectedTimeRange("1y")}
            />
          </View>
        );
      };

      // When
      const { getByTestId } = render(
        <TimeRangeProvider>
          <View>
            <NestedTestComponent />
          </View>
        </TimeRangeProvider>
      );

      // Then
      expect(getByTestId("nested-time-range")).toHaveTextContent("3y");

      act(() => {
        getByTestId("nested-set-1y").props.onTouchEnd();
      });

      expect(getByTestId("nested-time-range")).toHaveTextContent("1y");
    });
  });
});
