// Reads canonical records from /data (repo root). Files starting with "_" are ignored.
import brand from '../../../data/brand.json';
import collections from '../../../data/collections.json';

const productModules = import.meta.glob('../../../data/products/*.json', { eager: true });

export { brand, collections };

export const products = Object.entries(productModules)
  .filter(([path]) => !path.split('/').pop().startsWith('_'))
  .map(([, mod]) => mod.default ?? mod)
  // Shown on the site: validated (all validators passed; buy button disabled until
  // a Shopify checkout_url exists), draft (synced to Shopify as draft) and active.
  .filter((p) => ['validated', 'draft', 'active'].includes(p.status));

export const productsIn = (collectionSlug) =>
  products.filter((p) => p.collection === collectionSlug);

/** Prefix an internal path with the configured base. */
export const url = (path = '/') => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
