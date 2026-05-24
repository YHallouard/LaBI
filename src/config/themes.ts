// Compatibility shim — new code should import from src/design-system/tokens directly
export { colors, spacing, radii, elevation, motion, glass } from '../design-system/tokens';

// Legacy aliases used by recycled settings screens
import { colors } from '../design-system/tokens';

export const colorPalette = {
  primary: { main: colors.primary, light: colors.primaryTint, dark: colors.primaryPressed, disabled: colors.primaryDisabled },
  secondary: { main: colors.secondary, light: colors.secondaryTint, dark: colors.secondaryHover },
  neutral: {
    dark: colors.textStrong,
    main: colors.textBody,
    light: colors.textFaint,
    lighter: colors.textMuted,
    white: '#FFFFFF',
    background: colors.bg,
  },
  danger: { main: colors.danger, light: colors.dangerTint },
  success: { main: colors.success, dark: colors.successDeep, light: colors.successTint },
  warning: { main: colors.warning, dark: colors.warningDeep, light: colors.warningTint },
  background: { primary: colors.bg, secondary: colors.bgBlue, elevated: colors.bgElevated },
  border: { main: colors.border, strong: colors.borderStrong },
  feedback: {
    success: { main: colors.success, dark: colors.successDeep, light: colors.successTint },
    error: { main: colors.danger, light: colors.dangerTint },
    warning: { main: colors.warning, dark: colors.warningDeep, light: colors.warningTint },
    info: { main: colors.primary, light: colors.primaryTint },
  },
};

export const theme = {
  colors: colorPalette,
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 },
  borderRadius: { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 },
};

export const generateAlpha = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};
