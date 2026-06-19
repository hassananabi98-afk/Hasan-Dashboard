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
| visible | BOOLEAN | Not used in UI yet (deferred to Session 6) |

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

---

## Dashboard Tabs

### CALENDAR
- Full monthly calendar with prev/next navigation
- Tap any day to open day view
- Color indicators per day: prayers, meals, gym, smoke — **Session 6**
- Day view: log/edit prayers, meals, smoking, supplements, notes

### TODAY
- Shortcut to today's day view
- Prayers (5 toggles), Meals (3 toggles), Smoking + patches stepper
- Supplements dynamic checklist + inline add
- Notes + note for tomorrow
- Explicit Save button with toast

### FINANCE
- Month navigation (prev/next, blocks future)
- Monthly budget — set/edit with progress bar, turns red over budget
- Expense log — add (label, amount, category, date, notes) + delete
- Donut chart by category with manual legend
- Inline category add with color picker (8 presets)
- Cards section — Ila, CrediMax; balance computed from all-time transactions
- Card transactions — add (charge/payment, label, amount, category, date) + delete
- Monthly analytics → quarterly view — **Session 5**

### HEALTH
- Month navigation
- Session type tiles (Gym 🏋️, Physio 🦴, Psycho 🧠, Dentist 🦷, Other ✦) with monthly counts
- Tap a tile to hide that type; "Hidden (N)" disclosure section reveals hidden tiles + their logs
- Hidden type preferences stored in localStorage
- Add session (type, date, notes) + delete with inline confirm

### ANALYTICS — Session 5
- Monthly spending breakdown
- Category trends over time
- Quarterly summaries
- Prayer completion rate
- Gym streak / best streak
- Smoking-free days counter

### SETTINGS — Session 6
- Manage categories (rename/delete)
- Manage supplement list (toggle active)
- Manage cards (add/hide)
- Privacy toggles for health tracker types
- Budget presets per month
- Calendar dot indicators (prayers, meals, gym, smoking)

---

## Build Sessions Plan

| Session | Focus | Status |
|---------|-------|--------|
| 1 | Supabase setup + all tables + calendar shell UI | ✅ Done |
| 2 | Daily logging — prayers, meals, smoking, supplements | ✅ Done |
| 3 | Finance — expenses, budget, categories, donut chart | ✅ Done |
| 4 | Health sessions + cards + card transactions | ✅ Done |
| 5 | Analytics — monthly/quarterly charts | 🔜 Next |
| 6 | Polish — settings, privacy toggles, calendar dots, iPhone shortcuts, export | — |

---

## iPhone Shortcuts Integration (Session 6)
- Supabase REST API is natively compatible with iPhone Shortcuts
- HTTP POST requests can log data directly to Supabase tables
- No extra backend needed — Supabase handles auth via anon key

---

## Key Differences from v1

| Feature | v1 | v2 |
|---------|----|----|
| Storage | Single JSON blob in Google Sheets | Proper relational tables in Supabase |
| History | Overwritten monthly | Full history forever |
| Calendar | None | Full backdating calendar |
| Categories | Hardcoded | Fully custom |
| Prayers | None | 5 daily prayers |
| Smoking | None | Daily smoke + patches tracker |
| Supplements | None | Custom supplement checklist |
| Analytics | Current month only | Monthly + quarterly trends |
| Notes | None | Per day, per session, per expense |
| Privacy | None | Per-tracker visibility toggle |
| Cards | None | Ila + CrediMax with transaction log |

---

## Session Notes

### Session 1 — Supabase Setup + Calendar Shell

**Post-build fixes:**
- Anonymous sign-ins were off by default — enabled via Auth → Sign In Providers
- RLS policy `auth.uid() is not null` evaluated in wrong role context — replaced with:
  ```sql
  create policy allow_auth on <table> for all to authenticated using (true) with check (true);
  ```
- Missing GRANT permissions (PostgREST error 42501):
  ```sql
  grant select, insert, update, delete on all tables in schema public to authenticated;
  ```

---

### Session 2 — Daily Logging

**Post-build fixes:**
- `.single()` throws on empty rows (PGRST116) — replaced all 4 with `.maybeSingle()`
- Auth session not ready before first requests — added `onAuthStateChange` listener waiting for `INITIAL_SESSION` before showing PIN screen

---

### Session 3 — Finance (Expenses, Budget, Categories, Chart)

**Scope change:** Cards moved to Session 4.

**Pre-session SQL:**
```sql
INSERT INTO categories (name, color) VALUES
  ('Food','#f97316'),('Transport','#3b82f6'),('Health','#22c55e'),
  ('Shopping','#a855f7'),('Bills','#ef4444'),('Entertainment','#eab308'),
  ('Other','#6b7280');

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
```

**Implementation notes:**
- Chart.js 4 loaded via CDN (`chart.umd.min.js`) as a regular script before the module script
- Budget uses delete + re-insert (avoids needing UNIQUE constraint on `month`)
- `expenses.category` stores category name as TEXT — renaming in Settings will not backfill old rows
- Finance tab lazy-loads on first tab switch; does not reload on subsequent visits
- Inline delete confirm replaces the row in-place (no `window.confirm()`)

---

### Session 4 — Health Sessions + Cards + Post-build Fixes

**Pre-session SQL:**
```sql
INSERT INTO cards (name, "limit", paid, visible) VALUES
  ('Ila', 1000.000, 0.000, true),
  ('CrediMax', 500.000, 0.000, true);
```
*(Update limit values to your actual card limits)*

**Implementation notes:**
- Card balance = sum(charges) − sum(payments) across ALL-TIME transactions (not monthly)
- Transaction list in Finance tab is month-scoped; card balance tiles are always all-time
- `"limit"` is a reserved word in PostgreSQL — must be quoted in raw SQL
- Health type tile privacy: tapping hides tile from main grid → "Hidden (N)" disclosure section appears; tapping disclosure expands hidden tiles + their logs; preferences in localStorage
- `hlthNormalizeType()` maps any non-standard string to 'other' for chip coloring
- Health lazy-loads on first tab switch

**Post-build fixes:**
- PIN screen: removed `gap: 40px` from outer flex container; wrapped title+dots+keypad in `.pin-inner` with `gap: 28px` — eliminates large empty space on tall screens
- All form confirm buttons renamed to "Save" / "Saving..." for consistency with Today tab's Save button
- Health privacy redesigned: original was opacity filter on tiles; changed to full hide + collapsible "Hidden" section with logs

---

## Current File

| Version | Filename | Sessions covered |
|---------|----------|-----------------|
| Latest | `index-s4.html` | S1 + S2 + S3 + S4 |
