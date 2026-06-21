# UI & Style Guide

## Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#3b82f6` | Blue — primary interactive, toggles on, progress bars |
| `--danger` | `#ef4444` | Red — delete actions, over-budget warning |
| `BUDGET_COLOR` | `#8b5cf6` | Violet — Monthly Budget box |
| CREDIMAX accent | `#3b82f6` / `#1d4ed8` | Blue card |
| ILA accent | `#22c55e` / `#15803d` | Green card |
| `--bg` | Dark background | |
| `--bg2` | Slightly lighter | Card/section backgrounds |
| `--bg3` | Slightly lighter again | Track backgrounds, inactive elements |
| `--text` / `--text2` / `--text3` | Text hierarchy | |
| `--border` | Subtle border color | |

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

## Dashboard Tabs

### CALENDAR
- Full monthly calendar with prev/next navigation
- Tap any day → day view (log/edit prayers, meals, smoking, reading, supplements, notes)
- Segmented ring per day: 1 log = full circle; 2–4 logs = arc segments with gaps
  - 🟣 Prayers, 🟠 Meals, 🔴 Smoking, 🔵 Reading
- Ring data loads per month; auto-refreshes on return after any save
- Auto-saves 100ms after last change

### TODAY
- Shortcut to today's day view (same UI as Calendar day view)
- Auto-saves 100ms after any change
- Reloads only when data changed since last visit (dirty flag)

### FINANCE
- Month navigation (prev/next — future months blocked)
- Monthly Budget box (violet) — Remaining, progress bar, total budget; tap amount to edit
- Salary cycle: press **Start New Month** when salary arrives → creates next month's cycle
  - Cycle open-ended until next Start is pressed
- Cash expense log — add (label, amount, category, date, notes) + delete + edit
- Donut chart by category with manual legend
- Cards section (CREDIMAX blue, ILA green) — all-time balance from transactions
  - Tap "Limit BHD X.XXX ✎" to edit card limit inline
  - Tap card tile to expand per-card spending donut
- Card transactions — add (charge/payment, label, amount, category, date) + delete

### HEALTH
- Month navigation; reloads only when a session was added/deleted (dirty flag)
- Session type tiles — pill rows with colored left accent, emoji, label, monthly count
- Tap a tile to hide it; "Hidden (N)" section reveals hidden tiles; prefs in localStorage
- Add session (type, date, notes) + delete with inline confirm

### ANALYTICS
- Reloads only when data changed since last visit (dirty flag)
- Reading: day streak, days this month, days total
- Smoking: smoke-free streak, smoke-free days this month, smoked days this month
- Spending donut: per-category breakdown for selected month + legend; month nav
- Monthly spending bar: last 6 months; selected month highlighted solid blue
- Reading/Smoking visibility toggleable in Settings

### SETTINGS
- Opens via gear icon; re-fetches all data on every open
- Categories — inline rename, delete (2-tap), add new (auto color)
- Supplements — active/inactive toggle, delete (2-tap), add new
- Cards — visible/hidden toggle, delete (3-tap + cascades transactions), add new
- Analytics Visibility — toggle Reading and Smoking; persisted in localStorage
