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

*(KI-03 is retired — a backup was taken on 5 Aug 2026. Re-exporting each cycle
is part of the [monthly review](finance-reviews/), not a tracked bug. The app
will **not** prompt or remind; that was decided and settled, so don't propose
reminder UI for it again.)*

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
