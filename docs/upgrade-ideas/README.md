# Upgrade Ideas

Ideas for improving the dashboard that haven't been built yet. Nothing in this
folder is live — these are proposals waiting on a decision.

Each file explains one idea in plain language: what's wrong today, why it
matters, and the options for fixing it. No decision has been made on any of
them.

> **No private data in this folder.** The repo is public and GitHub Pages serves
> from the root. State evidence as ratios and percentages, never as amounts, and
> don't name merchants, banks or cards — an idea never needs the real figures to
> make its case.

| # | Idea | Status | Why it matters |
|---|---|---|---|
| [01](01-budget-doesnt-see-card-spending.md) | Budget doesn't see card spending | **Declined** — handled by the review process instead | July looked ~1% over budget. It was really ~5× that. Confirmed live again 14 Aug; the periodic finance review catches it, so the app doesn't need to. |
| [02](02-anyone-can-read-and-edit-the-database.md) | Anyone can read and edit the database | **Done** — see `changelog.md` | The PIN protected the page, not the data. Anyone could read, change or delete every table. |

## How to use this folder

When one of these gets built, move its summary into `docs/changelog.md` and
either delete the file or mark it **Done** in the table above.

When a new idea comes up, add a numbered file and a row here.
