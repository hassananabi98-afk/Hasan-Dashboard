# Hassan Personal Dashboard v2 — Project Log

## Overview
A personal life management dashboard. Full calendar-based logging for daily health, finance, prayers, meals, supplements, and wellness tracking. Built as a standalone HTML web app backed by Supabase.

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (single file) |
| Database | Supabase (PostgreSQL) |
| Hosting | GitHub Pages (`hassananabi98-afk.github.io`) |
| Auth | PIN screen (SHA-256 hash) |

---

## Access

- **Live URL:** `https://hassananabi98-afk.github.io`
- **Old Dashboard URL (v1):** `https://script.google.com/macros/s/AKfycbye3RjzwfgI3jbYKZdQOSDliltSTP_e8f-cZvo-Y5VnMkc0DQbGb3Vyfpk_Y4pttIy-/exec`
- **Old Sheet ID (v1):** `1lhWfuTcP2bbqfMA-ih5JLcaP3VVczpBZMtI5PLOciP4`
- **Supabase URL:** `https://wrsqsrouliceqewkxvpw.supabase.co`

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
| name | TEXT | e.g. 'Ila', 'CrediMax' |
| limit | DECIMAL | Card limit (reserved word — quoted in SQL) |
| paid | DECIMAL | Not used for balance calc; balance derived from transactions |
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
| month | TEXT | Format: 'YYYY-MM' |
| total | DECIMAL | Monthly budget |

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

### custom_log_types *(reserved for future use — not active in UI)*
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | |
| emoji | TEXT | |
| active | BOOLEAN | |
| show_in_analytics | BOOLEAN | |
| created_at | TIMESTAMP | |

### custom_log_entries *(reserved for future use — not active in UI)*
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
- Segmented ring per day — one ring divided into arcs: 🟣 Prayers, 🟠 Meals, 🔴 Smoking, 🔵 Reading
- Single log = full circle; 2–4 logs = arc segments with gaps
- Ring data loads per month; auto-refreshes when returning to Calendar after any save
- Day view: log/edit prayers, meals, smoking, reading, supplements, notes
- Auto-saves 100ms after last change

### TODAY
- Shortcut to today's day view (same UI as Calendar day view)
- Auto-saves 100ms after any toggle/stepper/notes/supplement change
- Save button still present for manual trigger
- Reloads only when data was changed since last visit (dirty flag)

### FINANCE
- Month navigation (prev/next, blocks future)
- Monthly budget — set/edit with progress bar, turns red over budget
- Expense log — add (label, amount, category, date, notes) + delete
- Donut chart by category with manual legend
- Inline category add with color picker (8 presets)
- Cards section — add cards; balance computed from all-time transactions
- Card limit editable inline — tap "Limit BHD X.XXX ✎" → input → blur/Enter commits
- Card transactions — add (charge/payment, label, amount, category, date) + delete
- Tap card tile to expand per-card spending donut by category

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
- Monthly spending: bar chart last 6 months, selected month highlighted solid blue
- Analytics Visibility: toggle Reading/Smoking in Settings

### SETTINGS
- Opens via gear icon; re-fetches all data on every open
- **Categories** — inline rename, delete (2-tap), add new (auto color)
- **Supplements** — active/inactive toggle, delete (2-tap), add new; syncs with daily log
- **Cards** — visible/hidden toggle, delete (3-tap + cascades transactions), add new
- **Analytics Visibility** — toggle Reading and Smoking; persisted in localStorage

---

## Build Sessions Plan

| Session | Focus | Status |
|---------|-------|--------|
| 1 | Supabase setup + all tables + calendar shell UI | ✅ Done |
| 2 | Daily logging — prayers, meals, smoking, supplements | ✅ Done |
| 3 | Finance — expenses, budget, categories, donut chart | ✅ Done |
| 4 | Health sessions + cards + card transactions | ✅ Done |
| 5 | Analytics — smoking, spending, monthly trends | ✅ Done |
| 6 | Settings + calendar rings + Reading + polish + bug fixes | ✅ Done |
| 7 | Pending — see below | 🔜 Next |

---

## Pending / Planned (Session 7+)

| Item | Notes |
|------|-------|
| Edit existing expenses | Currently delete + re-add only |
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

### Session 2 — Daily Logging
- `.single()` throws on empty rows → replaced with `.maybeSingle()`
- Auth session not ready → added `onAuthStateChange` waiting for `INITIAL_SESSION`

### Session 3 — Finance
```sql
INSERT INTO categories (name, color) VALUES
  ('Food','#f97316'),('Transport','#3b82f6'),('Health','#22c55e'),
  ('Shopping','#a855f7'),('Bills','#ef4444'),('Entertainment','#eab308'),
  ('Other','#6b7280');
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
```
- Budget uses delete + re-insert; `expenses.category` is TEXT — renaming won't backfill

### Session 4 — Health + Cards
```sql
INSERT INTO cards (name, "limit", paid, visible) VALUES
  ('Ila', 300.000, 0.000, true),
  ('CrediMax', 300.000, 0.000, true);
```
- Card balance = all-time sum(charges) − sum(payments)
- `"limit"` is a reserved word in PostgreSQL — must be quoted

### Session 5 — Analytics
- Gym and prayers excluded from analytics by choice
- Monthly totals bar replaced stacked category chart (unreadable with sparse data)
- All analytics data parallel-fetched via `Promise.all`

### Session 6 — Settings + Calendar + Reading + Polish

**SQL required:**
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
ALTER TABLE custom_log_types ADD COLUMN IF NOT EXISTS show_in_analytics BOOLEAN DEFAULT false;
```

**Features added:**
- Reading toggle in Today + Calendar day view
- Reading analytics card (streak, this month, total)
- Calendar segmented rings — 1 log = full circle, 2–4 = arc segments; gym removed from rings
- Settings tab: categories, supplements, cards, analytics visibility
- Card limit editable inline; card tile tap → per-card spending donut
- Supplement delete (2-tap), card delete (3-tap + cascade)
- Auto-save: 100ms debounce on all changes — no manual Save needed
- Dirty-flag system: Today/Health/Analytics only reload when data actually changed
- Settings re-fetches all data on every gear icon tap

**Bug fixes:**
- Calendar 400: hardcoded day 31 invalid for short months → `new Date(year, month+1, 0)`
- Calendar 400: explicit column select conflicted with date filter → `select('*')`
- Analytics 400: `select('date,smoked,reading')` fails if reading column missing → `select('*')`
- Single calendar ring showed as nothing → SVG arc of 360° is degenerate → switched to `<circle>` element for single-log days
- Duplicate supplements: `loadTodayTab` called twice (nav click + switchTab) → removed redundant listener
- Supplement toggles not auto-saving → added `scheduleAutoSave` to `renderSuppRows`
- Supplements added from Settings not appearing in daily log → Settings re-fetches on every open; Today reloads via dirty flag
- Custom log types feature attempted then reverted — tables remain in DB for future use, UI removed

---

## Current File

| Version | Filename | Sessions covered |
|---------|----------|-----------------|
| Latest | `index-s6.html` | S1 → S6 + all post-build fixes |
