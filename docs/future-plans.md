# Future Plans & Open Questions

Anything waiting on a decision from Hassan. When a question is asked during a
session and the session ends without an answer, it gets written here rather than
lost — so the next session can pick it up instead of re-asking from scratch.

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root. Describe the shape of a problem, never the values — no amounts,
> balances, names, or credentials.

**Where things live:** open questions go here · bugs go in
[`known-issues.md`](known-issues.md) · anything needing a design write-up gets
its own doc in [`upgrade-ideas/`](upgrade-ideas/) · shipped work is recorded in
[`changelog.md`](changelog.md).

**Status key:** `open` · `answered` (move it to the relevant file and delete the
entry) · `dropped`

---

## Open questions

### Q-01 · Should the calendar ring legend get a "Note" entry?
**Status:** open · **Raised:** 5 Aug 2026

Days with a written note now show a small dot below the day number. The legend
under the calendar grid (`index.html`, `.cal-ring-legend`) explains the three
rings — Prayers, Meals, Reading — but says nothing about the dot, so it is the
only indicator on the grid with no key.

**Trade-off:** adding a fourth legend item makes the row wider, and on a narrow
phone it may wrap to two lines. The alternative is leaving the dot unlabelled
and relying on it being self-evident.

**If yes:** two lines in `index.html` plus a colour swatch, matching the
existing `.cal-ring-legend-item` markup.

### Q-03 · Rename the leftover `.anl-smoke-free` CSS class?
**Status:** open · **Raised:** 5 Aug 2026

Smoking tracking was removed from the app, but `.anl-smoke-free` survives in
`style.css` (two rules, light and dark) and is now applied to the **reading**
stat tiles to turn them green. The code works; the name just describes a feature
that no longer exists and will mislead the next person who greps for it.

**If yes:** rename to something like `.anl-stat-good` in `style.css` and the two
`renderReadingStats` lines in `script.js`. Cosmetic, needs a `?v=N` bump.

### Q-02 · Should a failed auto-save stay silent?
**Status:** open · **Raised:** 5 Aug 2026 · **Currently: showing the error**

`saveDayData` used to suppress its failure toast on auto-save (`if (!silent)`),
which meant a silently failing auto-save was invisible — the exact problem the
auto-save fix was meant to solve. It now shows `Save failed` on every path,
including auto-save; only the success toast stays silent.

This was implemented without being explicitly asked for, so it is logged here as
a standing decision to confirm or veto. Nothing is blocked either way.

---

## Pending changes

### P-02 · Check the database for orphaned columns and tables
**Status:** SQL ready to run · **Raised:** 5 Aug 2026

`notes_tomorrow` sat unused in `daily_tracking` for a long time before anyone
noticed. This checks whether anything else is in the same state. It could not be
run from the session that wrote it — the Supabase MCP call needed an approval
that never arrived, and the environment's network policy blocks direct HTTPS to
the project host — so it is recorded here to be run by hand.

Both queries are **read-only**. Paste into the Supabase SQL Editor.

**1 — columns the app never touches:**

```sql
with app_columns(tbl, col) as (values
  ('daily_tracking','id'),('daily_tracking','date'),('daily_tracking','reading'),
  ('daily_tracking','notes'),('daily_tracking','created_at'),
  ('prayers','id'),('prayers','date'),('prayers','fajr'),('prayers','dhuhr'),
  ('prayers','asr'),('prayers','maghrib'),('prayers','isha'),
  ('meals','id'),('meals','date'),('meals','breakfast'),('meals','lunch'),('meals','dinner'),
  ('expenses','id'),('expenses','date'),('expenses','label'),('expenses','amount'),
  ('expenses','category'),('expenses','notes'),('expenses','created_at'),
  ('cards','id'),('cards','name'),('cards','limit'),('cards','paid'),('cards','visible'),
  ('card_transactions','id'),('card_transactions','card_id'),('card_transactions','date'),
  ('card_transactions','label'),('card_transactions','amount'),('card_transactions','type'),
  ('card_transactions','category'),('card_transactions','notes'),
  ('health_sessions','id'),('health_sessions','date'),('health_sessions','type'),
  ('health_sessions','notes'),('health_sessions','visible'),
  ('categories','id'),('categories','name'),('categories','color'),
  ('budget_settings','id'),('budget_settings','month'),('budget_settings','total'),
  ('budget_settings','started_at'),
  ('supplement_list','id'),('supplement_list','name'),('supplement_list','active'),
  ('supplements','id'),('supplements','date'),('supplements','supplement_id'),('supplements','taken'),
  ('custom_log_types','id'),('custom_log_types','name'),('custom_log_types','emoji'),
  ('custom_log_types','active'),('custom_log_types','show_in_analytics'),('custom_log_types','created_at'),
  ('custom_log_entries','id'),('custom_log_entries','date'),('custom_log_entries','log_type_id'),
  ('custom_log_entries','value'),('custom_log_entries','created_at')
)
select c.table_name, c.column_name, c.data_type, c.is_nullable
from information_schema.columns c
left join app_columns a on a.tbl = c.table_name and a.col = c.column_name
where c.table_schema = 'public' and a.col is null
order by c.table_name, c.ordinal_position;
```

**2 — tables the app never reads:**

```sql
select table_name
from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
  and table_name not in ('daily_tracking','prayers','meals','expenses','cards',
    'card_transactions','health_sessions','categories','budget_settings',
    'supplement_list','supplements','custom_log_types','custom_log_entries')
order by table_name;
```

**Reading the result:** anything returned is a candidate for removal, not an
automatic delete. `created_at` columns the app doesn't read are worth keeping.
Before dropping anything, check it holds no data
(`select count(*) from t where col is not null`) — that's what made
`notes_tomorrow` safe. Paste the output back and it can be triaged properly.

**Before dropping any column**, remove every reference from `script.js` and
deploy first — the Excel import sends whole payloads, and PostgREST rejects an
entire sheet when a column in the payload doesn't exist.

---

## Planned features

Ideas agreed as worth doing, not yet built and not yet scheduled. Anything here
that needs a proper write-up before it can be decided gets promoted to its own
doc in [`upgrade-ideas/`](upgrade-ideas/).

| Item | Notes |
|------|-------|
| Edit existing card transactions | Currently delete + re-add only |
| Edit existing health sessions | Currently delete + re-add only |
| Quarterly analytics view | Spending grouped by quarter |
| iPhone Shortcuts integration | POST to Supabase REST from Shortcuts for quick logging |
| PWA / home screen install | manifest + service worker for offline + install prompt |
| Rename categories backfill | Renaming a category does not update old expense rows (`expenses.category` stores the name as text, not an FK) |

Two rows were removed from this list as already shipped: **Export / backup**
(Settings → Data does Excel export and import) and **Calendar ring legend**
(live under the calendar grid).
