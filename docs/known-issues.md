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

---

## Operational

### KI-03 · No backup has actually been taken
**Status:** open · **Impact:** high

The **mechanism** now exists — Settings → Data exports all 13 tables to Excel,
and the importer restores them. What's missing is a copy that has actually been
downloaded and stored somewhere other than the database itself, and any habit of
repeating it.

Until that happens every record since the dashboard started still exists in
exactly one place, which compounds
[upgrade idea 02](upgrade-ideas/02-anyone-can-read-and-edit-the-database.md):
the current access model permits deletion, and there would be no way back from it.

**Fix direction:** tap Export in Settings, keep the file somewhere off the
database, and repeat it each cycle. Manual is fine — the point is that a second
copy exists.

**Decided 5 Aug 2026:** the app will **not** prompt or remind. Backing up stays
a fully manual habit, so don't propose reminder UI for this again.

---

*(KI-06 and KI-07 are retired — both were fixed and recorded in
[`changelog.md`](changelog.md). Retired IDs are not reused.)*

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
