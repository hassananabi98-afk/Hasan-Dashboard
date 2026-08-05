# UI & Style Guide

Colours, tokens and component specs. For what each tab actually *does*, see
[`features.md`](features.md).

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root.

---

## Color Palette

CSS custom properties, defined at the top of `style.css` with a
`prefers-color-scheme: dark` override. Values below are **light / dark**.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--accent` | `#007aff` | `#0a84ff` | Primary interactive — toggles on, active nav, progress |
| `--accent-bg` | `rgba(0,122,255,0.1)` | `rgba(10,132,255,0.15)` | Tinted accent backgrounds |
| `--accent-text` | `#007aff` | `#0a84ff` | Accent-coloured text |
| `--danger` | `#ff3b30` | `#ff453a` | Delete actions, over-budget, calendar note dot |
| `--success` | `#34c759` | `#30d158` | Positive states |
| `--bg` | `#f2f2f7` | `#000000` | Page background |
| `--bg2` | `#ffffff` | `#1c1c1e` | Card/section backgrounds |
| `--bg3` | `#e5e5ea` | `#2c2c2e` | Track backgrounds, pressed states |
| `--text` | `#000000` | `#ffffff` | Primary text |
| `--text2` | `#6c6c70` | `#8e8e93` | Secondary text |
| `--text3` | `#aeaeb2` | `#48484a` | Tertiary / future days |
| `--border` | `rgba(60,60,67,0.1)` | `rgba(255,255,255,0.1)` | Hairlines |

**Sizing tokens:** `--radius` 16px · `--radius-sm` 8px · `--nav-h` 64px · `--top-h` 52px

### Hard-coded colours (not tokens)
These are literals in `script.js` / inline styles and do **not** follow the theme:

| Where | Value | Usage |
|---|---|---|
| `BUDGET_COLOR` | `#8b5cf6` | Violet — Monthly Budget box |
| Prayers ring | `#a855f7` | Calendar, outer |
| Meals ring | `#f97316` | Calendar, middle |
| Reading ring | `#3b82f6` | Calendar, inner |
| CREDIMAX accent | `#3b82f6` / `#1d4ed8` | Blue card |
| ILA accent | `#22c55e` / `#15803d` | Green card |
| `.anl-stat-good` | `#22c55e` | Green stat value on the reading tiles |

Note the reading ring's `#3b82f6` is a *different* blue from `--accent`. That
near-match is why the calendar note dot was moved off `--accent` and onto
`--danger` — as accent it read as part of the reading ring.

---

## Card Tiles (CREDIMAX / ILA)
- Class: `.card-section`
- `position: relative; overflow: hidden` — required for `::before` pseudo-element
- `border: 1px solid var(--card-border, rgba(59,130,246,0.25))`
- `box-shadow: 0 2px 12px var(--card-glow, rgba(59,130,246,0.08))`
- `::before` — 3px absolute top line, `height: 3px`, `border-radius: var(--radius) var(--radius) 0 0`, gradient from `--card-accent` to `--card-accent-2`
- Balance amount: `.card-tile-balance` — `font-size: 20px; font-weight: 700; font-family: ui-monospace`
- Card name: `.card-tile-name` — `font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em`

## Monthly Budget Box (`#budget-wrap`)
- Mirrors card tile aesthetic with violet color
- `::before` in CSS — 3px absolute top line, `background: #8b5cf6`
- Inline styles set in `renderBudgetBar()`:
  - `background: darkTint('#8b5cf6', 0.16)`
  - `border: 1px solid hexA('#8b5cf6', 0.25)`
  - `box-shadow: 0 2px 12px hexA('#8b5cf6', 0.08)`
- Remaining amount uses `.card-tile-balance` class (20px bold monospace)
- Title "💰 Monthly Budget" and "Start New Month" button sit **outside** the box in a flex row above it

## Health Session Tiles
- Class: `.hlth-type-tile`
- `::before` — 4px absolute left accent bar (not top line)
- Vertical pill layout with colored left bar, emoji, label, monthly count chip

## Confirmation Patterns
- **2-tap delete** (categories, supplements): first tap changes button text + color → second tap executes → click elsewhere cancels
- **3-tap delete** (cards): same but three taps; cascades to transactions
- **2-tap Start New Month**: first tap → "Confirm?" in red → second tap executes → click elsewhere cancels


---

## Calendar Day Rings (`.cal-rings`)
SVG per cell, `viewBox="0 0 100 100"`, `position: absolute; inset: 0`.

| Ring | Colour | Radius | Stroke |
|---|---|---|---|
| Prayers (outer) | `#a855f7` violet | 46 | 6 |
| Meals (middle) | `#f97316` orange | 37.5 | 6 |
| Reading (inner) | `#3b82f6` blue | 29 | 6 |

- Partial rings: arc from 12 o'clock clockwise, `stroke-linecap: round`, over a track of the same colour at `opacity: 0.2`
- Complete rings draw as a `<circle>` — an SVG arc can't represent 360°
- Today's disc: `fill: var(--accent)`, `r: 44` with no rings drawn, `r: 23` once any ring appears
- `.cal-num` sits above the SVG at `z-index: 1`

## Calendar Note Dot (`.cal-note-dot`)
- 4px circle at `top: 68%; left: 50%`, translated to centre — between the bottom of the day number and the inner reading ring
- `background: var(--danger)` at `opacity: 0.9` — deliberately red, so it doesn't read as part of the blue reading ring
- On today's accent disc: white at `opacity: 0.95`, since red on the solid blue disc has poor contrast
- On future days: `opacity: 0.4`
