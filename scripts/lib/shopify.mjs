// Minimal Shopify Admin GraphQL client. Reads secrets from env only; never logs them.
// Auth, in order of preference:
//   1. Dev Dashboard app (2026+): SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET -> client credentials grant
//      (short-lived token fetched per run, kept in memory only).
//   2. Legacy static token: SHOPIFY_ADMIN_TOKEN.
import { readFileSync, existsSync } from 'node:fs';

export function loadEnv(path = '.env') {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

export function shopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const staticToken = process.env.SHOPIFY_ADMIN_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || '2026-10';
  const mode = clientId && clientSecret ? 'client_credentials' : staticToken ? 'static' : null;
  return { domain, clientId, clientSecret, staticToken, version, mode, ready: Boolean(domain && mode) };
}

let cached = null; // { token, expiresAt }

async function accessToken() {
  const cfg = shopifyConfig();
  if (cfg.mode === 'static') return cfg.staticToken;
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const res = await fetch(`https://${cfg.domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: cfg.clientId, client_secret: cfg.clientSecret }),
  });
  if (!res.ok) throw new Error(`Shopify token HTTP ${res.status}`);
  const json = await res.json();
  if (!json.access_token) throw new Error('Shopify token response had no access_token');
  cached = { token: json.access_token, expiresAt: Date.now() + (Number(json.expires_in) || 3600) * 1000 };
  return cached.token;
}

export async function adminGraphQL(query, variables = {}) {
  const { domain, version, ready } = shopifyConfig();
  if (!ready) throw new Error('Set SHOPIFY_STORE_DOMAIN and SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_TOKEN). See APR-004/APR-006.');
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await accessToken() },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors)}`);
  return json.data;
}
