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

### Q-04 · Should the app nudge you to take a backup?
**Status:** open · **Raised:** 5 Aug 2026

Settings → Data exports all 13 tables, but nothing reminds anyone to use it, and
no backup has been taken yet (see [KI-03](known-issues.md)). A backup that
depends on remembering is the one that doesn't happen.

**Options:** leave it fully manual · show the date of the last export in
Settings so a stale one is visible · prompt once per salary cycle, alongside
Start New Month, which is already a monthly habit.

Nothing here can be automated server-side — the export is generated in the
browser, so any prompt still ends in a manual tap.

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
