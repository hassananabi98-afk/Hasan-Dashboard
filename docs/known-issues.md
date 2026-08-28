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
is part of the monthly finance review, not a tracked bug. The app will **not**
prompt or remind; that was decided and settled, so don't propose reminder UI
for it again.)*

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

### KI-09 · Editing an expense into a card payment doesn't touch the card ledger — *won't fix*
**Status:** closed, declined 14 Aug 2026 · **Impact:** n/a

Creating a **new** card payment from the cash form mirrors it onto the card
automatically. Tagging an **existing** expense as a card payment through the
edit form only sets `card_id` — no card-ledger entry is generated, so the
card's own balance doesn't move until that entry is added by hand.

Deliberate: four historical rows already had their payments recorded on the
card side by hand before this feature existed, and auto-generating entries on
tag would have double-counted them. The same protection now applies to every
future edit, at the cost of a manual step if you retag an old row.

**Decided:** not changed. A prompt at tag-time ("also add this to the card?")
was considered and declined — kept here as a record so it isn't re-proposed.

### KI-10 · Drinks bought inside a shop stay lumped into that shop's category — *won't fix*
**Status:** closed, declined 14 Aug 2026 · **Impact:** n/a

A convenience-store run is logged as one line under Groceries; anything bought
inside it — soft drinks, energy drinks — disappears into that figure. Soft
drinks appear zero times in the dataset despite being bought near-daily, so
Food & Drinks understates by an unknown margin.

**Decided:** not wanted. Logging drinks as their own line, with or without a
one-tap quick-add, will not be built — kept here as a record so it isn't
re-proposed.

### KI-11 · A card payment keeps the category of what it paid off, not "debt repayment"
**Status:** open · **Impact:** data quality

When a cash expense is tagged as a card payment (`card_id` set), it keeps
whatever spending category was picked on the form — sometimes a category
unrelated to being a payment at all. Card payments are debt repayment, not
consumption, so left in place they inflate whichever category they happen to
land in, and every category total needs manual correction to back them out
before it means anything.

Possible fix: force the category to a fixed value (e.g. "Bills") whenever
`card_id` is set on a cash expense, or exclude `card_id`-tagged rows from
category totals entirely. Not yet decided.

### KI-12 · A cost paid straight from savings has no path into Cash Expenses
**Status:** open · **Impact:** data quality

Money spent via the Savings tab (a "use" transaction) never creates a
matching row in `expenses`. It is invisible to the Cash Expenses list, the
budget bar, and every category total — a deeper version of the gap
`upgrade-ideas/01-...` already tracks for card charges, since this kind of
spend doesn't even reach `card_transactions`.

Possible fix: prompt to also log a category expense when a savings "use" is
recorded, the way a card payment already mirrors onto the card ledger. Not
yet decided.

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
