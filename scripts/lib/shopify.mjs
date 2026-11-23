// Minimal Shopify Admin GraphQL client. Reads secrets from env only; never logs them.
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
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  const version = process.env.SHOPIFY_API_VERSION || '2026-10';
  return { domain, token, version, ready: Boolean(domain && token) };
}

export async function adminGraphQL(query, variables = {}) {
  const { domain, token, version, ready } = shopifyConfig();
  if (!ready) throw new Error('SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_TOKEN not set (see APR-004/APR-006).');
  const res = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors)}`);
  return json.data;
}
