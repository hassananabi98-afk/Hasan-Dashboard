# Idea 01 — The budget doesn't see card spending

**Status:** Proposed. Nothing has been built or changed.
**Found:** July 2026 finance review (cycle 24 Jun – 25 Jul 2026).

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root. Evidence below is given as ratios and percentages, never as
> amounts — the argument doesn't need the real figures, and the real figures
> would be readable by anyone. Same rule as
> [`../finance-reviews/`](../finance-reviews/).

---

## The problem in one sentence

The budget bar watches your **bank account**, not your **spending** — so
anything you put on a credit card is invisible to it until the bill arrives.

## Explained properly

When you buy something with cash or debit, money leaves your account that day.
The budget sees it and the bar moves.

When you buy something with a credit card, **no money leaves your account that
day**. The bank pays the shop, and you owe the bank. Your account balance
hasn't changed, so the budget bar doesn't move — even though you definitely
bought something.

The budget only finds out weeks later, when you pay the card bill and write
that payment down as an expense.

So the budget is always describing last month's shopping, not this month's.

## What it cost in July

| | Share |
|---|---|
| Paid back to the two cards, as a share of what was charged | ~70% |
| **Charged but never counted by the budget** | **~30% of charges** |

That uncounted third was real shopping — furniture, clothing, groceries — that
happened in July and simply never reached the budget.

The result:

| | Over budget | What the dashboard said |
|---|---|---|
| What the budget showed | ~1% | "Slightly over, no big deal" |
| What actually happened | ~5% | Five times worse |

The dashboard wasn't broken and the data wasn't wrong. It measured the thing it
was built to measure. That thing just isn't the whole picture.

---

## Why this isn't a quick fix

The obvious answer is "just tell the budget to count card charges too." That
creates a worse problem: **everything gets counted twice.**

Take one chair, bought on a card mid-month:

1. **Purchase day** — you buy it on the card. The fix counts it. ✅ Correct.
2. **Bill day** — you pay the card bill and log it as an expense.
   The budget counts it **again**. ❌ One chair, counted as two.

To avoid this, the app has to be able to look at an expense and know *"this one
is a card payment, skip it."*

**It can now tell — this blocker is gone.** As of 5 Aug 2026 `expenses.card_id`
links a payment to the card it paid, set from a Type toggle on the expense form,
and the historical rows have been backfilled.

This mattered more than it looked. The same card had been written both as its own
name and as the issuing bank's name — two labels with **no word in common**. Any
text-matching approach would have silently missed one of them, and a budget
that's quietly wrong is worse than one that's openly incomplete. That risk is
what made Option A unsafe before; it no longer applies.

---

## The three options

### Option A — Make the budget tell the truth

**What changes:** The budget counts things when you *buy* them, not when you
*pay* for them. Paying off a card stops counting as spending — because it
isn't. You're returning borrowed money, not buying anything.

**What you'd see:** July's bar would have read about 4% higher than it did, and
it would have gone red at the right time.

**What it needs:** Nothing new in the database — `expenses.card_id` already
marks which expenses are card payments, and the existing rows are tagged. Only
`renderBudgetBar()` and the donut need to start skipping rows where `card_id` is
set.

**Trade-off:** This is the correct answer, but it changes what the number
means. The bar would show a bigger figure than you're used to, and it needs a
database change to be safe.

---

### Option B — Leave the budget alone, show the hidden part

**What changes:** Nothing about the budget bar. It keeps working exactly as it
does today.

**What you'd see:** A small line next to the bar:

> **+XX.XXX added to card debt this month**

**What it needs:** Nothing new in the database. The card information is already
loaded on that screen for the same date range.

**Trade-off:** The headline number stays technically incomplete — but you can
see what it's missing, which is the part that actually matters. Lowest risk,
nothing can break, nothing gets double-counted.

---

### Option C — Both

Keep the familiar bar as the main number, add the true total underneath as a
second line.

**Trade-off:** Most informative, but two numbers on one screen can be confusing
when they disagree — and they will disagree every month you use the cards.

---

## Recommendation

**Option B first, Option A later.**

Option B can be built any time, changes nothing you rely on, and cannot break
anything — it just surfaces a number that's already sitting there. It solves
the real problem, which is that the card debt was growing invisibly.

Option A is the proper accounting fix and worth doing eventually. It was
previously gated on card payments being properly tagged in the database — that
is now done (KI-01, 5 Aug 2026), so Option A is buildable whenever you want it.
It still changes what the headline number means, which is the remaining reason
to think before building it.

---

## If we build it

**Option B** touches one function, `renderBudgetBar()` in `script.js`. The card
data it needs (`finMonthTxns`) is already loaded and already filtered to the
same salary cycle, so no new database queries are required.

**Option A** additionally needs a nullable column on `expenses` linking a row to
the card it paid — so the link is a real reference rather than a text match —
plus a one-off backfill of the existing payment rows.

Either way, `script.js` changes mean bumping `?v=N` on both asset lines in
`index.html`.
