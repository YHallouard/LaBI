import React from 'react';
import { ActivityIndicator, Pressable, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radii } from '../tokens';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<Variant, { bg: string; fg: string; borderColor?: string }> = {
  primary: { bg: colors.primary, fg: colors.textOnColor },
  secondary: { bg: colors.secondary, fg: colors.textOnColor },
  danger: { bg: colors.danger, fg: colors.textOnColor },
  ghost: { bg: 'transparent', fg: colors.primary, borderColor: colors.primary },
};

const sizeStyles: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number; radius: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13, radius: radii.sm },
  md: { paddingVertical: 12, paddingHorizontal: 22, fontSize: 15, radius: radii.md },
  lg: { paddingVertical: 15, paddingHorizontal: 28, fontSize: 16, radius: radii.md },
};

export function PrimaryButton({ children, onPress, disabled, loading, variant = 'primary', size = 'md', style }: Props) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isDisabled ? colors.primaryDisabled : v.bg,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: s.radius,
          borderWidth: v.borderColor ? 1.5 : 0,
          borderColor: v.borderColor,
          opacity: pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={v.fg} style={{ marginRight: 6 }} />}
      <Text style={[styles.label, { color: v.fg, fontSize: s.fontSize }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '600',
  },
});
