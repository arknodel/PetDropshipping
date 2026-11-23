# Pending approvals

Set `Status:` to `APPROVED` or `REJECTED` (with a note). Approved items move to APPROVED.md.
An APPROVED status records your decision; the AI still confirms in chat before acting on it.
Passwords, 2FA codes, card/bank/payout/tax entry and CAPTCHAs are always done by you.

---

## APR-001 — Brand name
- Gate: business decision (no spend)
- Action: Pick one name from `data/brand.json` → `name_candidates` (or supply your own).
- Before approving: USPTO trademark search, .com availability, social handles.
- Status: PENDING

## APR-002 — Shopify account + plan
- Gate: #2 account creation / ToS, #1 spending (plan subscription), #5 payment/tax settings
- Action: AI opens https://www.shopify.com/ signup and pre-fills store name from `data/business.json`.
  You: create login, choose plan, enter billing card, accept terms, set up Shopify Payments / payouts / tax ID.
- Depends on: APR-001 (store name), `data/business.json` filled in by you.
- Status: PENDING

## APR-003 — GitHub repo + Pages
- Gate: #2 account / settings
- Repo: https://github.com/arknodel/PetDropshipping — **created by you (2026-11-22). Repo step DONE.**
- Remaining action: push this skeleton to `main` (needs your chat OK), then enable Pages
  (Settings → Pages → Source: GitHub Actions). Custom domain only after APR-007.
- Status: PENDING (Pages + first push)

## APR-004 — Shopify custom app + API scopes
- Gate: #2 granting API/OAuth scopes
- Action: AI navigates Shopify admin to the custom-app / Dev Dashboard flow
  (verify current creation path at time of execution; Shopify has moved this flow before).
  Requested Admin scopes (narrowest): `read_products`, `write_products`, `read_orders`,
  `read_inventory`, `read_fulfillments`. Plus Storefront API access token (unauthenticated read of products/checkout).
  You: approve scopes / install the app.
- Depends on: APR-002
- Status: PENDING

## APR-005 — Dropshipping app install (free plan)
- Gate: #2 terms acceptance, OAuth scopes; #1 if any paid plan
- Action: Choose one: DSers / Spocket / CJ Dropshipping / Zendrop. AI installs from Shopify App Store
  on free plan, stops at the permissions/terms screen for you.
- Decision needed: which app (recommend DSers or CJ for free-plan AliExpress/CJ catalog breadth).
- Depends on: APR-002
- Status: PENDING

## APR-006 — Secrets into GitHub
- Gate: secrets handling (human only)
- Action: You reveal tokens in Shopify admin and run locally (AI never reads values):
  `gh secret set SHOPIFY_STORE_DOMAIN -R arknodel/PetDropshipping`
  `gh secret set SHOPIFY_ADMIN_TOKEN -R arknodel/PetDropshipping`
  `gh secret set SHOPIFY_STOREFRONT_TOKEN -R arknodel/PetDropshipping`
- Depends on: APR-004
- Status: PENDING

## APR-007 — Custom domain (optional)
- Gate: #1 spending
- Action: Buy domain matching APR-001 name (~$10–20/yr), point to Shopify checkout + GitHub Pages site.
- Status: PENDING

## APR-008 — Enable scheduled workflows
- Gate: #1 spending (Anthropic API usage for headless runs, Actions minutes)
- Action: Uncomment `schedule:` in `nightly-research.yml` (Opus nightly) and `hourly-ops.yml` (Haiku hourly).
  Needs `ANTHROPIC_API_KEY` secret (you set it). Suggest monthly API budget cap before enabling.
- Depends on: APR-006
- Status: PENDING
