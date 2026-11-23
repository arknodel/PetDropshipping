# Pending approvals

Set `Status:` to `APPROVED` or `REJECTED` (with a note). Approved items move to APPROVED.md.
An APPROVED status records your decision; the AI still confirms in chat before acting on it.
Passwords, 2FA codes, card/bank/payout/tax entry and CAPTCHAs are always done by you.

---

## APR-012 — Store policies (shipping, returns, privacy, terms)
- Gate: #5 legal-policy settings
- Drafts: site/src/policies/{shipping,returns,privacy,terms}.md (2026-11-23), all `approved: false`.
  Facts used: processing 1–3 business days; US-warehouse items 2–7 days after processing; China-warehouse
  items 5–11 days; US-only shipping; fulfillment partner CJdropshipping; Shopify checkout; Cloudflare hosting.
- You: fill every `[[...]]` (legal name, address, emails, state, shipping rate, cutoff time, retention period),
  choose returns Option A or B, and have privacy + terms reviewed (not legal advice).
- Then AI: set `approved: true` per file (site renders it), paste the same text into Shopify Settings > Policies,
  and make the Shopify shipping-zone rate match the Shipping Policy (you set zones/rates; gate #5).
- 2026-11-23: returns + shipping drafts aligned with CJ's Refund, Resend and Returns Policy
  (cjdropshipping.com/dispute-policy.html, last edited 2026-05-06): damage/wrong/missing within 30 days
  with photos/video; US delay refund/resend 45 days after shipping; delivered-not-received may need a
  post-office non-delivery statement; unclaimed/returned-to-sender and customer address errors not covered;
  CJ does not accept change-of-mind and only takes returns to China, so returns Option A is paid by the store
  (Option B recommended). Owner chose Option B (no change-of-mind returns) in chat 2026-11-23; draft updated. Risk: CJ "service products" (third-party supplier items) may not be refunded for
  damage/delay/quality; check whether any US-warehouse items are service products before launch.
- Status: PENDING

## APR-011 — Rebrand to Fondly Pet + buy fondlypet.com
- Gate: #1 spending (domain), brand change
- Why: owner found an existing "thegoodleashco"; Good Leash also leans dog-only. Owner chose
  Fondly Pet in chat 2026-11-23 from ~200 checked names.
- Checks 2026-11-23: fondlypet.com, thefondlypet.com, fondlypets.com all unregistered (Verisign RDAP 404).
  Web search: no business using "Fondly Pet". NOT a trademark clearance.
- Action (you): 1) search "fondly" on https://tmsearch.uspto.gov (pet goods, class 18/20/21/28/31);
  2) check @fondlypet on Instagram/TikTok; 3) buy fondlypet.com at NameSilo (optional: fondlypets.com
  as a defensive redirect). Turn on auto-renew + WHOIS privacy.
- Then AI: add zone to Cloudflare, attach to Pages project, rename brand in data/brand.json + site,
  301 goodleashco.com → fondlypet.com, update CLAUDE.md paths.
- Brand decision: APPROVED (owner, chat 2026-11-23). Domain purchase: DONE by owner 2026-11-23
  (NameSilo, expires 2027-11-23, auto-renew + WHOIS privacy on).
- Done 2026-11-23: Cloudflare zone fondlypet.com (Free; NS deb/ernest.ns.cloudflare.com set at NameSilo,
  owner answered Domain Defender); Pages project `goodleashco` custom domains fondlypet.com + www;
  Redirect Rule on goodleashco.com zone: https://*goodleashco.com/* → https://fondlypet.com/${2}
  (301, query preserved). Site rebranded (commit f704fa9).
- Status: APPROVED (complete)

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
- Done 2026-11-23 by owner: trial store created (owner account fondlypetstore@gmail.com, Basic trial).
  AI: store name "Fondly Pet"; myshopify domain fondlypet-store.myshopify.com (original yjpwtc-3d);
  shop.fondlypet.com connected as primary (Cloudflare CNAME shop -> shops.myshopify.com, DNS only,
  + TXT shopify_verification_shop). Password page still ON.
- Still yours (gate #5): Shopify Payments / payouts / tax ID, shipping zones, policies, business details.
- Status: APPROVED (account done; payment/tax/shipping settings pending)

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
- 2026-11-23: legacy admin custom apps are gone; Shopify points to the Dev Dashboard (dev.shopify.com).
  Plan: create app "Fondly Pet Ops" there with the scopes above, release, install on fondlypet-store,
  auth via client credentials grant (scripts/lib/shopify.mjs supports it). Storefront token dropped:
  not needed while the static site links to Shopify product pages.
  BLOCKED: Dev Dashboard requires owner to verify fondlypetstore@gmail.com (email link).
- Owner go-ahead in chat 2026-11-23 ("finish the shopify setup").
- Done 2026-11-23: app Fondly Pet Ops (Dev Dashboard) released + installed on fondlypet-store; granted scopes verified via API = read_products, write_products, read_orders, read_inventory, read_fulfillments.
- Status: APPROVED (complete)

## APR-005 — Dropshipping app install (free plan)
- Gate: #2 terms acceptance, OAuth scopes; #1 if any paid plan
- Action: Choose one: DSers / Spocket / CJ Dropshipping / Zendrop. AI installs from Shopify App Store
  on free plan, stops at the permissions/terms screen for you.
- Decision needed: which app (recommend DSers or CJ for free-plan AliExpress/CJ catalog breadth).
- Depends on: APR-002
- 2026-11-23: chosen CJdropshipping (all 8 products are CJ-sourced). Listing https://apps.shopify.com/cucheng
  (free to install; CJ charges product/shipping per order). Install button opens a new tab, which the AI
  browser can't open -> owner clicks Install, reviews the permission list, approves, links CJ account.
- Done 2026-11-23: installed via Claude in Chrome; Shopify authorized on the Install click (no separate
  scope screen). Owner confirmed in chat ("Authorized, installed"). CJ user agreement handled by owner.
- 2026-11-23: owner approved in chat setting the 8 products ACTIVE but unpublished (no sales channel; onlineStoreUrl null) so CJ can link them (relates to gate #3). Done via scripts/shopify-set-status.mjs. CJ sync still returns 0 products; CJ store binding verified Authorized/Activated. Likely needs Online Store publication = gate #3, asked separately.
- Status: APPROVED (complete)

## APR-006 — Secrets into GitHub
- Gate: secrets handling (human only)
- Action: You reveal tokens in Shopify admin and run locally (AI never reads values):
  `gh secret set SHOPIFY_STORE_DOMAIN -R arknodel/PetDropshipping`   (value: fondlypet-store.myshopify.com)
  `gh secret set SHOPIFY_CLIENT_ID -R arknodel/PetDropshipping`
  `gh secret set SHOPIFY_CLIENT_SECRET -R arknodel/PetDropshipping`
  Same three names in local `.env` for `node scripts/shopify-sync.mjs --apply`.
  (Updated 2026-11-23 for Dev Dashboard client-credentials auth; ADMIN/STOREFRONT tokens no longer used.)
- Depends on: APR-004
- Done 2026-11-23 by owner via scripts/set-shopify-creds.ps1 (clipboard mode); auth smoke test OK.
- Status: APPROVED (complete)

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

## APR-010 — CJdropshipping account + API key (supplier data)
- Gate: #2 account creation / ToS; secrets handling (human only)
- Why: Phase 1 run 2026-11-23 scored 0/30 candidates. Public supplier sites block automated access
  (CJ CAPTCHA, Spocket 403, AliExpress JS-only) and AliExpress cards lack delivery days / ratings.
  Official CJ API gives cost, US-warehouse freight quotes, delivery windows, resale-licensed images.
- Action (you): sign up free at https://cjdropshipping.com (accept terms), then CJ dashboard →
  Authorization → API → generate key. Put it in local `.env` as CJ_API_KEY=… and run:
  `gh secret set CJ_API_KEY -R arknodel/PetDropshipping` (paste when prompted). AI never reads the value.
- Then AI runs: `node scripts/cj-vet.mjs data/research/2026-11-23` → `node scripts/score.mjs …`.
- Also: CJ's Shopify app can be the dropshipping app for APR-005 (free).
- Status: PENDING

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
