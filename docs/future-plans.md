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

### Q-03 · Rename the leftover `.anl-smoke-free` CSS class?
**Status:** open · **Raised:** 5 Aug 2026

Smoking tracking was removed from the app, but `.anl-smoke-free` survives in
`style.css` (two rules, light and dark) and is now applied to the **reading**
stat tiles to turn them green. The code works; the name just describes a feature
that no longer exists and will mislead the next person who greps for it.

**If yes:** rename to something like `.anl-stat-good` in `style.css` and the two
`renderReadingStats` lines in `script.js`. Cosmetic, needs a `?v=N` bump.

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
