# Hasan Personal Dashboard — Developer Reference

**Stack:** Vanilla HTML / CSS / JS (ES module) · Supabase (PostgreSQL + anon auth) · Chart.js 4 · GitHub Pages  
**Deploy:** Push to `main` → GitHub Actions builds to Pages  
**Cache-bust:** bump `?v=N` on `style.css` and `script.js` in `index.html` after every JS/CSS change

---

## File Layout

```
index.html   550 lines   HTML shell + inline Finance/Health/Settings markup  (cache-bust v=17)
style.css    547 lines   All CSS (light + dark variables, iOS HIG palette)   (cache-bust v=17)
script.js   2434 lines   All logic (ES module, single IIFE-like block)       (cache-bust v=17)
```

---

## Architecture

Single-page app, no bundler. Everything is in one ES module loaded by `<script type="module" src="script.js?v=N">`.  
Supabase is imported from CDN (`@supabase/supabase-js@2`) as an ES module.  
Chart.js is loaded as a UMD `<script>` before the module, so `Chart` is a global.

### Auth
Anonymous Supabase auth (`signInAnonymously`). Session persisted in `localStorage` under key `hd_session`. PIN gate (`SHA-256` hash compared to `PIN_HASH` constant) guards the app shell.

### Routing / Tabs
`switchTab(name)` swaps `.tab.active` and `.nav-item.active`. Tabs are lazy-loaded — finance/health/analytics only initialise once (`finLoaded`, `hlthLoaded`, `anlLoaded` guards).

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
Smoke-free streak, reading streak, spending donut (per month), 6-month bar trend, quarterly breakdown. All computed client-side from loaded data.

**Supabase tables:** `daily_tracking`, `expenses`, `categories`

### Settings
Manage categories (add / rename / recolor / delete), supplements (add / delete), cards (add with limit / delete), analytics visibility toggles. Export button generates CSV + ZIP via `exportData()`.

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

Edit `cardTheme()` in `script.js` around line 1060:
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
- **Queued GitHub Actions run**: Run #39 is stuck in "queued" state and cannot be cancelled via API. It will time out on its own and will NOT re-deploy (newer runs supersede it).

---

## Changelog

| Version | What changed |
|---|---|
| v=17 | Fix: card Save button permanently disabled — form div was missing `card-txn-form` class so `wireCardEvents()` never attached input validation listeners |
| v=16 | Per-card accent theming (`darkTint`, `hexA`, `cardTheme`); CREDIMAX→blue, ILA→green; budget box tap-toggle for Cash Expenses; `cardDocClickBound` listener leak guard |
