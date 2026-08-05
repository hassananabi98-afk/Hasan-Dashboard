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

*(KI-01, KI-02, KI-04, KI-06 and KI-07 are retired — see
[`changelog.md`](changelog.md) for the fixes and
[`future-plans.md`](future-plans.md) for what was declined. Retired IDs are not
reused.)*

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

### KI-04 · Loan balances are not tracked, only payments — *won't fix*
**Status:** closed, declined 5 Aug 2026 · **Impact:** n/a

Loans appear only as a recurring expense each cycle, so the dashboard can show
what was paid but not what is still owed or when a loan ends. Total debt across
cards and loans therefore can't be calculated.

**Decided:** not wanted. Loan tracking will not be built — don't re-propose a
`loans` table or a total-debt figure. Kept here as a record of the decision so
the gap isn't rediscovered and raised again.

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
