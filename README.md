# Affinova

Affinova affiliate product discovery site.

## Local setup

1. Copy `.env.example` to `.env`.
2. Add your Supabase publishable key.
3. Run `npm install`.
4. Run `npm run dev`.

## Optional Google AdSense

AdSense is intentionally disabled when the AdSense environment variables are empty, so the site has no empty ad placeholders before monetization is configured.

After your AdSense account is approved and you have real ad-unit IDs, add:

- `VITE_ADSENSE_CLIENT` — your publisher client ID, for example `ca-pub-...`
- `VITE_ADSENSE_HOME_SLOT` — homepage slot ID
- `VITE_ADSENSE_DETAIL_SLOT` — product detail slot ID
- `VITE_ADSENSE_GUIDE_SLOT` — buying-guide slot ID

The reusable `AdSlot` component loads AdSense only when configured. It uses AdSense's `data-ad-status` behavior so unfilled units are hidden without leaving a decorative blank card.

Keep ads clearly separated from product controls and affiliate CTAs, and follow the current Google AdSense policies and your applicable privacy/consent requirements.

## Admin

The admin area uses Supabase Auth. A signed-in user's `profiles.role` must be `admin` to access the dashboard.
