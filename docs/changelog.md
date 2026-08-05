# Changelog

A record of what shipped. Nothing forward-looking lives here — planned features
and open decisions are in [`future-plans.md`](future-plans.md), bugs in
[`known-issues.md`](known-issues.md).

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root. Record what changed, never live values — no amounts, balances,
> merchants or card names.

Entries below are historical and describe the app **as it was at the time**.
Where a feature was later removed — smoking tracking, the "Note for tomorrow"
field — the old entries are left intact on purpose; the current behaviour is in
[`features.md`](features.md).

---

## Build Sessions

| Session | Focus | Status |
|---------|-------|--------|
| 1 | Supabase setup + all tables + calendar shell UI | ✅ Done |
| 2 | Daily logging — prayers, meals, smoking, supplements | ✅ Done |
| 3 | Finance — expenses, budget, categories, donut chart | ✅ Done |
| 4 | Health sessions + cards + card transactions | ✅ Done |
| 5 | Analytics — smoking, spending, monthly trends | ✅ Done |
| 6 | Settings + calendar rings + Reading + polish + bug fixes | ✅ Done |
| 7 | Finance UX improvements + repo cleanup | ✅ Done |
| 8 | Finance polish — budget box style, Start New Month, Remaining display, salary cycle fix | ✅ Done |
| 9 | Finance performance + salary cycle applied to cards | ✅ Done |
| 10 | Analytics spacing polish | ✅ Done |
| 11 | Analytics period-aware filtering + navigation fix | ✅ Done |
| 12 | Smoking analytics redesign + reading colour swap | ✅ Done |
| 13 | Calendar last-day-of-month ring bug fix | ✅ Done |

---

## Session Notes

### Session 13 — Calendar Last-Day-of-Month Ring Bug Fix

**Bug:** the last day of each month never showed its coloured rings on the Calendar (e.g. June 30 was blank despite logged data).

**Cause (`loadCalDots`):** the date-range upper bound was built with `new Date(year, month+1, 0).toISOString().slice(0,10)`. `new Date(...)` returns the last day at **local** midnight, but `.toISOString()` converts to **UTC** — in Bahrain (UTC+3) that shifts midnight back to 21:00 the previous day, so `end` became the 29th/30th instead of the 30th/31st, and the `date <= end` filter dropped the final day.

**Fix:** build `end` from local parts — `` `${ym}-${String(new Date(year, month+1, 0).getDate()).padStart(2,'0')}` `` — no `toISOString()`, so no UTC shift.

**Bumped** `?v=18` → `?v=19`. No DB changes.

---

### Session 12 — Smoking Analytics Redesign + Reading Colour Swap

**Smoking card (`renderSmokeStats`, index.html):**
- Stat tiles reordered: Day Streak · **Smoked This Month** (middle) · **Smoke-Free Total** (right) — middle and right swapped
- "Smoke-free this month" → **"smoke-free total"**: now counts all-time logged days where `smoked = false` (`rows.filter(r => !r.smoked).length`) instead of the current-month filter — keeps accumulating across months
- Colour classes follow the new order: middle red when `smokedDays > 0`, right always green

**Reading card (`renderReadingStats`):**
- Colours swapped: **"days total"** now green (`total > 0`), **"days this month"** now plain — streak tile unchanged

**Cache-busting:**
- Bumped `script.js` / `style.css` query string from `?v=17` → `?v=18` in `index.html`
- Lesson: this project relies on the `?v=N` version query to force browsers to refetch assets — **always bump it when editing JS/CSS**, otherwise the cached copy is served indefinitely and changes appear "not applied"

**No DB changes** — all data already fetched via the existing `daily_tracking` query.

---

### Session 1 — Supabase Setup + Calendar Shell
- Anonymous sign-ins off by default → enabled via Auth → Sign In Providers
- RLS policy wrong role context → replaced with `using (true) with check (true)`
- Missing GRANT permissions → `grant select, insert, update, delete on all tables in schema public to authenticated`

---

### Session 2 — Daily Logging
- `.single()` throws on empty rows (PGRST116) → replaced with `.maybeSingle()`
- Auth session not ready → added `onAuthStateChange` waiting for `INITIAL_SESSION`

---

### Session 3 — Finance (Expenses, Budget, Categories, Chart)
Scope change: Cards moved to Session 4.

**SQL run:**
```sql
INSERT INTO categories (name, color) VALUES
  ('Food','#f97316'),('Transport','#3b82f6'),('Health','#22c55e'),
  ('Shopping','#a855f7'),('Bills','#ef4444'),('Entertainment','#eab308'),
  ('Other','#6b7280');
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
```

**Notes:**
- Chart.js 4 loaded via CDN (`chart.umd.min.js`) as regular script before the module script
- Budget uses delete + re-insert (avoids needing UNIQUE constraint on `month`)
- `expenses.category` stores category name as TEXT — renaming in Settings will not backfill old rows
- Finance tab lazy-loads on first tab switch; does not reload on subsequent visits
- Inline delete confirm replaces the row in-place (no `window.confirm()`)

---

### Session 4 — Health Sessions + Cards + Post-build Fixes

**SQL run:**
```sql
INSERT INTO cards (name, "limit", paid, visible) VALUES
  ('ILA', 300.000, 0.000, true),
  ('CREDIMAX', 300.000, 0.000, true);
```

**Notes:**
- Card balance = all-time sum(charges) − sum(payments); NOT month-scoped
- `"limit"` is a reserved word in PostgreSQL — must be quoted in raw SQL
- Health type tile privacy: tapping hides tile → "Hidden (N)" section; prefs in localStorage
- `hlthNormalizeType()` maps non-standard strings to 'other' for chip coloring
- PIN screen: wrapped title+dots+keypad in `.pin-inner` with `gap: 28px`
- Health privacy: changed from opacity filter to full hide + collapsible "Hidden" section

---

### Session 5 — Analytics + Bug Fixes
- Prayers analytics excluded by choice
- Quarterly summaries deferred
- Monthly totals bar replaced stacked category chart (unreadable with sparse data)
- All analytics data parallel-fetched via `Promise.all`
- PIN keys scaled to `min(22vw, 88px)`; dots enlarged to 16px
- Health tiles redesigned to vertical pill rows with colored left accent bar

---

### Session 6 — Settings + Calendar Rings + Reading + Polish

**SQL run:**
```sql
ALTER TABLE daily_tracking ADD COLUMN IF NOT EXISTS reading BOOLEAN DEFAULT false;

CREATE TABLE custom_log_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, emoji TEXT DEFAULT '📋',
  active BOOLEAN DEFAULT true, show_in_analytics BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
CREATE TABLE custom_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  log_type_id UUID REFERENCES custom_log_types(id) ON DELETE CASCADE,
  value BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT now()
);
CREATE POLICY allow_auth ON custom_log_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_auth ON custom_log_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE custom_log_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_log_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_log_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_log_entries TO authenticated;
```

**Features added:**
- Reading toggle in Today + Calendar day view
- Reading analytics card (streak, this month, total)
- Calendar segmented rings (🟣 Prayers, 🟠 Meals, 🔴 Smoking, 🔵 Reading)
- Settings tab: categories, supplements, cards, analytics visibility
- Card limit editable inline; card tile tap → per-card spending donut
- Auto-save: 100ms debounce — no manual Save needed
- Dirty-flag system: Today/Health/Analytics only reload when data changed

**Bug fixes:**
- Calendar 400: hardcoded day 31 invalid for short months → `new Date(year, month+1, 0)`
- Single calendar ring showed as nothing → switched to `<circle>` for single-log days
- Duplicate supplements: removed redundant `loadTodayTab` call
- Supplement toggles not auto-saving → added `scheduleAutoSave` to `renderSuppRows`
- Custom log types attempted then reverted — tables remain in DB, UI removed

---

### Session 7 — Finance UX + Repo Cleanup

**SQL run:**
```sql
ALTER TABLE budget_settings ADD COLUMN IF NOT EXISTS started_at date;
```

**Finance changes:**
- "Spent" → "Remaining" on Monthly Budget (shows budget − spent; red when over)
- Monthly Budget box styled violet (`#8b5cf6`) to match card aesthetic
- **Start New Month** button: press when salary arrives → upserts next month's cycle in `budget_settings`
  - `started_at` records exact date pressed
  - Expense filter uses `started_at` of current cycle as start; end = `started_at` of next cycle (open-ended)
  - `currentPeriodYM()` finds most recent cycle where `started_at ≤ today`
- 2-tap confirmation on Start New Month (same pattern as card delete)

**Repo cleanup:**
- Removed `Code/`, `html/`, `md/` folders and `dashboard.md`
- `index.html`, `script.js`, `style.css` at root are canonical files for GitHub Pages
- Docs restructured into `CLAUDE.md`, `docs/schema.md`, `docs/style-guide.md`, `docs/changelog.md`

---

### Session 9 — Finance Performance + Card Cycle Alignment

**Performance:**
- `loadFinanceData`: budget + expenses queries now run in parallel via `Promise.all`
- Card transactions (`finAllTxns`) loaded once on first Finance visit (`finTxnsLoaded` flag) instead of re-fetching all history on every refresh; add/delete/edit handlers keep the in-memory cache accurate
- Removed redundant `loadFinanceCycles` call from inside `loadFinanceData` — cycles are only reloaded in `initFinanceTab` and after pressing Start New Month

**Salary cycle applied to cards:**
- Added `getPeriodTxns(txns, ym)` helper — mirrors `getPeriodDates` boundary logic for transaction filtering
- All `finMonthTxns` assignments replaced with `getPeriodTxns(finAllTxns, finMonth)` so card spending from Jun 24 onwards correctly shows in July's card section (same as cash expenses)

**Bug fix:**
- After adding an expense, it was not appearing immediately when the expense date fell in a prior month but within the salary cycle (e.g. Jun 24 expense in July view). Fixed by replacing `date.startsWith(finMonth)` check in `submitExpense` with the same period boundary logic

---

### Session 8 — Finance Polish + Salary Cycle Fix

**Budget box styling:**
- Top line: switched from `border-top` inline style to `::before` pseudo-element (`height: 3px`, `position: absolute`) — matches card rendering exactly
- Border/shadow: matched to `.card-section` style (`1px` subtle border at 25% opacity, `0 2px 12px` directional shadow)
- Remaining amount: styled with `.card-tile-balance` (20px bold monospace, same as card balances)
- Title "💰 Monthly Budget" and "Start New Month" button sit outside the violet box in a flex row above it

**Salary cycle fix (`getPeriodDates`):**
- Bug: after pressing Start New Month on Jun 24, June showed all Jun 1–30 expenses (overlapping with July)
- Fix: when a month has no cycle of its own, check if a later cycle's `started_at` falls within that month and cap the end date there
- Result: June shows Jun 1–23; July shows Jun 24 onwards — clean handover with no overlap

---

### Session 11 — Analytics Period-Aware Filtering + Navigation Fix

**Spending donut (renderSpendChart):**
- Was filtering by calendar month (`startsWith`); now uses `getPeriodTxns(expenses, month)` so the donut only shows expenses within the salary cycle period, matching Finance behaviour

**Yearly trend chart (renderTrendChart):**
- Same fix: each bar now uses `getPeriodTxns(expenses, m)` per month — no cross-period double-counting

**Analytics navigation:**
- `anlMonth` now defaults to `currentPeriodYM()` on first visit (not current calendar month), so the chart opens on the active salary period
- Next-button cap changed from current calendar month to `currentPeriodYM()` — allows navigating forward to a period whose cycle started mid-last-month
- Cap stored in `anlPeriodYM` (cached in `loadAnalytics`) so the click handler uses a reliable value rather than calling `currentPeriodYM()` live
- `loadFinanceCycles()` is called inside `loadAnalytics()` when `finCycles` is empty, so cycle data is available even if Finance tab was never visited

**Static stats:**
- Smoke and reading stats always show the current calendar month (`currentYM()`) regardless of which spending period is being viewed — navigating the chart no longer changes them
- Prayer missed counter was already static (no month parameter) — no change needed

---

### Session 10 — Analytics Spacing Polish

- `.anl-stat-row`: added `padding: 0 12px 12px 12px` — stat boxes no longer touch left/right edges of their card
- `.anl-stat`: reduced `min-height` to `80px` and font-size to `20px` for more compact counter tiles
- `.log-card`: added `padding: 14px` — title, emoji and content have breathing room from card borders

---

### Session 12 — Bug Fixes + Donut Chart Redesign

**Bug fixes:**
- `renderSuppRows`: supplement names now HTML-escaped (were injected raw into `innerHTML`); removed dead `addBtnId` computation
- `bindAddSupp`: after adding a supplement from a day view, rows are re-rendered with a live save context — previously `saveCtx` was `null`, so toggling any supplement right after an add never auto-saved
- `currentPeriodYM` / Start New Month: switched from `toISOString()` (UTC) to local `todayStr()` — between midnight and 3am Bahrain time the UTC date is still "yesterday", which could mis-select the active cycle or stamp `started_at` with the wrong day
- Card donut border used `borderColor:'var(--bg2)'` — CSS variables don't resolve on canvas, so segment borders rendered black in both themes (fixed by the redesign: no borders, gap spacing instead)
- Settings → category color: saving without re-picking a color stored `style.background` (`rgb(...)` string) instead of hex; the color button now carries `data-current-color` from render
- `showToast`: consecutive toasts no longer get hidden early by the previous toast's timer
- Removed dead `get6mStart()` helper

**Donut chart redesign (Finance, Cards, Analytics — shared code):**
- New `donutEntries()` — sorts categories by amount desc and folds anything beyond the top 6 into a gray "Other (n)" segment so the ring stays readable
- New `buildDonut()` — one builder for all three donuts: rounded segment ends (`borderRadius: 5`), 2px gaps between segments (`spacing`, replaces theme-dependent borders), 72% cutout, ease-out entry animation
- Interactive center readout: shows the period total by default; tapping a segment (or its legend row) spotlights it and shows the category amount + share %; tap again to reset
- Unified legend (`.donut-legend`): tappable rows with color swatch, name, share % and amount (tabular numerals); replaces `.fin-legend-*` and `.anl-legend-*`
- Analytics donut gained a center readout (`#anl-spend-center`); card donuts gained a center total ("charges")
- Cache version bumped to `?v=23`

**Donut refinement (same session, follow-up):**
- Fixed pebble-shaped tiny segments: fixed `borderRadius: 5` was larger than short arcs, pinching sub-5% categories into blobs
- `donutEntries` now also folds any category under 2.5% of the total into "Other" (in addition to the top-6 cap) — sliver arcs can't render legibly
- Segment rounding is now scaled to segment share (<5% → 1px, <10% → 2px, else 4px) via scriptable `borderRadius`
- Ring slightly thicker: cutout 72% → 70%

---

### Session 13 — 3D Toggles + Calendar Modernization

**3D toggles (`.toggle` day/today views, `.sett-toggle` settings):**
- Track: inset shadows for recessed depth (stronger in dark mode); on-state gets an accent gradient (light top edge), inner bevel and a soft accent glow
- Thumb: white→gray gradient with layered drop shadow + top highlight — reads as a raised physical knob
- iOS-style press feedback: thumb stretches wider while held (`:active`), springs into place with a bouncy cubic-bezier when released

**Calendar page:**
- Grid + legend now live in a floating `.cal-card` (16px radius, layered shadow, hairline border in dark mode)
- Legend converted to pill chips
- New "Today" chip beside the month label — appears only when viewing another month, tap to jump back (`#cal-today-btn`)
- Month change plays a 220ms fade/rise animation (`.cal-anim`, re-triggered per render via reflow)
- Today's cell ring gets an accent glow (`drop-shadow` on `.cal-rings`)
- Cells scale down slightly on press; weekday header row restyled (smaller, tracked-out, uppercase weight)
- Nav buttons: circular with subtle raised shadow and press scale
- Cache version bumped to `?v=24`

**Floating bottom nav (same session, follow-up):**
- `.bottom-nav` is now a floating pill: fixed 12px from the edges (10px + safe-area from the bottom), 28px radius, hairline border, layered shadow, max-width 520px centered
- Frosted-glass background: `color-mix` translucent `--bg2` + `backdrop-filter: blur(20px) saturate(1.5)` — content scrolls underneath
- Active tab indicator changed from a top line to a rounded pill highlight behind the icon+label; tabs scale down on press
- `.content` gained bottom padding (nav height + 22px + safe-area) so nothing hides behind the bar; toast raised to clear it
- Cache version bumped to `?v=25`

**Calendar activity rings (same session, follow-up):**
- Day indicators redesigned from a single segmented ring into Apple-Fitness-style concentric progress rings: prayers (purple, outer), meals (orange, middle), reading (blue, inner) — each type always at the same radius
- Arc length now shows day completion: `loadCalDots` stores fractions (prayers done /5, meals /3, reading 0/1) instead of booleans; partial rings run clockwise from 12 o'clock with rounded caps over a faint 20%-opacity track of the same color
- Complete rings render as full circles; days with no logs stay clean
- Today's marker shrunk from a 38-radius disc to a 23-radius disc so it sits inside the rings instead of behind them (dropped the old 0.75-opacity hack)
- Grid gaps widened (7px 5px) so adjacent day rings don't touch
- Cache version bumped to `?v=26`

**Donut gap equalization (follow-up):**
- Chart.js `spacing` translates each arc radially from the center, so with a dominant segment (e.g. Bills 70%) the gaps around the big arc rendered much wider than between small segments
- Replaced with `spacing: 0` + a 2px surface-colored border per segment — uniform gaps regardless of arc size
- Surface color resolved at draw time by walking up from the canvas to the first opaque ancestor background (page bg, white/dark card, tinted card section all match correctly); canvas can't resolve CSS `var()` strings
- Added a `prefers-color-scheme` change listener that re-renders loaded charts so baked-in canvas colors track OS theme flips
- Cache version bumped to `?v=27`

**Unified card standard (follow-up):**
- The `.cal-card` look is now the app-wide standard: `--radius` token bumped 12px → 16px (every `var(--radius)` box inherits it — log cards, forms, budget box, finance card sections, dropdowns, textareas)
- `.log-card`, `.add-expense-form`, `.fin-empty`, `.hlth-type-tile` and the settings list groups get the same layered shadow (`0 1px 4px` + `0 8px 24px`) and, in dark mode, the same hairline `var(--border)` border
- Settings lists (`#sett-cat-list` etc.) rounded + clipped as a group via `:not(:empty)` so empty containers don't render as stray hairlines
- Accent-styled boxes (violet budget, tinted finance card sections) keep their identity — they inherit only the radius token
- Cache version bumped to `?v=28`

**Daily log auto-save fixes:**
- Auto-save wrote the *previous* toggle value: `wireAutoSave` registered its click listener with `{ capture: true }`, and at the target element capture listeners run before bubble ones regardless of registration order — so the snapshot was taken before `bindToggle` flipped the `.on` class. Symptom was the last switch flipped before leaving a day never sticking, which made pressing Save manually feel mandatory. Listener moved to the bubble phase; supplements were never affected (they flip the class before scheduling)
- Failed saves reported success: `saveDayData` wrapped its writes in `try`/`catch`, but supabase-js resolves with `{ error }` instead of rejecting, so nothing ever reached the `catch`. Every write is now checked explicitly, and failures surface a toast on auto-save too — only the success toast stays silent
- Editing today from the calendar day view left the Today tab stale: `saveDayData` set `calNeedsRefresh` and `anlNeedsRefresh` but never `todayNeedsRefresh`, despite the tab-switch handler already consuming it
- Cache version bumped to `?v=128`

**Notes: slower debounce, tomorrow field removed, calendar note dot:**
- Notes now auto-save on a 600ms debounce instead of 100ms — `scheduleAutoSave` takes a `delay` argument, so toggles and supplements keep saving instantly (100ms) while typing fires one write per pause rather than one per keystroke gap. Both delays are named constants (`AUTOSAVE_TAP` / `AUTOSAVE_TEXT`)
- "Note for tomorrow" removed from both the calendar day view and the Today tab — the field was never used (0 of 55 `daily_tracking` rows had a value). The `notes_tomorrow` column is deliberately kept so the Excel export stays round-trippable with older backups; it's marked retired in `schema.md` and is safe to drop later
- Days with a written note now show a small dot below the day number on the calendar, sized to sit between the number and the inner reading ring. `loadCalDots` already fetched the `daily_tracking` rows, so the flag costs no extra query. Turns white on today's accent disc and dims on future days
- Cache version bumped to `?v=129`

**Open-questions log + notes_tomorrow fully removed:**
- Added `docs/future-plans.md` — a home for questions raised in a session that never got answered, so they're inherited by the next session instead of being re-asked or quietly decided. Carries the same no-private-data warning as `known-issues.md` since the repo is public
- CLAUDE.md rule 5 added: an unanswered question must be written to that file before the session ends, and removed once answered with the outcome recorded wherever it belongs. Repo structure block updated to list the docs that already existed but weren't shown
- `notes_tomorrow` stripped from the Excel export and import as well. This had to ship before the column is dropped — the import sent the field in its insert payload, and PostgREST rejects an entire sheet when a payload column doesn't exist, so dropping the column first would have broken the whole Daily Tracking import rather than just that field
- The `ALTER TABLE ... DROP COLUMN` is recorded in `future-plans.md` as P-01 for Hassan to run; schema.md marks the column dropped
- Cache version bumped to `?v=130`
- `notes_tomorrow` column dropped from `daily_tracking` (run 5 Aug 2026, 0 rows affected), completing the removal

**Documentation audit + Excel import fix:**
- **Excel import reported failure on every successful import.** The completion handler assigned to `todayDirty` / `healthDirty` / `analyticsNeedReload`, none of which were ever declared. `script.js` is a module and modules are always strict mode, so the assignment threw a `ReferenceError` that the surrounding `catch` turned into an "Import failed" panel — after the data had already imported correctly. The following line, which cleared the Finance cache, never ran either, so Finance kept serving stale data. Replaced with the real flag names (`todayNeedsRefresh`, `hlthNeedsRefresh`, `anlNeedsRefresh`, `calNeedsRefresh`). Found by checking CLAUDE.md's documented flag names against the code
- **Private figures removed from `upgrade-ideas/01`.** It carried card charge and repayment totals, the budget over-run in BHD, a monthly budget total, and named merchants — all served publicly with no PIN. Restated as ratios and percentages, which the argument never needed to be told with real numbers. The summary row in `upgrade-ideas/README.md` carried two of the same figures. Note: the values remain in git history; only further exposure is stopped
- **Privacy warning added to the five docs missing it** — `changelog.md`, `schema.md`, `style-guide.md`, `upgrade-ideas/01`, `upgrade-ideas/README.md`
- **Smoking removed from the docs.** The feature is entirely gone from `index.html` and `script.js`, but was still documented as live in the style guide (rings, day view, analytics card, Settings toggle) and CLAUDE.md. Historical changelog entries left intact on purpose. The `.anl-smoke-free` CSS class survives and now greens the reading tiles — logged as Q-03 in `future-plans.md`
- **KI-06 closed** — the Excel export gained the four missing tables (`budget_settings`, `categories`, `custom_log_types`, `custom_log_entries`) and now writes 13 sheets

**Doc reorganisation:**
- `docs/features.md` added — the tab-by-tab behaviour reference, split out of `style-guide.md`. Every stale fact found in the audit was in that half; the colour and component half was accurate throughout. The style guide keeps design only, and gained specs for the calendar rings and the new note dot
- `changelog.md`'s "Pending / Planned" table moved to `future-plans.md`, so the changelog is purely historical and there is one list per purpose. Two rows dropped as already shipped: Export/backup and Calendar ring legend
- CLAUDE.md gained a routing table for which doc gets which kind of update, and a corrected repo map
- Corrected in CLAUDE.md: the dirty-flag names, the trend chart being a full calendar year rather than a rolling six months, and the auto-save section (split delays, synchronous snapshot, bubble-phase requirement)
- Cache version bumped to `?v=131`

**Database orphan check prepared (not yet run):**
- The full set of columns the app actually reads or writes was derived from `exportData()` and the importer's table maps, which between them cover all 13 tables. Recorded as P-02 in `future-plans.md` with two read-only queries that list any column or table the app never touches
- Could not be run in-session: the Supabase MCP call required an approval that never arrived, and the environment's network policy blocks direct HTTPS to the project host (`403` on CONNECT), so there was no live path to the database. `schema.md` is therefore verified against the code, not against the live database
- KI-07 logged: the `Meals` sheet exports raw values while every other boolean sheet uses `yn()`. It round-trips correctly through the importer's `bool()` helper, so no data is at risk — but the only backup file is inconsistent with itself and blank cells are ambiguous to read

**Meals sheet booleans made consistent (KI-07 fixed):**
- The Excel export wrote the three meal columns as raw values (`r.breakfast || ''`), so a logged meal appeared as `true` and an unlogged one as a blank cell — while every other boolean sheet used `yn()` and wrote `Yes` / `No`. In the file that currently serves as the only backup, a blank cell couldn't be told apart from a row nobody had filled in
- Now wrapped in `yn()` like the rest. Verified both directions before shipping: new sheets export `Yes` / `No` / blank and import back to `true` / `false` / `false`, and older workbooks written the previous way still import correctly, because the importer's `bool()` helper already accepted `true` and `''` alongside `Yes` and `No`. No migration needed and no re-export required
- Cache version bumped to `?v=132`
- **P-02 closed — the database is clean.** The orphan check was run and returned no rows in either direction: no column exists that the app never touches, and no table exists that the app never reads. `schema.md` is now verified against the live database rather than inferred from the code, and carries the date it was checked. `notes_tomorrow` appears to have been the only leftover

**Note dot turned red, smoke-free class renamed, decisions closed:**
- Calendar note dot moved from `var(--accent)` to `var(--danger)`. The reading ring is hard-coded `#3b82f6` and `--accent` is `#007aff` — close enough that the dot read as part of the reading ring. It stays white on today's accent disc, where red would have poor contrast. **No legend entry** was added; the dot is deliberately unlabelled (Q-01 answered)
- `.anl-smoke-free` renamed to `.anl-stat-good` across `style.css` (two rules) and `script.js` (two lines). It hadn't referred to smoking since that feature was removed — it greens the reading tiles (Q-03 answered)
- Failed auto-saves confirmed to keep showing the error toast (Q-02 answered)
- **Style guide colour palette corrected.** It listed `--accent` as `#3b82f6` and `--danger` as `#ef4444`; the real tokens are iOS-style — `#007aff`/`#0a84ff` and `#ff3b30`/`#ff453a`. The table now carries both light and dark values for every token, plus a separate list of hard-coded colours that don't follow the theme. The earlier docs audit checked the component specs but not the token values, so this was missed then
- **KI-02 closed, not a bug.** The same merchant appearing under different categories is intentional — the category describes what was bought, not who sold it, so a shop selling both food and fitness gear correctly produces both
- **KI-03 corrected.** It claimed no export mechanism existed, which stopped being true when the Excel export was completed. Restated as what's actually missing: a copy that has been downloaded and kept off the database, and a habit of repeating it. Whether the app should prompt is logged as Q-04
- Cache version bumped to `?v=133`
- **Q-04 answered: no backup reminder.** The app will not prompt, show a last-export date, or nudge at cycle start. Backing up stays fully manual by choice — recorded in KI-03 so it isn't re-proposed
- **KI-04 declined.** Loan balance tracking will not be built. Recorded as closed in `known-issues.md` so it isn't re-proposed

**Card payments are now a type, not a description (KI-01):**
- `expenses` gained a nullable `card_id` FK to `cards`, `ON DELETE SET NULL`. Null means an ordinary expense; set means the row is a payment toward that card. This is the real link that replaces guessing from label text
- The cash expense form gained a **Type** toggle — *Expense* / *Card payment* — mirroring the Charge/Payment control the card transaction form already had. The cash form previously had no type at all, which is why recording a payment meant hand-typing a description that looked like an ordinary purchase, and why the same payment ended up spelled three different ways
- Choosing Card payment reveals a card picker and pre-fills the label as `Payment — <CARD>`. The label stays editable, and a user-typed label is never overwritten — only a blank field or a previously generated one is replaced
- Card payments show a chip in the card's own colour on the row's category/date line. It sits there rather than beside the label because the label ellipsizes, which hid the chip entirely on longer labels
- The expense edit form gained a card selector, so existing rows can be tagged or corrected without SQL
- Excel export/import carry a `Card Payment` column, resolved by card name in both directions, so the tag survives a backup round-trip
- **Deliberately not changed:** budget maths. A card payment still counts toward the budget exactly as before. Making the budget treat payments differently is [upgrade idea 01](upgrade-ideas/01-budget-doesnt-see-card-spending.md), a separate decision that this change unblocks
- Cache version bumped to `?v=134`
