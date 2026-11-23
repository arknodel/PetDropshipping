// US batch fix pass after validators r1 (2026-11-23). Removes/attributes claims only; no new claims.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
const P = (s) => `data/products/${s}.json`;
const misses = [];
const rep = (obj, key, from, to, where) => { if (!String(obj[key]).includes(from)) { misses.push(`${where}: ${from}`); return; } obj[key] = obj[key].split(from).join(to); };
const edit = (slug, fn) => { const p = JSON.parse(readFileSync(P(slug), 'utf8')); fn(p); p.updated_at = new Date().toISOString(); writeFileSync(P(slug), JSON.stringify(p, null, 2) + '\n'); };
const vt = (p, t) => { p.variants[0].title = t; };

edit('mini-pet-hair-remover-tool', (p) => {
  rep(p.copy.bullets, 0, 'Made for quick pet hair clean-ups on couches and rugs', 'Made for pet hair on couches and rugs', 'u02 b0');
  rep(p.copy.bullets, 2, ', for smaller jobs', '', 'u02 b2');
  rep(p.copy, 'description', 'a reusable option for quick clean-ups on couches and rugs', 'a reusable option for pet hair on couches and rugs', 'u02 desc');
  rep(p.seo, 'meta_description', 'for couches, rugs, and furniture', 'for couches and rugs', 'u02 meta');
  p.seo.secondary_keywords = p.seo.secondary_keywords.map((k) => (k === 'cat hair remover for furniture' ? 'pet hair remover for couch' : k));
  vt(p, 'Red');
});
edit('self-cleaning-slicker-brush', (p) => {
  p.copy.title = 'Slicker Brush for Cats and Dogs with Hair Release Button';
  rep(p.copy.bullets, 3, 'Lightweight handle with a non-slip grip and a hanging hole for storage.', 'The maker lists a lightweight handle with a non-slip grip. The handle has a hanging hole for storage.', 'u03 b3');
  vt(p, 'White');
  p.previous_slugs = [...(p.previous_slugs ?? []), p.slug];
  p.slug = 'slicker-brush-with-release-button';
});
if (existsSync(P('self-cleaning-slicker-brush')) && !existsSync(P('slicker-brush-with-release-button'))) renameSync(P('self-cleaning-slicker-brush'), P('slicker-brush-with-release-button'));
edit('pet-car-seatbelt-2-pack', (p) => {
  rep(p.copy, 'description', 'the material as premium nylon', 'the material as nylon', 'u04 desc');
  rep(p.images[0], 'alt', '1 inch wide', 'about 1 inch (25 mm) wide', 'u04 alt0');
  rep(p.images[2], 'alt', ' with clip,', ',', 'u04 alt2');
  vt(p, '2-Pack');
});
edit('four-zone-silicone-lick-mat', (p) => vt(p, 'Yellow'));
edit('six-foot-rope-dog-leash', (p) => {
  p.images[2].alt = 'Black rope leash with an open waste bag holder';
  rep(p.images[3], 'alt', '1/2 inch thick', '1/2 inch wide', 'u06 alt3');
  rep(p.copy, 'description', 'attaches to a harness or collar and helps prevent tangles during your walk.', 'attaches to a harness or collar, and the maker says it helps avoid tangles during your walk.', 'u06 desc');
  vt(p, 'Black');
});
edit('two-mode-cat-slow-feeder-bowl', (p) => {
  rep(p.copy, 'description', 'to reduce spills, so cleanup is quicker.', 'to reduce spills and cleanup, per the maker.', 'u07 desc');
  rep(p.images[0], 'alt', 'with a maze insert for slow feeding', 'with molded maze ridges for slow feeding', 'u07 alt0');
  p.seo.meta_title = 'Two-Mode Cat Slow Feeder Bowl, 4 Colors | Fondly Pet';
  p.seo.primary_keyword = 'two mode cat bowl';
});
edit('adjustable-reflective-pet-harness', (p) => {
  const s = JSON.stringify(p.copy);
  if (!s.includes('1.2 m (48 in)')) misses.push('u08 48in');
  p.copy = JSON.parse(s.split('1.2 m (48 in)').join('1.2 m (about 47 in)'));
});
edit('kitten-harness-vest', (p) => {
  rep(p.copy, 'description', 'Kittens and small pets need a harness that is light and easy to adjust.', 'This harness vest is listed at 150 g and has adjustable straps, per the maker.', 'u09 desc');
});
console.log(JSON.stringify({ misses }, null, 1));
