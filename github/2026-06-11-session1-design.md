# Session 1 Design — Hassan Personal Dashboard v2

**Date:** 2026-06-11
**Scope:** Supabase project setup + GitHub hosting + PIN-gated tab shell with calendar UI (no data reads/writes)

---

## Goals

By end of session, the following is true:

- Supabase project exists with all 11 tables created and RLS enabled
- A private GitHub repo hosts `index.html`
- App loads in browser, creates an anonymous Supabase auth session, shows a PIN screen
- After correct PIN: 5-tab shell renders with bottom nav
- Calendar tab shows a functional month grid with prev/next navigation
- Tapping any day (past, present, or future) opens an empty day view
- All other tabs show titled placeholder screens
- Settings is accessible via a gear icon in the top-right header

---

## Hosting & Deployment

- **Repo:** Private GitHub repository
- **File:** Single `index.html` — all CSS and JS inline, no build tools
- **Supabase SDK:** Loaded via CDN (`esm.sh` or `cdn.jsdelivr.net`)
- **Deployment:** Drag `index.html` to Netlify when ready (future session)
- **Local dev:** Open `index.html` directly in browser

---

## Security Model

- Supabase anon key lives in `index.html` — acceptable for a private repo
- On app load: check `localStorage` for existing Supabase anon session
  - If none: call `supabase.auth.signInAnonymously()` to create one
  - Store session in `localStorage` for persistence across reloads
- PIN is stored as a SHA-256 hash in the JS — never plaintext
- PIN check happens client-side after auth session is confirmed
- RLS policies on all tables: `auth.uid() is not null` — any valid anon session can read/write
- Anyone with the anon key but no valid session cannot access data

---

## Supabase Tables

All 11 tables created in one SQL migration. RLS enabled on each.

| Table | Purpose |
|---|---|
| `daily_tracking` | Smoking, patches, notes per day |
| `prayers` | 5 daily prayers per day |
| `meals` | Breakfast, lunch, dinner per day |
| `expenses` | Cash expense log |
| `cards` | Credit card definitions |
| `card_transactions` | Per-card charges and payments |
| `health_sessions` | Physio, gym, dentist, etc. |
| `categories` | Expense categories with colors |
| `budget_settings` | Monthly budget total |
| `supplement_list` | Supplement definitions |
| `supplements` | Daily supplement taken log |

Full column definitions per `dashboard.md` spec — no changes to schema in this session.

---

## App Structure (`index.html`)

### Load sequence

1. Page loads → Supabase SDK initializes
2. Check `localStorage` for existing session
3. If no session → `signInAnonymously()` → store session
4. Show PIN screen
5. User enters PIN → hash and compare
6. On match → hide PIN screen → render app shell

### PIN screen

- Full-screen overlay
- Numeric keypad (0–9) + delete
- 4-digit PIN displayed as dots
- No "forgot PIN" — reset requires editing the JS

### App shell

- Top bar: page title (left) + gear icon (right)
- Content area: active tab renders here
- Bottom nav: 5 tabs — Calendar, Today, Finance, Health, Analytics

### Tab behavior

- Tab switching: show/hide div sections via JS, no page reloads
- Active tab icon and label highlighted in bottom nav
- Gear icon always visible, opens Settings view (replaces content area)

---

## Calendar Tab (functional in Session 1)

### Month grid

- Header: month + year label, left/right chevron buttons
- Day-of-week labels: S M T W T F S
- Days grid: 7 columns
- Today: visually highlighted (accent background)
- Past days: full opacity, tappable
- Future days: muted color, tappable
- Empty cells for days before the 1st of the month

### Day view

- Triggered by tapping any day cell
- Replaces calendar view (or slides up — decision at build time)
- Shows: formatted date, "Nothing logged yet" empty state
- Back button returns to calendar
- No data reads or writes in Session 1

---

## Placeholder Tabs (Session 1)

Each tab shows:
- Page title
- Muted subtitle: "Coming in Session X"
- No interactive elements

| Tab | Placeholder text |
|---|---|
| Today | "Daily logging — coming in Session 2" |
| Finance | "Finance tracking — coming in Session 3" |
| Health | "Health sessions — coming in Session 4" |
| Analytics | "Analytics — coming in Session 5" |
| Settings | "Settings — coming in Session 6" |

---

## What's Out of Scope

- No Supabase data reads or writes
- No supplement, category, or card management
- No analytics or charts
- No export or iPhone Shortcuts integration
- No Netlify deploy (deferred)

---

## Success Criteria

- [ ] Supabase project created, all 11 tables exist, RLS enabled
- [ ] `index.html` committed to private GitHub repo
- [ ] App loads, creates anon session, shows PIN screen
- [ ] Correct PIN reveals tab shell
- [ ] Calendar renders current month with correct day alignment
- [ ] Prev/next month navigation works
- [ ] Tapping any day opens empty day view
- [ ] Back button returns to calendar
- [ ] All 5 tabs navigate correctly
- [ ] Gear icon opens Settings placeholder
