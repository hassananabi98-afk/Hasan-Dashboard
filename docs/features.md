# Features — What Each Tab Does

What the dashboard currently does, tab by tab. This is the behaviour reference;
for colours, tokens and component specs see [`style-guide.md`](style-guide.md).

> **Keep this current.** This file describes live behaviour, so it goes stale
> faster than anything else in `docs/`. When a feature changes, update it in the
> same commit — a wrong description here is worse than no description, because
> the next session trusts it.

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root. Describe what a screen does, never what it contains — no
> amounts, balances, merchants or card names.

---

## CALENDAR
- Full monthly calendar with prev/next navigation; a "Today" chip appears only when viewing another month
- Tap any day → day view (log/edit prayers, meals, reading, supplements, notes)
- **Activity-style concentric rings** per day, one ring per type at a fixed radius:
  - 🟣 Prayers (outer) · 🟠 Meals (middle) · 🔵 Reading (inner)
  - Arc length = fraction of that type completed, so 3 of 5 prayers fills 60% of the purple ring. A faint 20%-opacity track completes partial rings; a complete ring draws as a full circle
  - Days with nothing logged stay clean
- Today's cell gets an accent disc behind the number — full-size when no rings are drawn, shrunk to sit inside the inner ring once any ring appears
- A legend under the grid names the three ring colours
- **Note dot** — days with a written note show a small **red** dot below the day number, inside the rings. Red rather than accent-blue so it isn't mistaken for the reading ring. White on today's disc, dimmed on future days. There is deliberately no legend entry for it
- Ring data loads per month; refreshes on return after any save
- Auto-saves 100ms after a toggle, 600ms after typing stops in notes

## TODAY
- Shortcut to today's day view (same UI as the Calendar day view)
- Same auto-save timings as above
- Reloads only when data changed since last visit (dirty flag), including after today was edited from the Calendar

## FINANCE
- Month navigation (prev/next — future months blocked)
- Monthly Budget box (violet) — Remaining, progress bar, total budget; tap amount to edit
- Salary cycle: press **Start New Month** when salary arrives → creates next month's cycle
  - Cycle open-ended until the next Start is pressed
- Cash expense log — add (type, amount, label, category, date, notes) + delete + edit
  - **Type** — *Expense* or *Card payment*, mirroring the toggle on the card transaction form. Choosing Card payment reveals a card picker and pre-fills the label as `Payment — <CARD>`, which stays editable; the row is stored with `expenses.card_id` set
  - Rows that are card payments show a small coloured chip in the card's colour next to the category and date, so they're identifiable whatever the label says
  - Tagging is what lets anything find card payments without guessing from label text. It does **not** change the budget maths — a card payment still counts exactly as it did before
- Donut chart by category:
  - Categories beyond the top 6, or under 2.5% share, fold into one gray "Other" arc so the donut doesn't sprout unreadable slivers
  - The legend below still lists **every** category by name, including the folded ones
  - Tapping a legend row or an arc filters the expense list and spotlights that arc; "All categories" clears it
- Cards section (CREDIMAX blue, ILA green) — all-time balance derived from transaction history
  - Tap the limit to edit it inline
  - Tap a card tile to expand its spending donut — **scoped to the current salary cycle**
- Card transactions — add (charge/payment, label, amount, category, date) + delete

## HEALTH
- Month navigation; reloads only when a session was added/deleted (dirty flag)
- Session type tiles — pill rows with coloured left accent, emoji, label, monthly count
- Tap a tile to hide it; a "Hidden (N)" section reveals hidden tiles; preference stored in localStorage
- Add session (type, date, notes) + delete with inline confirm

## ANALYTICS
- Reloads only when data changed since last visit (dirty flag)
- Period navigation follows the **salary cycle**, not the calendar month — same boundaries as Finance
- Reading tiles (left→right): day streak · days this month · days total (green)
- Prayer missed counter — all-time missed prayers up to today, not month-scoped
- Spending donut: per-category breakdown for the selected period, with month navigation
- Monthly spending bar: **one bar per month for the full current year (Jan–Dec)**, selected month highlighted
- Reading visibility toggleable in Settings

## SETTINGS
- Opens via the gear icon; re-fetches all data on every open
- **Categories** — inline rename, delete (2-tap), add new (auto colour)
- **Supplements** — active/inactive toggle, delete (2-tap), add new
- **Cards** — visible/hidden toggle, delete (3-tap, cascades to transactions), add new
- **Analytics Visibility** — toggle Reading; persisted in localStorage
- **Data** — Export All Data (Excel) and Import from Excel. Import updates existing records and adds new ones; nothing is deleted
