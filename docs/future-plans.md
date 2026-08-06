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

### Q-05 · Should tagging an *existing* expense also create the card entry?
**Status:** open · **Raised:** 5 Aug 2026 · **Currently: it does not**

Creating a new card payment from the cash form mirrors it onto the card. Using
the edit form to tag an expense that already exists only sets `card_id` — no
card entry is generated.

That was chosen for data safety: the four rows tagged by the KI-01 backfill
already have their payments recorded on the card side by hand, so generating
entries for them would double-count and corrupt both card balances.

The cost is a small inconsistency — if you log something as an ordinary expense
and *then* realise it was a card payment, you have to add the card entry
yourself. A safer version would offer the choice at the moment of tagging
("also add this to the card?") rather than deciding silently either way.
Nothing is blocked; flagging it so the asymmetry is a decision rather than an
accident.

### Q-07 · Should expenses record who they were for?
**Status:** open · **Raised:** 6 Aug 2026 · **Currently: they don't**

Nothing distinguishes the owner's own costs from the household's. A pharmacy or
clinic entry logged for a family member is indistinguishable from one for
himself, so any category read as *personal* health, spending or habit is really
a **household** figure.

This is not hypothetical: it produced a wrong conclusion in the August spot
check. A run of medical entries was read as the owner's own illness and the
review had to be corrected twice — first on who was unwell, then on what
followed from it. The two readings pointed at completely different actions.

A minimal marker (self / household) on each expense would settle it permanently.
The open question is whether it's worth the extra tap on every entry, or whether
it should default to *self* and only be set when it isn't.

### Q-08 · Should drinks be logged separately from the shop they came from?
**Status:** open · **Raised:** 6 Aug 2026 · **Currently: they're invisible**

Convenience-store runs are logged as a single line under Groceries. Anything
bought inside that trip — soft drinks, energy drinks — disappears into it. Over
the whole dataset to date, soft drinks appear **zero times**, while the owner
reports buying them near-daily.

So a category the owner actively wants to watch cannot be seen at all, and the
Food & Drinks figure understates by an unknown margin.

No app change may be needed — logging the drink as its own line would do it. The
question is whether that's realistic in the moment, or whether it needs a
one-tap quick-add to stand a chance of happening.

---

## Pending changes

*None open.*

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
| Weight tracking | Nothing records body weight. Gym sessions, meals and supplements are all logged, but the number they're aimed at has nowhere to live — so a trend is only noticed once clothes report it. Raised 6 Aug 2026 |
| Daily spend target vs. actual | The budget bar tracks the cycle total, but plans are now run off a **single daily living figure** (see [`finance-reviews/`](finance-reviews/)). Showing today's spend against that target — and the week against its share — would make drift visible in days instead of weeks |
| Weekly checkpoint view | Both cycles reviewed so far went wrong inside the first week and weren't caught until far later. A per-week summary would surface it while the cycle can still absorb a correction |

Two rows were removed from this list as already shipped: **Export / backup**
(Settings → Data does Excel export and import) and **Calendar ring legend**
(live under the calendar grid).
