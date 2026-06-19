# Session 2 Design — Daily Logging

**Date:** 2026-06-11
**Scope:** Today tab + Calendar day view — full daily logging with Supabase reads and writes

---

## Goals

By end of session, the following is true:

- Today tab shows full logging UI for the current date
- Calendar day view shows the same logging UI for any tapped date
- All data reads from and writes to Supabase
- Supplements can be added inline from both views
- Save button commits all changes with a toast confirmation

---

## Scope Decisions

- Both Today tab and Calendar day view built in this session (shared data model)
- Past and future calendar days use the same editable UI — no read-only mode
- Saving is explicit — one Save button per view, no auto-save
- Supplements managed inline for now — Settings-based management deferred to Session 6

---

## UI Structure

### Sections (same in both Today tab and day view)

1. **Prayers** — 5 toggles: Fajr, Dhuhr, Asr, Maghrib, Isha
2. **Meals** — 3 toggles: Breakfast, Lunch, Dinner
3. **Smoking** — 1 toggle (Smoked today) + 1 stepper (Patches used)
4. **Supplements** — dynamic toggle list + inline add button
5. **Notes** — textarea (How was today)
6. **Note for tomorrow** — textarea (Reminder for tomorrow)
7. **Save button** at bottom

### Interaction patterns

- Toggles: tap to flip on/off, blue when on
- Patches stepper: − and + buttons, min 0
- Supplements: tap "Add supplement" → inline text input appears → confirm adds to DB and renders new row
- Save: single button, disabled + "Saving..." during request, toast on success or error

---

## Data Flow

### On open (load)

1. Fetch `supplement_list` where `active = true`
2. Fetch `supplements` for the date → build taken map
3. Fetch `prayers` for the date → set toggles
4. Fetch `meals` for the date → set toggles
5. Fetch `daily_tracking` for the date → set smoking toggle, patches stepper, notes

### On save

1. Upsert `prayers` (conflict on date)
2. Upsert `meals` (conflict on date)
3. Upsert `daily_tracking` (conflict on date)
4. Delete existing `supplements` rows for the date → re-insert all

---

## Supplement Inline Add

- Tapping "Add supplement" reveals a text input + confirm button inside the card
- On confirm: insert into `supplement_list` (name, active: true) → push to local state → re-render rows
- New supplement appears immediately with toggle off
- Input clears, add button restores

---

## Today Tab vs Day View

Both views use identical HTML structure and JS logic. They maintain separate state objects (`suppState` for day view, `tsuppState` for today tab) to avoid conflicts when both are loaded simultaneously.

Today tab reloads data every time the tab is switched to, ensuring it always reflects the latest state.

---

## Post-Build Fixes

Several issues were discovered and resolved after the initial build:

### 1. Anonymous sign-ins disabled
Supabase project had anonymous sign-ins off by default. Enabled via Authentication → Sign In / Providers → Allow anonymous sign-ins.

### 2. RLS policies blocking authenticated users (403)
Original policy `auth.uid() is not null` was evaluated in the wrong role context. Replaced with:
```sql
create policy allow_auth on <table> for all to authenticated using (true) with check (true);
```

### 3. Missing GRANT permissions (403 / PostgREST error 42501)
Tables created via SQL editor don't automatically grant permissions to the `authenticated` role. Fixed with:
```sql
grant select, insert, update, delete on all tables in schema public to authenticated;
```

### 4. .single() throwing on empty rows (406 / PGRST116)
`loadDayData` used `.single()` which errors when no row exists for a date. Replaced all 4 occurrences with `.maybeSingle()` which returns null gracefully.

### 5. Auth session not ready before first requests
Added `onAuthStateChange` listener waiting for `INITIAL_SESSION` event before showing PIN screen, ensuring the Supabase client has a valid session before any data calls are made.

---

## Success Criteria

- [x] Today tab loads current date label and all section data from Supabase
- [x] Calendar day view loads data for tapped date
- [x] All toggles and stepper reflect saved state on load
- [x] Saving writes to all 4 tables correctly
- [x] Toast shows "Saved ✓" on success, error message on failure
- [x] Adding a supplement persists to DB and appears in the list
- [x] Switching to Today tab refreshes data
- [x] All Supabase requests return 200
