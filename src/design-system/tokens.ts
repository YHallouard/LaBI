import { Platform, ViewStyle } from 'react-native';

export const colors = {
  primary: '#2C7BE5',
  primaryHover: '#1F66C9',
  primaryPressed: '#1856AC',
  primaryDisabled: '#A0C7F0',
  primaryTint: '#EEF2FB',

  secondary: '#00B4A6',
  secondaryHover: '#009489',
  secondaryTint: '#E3F7F5',

  // LOGO ONLY — never use on buttons or backgrounds
  gradient: { from: '#E5363F', mid: '#CE5283', to: '#C255DF' },

  text: '#212529',
  textStrong: '#12263F',
  textBody: '#5A7184',
  textMuted: '#ADB5BD',
  textFaint: '#95AAC9',
  textOnColor: '#FFFFFF',

  bg: '#F8F9FA',
  bgBlue: '#EEF2FB',
  bgViolet: '#F4F0F8',
  bgElevated: '#FFFFFF',
  bgScrim: 'rgba(18,38,63,0.35)',

  border: '#E3EBF6',
  borderStrong: '#D6DEEA',
  divider: '#ECECEC',

  success: '#6DD39A',
  successDeep: '#00A86B',
  successTint: 'rgba(0,217,126,0.10)',

  warning: '#FFC107',
  warningDeep: '#856404',
  warningTint: '#FFF3CD',

  danger: '#E5363F',
  dangerTint: 'rgba(229,54,63,0.10)',

  labAlert: '#CE5283',
  labAlertTint: 'rgba(206,82,131,0.10)',

  glassFill: 'rgba(255,255,255,0.62)',
  glassFillStrong: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(255,255,255,0.55)',

  chartLine: '#4484B2',
  chartPointAlert: '#E5363F',
  chartRangeFill: 'rgba(0,200,0,0.15)',
  chartRangeStroke: '#00C800',
  chartGrid: '#ECECEC',
  chartAxisLabel: '#95AAC9',
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 22,
  pill: 9999,
} as const;

const shadowColor = '#12263F';

export const elevation = {
  1: Platform.select({
    ios: { shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
    android: { elevation: 1 },
    default: {},
  }) as ViewStyle,
  2: Platform.select({
    ios: { shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4 },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  3: Platform.select({
    ios: { shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  4: Platform.select({
    ios: { shadowColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24 },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle,
  fab: Platform.select({
    ios: { shadowColor: '#2C7BE5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.40, shadowRadius: 14 },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle,
} as const;

export const motion = {
  durFast: 150,
  durBase: 250,
  durSlow: 400,
} as const;

export const glass = {
  blur: {
    thin: 16,
    regular: 24,
    thick: 28,
  },
  radii: {
    sm: radii.lg,
    md: radii.xl,
    lg: radii['2xl'],
    pill: radii.pill,
  },
  overlay: {
    light: 'rgba(255,255,255,0.55)',
    medium: 'rgba(255,255,255,0.62)',
    strong: 'rgba(255,255,255,0.78)',
    android: 'rgba(255,255,255,0.92)',
  },
} as const;
