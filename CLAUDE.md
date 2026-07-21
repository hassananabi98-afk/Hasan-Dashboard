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
3. **Git: commit per task, merge to `main` immediately** — GitHub Pages only serves `main`, and that's the only place the change can actually be seen live, so every confirmed change gets merged and pushed to `main` right away — never deferred to "later" or "end of session." If the session was started on a harness-assigned `claude/*` branch, commit there first, then merge that branch into `main` in the same step. Follow the procedure below.
4. **No changes to Supabase credentials** — anon key is in `script.js`; never commit secrets.

### Commit & Push Procedure
Do this every time, right after a change is confirmed:
1. Check the branch: `git rev-parse --abbrev-ref HEAD`.
   - On `main` → commit and push there directly (steps 2-5 below).
   - On a `claude/*` branch (assigned by the session) → commit there, then merge into `main` in the same pass — do not leave it sitting on the branch. The branch itself stays alive for the rest of the session; only the merge into main is immediate.
2. If `script.js` or `style.css` changed, bump `?v=N` on **both** lines in `index.html` (see Cache-busting).
3. Stage and commit: `git add -A && git commit -m "<clear, present-tense summary>"`.
4. Merge to `main`: `git fetch origin main && git checkout main && git merge --ff-only <branch>` (fast-forward; if it's not a fast-forward, merge normally), then `git push origin main`. On network errors only, retry up to 4× with backoff (2s, 4s, 8s, 16s).
5. Verify it landed: `git log --oneline -1 origin/main` should show your commit.
6. If working on a `claude/*` branch, switch back to it (`git checkout <branch>`) so the next task in this session continues there.
7. Do **not** open a pull request unless the user asks — pushing straight to `main` is the normal flow, and the live site rebuilds from `main` within ~1 minute.
- **Never leave work only on a feature branch** — GitHub Pages ignores every branch except `main`, so an unmerged branch means the change isn't visible, period.

### End-of-session cleanup
Deleting the session's `claude/*` branch is housekeeping, not part of each task — doing it after every task just means recreating the same branch a minute later for the next task. Only run this when the user gives an explicit finishing signal: **"That's it for this session"** (or a clear equivalent like "that's it for now" / "wrapping up").
1. Confirm any pending work is already merged to `main` (it should be, per the procedure above).
2. Delete the branch: `git push origin --delete claude/<b>`.
3. **If that returns HTTP 403**, the session's git token isn't scoped to delete remote refs — it varies by session, it is *not* a permanent block and *not* a protected-branch issue. Do **not** keep hammering it. Instead force the branch to `main`'s tip so it isn't left stale/divergent: `git push --force origin origin/main:refs/heads/claude/<b>`.
4. Actual removal is then an operator action — delete from the GitHub UI (repo → **branches** → trash icon; merged PRs also show a "Delete branch" button) or from a machine whose credentials have delete scope.
- Only ever touch `claude/*` branches this way — never force-push or delete `main`.

### Leftover-branch cleanup (fallback)
For `claude/*` branches from sessions that ended without the finishing signal (e.g. a dropped connection) rather than the normal end-of-session cleanup above. First confirm each is already in `main` (`git merge-base --is-ancestor origin/claude/<b> origin/main`, or that its work was merged via a closed PR), then follow the same delete → 403 fallback → operator-removal steps as above.

## Key Code Patterns

### Cache-busting (IMPORTANT)
- `index.html` loads assets with a version query: `script.js?v=N` and `style.css?v=N`
- **Always bump `N` on both lines after editing `script.js` or `style.css`** — GitHub Pages/browsers cache by full URL, so without a bump the old cached file is served indefinitely and changes look like they "didn't apply"
- **Increment `N` by 1 from whatever is currently in `index.html`** (the owner tracks this number, currently in the 100s — it was realigned to 124). Read the existing value and go one higher; never reset it to a small number.

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

### Donut chart & legend (`buildDonut` / `donutEntries`)
- `donutEntries()` folds categories beyond the top 6 **or** under 2.5% share into one gray "Other" arc (merges into a genuine "Other" category if present) — keeps the donut from sprouting unreadable slivers. Each entry carries `cats` (the category names it covers).
- The Finance donut passes `legendItems` (the **full** per-category list) to `buildDonut`, so the percentage list under the chart shows **every** category by name — even small ones folded into the gray arc. Each legend item has `seg` = which arc to spotlight when tapped. Cards/Analytics omit `legendItems`, so their legend mirrors the folded arcs 1:1.
- Tapping a legend row or arc filters the Cash Expenses list (`finCatFilter`) and spotlights the matching arc; the "All categories" button calls `chart.clearSelection()`.

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
