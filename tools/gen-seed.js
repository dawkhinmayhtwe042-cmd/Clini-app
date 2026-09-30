// Generates seed-drugs.sql from data/drugs-*.js
// Usage: node tools/gen-seed.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataDir = path.join(__dirname, '..', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.startsWith('drugs-') && f.endsWith('.js')).sort();

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of files) {
  const code = fs.readFileSync(path.join(dataDir, f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}
const chunks = sandbox.window.DRUG_CHUNKS || [];
const drugs = chunks.flat();
// normalize: enrichment workers wrote `prec`; DB column is `precautions`
for (const d of drugs) { if (d.prec && !d.precautions) d.precautions = d.prec; }
console.log(`Loaded ${drugs.length} drugs from ${files.length} files`);

// validate
const required = ['g','b','f','cat','ind','dose_adult','dose_ped','ped_flag','ped_mgkg','ped_mgkg_max','ped_daymax_mgkg','ped_cap_mg','ped_freq','dose_renal','ci','contra','precautions','contra_keys','inter','allergy','preg','mon','liv','g6pd','tim','coun'];
const flags = new Set(['ok','caution','contra','no_data']);
const g6pdVals = new Set(['', 'high', 'possible']);
const timVals = new Set(['after_food','before_food','with_food','bedtime','morning','any']);
let errors = 0;
const seen = new Set();
drugs.forEach((d, i) => {
  for (const k of required) {
    if (!(k in d)) { console.error(`#${i} ${d.g||'?'}: missing field ${k}`); errors++; }
  }
  if (!flags.has(d.ped_flag)) { console.error(`#${i} ${d.g}: bad ped_flag ${d.ped_flag}`); errors++; }
  if (!g6pdVals.has(d.g6pd)) { console.error(`#${i} ${d.g}: bad g6pd ${d.g6pd} (must be ''|'high'|'possible')`); errors++; }
  if (!timVals.has(d.tim)) { console.error(`#${i} ${d.g}: bad tim ${d.tim}`); errors++; }
  if (seen.has(d.g)) { console.error(`duplicate generic: ${d.g}`); errors++; }
  seen.add(d.g);
  if (d.ped_flag === 'no_data' && d.dose_ped && !/no (established|weight-based).*pediatric|not recommended in children/i.test(d.dose_ped)) {
    console.error(`#${i} ${d.g}: ped_flag=no_data but dose_ped doesn't say so`); errors++;
  }
  if (!d.contra || !String(d.contra).trim()) { console.error(`#${i} ${d.g}: empty contra`); errors++;
  }
  if (!d.precautions || !String(d.precautions).trim()) { console.error(`#${i} ${d.g}: empty precautions`); errors++; }
  if (!Array.isArray(d.contra_keys) || d.contra_keys.length < 1) { console.error(`#${i} ${d.g}: contra_keys must be a non-empty array`); errors++; }
});
if (errors) { console.error(`VALIDATION FAILED: ${errors} errors`); process.exit(1); }

const esc = s => String(s == null ? '' : s).replace(/'/g, "''");
const num = v => (v == null || v === '' ? 'NULL' : Number(v));
const arr = a => esc(Array.isArray(a) ? a.join('; ') : (a || ''));

let sql = `-- ============================================================
-- Clinic EMR — drug database seed (~${drugs.length} drugs)
-- Run AFTER supabase-schema.sql in Supabase SQL Editor.
-- Safe to re-run: uses ON CONFLICT DO UPDATE.
-- Sources: standard pharmacology references (FDA labels / WHO EML style
-- public knowledge). NOT copied from MIMS or Oxford Handbook.
-- ============================================================\n\n`;

for (const d of drugs) {
  const inter = JSON.stringify(d.inter || []).replace(/'/g, "''");
  const ckeys = JSON.stringify(d.contra_keys || []).replace(/'/g, "''");
  sql += `insert into public.drugs (generic, brands, formulations, category, indications, dose_adult, dose_ped, ped_flag, ped_mgkg, ped_mgkg_max, ped_daymax_mgkg, ped_cap_mg, ped_freq, dose_renal, ci, contra, precautions, contra_keys, interactions, allergy, preg, mon, liver, g6pd_risk, timing, counsel) values (` +
    `'${esc(d.g)}','${arr(d.b)}','${arr(d.f)}','${esc(d.cat)}','${esc(d.ind)}','${esc(d.dose_adult)}','${esc(d.dose_ped)}','${esc(d.ped_flag)}',` +
    `${num(d.ped_mgkg)},${num(d.ped_mgkg_max)},${num(d.ped_daymax_mgkg)},${num(d.ped_cap_mg)},'${esc(d.ped_freq)}',` +
    `'${esc(d.dose_renal)}','${esc(d.ci)}','${esc(d.contra)}','${esc(d.precautions)}','${ckeys}'::jsonb,'${inter}'::jsonb,'${esc(d.allergy)}','${esc(d.preg)}','${esc(d.mon)}',` +
    `'${esc(d.liv)}','${esc(d.g6pd)}','${esc(d.tim)}','${esc(d.coun)}')\n` +
    `on conflict (generic) do update set brands=excluded.brands, formulations=excluded.formulations, category=excluded.category, indications=excluded.indications, dose_adult=excluded.dose_adult, dose_ped=excluded.dose_ped, ped_flag=excluded.ped_flag, ped_mgkg=excluded.ped_mgkg, ped_mgkg_max=excluded.ped_mgkg_max, ped_daymax_mgkg=excluded.ped_daymax_mgkg, ped_cap_mg=excluded.ped_cap_mg, ped_freq=excluded.ped_freq, dose_renal=excluded.dose_renal, ci=excluded.ci, contra=excluded.contra, precautions=excluded.precautions, contra_keys=excluded.contra_keys, interactions=excluded.interactions, allergy=excluded.allergy, preg=excluded.preg, mon=excluded.mon, liver=excluded.liver, g6pd_risk=excluded.g6pd_risk, timing=excluded.timing, counsel=excluded.counsel;\n`;
}

const out = path.join(__dirname, '..', 'seed-drugs.sql');
fs.writeFileSync(out, sql);
console.log(`Wrote ${out} (${(sql.length/1024).toFixed(0)} KB)`);
