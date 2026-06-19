# Session 3 Design — Finance (Expenses, Budget, Categories, Chart)

**Date:** 2026-06-12
**Scope:** Finance tab — cash expense logging, monthly budget, categories, donut chart

> Cards + card transactions moved to Session 4 (alongside Health).

---

## Goals

By end of session, the following is true:

- Finance tab shows a monthly expense log with month navigation
- Monthly budget is settable and displayed as a progress bar
- Expenses can be added with amount, label, category, date, and optional notes
- Expenses can be deleted
- Donut chart shows spending breakdown by category
- Categories have preset defaults; new ones can be added inline
- All data reads from and writes to Supabase

---

## Scope Decisions

- **Cards deferred** — `cards` and `card_transactions` tables are not touched this session
- **Edit expense deferred** — delete + re-add is sufficient for now; edit UI goes in Session 6
- **Category management (rename/delete) deferred** — that lives in Settings (Session 6)
- **Quarterly analytics deferred** — goes in Session 5
- **No auto-save** — expense is inserted on confirm; budget upserts on blur/enter
- **BHD currency** — 3 decimal places throughout

---

## Pre-Session SQL

Run these in the Supabase SQL editor before building.

### Seed default categories

```sql
INSERT INTO categories (name, color) VALUES
  ('Food',          '#f97316'),
  ('Transport',     '#3b82f6'),
  ('Health',        '#22c55e'),
  ('Shopping',      '#a855f7'),
  ('Bills',         '#ef4444'),
  ('Entertainment', '#eab308'),
  ('Other',         '#6b7280');
```

### Confirm grants (if not already applied globally)

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
```

---

## UI Structure

### Finance Tab Layout (top to bottom)

1. **Month nav** — "‹ June 2026 ›" (same visual pattern as calendar header)
2. **Budget section** — progress bar showing spent vs budget; tap budget amount to edit
3. **By Category section** — donut chart (hidden if no expenses this month)
4. **Expenses section** — section title + "Add" button on the right; expense list below
5. **Add expense form** — appears inline below the section header when "Add" is tapped

### Budget Bar States

- **Budget set, under:** blue fill, "BHD 123.456 of BHD 500.000"
- **Budget set, over:** red fill, "BHD 523.456 of BHD 500.000 (over)"
- **No budget set:** dim text "Budget not set — tap to add", tap opens inline input

### Expense Row

```
[●] Category    Label                Jun 11   BHD 4.500   [×]
```

- Left: colored category dot + category name (muted)
- Middle: label (bold-ish), date below label in small muted text
- Right: amount right-aligned, × delete button

- Sorted: most recent date first; within same date, insertion order (id desc)
- No grouping headers — keep it flat and simple

### Add Expense Form (inline card, appears below "Expenses" header)

Fields:

| Field    | Type            | Default      | Notes                              |
|----------|-----------------|--------------|----------------------------------  |
| Amount   | number input    | empty        | Step 0.001, min 0                  |
| Label    | text input      | empty        | Max 80 chars                       |
| Category | custom picker   | last used    | Dropdown list; "+ New" at bottom   |
| Date     | date input      | today        | Allows backdating                  |
| Notes    | textarea        | empty        | Optional, 2 rows                   |

- "Add Expense" confirm button — disabled until amount > 0 and label filled
- "Cancel" link closes form without saving
- On confirm: insert → close form → prepend to list → update budget bar and chart

### Category Picker

- Appears as a small dropdown/sheet below the category field
- Each option: colored dot + name
- Last row: "+ New category" → reveals inline mini-form (name text input + color swatch picker)
- Color swatch picker: 8 preset colors shown as circles, tap to select
- Confirm adds to `categories` table, closes mini-form, auto-selects the new category

**Preset color palette for new categories:**

```
#f97316  #3b82f6  #22c55e  #a855f7
#ef4444  #eab308  #ec4899  #6b7280
```

---

## Donut Chart

- Library: **Chart.js 4** via CDN
  ```html
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  ```
- Type: `doughnut`
- Data: one slice per category that has expenses this month
- Colors: pulled from `categories` table
- Center overlay: a `<div>` absolutely positioned over the canvas showing total spent
  ```
  BHD 284.750
  total spent
  ```
- Hidden entirely if the month has zero expenses
- Chart instance stored as `finChartInstance`; call `.destroy()` before re-rendering to avoid canvas reuse error
- Legend: rendered manually below the chart as a CSS grid of dot + name + amount rows (not Chart.js built-in legend — it's too small on mobile)

---

## Data Flow

### State variables (module-level)

```js
let finMonth = ''          // 'YYYY-MM', initialized to current month on first load
let finCategories = []     // [{ id, name, color }] — loaded once, reused
let finBudget = null       // numeric or null
let finExpenses = []       // expense rows for current month
let finChartInstance = null
let lastUsedCategoryName = null
```

### On Finance tab open (first time)

1. Set `finMonth` to current month: `new Date().toISOString().slice(0, 7)`
2. Call `loadFinanceData()`

### On tab re-open (subsequent)

- Do NOT reload — Finance tab is stateful between visits (unlike Today tab)
- Exception: if `finMonth` is stale (user left app open overnight), re-check on focus

### loadFinanceData()

```
1. Load categories → finCategories
2. Load budget_settings WHERE month = finMonth → finBudget
3. Load expenses WHERE date LIKE 'YYYY-MM-%' ORDER BY date DESC, id DESC → finExpenses
4. renderBudgetBar()
5. renderExpenseList()
6. renderDonutChart()
```

### Month navigation

- Prev/next buttons modify `finMonth` (string arithmetic on YYYY-MM), call `loadFinanceData()`
- Prevent navigating beyond current month

### Add expense

```
1. Validate (amount > 0, label not empty, category selected)
2. INSERT into expenses { date, label, amount, category, notes }
3. finExpenses.unshift(newRow) — prepend to local state
4. Close form, clear inputs
5. renderBudgetBar()
6. renderExpenseList()
7. renderDonutChart()
```

### Delete expense

```
1. Show confirm (inline: swap row to "Delete?" + Confirm/Cancel buttons — no browser alert)
2. On confirm: DELETE from expenses WHERE id = X
3. finExpenses.splice(idx, 1)
4. renderBudgetBar()
5. renderExpenseList()
6. renderDonutChart()
```

### Edit budget

```
1. Tap budget amount → replace with <input> pre-filled with current value
2. On Enter or blur: UPSERT budget_settings { month: finMonth, total: newValue } ON CONFLICT month
3. finBudget = newValue
4. renderBudgetBar()
```

### Add category inline

```
1. User fills name + selects color swatch
2. INSERT into categories { name, color }
3. finCategories.push(newCat)
4. Re-render category picker options
5. Auto-select the new category in the open form
```

---

## New CSS Classes Needed

```
.fin-month-nav         — flex row, same style as .cal-header
.fin-section           — margin-bottom: 20px block
.fin-section-row       — flex row: title left, action button right
.fin-section-title     — same as .log-section-title (reuse)
.budget-bar-wrap       — full-width rounded bar container
.budget-bar-track      — bg3, border-radius 4px, height 6px
.budget-bar-fill       — accent or danger color, animates width
.budget-label          — "BHD X of BHD Y" text below bar
.budget-edit-input     — inline input replacing budget amount
.expense-row           — flex row for each expense (see structure above)
.expense-cat-dot       — 10px circle, colored inline dot
.expense-cat-name      — small muted category label
.expense-label         — main expense description
.expense-date-small    — muted date below label
.expense-amount        — right-aligned amount
.expense-delete-btn    — × button, danger color on tap
.expense-confirm-row   — inline delete confirmation (replaces row content)
.add-expense-form      — log-card style form, display:none by default
.cat-picker-wrap       — positioned dropdown for category selection
.cat-picker-option     — each category row in picker
.cat-swatch            — color circle in picker / new-category form
.color-palette         — flex wrap of 8 .cat-swatch circles
.donut-wrap            — position:relative, fixed height (~220px)
.donut-center          — absolute centered overlay div for total text
.fin-legend            — grid of category totals below chart
.fin-legend-row        — dot + name + amount
.fin-empty             — empty state placeholder for no expenses
.fin-add-btn           — small pill button: "+ Add"
```

---

## Edge Cases

| Situation | Behaviour |
|-----------|-----------|
| No budget set | Prompt text "Budget not set — tap to set" instead of bar |
| Budget = 0 or blank input | Treat as "not set", delete budget_settings row for month |
| Month has no expenses | Hide donut section; show empty state in expense list |
| Amount with too many decimals | Round to 3dp on input blur before inserting |
| Category name collision on add | Show inline error "Name already exists" |
| Delete mid-confirm, user switches month | Cancel confirm state on re-render |
| Chart.js not yet loaded when tab opens | Show spinner in chart area; render after script load |

---

## Success Criteria

- [ ] Finance tab loads on tab switch with correct current month
- [ ] Month nav correctly loads prior months' expenses
- [ ] Budget bar renders and updates when budget is set or edited
- [ ] Budget bar turns red when over budget
- [ ] Add expense inserts to DB and immediately reflects in list + chart
- [ ] Delete expense removes from DB and immediately reflects in list + chart
- [ ] Donut chart shows correct per-category breakdown
- [ ] Donut chart center shows total spent
- [ ] Inline category add persists to DB and appears in picker
- [ ] Empty state shown when month has no expenses
- [ ] All Supabase requests return 200
