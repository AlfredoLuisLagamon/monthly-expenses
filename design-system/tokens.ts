import { Platform } from 'react-native';

/**
 * Design tokens — single source of truth.
 * 8pt grid throughout. Material 3 / Pixel-aligned.
 */

/** 8pt grid spacing (Material 3) */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

/** Legacy names for migration */
export const spacing = {
  xxs: space[1],
  xs: space[1],
  sm: space[2],
  md: space[3],
  base: space[4],
  lg: space[5],
  xl: space[6],
  xxl: space[8],
  xxxl: space[12],
} as const;

/** Corner radius — M3 shape scale */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 28,
  full: 9999,
} as const;

/** Icon size scale */
export const icon = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 40,
  xxl: 48,
} as const;

/** Minimum touch target (44dp M3) */
export const touchTargetMin = 44;

/** Content bottom padding when FAB or bottom bar is present */
export const contentBottomWithFab = 88;

/** Top padding for in-screen headers (status + safe area) */
export const headerPaddingTop = 56;

/** Typography scale — use by role */
export const fontSize = {
  display: 36,
  headline: 24,
  titleLarge: 22,
  titleMedium: 16,
  titleSmall: 14,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  labelLarge: 14,
  labelMedium: 12,
  labelSmall: 11,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  display: 44,
  headline: 32,
  titleLarge: 28,
  titleMedium: 24,
  titleSmall: 20,
  bodyLarge: 24,
  bodyMedium: 20,
  bodySmall: 16,
  labelLarge: 20,
  labelMedium: 16,
  labelSmall: 16,
} as const;

export const typography = {
  display: { fontSize: fontSize.display, fontWeight: fontWeight.bold, lineHeight: lineHeight.display },
  headline: { fontSize: fontSize.headline, fontWeight: fontWeight.semibold, lineHeight: lineHeight.headline },
  titleLarge: { fontSize: fontSize.titleLarge, fontWeight: fontWeight.semibold, lineHeight: lineHeight.titleLarge },
  titleMedium: { fontSize: fontSize.titleMedium, fontWeight: fontWeight.semibold, lineHeight: lineHeight.titleMedium },
  titleSmall: { fontSize: fontSize.titleSmall, fontWeight: fontWeight.semibold, lineHeight: lineHeight.titleSmall },
  bodyLarge: { fontSize: fontSize.bodyLarge, fontWeight: fontWeight.regular, lineHeight: lineHeight.bodyLarge },
  bodyMedium: { fontSize: fontSize.bodyMedium, fontWeight: fontWeight.regular, lineHeight: lineHeight.bodyMedium },
  bodySmall: { fontSize: fontSize.bodySmall, fontWeight: fontWeight.regular, lineHeight: lineHeight.bodySmall },
  labelLarge: { fontSize: fontSize.labelLarge, fontWeight: fontWeight.medium, lineHeight: lineHeight.labelLarge },
  labelMedium: { fontSize: fontSize.labelMedium, fontWeight: fontWeight.medium, lineHeight: lineHeight.labelMedium },
  labelSmall: { fontSize: fontSize.labelSmall, fontWeight: fontWeight.medium, lineHeight: lineHeight.labelSmall },
} as const;

/**
 * Surface elevation — level 0 (background) through 3 (overlay).
 * Android: elevation dp; iOS: shadow.
 */
export const elevation = {
  /** Level 1: cards, list containers */
  surface: Platform.select({
    android: { elevation: 1 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    default: {},
  }),
  /** Level 2: raised buttons, chips */
  raised: Platform.select({
    android: { elevation: 2 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    default: {},
  }),
  /** Level 3: FAB, dropdowns */
  overlay: Platform.select({
    android: { elevation: 4 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    default: {},
  }),
  /** Level 4: modal, nav drawer */
  modal: Platform.select({
    android: { elevation: 6 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    default: {},
  }),
} as const;

/** Motion — durations in ms */
export const motion = {
  fast: 150,
  normal: 200,
  slow: 250,
} as const;
