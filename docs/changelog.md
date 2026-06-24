# Changelog & Roadmap

## Pending / Planned
| Item | Notes |
|------|-------|
| Edit existing card transactions | Currently delete + re-add only |
| Edit existing health sessions | Currently delete + re-add only |
| Quarterly analytics view | Spending grouped by quarter |
| iPhone Shortcuts integration | POST to Supabase REST from Shortcuts for quick logging |
| Export / backup | CSV or JSON export of all data |
| Calendar ring legend | Key showing what each ring colour means |
| PWA / home screen install | manifest + service worker for offline + install prompt |
| Rename categories backfill | Renaming a category does not update old expense rows |

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

---

## Session Notes

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
