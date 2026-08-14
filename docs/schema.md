# Database Schema — Supabase (PostgreSQL)

All tables use the `authenticated` role with RLS enabled, scoped to the one
real account via an `owner_only` policy (`USING (auth.uid() = '<owner-id>')`).
Anonymous sign-ins are disabled, so the anon key shipped in `script.js` can no
longer reach any row.

**Verified against the live database on 5 Aug 2026; RLS re-scoped 14 Aug 2026**
(see [upgrade idea 02](upgrade-ideas/02-anyone-can-read-and-edit-the-database.md),
now done). Every column and table below exists, and the database holds nothing
the app doesn't use — the orphan check returned no rows in either direction.

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root. Document columns and types, never row values.

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
| household | BOOLEAN | `NOT NULL DEFAULT false`. **false = self, true = household.** Defaults to self; only set when it isn't (Q-07, 14 Aug 2026) |
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

## savings_transactions
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | DATE | |
| type | TEXT | `'add'` or `'use'` |
| amount | DECIMAL | |
| label | TEXT | What it was for / where it came from. `NOT NULL` at the column level, but optional in the UI — a blank entry stores `''`, not `NULL`; the list falls back to showing "Add"/"Use" for those rows |
| category | TEXT | Optional — only meaningful on `'use'` entries, mirrors `card_transactions` |
| notes | TEXT | Optional |

**No monthly cycle.** Unlike `budget_settings`, this table has no month or
`started_at` — balance is the running sum of `add` minus `use`, derived from
the full history the same way a card's balance is (added 14 Aug 2026). The
**displayed log** is filtered to the viewed salary cycle via `getPeriodTxns`
so it doesn't grow forever, but the **balance** always sums the full table —
same split as `card_transactions` between all-time balance and month-scoped
list (added 14 Aug 2026).

**Grants matter as much as RLS for a hand-created table.** `CREATE TABLE`
via raw SQL does not grant `SELECT`/`INSERT`/`UPDATE`/`DELETE` to
`authenticated` the way Supabase Studio's own table creator does — RLS
policies are checked *after* that base privilege, so a correct policy on a
table with no grant still denies everything with "permission denied for
table X," not an RLS-specific error. Hit and fixed 14 Aug 2026; any future
table created by hand needs an explicit
`GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;`
alongside its policy.

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
