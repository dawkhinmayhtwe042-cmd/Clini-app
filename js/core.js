/* ============================================================
   Clinic EMR — core: config, Supabase REST client, offline store+sync
   No dependencies. Works offline; syncs when online.
   ============================================================ */
'use strict';

/* ---------------- config (Settings screen) ---------------- */
const CFG_KEY = 'clinic_cfg_v1';
function getCfg() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { return {}; }
}
function saveCfg(c) { localStorage.setItem(CFG_KEY, JSON.stringify(c)); }
function isConfigured() { const c = getCfg(); return !!(c.supabaseUrl && c.anonKey); }

/* ---------------- tiny Supabase client (REST + Auth) ---------------- */
const SES_KEY = 'clinic_session_v1';
function getSession() { try { return JSON.parse(localStorage.getItem(SES_KEY)) || null; } catch { return null; } }
function setSession(s) { s ? localStorage.setItem(SES_KEY, JSON.stringify(s)) : localStorage.removeItem(SES_KEY); }

function sbHeaders(json) {
  const c = getCfg(), s = getSession();
  const h = { 'apikey': c.anonKey || '' };
  h['Authorization'] = 'Bearer ' + (s && s.access_token ? s.access_token : (c.anonKey || ''));
  if (json) h['Content-Type'] = 'application/json';
  return h;
}
async function sbRest(path, { method = 'GET', body = null, prefer = null } = {}) {
  const c = getCfg();
  const url = c.supabaseUrl.replace(/\/$/, '') + '/rest/v1' + path;
  const h = sbHeaders(!!body);
  if (prefer) h['Prefer'] = prefer;
  const res = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.message || data.msg)) || text || ('HTTP ' + res.status);
    throw new Error(msg);
  }
  return data;
}
async function sbAuth(path, body, method = 'POST') {
  const c = getCfg();
  const url = c.supabaseUrl.replace(/\/$/, '') + '/auth/v1' + path;
  const res = await fetch(url, {
    method,
    headers: { 'apikey': c.anonKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.msg || data.message || data.error_description)) || text || ('HTTP ' + res.status);
    throw new Error(msg);
  }
  return data;
}
const Auth = {
  async signIn(email, password) {
    const d = await sbAuth('/token?grant_type=password', { email, password });
    setSession({ access_token: d.access_token, refresh_token: d.refresh_token, user: d.user, expires_at: d.expires_in ? Date.now() + d.expires_in * 1000 : 0 });
    return d.user;
  },
  async signUp(email, password) {
    const d = await sbAuth('/signup', { email, password });
    if (d.access_token) setSession({ access_token: d.access_token, refresh_token: d.refresh_token, user: d.user, expires_at: Date.now() + (d.expires_in || 3600) * 1000 });
    return d.user || d;
  },
  async signOut() {
    try {
      const s = getSession();
      if (s && s.access_token) {
        const c = getCfg();
        await fetch(c.supabaseUrl.replace(/\/$/, '') + '/auth/v1/logout', {
          method: 'POST', headers: { 'apikey': c.anonKey, 'Authorization': 'Bearer ' + s.access_token }
        });
      }
    } catch { /* offline: just clear */ }
    setSession(null);
  },
  async refresh() {
    const s = getSession();
    if (!s || !s.refresh_token) return false;
    try {
      const d = await sbAuth('/token?grant_type=refresh_token', { refresh_token: s.refresh_token });
      setSession({ access_token: d.access_token, refresh_token: d.refresh_token, user: d.user, expires_at: Date.now() + d.expires_in * 1000 });
      return true;
    } catch { return false; }
  },
  user() { const s = getSession(); return s ? s.user : null; }
};

/* ---------------- offline store + sync ---------------- */
const TABLES = ['profiles', 'patients', 'visits', 'visit_templates', 'drugs',
  'prescriptions', 'prescription_items', 'dispensing_log', 'followups'];
const CACHE_KEY = 'clinic_cache_v2', OPS_KEY = 'clinic_ops_v2', META_KEY = 'clinic_meta_v2';

function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; } }
function persistCache(c) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { console.warn('cache persist failed', e); } }
function loadOps() { try { return JSON.parse(localStorage.getItem(OPS_KEY)) || []; } catch { return []; } }
function persistOps(o) { localStorage.setItem(OPS_KEY, JSON.stringify(o)); }
function loadMeta() { try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch { return {}; } }
function persistMeta(m) { localStorage.setItem(META_KEY, JSON.stringify(m)); }

const nowIso = () => new Date().toISOString();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));

const Store = {
  all(table) {
    const c = loadCache()[table] || {};
    return Object.values(c).filter(r => !(r.is_deleted && table === 'patients'));
  },
  get(table, id) { const c = loadCache()[table] || {}; return c[id] || null; },
  by(table, fn) { return this.all(table).filter(fn); },

  save(table, row) {
    const cache = loadCache();
    cache[table] = cache[table] || {};
    const isNew = !row.id;
    if (isNew) { row.id = uuid(); row.created_at = row.created_at || nowIso(); }
    row.updated_at = nowIso();
    cache[table][row.id] = { ...row };
    persistCache(cache);
    const ops = loadOps();
    ops.push({ op: isNew ? 'insert' : 'update', table, id: row.id, ts: Date.now() });
    persistOps(ops);
    if (navigator.onLine) Sync.pushSoon();
    return row;
  },

  del(table, id) {  // hard delete (doctor-only per RLS)
    const cache = loadCache();
    if (cache[table]) { delete cache[table][id]; persistCache(cache); }
    const ops = loadOps();
    ops.push({ op: 'delete', table, id, ts: Date.now() });
    persistOps(ops);
    if (navigator.onLine) Sync.pushSoon();
  },

  softDeletePatient(id) {
    const p = this.get('patients', id);
    if (p) this.save('patients', { ...p, is_deleted: true });
  },

  pendingCount() { return loadOps().length; }
};

const Sync = {
  running: false, _t: null,
  pushSoon() { clearTimeout(this._t); this._t = setTimeout(() => this.run().catch(e => console.warn('sync', e)), 1200); },

  async run() {
    if (this.running || !navigator.onLine || !isConfigured() || !Auth.user()) return { ok: false, reason: 'not-ready' };
    this.running = true;
    try {
      // refresh token if needed
      const s = getSession();
      if (s && s.expires_at && Date.now() > s.expires_at - 60000) await Auth.refresh();
      await this.push();
      await this.pull();
      UIkit && UIkit.syncBadge();
      return { ok: true };
    } finally { this.running = false; }
  },

  async push() {
    let ops = loadOps();
    const failed = [];
    for (const o of ops) {
      try {
        if (o.op === 'delete') {
          await sbRest(`/${o.table}?id=eq.${o.id}`, { method: 'DELETE' });
        } else {
          const row = (loadCache()[o.table] || {})[o.id];
          if (!row) continue;
          await sbRest(`/${o.table}?on_conflict=id`, {
            method: 'POST', body: row, prefer: 'resolution=merge-duplicates,return=minimal'
          });
        }
      } catch (e) { console.warn('push op failed', o, e.message); failed.push(o); break; }
    }
    persistOps(failed);
  },

  async pull() {
    const meta = loadMeta(); meta.lastSync = meta.lastSync || {};
    const cache = loadCache();
    for (const t of TABLES) {
      try {
        const since = meta.lastSync[t];
        let path = `/${t}?select=*&order=updated_at.asc&limit=2000`;
        if (since) path += `&updated_at=gte.${encodeURIComponent(since)}`;
        const rows = await sbRest(path);
        cache[t] = cache[t] || {};
        for (const r of rows || []) {
          const local = cache[t][r.id];
          if (!local || (r.updated_at && (!local.updated_at || r.updated_at > local.updated_at))) {
            cache[t][r.id] = r;
          }
        }
        meta.lastSync[t] = nowIso();
      } catch (e) { console.warn('pull failed', t, e.message); }
    }
    persistCache(cache); persistMeta(meta);
  }
};

/* Seed bundled drug data into local cache if server is empty (fallback when seed SQL wasn't run).
   V2: also backfills contra/precautions/contra_keys for rows seeded by older app versions. */
async function ensureLocalDrugSeed() {
  const meta = loadMeta();
  if (meta.drugsSeededV2) return;
  const chunks = window.DRUG_CHUNKS || [];
  if (chunks.length === 0) { meta.drugsSeededV2 = true; persistMeta(meta); return; }
  const flat = chunks.flat();
  const byGeneric = {};
  for (const d of Store.all('drugs')) byGeneric[(d.generic || '').toLowerCase()] = d;
  for (const d of flat) {
    const key = (d.g || '').toLowerCase();
    if (!key) continue;
    const ex = byGeneric[key];
    if (ex && Array.isArray(ex.contra_keys) && ex.contra_keys.length) continue; // already complete
    const row = {
      generic: d.g, brands: (d.b || []).join('; '), formulations: (d.f || []).join('; '),
      category: d.cat || '', indications: d.ind || '', dose_adult: d.dose_adult || '',
      dose_ped: d.dose_ped || '', ped_flag: d.ped_flag || 'no_data',
      ped_mgkg: d.ped_mgkg ?? null, ped_mgkg_max: d.ped_mgkg_max ?? null,
      ped_daymax_mgkg: d.ped_daymax_mgkg ?? null, ped_cap_mg: d.ped_cap_mg ?? null,
      ped_freq: d.ped_freq || '', dose_renal: d.dose_renal || '', ci: d.ci || '',
      contra: d.contra || '', precautions: d.prec || '', contra_keys: d.contra_keys || [],
      interactions: d.inter || [], allergy: d.allergy || '', preg: d.preg || '',
      mon: d.mon || '', custom: false
    };
    if (ex) {
      // backfill only the new fields, keep server/local edits to other fields
      const needs = !ex.contra || !ex.precautions || !(Array.isArray(ex.contra_keys) && ex.contra_keys.length);
      if (needs) Store.save('drugs', { ...ex, contra: ex.contra || row.contra, precautions: ex.precautions || row.precautions, contra_keys: (Array.isArray(ex.contra_keys) && ex.contra_keys.length) ? ex.contra_keys : row.contra_keys });
    } else {
      Store.save('drugs', row);
    }
  }
  meta.drugsSeededV2 = true; persistMeta(meta);
}

/* Starter visit templates (SmartPhrase-style) inserted once */
const STARTER_TEMPLATES = [
  { code: 'htn', title: 'သွေးတိုး — စစ်ဆေးချက်', field: 'examination', body: 'BP: ___/___ mmHg (R/L), HR: ___/min, RR: ___/min\nGeneral: \nCVS: S1S2, no murmur\nRS: clear, no creps\nFundi: \nEdema: nil' },
  { code: 'dm', title: 'ဆီးချို — စစ်ဆေးချက်', field: 'examination', body: 'RBS/FBS: ___ mg/dL\nWeight: ___ kg, BMI: ___\nFeet exam: pulses ___, sensation ___, ulcer nil\nBP: ___/___ mmHg' },
  { code: 'uri', title: 'အသက်ရှူလမ်းကြောင်း — ရောဂါရာဇဝင်', field: 'history', body: 'Fever ___ days, cough (dry/productive), sore throat, rhinorrhea, sneezing\nNo SOB, no chest pain, no wheeze\nContact history: \nPast asthma/COPD: ' },
  { code: 'ge', title: 'အစာအိမ် — ကုသမှုအစီအစဉ်', field: 'plan', body: 'Diet advice: small frequent meals, avoid spicy/oily food, no smoking/alcohol\nReview in ___ days if not improved.\nRed flags explained: vomiting blood, black stool, severe pain → return urgently.' },
  { code: 'pe', title: 'ကလေး — အထွေထွေစစ်ဆေးချက်', field: 'examination', body: 'Weight: ___ kg, Temp: ___°F\nAlert, active / lethargic\nHydration: \nThroat: \nChest: \nAbdomen: soft, no organomegaly' },
];
async function ensureStarterTemplates() {
  const meta = loadMeta();
  if (meta.templatesSeeded) return;
  if (Store.all('visit_templates').length > 0) { meta.templatesSeeded = true; persistMeta(meta); return; }
  for (const t of STARTER_TEMPLATES) Store.save('visit_templates', { ...t });
  meta.templatesSeeded = true; persistMeta(meta);
}

/* UI helper hook (set by ui.js) */
let UIkit = null;
