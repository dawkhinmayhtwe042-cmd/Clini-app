// One-shot: inject liv/g6pd/tim/coun fields into data/drugs-A..H.js records.
// Inserts 4 lines right after each `    g: "...",` line. Idempotent: skips
// files that already contain an injected `liv:` field line.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const bf = require('./field-backfill.js');

const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).filter(f => /^drugs-[A-H]\.js$/.test(f)).sort();

// build generic -> category map via vm
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of files) vm.runInContext(fs.readFileSync(path.join(dataDir, f), 'utf8'), sandbox, { filename: f });
const drugs = sandbox.window.DRUG_CHUNKS.flat();
const catOf = {};
for (const d of drugs) catOf[d.g] = d.cat;

// sanity: every category must have a timCat default
const missingCat = new Set();
for (const d of drugs) if (!(d.cat in bf.timCat)) missingCat.add(d.cat);
if (missingCat.size) { console.error('categories without timCat default:', [...missingCat]); process.exit(1); }

const esc = s => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');

let total = 0;
for (const f of files) {
  const p = path.join(dataDir, f);
  let text = fs.readFileSync(p, 'utf8');
  if (/\n    liv: "/.test(text)) { console.log(`${f}: already backfilled, skipping`); continue; }
  let count = 0;
  const out = text.split('\n').map(line => {
    const m = line.match(/^    g: "(.*)",$/);
    if (!m) return line;
    const name = m[1];
    const tim = bf.tim[name] || bf.timCat[catOf[name]] || 'any';
    const liv = bf.liv[name] || '';
    const g6pd = bf.g6pd[name] || '';
    const coun = bf.coun[name] || '';
    count++;
    return line +
      `\n    liv: "${esc(liv)}",` +
      `\n    g6pd: "${esc(g6pd)}",` +
      `\n    tim: "${esc(tim)}",` +
      `\n    coun: "${esc(coun)}",`;
  }).join('\n');
  fs.writeFileSync(p, out);
  console.log(`${f}: injected fields into ${count} records`);
  total += count;
}
console.log(`done: ${total} records updated`);
