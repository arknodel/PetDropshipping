// One-off rebrand: Good Leash Co. -> Fondly Pet (APR-011, 2026-11-23). Run from repo root.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const sub = (path, pairs) => {
  let s = readFileSync(path, 'utf8');
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`${path}: missing "${a}"`);
    s = s.split(a).join(b);
  }
  writeFileSync(path, s);
};

for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const p = `data/products/${f}`;
  if (readFileSync(p, 'utf8').includes('| Good Leash Co.')) sub(p, [['| Good Leash Co.', '| Fondly Pet']]);
}
sub('site/astro.config.mjs', [['https://goodleashco.com', 'https://fondlypet.com'], ['and on goodleashco.com once the', 'and on fondlypet.com once the']]);
sub('site/public/robots.txt', [['https://goodleashco.com', 'https://fondlypet.com']]);
sub('site/package.json', [['"goodleashco-site"', '"fondlypet-site"']]);
sub('site/package-lock.json', [['"goodleashco-site"', '"fondlypet-site"']]);
sub('site/src/layouts/Base.astro', [['Good Leash <span>Co.</span>', 'Fondly <span>Pet</span>']]);
sub('CLAUDE.md', [
  ['- Site: https://goodleashco.com on Cloudflare Pages', '- Site: https://fondlypet.com on Cloudflare Pages'],
  ['- DNS: Cloudflare zone goodleashco.com (registrar NameSilo)', '- DNS: Cloudflare zones fondlypet.com (primary) + goodleashco.com (301 to fondlypet.com); registrar NameSilo'],
]);

const b = JSON.parse(readFileSync('data/brand.json', 'utf8'));
b._note = 'Rebranded 2026-11-23 (APR-011): Good Leash Co. retired (existing "thegoodleashco"; dog-leaning). Owner chose Fondly Pet. Copywriter uses voice rules below.';
b.name = 'Fondly Pet';
b.domain_target = 'fondlypet.com';
b.previous_names = [{ name: 'Good Leash Co.', domain: 'goodleashco.com', status: 'retired_redirects_to_fondlypet' }];
b.name_note = 'Name is pet-general; give dog and cat parents equal weight.';
b.name_candidates = b.name_candidates.map((c) => (c.name === 'Good Leash Co.' ? { ...c, status: 'retired' } : c));
b.name_candidates.unshift({ name: 'Fondly Pet', rationale: 'Warm, covers any pet; .com, the.com and plural were free', status: 'approved' });
writeFileSync('data/brand.json', JSON.stringify(b, null, 2) + '\n');
console.log('rebrand applied');
