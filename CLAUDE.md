# Hassan Personal Dashboard — Claude Instructions

## Project Overview
A personal life management dashboard. Calendar-based daily logging for health, finance, prayers, meals, supplements, and wellness. Built as a standalone HTML/CSS/JS web app backed by Supabase.

## Tech Stack
| Component | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — `index.html`, `script.js`, `style.css` at repo root |
| Database | Supabase (PostgreSQL) |
| Hosting | GitHub Pages (`hassananabi98-afk.github.io`) — serves from repo root only |
| Auth | PIN screen (SHA-256 hash) |

## Access
- **Live URL:** `https://hassananabi98-afk.github.io`
- **Repo:** `https://github.com/hassananabi98-afk/Hasan-Dashboard`
- **Supabase URL:** `https://wrsqsrouliceqewkxvpw.supabase.co`

## Repo Structure
```
index.html        ← served by GitHub Pages (main app)
script.js
style.css
README.md
CLAUDE.md         ← this file
docs/
  schema.md
  style-guide.md
  changelog.md
```

## Rules — Read Before Every Change

1. **Always discuss before changing anything** — explain the proposed change and wait for approval before touching any file, git, or database.
2. **Database changes require explicit approval** — never run DDL (ALTER TABLE, CREATE TABLE, etc.) or DML without telling the user what SQL will be run and getting a "yes". The user runs SQL manually in the Supabase SQL Editor.
3. **Git: always push to `main`** — GitHub Pages serves from main. Never push to another branch without permission.
4. **No changes to Supabase credentials** — anon key is in `script.js`; never commit secrets.

## Key Code Patterns

### Helper functions (script.js)
- `darkTint(hex, w)` — blends hex color toward black; used for card/budget box backgrounds
- `hexA(hex, a)` — returns hex color as `rgba(...)` at given opacity; used for borders and shadows
- `$(id)` — shorthand for `document.getElementById(id)`
- `fmtAmount(n)` — formats number as `BHD X.XXX`

### Card & budget box styling
- Cards use `.card-section` CSS class with `--card-accent` / `--card-accent-2` CSS variables for color
- `.card-section::before` — 3px absolute pseudo-element for the colored top line
- Budget box (`#budget-wrap`) mirrors card styling with violet (`#8b5cf6`) via inline styles in `renderBudgetBar()`
- `BUDGET_COLOR = '#8b5cf6'`

### Budget cycle logic
- `finCycles` — array of `{ month, started_at }` sorted ascending; loaded from `budget_settings` where `started_at` is not null
- `currentPeriodYM()` — returns the most recent cycle's `month` where `started_at ≤ today`
- `getPeriodDates(ym)` — returns `{ start, end, open }`: if `open=true`, no `.lt()` filter on expenses (cycle hasn't ended)
- Pressing **Start New Month** upserts next month's row with `started_at = today`; expenses for the period run from that date until the next cycle's `started_at`

### Dirty-flag pattern
- Today, Health, Analytics tabs only reload from Supabase when data changed since last visit
- Flags: `todayDirty`, `healthDirty`, `analyticsNeedReload`

### Auto-save
- 100ms debounce on all day-view changes (toggles, steppers, notes, supplements)
- `scheduleAutoSave()` in script.js
