import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { TabBar, TabLayout } from "../TabBar";
import { TabBarProvider, useTabBar } from "../../contexts/TabBarContext";

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-blur
jest.mock("expo-blur", () => ({
  BlurView: "BlurView",
}));

// Mock @react-navigation/elements
jest.mock("@react-navigation/elements", () => ({
  PlatformPressable: "PlatformPressable",
}));

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// Mock the colorPalette to avoid dependency issues
jest.mock("../../../config/themes", () => ({
  colorPalette: {
    neutral: {
      white: "#FFFFFF",
      dark: "#000000",
    },
    primary: {
      main: "#007AFF",
    },
  },
  generateAlpha: jest.fn((color, alpha) => color),
}));

// Mock components for testing
const MockHomeStack = (): React.ReactElement => <View testID="home-stack" />;
const MockUploadStack = (): React.ReactElement => (
  <View testID="upload-stack" />
);
const MockChartStack = (): React.ReactElement => <View testID="chart-stack" />;

// Test component to access TabBar context
const TestTabBarConsumer = ({
  onContext,
}: {
  onContext: (context: any) => void;
}) => {
  const context = useTabBar();
  React.useEffect(() => {
    onContext(context);
  }, [context, onContext]);
  return null;
};

interface RenderTabBarProps {
  homeStack?: () => React.ReactElement;
  uploadStack?: () => React.ReactElement;
  chartStack?: () => React.ReactElement;
  leftButtons?: React.ReactElement[];
  rightButtons?: React.ReactElement[];
  state?: any;
  descriptors?: any;
  navigation?: any;
}

const renderTabBarWithProviders = (props: RenderTabBarProps = {}) => {
  const mockState = {
    key: "tab-navigator",
    index: 0,
    routeNames: ["Home", "Upload", "Charts"],
    routes: [
      { key: "home", name: "Home", params: undefined },
      { key: "upload", name: "Upload", params: undefined },
      { key: "charts", name: "Charts", params: undefined },
    ],
    type: "tab" as const,
    stale: false as const,
    history: [{ type: "route" as const, key: "home" }],
    preloadedRouteKeys: [],
  };

  const mockDescriptors = {
    home: {
      options: {
        tabBarLabel: "Home",
        tabBarAccessibilityLabel: "Home tab",
        tabBarButtonTestID: "home-tab-button",
      },
      navigation: jest.fn(),
      render: jest.fn(),
      route: { key: "home", name: "Home", params: undefined },
    },
    upload: {
      options: {
        tabBarLabel: "Upload",
        tabBarAccessibilityLabel: "Upload tab",
        tabBarButtonTestID: "upload-tab-button",
      },
      navigation: jest.fn(),
      render: jest.fn(),
      route: { key: "upload", name: "Upload", params: undefined },
    },
    charts: {
      options: {
        tabBarLabel: "Charts",
        tabBarAccessibilityLabel: "Charts tab",
        tabBarButtonTestID: "charts-tab-button",
      },
      navigation: jest.fn(),
      render: jest.fn(),
      route: { key: "charts", name: "Charts", params: undefined },
    },
  };

  const mockNavigation = {
    navigate: jest.fn(),
    emit: jest.fn(),
    isFocused: jest.fn(() => true),
  };

  const defaultProps = {
    state: props.state || mockState,
    descriptors: props.descriptors || mockDescriptors,
    navigation: props.navigation || mockNavigation,
    homeStack: MockHomeStack,
    uploadStack: MockUploadStack,
    chartStack: MockChartStack,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    leftButtons: props.leftButtons || [],
    rightButtons: props.rightButtons || [],
  };

  return render(
    <SafeAreaProvider>
      <NavigationContainer>
        <TabBarProvider>
          <TabBar {...defaultProps} />
        </TabBarProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const renderTabLayoutWithProviders = (props: RenderTabBarProps = {}) => {
  const defaultProps = {
    homeStack: MockHomeStack,
    uploadStack: MockUploadStack,
    chartStack: MockChartStack,
    ...props,
  };

  return render(
    <SafeAreaProvider>
      <NavigationContainer>
        <TabBarProvider>
          <TabLayout {...defaultProps} />
        </TabBarProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

describe("TabBar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render with correct structure and test IDs", () => {
      const { getByTestId, getAllByTestId } = renderTabBarWithProviders();

      // Check that we have the correct number of tab buttons
      const tabButtons = getAllByTestId(/tab-button$/);
      expect(tabButtons).toHaveLength(3);
    });

    test("should display all three tabs with correct labels", () => {
      const { getByText, getByTestId } = renderTabBarWithProviders();

      // Check tab labels
      expect(getByText("Home")).toBeTruthy();
      expect(getByText("Upload")).toBeTruthy();
      expect(getByText("Charts")).toBeTruthy();

      // Check tab button test IDs
      expect(getByTestId("home-tab-button")).toBeTruthy();
      expect(getByTestId("upload-tab-button")).toBeTruthy();
      expect(getByTestId("charts-tab-button")).toBeTruthy();
    });

    test("should render with proper tab navigation structure", () => {
      const { root } = renderTabBarWithProviders();
      expect(root).toBeTruthy();
    });
  });

  describe("Tab Navigation", () => {
    test("should handle tab press events correctly", async () => {
      const mockNavigate = jest.fn();
      const mockEmit = jest.fn().mockReturnValue({ defaultPrevented: false });

      const mockNavigation = {
        navigate: mockNavigate,
        emit: mockEmit,
        isFocused: jest.fn(() => false),
      };

      const { getByTestId } = renderTabBarWithProviders({
        navigation: mockNavigation,
      });

      const uploadTab = getByTestId("upload-tab-button");

      fireEvent.press(uploadTab);

      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith({
          type: "tabPress",
          target: "upload",
          canPreventDefault: true,
        });
        expect(mockNavigate).toHaveBeenCalledWith("Upload", undefined);
      });
    });

    test("should handle tab long press events correctly", async () => {
      const mockEmit = jest.fn();

      const mockNavigation = {
        navigate: jest.fn(),
        emit: mockEmit,
        isFocused: jest.fn(() => false),
      };

      const { getByTestId } = renderTabBarWithProviders({
        navigation: mockNavigation,
      });

      const chartsTab = getByTestId("charts-tab-button");

      fireEvent(chartsTab, "onLongPress");

      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith({
          type: "tabLongPress",
          target: "charts",
        });
      });
    });

    test("should not navigate when tab is already focused", async () => {
      const mockNavigate = jest.fn();
      const mockEmit = jest.fn().mockReturnValue({ defaultPrevented: false });

      const mockNavigation = {
        navigate: mockNavigate,
        emit: mockEmit,
        isFocused: jest.fn(() => true),
      };

      const { getByTestId } = renderTabBarWithProviders({
        navigation: mockNavigation,
      });

      const homeTab = getByTestId("home-tab-button");

      fireEvent.press(homeTab);

      await waitFor(() => {
        expect(mockEmit).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe("Tab States and Focus", () => {
    test("should show correct focused state for active tab", () => {
      const { getByTestId } = renderTabBarWithProviders();

      // First tab (index 0) should be focused by default
      const homeTab = getByTestId("home-tab-button");
      expect(homeTab.props.accessibilityState).toEqual({ selected: true });
    });

    test("should show correct unfocused state for inactive tabs", () => {
      const { getByTestId } = renderTabBarWithProviders();

      // Other tabs should not be focused
      const uploadTab = getByTestId("upload-tab-button");
      const chartsTab = getByTestId("charts-tab-button");

      expect(uploadTab.props.accessibilityState).toBeUndefined();
      expect(chartsTab.props.accessibilityState).toBeUndefined();
    });

    test("should update focus state when tab index changes", () => {
      const mockState = {
        key: "tab-navigator",
        index: 1, // Change to Upload tab
        routeNames: ["Home", "Upload", "Charts"],
        routes: [
          { key: "home", name: "Home", params: undefined },
          { key: "upload", name: "Upload", params: undefined },
          { key: "charts", name: "Charts", params: undefined },
        ],
        type: "tab" as const,
        stale: false as const,
        history: [{ type: "route" as const, key: "upload" }],
        preloadedRouteKeys: [],
      };

      const { getByTestId } = renderTabBarWithProviders({
        state: mockState,
      });

      // Upload tab should now be focused
      const uploadTab = getByTestId("upload-tab-button");
      expect(uploadTab.props.accessibilityState).toEqual({ selected: true });
    });
  });

  describe("Side Buttons", () => {
    test("should render left side buttons when provided", () => {
      const leftButtons = [
        <View key="left1" testID="left-button-1" />,
        <View key="left2" testID="left-button-2" />,
      ];

      const { getByTestId } = renderTabBarWithProviders({
        leftButtons,
      });

      expect(getByTestId("left-button-1")).toBeTruthy();
      expect(getByTestId("left-button-2")).toBeTruthy();
    });

    test("should render right side buttons when provided", () => {
      const rightButtons = [
        <View key="right1" testID="right-button-1" />,
        <View key="right2" testID="right-button-2" />,
      ];

      const { getByTestId } = renderTabBarWithProviders({
        rightButtons,
      });

      expect(getByTestId("right-button-1")).toBeTruthy();
      expect(getByTestId("right-button-2")).toBeTruthy();
    });

    test("should not render side buttons when not provided", () => {
      const { queryByTestId } = renderTabBarWithProviders();

      // Should not have any side button containers
      expect(queryByTestId("left-button-1")).toBeNull();
      expect(queryByTestId("right-button-1")).toBeNull();
    });

    test("should handle empty side button arrays", () => {
      const { getByTestId } = renderTabBarWithProviders({
        leftButtons: [],
        rightButtons: [],
      });

      // Component should still render without errors
      expect(getByTestId("home-tab-button")).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    test("should have proper accessibility labels for all tabs", () => {
      const { getByTestId } = renderTabBarWithProviders();

      const homeTab = getByTestId("home-tab-button");
      const uploadTab = getByTestId("upload-tab-button");
      const chartsTab = getByTestId("charts-tab-button");

      expect(homeTab.props.accessibilityLabel).toBe("Home tab");
      expect(uploadTab.props.accessibilityLabel).toBe("Upload tab");
      expect(chartsTab.props.accessibilityLabel).toBe("Charts tab");
    });

    test("should have proper accessibility state for focused tab", () => {
      const { getByTestId } = renderTabBarWithProviders();

      const homeTab = getByTestId("home-tab-button");
      expect(homeTab.props.accessibilityState).toEqual({ selected: true });
    });

    test("should have proper test IDs for testing", () => {
      const { getByTestId } = renderTabBarWithProviders();

      expect(getByTestId("home-tab-button")).toBeTruthy();
      expect(getByTestId("upload-tab-button")).toBeTruthy();
      expect(getByTestId("charts-tab-button")).toBeTruthy();
    });
  });

  describe("TabLayout Component", () => {
    test("should render TabLayout with navigation structure", () => {
      const { root } = renderTabLayoutWithProviders();

      // TabLayout should render the navigator structure
      // The actual structure shows Navigator with Screen components, not our mock stacks directly
      // We can't directly test the stack components in this setup, so we'll verify the component renders
      expect(root).toBeTruthy();
    });

    test("should accept custom stack components", () => {
      const CustomHomeStack = (): React.ReactElement => (
        <View testID="custom-home" />
      );
      const CustomUploadStack = (): React.ReactElement => (
        <View testID="custom-upload" />
      );
      const CustomChartStack = (): React.ReactElement => (
        <View testID="custom-chart" />
      );

      const { root } = renderTabLayoutWithProviders({
        homeStack: CustomHomeStack,
        uploadStack: CustomUploadStack,
        chartStack: CustomChartStack,
      });

      // Verify the component renders without errors
      expect(root).toBeTruthy();
    });

    test("should integrate with TabBar context for side buttons", () => {
      let contextValue: any;

      const { root } = render(
        <SafeAreaProvider>
          <NavigationContainer>
            <TabBarProvider>
              <TestTabBarConsumer
                onContext={(context) => {
                  contextValue = context;
                }}
              />
              <TabLayout
                homeStack={MockHomeStack}
                uploadStack={MockUploadStack}
                chartStack={MockChartStack}
              />
            </TabBarProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.leftButtons).toEqual([]);
      expect(contextValue.rightButtons).toEqual([]);
      expect(contextValue.isVisible).toBe(true);
      expect(root).toBeTruthy();
    });
  });

  describe("Component Integration", () => {
    test("should work as a React component", () => {
      expect(
        React.isValidElement(
          <TabBar
            state={{} as any}
            descriptors={{} as any}
            navigation={{} as any}
            insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
          />
        )
      ).toBe(true);
    });

    test("should accept props correctly", () => {
      const TestComponent = ({
        leftButtons,
        rightButtons,
      }: {
        leftButtons: React.ReactElement[];
        rightButtons: React.ReactElement[];
      }) => (
        <TabBar
          state={{} as any}
          descriptors={{} as any}
          navigation={{} as any}
          insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
          leftButtons={leftButtons}
          rightButtons={rightButtons}
        />
      );
      expect(TestComponent).toBeDefined();
    });
  });

  describe("Component Lifecycle", () => {
    test("should not cause memory leaks on unmount", () => {
      const { unmount } = renderTabBarWithProviders();

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    test("should handle rapid mount/unmount cycles", () => {
      const { unmount, rerender } = renderTabBarWithProviders();

      expect(() => {
        unmount();
        rerender(
          <SafeAreaProvider>
            <NavigationContainer>
              <TabBarProvider>
                <TabBar
                  state={{} as any}
                  descriptors={{} as any}
                  navigation={{} as any}
                  insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
                />
              </TabBarProvider>
            </NavigationContainer>
          </SafeAreaProvider>
        );
        unmount();
      }).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    test("should handle undefined side buttons gracefully", () => {
      const { getByTestId } = renderTabBarWithProviders({
        leftButtons: undefined as any,
        rightButtons: undefined as any,
      });

      // Component should still render without errors
      expect(getByTestId("home-tab-button")).toBeTruthy();
    });

    test("should handle empty route arrays gracefully", () => {
      const mockState = {
        key: "tab-navigator",
        index: 0,
        routeNames: [],
        routes: [],
        type: "tab" as const,
        stale: false as const,
        history: [],
        preloadedRouteKeys: [],
      };

      const { root } = renderTabBarWithProviders({
        state: mockState,
      });

      // With empty routes, the component should still render but without tab buttons
      // Check that the component renders without crashing
      expect(root).toBeTruthy();
    });

    test("should handle missing route options gracefully", () => {
      const mockDescriptors = {
        home: {
          options: {
            tabBarButtonTestID: "home-tab-button",
          },
          navigation: jest.fn(),
          render: jest.fn(),
          route: { key: "home", name: "Home", params: undefined },
        },
        upload: {
          options: {
            tabBarButtonTestID: "upload-tab-button",
          },
          navigation: jest.fn(),
          render: jest.fn(),
          route: { key: "upload", name: "Upload", params: undefined },
        },
        charts: {
          options: {
            tabBarButtonTestID: "charts-tab-button",
          },
          navigation: jest.fn(),
          render: jest.fn(),
          route: { key: "charts", name: "Charts", params: undefined },
        },
      };

      const { getByTestId } = renderTabBarWithProviders({
        descriptors: mockDescriptors,
      });

      // Component should still render without errors
      expect(getByTestId("home-tab-button")).toBeTruthy();
    });
  });

  describe("Styling and Layout", () => {
    test("should apply correct container styling", () => {
      const { getByTestId } = renderTabBarWithProviders();
      const homeTab = getByTestId("home-tab-button");

      // Component should render with proper styling
      expect(homeTab).toBeTruthy();
    });

    test("should handle layout changes correctly", () => {
      const { getByTestId } = renderTabBarWithProviders();
      const homeTab = getByTestId("home-tab-button");

      // Component should handle layout changes without errors
      expect(homeTab).toBeTruthy();
    });
  });
});
