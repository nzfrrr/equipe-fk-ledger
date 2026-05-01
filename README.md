# Equipe FK Production Ledger

A lightweight browser app for tracking real estate agents, listings, leases, referrals, payout status, production volume, and commissions.

## Open it

Open `index.html` in a browser for local prototype mode. No install step or server is required.

When Supabase is configured, the app switches to cloud mode and saves agents/deals in Supabase after sign-in.

## What it does

- Maintains an agent roster with contact info, team, status, and default split.
- Logs sales, leases, and referrals with client, property, transaction date, payment date, value, gross commission, team cut, agent cut, QST, GST, total with taxes, brokerage fees, notes, and status.
- Shows dashboard KPIs for gross commission, brokerage revenue, agent cut, closed deals, and sales volume.
- Ranks agent performance by deal count, sales volume, commission, and average commission.
- Filters and sorts the deal ledger by search, type, status, date, value, commission, and agent cut.
- Opens an agent-level dashboard from the roster or performance table with agent totals, activity mix, sortable activity history, and edit/delete actions for each deal.
- Exports the deal ledger as a CSV file.

## Data storage

Without Supabase config, data is saved in the browser's `localStorage` on the same machine and browser profile. Use `Export CSV` for backups.

The current demo dataset is seeded from the `Equipe FK` Google Sheet structure and 2026 production rows.

With Supabase config and a signed-in user, data is saved to the cloud database. If the cloud database is empty on first sign-in, the app seeds the current Equipe FK demo dataset.

## Supabase Setup

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Create the user account for your friend in Supabase Auth.
4. Copy `config.example.js` to `config.js`.
5. Fill in:

```js
window.APP_CONFIG = {
  supabaseUrl: "https://your-project-ref.supabase.co",
  supabaseAnonKey: "your-public-anon-key"
};
```

The anon key is public by design. The schema enables Row Level Security and only authenticated users can read/write rows.

## GitHub + Vercel Setup

1. Create a GitHub repository for this folder.
2. Push these files to GitHub.
3. Create a new Vercel project from that GitHub repository.
4. Vercel can deploy this as a static site with no build command.
5. After every future code push to GitHub, Vercel will redeploy the app.

Your friend uses the Vercel URL. You keep coding locally, push updates, and his data stays in Supabase.
