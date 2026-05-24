import React, { ReactNode } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const DEFAULT_GRADIENT: readonly [string, string, string] = [
  "#EEF2FB",
  "#F8F9FA",
  "#F4F0F8",
];

type ScreenLayoutProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollable?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
};

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  style,
  refreshing = false,
  onRefresh,
  scrollable = false,
  gradientColors = DEFAULT_GRADIENT,
}) => {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
      testID="screen-layout"
    >
      {scrollable ? (
        <ScrollableContent refreshing={refreshing} onRefresh={onRefresh} style={style}>
          {children}
        </ScrollableContent>
      ) : (
        <StaticContent style={style}>{children}</StaticContent>
      )}
    </LinearGradient>
  );
};

interface ContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const StaticContent: React.FC<ContentProps> = ({ children, style }) => (
  <View style={[styles.contentContainer, style]}>{children}</View>
);

interface ScrollableContentProps extends ContentProps {
  refreshing: boolean;
  onRefresh?: () => void;
}

const ScrollableContent: React.FC<ScrollableContentProps> = ({
  children,
  style,
  refreshing,
  onRefresh,
}) => (
  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.scrollViewContent}
    showsVerticalScrollIndicator={false}
    refreshControl={createRefreshControl(refreshing, onRefresh)}
  >
    <View style={[styles.contentContainer, style]}>{children}</View>
    <View style={styles.bottomSpacer} />
  </ScrollView>
);

const createRefreshControl = (refreshing: boolean, onRefresh?: () => void) => {
  if (!onRefresh) return undefined;

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={["#4A90E2"]}
      tintColor={"#4A90E2"}
      title="Pull to refresh..."
      titleColor={"#8E8E93"}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  bottomSpacer: {
    height: 90,
    ...Platform.select({
      android: {
        height: 120,
      },
    }),
  },
});
