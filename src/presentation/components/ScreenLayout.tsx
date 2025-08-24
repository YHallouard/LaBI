import React, { ReactNode } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from "react-native";
import { colorPalette } from "../../config/themes";
import { Platform } from "react-native";

type ScreenLayoutProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollable?: boolean;
  backgroundColor?: string;
};

export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  style,
  refreshing = false,
  onRefresh,
  scrollable = false,
  backgroundColor = colorPalette.neutral.background,
}) => {
  const containerStyle = [styles.container, { backgroundColor }];

  return (
    <View style={containerStyle} testID="screen-layout">
      {scrollable ? (
        <ScrollableContent
          refreshing={refreshing}
          onRefresh={onRefresh}
          style={style}
        >
          {children}
        </ScrollableContent>
      ) : (
        <StaticContent style={style}>{children}</StaticContent>
      )}
    </View>
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
      colors={[colorPalette.primary.main]}
      tintColor={colorPalette.primary.main}
      title="Pull to refresh..."
      titleColor={colorPalette.neutral.light}
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
