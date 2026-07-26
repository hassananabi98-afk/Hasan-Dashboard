# Idea 01 — The budget doesn't see card spending

**Status:** Proposed. Nothing has been built or changed.
**Found:** July 2026 finance review (cycle 24 Jun – 25 Jul 2026).

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

| | Amount |
|---|---|
| Charged to the two cards | 152.854 |
| Paid back to the two cards | 106.354 |
| **Bought but never counted** | **45.770** |

That 45.770 is real shopping — IKEA, R&B, groceries, New Yorker — that happened
in July and simply never reached the budget.

The result:

| | Amount | What the dashboard said |
|---|---|---|
| What the budget showed | 11.632 over (1.02%) | "Slightly over, no big deal" |
| What actually happened | 58.132 over (5.11%) | Five times worse |

The dashboard wasn't broken and the data wasn't wrong. It measured the thing it
was built to measure. That thing just isn't the whole picture.

---

## Why this isn't a quick fix

The obvious answer is "just tell the budget to count card charges too." That
creates a worse problem: **everything gets counted twice.**

Here's the IKEA purchase, 25.000 on CrediMax:

1. **21 July** — you buy it on the card. The fix counts it. ✅ Correct.
2. **26 July** — you pay the CrediMax bill and log it as an expense.
   The budget counts it **again**. ❌ Now you've "spent" 50.000 on one chair.

To avoid this, the app has to be able to look at an expense and know *"this one
is a card payment, skip it."*

**Right now it can't tell.** You've written that same payment three different
ways:

- `CrediMax` (24 June)
- `ILA Credit Card` (24 June)
- `BBK Credit Card` (26 July)

Guessing from the text would work until the day you type it slightly
differently, and then the budget would quietly go wrong with no warning. That's
worse than the problem we started with.

---

## The three options

### Option A — Make the budget tell the truth

**What changes:** The budget counts things when you *buy* them, not when you
*pay* for them. Paying off a card stops counting as spending — because it
isn't. You're returning borrowed money, not buying anything.

**What you'd see:** July's bar would have read 1,195.440 instead of 1,148.940,
and it would have gone red at the right time.

**What it needs:** A small addition to the database so the app can mark an
expense as "this is a card payment, don't count it." One SQL command, run once
by you, plus tagging the five card payments already recorded.

**Trade-off:** This is the correct answer, but it changes what the number
means. The bar would show a bigger figure than you're used to, and it needs a
database change to be safe.

---

### Option B — Leave the budget alone, show the hidden part

**What changes:** Nothing about the budget bar. It keeps working exactly as it
does today.

**What you'd see:** A small line next to the bar:

> **+45.770 added to card debt this month**

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

Option A is the proper accounting fix and worth doing eventually, but it should
wait until the card payments are properly tagged in the database. Until then it
would be guessing from text, and a budget that's silently wrong is worse than
one that's openly incomplete.

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
