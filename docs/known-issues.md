# Known Issues

Bugs and data-quality problems found but not yet fixed. Small things go here;
anything needing a design decision goes in [`upgrade-ideas/`](upgrade-ideas/)
instead.

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root. Describe the shape of a problem, never the values — no amounts,
> balances, names, or credentials.

**Status key:** `open` · `investigating` · `fixed` (move to `changelog.md` when fixed)

---

## Data quality

### KI-01 · Card payments are recorded under inconsistent labels
**Status:** open · **Found:** 26 Jul 2026 · **Impact:** medium

The same credit card payment has been logged under three different label
spellings across two cycles. Nothing in the schema links an expense row to the
card it paid — the connection exists only in the text of the label.

Anything that needs to identify card payments (see
[upgrade idea 01](upgrade-ideas/01-budget-doesnt-see-card-spending.md)) has to
match on that text, and will silently miss a payment the moment a new spelling
appears. Silent wrong numbers are worse than visible missing ones.

**Fix direction:** add a nullable column on `expenses` referencing `cards.id`,
set when logging a card payment. Then the link is real rather than inferred.
Requires a schema change and a backfill of existing rows.

### KI-02 · Same merchant categorised inconsistently
**Status:** open · **Impact:** low

At least one merchant appears under two different categories in the same cycle —
a small purchase filed under food, a larger one under fitness. Category totals
and the donut chart are slightly off wherever this happens.

**Fix direction:** no code change needed. Either accept it, or add a
remembered merchant→category default when logging a repeat merchant.

---

## Operational

### KI-03 · No database backup exists
**Status:** open · **Impact:** high

There is no export, snapshot or copy of the data anywhere. Every record since
the dashboard started exists in exactly one place.

This compounds [upgrade idea 02](upgrade-ideas/02-anyone-can-read-and-edit-the-database.md):
the current access model permits deletion, and there would be no way back from it.

**Fix direction:** export from the Supabase dashboard, and repeat it on a
schedule. Manual is fine — the point is that a second copy exists.

---

### KI-06 · Excel export misses four tables
**Status:** open · **Found:** 27 Jul 2026 · **Impact:** high

`exportData()` in `script.js` writes one sheet per table, but four tables are
absent from the workbook:

| Missing table | Why it matters |
|---|---|
| `budget_settings` | Holds the salary-cycle definitions and budget totals. Without it a restored database has no cycles, and every finance figure becomes uncomputable. |
| `categories` | `expenses.category` is a foreign key to `categories.name`. Restoring expenses without it breaks referential integrity. |
| `custom_log_types` | Custom tracker definitions lost |
| `custom_log_entries` | Currently empty, but would be lost once used |

Verified by exporting and comparing sheet row counts against the live tables:
everything present matched exactly, so the bug is omission, not corruption.

This matters more than it looks — the export is currently the **only** backup
mechanism (see KI-03), so an incomplete export means an incomplete safety net.

**Fix direction:** add the four tables to the sheet list in `exportData()`.
Small change. Worth also adding a row-count assertion so a future table can't be
silently forgotten.

---

## Tracking gaps

### KI-04 · Loan balances are not tracked, only payments
**Status:** open · **Impact:** medium

Credit cards have a `cards` table with limits and a running balance from their
transaction history. Loans have neither — they appear only as a recurring
expense row each cycle.

The consequence: the dashboard can show what was paid this month, but not what
is still owed, how many payments remain, or when any loan ends. Total debt
position across cards and loans cannot be calculated at all, so there's no way
to see whether it's improving.

**Fix direction:** a `loans` table (name, original amount, monthly payment,
optional rate and start date) with the same treatment cards get. Bigger than a
bug — likely becomes its own upgrade idea if wanted.

---

## Repo hygiene

### KI-05 · Commits from web sessions show as Unverified on GitHub
**Status:** open · **Impact:** cosmetic

Author and committer are correct (`Claude <noreply@anthropic.com>`), but commits
carry no cryptographic signature, so GitHub marks them Unverified.

Signing is configured in the environment, but the key file it points at is empty
and owned by a different user than the session runs as. Not fixable from inside a
session, and not worth rewriting pushed history over. Cosmetic only — attribution
and content are unaffected.
