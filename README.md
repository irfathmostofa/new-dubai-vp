# Vape Dubai King

React + Vite + Tailwind storefront running **entirely on Supabase** (Postgres, Auth, Edge Functions) and deployable as a static site on Netlify. There is no Node server.

| Concern | Where it lives |
|---|---|
| Database + security | `supabase/migrations/20261115000000_init.sql` (tables, Row Level Security, `place_order()`, `track_orders()`) |
| Catalog seed | `supabase/seed.sql` (generated from `src/data/products.ts` with `npm run seed:generate`) |
| Auth (customers + admin) | Supabase Auth. Admin = `profiles.role = 'admin'` |
| Emails (Resend) | `supabase/functions/send-email` |
| Client data layer | `src/lib/supabase.ts`, `src/services/backend.ts`, `src/store/useCartStore.ts` |

## Setup

### 1. Create the project and database
1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor**: paste and run `supabase/migrations/20261115000000_init.sql`, then run `supabase/seed.sql`.
   (Or with the CLI: `supabase link --project-ref <ref> && supabase db push`, then run the seed in the SQL editor.)

### 2. Configure Auth
- **Authentication > URL Configuration**: set *Site URL* to your Netlify URL and add these *Redirect URLs*:
  `https://YOUR-SITE.netlify.app/**` and `http://localhost:5173/**`
- **Authentication > Providers > Google**: enable it and paste your Google OAuth client ID/secret
  (authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`).
- Email/password sign-in works out of the box. Decide whether to require email confirmation
  (Authentication > Sign In / Providers > Email). For production, set up custom SMTP so confirmation emails are reliable.

### 3. Create your first admin
1. Open the site and create an account (Account > Sign in > "New here? Sign up").
2. In the SQL Editor run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Visit `/admin` and sign in. Only an admin can change another user's role afterwards.

### 4. Deploy the email function
```bash
supabase functions deploy send-email
supabase secrets set RESEND_API_KEY=re_xxx RESEND_FROM_EMAIL="Vape Dubai King <orders@yourdomain.com>"
```
Without `RESEND_API_KEY` the function still works and logs emails as `simulated_no_api_key`.

### 5. Run locally / deploy
```bash
cp .env.example .env     # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```
On Netlify, set the same two `VITE_` variables (Site settings > Environment variables). `netlify.toml` handles the build and SPA routing.

## How security works
- The browser only has the public **anon** key. Every table has Row Level Security; admin writes require `is_admin()`.
- Orders can only be created through `place_order()`, which **recomputes prices from the `products` table** (pack discounts, 350 AED free-shipping threshold). A tampered browser cannot change what an order costs.
- Customers read only their own orders. Guests refresh an order with `track_orders()`, which needs **both** the order number and the email.
- Roles cannot be self-assigned (database trigger), and signup metadata is never used to set a role.
- `email_logs` and `newsletter_leads` are written only by the Edge Function (service role) and readable only by admins.

## Scripts
`npm run dev` · `npm run build` · `npm run lint` (typecheck) · `npm test` · `npm run seed:generate`
