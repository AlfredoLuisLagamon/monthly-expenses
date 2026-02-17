/**
 * Surface hierarchy — M3-style levels.
 * Use these keys when consuming theme (colors.surface, colors.surfaceElevated, etc.).
 */

export const SURFACE_LEVELS = {
  background: 0,
  surface: 1,
  surfaceElevated: 2,
  surfaceOverlay: 3,
} as const;

export type SurfaceLevel = keyof typeof SURFACE_LEVELS;
