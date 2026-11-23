// Clean US-batch content after merge: alt text without "image N of M"/safety boilerplate,
// kitten harness: no unconfirmed leash claim, slug without "with-leash". Run from repo root.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
const SLUGS = ['car-seat-leash-for-dogs-and-cats', 'mini-pet-hair-remover-tool', 'self-cleaning-slicker-brush', 'pet-car-seatbelt-2-pack', 'four-zone-silicone-lick-mat',
  'six-foot-rope-dog-leash', 'two-mode-cat-slow-feeder-bowl', 'adjustable-reflective-pet-harness', 'kitten-harness-vest-with-leash'];
const BOILER = /\s*(Supervise[^.]*\.|Use with supervision[^.]*\.|No harness[^.]*\.|Attach to a harness[^.]*\.|Not a crash restraint\.|Avoid (foods containing )?xylitol\.|Stop use if damaged\.|Check the fit[^.]*\.)/gi;
const cleanAlt = (a) => {
  let s = String(a ?? '');
  const m = s.match(/^(.*?),\s*image \d+ of \d+:\s*(.*)$/i);
  if (m) s = m[2].charAt(0).toUpperCase() + m[2].slice(1);
  s = s.replace(BOILER, '').replace(/,?\s*per the (maker's listing|product title)\.?/gi, '').replace(/\s+/g, ' ').trim().replace(/[;,]$/, '');
  return s.replace(/\.$/, '');
};
const report = [];
for (const slug of SLUGS) {
  const path = `data/products/${slug}.json`;
  const p = JSON.parse(readFileSync(path, 'utf8'));
  p.images = p.images.map((i) => ({ ...i, alt: cleanAlt(i.alt) }));
  if (slug === 'kitten-harness-vest-with-leash') {
    p.images = p.images.map((i) => ({ ...i, alt: i.alt.replace(/ (and|with) (a )?leash( set)?/gi, '') }));
    p.seo.meta_title = 'Kitten Harness Vest with Wing Detail | Fondly Pet';
    p.seo.meta_description = String(p.seo.meta_description ?? '').replace(/ (and|with) (a )?leash( set)?/gi, '');
    p.previous_slugs = [...(p.previous_slugs ?? []), slug];
    p.slug = 'kitten-harness-vest';
    p.research.name = 'kitten harness vest';
    writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
    if (!existsSync('data/products/kitten-harness-vest.json')) renameSync(path, 'data/products/kitten-harness-vest.json');
    report.push({ slug: p.slug, alts: p.images.map((i) => i.alt), leash_mentions: JSON.stringify({ c: p.copy, s: p.seo, a: p.images }).match(/leash/gi)?.length ?? 0 });
    continue;
  }
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
  report.push({ slug, alt0: p.images[0].alt });
}
console.log(JSON.stringify(report, null, 1));
