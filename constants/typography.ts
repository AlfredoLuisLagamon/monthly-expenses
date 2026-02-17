/** M3-inspired type scale — use by role, not ad-hoc sizes */
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

/** One-stop style objects for common roles (for StyleSheet or inline) */
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
