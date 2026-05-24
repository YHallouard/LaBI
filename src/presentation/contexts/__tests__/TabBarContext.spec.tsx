import React from "react";
import { render, act } from "@testing-library/react-native";
import { View, Text } from "react-native";
import { TabBarProvider, useTabBar } from "../TabBarContext";

// Mock react-native-reanimated
let mockSharedValue = { value: 0 };
jest.mock("react-native-reanimated", () => ({
  useSharedValue: jest.fn(() => mockSharedValue),
  withTiming: jest.fn((value: number) => {
    mockSharedValue.value = value;
    return value;
  }),
}));

// Test component that uses the TabBar context
const TestComponent: React.FC = () => {
  const {
    leftButtons,
    rightButtons,
    isVisible,
    animatedPosition,
    setLeftButtons,
    setRightButtons,
    clearButtons,
    hideTabBar,
    showTabBar,
  } = useTabBar();

  return (
    <View>
      <Text testID="is-visible">{isVisible.toString()}</Text>
      <Text testID="animated-position">
        {animatedPosition.value.toString()}
      </Text>
      <View testID="left-buttons">
        {leftButtons.map((button, index) => (
          <View key={index} testID={`left-button-${index}`}>
            {button}
          </View>
        ))}
      </View>
      <View testID="right-buttons">
        {rightButtons.map((button, index) => (
          <View key={index} testID={`right-button-${index}`}>
            {button}
          </View>
        ))}
      </View>
      <View testID="controls">
        <View
          testID="set-left-buttons"
          onTouchEnd={() =>
            setLeftButtons([
              <Text key="1">Left1</Text>,
              <Text key="2">Left2</Text>,
            ])
          }
        />
        <View
          testID="set-right-buttons"
          onTouchEnd={() =>
            setRightButtons([
              <Text key="1">Right1</Text>,
              <Text key="2">Right2</Text>,
            ])
          }
        />
        <View testID="clear-buttons" onTouchEnd={clearButtons} />
        <View testID="hide-tab-bar" onTouchEnd={hideTabBar} />
        <View testID="show-tab-bar" onTouchEnd={showTabBar} />
      </View>
    </View>
  );
};

const renderWithTabBarProvider = () => {
  return render(
    <TabBarProvider>
      <TestComponent />
    </TabBarProvider>
  );
};

describe("TabBarContext", () => {
  beforeEach(() => {
    // Reset mock shared value before each test
    mockSharedValue = { value: 0 };
  });
  describe("when TabBarProvider is rendered", () => {
    test("then it should provide default values", () => {
      // Given & When
      const { getByTestId } = renderWithTabBarProvider();

      // Then
      expect(getByTestId("is-visible")).toHaveTextContent("true");
      expect(getByTestId("animated-position")).toHaveTextContent("0");
    });

    test("then it should render children without errors", () => {
      // Given & When
      const { getByTestId } = renderWithTabBarProvider();

      // Then
      expect(getByTestId("is-visible")).toBeTruthy();
      expect(getByTestId("animated-position")).toBeTruthy();
      expect(getByTestId("left-buttons")).toBeTruthy();
      expect(getByTestId("right-buttons")).toBeTruthy();
      expect(getByTestId("controls")).toBeTruthy();
    });
  });

  describe("when useTabBar is called outside provider", () => {
    test("then it should throw an error", () => {
      // Given
      const TestComponentOutsideProvider = () => {
        useTabBar();
        return <View />;
      };

      // When & Then
      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow("useTabBar must be used within a TabBarProvider");
    });
  });

  describe("when setLeftButtons is called", () => {
    test("then it should update left buttons state", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When
      act(() => {
        getByTestId("set-left-buttons").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("left-button-0")).toBeTruthy();
      expect(getByTestId("left-button-1")).toBeTruthy();
    });

    test("then it should render the correct number of left buttons", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When
      act(() => {
        getByTestId("set-left-buttons").props.onTouchEnd();
      });

      // Then
      const leftButtonsContainer = getByTestId("left-buttons");
      expect(leftButtonsContainer.children).toHaveLength(2);
    });
  });

  describe("when setRightButtons is called", () => {
    test("then it should update right buttons state", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When
      act(() => {
        getByTestId("set-right-buttons").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("right-button-0")).toBeTruthy();
      expect(getByTestId("right-button-1")).toBeTruthy();
    });

    test("then it should render the correct number of right buttons", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When
      act(() => {
        getByTestId("set-right-buttons").props.onTouchEnd();
      });

      // Then
      const rightButtonsContainer = getByTestId("right-buttons");
      expect(rightButtonsContainer.children).toHaveLength(2);
    });
  });

  describe("when clearButtons is called", () => {
    test("then it should clear both left and right buttons", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When - First set buttons, then clear them
      act(() => {
        getByTestId("set-left-buttons").props.onTouchEnd();
        getByTestId("set-right-buttons").props.onTouchEnd();
      });

      act(() => {
        getByTestId("clear-buttons").props.onTouchEnd();
      });

      // Then
      const leftButtonsContainer = getByTestId("left-buttons");
      const rightButtonsContainer = getByTestId("right-buttons");
      expect(leftButtonsContainer.children).toHaveLength(0);
      expect(rightButtonsContainer.children).toHaveLength(0);
    });
  });

  describe("when hideTabBar is called", () => {
    test("then it should set isVisible to false", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When
      act(() => {
        getByTestId("hide-tab-bar").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("is-visible")).toHaveTextContent("false");
    });

    test("then it should animate the position to 150", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When
      act(() => {
        getByTestId("hide-tab-bar").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("animated-position")).toHaveTextContent("150");
    });
  });

  describe("when showTabBar is called", () => {
    test("then it should set isVisible to true", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When - First hide, then show
      act(() => {
        getByTestId("hide-tab-bar").props.onTouchEnd();
      });

      act(() => {
        getByTestId("show-tab-bar").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("is-visible")).toHaveTextContent("true");
    });

    test("then it should animate the position to 0", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When - First hide, then show
      act(() => {
        getByTestId("hide-tab-bar").props.onTouchEnd();
      });

      act(() => {
        getByTestId("show-tab-bar").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("animated-position")).toHaveTextContent("0");
    });
  });

  describe("when multiple operations are performed", () => {
    test("then it should handle complex state changes correctly", () => {
      // Given
      const { getByTestId } = renderWithTabBarProvider();

      // When - Perform multiple operations
      act(() => {
        getByTestId("set-left-buttons").props.onTouchEnd();
        getByTestId("hide-tab-bar").props.onTouchEnd();
        getByTestId("set-right-buttons").props.onTouchEnd();
        getByTestId("show-tab-bar").props.onTouchEnd();
        getByTestId("clear-buttons").props.onTouchEnd();
      });

      // Then
      expect(getByTestId("is-visible")).toHaveTextContent("true");
      expect(getByTestId("animated-position")).toHaveTextContent("0");
      expect(getByTestId("left-buttons").children).toHaveLength(0);
      expect(getByTestId("right-buttons").children).toHaveLength(0);
    });
  });

  describe("when TabBarProvider receives children", () => {
    test("then it should render children correctly", () => {
      // Given
      const TestChild = () => <Text testID="test-child">Child Component</Text>;

      // When
      const { getByTestId } = render(
        <TabBarProvider>
          <TestChild />
        </TabBarProvider>
      );

      // Then
      expect(getByTestId("test-child")).toBeTruthy();
      expect(getByTestId("test-child")).toHaveTextContent("Child Component");
    });
  });
});
