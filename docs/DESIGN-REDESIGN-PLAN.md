# Design Redesign Plan — Google Pixel–style, Dark & OLED

This document plans the design system overhaul: Google Pixel / Material 3–inspired look, dedicated dark and OLED dark per theme color, senior-level spacing/typography, and consistent animations.

---

## 1. Current State Summary

### 1.1 Theme System
- **Location:** `constants/storage.ts` (THEME_PRESETS), `contexts/ThemeContext.tsx` (getColorsForTheme).
- **Presets:** Blue, Green, Purple (light only), plus Dark and Black (generic dark; not per-color).
- **Derived colors:** background, surface, text, textSecondary, paid, unpaid, border. Dark/black use fixed slategray (#0f172a, #1e1b4b, etc.); OLED uses #000000 background and #1f1f1f border.
- **Gap:** No “Blue Dark”, “Blue OLED”, “Green Dark”, etc. User wants each hue to have its own light, dark, and OLED dark variant.

### 1.2 Layout & Sizing
- **Location:** `constants/layout.ts`.
- **Spacing:** 2, 4, 8, 12, 16, 20, 24, 32 (partially 4/8 grid; 12 and 20 break strict 8dp).
- **Border radius:** 8, 12, 16, 9999.
- **Icons:** sm 20, md 24, lg 28.
- **Usage:** Layout constants are used in most screens, but many **font sizes and dimensions are hardcoded** in StyleSheets (e.g. 12, 13, 14, 16, 18, 20; checkbox 28×28; empty-state icon 48).

### 1.3 Typography
- No central type scale. Font sizes scattered: 12, 13, 14, 16, 18, 20. Weights: '500', '600', '700'. No line-height or letter-spacing tokens.

### 1.4 Loading & Icons
- **ActivityIndicator:** size "small" or "large"; color varies (primary, #fff, unpaid). No shared loading component or duration.
- **Icons:** MaterialCommunityIcons; mix of `iconSize.sm/md/lg` and hardcoded 16, 24, 48. No standard for empty-state vs in-line icon sizes.

### 1.5 Animations
- Only `Modal` uses `animationType="fade"`. No enter/exit or micro-interactions (e.g. list items, toggles, buttons).

### 1.6 Screens Touched
- **Tabs:** `(tabs)/_layout.tsx` — tab bar and header use theme.
- **Pages:** `(tabs)/index.tsx`, `(tabs)/dashboard.tsx`, `(tabs)/expenses.tsx`, `(tabs)/settings.tsx`, `expense-form.tsx`, `manage-options.tsx`.
- **Root:** `_layout.tsx` — StatusBar.

---

## 2. Design Direction: Google Pixel & Material 3

### 2.1 Principles
- **Material 3 / Pixel:** Clear hierarchy, 8dp (and 4dp for fine alignment) grid, type scale by role, consistent motion.
- **OLED:** Offer a true-black variant per theme for battery and contrast; use #000000 background and near-black surfaces (#0a0a0a–#0d0d0d) with minimal borders (#1a1a1a–#1f1f1f).
- **Senior designer approach:** One spacing scale, one type scale, one icon scale; all UI values reference tokens (no magic numbers in screens).

### 2.2 Theme Model (per color: light, dark, OLED)

**Proposed theme IDs (extend THEME_PRESETS):**

| Base color | Light ID   | Dark ID      | OLED ID        |
|-----------|------------|--------------|----------------|
| Blue      | blue       | blueDark     | blueOled       |
| Green     | green      | greenDark    | greenOled      |
| Purple    | purple     | purpleDark   | purpleOled     |

**Semantics:**
- **Light:** White/off-white background, light surfaces, dark text (current blue/green/purple behavior).
- **Dark:** Dark gray background (e.g. #1c1b1f or theme-tinted dark), elevated surfaces, light text; primary and surfaces tinted by theme.
- **OLED:** Pure black background (#000000), very dark surfaces (#0a0a0a–#0d0d0d), light text, same primary hue; borders and surfaces tuned for OLED (no heavy grays that light pixels).

**Storage:** One `themeId` (e.g. `blue`, `blueDark`, `blueOled`). ThemeContext and Settings show all 9 presets (or group by “Blue / Green / Purple” with “Light / Dark / OLED” sub-options).

### 2.3 Color Tokens (per theme)

Keep and derive from preset:
- `primary` — from preset (used for CTAs, active states, links).
- `background` — screen background (light: #f8fafc–#fafafa; dark: #1c1b1f–#1e1e2e; OLED: #000000).
- `surface` — cards, list rows, inputs (light: #ffffff / tinted; dark: #2d2b32 / tinted; OLED: #0a0a0a–#0d0d0d).
- `text`, `textSecondary` — (light: dark on light; dark/OLED: light on dark).
- `paid`, `unpaid` — status (can be same or slightly tuned for dark/OLED contrast).
- `border` — (light: #e2e8f0; dark: #3d3d3d; OLED: #1a1a1a–#1f1f1f).
- Optional: `surfaceVariant`, `onPrimary` (e.g. #fff on primary buttons) for consistency.

---

## 3. Design Tokens (Single Source of Truth)

### 3.1 Spacing (4dp base, 8dp dominant)

Align to 4dp for fine control and 8dp for blocks (Material layout).

| Token   | Value (dp) | Use |
|---------|------------|-----|
| space.xxs | 2  | Tight inlines (e.g. icon–label gap) |
| space.xs  | 4  | Inline spacing, small gaps |
| space.sm  | 8  | Between related elements, list item padding |
| space.md  | 12 | Between sections, input padding |
| space.base| 16| Standard padding, list row padding |
| space.lg  | 20| Section spacing |
| space.xl  | 24| Screen padding, large gaps |
| space.xxl | 32| Major section separation |
| space.xxxl| 48| Empty state, hero areas |

Current 20 → keep as space.lg; 12 → space.md. All new values from this scale only.

### 3.2 Typography (M3-inspired type scale)

Single scale; map roles to styles. Approximate scale (sp):

| Role            | Size (sp) | Weight   | Use |
|-----------------|-----------|----------|-----|
| display         | 36        | 700      | (Future) hero / onboarding |
| headline        | 24        | 600      | Screen title, card headline |
| titleLarge      | 22        | 600      | Modal title, section title |
| titleMedium     | 16        | 600      | List row title, card title |
| titleSmall      | 14        | 600      | Small headings |
| bodyLarge       | 16        | 400      | Primary body |
| bodyMedium      | 14        | 400      | Secondary body, meta |
| bodySmall       | 12        | 400      | Captions, hints |
| labelLarge      | 14        | 500      | Buttons, chips, labels |
| labelMedium     | 12        | 500      | Small labels, sort text |
| labelSmall      | 11        | 500      | Overlines, tags |

**Implementation:** `constants/typography.ts` (or inside `layout.ts`) exporting e.g. `fontSize`, `fontWeight`, `lineHeight` by role. Components use `typography.titleMedium` instead of `fontSize: 16, fontWeight: '600'`. Replace all ad-hoc 12/13/14/16/18/20 with these tokens.

### 3.3 Icon Sizes

| Token        | Size (dp) | Use |
|--------------|-----------|-----|
| icon.xs      | 16        | Inline with text, checkmarks in checkboxes |
| icon.sm      | 20        | Buttons, sort, toolbar |
| icon.md      | 24        | Tab bar, FAB icon, list actions (default) |
| icon.lg      | 28        | Card icons, section icons |
| icon.xl      | 40        | Empty state, onboarding |
| icon.xxl     | 48        | Large empty state |

Replace hardcoded 16, 24, 48 with tokens. Standardize empty state to icon.xl or icon.xxl app-wide.

### 3.4 Border Radius (M3 shape)

| Token   | Value (dp) | Use |
|---------|------------|-----|
| radius.xs | 4  | Chips, small buttons |
| radius.sm | 8  | Cards, list rows, inputs, buttons |
| radius.md | 12 | Modals, sheets |
| radius.lg | 16 | Large cards |
| radius.full | 9999 | Pills, avatars |

### 3.5 Component-Specific Sizes
- **Checkbox:** 24×24 (touch target 44×44 with padding) — use icon.xs (16) for check mark.
- **FAB:** min height 56, padding from space; icon icon.md.
- **Touch targets:** min 44×44 (or 48) for primary actions.

---

## 4. Animations

### 4.1 Where to Add
- **Screen/List:** Optional subtle list item mount (e.g. fade + slight translate) or at least consistent timing.
- **Modals:** Keep fade; optional scale or slide from bottom for bottom-sheet feel.
- **Loading:** Single shared loading view with optional subtle pulse or skeleton instead of only spinner.
- **Toggle/Buttons:** Light scale or opacity on press (e.g. 0.96 scale or 0.9 opacity).
- **Theme switch:** Optional short crossfade (e.g. 200–300 ms) when themeId changes.

### 4.2 Implementation
- Prefer **React Native Animated API** first (no new dependency); if needed later, consider `react-native-reanimated` for more complex motion.
- **Durations:** 150 ms (micro), 200 ms (standard), 300 ms (modal/transition).
- **Easing:** ease-in-out or Material-style standard curve where applicable.

### 4.3 Uniform Loading
- One **LoadingView** component: optional spinner + message; use `colors.primary` for spinner, `typography.bodyMedium` + `colors.textSecondary` for message.
- All “Loading…” and “Validating…” states use this component and same `ActivityIndicator` size (e.g. large for full-screen, small for inline).

---

## 5. File & Code Structure

### 5.1 New/Updated Files
- **constants/storage.ts** — Extend THEME_PRESETS to 9 entries (blue, blueDark, blueOled, green, …) with metadata (e.g. `mode: 'light' | 'dark' | 'oled'`).
- **constants/layout.ts** — Expand to full token set: spacing (as space.*), borderRadius (as radius.*), iconSize (as icon.*), add touch target min.
- **constants/typography.ts** — New: type scale by role (fontSize, fontWeight, lineHeight).
- **contexts/ThemeContext.tsx** — getColorsForTheme() for all 9 themes; map each themeId to full ThemeColors (including OLED #000 background where applicable).
- **components/LoadingView.tsx** (optional but recommended) — Centered spinner + text; props: message, fullScreen.
- **components/** — Any shared animated wrapper (e.g. PressableScale) if we add press animation.

### 5.2 Screens (apply tokens only)
- Replace every hardcoded fontSize with typography.*.
- Replace every hardcoded spacing number with space.* (or existing spacing.* renamed to space.*).
- Replace every hardcoded icon size with icon.*.
- Replace checkbox 28 with 24 and check icon with icon.xs.
- Use LoadingView wherever loading state is shown.
- Ensure ActivityIndicator size and color consistent (large + primary for full-screen; small + primary or onPrimary for buttons).

### 5.3 Settings Theme Picker
- Show 9 options. Optionally group: “Blue (Light / Dark / OLED)”, “Green (Light / Dark / OLED)”, “Purple (Light / Dark / OLED)” with clear labels so users understand “Dark” and “OLED” per color.

---

## 6. Migration Strategy

1. **Phase 1 — Tokens & theme**
   - Add typography.ts and extend layout.ts (space, radius, icon).
   - Extend THEME_PRESETS and getColorsForTheme for 9 themes (light/dark/OLED per color).
   - Update ThemeContext and Settings UI to support new theme IDs.
2. **Phase 2 — Replace magic numbers**
   - In each screen, replace fontSize → typography, spacing numbers → space/radius/icon.
   - Introduce LoadingView and use it everywhere loading is shown.
3. **Phase 3 — Animations**
   - Add 200 ms theme transition (background/surface fade) if feasible.
   - Add press feedback (opacity or scale) on primary buttons and list rows.
   - Optional: list item enter animation or modal slide.
4. **Phase 4 — Polish**
   - Accessibility: contrast check for each theme (especially OLED).
   - Remove any remaining hardcoded sizes; run a final grep for numeric style values.

---

## 7. Success Criteria

- Every theme color (Blue, Green, Purple) has Light, Dark, and OLED variants; user can choose any of 9.
- All spacing, font size, icon size, and radius come from constants (no raw numbers in screen StyleSheets for layout/type).
- Loading and icons (sizes, colors) are uniform across the app.
- Subtle, consistent animations on theme change, primary actions, and modals where it makes sense.
- OLED variants use true black (#000000) background and near-black surfaces for battery and contrast.

---

## 8. References

- Material Design 3: design tokens, layout (8dp/4dp), typography.
- Pixel / Material You: clear hierarchy, motion, theming.
- OLED: pure black for background; dark gray (#121212) does not save as much as #000000 on OLED.
