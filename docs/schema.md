# Database Schema — Supabase (PostgreSQL)

All tables use `authenticated` role with RLS enabled (`USING (true) WITH CHECK (true)`).

**Verified against the live database on 5 Aug 2026.** Every column and table
below exists, and the database holds nothing the app doesn't use — the orphan
check returned no rows in either direction.

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root. Document columns and types, never row values.

> **Note on RLS:** `USING (true) WITH CHECK (true)` means the policy grants
> everything to anyone holding the anon key, which ships in `script.js`. That is
> the subject of [upgrade idea 02](upgrade-ideas/02-anyone-can-read-and-edit-the-database.md).

---

## daily_tracking
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | Unique per day |
| reading | BOOLEAN | Read today |
| notes | TEXT | General day notes |
| created_at | TIMESTAMP | Auto-set |

## prayers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| fajr | BOOLEAN | |
| dhuhr | BOOLEAN | |
| asr | BOOLEAN | |
| maghrib | BOOLEAN | |
| isha | BOOLEAN | |

## meals
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| breakfast | BOOLEAN | |
| lunch | BOOLEAN | |
| dinner | BOOLEAN | |

## expenses
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| label | TEXT | Description |
| amount | DECIMAL | |
| category | TEXT | Stores category name directly (not UUID FK) |
| notes | TEXT | Optional |
| card_id | UUID | FK → cards.id, `ON DELETE SET NULL`. **Null = ordinary expense; set = this expense is a payment toward that card.** Added so card payments are identifiable without matching on label text (KI-01). Deleting a card unlinks the expense rather than deleting it |
| created_at | TIMESTAMP | Auto-set |

## cards
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | e.g. 'ILA', 'CREDIMAX' |
| limit | DECIMAL | Card limit (`"limit"` — reserved word, must be quoted in raw SQL) |
| paid | DECIMAL | Not used for balance; balance derived from transactions |
| visible | BOOLEAN | Show/hide card |

## card_transactions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| card_id | UUID | FK → cards.id |
| date | DATE | |
| label | TEXT | |
| amount | DECIMAL | |
| type | TEXT | `'charge'` or `'payment'` |
| category | TEXT | Optional |
| notes | TEXT | Optional |
| expense_id | UUID | FK → expenses.id, `ON DELETE CASCADE`. Set only on a payment that was created from the cash side, linking the two halves of one event. Deleting the expense removes this row automatically |

## health_sessions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| type | TEXT | `'gym'`, `'physio'`, `'psycho'`, `'dentist'`, or any custom string |
| notes | TEXT | Session notes |
| visible | BOOLEAN | Not used in UI yet |

## categories
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | e.g. 'Food', 'Transport' |
| color | TEXT | Hex color for charts |

## budget_settings
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| month | TEXT | Format: `'YYYY-MM'` — label month of the cycle |
| total | DECIMAL | Monthly budget amount (set by tapping the budget box) |
| started_at | DATE | Date user pressed Start New Month |

**Cycle logic:** `month` is the label (e.g. `'2026-07'`); `started_at` is the actual start date (e.g. `'2026-06-26'`). A cycle is open-ended until the next one is created.

## supplement_list
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | Supplement name |
| active | BOOLEAN | Show in daily log |

## supplements
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| supplement_id | UUID | FK → supplement_list.id |
| taken | BOOLEAN | |

## custom_log_types *(reserved — not active in UI)*
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | TEXT | |
| emoji | TEXT | |
| active | BOOLEAN | |
| show_in_analytics | BOOLEAN | |
| created_at | TIMESTAMP | |

## custom_log_entries *(reserved — not active in UI)*
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| log_type_id | UUID | FK → custom_log_types.id ON DELETE CASCADE |
| value | BOOLEAN | |
| created_at | TIMESTAMP | |
