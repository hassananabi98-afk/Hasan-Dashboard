# Hassan Personal Dashboard v2 — Project Log

## Overview
A personal life management dashboard. Full calendar-based logging for daily health, finance, prayers, meals, supplements, and wellness tracking. Built as a standalone HTML/CSS/JS web app backed by Supabase.

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (single file at repo root) |
| Database | Supabase (PostgreSQL) |
| Hosting | GitHub Pages (`hassananabi98-afk.github.io`) |
| Auth | PIN screen (SHA-256 hash) |

---

## Access

- **Live URL:** `https://hassananabi98-afk.github.io`
- **Repo:** `https://github.com/hassananabi98-afk/Hasan-Dashboard`
- **Supabase URL:** `https://wrsqsrouliceqewkxvpw.supabase.co`
- **Old Dashboard URL (v1):** `https://script.google.com/macros/s/AKfycbye3RjzwfgI3jbYKZdQOSDliltSTP_e8f-cZvo-Y5VnMkc0DQbGb3Vyfpk_Y4pttIy-/exec`
- **Old Sheet ID (v1):** `1lhWfuTcP2bbqfMA-ih5JLcaP3VVczpBZMtI5PLOciP4`

---

## Repo Structure

```
index.html      ← served by GitHub Pages (main app)
script.js
style.css
README.md
docs/
  project-log.md
```

---

## Supabase Tables

### daily_tracking
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | Unique per day |
| smoked | BOOLEAN | Did you smoke today |
| patches | INTEGER | Nicotine patches used |
| reading | BOOLEAN | Read today — added S6 |
| notes | TEXT | General day notes |
| notes_tomorrow | TEXT | Note written today for tomorrow |
| created_at | TIMESTAMP | Auto-set |

### prayers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| fajr | BOOLEAN | |
| dhuhr | BOOLEAN | |
| asr | BOOLEAN | |
| maghrib | BOOLEAN | |
| isha | BOOLEAN | |

### meals
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| breakfast | BOOLEAN | |
| lunch | BOOLEAN | |
| dinner | BOOLEAN | |

### expenses
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| label | TEXT | Description |
| amount | DECIMAL | |
| category | TEXT | Stores name directly (not UUID FK) |
| notes | TEXT | Optional |
| created_at | TIMESTAMP | Auto-set |

### cards
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | e.g. 'ILA', 'CREDIMAX' |
| limit | DECIMAL | Card limit (reserved word — quoted in SQL) |
| paid | DECIMAL | Not used for balance; balance derived from transactions |
| visible | BOOLEAN | Show/hide card |

### card_transactions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| card_id | UUID | FK → cards.id |
| date | DATE | |
| label | TEXT | |
| amount | DECIMAL | |
| type | TEXT | 'charge' or 'payment' |
| category | TEXT | Optional |
| notes | TEXT | Optional |

### health_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| type | TEXT | 'gym', 'physio', 'psycho', 'dentist', or any custom string |
| notes | TEXT | Session notes |
| visible | BOOLEAN | Not used in UI yet |

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | e.g. 'Food', 'Transport' |
| color | TEXT | Hex color for charts |

### budget_settings
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| month | TEXT | Format: 'YYYY-MM' (label month of cycle) |
| total | DECIMAL | Monthly budget amount |
| started_at | DATE | Date user pressed ▶ Start — added S7 |

### supplement_list
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | Supplement name |
| active | BOOLEAN | Show in daily log |

### supplements
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| supplement_id | UUID | FK → supplement_list.id |
| taken | BOOLEAN | |

### custom_log_types *(reserved — not active in UI)*
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | |
| emoji | TEXT | |
| active | BOOLEAN | |
| show_in_analytics | BOOLEAN | |
| created_at | TIMESTAMP | |

### custom_log_entries *(reserved — not active in UI)*
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| log_type_id | UUID | FK → custom_log_types.id ON DELETE CASCADE |
| value | BOOLEAN | |
| created_at | TIMESTAMP | |

---

## Dashboard Tabs

### CALENDAR
- Full monthly calendar with prev/next navigation
- Tap any day to open day view
- Segmented ring per day — 1 log = full circle; 2–4 logs = arc segments with gaps
  - 🟣 Prayers, 🟠 Meals, 🔴 Smoking, 🔵 Reading
- Ring data loads per month; auto-refreshes when returning after any save
- Day view: log/edit prayers, meals, smoking, reading, supplements, notes
- Auto-saves 100ms after last change

### TODAY
- Shortcut to today's day view (same UI as Calendar day view)
- Auto-saves 100ms after any toggle/stepper/notes/supplement change
- Reloads only when data was changed since last visit (dirty flag)

### FINANCE
- Month navigation (prev/next, blocks future)
- Monthly Budget box — styled violet (#8b5cf6), card-like with header inside
  - Shows "💰 Monthly Budget" header + ▶ Start button (visible on current period only)
  - Displays Remaining (budget − spent), progress bar, total budget
  - Budget amount entered manually each cycle by tapping the amount
- Salary cycle: press ▶ Start when salary arrives → creates next month's cycle
  - Cycle runs from `started_at` date until next Start is pressed (open-ended)
  - e.g. press in late June → creates July 2026 cycle; period: Jun 26 → whenever July Start is pressed
- Cash expense log — add (label, amount, category, date, notes) + delete + edit
- Donut chart by category with manual legend
- Cards section (CREDIMAX blue, ILA green) — balance from all-time transactions
  - Card limit editable inline — tap "Limit BHD X.XXX ✎" → input → blur/Enter commits
  - Tap card tile to expand per-card spending donut
- Card transactions — add (charge/payment, label, amount, category, date) + delete

### HEALTH
- Month navigation; reloads only when a session was added/deleted (dirty flag)
- Session type tiles — vertical pill rows with colored left accent bar, emoji, label, monthly count
- Tap a tile to hide it; "Hidden (N)" section reveals hidden tiles; prefs in localStorage
- Add session (type, date, notes) + delete with inline confirm

### ANALYTICS
- Reloads only when data changed since last visit (dirty flag)
- Reading: day streak, days this month, days total
- Smoking: smoke-free streak, smoke-free days this month, smoked days this month
- Spending donut: per-category breakdown for selected month + legend; month nav
- Monthly spending bar: total spend per month, last 6 months; selected month highlighted solid blue
- Analytics Visibility: toggle Reading/Smoking in Settings

### SETTINGS
- Opens via gear icon; re-fetches all data on every open
- Categories — inline rename, delete (2-tap), add new (auto color)
- Supplements — active/inactive toggle, delete (2-tap), add new; syncs with daily log
- Cards — visible/hidden toggle, delete (3-tap + cascades transactions), add new
- Analytics Visibility — toggle Reading and Smoking; persisted in localStorage

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

---

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
- Monthly Budget box styled violet (`#8b5cf6`) to match card aesthetic (same `darkTint`/`hexA` functions)
- Title "💰 Monthly Budget" moved inside the violet box as card-style header
- ▶ Start button: press when salary arrives → creates next month's budget cycle
  - `budget_settings.started_at` records exact date pressed
  - Expense filter uses `started_at` of current cycle as start; end = `started_at` of next cycle (open-ended until next Start)
  - `currentPeriodYM()` finds most recent cycle where `started_at ≤ today`
  - e.g. press in late June → label becomes "July 2026"; cycle covers Jun 26 → until July Start

**Repo cleanup:**
- Removed `Code/`, `html/`, `md/` folders
- Removed `dashboard.md` from root
- `index.html`, `script.js`, `style.css` at root are the canonical files served by GitHub Pages
- Session notes consolidated into `docs/project-log.md`

**Implementation notes:**
- Root `index.html`/`script.js` = what GitHub Pages serves; always keep in sync with any changes
- `darkTint(hex, w)` and `hexA(hex, a)` helper functions used for card + budget box styling
- Budget cycle `month` key = label month (e.g. '2026-07'); `started_at` = actual start date (e.g. '2026-06-26')
