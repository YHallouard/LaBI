import React from "react";
import { View, StyleSheet, LayoutChangeEvent, Platform } from "react-native";
import { useLinkBuilder } from "@react-navigation/native";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { RootTabParamList } from "../../types/navigation";
import { colorPalette, glass } from "../../config/themes";
import { TabBarButton } from "./TabBarButton";
import { useState, useEffect, JSX } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTabBar } from "../contexts/TabBarContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassSurface } from "./glass/GlassSurface";
import { GlassContainer } from "expo-glass-effect";

const Tab = createBottomTabNavigator<RootTabParamList>();

type Props = BottomTabBarProps & {
  leftButtons?: JSX.Element[];
  rightButtons?: JSX.Element[];
};

function TabBar({
  state,
  descriptors,
  navigation,
  leftButtons = [],
  rightButtons = [],
}: Props) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();
  const { animatedPosition } = useTabBar();

  const [dimensions, setDimensions] = useState({ height: 20, width: 100 });

  const buttonWidth = dimensions.width / state.routes.length;

  const onTabBarLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      height: e.nativeEvent.layout.height,
      width: e.nativeEvent.layout.width,
    });
  };

  const tabPositionX = useSharedValue(0);

  useEffect(() => {
    tabPositionX.value = withTiming(buttonWidth * state.index - 2, {
      duration: 300,
    });
  }, [state.index, buttonWidth]);

  const animatedTabStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: tabPositionX.value,
        },
      ],
    };
  });

  const animatedTabBarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: animatedPosition.value,
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.tabWrapper,
        { paddingBottom: insets.bottom || 10 },
        animatedTabBarStyle,
      ]}
    >
      <View style={styles.sideContainer}>
        {leftButtons.map((button, index) => (
          <View key={index} style={styles.sideButton}>
            {button}
          </View>
        ))}
      </View>

      <View style={styles.tabBarShadowContainer}>
        <GlassContainer spacing={8} style={styles.glassContainer}>
          <GlassSurface
            intensity={glass.blur.thick}
            tint="systemChromeMaterial"
            radius={glass.radii.pill}
            overlayColor={glass.overlay.light}
            style={styles.tabBar}
          >
          <View onLayout={onTabBarLayout} style={styles.tabBarInner}>
          <Animated.View
            style={[
              styles.currentTabIndicator,
              { height: dimensions.height - 12, width: buttonWidth - 18 },
              animatedTabStyle,
            ]}
          />
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            let labelString: string;
            if (typeof label === "function") {
              const labelResult = label({
                focused: isFocused,
                color: isFocused
                  ? colorPalette.neutral.white
                  : colorPalette.primary.main,
                position: "below-icon",
                children: route.name,
              });
              labelString =
                typeof labelResult === "string" ? labelResult : route.name;
            } else {
              labelString = typeof label === "string" ? label : route.name;
            }

            return (
              <TabBarButton
                key={route.name}
                href={buildHref(route.name, route.params)}
                accessibilityState={isFocused ? { selected: true } : undefined}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                isFocused={isFocused}
                routeName={route.name}
                color={
                  isFocused
                    ? colorPalette.neutral.white
                    : colorPalette.primary.main
                }
                label={labelString}
              />
            );
          })}
          </View>
          </GlassSurface>
        </GlassContainer>
      </View>

      <View style={styles.sideContainer}>
        {rightButtons.map((button, index) => (
          <View key={index} style={styles.sideButton}>
            {button}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// Export TabBar for testing
export { TabBar };

interface TabBarProps {
  homeStack: () => React.ReactElement;
  uploadStack: () => React.ReactElement;
  chartStack: () => React.ReactElement;
}

export const TabLayout: React.FC<TabBarProps> = ({
  homeStack,
  uploadStack,
  chartStack,
}) => {
  const { leftButtons: contextLeftButtons, rightButtons: contextRightButtons } =
    useTabBar();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      sceneContainerStyle={{ backgroundColor: "transparent" }}
      tabBar={(props) => {
        return (
          <TabBar
            {...props}
            leftButtons={contextLeftButtons}
            rightButtons={contextRightButtons}
          />
        );
      }}
    >
      <Tab.Screen name="Home" component={homeStack} />
      <Tab.Screen name="Upload" component={uploadStack} />
      <Tab.Screen name="Charts" component={chartStack} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "transparent",
    ...Platform.select({
      android: {
        bottom: 15,
      },
    }),
  },
  tabBarShadowContainer: {
    flex: 1,
    maxWidth: 800,
    borderRadius: glass.radii.pill,
    backgroundColor: "transparent",
    shadowColor: colorPalette.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowRadius: 20,
    shadowOpacity: 0.2,
    elevation: 20,
  },
  glassContainer: {
    flex: 1,
    borderRadius: glass.radii.pill,
  },
  tabBar: {
    borderRadius: glass.radii.pill,
  },
  tabBarInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  sideContainer: {
    width: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  sideButton: {
    marginHorizontal: 5,
    borderRadius: 28,
    shadowColor: colorPalette.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowRadius: 20,
    shadowOpacity: 0.2,
    elevation: 20,
  },
  currentTabIndicator: {
    position: "absolute",
    backgroundColor: colorPalette.primary.main,
    borderRadius: 30,
    marginHorizontal: 12,
    shadowColor: colorPalette.neutral.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
