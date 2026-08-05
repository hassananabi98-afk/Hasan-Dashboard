# Idea 02 — Anyone can read and edit the database

**Status:** Proposed. Nothing has been changed.
**Found:** 26 July 2026, during a repo/data exposure check.
**Severity:** High. This is the most serious item in this folder.

> **No private data in this file.** The repo is public and GitHub Pages serves
> from the root. State evidence as ratios and percentages, never as amounts, and
> don't name merchants or banks.

---

## The problem in one sentence

The PIN screen protects the *page*, not the *data* — and the data has no other
lock on it.

## How it works today

1. `script.js` contains the Supabase project URL and the anon key. Both are
   visible to anyone: the repo is public, and even if it weren't, the browser
   downloads that file to display the site.
2. Line 39 calls `supabase.auth.signInAnonymously()`. Anyone can call this. It
   hands out a token with the role `authenticated`, no approval, no account.
3. Every table has one policy — `allow_auth` — granting `ALL` commands to the
   role `authenticated`, with `USING (true)` and `WITH CHECK (true)`.

`ALL` means select, insert, update **and delete**. `true` means every row.

So the sequence is: read the key → sign in anonymously → read, change or delete
anything. The PIN never enters into it, because nobody doing this loads your
page. They talk to the database directly.

## What's exposed

All 13 tables, which between them hold income, budgets, loan repayments and
lenders, both credit cards with balances and limits, every transaction, family
money transfers, plus prayers, meals, health sessions and supplements.

Deletion is the part worth sitting with. There is no backup in this setup — if
the tables were emptied, the history is gone.

## Supabase agrees

The project's own security linter reports, without being asked:

| Linter check | Tables affected |
|---|---|
| `rls_policy_always_true` — *"effectively bypasses row-level security"* | all 13 |
| `auth_allow_anonymous_sign_ins` — *"policies allow access to anonymous users"* | all 13 |
| `anon_security_definer_function_executable` | `rls_auto_enable()` |
| `auth_leaked_password_protection` disabled | project-wide |

## The PIN is also weak, separately

`PIN_HASH` in `script.js` is a plain SHA-256 of a 4-digit PIN. There are only
10,000 possible 4-digit PINs, so hashing all of them and finding the match takes
well under a second on any laptop.

This is a smaller issue than it looks, because the PIN isn't what's protecting
the data — but if the same 4 digits are used anywhere else, change them.

## Why there's no quick fix

Every obvious shortcut breaks the app:

- **Turn off anonymous sign-ins** → `signInAnonymously()` fails, dashboard stops loading.
- **Tighten the policies to one user** → your own anonymous session gets a new user ID each time, so you'd lock yourself out too.
- **Make the repo private** → the key still ships to every browser that loads the live site. Also GitHub Pages won't serve a private repo on the free tier, so the site would go down.

The auth model itself has to change. That's a proper task, not a toggle.

---

## The fix

Replace anonymous auth with a real account, then scope the policies to it.

**1. Create one real user** — email and password, made in the Supabase dashboard.
Nothing about this goes in the repo.

**2. Replace the PIN screen with a real login.** Same keypad look if you want to
keep it, but it calls `signInWithPassword()` instead of comparing a hash. The
password is typed by you and never stored in the repo; Supabase persists the
session, so it's still a one-time login per device.

**3. Re-scope all 13 policies.** Replace `allow_auth` with a policy keyed to that
one user ID. The user ID is not a secret and is safe to hardcode:

```sql
-- run once per table, after the account exists
DROP POLICY IF EXISTS allow_auth ON public.<table>;
CREATE POLICY owner_only ON public.<table>
  FOR ALL TO authenticated
  USING  (auth.uid() = '<your-user-id>')
  WITH CHECK (auth.uid() = '<your-user-id>');
```

**4. Disable anonymous sign-ins** in Auth settings. Do this only after step 2
works, or the app will stop loading.

**5. Review `rls_auto_enable()`.** It's `SECURITY DEFINER` and callable by
completely unauthenticated users over the REST API. If it isn't needed, revoke
`EXECUTE` from `anon` and `authenticated`.

**6. Turn on leaked-password protection** in Auth settings — one checkbox, checks
new passwords against known breaches.

## Order matters

Steps 1–3 can be prepared without breaking anything. Step 4 is the one that
switches the old path off, so it goes last, after a successful login has been
confirmed on a real device.

**Take a database backup before starting.** Supabase can export the tables from
the dashboard. Nothing in this list is destructive if followed in order, but the
data has no backup at all right now, which is its own problem worth fixing today
regardless of the rest.

## Effort

Roughly an hour, most of it in step 2. Steps 3, 4 and 6 are minutes. It needs
SQL run by you in the Supabase SQL Editor, per the rules in `CLAUDE.md`.
