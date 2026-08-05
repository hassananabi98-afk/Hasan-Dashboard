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

Two rows were removed from this list as already shipped: **Export / backup**
(Settings → Data does Excel export and import) and **Calendar ring legend**
(live under the calendar grid).
