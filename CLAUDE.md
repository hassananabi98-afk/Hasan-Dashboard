# Hassan Personal Dashboard — Claude Instructions

> **⚠️ EVERY NEW SESSION — READ FIRST:** Always commit and push to **`main`**. GitHub Pages serves the live site from `main`, so any work pushed to another branch will NOT go live. Do not develop on or push to feature branches unless the user explicitly asks for one in that session.

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
3. **Git: always commit & push to `main`** — GitHub Pages serves from main. Never create or push to a feature branch unless the user explicitly asks for one. Follow the procedure below.
4. **No changes to Supabase credentials** — anon key is in `script.js`; never commit secrets.

### Commit & Push Procedure (main only)
Do this every time, at the end of a change:
1. If `script.js` or `style.css` changed, bump `?v=N` on **both** lines in `index.html` (see Cache-busting).
2. Confirm the branch: `git rev-parse --abbrev-ref HEAD` must be `main`. If it isn't, `git checkout main` and merge/apply the work there — do not push a feature branch.
3. Stage and commit: `git add -A && git commit -m "<clear, present-tense summary>"`.
4. Push: `git push origin main`. On network errors only, retry up to 4× with backoff (2s, 4s, 8s, 16s).
5. Verify it landed: `git log --oneline -1 origin/main` should show your commit.
6. Do **not** open a pull request unless the user asks — pushing straight to `main` is the normal flow, and the live site rebuilds from `main` within ~1 minute.
- **Never leave work on a feature branch** thinking a PR will carry it live — GitHub Pages ignores every branch except `main`.

### Leftover-branch cleanup (`claude/*` branches)
Old `claude/*` session branches accumulate. To clean them, first confirm each is already in `main` (`git merge-base --is-ancestor origin/claude/<b> origin/main`, or that its work was merged via a closed PR), then:
1. Try to delete it: `git push origin --delete claude/<b>`.
2. **If that returns HTTP 403**, the session's git token isn't scoped to delete remote refs — it varies by session, it is *not* a permanent block and *not* a protected-branch issue. Do **not** keep hammering it. Instead force the branch to `main`'s tip so it isn't left stale/divergent: `git push --force origin origin/main:refs/heads/claude/<b>`.
3. Actual removal is then an operator action — delete from the GitHub UI (repo → **branches** → trash icon; merged PRs also show a "Delete branch" button) or from a machine whose credentials have delete scope.
- Only ever touch `claude/*` branches this way — never force-push or delete `main`.

## Key Code Patterns

### Cache-busting (IMPORTANT)
- `index.html` loads assets with a version query: `script.js?v=N` and `style.css?v=N`
- **Always bump `N` on both lines after editing `script.js` or `style.css`** — GitHub Pages/browsers cache by full URL, so without a bump the old cached file is served indefinitely and changes look like they "didn't apply"

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
- `getPeriodDates(ym)` — returns `{ start, end, open }`: if `open=true`, no `.lt()` filter on expenses (cycle hasn't ended). If the month has no cycle, checks whether a later cycle's `started_at` falls within the month and uses that as the cap (prevents overlap after pressing Start mid-month)
- `getPeriodTxns(txns, ym)` — filters a transactions array by the same period boundaries as `getPeriodDates`; used for all `finMonthTxns` assignments so card transactions follow the same salary cycle as expenses
- `finTxnsLoaded` flag — card transactions fetched once on first Finance visit and cached; add/delete/edit handlers patch `finAllTxns` in memory
- Pressing **Start New Month** upserts next month's row with `started_at = today`; expenses for the period run from that date until the next cycle's `started_at`

### Analytics period filtering
- `anlMonth` — currently viewed period in Analytics; defaults to `currentPeriodYM()` on first visit
- `anlPeriodYM` — cached result of `currentPeriodYM()` set each time `loadAnalytics` runs; used as the next-button cap so the click handler has a reliable value
- `renderSpendChart` and `renderTrendChart` both use `getPeriodTxns(expenses, month)` — same salary cycle boundaries as Finance, not calendar month
- `loadAnalytics` calls `loadFinanceCycles()` if `finCycles` is empty, ensuring cycle data is available when Analytics is visited before Finance
- Smoke and reading "this month" tiles use `currentYM()` (current calendar month) — unaffected by chart navigation
- Smoking tiles (left→right): day streak · smoked this month · smoke-free total. "Smoke-free total" is all-time (`rows.filter(r => !r.smoked).length`), not month-scoped
- Reading tiles (left→right): day streak · days this month (plain) · days total (green)
- Prayer missed counter has no month parameter — always shows all-time missed prayers up to today

### Dirty-flag pattern
- Today, Health, Analytics tabs only reload from Supabase when data changed since last visit
- Flags: `todayDirty`, `healthDirty`, `analyticsNeedReload`

### Auto-save
- 100ms debounce on all day-view changes (toggles, steppers, notes, supplements)
- `scheduleAutoSave()` in script.js
