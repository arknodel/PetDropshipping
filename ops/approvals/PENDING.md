# Pending approvals

Set `Status:` to `APPROVED` or `REJECTED` (with a note). Approved items move to APPROVED.md.
An APPROVED status records your decision; the AI still confirms in chat before acting on it.
Passwords, 2FA codes, card/bank/payout/tax entry and CAPTCHAs are always done by you.

---

## APR-001 — Brand name
- Gate: business decision (no spend)
- Action: Pick one name from `data/brand.json` → `name_candidates` (or supply your own).
- Before approving: USPTO trademark search, .com availability, social handles.
- Decision: **Good Leash Co.** (chosen in chat 2026-11-22). Replaces Whisker & Wag — .com and 8 variants taken.
  goodleashco.com unregistered per RDAP 2026-11-22. USPTO trademark search still recommended before APR-007.
- Status: APPROVED

## APR-002 — Shopify account + plan
- Gate: #2 account creation / ToS, #1 spending (plan subscription), #5 payment/tax settings
- Action: AI opens https://www.shopify.com/ signup and pre-fills store name from `data/business.json`.
  You: create login, choose plan, enter billing card, accept terms, set up Shopify Payments / payouts / tax ID.
- Depends on: APR-001 (store name), `data/business.json` filled in by you.
- Status: PENDING

## APR-003 — GitHub repo + Pages
- Gate: #2 account / settings
- Repo: https://github.com/arknodel/PetDropshipping — **created by you (2026-11-22). Repo step DONE.**
- First push: DONE 2026-11-22 (commit 2c09a57, approved in chat).
- Pages: DONE 2026-11-22 via gh API (build_type=workflow, approved in chat).
  URL: https://arknodel.github.io/PetDropshipping/ (live once deploy.yml publishes a build).
  browser-runner attempt failed first: Claude in Chrome extension not connected.
- Custom domain only after APR-007.
- Status: APPROVED (complete)

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
- Purchase: DONE — goodleashco.com registered at NameSilo 2026-11-23 by owner.
- Remaining: DNS at NameSilo. Delete 6 parking A records (@ and www → 172.232.24.235/.161, 172.234.25.42),
  then add: @ A 185.199.108.153 / .109.153 / .110.153 / .111.153;
  @ AAAA 2606:50c0:8000::153 / 8001::153 / 8002::153 / 8003::153; www CNAME arknodel.github.io.
  Then: gh api -X PUT repos/arknodel/PetDropshipping/pages -f cname=goodleashco.com, enforce HTTPS once cert issues.
  Later: shop.goodleashco.com CNAME → Shopify (after APR-002).
- Progress 2026-11-23: 6 parking A records deleted; added @ A 185.199.108.153 and 185.199.109.153. Paused.
- BLOCKER: GitHub Pages usage limits forbid using Pages to run an online business / e-commerce site
  (docs: pages/getting-started-with-github-pages/github-pages-limits). Plan tier doesn't change this.
  Decide storefront host (APR-009) before finishing DNS. Pages custom domain NOT set.
- Resolved 2026-11-23 via APR-009: nameservers moved to Cloudflare (deb/ernest.ns.cloudflare.com);
  NameSilo DNS records no longer used. GitHub Pages site deleted.
- Status: APPROVED (complete)

## APR-009 — Storefront hosting (replaces GitHub Pages for the public site)
- Decision (owner, chat 2026-11-23): Cloudflare Pages, Free plan.
- Cloudflare account (owner sign-in), zone goodleashco.com (Free), Pages project `goodleashco`
  from arknodel/PetDropshipping (GitHub app limited to that repo; owner authorized).
  Build: root `site/`, `npm run build`, output `dist`, NODE_VERSION=22. Custom domains: goodleashco.com, www.
- Later: shop.goodleashco.com → Shopify (CNAME, DNS only) after APR-002.
- Status: APPROVED (complete)

## APR-008 — Enable scheduled workflows
- Gate: #1 spending (Anthropic API usage for headless runs, Actions minutes)
- Action: Uncomment `schedule:` in `nightly-research.yml` (Opus nightly) and `hourly-ops.yml` (Haiku hourly).
  Needs `ANTHROPIC_API_KEY` secret (you set it). Suggest monthly API budget cap before enabling.
- Depends on: APR-006
- Status: PENDING
