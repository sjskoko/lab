const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const projects = JSON.parse(fs.readFileSync(path.join(root, 'projects.json'), 'utf8'));
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ids = new Set();
function url(value) { const u = new URL(value); if (u.protocol !== 'https:' || u.username || u.password) throw Error('Only public HTTPS links are supported'); return escape(u.href); }
const cards = projects.map((p, i) => {
  if (!/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id)) throw Error('Project IDs must be unique slugs');
  ids.add(p.id);
  for (const key of ['title','subtitle','description','imageAlt']) if (typeof p[key] !== 'string' || !p[key].trim()) throw Error(`Missing ${key}`);
  if (!/^[a-zA-Z0-9_-]+\.(svg|png|jpg|webp)$/.test(p.image) || !fs.existsSync(path.join(root,'dist',p.image))) throw Error('Missing local image');
  if (!Array.isArray(p.tags) || p.tags.some(t => typeof t !== 'string')) throw Error('Invalid tags');
  return `<article class="project" aria-labelledby="${p.id}">
    <a class="art" href="${url(p.demo)}" aria-label="Open ${escape(p.title)} demo"><img src="${escape(p.image)}" alt="${escape(p.imageAlt)}" width="640" height="300" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}><span class="index">EXPERIMENT ${String(i+1).padStart(2,'0')}</span><span class="live"><i></i> LIVE DEMO</span></a>
    <div class="body"><p class="eyebrow">${escape(p.subtitle)}</p><h2 id="${p.id}">${escape(p.title)}<span aria-hidden="true">↗</span></h2><p class="description">${escape(p.description)}</p><ul class="tags">${p.tags.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>
    <a class="launch" href="${url(p.demo)}">Play with ${escape(p.title)} <span aria-hidden="true">↗</span></a>
    <div class="secondary"><a href="${url(p.repository)}" target="_blank" rel="noopener noreferrer">☆ Star on GitHub <span class="sr-only">(opens a new tab)</span></a>${p.story ? `<a href="${url(p.story)}">Watch the story <span aria-hidden="true">↗</span></a>` : ''}</div></div>
  </article>`;
}).join('\n');
const template = fs.readFileSync(path.join(root,'template.html'),'utf8');
fs.writeFileSync(path.join(root,'dist/index.html'), template.replace('<!-- PROJECTS -->',cards).replace('<!-- COUNT -->',`${String(projects.length).padStart(2,'0')} ${projects.length === 1 ? 'EXPERIMENT' : 'EXPERIMENTS'}`));
console.log(`Built ${projects.length} project card(s). All project data and local images validated.`);
