// CJ API client. CJ ids are 19-digit integers; JSON.parse would round them,
// so every integer with 16+ digits is quoted before parsing.
import { loadEnv } from './shopify.mjs';
loadEnv();

const BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const safeParse = (text) => JSON.parse(text.replace(/([:\[,]\s*)(-?\d{16,})(?=\s*[,\]}])/g, '$1"$2"'));

let token = null;
export async function cj(path, { method = 'GET', body, query } = {}) {
  if (!process.env.CJ_API_KEY) throw new Error('CJ_API_KEY not set');
  if (!token && path !== '/authentication/getAccessToken') {
    token = (await cj('/authentication/getAccessToken', { method: 'POST', body: { apiKey: process.env.CJ_API_KEY } })).accessToken;
  }
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'CJ-Access-Token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = safeParse(await res.text());
  await sleep(1100); // ~1 req/s on CJ free tier
  if (!res.ok || json.result === false || (json.code && json.code !== 200)) throw new Error(`CJ ${path}: HTTP ${res.status} ${json.message ?? ''}`.trim());
  return json.data;
}
