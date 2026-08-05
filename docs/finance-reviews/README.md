# Monthly Finance Review

How the monthly finance review is produced, and what it checks.

> **⚠ No figures in this folder.** This repo is **public** and GitHub Pages serves
> from the root, so anything committed here is readable by anyone and would be
> live at a public URL with no PIN in front of it. Completed reviews contain
> salary, loan, card and family detail — they are kept **out of the repo**. See
> [Where the reviews live](#where-the-reviews-live).

---

## Why the review exists

The dashboard shows the current state. It does not tell you whether the month
went well, why it went the way it did, or what to do next. The review answers
those three questions once per cycle.

It also catches things the dashboard structurally cannot — most importantly,
that the budget bar cannot see credit card spending (see
[`../upgrade-ideas/01-budget-doesnt-see-card-spending.md`](../upgrade-ideas/01-budget-doesnt-see-card-spending.md)).

## The period to use

**Always the salary cycle, never the calendar month.**

The cycle is defined by `budget_settings.started_at`. A cycle runs from its own
`started_at` up to (but not including) the next cycle's `started_at`. The most
recent cycle whose `started_at` is on or before today is the current one.

This matters — cycles are not 30 or 31 days. Reviewing a calendar month instead
would split the salary-day payments across two reports and make every figure
wrong.

```sql
-- the cycle boundaries
SELECT month, total, started_at
FROM budget_settings
WHERE started_at IS NOT NULL
ORDER BY started_at;
```

## Before you start — take the backup

Settings → **Data** → **Export All Data (Excel)**, and keep the file somewhere
that isn't the database. Do this first, every cycle, before any review work.

This is the only backup that exists. There is no automatic one and the app
deliberately does not remind you (decided 5 Aug 2026) — so it is anchored here
instead, to the one thing that already happens once per cycle. A backup taken
last cycle does not cover this cycle's data.

It matters more than it sounds while
[upgrade idea 02](../upgrade-ideas/02-anyone-can-read-and-edit-the-database.md)
is open: the current access model permits deletion by anyone holding the key,
and the export is the only way back.

## What gets checked

### 1. Budget vs. cash
Sum `expenses` across the cycle, compare to `budget_settings.total`. This is the
number the dashboard shows.

### 2. The accrual restatement
The important one. Cash spending understates the truth whenever card balances
grow. Restate as:

```
cash spent  −  card payments  +  card charges  =  true cost of the month
```

Card payments are debt repayment, not consumption. Card charges are consumption
not yet paid for. A month can look balanced on cash and still be badly over.

### 3. Card ledgers, reconciled
For each card, rebuild the cycle from the full transaction history:

```
opening balance + charges − payments = closing balance
```

Reconstruct the opening balance from every transaction before the cycle start —
don't assume it. The rebuilt closing balance must tie exactly to the recorded
position, to three decimals, with no residual. If it doesn't, the review stops
until the discrepancy is explained.

Then check closing balance against `cards.limit`. Anything above 90% is a
finding; anything above 100% is critical.

### 4. Interest
Card transactions labelled as interest, this cycle vs. last. Rising interest
means balances are being carried, which means the repayment coverage is below
100%:

```
coverage = card payments ÷ card charges
```

Below 100%, the balance grows by arithmetic regardless of intent.

### 5. Shape of the month
Salary-day sweep vs. the days that follow. Daily burn rate per week — use
**spend per day**, not weekly totals, because the final week of a cycle is
usually a stub and raw totals would mislead.

### 6. Category ledger
Cash only, ranked. Unpack any category above ~50% — "Bills" in particular hides
loan repayments and card payments, which are not discretionary and shouldn't be
read as ordinary spending.

## Findings

Rank by severity, worst first. Three levels only:

| Level | Means |
|---|---|
| **Critical** | Money is being lost now, or a limit has been breached |
| **Warning** | A trend that becomes critical if it continues |
| **Held well** | Something working that should not be cut to fix the rest |

Always include at least one "held well" finding when one is true. A review that
only lists problems gets ignored, and the things going right are usually the
things most at risk of being sacrificed.

Every finding carries its evidence — the actual arithmetic, not a summary of it.

## The plan

Recommendations must be checked against **known upcoming costs** before being
issued. A paydown plan that ignores a pending car repair is worse than no plan,
because it converts available cash into card headroom that may not be large
enough to cover the bill.

When a real cost is coming but unquoted, the right output is a **decision table**
— "if it comes to X, do Y" — not a fixed instruction. Cash keeps its optionality;
card headroom does not.

## Writing it

- Plain language. No accounting vocabulary without explaining it in the same sentence.
- Every figure to three decimals, matching the dashboard's `fmtAmount()`.
- State what is assumed and what is measured, separately.
- If earlier advice turns out to be wrong, say so directly and give the corrected version. Don't quietly revise.

## Where the reviews live

Completed reviews are **not committed**. They are kept as:

- Published artifacts (private by default, shareable by link if you choose)
- Local files outside the repo

`.gitignore` in this folder blocks `*.html` so a finished review can't be
committed here by accident.

If you ever want them version-controlled, use a **separate private repo** —
don't make this one private, because GitHub Pages on the free tier won't serve a
private repo and the live dashboard would go down.

## Review log

Cycles reviewed so far. No figures — just what was found.

| Cycle | Period | Headline finding |
|---|---|---|
| July 2026 | 24 Jun – 25 Jul | Cash budget looked ~1% over; accrual restatement showed ~5×. Both cards finished at/above limit. Interest doubled. |
| August 2026 | 26 Jul – 25 Aug | Planned, not closed. Paydown deferred behind unquoted car repair and service — cash held deliberately. |
| August 2026 *(day-11 spot check, not a full review)* | 26 Jul – open | Both cards cleared to zero, no new charges, interest to nil — last cycle's "defer the paydown" advice was wrong and is corrected. Day-to-day spending excluding bills running ~1.8× last cycle's daily rate, but concentrated in the first few days; back under that rate since. |
