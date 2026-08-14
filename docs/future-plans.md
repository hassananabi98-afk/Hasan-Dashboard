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

*None open.*

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
| Daily spend target vs. actual | The budget bar tracks the cycle total, but plans are now run off a **single daily living figure**. Showing today's spend against that target — and the week against its share — would make drift visible in days instead of weeks |
| Weekly checkpoint view | Both cycles reviewed so far went wrong inside the first week and weren't caught until far later. A per-week summary would surface it while the cycle can still absorb a correction |

Two rows were removed from this list as already shipped: **Export / backup**
(Settings → Data does Excel export and import) and **Calendar ring legend**
(live under the calendar grid).
