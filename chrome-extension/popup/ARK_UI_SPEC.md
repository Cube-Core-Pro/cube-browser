# Ark-Inspired Popup Design Spec

## 1. Design Principles
- **Calm density**: maximum clarity on a 600×680 canvas using layered surfaces and 12/16 px rhythm.
- **Frosted glass layering**: base panels with subtle blur + tint to mirror the Tauri shell while remaining Chromium-safe.
- **Soft contrast**: muted neutrals with precise accent bursts to highlight actions and statuses.
- **Reduced chrome**: minimize outlines and uppercase text; rely on typographic hierarchy and icon glyph shape language.
- **Motion restraint**: only opacity/translate transitions under 180ms; no scaling on press.

## 2. Visual Tokens
| Group | Token | Value | Notes |
| --- | --- | --- | --- |
| Base | `--color-bg-base` | `#05060a` | Matches Ark dark slate backdrop.
|  | `--color-surface-1` | `rgba(18, 20, 26, 0.85)` | Primary surface with blur.
|  | `--color-surface-2` | `rgba(26, 29, 38, 0.9)` | Cards/panels.
| Accents | `--color-accent` | `#7dd3fc` | Cyan highlight.
|  | `--color-accent-strong` | `#38bdf8` | Buttons/active tabs.
|  | `--color-accent-muted` | `rgba(125, 211, 252, 0.18)` | Pills, indicators.
| Status | `--color-success` | `#4ade80` | Soft green.
|  | `--color-warning` | `#fbbf24` | Amber.
|  | `--color-error` | `#f87171` | Coral red.
| Text | `--color-text-primary` | `#f8fafc` | 0.92 opacity.
|  | `--color-text-secondary` | `rgba(248, 250, 252, 0.72)` | Body text.
|  | `--color-text-tertiary` | `rgba(248, 250, 252, 0.5)` | Meta.
| Borders | `--color-border` | `rgba(248, 250, 252, 0.08)` | General outlines.
|  | `--color-border-strong` | `rgba(248, 250, 252, 0.16)` | Tab underline.
| Shadows | `--shadow-soft` | `0 12px 30px rgba(5, 6, 10, 0.55)` | Cards.
|  | `--shadow-focus` | `0 0 0 1px rgba(125, 211, 252, 0.45), 0 8px 20px rgba(0, 0, 0, 0.35)` | Focus ring.
| Blur | `--blur-surface` | `16px` | Backdrop blur.
| Radii | `--radius-lg` | `20px` | Cards.
|  | `--radius-md` | `14px` | Buttons, fields.
|  | `--radius-sm` | `10px` | Pills.
| Spacing | `--space-2` | `8px` |
|  | `--space-3` | `12px` |
|  | `--space-4` | `16px` |
|  | `--space-6` | `24px` |
| Motion | `--motion-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` |
|  | `--motion-normal` | `220ms cubic-bezier(0.4, 0, 0.2, 1)` |

## 3. Typography
- **Primary font**: `"Sora", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- **Sizes**:
  - Title (`h1`): 18px / 120% / 600 weight.
  - Section heading (`h2`): 15px / 140% / 600 weight.
  - Body: 13px / 150% / 500 weight.
  - Meta: 12px / 140% / 400 weight, uppercase letter spacing 0.08em only where needed.
- **Numerics** use tabular features via `font-variant-numeric: tabular-nums` on stats.

## 4. Layout
- Container uses `padding: 20px` with `gap: 16px` between header, tabs, content.
- Tabs convert to pill row with glass background, each tab `height: 38px`, `border-radius: 999px`.
- Content area splits into stacked panels: Stats (glass), Document grid (auto rows), Activity (scrollable) with `max-height: 260px` list.
- Settings reorganized into `SurfaceCard` sections with inline toggles (custom switch) and slider row with label/value grid.

## 5. Component Patterns
### 5.1 Buttons
- Ghost button default (transparent + blur) for icon actions.
- Primary button uses gradient `linear-gradient(120deg, #67e8f9, #38bdf8)` with white text; `box-shadow: var(--shadow-soft)`.
- Secondary button uses `--color-surface-2` background and accent border.
- Remove uppercase transformation; rely on sentence case.

### 5.2 Tabs
- Active tab: accent gradient border, subtle glow via `box-shadow: 0 8px 20px rgba(56, 189, 248, 0.3)`.
- Inactive: text-secondary, hover raises opacity.
- Keyboard focus uses `--shadow-focus`.

### 5.3 Cards (PDF list)
- Convert to two-column grid if width allows (min 280px). Each card uses `display: grid; grid-template-columns: auto 1fr auto;` with accent stripe on left via pseudo element.
- Icon pod becomes monochrome glyph with accent circle background.
- Action buttons collapse into `Primary (Parse/Autofill)` + ghost icon for open.

### 5.4 Status Pills
- Pill background uses status color at 12% opacity, text uses solid status color.
- Add dot indicator via `::before` to keep consistent.

### 5.5 Stats Bar
- Replace rectangular bar with `SurfaceCard` featuring three mini tiles: each tile uses `font-variant-numeric`, includes label, value, delta arrow (optional) using accent color.

### 5.6 History List
- Card background `--color-surface-2`, left border replaced by gradient line.
- Provide icon per status (check, alert, info) to maintain quick scanning.

### 5.7 Settings
- Toggle slider redesigned: pill track with gradient fill when active.
- Range inputs use custom thumb with cyan glow and track progress tinted accent.

### 5.8 Status Bar
- Footer becomes slim glass strip with connection dot + text; adopt same palette as header.

## 6. Accessibility
- Maintain current ARIA structure; ensure focus outline meets 4.5:1 contrast via `--shadow-focus`.
- Provide `prefers-reduced-motion` branch to disable blur intensive transitions by reducing blur to 0 and removing transforms.
- All icons require `aria-hidden="true"` with textual label in button text or `aria-label`.

## 7. Implementation Notes
1. Refactor `popup.css` tokens to the new set, removing Material references.
2. Introduce utility classes: `.surface-card`, `.glass`, `.stack`, `.cluster` for consistent spacing.
3. Update markup (`popup.html`) minimally: add wrappers for stats grid, rename classes where necessary (e.g., `.panel-header` → `.surface-header`).
4. Ensure Chrome blur compatibility: use `backdrop-filter` with fallback solid color for browsers without support.
5. Mirror spec inside Tauri shell by exporting tokens to shared CSS (follow-up task).

## 8. Deliverables Checklist
- [ ] Token overhaul committed in `popup.css`.
- [ ] Updated markup reflecting new structure.
- [ ] Status bar + buttons aligned with Ark palette.
- [ ] Documentation snippet inside `MOCK_AI_SERVICE_DOCUMENTATION.md` referencing the new UI (future step).
