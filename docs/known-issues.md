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

### KI-07 · Meals sheet exports booleans differently from every other sheet
**Status:** open · **Found:** 5 Aug 2026 · **Impact:** low

Every boolean column in the Excel export goes through `yn()`, which writes
`Yes` / `No` — prayers, reading, supplements, card visibility, all of them.
`Meals` is the exception: `exportData()` writes `r.breakfast || ''`, so a logged
meal exports as `true` and an unlogged one as an empty cell.

**Not a data-loss bug.** The importer's `bool()` helper accepts `true`, `''`,
`Yes`, `1` and `y`, so the sheet round-trips correctly — `false → '' → false`.
The problem is that the one file that serves as the only backup (see KI-03) is
inconsistent with itself, and a blank cell is ambiguous to a human reading it:
it can't be told apart from a row that was never filled in.

**Fix direction:** wrap the three meal fields in `yn()` like every other boolean.
One line. The importer already handles both spellings, so old workbooks keep
importing correctly and no migration is needed.

*(KI-06 is retired — the Excel export gap it described was fixed. Retired IDs
are not reused.)*

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
