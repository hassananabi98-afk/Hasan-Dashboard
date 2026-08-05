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

### Q-01 · Should the calendar ring legend get a "Note" entry?
**Status:** open · **Raised:** 5 Aug 2026

Days with a written note now show a small dot below the day number. The legend
under the calendar grid (`index.html`, `.cal-ring-legend`) explains the three
rings — Prayers, Meals, Reading — but says nothing about the dot, so it is the
only indicator on the grid with no key.

**Trade-off:** adding a fourth legend item makes the row wider, and on a narrow
phone it may wrap to two lines. The alternative is leaving the dot unlabelled
and relying on it being self-evident.

**If yes:** two lines in `index.html` plus a colour swatch, matching the
existing `.cal-ring-legend-item` markup.

### Q-02 · Should a failed auto-save stay silent?
**Status:** open · **Raised:** 5 Aug 2026 · **Currently: showing the error**

`saveDayData` used to suppress its failure toast on auto-save (`if (!silent)`),
which meant a silently failing auto-save was invisible — the exact problem the
auto-save fix was meant to solve. It now shows `Save failed` on every path,
including auto-save; only the success toast stays silent.

This was implemented without being explicitly asked for, so it is logged here as
a standing decision to confirm or veto. Nothing is blocked either way.

---

## Pending changes

*None open.*
