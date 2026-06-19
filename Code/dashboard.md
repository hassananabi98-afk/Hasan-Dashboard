# Hasan Personal Dashboard — Developer Reference

**Stack:** Vanilla HTML / CSS / JS (ES module) · Supabase (PostgreSQL + anon auth) · Chart.js 4 · SheetJS (xlsx) · GitHub Pages  
**Deploy:** Push to `main` → GitHub Actions builds to Pages  
**Cache-bust:** bump `?v=N` on `style.css` and `script.js` in `index.html` after every JS/CSS change

---

## File Layout

```
index.html   536 lines   HTML shell + inline Finance/Health/Settings markup
style.css    545 lines   All CSS (light + dark variables, iOS HIG palette)
script.js   2416 lines   All logic (ES module, single IIFE-like block)
```

---

## Architecture

Single-page app, no bundler. Everything is in one ES module loaded by `<script type="module" src="script.js?v=N">`.  
Supabase is imported from CDN (`@supabase/supabase-js@2`) as an ES module.  
Chart.js is loaded as a UMD `<script>` before the module, so `Chart` is a global.  
SheetJS (`xlsx.js`) is loaded as a UMD `<script>` before the module, so `XLSX` is a global.

### Auth
Anonymous Supabase auth (`signInAnonymously`). Session persisted in `localStorage` under key `hd_session`. PIN gate (`SHA-256` hash compared to `PIN_HASH` constant) guards the app shell.

### Routing / Tabs
`switchTab(name)` swaps `.tab.active` and `.nav-item.active`. Tabs are lazy-loaded — finance/health/analytics only initialise once (`finLoaded`, `hlthLoaded`, `anlLoaded` guards).

### Pull-to-refresh
A `#ptr-bar` div sits at the top of `.content`. Touch handlers on `.content` detect a downward swipe from `scrollTop === 0`. The bar expands as the user pulls; releasing past 65 px threshold shows a spinner and calls `refreshCurrentTab()`, which dispatches to the correct load function for `activeTab`. After 800 ms the bar collapses.

### State pattern
Module-level `let` variables hold all runtime state. No framework, no stores. Each section has its own set:

```
finMonth / finCategories / finBudget / finExpenses / finChartInstance
finCards / finAllTxns / finMonthTxns
finCardCollapsed{} / finCardTxnType{} / finCardTxnCat{} / finCardCharts{}
finExpensesCollapsed / finLoaded
```

---

## Tabs

### Calendar
`renderCalendar()` — builds a 7-col CSS grid. Dots are drawn with SVG `<circle>` rings (one per tracked metric). `openDayView(y,m,d)` loads that day's data. Auto-save debounces writes (`scheduleAutoSave`).

**Supabase tables read:** `prayers`, `meals`, `daily_tracking`, `supplements`, `supplement_list`

### Today
Mirror of the Calendar day-view wired to today's date. Shares `loadDayData` / `saveDayData` with a different element prefix (`ttog-` vs `tog-`).

### Finance

#### Layout (3 sections rendered in HTML, cards injected by JS)
```
fin-section                        ← Monthly Budget
  budget-wrap (.fin-toggle-row)    ← always visible, tap → expand Cash Expenses
  budget-section-wrap (hidden)
    💵 Cash Expenses header + + Add
    fin-chart-section              ← donut (shown/hidden by JS when expenses exist)
    add-expense-form               ← hidden until + Add
    expense-list

fin-cards-container                ← injected by renderCardSections()
  card-section × N                 ← each card: always visible header, tap → expand
    card-toggle-hdr                ← name · balance · progress bar · limit
    card-body-{id} (hidden)
      card-donut-area-{id}
      Transactions header + + Add
      card-form-{id}               ← add transaction form
      card-list-{id}               ← month transactions
```

#### Key functions
| Function | What it does |
|---|---|
| `loadFinanceData()` | fetches categories, budget, expenses, cards, all transactions |
| `renderBudgetBar()` | renders the gray budget box (Spent / bar / limit) |
| `renderDonutChart()` | cash expenses donut; skips if section hidden or no data |
| `renderExpenseList()` | expense rows with inline edit and delete confirm |
| `bindExpenseForm()` | wires budget-box tap-toggle + `+ Add` button (bound once) |
| `renderCardSections()` | destroys old charts, rebuilds card HTML, wires events |
| `renderCardSectionHTML(card)` | returns HTML string for one card including `cardTheme()` CSS vars |
| `drawCardDonut(cardId)` | builds per-card Chart.js donut, stores in `finCardCharts` |
| `wireCardEvents()` | attaches all card event listeners after innerHTML write |
| `cardTheme(name)` | returns `{accent, accent2}` — CREDIMAX→blue, ILA→green, others→hash-stable palette |
| `hexA(hex,a)` | hex → `rgba(r,g,b,a)` |
| `darkTint(hex,w)` | blends hex toward near-black navy for card backgrounds |
| `submitCardTransaction(cardId)` | inserts row, updates local state, re-renders |
| `showTxnEditForm(id)` | replaces txn row with inline edit grid |
| `showTxnDeleteConfirm(id)` | inline confirm; deletes on confirm |

#### Category color palette
16 colours spread evenly around the hue wheel. Defined in four places that must stay in sync:

```js
CAT_COLORS          // Finance tab color picker (buildColorPalette)
SETT_CAT_PALETTE    // Settings tab color picker
palette             // drawCardDonut fallback (inline const)
palette             // saveNewCategory default assignment (inline const)
```

Current palette (ordered by hue angle):
```
#ef4444  Red        #f97316  Orange     #f59e0b  Amber      #eab308  Yellow
#84cc16  Lime       #22c55e  Green      #14b8a6  Teal       #06b6d4  Cyan
#3b82f6  Blue       #6366f1  Indigo     #8b5cf6  Violet     #a855f7  Purple
#d946ef  Fuchsia    #ec4899  Pink       #f43f5e  Rose       #6b7280  Gray
```

New categories are auto-assigned `palette[finCategories.length % palette.length]`. Existing categories store their colour in the `categories` table and are not affected by palette changes.

#### Category dropdown
`.cat-dropdown` uses `position:absolute; top:100%; left:0; right:0` anchored to `.cat-picker-wrap` (`position:relative`). No JS positioning needed. Avoids the mobile Safari `position:fixed` + `getBoundingClientRect` bug where the dropdown floated over the chart.

#### Per-card accent colors (CSS custom properties)
Each `.card-section` gets inline style vars computed by `cardTheme()`:
```
--card-accent      main accent colour
--card-accent-2    darker shade (used in top gradient bar)
--card-bg          darkTint(accent, 0.16) — card body background
--card-active      darkTint(accent, 0.30) — :active pressed state
--card-border      hexA(accent, 0.32)
--card-glow        hexA(accent, 0.12) — box-shadow
```

The CSS for `.card-section` and `.card-section::before` reads these vars, so every new card automatically gets the right color without any CSS changes.

#### Collapse / expand behaviour
- **Monthly Budget box** — always visible. Tap anywhere on the gray box (excluding edit affordances) → toggles `budget-section-wrap` (Cash Expenses).
- **Cards** — header row (`.card-toggle-hdr`) always visible. Tap → toggles `card-body-{id}`. State stored in `finCardCollapsed[cardId]` (`undefined/true` = collapsed, `false` = expanded).
- **Cash Expenses** inside `budget-section-wrap` — only visible when budget box is tapped open.
- **Donut charts** — `drawCardDonut` called on expand; chart destroyed + removed on collapse to free memory. Budget section donut skips render if parent is hidden.

#### Card form class names
The add-transaction form div carries **two** classes: `add-expense-form card-txn-form`.  
- `add-expense-form` — used by CSS for layout/styling  
- `card-txn-form` — used by `wireCardEvents()` to attach `input` listeners that enable the Save button  
Both must stay present; removing either breaks saving (button stays disabled) or styling.

#### Listener leak guard
`wireCardEvents()` runs on every render. The `document` outside-click handler for dropdowns is bound only once via `cardDocClickBound` flag.

**Supabase tables:** `categories`, `budget_settings`, `expenses`, `cards`, `card_transactions`

### Health
Month nav, session list, type tiles (tap to hide/show). Hidden types persisted in `localStorage` (`hlth_hidden`) and private flag in `hlth_private`.

**Supabase tables:** `health_sessions`

### Analytics

#### Spending
Month-nav donut chart (`renderSpendChart`) — category breakdown for selected month.

#### Monthly Spending bar chart (`renderTrendChart`)
Shows all 12 months of the **current year** (Jan–Dec). Empty future months render as zero-height bars. X-axis: `autoSkip: false`, font 9 px so all 12 labels fit on mobile without rotation.

#### Streaks
`renderSmokeStats` and `renderReadingStats` both use the same pattern:
1. Build a `loggedSet` (all dates with any entry) and a `goodSet` (dates with the positive attribute).
2. Sort `loggedSet` descending (most recent first).
3. Walk through it — increment streak while the date is in `goodSet`; break on the first date that isn't.
4. **Unlogged days are skipped entirely** — they do not break the streak. Only an actual bad log (smoked=true / reading=false) resets it.

`localDateStr(d)` is used everywhere date strings are generated to avoid UTC-offset bugs from `toISOString()`.

**Supabase tables:** `daily_tracking`, `expenses`, `categories`

### Settings
Manage categories (add / rename / recolor / delete), supplements (add / delete), cards (add with limit / delete), analytics visibility toggles.

#### Export — `exportData()`
Downloads a single **Excel `.xlsx`** file (via SheetJS `XLSX.write`) containing 9 sheets:

| Sheet | Notable transforms |
|---|---|
| Expenses | no IDs |
| Card Transactions | `card_id` → card name |
| Daily Tracking | `smoked`, `patches`, `reading` → Yes/No |
| Prayers | `fajr`, `dhuhr`, `asr`, `maghrib`, `isha` → Yes/No |
| Meals | — |
| Health | — |
| Supplements | `supplement_id` → supplement name; `taken` → Yes/No |
| Supplement List | `active` → Yes/No |
| Cards | `visible` → Yes/No |

**Supabase tables:** `categories`, `supplement_list`, `cards`

---

## Supabase Schema Summary

| Table | Key columns |
|---|---|
| `prayers` | `date`, `fajr`, `dhuhr`, `asr`, `maghrib`, `isha` |
| `meals` | `date`, `breakfast`, `lunch`, `dinner` |
| `daily_tracking` | `date`, `smoked`, `patches`, `reading`, `notes`, `notes_tomorrow` |
| `supplement_list` | `id`, `name`, `active` |
| `supplements` | `date`, `supplement_id`, `taken` |
| `categories` | `id`, `name`, `color` |
| `budget_settings` | `month` (YYYY-MM), `total` |
| `expenses` | `id`, `date`, `amount`, `label`, `category`, `notes` |
| `cards` | `id`, `name`, `limit`, `visible` |
| `card_transactions` | `id`, `card_id`, `date`, `type` (charge/payment), `amount`, `label`, `category`, `notes` |
| `health_sessions` | `id`, `date`, `type`, `notes` |

---

## CSS Variables (dark mode)

```css
--bg:       #000000   OLED black page background
--bg2:      #1c1c1e   cards, inputs, nav
--bg3:      #2c2c2e   tracks, steppers, toggles
--text:     #f0f0f0
--text2:    #999999
--text3:    #555555
--border:   rgba(255,255,255,0.1)
--accent:   #3b82f6   blue (buttons, toggles on)
--danger:   #ef4444
--success:  #22c55e
--radius:   12px
--radius-sm:8px
```

---

## Adding a New Card Color

Edit `cardTheme()` in `script.js`:
```js
if (n === 'mycard') return { accent: '#f97316', accent2: '#ea580c' } // orange
```
Name matching is `.toLowerCase().trim()`. No CSS change needed.

---

## Deployment Checklist

1. Make change in `script.js` / `style.css`
2. Bump `?v=N` for both in `index.html` (prevents stale browser cache)
3. `git add index.html style.css script.js && git commit && git push origin main`
4. GitHub Actions deploys in ~30 s

---

## Known Quirks

- **Double edit form**: tapping two transaction rows before saving spawns two edit forms. Any save/cancel triggers `renderCardSections()` which cleans up. Low priority.
- **Budget donut**: `finChartInstance` is reused (not destroyed on collapse), unlike per-card charts which are properly destroyed. No memory leak in practice — only one instance exists.
- **Progress bar danger threshold**: bars turn red at >80% utilisation (class `danger`). This is intentional; to remove per-card just drop the `.card-tile-fill.danger` override in style.css.

---

## Changelog

| Version | What changed |
|---|---|
| v=18 | Pull-to-refresh on all tabs; streak logic rewritten (unlogged days no longer break streak, local date used instead of UTC); Excel export replaces ZIP+CSV (9 sheets, names not IDs, Yes/No booleans); Monthly Spending shows full year Jan–Dec; Quarterly Spending removed; category dropdown fixed for mobile Safari (absolute not fixed positioning); 16-colour hue-wheel palette for categories |
| v=17 | Fix: card Save button permanently disabled — form div was missing `card-txn-form` class so `wireCardEvents()` never attached input validation listeners |
| v=16 | Per-card accent theming (`darkTint`, `hexA`, `cardTheme`); CREDIMAX→blue, ILA→green; budget box tap-toggle for Cash Expenses; `cardDocClickBound` listener leak guard |
