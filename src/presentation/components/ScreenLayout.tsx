import React, { ReactNode } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, RefreshControl, StyleProp, ViewStyle } from 'react-native';

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
  backgroundColor = '#f5f7fb',
}) => {
  const containerStyle = { backgroundColor };

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      {scrollable ? (
        <ScrollableContent 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          style={style}
        >
          {children}
        </ScrollableContent>
      ) : (
        <StaticContent style={style}>
          {children}
        </StaticContent>
      )}
    </SafeAreaView>
  );
};

interface ContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const StaticContent: React.FC<ContentProps> = ({ children, style }) => (
  <View style={[styles.contentContainer, style]}>
    {children}
  </View>
);

interface ScrollableContentProps extends ContentProps {
  refreshing: boolean;
  onRefresh?: () => void;
}

const ScrollableContent: React.FC<ScrollableContentProps> = ({ 
  children, 
  style, 
  refreshing, 
  onRefresh 
}) => (
  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.scrollViewContent}
    showsVerticalScrollIndicator={false}
    refreshControl={createRefreshControl(refreshing, onRefresh)}
  >
    <View style={[styles.contentContainer, style]}>
      {children}
    </View>
  </ScrollView>
);

const createRefreshControl = (refreshing: boolean, onRefresh?: () => void) => {
  if (!onRefresh) return undefined;
  
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#2c7be5']}
      tintColor="#2c7be5"
      title="Pull to refresh..."
      titleColor="#95aac9"
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
    backgroundColor: 'transparent',
    paddingTop: 8,
  },
});
