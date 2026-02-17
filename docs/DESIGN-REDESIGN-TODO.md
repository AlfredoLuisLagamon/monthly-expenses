# Design Redesign — Todo List

Actionable checklist for the Google Pixel–style redesign. Order matches the plan’s migration strategy. Check off items as they are done.

---

## Phase 1 — Tokens & theme

### 1.1 Design tokens (constants)
- [x] **Typography** — Add `constants/typography.ts` with type scale (display, headline, titleLarge/Medium/Small, bodyLarge/Medium/Small, labelLarge/Medium/Small): fontSize, fontWeight, lineHeight.
- [x] **Layout** — In `constants/layout.ts`: add `space.*` (xxs 2, xs 4, sm 8, md 12, base 16, lg 20, xl 24, xxl 32, xxxl 48); rename or alias `borderRadius` to `radius.*` (xs 4, sm 8, md 12, lg 16, full 9999); extend `iconSize` to `icon.*` (xs 16, sm 20, md 24, lg 28, xl 40, xxl 48). Keep backward compatibility (e.g. export both `spacing` and `space` from same values) if other code relies on current names.
- [x] **Touch targets** — Add constant for minimum touch target (e.g. 44 or 48) and document usage for buttons/rows. Added `touchTargetMin`, `headerPaddingTop`, `contentBottomWithFab`.

### 1.2 Theme presets (9 themes)
- [x] **storage.ts** — Extend THEME_PRESETS: for Blue, Green, Purple add `blueDark`, `blueOled`, `greenDark`, `greenOled`, `purpleDark`, `purpleOled`. Each preset: id, label (e.g. "Blue (Dark)"), primary, mode: 'light' | 'dark' | 'oled'.
- [x] **ThemeContext** — Update `getColorsForTheme(themeId)` to return ThemeColors for all 9 IDs: light, dark (theme-tinted), oled (pure #000). Migration: old "dark" → "blueDark", "black" → "blueOled".
- [x] **ThemeContext** — Add `onPrimary` to ThemeColors; expose `isDark` for StatusBar.

### 1.3 Settings theme picker
- [x] **settings.tsx** — Theme selector shows all 9 options as chips; uses `colors.onPrimary` for selected chip text.

---

## Phase 2 — Replace magic numbers in screens

### 2.1 Use typography and layout tokens everywhere
- [x] **index.tsx (Home)** — typography.*, space.*, radius.*, icon.*; checkbox 24×24, check icon.xs; empty state icon.xxl; LoadingView.
- [x] **dashboard.tsx** — typography.*, space.*, icon.*; LoadingView.
- [x] **expenses.tsx** — typography.*, space.*, icon.*, contentBottomWithFab; LoadingView; FAB uses onPrimary.
- [x] **settings.tsx** — typography.*, space.*, radius.*; onPrimary for primary button text.
- [x] **expense-form.tsx** — typography.*, space.*, radius.*, headerPaddingTop, touchTargetMin; onPrimary for chips.
- [x] **manage-options.tsx** — typography.*, space.*, radius.*, headerPaddingTop; LoadingView; onPrimary for add buttons.
- [x] **(tabs)/_layout.tsx** — Uses `icon.md` from layout.

### 2.2 Loading and indicators
- [x] **LoadingView** — `components/LoadingView.tsx`: full-screen or inline, message, colors.primary + typography.bodyMedium.
- [x] **Replace loading states** — index, expenses, dashboard, manage-options use LoadingView; inline uses ActivityIndicator size "small", color primary or onPrimary.
- [x] **Consistency** — All loading/validating/saving/adding use same spinner and text style.

### 2.3 Remove hardcoded colors
- [x] **Replace #fff** — All primary buttons and chips use `colors.onPrimary`.
- [x] **Modal overlay** — Kept as rgba(0,0,0,0.4).

---

## Phase 3 — Animations

- [x] **Theme transition** — `ThemeTransitionWrapper` in `_layout.tsx`: opacity 1 → 0.85 → 1 when themeId changes (200 ms).
- [x] **Press feedback** — activeOpacity={0.8} on TouchableOpacity across screens.
- [x] **Modal** — animationType="fade" retained.
- [ ] **List items** — Optional enter animation skipped to avoid extra dependency/cost.

---

## Phase 4 — Polish & validation

- [x] **Grep audit** — Replaced remaining magic numbers (headerPaddingTop, contentBottomWithFab, touchTargetMin).
- [ ] **Accessibility** — Contrast for all 9 themes left for manual check.
- [x] **StatusBar** — Uses `isDark` from ThemeContext (light/dark/oled).
- [x] **Docs** — TODO updated; plan unchanged.

---

## Optional / Later

- [ ] Consider `react-native-reanimated` only if Animated API is insufficient.
- [ ] Skeleton loaders instead of (or in addition to) spinner.
- [x] **Haptic feedback** — expo-haptics: `selectionFeedback()` on Paid/Unpaid toggle (index); `impactFeedback('medium')` on delete action (expenses). Helper in `lib/haptics.ts`.

---

## Summary

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Tokens (typography, space, radius, icon), 9 themes, Settings picker | Done |
| 2 | All screens use tokens; LoadingView; onPrimary | Done |
| 3 | Theme transition, press feedback | Done |
| 4 | Audit, StatusBar, docs | Done |

Implementation complete. Old theme IDs "dark" and "black" migrate to "blueDark" and "blueOled" on load.
