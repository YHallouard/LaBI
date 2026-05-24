import { StyleSheet, TextStyle } from 'react-native';
import { colors } from './tokens';

const base: TextStyle = {
  fontFamily: undefined, // uses system default: SF Pro (iOS) / Roboto (Android)
};

export const typography = StyleSheet.create({
  display: {
    ...base,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    color: colors.textStrong,
    letterSpacing: -0.64,
  },
  h1: {
    ...base,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 29,
    color: colors.textStrong,
    letterSpacing: -0.24,
  },
  h2: {
    ...base,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    color: colors.textStrong,
  },
  h3: {
    ...base,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 27,
    color: colors.textStrong,
  },
  lead: {
    ...base,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
    color: colors.textStrong,
  },
  body: {
    ...base,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 23,
    color: colors.textBody,
  },
  small: {
    ...base,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textBody,
  },
  caption: {
    ...base,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: colors.textFaint,
    letterSpacing: 0.24,
  },
  label: {
    ...base,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.66,
    color: colors.textFaint,
    textTransform: 'uppercase',
  },
  value: {
    ...base,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    // tabular-nums for numeric alignment
    fontVariant: ['tabular-nums'],
  },
  valueAlert: {
    ...base,
    fontSize: 22,
    fontWeight: '700',
    color: colors.danger,
    fontVariant: ['tabular-nums'],
  },
  valueLg: {
    ...base,
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.56,
  },
});
