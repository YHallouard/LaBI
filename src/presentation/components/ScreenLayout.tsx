import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../design-system/tokens';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function ScreenLayout({ children, scrollable = true, style, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top;
  const paddingBottom = insets.bottom + 32;

  if (scrollable) {
    return (
      <View style={[styles.root, { paddingTop }, style]}>
        <ScrollView
          contentContainerStyle={[{ paddingBottom }, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop, paddingBottom }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
