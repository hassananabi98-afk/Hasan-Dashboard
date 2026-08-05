# Upgrade Ideas

Ideas for improving the dashboard that haven't been built yet. Nothing in this
folder is live — these are proposals waiting on a decision.

Each file explains one idea in plain language: what's wrong today, why it
matters, and the options for fixing it. No decision has been made on any of
them.

> **No private data in this folder.** The repo is public and GitHub Pages serves
> from the root. State evidence as ratios and percentages, never as amounts, and
> don't name merchants, banks or cards — an idea never needs the real figures to
> make its case. Same rule as [`../finance-reviews/`](../finance-reviews/).

| # | Idea | Status | Why it matters |
|---|---|---|---|
| [02](02-anyone-can-read-and-edit-the-database.md) | **Anyone can read and edit the database** | Proposed — **highest priority** | The PIN protects the page, not the data. Anyone can read, change or delete every table. |
| [01](01-budget-doesnt-see-card-spending.md) | Budget doesn't see card spending | Proposed — awaiting decision | July looked ~1% over budget. It was really ~5× that. |

## How to use this folder

When one of these gets built, move its summary into `docs/changelog.md` and
either delete the file or mark it **Done** in the table above.

When a new idea comes up, add a numbered file and a row here.

Related: [`../finance-reviews/`](../finance-reviews/) — the monthly review
process that surfaced idea 01.
