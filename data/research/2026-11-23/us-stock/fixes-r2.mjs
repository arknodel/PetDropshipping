// Polish after listing-qa re-check (2026-11-23). Removals only.
import { readFileSync, writeFileSync } from 'node:fs';
const P = (s) => `data/products/${s}.json`;
const edit = (slug, fn) => { const p = JSON.parse(readFileSync(P(slug), 'utf8')); fn(p); p.updated_at = new Date().toISOString(); writeFileSync(P(slug), JSON.stringify(p, null, 2) + '\n'); };
edit('kitten-harness-vest', (p) => { p.copy.description = p.copy.description.replace('This harness vest is listed at 150 g and has adjustable straps, per the maker. ', '').trim(); });
edit('mini-pet-hair-remover-tool', (p) => { p.seo.secondary_keywords = [...new Set(p.seo.secondary_keywords.filter((k) => k !== p.seo.primary_keyword))]; });
edit('adjustable-reflective-pet-harness', (p) => { p.copy_claims = (p.copy_claims ?? []).map((c) => c.replace(/48 ?in(ches)?/g, 'about 47 in (1.2 m)')); });
edit('six-foot-rope-dog-leash', (p) => { p.variants[0].supplier_title = 'Black'; });
console.log('r2 polish applied');
