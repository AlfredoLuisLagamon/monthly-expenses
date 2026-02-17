import { Platform } from 'react-native';

/** 4dp/8dp grid — single source for spacing (Pixel / M3) */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Backward compatibility */
export const spacing = space;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

/** Backward compatibility */
export const borderRadius = radius;

export const icon = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 40,
  xxl: 48,
} as const;

/** Backward compatibility */
export const iconSize = { sm: icon.sm, md: icon.md, lg: icon.lg };

/** Minimum touch target (dp) for buttons and tappable rows */
export const touchTargetMin = 44;

/** Top padding for in-screen headers (status/safe area) */
export const headerPaddingTop = 56;

/** Content bottom padding when a FAB or bottom bar is present */
export const contentBottomWithFab = 88;

/** Material-style elevation: level 1 (cards), 2 (raised), 3 (FAB/modal) */
export const elevation = {
  /** Cards, list containers */
  card: Platform.select({
    android: { elevation: 2 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    default: {},
  }),
  /** Raised buttons, chips */
  raised: Platform.select({
    android: { elevation: 3 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    default: {},
  }),
  /** FAB, modal */
  overlay: Platform.select({
    android: { elevation: 6 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    default: {},
  }),
} as const;
