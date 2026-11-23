#!/usr/bin/env node
// Finds fulfillment problems. Output matches data/schemas/order-alert.schema.json.
// Read-only: never contacts customers or suppliers.
import { loadEnv, adminGraphQL, shopifyConfig } from './lib/shopify.mjs';

loadEnv();
if (!shopifyConfig().ready) {
  console.log(JSON.stringify({ skipped: 'Shopify not configured yet (APR-004/APR-006)', alerts: [] }));
  process.exit(0);
}

const QUERY = `
query Open($cursor: String) {
  orders(first: 100, after: $cursor, query: "status:open -fulfillment_status:fulfilled") {
    pageInfo { hasNextPage endCursor }
    nodes {
      name createdAt displayFulfillmentStatus
      fulfillments(first: 5) { status trackingInfo(first: 1) { number } }
    }
  }
}`;

const now = Date.now();
const alerts = [];
let cursor = null;
do {
  const { orders } = await adminGraphQL(QUERY, { cursor });
  for (const o of orders.nodes) {
    const age = (now - Date.parse(o.createdAt)) / 36e5;
    const fulfilled = o.fulfillments.length > 0;
    const tracked = o.fulfillments.some((f) => f.trackingInfo?.[0]?.number);
    if (!fulfilled && age > 48) {
      alerts.push({ order_id: o.name, issue: 'unfulfilled_48h', age_hours: Math.round(age), suggested_action: 'Check order status in the dropshipping app; place or retry supplier order.' });
    } else if (fulfilled && !tracked && age > 72) {
      alerts.push({ order_id: o.name, issue: 'missing_tracking', age_hours: Math.round(age), suggested_action: 'Request tracking number from supplier via the dropshipping app.' });
    } else if (fulfilled && tracked && age > 24 * 14 && o.displayFulfillmentStatus !== 'FULFILLED') {
      alerts.push({ order_id: o.name, issue: 'stuck_at_supplier', age_hours: Math.round(age), suggested_action: 'Open a supplier dispute; draft a delay notice for human review.' });
    }
  }
  cursor = orders.pageInfo.hasNextPage ? orders.pageInfo.endCursor : null;
} while (cursor);

console.log(JSON.stringify({ checked_at: new Date().toISOString(), alerts }, null, 2));
