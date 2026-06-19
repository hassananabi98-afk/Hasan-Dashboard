# Hassan Personal Dashboard v2 — Project Log

## Overview
A personal life management dashboard. Full calendar-based logging for daily health, finance, prayers, meals, supplements, and wellness tracking. Built as a standalone HTML web app backed by Supabase.

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (single file) |
| Backend | Google Apps Script (serves HTML only) |
| Database | Supabase (PostgreSQL) |
| Hosting | Google Apps Script Web App URL (moving to Netlify later) |
| Auth | PIN screen |

---

## Access

- **Old Dashboard URL (v1):** `https://script.google.com/macros/s/AKfycbye3RjzwfgI3jbYKZdQOSDliltSTP_e8f-cZvo-Y5VnMkc0DQbGb3Vyfpk_Y4pttIy-/exec`
- **Old Sheet ID (v1):** `1lhWfuTcP2bbqfMA-ih5JLcaP3VVczpBZMtI5PLOciP4`
- **Supabase Project:** To be created in Session 1
- **PIN:** To be set in Session 1

---

## Supabase Tables (Planned)

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
| category | TEXT | FK → categories.name |
| notes | TEXT | Optional |
| created_at | TIMESTAMP | Auto-set |

### cards
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | e.g. 'Ila', 'CrediMax' |
| limit | DECIMAL | Card limit |
| paid | DECIMAL | Amount paid so far |
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
| category | TEXT | |
| notes | TEXT | Optional |

### health_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| type | TEXT | 'physio', 'psycho', 'gym', 'dentist', or custom |
| notes | TEXT | Session notes |
| visible | BOOLEAN | Privacy toggle |

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | e.g. 'Food', 'Laundry' |
| color | TEXT | Hex color for charts |

### budget_settings
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| month | TEXT | e.g. '2026-06' |
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

## Dashboard Tabs (Planned)

### CALENDAR (main view)
- Full monthly calendar
- Tap any past or current day to open day view
- Color indicators per day: prayers, meals, gym, smoke
- Day view: log/edit everything for that date

### TODAY (quick log)
- Shortcut to today's day view
- Prayers checklist (5 individual)
- Meals (B/L/D)
- Smoking + patches
- Supplements checklist
- Notes + notes for tomorrow

### FINANCE
- Monthly budget (editable total)
- Cash expense log with custom categories
- Cards section (Ila, CrediMax, add more)
- Card transactions (charge/payment)
- Donut chart — spending by category
- Monthly analytics → quarterly view

### HEALTH
- Log sessions: physio, psycho, gym, dentist, custom
- Notes per session
- Privacy toggle per tracker type
- Monthly session count

### ANALYTICS
- Monthly spending breakdown
- Category trends over time
- Quarterly summaries
- Prayer completion rate
- Gym streak / best streak
- Smoking free days counter

### SETTINGS
- Manage categories (add/delete)
- Manage supplements list
- Manage cards
- Privacy toggles for health trackers
- Budget settings

---

## Build Sessions Plan

| Session | Focus |
|---------|-------|
| 1 | Supabase setup + all tables + calendar shell UI |
| 2 | Daily logging — prayers, meals, smoking, supplements |
| 3 | Finance — expenses, cards, categories |
| 4 | Health sessions |
| 5 | Analytics — monthly/quarterly charts |
| 6 | Polish — privacy toggles, iPhone shortcuts, export |

---

## iPhone Shortcuts Integration (Planned)
- Supabase REST API is natively compatible with iPhone Shortcuts
- HTTP POST requests can log data directly to Supabase tables
- No extra backend needed — Supabase handles it

---

## Key Differences from v1

| Feature | v1 | v2 |
|---------|----|----|
| Storage | Single JSON blob in Google Sheets cell | Proper relational tables in Supabase |
| History | Overwritten monthly | Full history forever |
| Calendar | None | Full backdating calendar |
| Categories | Hardcoded | Fully custom |
| Prayers | None | 5 daily prayers |
| Smoking | None | Daily smoke + patches tracker |
| Supplements | None | Custom supplement checklist |
| Analytics | Current month only | Monthly + quarterly trends |
| Notes | None | Per day, per session, per expense |
| Privacy | None | Per-tracker visibility toggle |

---

## Known Issues (v1 — not carrying forward)
- Export had stray "W" and "A" characters
- PIN embedded silently in code
- No backdating
- History lost every month
