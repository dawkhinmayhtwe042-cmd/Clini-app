/* ============================================================
   Clinic EMR — UI screens (Myanmar/English, mobile-first)
   ============================================================ */
'use strict';

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fmtDate = iso => { if (!iso) return '—'; const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso); return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate(); };
const fmtDT = iso => { if (!iso) return '—'; const d = new Date(iso); return fmtDate(iso) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const mmk = n => (Number(n) || 0).toLocaleString('en-US') + ' ' + t('kyat');
const nl2br = s => esc(s).replace(/\n/g, '<br>');
const L = obj => (LANG === 'my' ? obj.my : obj.en);

/* ---------- v3 helpers: frequency shorthand, food timing, KB matching ---------- */
function freqShort(f) {
  const x = String(f || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (/^od$|once daily|\bqd\b|^daily$|\bmane\b/.test(x)) return 'od';
  if (/^bd$|twice|\bbid\b|12 hourly|\bnocte\b/.test(x)) return 'bd';
  if (/^tds$|three times|\btid\b|8 hourly/.test(x)) return 'tds';
  if (/^qid$|four times|6 hourly/.test(x)) return 'qid';
  if (/stat/.test(x)) return 'stat';
  if (/prn|\bsos\b|as needed/.test(x)) return 'prn';
  if (/weekly/.test(x)) return 'weekly';
  return x || '—';
}
const TIMING_CODES = ['after_food', 'before_food', 'with_food', 'bedtime', 'morning', 'any'];
function timingLabel(c) { return t('tim_' + (TIMING_CODES.includes(c) ? c : 'any')); }
function timingOptions(sel) {
  sel = sel || 'any';
  return TIMING_CODES.map(c => `<option value="${c}" ${sel === c ? 'selected' : ''}>${t('tim_' + c)}</option>`).join('');
}
/* score a KB entry's kw_en/kw_my lists against a haystack */
function kbScore(entry, hayLow, hayRaw) {
  let s = 0;
  for (const k of (entry.kw_en || [])) { if (k && hayLow.includes(String(k).toLowerCase())) s += 2; }
  for (const k of (entry.kw_my || [])) { if (k && hayRaw.includes(String(k))) s += 2; }
  return s;
}
function kbMatch(kb, text) {
  const raw = String(text || '');
  const low = raw.toLowerCase();
  return (kb || []).map(e => ({ e, s: kbScore(e, low, raw) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
}
/* duplicate-therapy detection (same generic twice, or paracetamol in 2+ items) */
function dupTherapyWarnings(items) {
  const out = [];
  const seen = {};
  items.forEach((it, i) => {
    const g = norm(it.drug_generic);
    if (seen[g] != null) out.push({ level: 'amber',
      title: B('ထပ်နေသောဆေးညွှန်း', 'Duplicate therapy'),
      detail: B(`${it.drug_generic}: စာရင်း ${seen[g] + 1} နှင့် ${i + 1} တွင် ထပ်နေသည် — စုစုပေါင်းပမာဏ စစ်ပါ`,
        `${it.drug_generic}: appears in items ${seen[g] + 1} and ${i + 1} — check total dose`), itemIdx: i });
    else seen[g] = i;
  });
  const paraIdx = [];
  items.forEach((it, i) => {
    const d = drugByGeneric(it.drug_generic);
    if (!d) return;
    if (/paracetamol|acetaminophen/.test(norm([d.generic, d.brands, d.indications].join(' ')))) paraIdx.push(i);
  });
  if (paraIdx.length > 1)
    out.push({ level: 'amber',
      title: B('Paracetamol ပါဝင်မှုထပ်နေခြင်း', 'Paracetamol duplication'),
      detail: B(`${paraIdx.map(i => `${i + 1}. ${items[i].drug_generic}`).join(', ')} — paracetamol ပါဝင်သောဆေး ${paraIdx.length} မျိုး ထည့်ထားသည်။ တစ်နေ့တာစုစုပေါင်း 4 g မကျော်စေရန်`,
        `${paraIdx.map(i => `${i + 1}. ${items[i].drug_generic}`).join(', ')} — ${paraIdx.length} items contain paracetamol. Keep total ≤ 4 g/day.`), itemIdx: -1 });
  return out;
}

function toast(msg, ms = 2600) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._h); el._h = setTimeout(() => el.classList.remove('show'), ms);
}
function openModal(html) {
  closeModal();
  const m = document.createElement('div');
  m.id = 'modal'; m.className = 'modal open';
  m.innerHTML = `<div class="modal-card">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  document.body.appendChild(m);
  return m;
}
function closeModal() { const m = $('#modal'); if (m) m.remove(); }
function confirmDlg(msg, okLabel) {
  okLabel = okLabel || t('confirm');
  return new Promise(res => {
    const m = openModal(`<h3>${t('confirm')}</h3><p>${esc(msg)}</p>
      <div class="row"><button class="btn ghost" id="cf-no">${t('cancel')}</button>
      <button class="btn danger" id="cf-yes">${esc(okLabel)}</button></div>`);
    m.querySelector('#cf-no').onclick = () => { closeModal(); res(false); };
    m.querySelector('#cf-yes').onclick = () => { closeModal(); res(true); };
  });
}

/* ---------- app state ---------- */
const App = {
  user: null, profile: null,
  get role() { return this.profile ? this.profile.role : null; },
  get isDoctor() { return this.role === 'doctor'; },
  get cfg() { return getCfg(); }
};

UIkit = {
  syncBadge() {
    const b = $('#sync-badge'); if (!b) return;
    const n = Store.pendingCount();
    b.className = 'sync-badge ' + (!navigator.onLine ? 'off' : n > 0 ? 'pend' : 'ok');
    b.textContent = !navigator.onLine ? t('offline') : n > 0 ? t('sync_wait', n) : t('sync_ok');
  }
};

function langToggle() {
  return `<div class="lang-toggle" role="group" aria-label="language">
    <button class="${LANG === 'my' ? 'on' : ''}" onclick="switchLang('my')">မြန်မာ</button>
    <button class="${LANG === 'en' ? 'on' : ''}" onclick="switchLang('en')">EN</button>
  </div>`;
}
window.switchLang = l => { setLang(l); route(); };

function layout(content, active) {
  const fuCount = Store.by('followups', f => !f.done && f.due_date <= todayStr()).length;
  const tabs = [
    ['#/', '🏠', t('nav_dashboard'), 'dashboard'],
    ['#/patients', '🧑‍⚕️', t('nav_patients'), 'patients'],
    ['#/drugs', '💊', t('nav_drugs'), 'drugs'],
    ['#/followups', '📅', t('nav_followup') + (fuCount ? ` <span class="bdg">${fuCount}</span>` : ''), 'followups'],
    ['#/analytics', '📊', t('nav_analytics'), 'analytics'],
  ];
  $('#app').innerHTML = `
    <header class="appbar">
      <div class="brand"><div class="logo">⚕️</div>
        <div><h1>${esc(App.cfg.clinicName || t('appName'))}</h1><p>${t('tagline')}</p></div>
      </div>
      <div class="hbar">
        ${langToggle()}
        <span id="sync-badge" class="sync-badge"></span>
        <button class="icon-btn" onclick="location.hash='#/settings'" title="${t('s_title')}">⚙️</button>
      </div>
    </header>
    <main id="view">${content}</main>
    <nav class="tabbar">${tabs.map(([h, ic, lb, k]) =>
      `<a href="${h}" class="${active === k ? 'on' : ''}"><span>${ic}</span><small>${lb}</small></a>`).join('')}
    </nav>
    <footer class="disclaimer">${t('disc')}</footer>`;
  UIkit.syncBadge();
}
/* plain page without tabbar (login/setup/print handled separately) */
function bareLayout(content) {
  $('#app').innerHTML = `
    <header class="appbar"><div class="brand"><div class="logo">⚕️</div>
      <div><h1>${esc(App.cfg.clinicName || t('appName'))}</h1><p>${t('tagline')}</p></div></div>
      <div class="hbar">${langToggle()}</div>
    </header>
    <main id="view">${content}</main>
    <footer class="disclaimer">${t('disc')}</footer>`;
}
const card = (inner, cls = '') => `<div class="card ${cls}">${inner}</div>`;
const field = (label, inner) => `<label class="fld"><span>${label}</span>${inner}</label>`;
const btn = (label, onclick, cls = '') => `<button class="btn ${cls}" onclick="${onclick}">${label}</button>`;

/* ============================================================
   DASHBOARD
   ============================================================ */
function vDashboard() {
  const dt = todayStr();
  const dueToday = Store.by('followups', f => !f.done && f.due_date === dt);
  const overdue = Store.by('followups', f => !f.done && f.due_date < dt).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const visitsToday = Store.by('visits', v => (v.visit_date || '').slice(0, 10) === dt);
  const m = dt.slice(0, 7);
  const revMonth = Store.by('visits', v => (v.visit_date || '').slice(0, 7) === m)
    .reduce((s, v) => s + (Number(v.fee_consult) || 0) + (Number(v.fee_medicine) || 0), 0);
  const pname = id => { const p = Store.get('patients', id); return p ? esc(p.name) : '—'; };

  layout(`
    <div class="stats">
      <div class="stat"><b>${visitsToday.length}</b><span>${t('d_today_patients')}</span></div>
      <div class="stat"><b>${dueToday.length + overdue.length}</b><span>${t('d_followups')}</span></div>
      <div class="stat"><b>${(revMonth / 1000).toFixed(0)}k</b><span>${t('d_month_revenue')}</span></div>
    </div>

    ${card(`<div class="card-h"><h3>⏰ ${t('d_due_today')} (${dueToday.length})</h3><a href="#/followups" class="link">${t('view_all')}</a></div>
      ${dueToday.length ? dueToday.slice(0, 8).map(f => fuRow(f, pname)).join('') : `<p class="muted">${t('d_none_today')}</p>`}`)}

    ${overdue.length ? card(`<div class="card-h"><h3 class="red">🔴 ${t('d_overdue')} (${overdue.length})</h3><a href="#/followups" class="link">${t('view_all')}</a></div>
      ${overdue.slice(0, 8).map(f => fuRow(f, pname, true)).join('')}`, 'danger-card') : ''}

    <div class="row">
      ${btn(t('d_new_patient'), `location.hash='#/patient/new'`, 'primary')}
      ${btn(t('d_find_patient'), `location.hash='#/patients'`)}
    </div>
    ${App.isDoctor ? '' : `<p class="muted center">${t('d_role_apprentice', esc(App.profile.name))}</p>`}
  `, 'dashboard');
}
function fuRow(f, pname, od = false) {
  return `<div class="fu-row ${od ? 'od' : ''}">
    <div><b>${pname(f.patient_id)}</b><br><small class="muted">${esc(f.reason || '')} · ${fmtDate(f.due_date)}</small></div>
    <div class="row">
      <button class="btn sm" onclick="fuDone('${f.id}')">${t('mark_done')}</button>
      <button class="btn sm ghost" onclick="location.hash='#/patient/${f.patient_id}'">${t('open')}</button>
    </div>
  </div>`;
}
window.fuDone = id => {
  const f = Store.get('followups', id);
  if (f) { Store.save('followups', { ...f, done: true, done_date: todayStr() }); toast(t('fu_done_msg')); route(); }
};

/* ============================================================
   AUTH + SETUP
   ============================================================ */
function vSetup() {
  const c = getCfg();
  bareLayout(card(`<div class="card-h"><h3>⚙️ ${t('su_title')}</h3></div>
    <p class="muted">${t('su_desc')}</p>
    ${field(t('s_url'), `<input id="su-url" placeholder="${t('s_url_ph')}" value="${esc(c.supabaseUrl || 'https://hjcftfcfsbgqsinocugj.supabase.co')}" inputmode="url">`)}
    ${field(t('s_key'), `<input id="su-key" type="password" placeholder="${t('s_key_ph')}" value="${esc(c.anonKey || '')}">`)}
    <p class="warn-note">${t('s_key_help')}</p>
    ${field(t('s_clinic'), `<input id="su-clinic" value="${esc(c.clinicName || '')}" placeholder="${t('appName')}">`)}
    <div class="row">${btn(t('su_start'), 'saveSetup()', 'primary')}</div>
    ${(typeof window.AndroidBackup !== 'undefined') ? `<div class="row" style="margin-top:10px">${btn(t('su_offline'), 'skipSetupOffline()', 'ghost')}</div><p class="muted"><small>${t('su_offline_hint')}</small></p>` : ''}`));
}
window.skipSetupOffline = () => {
  const c = getCfg();
  const nm = $('#su-clinic') ? $('#su-clinic').value.trim() : '';
  saveCfg({ ...c, offlineOnly: true, clinicName: nm || c.clinicName || '' });
  location.hash = '#/';
};
window.saveSetup = () => {
  const url = $('#su-url').value.trim().replace(/\/$/, '');
  const key = $('#su-key').value.trim();
  if (!url || !key) { toast(t('su_need')); return; }
  const c = getCfg();
  saveCfg({ ...c, supabaseUrl: url, anonKey: key, clinicName: $('#su-clinic').value.trim() });
  location.hash = '#/login';
};

let authMode = 'login';
function vLogin() {
  bareLayout(card(`<div class="card-h"><h3>🔐 ${t(authMode === 'login' ? 'a_login' : 'a_signup')}</h3></div>
    <p class="warn-note">${t('a_first_note')}</p>
    ${authMode === 'signup' ? field(t('a_name'), `<input id="au-name" placeholder="${t('a_name_ph')}">`) : ''}
    ${field(t('a_email'), `<input id="au-email" type="email" autocomplete="username" inputmode="email">`)}
    ${field(t('a_password'), `<input id="au-pass" type="password" autocomplete="${authMode === 'login' ? 'current-password' : 'new-password'}">`)}
    ${authMode === 'signup' ? field(t('a_password2'), `<input id="au-pass2" type="password" autocomplete="new-password">`) : ''}
    <div class="row">${btn(t(authMode === 'login' ? 'a_login_btn' : 'a_signup_btn'), 'doAuth()', 'primary')}</div>
    <p class="center"><a class="link" href="javascript:void(0)" onclick="toggleAuthMode()">${t(authMode === 'login' ? 'a_no_account' : 'a_have_account')}</a></p>
    <p class="muted"><small>${t('a_check_email')}</small></p>`));
}
window.toggleAuthMode = () => { authMode = authMode === 'login' ? 'signup' : 'login'; vLogin(); };
window.doAuth = async () => {
  const email = $('#au-email').value.trim(), pass = $('#au-pass').value;
  if (!email || !pass) { toast(t('a_fill_all')); return; }
  try {
    if (authMode === 'signup') {
      const name = $('#au-name').value.trim();
      const p2 = $('#au-pass2').value;
      if (!name) { toast(t('a_fill_all')); return; }
      if (pass !== p2) { toast(t('a_mismatch')); return; }
      await Auth.signUp(email, pass);
      if (!Auth.user()) { toast(t('a_check_email')); return; }
      // create profile as apprentice; first-doctor claim via secure RPC
      const u = Auth.user();
      try { await sbRest('/profiles', { method: 'POST', body: { id: u.id, email, name, role: 'apprentice' }, prefer: 'return=minimal' }); } catch (e) { console.warn('profile insert', e.message); }
      try { await sbRest('/rpc/claim_first_doctor', { method: 'POST' }); } catch (e) { console.warn('claim doctor', e.message); }
      await loadProfile();
      toast(t('a_welcome', esc(App.profile ? App.profile.name : name)));
    } else {
      await Auth.signIn(email, pass);
      await loadProfile();
      toast(t('a_welcome', esc(App.profile ? App.profile.name : email)));
    }
    await ensureLocalDrugSeed(); await ensureStarterTemplates();
    Sync.run();
    location.hash = '#/';
  } catch (e) { toast(t('a_fail', e.message)); }
};
async function loadProfile() {
  const u = Auth.user();
  if (!u) { App.user = null; App.profile = null; return; }
  App.user = u;
  try {
    const rows = await sbRest(`/profiles?select=*&id=eq.${u.id}`);
    if (rows && rows.length) { App.profile = rows[0]; return; }
  } catch (e) { console.warn('profile load', e.message); }
  // fallback: local cache or minimal stub
  const cached = Store.get('profiles', u.id);
  App.profile = cached || { id: u.id, email: u.email, name: (u.email || '').split('@')[0], role: 'apprentice' };
}
window.doLogout = async () => {
  if (await confirmDlg(t('s_logout_confirm'))) { await Auth.signOut(); App.user = null; App.profile = null; location.hash = '#/login'; }
};

/* ============================================================
   SETTINGS + USERS
   ============================================================ */
function vSettings() {
  const c = getCfg();
  layout(`
    ${card(`<div class="card-h"><h3>⚙️ ${t('s_conn')}</h3></div>
      ${field(t('s_url'), `<input id="st-url" value="${esc(c.supabaseUrl || '')}" inputmode="url">`)}
      ${field(t('s_key'), `<input id="st-key" type="password" value="${esc(c.anonKey || '')}" placeholder="${t('s_key_ph')}">`)}
      <p class="warn-note">${t('s_key_help')}</p>
      ${field(t('s_clinic'), `<input id="st-clinic" value="${esc(c.clinicName || '')}">`)}
      ${field(t('s_doctor'), `<input id="st-doc" value="${esc(c.doctorName || '')}">`)}
      ${field(t('s_lang'), `<select id="st-lang"><option value="my" ${LANG === 'my' ? 'selected' : ''}>မြန်မာ</option><option value="en" ${LANG === 'en' ? 'selected' : ''}>English</option></select>`)}
      <div class="row wrap">
        ${btn(t('s_save'), 'saveSettings()', 'primary')}
        ${btn(t('s_test'), 'testConn()')}
        ${btn(t('s_sync_now'), 'manualSync()')}
      </div>
      <p class="muted">${t('s_pending', Store.pendingCount())} · <span id="net-state">${navigator.onLine ? '🌐 online' : t('offline')}</span></p>
    `)}
    ${card(`<div class="card-h"><h3>👤 ${t('s_user')}</h3></div>
      <p><b>${esc(App.profile ? App.profile.name : '')}</b><br>
      <small class="muted">${esc(App.profile ? App.profile.email : '')} · ${t('s_role')}: ${App.isDoctor ? t('u_doctor') : t('u_apprentice')}</small></p>
      <div class="row wrap">
        ${App.isDoctor ? btn(t('s_users'), `location.hash='#/users'`) : ''}
        ${btn(t('s_logout'), 'doLogout()', 'ghost')}
      </div>
      <p class="muted"><small>${t('s_add_hint')}</small></p>
    `)}
    ${card(`<div class="card-h"><h3>💾 ${t('bk_title')}</h3></div>
      <p class="muted"><small>${t('bk_last')}: ${esc(bkLastText())}</small></p>
      <p class="muted"><small>${t('bk_folder')}: ${esc(bkDirText())}</small></p>
      <div class="row wrap">${btn(t('bk_now'), 'bkNow()', 'primary')}</div>
      <p class="muted"><small>${t('bk_auto_hint')}</small></p>
    `)}
    ${card(`<div class="card-h"><h3>🗑️ ${t('s_clear')}</h3></div>
      <p class="muted"><small>${t('s_clear_confirm')}</small></p>
      ${btn(t('s_clear'), 'clearLocal()', 'danger ghost')}
    `)}
  `, 'settings');
}
window.saveSettings = () => {
  const c = getCfg();
  saveCfg({ ...c,
    supabaseUrl: $('#st-url').value.trim().replace(/\/$/, ''),
    anonKey: $('#st-key').value.trim(),
    clinicName: $('#st-clinic').value.trim(),
    doctorName: $('#st-doc').value.trim() });
  setLang($('#st-lang').value);
  toast(t('s_saved')); route();
};
window.testConn = async () => {
  try { await sbRest('/profiles?select=id&limit=1'); toast(t('s_test_ok')); }
  catch (e) { toast(t('s_test_fail', e.message)); }
};
window.manualSync = async () => { const r = await Sync.run(); toast(r.ok ? t('s_synced') : t('s_pending', Store.pendingCount())); route(); };
window.clearLocal = async () => {
  if (await confirmDlg(t('s_clear_confirm'))) {
    localStorage.removeItem(CACHE_KEY); localStorage.removeItem(OPS_KEY); localStorage.removeItem(META_KEY);
    toast(t('s_cleared')); location.hash = '#/';
  }
};

function vUsers() {
  if (!App.isDoctor) { location.hash = '#/settings'; return; }
  const users = Store.all('profiles').sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  layout(card(`<div class="card-h"><h3>👥 ${t('u_title')}</h3>
    <button class="btn sm ghost" onclick="location.hash='#/settings'">${t('back')}</button></div>
    <p class="muted"><small>${t('s_add_hint')}</small></p>
    ${users.map(u => `<div class="p-row">
      <div class="avatar">${esc((u.name || '?')[0])}</div>
      <div class="grow"><b>${esc(u.name)}</b><br><small class="muted">${esc(u.email || '')}</small></div>
      <select onchange="setRole('${u.id}', this.value)" ${u.id === App.user.id ? '' : ''}>
        <option value="doctor" ${u.role === 'doctor' ? 'selected' : ''}>${t('u_doctor')}</option>
        <option value="apprentice" ${u.role === 'apprentice' ? 'selected' : ''}>${t('u_apprentice')}</option>
      </select></div>`).join('') || `<p class="muted">${t('p_none')}</p>`}
  `), 'settings');
}
window.setRole = async (uid, role) => {
  if (role !== 'doctor') {
    const docs = Store.all('profiles').filter(p => p.role === 'doctor');
    if (docs.length <= 1 && docs[0] && docs[0].id === uid) { toast(t('u_last_doctor')); route(); return; }
  }
  const u = Store.get('profiles', uid);
  if (u) { Store.save('profiles', { ...u, role }); await Sync.run(); toast(t('u_saved')); }
  route();
};

/* ============================================================
   PATIENTS
   ============================================================ */
let patientQuery = '';
function vPatients() {
  const q = patientQuery.trim().toLowerCase();
  let list = Store.all('patients').sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
  if (q) list = list.filter(p => (p.name + ' ' + (p.phone || '')).toLowerCase().includes(q));
  layout(`
    <div class="searchbar"><input id="pq" placeholder="${t('p_search_ph')}" value="${esc(patientQuery)}"></div>
    <div class="list">
      ${list.slice(0, 200).map(p => `
        <a class="p-row" href="#/patient/${p.id}">
          <div class="avatar">${esc((p.name || '?')[0])}</div>
          <div class="grow"><b>${esc(p.name)}</b><br>
            <small class="muted">${p.age != null ? t('p_years_old', p.age) : ''} ${p.sex === 'male' ? '· ' + t('p_male') : p.sex === 'female' ? '· ' + t('p_female') : ''} ${p.phone ? '· ' + esc(p.phone) : ''}</small></div>
          <span>›</span>
        </a>`).join('') || `<p class="muted center">${t('p_no_patient')}</p>`}
    </div>
    <div class="fab"><button class="btn primary round" onclick="location.hash='#/patient/new'">＋</button></div>
  `, 'patients');
  const inp = $('#pq');
  inp.addEventListener('input', () => { patientQuery = inp.value; clearTimeout(inp._h); inp._h = setTimeout(() => { const pos = inp.selectionStart; vPatients(); const n = $('#pq'); n.focus(); n.setSelectionRange(pos, pos); }, 350); });
}

function patientForm(p = {}) {
  return `
    ${field(t('p_name'), `<input id="pf-name" value="${esc(p.name || '')}" required>`)}
    <div class="grid2">
      ${field(t('p_age'), `<input id="pf-age" type="number" min="0" max="130" value="${p.age ?? ''}" inputmode="numeric">`)}
      ${field(t('p_sex'), `<select id="pf-sex"><option value="">—</option>
        <option value="male" ${p.sex === 'male' ? 'selected' : ''}>${t('p_male')}</option>
        <option value="female" ${p.sex === 'female' ? 'selected' : ''}>${t('p_female')}</option></select>`)}
    </div>
    <div class="grid2">
      ${field(t('p_phone'), `<input id="pf-phone" value="${esc(p.phone || '')}" inputmode="tel">`)}
      ${field(t('p_weight'), `<input id="pf-wt" type="number" step="0.1" min="0" value="${p.weight_kg ?? ''}" inputmode="decimal">`)}
    </div>
    ${field(t('p_allergies'), `<input id="pf-alg" value="${esc(p.allergies || '')}" placeholder="${t('p_allergies_ph')}">`)}
    ${field(t('p_chronic'), `<input id="pf-chr" value="${esc(p.chronic || '')}" placeholder="${t('p_chronic_ph')}">`)}
    ${field(t('p_current_meds'), `<input id="pf-meds" value="${esc(p.current_meds || '')}" placeholder="${t('p_current_meds_ph')}">`)}
    <div class="grid2">
      <label class="chk"><input type="checkbox" id="pf-preg" ${p.pregnant ? 'checked' : ''}> ${t('p_pregnant')}</label>
      <label class="chk"><input type="checkbox" id="pf-renal" ${p.renal_issue ? 'checked' : ''}> ${t('p_renal')}</label>
    </div>
    <div class="grid2">
      <label class="chk"><input type="checkbox" id="pf-g6pd" ${p.g6pd ? 'checked' : ''}> ${t('p_g6pd')}</label>
      <label class="chk"><input type="checkbox" id="pf-hf" ${p.heart_failure ? 'checked' : ''}> ${t('p_hf')}</label>
    </div>
    <div class="grid2">
      <label class="chk"><input type="checkbox" id="pf-asthma" ${p.asthma_copd ? 'checked' : ''}> ${t('p_asthma_copd')}</label>
      <label class="chk"><input type="checkbox" id="pf-ep" ${p.epilepsy ? 'checked' : ''}> ${t('p_epilepsy')}</label>
    </div>
    <div class="grid2">
      ${field(t('p_liver'), `<select id="pf-liver">
        ${['none', 'mild', 'moderate', 'severe'].map(g => `<option value="${g}" ${(p.liver_issue || 'none') === g ? 'selected' : ''}>${t('liver_' + g)}</option>`).join('')}</select>`)}
      ${field(t('p_thyroid'), `<input id="pf-thyroid" value="${esc(p.thyroid || '')}" placeholder="e.g. hypothyroid">`)}
    </div>
    <div class="grid2">
      ${field(t('p_smoking'), `<select id="pf-smoke">
        ${[['no', 'smoke_no'], ['occasional', 'smoke_occ'], ['daily', 'smoke_daily']].map(([val, k]) => `<option value="${val}" ${(p.smoking || 'no') === val ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>`)}
      ${field(t('p_alcohol'), `<select id="pf-alc">
        ${[['no', 'alc_no'], ['occasional', 'alc_occ'], ['regular', 'alc_reg']].map(([val, k]) => `<option value="${val}" ${(p.alcohol || 'no') === val ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>`)}
    </div>
    ${field(t('p_notes'), `<textarea id="pf-notes" rows="2">${esc(p.notes || '')}</textarea>`)}`;
}
function readPatientForm(p = {}) {
  const v = id => $('#' + id).value.trim();
  return { ...p, name: v('pf-name'), age: v('pf-age') === '' ? null : Number(v('pf-age')),
    sex: $('#pf-sex').value || null, phone: v('pf-phone'),
    weight_kg: v('pf-wt') === '' ? null : Number(v('pf-wt')),
    allergies: v('pf-alg'), chronic: v('pf-chr'), current_meds: v('pf-meds'),
    pregnant: $('#pf-preg').checked, renal_issue: $('#pf-renal').checked,
    g6pd: $('#pf-g6pd').checked, heart_failure: $('#pf-hf').checked,
    asthma_copd: $('#pf-asthma').checked, epilepsy: $('#pf-ep').checked,
    liver_issue: $('#pf-liver').value || 'none', thyroid: v('pf-thyroid'),
    smoking: $('#pf-smoke').value || 'no', alcohol: $('#pf-alc').value || 'no',
    notes: v('pf-notes'), created_by: App.user.id };
}
function vPatientNew() {
  layout(card(`<div class="card-h"><h3>➕ ${t('p_new')}</h3></div>
    ${patientForm()}
    <div class="row">${btn(t('save'), 'savePatientNew()', 'primary')}${btn(t('cancel'), `location.hash='#/patients'`, 'ghost')}</div>`), 'patients');
}
window.savePatientNew = () => {
  const d = readPatientForm();
  if (!d.name) { toast(t('p_need_name')); return; }
  const p = Store.save('patients', d);
  toast(t('p_saved'));
  location.hash = '#/patient/' + p.id;
};

function vPatientDetail(id) {
  const p = Store.get('patients', id);
  if (!p) { location.hash = '#/patients'; return; }
  const visits = Store.by('visits', v => v.patient_id === id).sort((a, b) => (b.visit_date || '').localeCompare(a.visit_date || ''));
  const prescs = Store.by('prescriptions', r => r.patient_id === id).sort((a, b) => (b.presc_date || '').localeCompare(a.presc_date || ''));
  const fus = Store.by('followups', f => f.patient_id === id).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  const sexLbl = p.sex === 'male' ? t('p_male') : p.sex === 'female' ? t('p_female') : '';

  layout(`
    <div class="card p-head">
      <div class="avatar big">${esc((p.name || '?')[0])}</div>
      <div class="grow"><h2>${esc(p.name)}</h2>
        <small class="muted">${p.age != null ? t('p_years_old', p.age) : ''} ${sexLbl ? '· ' + sexLbl : ''}</small>
        ${p.age != null && Number(p.age) >= 65 ? ` <span class="tag amber">👴 ${t('p_elderly')}</span>` : ''}<br>
        <small class="muted">${p.phone ? '📞 ' + esc(p.phone) : ''} ${p.weight_kg ? '· ⚖️ ' + p.weight_kg + ' ' + t('kg') : ''}</small>
        ${p.allergies ? `<div class="allergy">⚠️ ${t('p_allergy_is')}: ${esc(p.allergies)}</div>` : ''}
        ${p.chronic ? `<div><small>${t('p_chronic_is')}: ${esc(p.chronic)}</small></div>` : ''}
        ${p.pregnant ? `<div><small>🤰 ${t('p_pregnant')}</small></div>` : ''}
        ${p.renal_issue ? `<div><small>🫘 ${t('p_renal')}</small></div>` : ''}
        ${p.g6pd ? `<div><small>🧬 ${t('p_g6pd')}</small></div>` : ''}
        ${p.heart_failure ? `<div><small>❤️ ${t('p_hf')}</small></div>` : ''}
        ${p.asthma_copd ? `<div><small>🫁 ${t('p_asthma_copd')}</small></div>` : ''}
        ${p.epilepsy ? `<div><small>⚡ ${t('p_epilepsy')}</small></div>` : ''}
        ${p.liver_issue && p.liver_issue !== 'none' ? `<div><small>${t('p_liver')}: ${t('liver_' + p.liver_issue)}</small></div>` : ''}
        ${p.thyroid ? `<div><small>${t('p_thyroid')}: ${esc(p.thyroid)}</small></div>` : ''}
        ${p.smoking && p.smoking !== 'no' ? `<div><small>🚬 ${t('p_smoking')}: ${t(p.smoking === 'daily' ? 'smoke_daily' : 'smoke_occ')}</small></div>` : ''}
        ${p.alcohol && p.alcohol !== 'no' ? `<div><small>🍺 ${t('p_alcohol')}: ${t(p.alcohol === 'regular' ? 'alc_reg' : 'alc_occ')}</small></div>` : ''}
      </div>
    </div>
    <div class="row wrap">
      ${btn(t('p_new_visit'), `location.hash='#/visit/new?patient=${id}'`, 'primary')}
      ${btn(t('p_new_rx'), `location.hash='#/rx/new?patient=${id}'`)}
      ${btn(t('p_edit'), `location.hash='#/patient/${id}/edit'`, 'ghost')}
      ${App.isDoctor ? btn(t('p_delete'), `delPatient('${id}')`, 'danger ghost') : ''}
    </div>

    ${card(`<div class="card-h"><h3>🩺 ${t('p_visits')} (${visits.length})</h3></div>
      ${visits.map(v => `<a class="p-row" href="#/visit/${v.id}">
        <div class="grow"><b>${fmtDate(v.visit_date)}</b> — ${esc((v.diagnosis || '—').slice(0, 60))}<br>
        <small class="muted">${esc((v.chief_complaint || '').slice(0, 80))}</small></div><span>›</span></a>`).join('') || `<p class="muted">${t('p_none')}</p>`}`)}

    ${vitalsTrendHtml(id)}

    ${card(`<div class="card-h"><h3>💊 ${t('p_prescriptions')} (${prescs.length})</h3></div>
      ${prescs.map(r => { const n = Store.by('prescription_items', i => i.prescription_id === r.id).length;
        return `<a class="p-row" href="#/rx/${r.id}"><div class="grow"><b>${fmtDate(r.presc_date)}</b> — ${n} 💊<br>
        <small class="muted">${esc((r.notes || '').slice(0, 80))}</small></div><span>›</span></a>`; }).join('') || `<p class="muted">${t('p_none')}</p>`}`)}

    ${card(`<div class="card-h"><h3>📅 ${t('p_followups')}</h3></div>
      ${fus.map(f => `<div class="fu-row ${f.done ? 'done' : (f.due_date < todayStr() ? 'od' : '')}">
        <div><b>${fmtDate(f.due_date)}</b> ${f.done ? '✅' : ''}<br><small class="muted">${esc(f.reason || '')}</small></div>
        ${f.done ? '' : `<button class="btn sm" onclick="fuDone('${f.id}')">${t('mark_done')}</button>`}
      </div>`).join('') || `<p class="muted">${t('p_none')}</p>`}`)}
  `, 'patients');
}
window.delPatient = async id => {
  if (!App.isDoctor) return;
  if (await confirmDlg(t('p_del_confirm'))) { Store.softDeletePatient(id); toast(t('p_deleted')); location.hash = '#/patients'; }
};
function vPatientEdit(id) {
  const p = Store.get('patients', id);
  if (!p) { location.hash = '#/patients'; return; }
  layout(card(`<div class="card-h"><h3>✏️ ${t('p_edit_title')}</h3></div>
    ${patientForm(p)}
    <div class="row">${btn(t('save'), `savePatientEdit('${id}')`, 'primary')}${btn(t('cancel'), `location.hash='#/patient/${id}'`, 'ghost')}</div>`), 'patients');
}
window.savePatientEdit = id => {
  const p = Store.get('patients', id);
  const d = readPatientForm(p);
  if (!d.name) { toast(t('p_need_name')); return; }
  Store.save('patients', d); toast(t('p_updated')); location.hash = '#/patient/' + id;
};

/* ============================================================
   VISITS (SmartPhrase templates + advice)
   ============================================================ */
const TPL_FIELDS = [['chief_complaint', 'f_complaint'], ['history', 'f_history'], ['examination', 'f_exam'], ['plan', 'f_plan']];
function tplChips(fldName) {
  const tpls = Store.all('visit_templates').filter(x => x.field === fldName);
  if (!tpls.length) return '';
  return `<div class="chips">${tpls.map(x =>
    `<button type="button" class="chip" title="${esc(x.title)}" onclick="insertTpl('${x.id}','${fldName}')">${esc(x.code)}</button>`).join('')}</div>`;
}
window.insertTpl = (tid, fld) => {
  const x = Store.get('visit_templates', tid);
  const ta = $('#vf-' + fld);
  if (!x || !ta) return;
  const s = ta.selectionStart || ta.value.length;
  ta.value = ta.value.slice(0, s) + x.body + ta.value.slice(ta.selectionEnd || s);
  ta.focus(); toast(t('v_tpl_inserted', x.code));
};

function vVisitNew(patientId) {
  const p = Store.get('patients', patientId);
  if (!p) { location.hash = '#/patients'; return; }
  VPlan = [];
  layout(card(`<div class="card-h"><h3>🩺 ${t('v_new')} — ${esc(p.name)}</h3></div>
    ${field(t('v_date'), `<input id="vf-date" type="date" value="${todayStr()}">`)}
    ${field(t('v_complaint'), `${tplChips('chief_complaint')}<textarea id="vf-chief_complaint" rows="2"></textarea>`)}
    ${field(t('v_history'), `${tplChips('history')}<textarea id="vf-history" rows="3"></textarea>`)}
    ${field(t('v_exam'), `${tplChips('examination')}<textarea id="vf-examination" rows="4"></textarea>`)}
    <div class="sec"><b>${t('v_vitals')}</b>
      <div class="grid2">
        ${field(t('vit_bp_sys'), `<input id="vf-vs" type="number" inputmode="numeric">`)}
        ${field(t('vit_bp_dia'), `<input id="vf-vd" type="number" inputmode="numeric">`)}
      </div>
      <div class="grid2">
        ${field(t('vit_hr'), `<input id="vf-hr" type="number" inputmode="numeric">`)}
        ${field(t('vit_wt'), `<input id="vf-vwt" type="number" step="0.1" inputmode="decimal">`)}
      </div>
      <div class="grid2">
        ${field(t('vit_temp'), `<input id="vf-temp" type="number" step="0.1" inputmode="decimal">`)}
        ${field(t('vit_hba1c'), `<input id="vf-hba1c" type="number" step="0.1" inputmode="decimal">`)}
      </div>
      <div class="grid2">
        ${field(t('vit_rbs'), `<input id="vf-rbs" type="number" inputmode="decimal">`)}
        ${field(t('vit_fbs'), `<input id="vf-fbs" type="number" inputmode="decimal">`)}
      </div>
    </div>
    <div class="row wrap">
      ${btn(t('inv_suggest_btn'), 'showInvest()')}
      ${btn(t('ddx_btn'), 'showDDx()')}
    </div>
    <div id="inv-plan-box"></div>
    <div class="fld"><span>${t('v_diagnosis')}</span>
      <div class="row"><input id="vf-diagnosis" class="grow" placeholder="${t('v_diagnosis_ph')}">
      <button type="button" class="btn sm" onclick="showAdvice()">${t('v_advice_btn')}</button></div>
    </div>
    ${field(t('v_plan'), `${tplChips('plan')}<textarea id="vf-plan" rows="3"></textarea>`)}
    ${field(t('v_next_visit'), `<input id="vf-next" type="date">`)}
    <div class="grid2">
      ${field(t('v_fee_consult'), `<input id="vf-fc" type="number" min="0" value="0" inputmode="numeric">`)}
      ${field(t('v_fee_medicine'), `<input id="vf-fm" type="number" min="0" value="0" inputmode="numeric">`)}
    </div>
    <div class="row wrap">
      ${btn(t('save'), `saveVisitNew('${patientId}')`, 'primary')}
      ${btn(t('v_save_rx'), `saveVisitNew('${patientId}',true)`)}
      ${btn(t('cancel'), `location.hash='#/patient/${patientId}'`, 'ghost')}
    </div>
    ${vitalsTrendHtml(patientId)}`), 'patients');
}
window.showAdvice = () => {
  const dx = $('#vf-diagnosis').value;
  const pid = new URLSearchParams(location.hash.split('?')[1] || '').get('patient');
  const p = pid ? Store.get('patients', pid) : null;
  const rules = getAdvice(dx, p);
  if (!rules.length) { toast(t('v_no_advice')); return; }
  openModal(`<h3>💡 ${t('adv_title')} <small class="muted">${t('adv_suggest_only')}</small></h3>
    ${rules.map(r => `<div class="advice"><b>${esc(advTitle(r))}</b><ul>${advPoints(r).map(pt => `<li>${esc(pt)}</li>`).join('')}</ul>
      <small class="muted">${t('adv_source')}: ${esc(r.source)}</small></div>`).join('')}
    <p class="warn-note">${t('adv_note')}</p>
    <div class="row"><button class="btn primary" onclick="closeModal()">${t('close')}</button></div>`);
};
window.saveVisitNew = (patientId, goRx = false) => {
  const v = id => $('#' + id).value.trim();
  const num = id => { const x = v(id); return x === '' ? null : Number(x); };
  const visit = Store.save('visits', {
    patient_id: patientId, visit_date: $('#vf-date').value || todayStr(),
    chief_complaint: v('vf-chief_complaint'), history: v('vf-history'),
    examination: v('vf-examination'), diagnosis: v('vf-diagnosis'), plan: v('vf-plan'),
    next_visit_date: $('#vf-next').value || null,
    vitals_bp_sys: num('vf-vs'), vitals_bp_dia: num('vf-vd'), vitals_hr: num('vf-hr'),
    vitals_weight: num('vf-vwt'), vitals_temp: num('vf-temp'),
    vitals_rbs: num('vf-rbs'), vitals_fbs: num('vf-fbs'), vitals_hba1c: num('vf-hba1c'),
    planned_investigations: JSON.stringify(VPlan),
    fee_consult: Number($('#vf-fc').value) || 0, fee_medicine: Number($('#vf-fm').value) || 0,
    created_by: App.user.id
  });
  const nd = $('#vf-next').value;
  if (nd) Store.save('followups', { patient_id: patientId, visit_id: visit.id, due_date: nd, reason: v('vf-diagnosis'), created_by: App.user.id });
  toast(t('v_saved'));
  location.hash = goRx ? '#/rx/new?patient=' + patientId + '&visit=' + visit.id : '#/patient/' + patientId;
};
function vVisitDetail(id) {
  const vs = Store.get('visits', id);
  if (!vs) { location.hash = '#/patients'; return; }
  const p = Store.get('patients', vs.patient_id);
  const secs = [[t('v_complaint'), vs.chief_complaint], [t('v_history'), vs.history], [t('v_exam'), vs.examination], [t('v_diagnosis'), vs.diagnosis], [t('v_plan'), vs.plan]];
  const vitBits = [
    (vs.vitals_bp_sys || vs.vitals_bp_dia) ? `BP ${vs.vitals_bp_sys || '—'}/${vs.vitals_bp_dia || '—'}` : '',
    vs.vitals_hr ? `HR ${vs.vitals_hr}` : '', vs.vitals_weight ? `Wt ${vs.vitals_weight}kg` : '',
    vs.vitals_temp ? `T ${vs.vitals_temp}°F` : '', vs.vitals_rbs ? `RBS ${vs.vitals_rbs}` : '',
    vs.vitals_fbs ? `FBS ${vs.vitals_fbs}` : '', vs.vitals_hba1c ? `HbA1c ${vs.vitals_hba1c}` : ''
  ].filter(Boolean);
  let planInv = [];
  try { planInv = JSON.parse(vs.planned_investigations || '[]'); } catch {}
  layout(card(`<div class="card-h"><h3>🩺 ${fmtDate(vs.visit_date)} — ${p ? esc(p.name) : ''}</h3>
      <button class="btn sm ghost" onclick="location.hash='#/patient/${vs.patient_id}'">${t('back')}</button></div>
    ${secs.map(([x, y]) => y ? `<div class="sec"><b>${x}</b><p>${nl2br(y)}</p></div>` : '').join('')}
    ${vitBits.length ? `<div class="sec"><b>${t('v_vitals')}</b><p>${vitBits.map(esc).join(' · ')}</p></div>` : ''}
    ${planInv.length ? `<div class="sec"><b>${t('inv_planned')}</b><ul>${planInv.map(x => `<li>${esc(x.t || x)}${x.src ? ` <small class="muted">(${esc(x.src)})</small>` : ''}</li>`).join('')}</ul></div>` : ''}
    <div class="sec"><b>${t('v_billing')}</b><p>${t('b_consult')}: ${mmk(vs.fee_consult)} · ${t('b_medicine')}: ${mmk(vs.fee_medicine)}</p></div>
    ${vs.next_visit_date ? `<div class="sec"><b>${t('v_next_date')}</b><p>${fmtDate(vs.next_visit_date)}</p></div>` : ''}
    <div class="row">${btn(t('p_new_rx'), `location.hash='#/rx/new?patient=${vs.patient_id}&visit=${id}'`, 'primary')}</div>`), 'patients');
}

/* ============================================================
   v3: VITALS TREND + advisory suggestions (advisory only)
   ============================================================ */
function vitalsTrendHtml(pid) {
  const vs = Store.by('visits', v => v.patient_id === pid &&
    (v.vitals_bp_sys || v.vitals_bp_dia || v.vitals_hr || v.vitals_rbs || v.vitals_fbs || v.vitals_weight))
    .sort((a, b) => (a.visit_date || '').localeCompare(b.visit_date || ''));
  if (!vs.length) return '';
  const rows = vs.slice(-5);
  const arrow = (cur, prev) => {
    if (cur == null || prev == null || cur === '' || prev === '') return '';
    const c = Number(cur), p2 = Number(prev);
    if (c > p2) return ' <b class="red">▲</b>';
    if (c < p2) return ' <b class="green">▼</b>';
    return ' <span class="muted">=</span>';
  };
  const cell = (v, pr, key) => (v[key] != null && v[key] !== '')
    ? `${v[key]}${arrow(v[key], pr ? pr[key] : null)}` : '—';
  let html = `<div class="card-h"><h3>${t('fu_trend')}</h3></div>
    <table class="tbl"><tr><th>${t('v_date')}</th><th>BP</th><th>HR</th><th>${t('vit_wt')}</th><th>RBS/FBS</th></tr>`;
  rows.forEach((v, i) => {
    const pr = i === 0 ? (vs[vs.indexOf(v) - 1] || null) : rows[i - 1];
    const bp = (v.vitals_bp_sys || v.vitals_bp_dia)
      ? `${v.vitals_bp_sys || '—'}/${v.vitals_bp_dia || '—'}${arrow(v.vitals_bp_sys, pr && pr.vitals_bp_sys)}` : '—';
    const glu = (v.vitals_rbs || v.vitals_fbs)
      ? `${v.vitals_rbs ? 'R' + v.vitals_rbs : ''}${v.vitals_rbs && v.vitals_fbs ? ' ' : ''}${v.vitals_fbs ? 'F' + v.vitals_fbs : ''}${arrow(v.vitals_rbs || v.vitals_fbs, pr && (pr.vitals_rbs || pr.vitals_fbs))}` : '—';
    html += `<tr><td>${fmtDate(v.visit_date)}</td><td>${bp}</td><td>${cell(v, pr, 'vitals_hr')}</td><td>${cell(v, pr, 'vitals_weight')}</td><td>${glu}</td></tr>`;
  });
  html += '</table>';
  const sugg = [];
  const last3 = vs.slice(-3);
  if (last3.length === 3 && last3.every(v => Number(v.vitals_bp_sys) >= 140 || Number(v.vitals_bp_dia) >= 90))
    sugg.push(t('fu_bp3'));
  const lv = vs[vs.length - 1];
  if (Number(lv.vitals_bp_sys) >= 180 || Number(lv.vitals_bp_dia) >= 110) sugg.push(t('fu_bp_urgent'));
  if (Number(lv.vitals_fbs) >= 126 || Number(lv.vitals_rbs) >= 200) sugg.push(t('fu_glucose'));
  if (sugg.length)
    html += `<div class="warn-box">💡 <ul>${sugg.map(s => `<li>${esc(s)}</li>`).join('')}</ul><small class="muted">${esc(t('disc2'))}</small></div>`;
  return card(html);
}

/* ============================================================
   v3: INVESTIGATION KB chips (advisory; guarded if KB missing)
   ============================================================ */
let VPlan = [];
let KB_INV_MATCHES = [];
function visitHaystack() {
  const g = id => { const el = $('#' + id); return el ? el.value : ''; };
  return [g('vf-chief_complaint'), g('vf-history'), g('vf-examination')].filter(Boolean).join('\n');
}
function drawInvPlan() {
  const box = $('#inv-plan-box'); if (!box) return;
  if (!VPlan.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="sec"><b>${t('inv_planned')} (${VPlan.length})</b>
    ${VPlan.map((x, i) => `<div class="rx-item"><div class="grow">${esc(x.t)}<br><small class="muted">${t('inv_source')}: ${esc(x.src)}</small></div>
      <button type="button" class="btn sm danger ghost" onclick="invDel(${i})">✕</button></div>`).join('')}</div>`;
}
window.invDel = i => { VPlan.splice(i, 1); drawInvPlan(); };
window.showInvest = () => {
  KB_INV_MATCHES = kbMatch(window.INVEST_KB || [], visitHaystack()).slice(0, 6).map(x => x.e);
  if (!KB_INV_MATCHES.length) { toast(t('inv_none')); return; }
  openModal(`<h3>${t('inv_title')}</h3><p class="muted"><small>${esc(t('disc2'))}</small></p>
    ${KB_INV_MATCHES.map((e, i) => {
      const srcs = [...new Set((e.tests || []).map(x => x.src).filter(Boolean))].join(', ');
      return `<div class="sec"><b>${esc(LANG === 'my' ? e.pres_my : e.pres_en)}</b>
        <div class="chips">${(e.tests || []).map((x, j) =>
          `<button type="button" class="chip" onclick="invAdd(${i},${j})">＋ ${esc(LANG === 'my' ? x.t_my : x.t_en)}</button>`).join('')}</div>
        <small class="muted">${t('inv_source')}: ${esc(srcs)}</small></div>`;
    }).join('')}
    <div class="row"><button class="btn primary" onclick="closeModal()">${t('close')}</button></div>`);
};
window.invAdd = (i, j) => {
  const x = KB_INV_MATCHES[i] && KB_INV_MATCHES[i].tests[j];
  if (!x) return;
  const name = LANG === 'my' ? x.t_my : x.t_en;
  if (!VPlan.some(p2 => p2.t === name)) VPlan.push({ t: name, src: x.src || '' });
  drawInvPlan(); toast(t('inv_added'));
};

/* ============================================================
   v3: DDx panel — "လုပ်ဖော်ဆရာဝန် အကြံ" + case summary (advisory)
   ============================================================ */
let KB_DDX_MATCHES = [];
window.showDDx = () => {
  KB_DDX_MATCHES = kbMatch(window.DDX_KB || [], visitHaystack()).slice(0, 5);
  if (!KB_DDX_MATCHES.length) { toast(t('ddx_none')); return; }
  openModal(`<h3>${t('ddx_title')}</h3><p class="muted"><small>${esc(t('disc2'))}</small></p>
    ${KB_DDX_MATCHES.map((x, i) => {
      const e = x.e;
      return `<div class="sec"><b>${i + 1}. ${esc(LANG === 'my' ? e.pres_my : e.pres_en)}</b>
        <ul>${(e.ddx || []).map(d => `<li><b>${esc(LANG === 'my' ? d.dx_my : d.dx_en)}</b><br><small>${t('ddx_reason')}: ${esc(LANG === 'my' ? d.why_my : d.why_en)}</small> <small class="muted">(${esc(d.src || '')})</small></li>`).join('')}</ul>
        ${(e.redflags || []).length ? `<div class="warn-box red"><b>${t('ddx_redflags')}</b><ul>${e.redflags.map(r => `<li>${esc(LANG === 'my' ? r.my : r.en)}</li>`).join('')}</ul></div>` : ''}
      </div>`;
    }).join('')}
    <div class="row wrap">
      <button class="btn" onclick="caseSummary()">${t('ddx_summary_btn')}</button>
      <button class="btn primary" onclick="closeModal()">${t('close')}</button>
    </div>`);
};
window.caseSummary = () => {
  const pid = new URLSearchParams(location.hash.split('?')[1] || '').get('patient');
  const p = pid ? Store.get('patients', pid) : null;
  const v = id => { const el = $('#' + id); return el ? el.value.trim() : ''; };
  const vit = [v('vf-vs') && v('vf-vd') ? `BP ${v('vf-vs')}/${v('vf-vd')}` : '', v('vf-hr') ? `HR ${v('vf-hr')}` : '',
    v('vf-vwt') ? `Wt ${v('vf-vwt')}kg` : '', v('vf-temp') ? `T ${v('vf-temp')}F` : '',
    v('vf-rbs') ? `RBS ${v('vf-rbs')}` : '', v('vf-fbs') ? `FBS ${v('vf-fbs')}` : '',
    v('vf-hba1c') ? `HbA1c ${v('vf-hba1c')}` : ''].filter(Boolean).join(', ');
  const L2 = LANG === 'my' ? 'my' : 'en';
  const ddxTxt = KB_DDX_MATCHES.slice(0, 3).map((x, i) =>
    `${i + 1}. ${(x.e.ddx || []).slice(0, 2).map(d => (L2 === 'my' ? d.dx_my : d.dx_en) + ' — ' + (L2 === 'my' ? d.why_my : d.why_en)).join('; ')}`).join('\n');
  const flags = [...new Set(KB_DDX_MATCHES.flatMap(x => (x.e.redflags || []).map(r => L2 === 'my' ? r.my : r.en)))];
  const txt =
`CASE PRESENTATION
Patient: ${p ? p.name : ''}${p && p.age != null ? ', ' + p.age + 'y' : ''}${p && p.sex ? ', ' + p.sex : ''}
Chief complaint: ${v('vf-chief_complaint')}
History: ${v('vf-history')}
Examination: ${v('vf-examination')}
Vitals: ${vit || '—'}
Differential diagnoses:
${ddxTxt || '—'}
Red flags to watch: ${flags.join('; ') || '—'}
Plan: ${v('vf-plan')}
(Advisory only — the doctor's judgment prevails.)`;
  openModal(`<h3>${t('ddx_summary_title')}</h3>
    <textarea id="cs-txt" rows="14" readonly>${esc(txt)}</textarea>
    <p class="muted"><small>${esc(t('disc2'))}</small></p>
    <div class="row"><button class="btn" onclick="copyCaseSummary()">${t('ddx_copy')}</button>
    <button class="btn primary" onclick="closeModal()">${t('close')}</button></div>`);
};
window.copyCaseSummary = async () => {
  try { await navigator.clipboard.writeText($('#cs-txt').value); toast(t('ddx_copied')); }
  catch { const el = $('#cs-txt'); el.select(); try { document.execCommand('copy'); } catch {} toast(t('ddx_copied')); }
};

/* ============================================================
   TEMPLATES management
   ============================================================ */
function vTemplates() {
  const tpls = Store.all('visit_templates').sort((a, b) => a.code.localeCompare(b.code));
  const fname = f => t(TPL_FIELDS.find(x => x[0] === f)?.[1] || 'f_exam');
  layout(`
    <div class="row">${btn('＋ ' + t('t_new'), `location.hash='#/template/new'`, 'primary')}</div>
    <p class="muted"><small>${t('t_hint')}</small></p>
    ${tpls.map(x => `<div class="card"><div class="card-h"><h3><span class="chip">${esc(x.code)}</span> ${esc(x.title)}</h3>
      <div class="row">${btn(t('edit'), `location.hash='#/template/${x.id}'`, 'sm ghost')}
      ${btn(t('delete'), `delTpl('${x.id}')`, 'sm danger ghost')}</div></div>
      <p><small class="muted">${fname(x.field)}</small></p><p>${nl2br(x.body)}</p></div>`).join('')
      || `<p class="muted center">${t('t_none')}</p>`}
  `, 'patients');
}
window.delTpl = async id => { if (await confirmDlg(t('t_del_confirm'))) { Store.del('visit_templates', id); toast(t('t_deleted')); route(); } };
function vTemplateForm(id) {
  const x = id === 'new' ? { code: '', title: '', field: 'examination', body: '' } : Store.get('visit_templates', id);
  if (!x) { location.hash = '#/templates'; return; }
  layout(card(`<div class="card-h"><h3>${id === 'new' ? '＋' : '✏️'} ${t('t_title')}</h3></div>
    ${field(t('t_code'), `<input id="tp-code" value="${esc(x.code)}" placeholder="htn">`)}
    ${field(t('t_name'), `<input id="tp-title" value="${esc(x.title)}">`)}
    ${field(t('t_field'), `<select id="tp-field">${TPL_FIELDS.map(([v, k]) => `<option value="${v}" ${x.field === v ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>`)}
    ${field(t('t_body'), `<textarea id="tp-body" rows="6">${esc(x.body)}</textarea>`)}
    <div class="row">${btn(t('save'), `saveTpl('${id}')`, 'primary')}${btn(t('cancel'), `location.hash='#/templates'`, 'ghost')}</div>`), 'patients');
}
window.saveTpl = id => {
  const code = $('#tp-code').value.trim();
  if (!code) { toast(t('t_code')); return; }
  const base = id === 'new' ? {} : Store.get('visit_templates', id);
  Store.save('visit_templates', { ...base, code, title: $('#tp-title').value.trim(), field: $('#tp-field').value, body: $('#tp-body').value, created_by: App.user.id });
  toast(t('t_saved')); location.hash = '#/templates';
};

/* ============================================================
   PRESCRIPTIONS (e-prescribing + decision support + print)
   ============================================================ */
let Rx = { items: [], patientId: null, visitId: null, warnings: [], overridden: false, phNote: '' };

function vRxNew(patientId, visitId) {
  const p = Store.get('patients', patientId);
  if (!p) { location.hash = '#/patients'; return; }
  Rx = { items: [], patientId, visitId: visitId || null, warnings: [], overridden: false, phNote: '' };
  renderRxForm(p);
}
function renderRxForm(p) {
  const child = p.age != null && p.age !== '' && Number(p.age) < 18;
  const elderly = p.age != null && p.age !== '' && Number(p.age) >= 65;
  layout(`
  ${card(`<div class="card-h"><h3>💊 ${t('rx_new')} — ${esc(p.name)} ${child ? `<span class="tag child">${t('rx_child')}${p.weight_kg ? ' · ' + p.weight_kg + ' ' + t('kg') : ' · ' + t('rx_no_weight')}</span>` : ''}${elderly ? ` <span class="tag amber">👴 ${t('p_elderly')}</span>` : ''}</h3>
    <button class="btn sm ghost" onclick="location.hash='#/patient/${p.id}'">${t('back')}</button></div>
    ${p.allergies ? `<div class="allergy">⚠️ ${t('p_allergy_is')}: ${esc(p.allergies)}</div>` : ''}
    ${p.g6pd ? `<div class="warn-box">🧬 ${t('p_g6pd')}</div>` : ''}
    ${child && !p.weight_kg ? `<div class="warn-box">⚠️ ${t('rx_weight_needed')}
      <button class="btn sm" onclick="askWeight('${p.id}')">${t('rx_ask_weight')}</button></div>` : ''}

    <h4>${t('rx_add')}</h4>
    <div class="searchbar"><input id="rx-search" placeholder="${t('rx_search_ph')}" autocomplete="off"></div>
    <div id="rx-results" class="list"></div>
    <div id="rx-form"></div>

    <h4>${t('rx_list')} (<span id="rx-count">0</span>)</h4>
    <div id="rx-items"></div>
    <div id="rx-warnings"></div>
    <div id="rx-review"></div>
    <div class="row wrap">
      ${btn(t('rx_check'), 'runRxChecks()', 'primary')}
      ${btn(t('rx_save_print'), 'saveRx()')}
    </div>
    <p class="warn-note">${t('adv_note')}</p>`)}
  `, 'patients');
  drawRxItems();
  const si = $('#rx-search');
  si.addEventListener('input', () => { clearTimeout(si._h); si._h = setTimeout(() => rxSearch(si.value), 250); });
}
window.askWeight = pid => {
  openModal(`<h3>⚖️ ${t('rx_weight_title')}</h3>
    ${field(t('p_weight'), `<input id="w-kg" type="number" step="0.1" min="0" inputmode="decimal">`)}
    <div class="row"><button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
    <button class="btn primary" id="w-ok">${t('save')}</button></div>`);
  $('#w-ok').onclick = () => {
    const w = Number($('#w-kg').value);
    if (!w) { toast(t('p_weight')); return; }
    const p = Store.get('patients', pid);
    Store.save('patients', { ...p, weight_kg: w });
    closeModal(); toast(t('p_updated')); renderRxForm(Store.get('patients', pid));
  };
};

function rxSearch(q) {
  q = q.trim().toLowerCase();
  const box = $('#rx-results');
  if (q.length < 2) { box.innerHTML = ''; return; }
  const hits = Store.all('drugs')
    .filter(d => d.generic.toLowerCase().includes(q) || (d.brands || '').toLowerCase().includes(q))
    .slice(0, 12);
  box.innerHTML = hits.map(d => `<button class="p-row drug-hit" data-g="${esc(d.generic)}">
      <div class="grow"><b>${esc(d.generic)}</b><br><small class="muted">${esc(d.brands || '')} · ${esc(d.category || '')}</small></div><span>＋</span></button>`).join('')
    || `<p class="muted">${t('rx_not_found')}</p>`;
  box.querySelectorAll('.drug-hit').forEach(b => b.onclick = () => rxPickDrug(b.dataset.g));
}
function rxPickDrug(generic) {
  const d = drugByGeneric(generic);
  if (!d) return;
  $('#rx-results').innerHTML = '';
  $('#rx-search').value = '';
  const forms = (d.formulations || '').split(';').map(s => s.trim()).filter(Boolean);
  const pedBox = d.ped_flag === 'contra' ? `<div class="warn-box red">${t('rx_ped_contra_box')}</div>`
    : d.ped_flag === 'caution' ? `<div class="warn-box">⚠️ ${esc(d.dose_ped || '')}</div>`
    : (d.ped_flag === 'ok' && d.dose_ped ? `<div class="dose-hint">👶 ${t('rx_ped_dose')}: ${esc(d.dose_ped)}</div>` : '');
  $('#rx-form').innerHTML = card(`
    <div class="card-h"><h4>➕ ${esc(d.generic)}</h4><button class="btn sm ghost" id="rxf-close">${t('rx_close')}</button></div>
    ${pedBox}
    ${d.dose_adult ? `<div class="dose-hint">🧑 ${t('rx_adult_dose')}: ${esc(d.dose_adult)}</div>` : ''}
    ${d.contra ? `<div class="warn-box red">⛔ ${esc(d.contra)}</div>` : ''}
    ${d.precautions ? `<div class="dose-hint">⚠️ ${esc(d.precautions)}</div>` : ''}
    ${d.counsel ? `<div class="dose-hint">🗣️ <b>${t('ph_counsel')}</b><br>${esc(d.counsel)}</div>` : ''}
    ${d.g6pd_risk ? `<div class="dose-hint">🧬 G6PD: <b>${esc(d.g6pd_risk)}</b></div>` : ''}
    ${d.liver ? `<div class="dose-hint">🧪 ${t('p_liver')}: ${esc(d.liver)}</div>` : ''}
    ${field(t('rx_formulation'), `<input id="ri-form" list="ri-forms" value="${esc(forms[0] || '')}"><datalist id="ri-forms">${forms.map(f => `<option value="${esc(f)}">`).join('')}</datalist>`)}
    <div class="grid2">
      ${field(t('rx_dose'), `<input id="ri-dose" type="number" step="any" min="0" placeholder="500" inputmode="decimal">`)}
      ${field(t('rx_unit'), `<select id="ri-unit"><option>mg</option><option>ml</option><option>tablet</option><option>capsule</option><option>units</option><option>drops</option></select>`)}
    </div>
    <div class="grid2">
      ${field(t('rx_freq'), `<select id="ri-freq"><option>BD</option><option>OD</option><option>TDS</option><option>QID</option><option>8 hourly</option><option>6 hourly</option><option>12 hourly</option><option>STAT</option><option>PRN</option><option>weekly</option></select>`)}
      ${field(t('rx_days'), `<input id="ri-days" type="number" min="1" value="5" inputmode="numeric">`)}
    </div>
    <div class="grid2">
      ${field(t('rx_qty'), `<input id="ri-qty" type="number" step="any" min="0" inputmode="decimal">`)}
      ${field(t('rx_price'), `<input id="ri-price" type="number" min="0" value="0" inputmode="numeric">`)}
    </div>
    ${field(t('rx_instructions'), `<input id="ri-ins" placeholder="${t('rx_instructions_ph')}">`)}
    ${field(t('tim_label'), `<select id="ri-tim">${timingOptions(d.timing || 'any')}</select>`)}
    ${btn(t('rx_add_to_list'), 'rxAddItem()', 'primary')}`);
  $('#rxf-close').onclick = () => { $('#rx-form').innerHTML = ''; };
  const dose = $('#ri-dose'), days = $('#ri-days'), qty = $('#ri-qty'), freq = $('#ri-freq');
  const auto = () => { if (dose.value && days.value) qty.value = Math.ceil(freqPerDay(freq.value) * Number(days.value)); };
  [dose, days, freq].forEach(el => el.addEventListener('input', auto)); auto();
  window._rxDrug = d;
}
window.rxAddItem = () => {
  const d = window._rxDrug; if (!d) return;
  Rx.items.push({
    drug_generic: d.generic, formulation: $('#ri-form').value.trim(),
    dose_mg: Number($('#ri-dose').value) || null, dose_unit: $('#ri-unit').value, frequency: $('#ri-freq').value,
    duration_days: Number($('#ri-days').value) || null, qty: Number($('#ri-qty').value) || 0,
    unit_price: Number($('#ri-price').value) || 0, instructions: $('#ri-ins').value.trim(),
    timing: $('#ri-tim').value || 'any'
  });
  $('#rx-form').innerHTML = ''; window._rxDrug = null;
  Rx.overridden = false; drawRxItems(); $('#rx-warnings').innerHTML = '';
  toast(t('rx_added'));
};
function drawRxItems() {
  const box = $('#rx-items'); if (!box) return;
  $('#rx-count').textContent = Rx.items.length;
  box.innerHTML = Rx.items.map((it, i) => `
    <div class="rx-item"><div class="grow"><b>${esc(it.drug_generic)}</b> <span class="tag">${freqShort(it.frequency)}</span> ${esc(it.formulation)}<br>
      <small class="muted">${it.dose_mg ? it.dose_mg + ' ' + esc(it.dose_unit) : ''} ${esc(it.frequency)} ${it.duration_days ? '× ' + it.duration_days : ''} · ${it.qty} · ${mmk(it.qty * it.unit_price)}</small><br>
      <small>⏱️ <select onchange="rxSetTiming(${i}, this.value)" aria-label="${t('tim_label')}">${timingOptions(it.timing)}</select></small>
      ${it.instructions ? `<br><small>📝 ${esc(it.instructions)}</small>` : ''}</div>
      <button class="btn sm danger ghost" onclick="rxDelItem(${i})">✕</button></div>`).join('')
    || `<p class="muted">${t('p_none')}</p>`;
}
window.rxDelItem = i => { Rx.items.splice(i, 1); Rx.overridden = false; drawRxItems(); $('#rx-warnings').innerHTML = ''; const r = $('#rx-review'); if (r) r.innerHTML = ''; };
window.rxSetTiming = (i, val) => { if (Rx.items[i]) { Rx.items[i].timing = val; Rx.overridden = false; } };
window.rxAutoTiming = () => {
  Rx.items.forEach(it => { const d = drugByGeneric(it.drug_generic); if (d && d.timing) it.timing = d.timing; });
  drawRxItems();
  const p = Store.get('patients', Rx.patientId);
  if (p) renderReview(p, Rx.items);
  toast(t('rx_added'));
};

window.runRxChecks = () => {
  const p = Store.get('patients', Rx.patientId);
  if (!Rx.items.length) { toast(t('rx_need_items')); return; }
  Rx.warnings = runChecks(p, Rx.items);
  Rx.overridden = false;
  const box = $('#rx-warnings');
  if (!Rx.warnings.length) { box.innerHTML = `<div class="ok-box">${t('rx_no_warn')}</div>`; }
  else {
    const reds = Rx.warnings.filter(w => w.level === 'red').length;
    box.innerHTML = `<div class="warn-list">
      <h4>⚠️ ${t('rx_warnings')} (${Rx.warnings.length}) ${reds ? `<span class="tag red">${reds} 🔴</span>` : ''}</h4>
      ${Rx.warnings.map(warnHtml).join('')}
      <label class="chk ack"><input type="checkbox" id="rx-ack"> ${t('rx_ack')}</label>
    </div>`;
    $('#rx-ack').addEventListener('change', e => { Rx.overridden = e.target.checked; });
  }
  renderReview(p, Rx.items);
};

/* v3: PHARMACIST REVIEW PANEL — advisory re-verification, duplicates,
   food-timing auto-fill, counseling points, pharmacist note. Never blocks. */
function renderReview(p, items) {
  const box = $('#rx-review'); if (!box) return;
  const child = p.age != null && p.age !== '' && Number(p.age) < 18;
  const weight = p.weight_kg ? Number(p.weight_kg) : null;
  const dups = dupTherapyWarnings(items);
  const cards = items.map((it, i) => {
    const d = drugByGeneric(it.drug_generic);
    const bits = [];
    if (d) {
      if (child && weight && it.dose_mg) bits.push(`⚖️ ${(Number(it.dose_mg) / weight).toFixed(2)} mg/kg/${freqShort(it.frequency)}`);
      if (p.renal_issue && d.dose_renal) bits.push(`🫘 ${d.dose_renal}`);
      if (d.liver && norm(p.liver_issue || 'none') !== 'none') bits.push(`🧪 ${d.liver}`);
      if (d.g6pd_risk && p.g6pd) bits.push(`🧬 G6PD ${d.g6pd_risk}`);
      if (p.heart_failure && d.contra) bits.push(`❤️ ${t('p_hf')}: ${d.contra.slice(0, 120)}`);
    }
    return `<div class="sec"><b>${i + 1}. ${esc(it.drug_generic)}</b> <span class="tag">${freqShort(it.frequency)}</span> <small class="muted">⏱️ ${esc(timingLabel(it.timing))}</small><br>
      <small>${bits.length ? bits.map(b => esc(b)).join('<br>') : esc(t('ph_std'))}</small>
      ${d && d.counsel ? `<br><small>🗣️ ${esc(d.counsel)}</small>` : ''}</div>`;
  }).join('');
  box.innerHTML = card(`<div class="card-h"><h4>💊 ${t('ph_title')}</h4></div>
    <p class="muted"><small>${esc(t('disc2'))}</small></p>
    ${cards}
    ${dups.length ? `<div class="warn-list"><h4>${t('ph_dup')}</h4>${dups.map(warnHtml).join('')}</div>` : ''}
    <div class="row wrap">${btn(t('rx_autofill_timing'), 'rxAutoTiming()')}</div>
    ${field(t('ph_note'), `<textarea id="rx-phnote" rows="2" placeholder="${t('ph_note_ph')}" oninput="Rx.phNote=this.value">${esc(Rx.phNote || '')}</textarea>`)}`);
}

window.saveRx = () => {
  if (!Rx.items.length) { toast(t('rx_need_items')); return; }
  if (Rx.warnings.length && !Rx.overridden) {
    toast(t('rx_need_check'));
    $('#rx-warnings').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const rx = Store.save('prescriptions', {
    patient_id: Rx.patientId, visit_id: Rx.visitId, presc_date: todayStr(),
    warnings_overridden: Rx.overridden ? Rx.warnings : [],
    pharmacist_note: ($('#rx-phnote') ? $('#rx-phnote').value.trim() : '') || Rx.phNote || '',
    created_by: App.user.id
  });
  for (const it of Rx.items) {
    const pi = Store.save('prescription_items', { ...it, prescription_id: rx.id });
    Store.save('dispensing_log', {
      prescription_item_id: pi.id, patient_id: Rx.patientId, drug_generic: it.drug_generic,
      qty: it.qty, unit_price: it.unit_price, total: (it.qty || 0) * (it.unit_price || 0),
      dispensed_date: todayStr(), source: 'auto', note: t('dsp_auto'), created_by: App.user.id
    });
  }
  toast(t('rx_saved'));
  location.hash = '#/rx/' + rx.id + '/print';
};

function vRxDetail(id) {
  const rx = Store.get('prescriptions', id);
  if (!rx) { location.hash = '#/patients'; return; }
  const p = Store.get('patients', rx.patient_id);
  const items = Store.by('prescription_items', i => i.prescription_id === id);
  layout(card(`<div class="card-h"><h3>💊 ${t('rx_detail')} — ${fmtDate(rx.presc_date)}</h3>
    <div class="row">${btn('🖨️', `location.hash='#/rx/${id}/print'`, 'sm')}
    ${App.isDoctor ? btn('🗑️', `delRx('${id}')`, 'sm danger ghost') : ''}</div></div>
    <p><b>${t('rx_patient')}:</b> <a class="link" href="#/patient/${rx.patient_id}">${p ? esc(p.name) : '—'}</a></p>
    ${items.map(it => `<div class="rx-item"><div class="grow"><b>${esc(it.drug_generic)}</b> <span class="tag">${freqShort(it.frequency)}</span> ${esc(it.formulation)}<br>
      <small class="muted">${it.dose_mg ? it.dose_mg + ' ' + esc(it.dose_unit) : ''} ${esc(it.frequency)} ${it.duration_days ? '× ' + it.duration_days : ''} · ${it.qty} · ⏱️ ${esc(timingLabel(it.timing))}</small></div></div>`).join('')}
    ${rx.pharmacist_note ? `<div class="sec"><b>💊 ${t('ph_note')}</b><p>${nl2br(rx.pharmacist_note)}</p></div>` : ''}
    ${rx.warnings_overridden && rx.warnings_overridden.length ? `<div class="warn-box">⚠️ ${t('rx_overridden', rx.warnings_overridden.length)}</div>` : ''}
  `), 'patients');
}
window.delRx = async id => {
  if (!App.isDoctor) return;
  if (await confirmDlg(t('rx_del_confirm'))) { Store.del('prescriptions', id); toast(t('rx_deleted')); history.back(); }
};

function vRxPrint(id) {
  const rx = Store.get('prescriptions', id);
  if (!rx) { location.hash = '#/patients'; return; }
  const p = Store.get('patients', rx.patient_id);
  const items = Store.by('prescription_items', i => i.prescription_id === id);
  const cfg = App.cfg;
  const sexLbl = p && p.sex === 'male' ? t('p_male') : p && p.sex === 'female' ? t('p_female') : '';
  document.getElementById('app').innerHTML = `
  <div class="print-sheet">
    <div class="print-head">
      <h2>${esc(cfg.clinicName || t('appName'))}</h2>
      <p>${esc(cfg.doctorName || (App.profile ? App.profile.name : ''))}</p>
    </div>
    <div class="print-meta">
      <div><b>${t('p_name').replace(' *', '')}:</b> ${p ? esc(p.name) : ''} &nbsp; <b>${t('p_age')}:</b> ${p && p.age != null ? p.age : ''} &nbsp; <b>${t('p_sex')}:</b> ${sexLbl}</div>
      <div><b>${t('v_date')}:</b> ${fmtDate(rx.presc_date)}</div>
    </div>
    <div class="rx-symbol">℞</div>
    <table class="print-table">
      <tr><th>${t('rx_no')}</th><th>${t('rx_drug')}</th><th>${t('rx_form')}</th><th>${t('rx_amount')}</th><th>${t('rx_times')}</th><th>${t('rx_dayn')}</th><th>${t('rx_how')}</th></tr>
      ${items.map((it, i) => `<tr><td>${i + 1}</td><td>${esc(it.drug_generic)}</td><td>${esc(it.formulation)}</td>
        <td>${it.dose_mg ? it.dose_mg + ' ' + esc(it.dose_unit) : ''}</td><td>${freqShort(it.frequency)}</td>
        <td>${it.duration_days || ''}</td><td>${esc(it.instructions)}${it.timing && it.timing !== 'any' ? `<br><small>⏱️ ${esc(timingLabel(it.timing))}</small>` : ''}</td></tr>`).join('')}
    </table>
    ${rx.pharmacist_note ? `<p><b>💊 ${t('ph_note')}:</b> ${esc(rx.pharmacist_note)}</p>` : ''}
    <div class="print-sign"><div>${t('rx_print_title')}<br><br>_______________</div></div>
    <p class="print-disc">${t('rx_print_note')}</p>
    <div class="no-print row center">
      ${btn('🖨️ ' + t('print'), 'window.print()', 'primary')}
      ${btn(t('back'), `location.hash='#/rx/${id}'`, 'ghost')}
    </div>
  </div>`;
  window.scrollTo(0, 0);
}

/* ============================================================
   DRUGS
   ============================================================ */
let drugQuery = '';
let drugShown = 100;
function vDrugs() {
  const q = drugQuery.trim().toLowerCase();
  let list = Store.all('drugs').sort((a, b) => a.generic.localeCompare(b.generic));
  if (q) list = list.filter(d => d.generic.toLowerCase().includes(q) || (d.brands || '').toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q));
  const total = list.length;
  const shown = list.slice(0, drugShown);
  const lay = (typeof isGuest === 'function' && isGuest()) ? guestLayout : layout;
  lay(`
    <div class="searchbar"><input id="dq" placeholder="${t('dr_search_ph')}" value="${esc(drugQuery)}"></div>
    <div class="row wrap">
      ${App.isDoctor ? btn('＋ ' + t('dr_new'), `location.hash='#/drug/new'`, 'primary') : ''}
      ${App.isDoctor ? btn(t('dr_import'), `$('#csv-file').click()`, 'ghost') : ''}
      <input type="file" id="csv-file" accept=".csv" hidden>
    </div>
    <p class="muted"><small>💊 ${t('dr_count', total)}</small></p>
    ${App.isDoctor ? '' : `<p class="muted"><small>ℹ️ ${t('dr_hint_doc')}</small></p>`}
    <div class="list">
      ${shown.map(d => `
        <a class="p-row" href="#/drug/${d.id}">
          <div class="grow"><b>${esc(d.generic)}</b><br>
          <small class="muted">${esc((d.brands || '').slice(0, 60))} · ${esc(d.category || '')}</small></div>
          <span class="tag ${d.ped_flag === 'contra' ? 'red' : d.ped_flag === 'caution' ? 'amber' : d.ped_flag === 'no_data' ? '' : 'green'}">${t('ped_' + (d.ped_flag || 'no_data'))}</span>
          <span>›</span></a>`).join('') || `<p class="muted center">${t('dr_none')}</p>`}
    </div>
    ${total > drugShown ? `<div class="center" style="margin:12px 0"><button class="btn ghost" id="dr-more">${t('dr_show_more', total - drugShown)}</button></div>` : ''}` , 'drugs');
  const inp = $('#dq');
  inp.addEventListener('input', () => { drugQuery = inp.value; drugShown = 100; clearTimeout(inp._h); inp._h = setTimeout(() => { const pos = inp.selectionStart; vDrugs(); const n = $('#dq'); n.focus(); n.setSelectionRange(pos, pos); }, 350); });
  const more = $('#dr-more');
  if (more) more.onclick = () => { drugShown += 100; vDrugs(); };
  const cf = $('#csv-file');
  if (cf) cf.addEventListener('change', importCsv);
}
function importCsv(e) {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const lines = String(rd.result).split(/\r?\n/).filter(x => x.trim());
    if (lines.length < 2) { toast(t('dr_import_done', 0)); return; }
    const head = lines[0].split(',').map(h => h.trim().toLowerCase());
    let n = 0;
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map(c => c.trim());
      const g = (idx => cells[head.indexOf(idx)] || '')('generic');
      if (!g) continue;
      const num = k => { const v = cells[head.indexOf(k)]; return v === '' || v == null ? null : Number(v); };
      const get = k => cells[head.indexOf(k)] || '';
      const ex = Store.all('drugs').find(d => d.generic.toLowerCase() === g.toLowerCase());
      Store.save('drugs', {
        ...(ex || {}), generic: g, brands: get('brands'), formulations: get('formulations'),
        category: get('category'), indications: get('indications'), dose_adult: get('dose_adult'),
        dose_ped: get('dose_ped'), ped_flag: get('ped_flag') || 'no_data',
        ped_mgkg: num('ped_mgkg'), ped_mgkg_max: num('ped_mgkg_max'),
        ped_daymax_mgkg: num('ped_daymax_mgkg'), ped_cap_mg: num('ped_cap_mg'), ped_freq: get('ped_freq'),
        dose_renal: get('dose_renal'), ci: get('ci'), allergy: get('allergy'),
        contra: get('contra'), precautions: get('precautions'),
        liver: get('liver'), g6pd_risk: get('g6pd_risk'), timing: get('timing'), counsel: get('counsel'),
        contra_keys: (get('contra_keys') || '').split(';').map(s => s.trim().toLowerCase()).filter(Boolean),
        preg: get('preg'), mon: get('mon'), custom: true, created_by: App.user.id
      });
      n++;
    }
    toast(t('dr_import_done', n)); route();
  };
  rd.readAsText(f);
}

function vDrugDetail(id) {
  const d = Store.get('drugs', id);
  if (!d) { location.hash = '#/drugs'; return; }
  const secs = [[t('dr_brands'), d.brands], [t('dr_forms'), d.formulations], [t('dr_ind'), d.indications],
    [t('dr_dose_adult'), d.dose_adult], [t('dr_dose_ped'), d.dose_ped + (d.ped_freq ? ' (' + d.ped_freq + ')' : '')],
    [t('dr_dose_renal'), d.dose_renal], [t('dr_ci'), d.ci], [t('dr_allergy'), d.allergy],
    [t('dr_preg'), d.preg], [t('dr_mon'), d.mon]];
  const inter = Array.isArray(d.interactions) ? d.interactions : [];
  const lay2 = (typeof isGuest === 'function' && isGuest()) ? guestLayout : layout;
  lay2(card(`<div class="card-h"><h3>💊 ${esc(d.generic)}</h3>
    <div class="row">${App.isDoctor ? btn(t('edit'), `location.hash='#/drug/${id}/edit'`, 'sm ghost') : ''}
    ${App.isDoctor ? btn(t('delete'), `delDrug('${id}')`, 'sm danger ghost') : ''}</div></div>
    <p><span class="tag">${esc(d.category || '')}</span>
    <span class="tag ${d.ped_flag === 'contra' ? 'red' : d.ped_flag === 'caution' ? 'amber' : d.ped_flag === 'no_data' ? '' : 'green'}">${t('dr_ped_flag')}: ${t('ped_' + (d.ped_flag || 'no_data'))}</span></p>
    ${d.contra ? `<div class="warn-box red"><b>⛔ ${t('dr_contra')}</b><br>${nl2br(d.contra)}</div>` : ''}
    ${d.precautions ? `<div class="warn-box"><b>⚠️ ${t('dr_prec')}</b><br>${nl2br(d.precautions)}</div>` : ''}
    ${d.g6pd_risk ? `<div class="warn-box"><b>🧬 G6PD: ${esc(d.g6pd_risk)}</b></div>` : ''}
    ${d.liver ? `<div class="warn-box"><b>🧪 ${t('p_liver')}</b><br>${nl2br(d.liver)}</div>` : ''}
    ${d.timing && d.timing !== 'any' ? `<div class="dose-hint">⏱️ ${t('tim_label')}: ${esc(timingLabel(d.timing))}</div>` : ''}
    ${d.counsel ? `<div class="dose-hint">🗣️ <b>${t('ph_counsel')}</b><br>${nl2br(d.counsel)}</div>` : ''}
    ${secs.map(([x, y]) => y ? `<div class="sec"><b>${x}</b><p>${nl2br(y)}</p></div>` : '').join('')}
    ${inter.length ? `<div class="sec"><b>${t('dr_inter')}</b>${inter.map(([g2, s2, n2]) =>
      `<div class="warn ${s2 === 'major' ? 'red' : 'amber'}"><b>${esc(g2)} (${esc(s2)})</b><br><small>${esc(n2 || '')}</small></div>`).join('')}</div>` : ''}
  `), 'drugs');
}
window.delDrug = async id => { if (!App.isDoctor) return; if (await confirmDlg(t('dr_del_confirm'))) { Store.del('drugs', id); toast(t('dr_deleted')); location.hash = '#/drugs'; } };

function vDrugForm(id) {
  if (!App.isDoctor) { location.hash = '#/drugs'; return; }
  const d = id === 'new' ? {} : Store.get('drugs', id);
  if (!d) { location.hash = '#/drugs'; return; }
  const interTxt = (Array.isArray(d.interactions) ? d.interactions : []).map(x => x.join(' | ')).join('\n');
  layout(card(`<div class="card-h"><h3>${id === 'new' ? '＋' : '✏️'} ${t('dr_title')}</h3></div>
    ${field(t('p_name').replace(' *', '') + ' (Generic) *', `<input id="dg-g" value="${esc(d.generic || '')}" ${id === 'new' ? '' : 'disabled'}>`)}
    ${field(t('dr_brands'), `<input id="dg-b" value="${esc(d.brands || '')}">`)}
    ${field(t('dr_forms'), `<input id="dg-f" value="${esc(d.formulations || '')}">`)}
    ${field(t('dr_category'), `<input id="dg-cat" value="${esc(d.category || '')}">`)}
    ${field(t('dr_ind'), `<textarea id="dg-ind" rows="2">${esc(d.indications || '')}</textarea>`)}
    ${field(t('dr_dose_adult'), `<textarea id="dg-da" rows="2">${esc(d.dose_adult || '')}</textarea>`)}
    <div class="grid2">
      ${field(t('dr_ped_flag'), `<select id="dg-pf">
        ${['ok', 'caution', 'contra', 'no_data'].map(f => `<option value="${f}" ${d.ped_flag === f ? 'selected' : ''}>${t('ped_' + f)}</option>`).join('')}</select>`)}
      ${field(t('rx_freq'), `<input id="dg-pfreq" value="${esc(d.ped_freq || '')}">`)}
    </div>
    ${field(t('dr_dose_ped'), `<textarea id="dg-dp" rows="3">${esc(d.dose_ped || '')}</textarea>`)}
    <div class="grid2">
      ${field('mg/kg/' + t('rx_dose'), `<input id="dg-mgkg" type="number" step="any" value="${d.ped_mgkg ?? ''}">`)}
      ${field('max mg/kg/' + t('rx_dose'), `<input id="dg-mgkgmax" type="number" step="any" value="${d.ped_mgkg_max ?? ''}">`)}
    </div>
    <div class="grid2">
      ${field('max mg/kg/day', `<input id="dg-daymax" type="number" step="any" value="${d.ped_daymax_mgkg ?? ''}">`)}
      ${field('max mg/' + t('rx_dose'), `<input id="dg-cap" type="number" step="any" value="${d.ped_cap_mg ?? ''}">`)}
    </div>
    ${field(t('dr_dose_renal'), `<textarea id="dg-dr" rows="2">${esc(d.dose_renal || '')}</textarea>`)}
    ${field(t('dr_ci'), `<textarea id="dg-ci" rows="2">${esc(d.ci || '')}</textarea>`)}
    ${field(t('dr_contra'), `<textarea id="dg-contra" rows="3">${esc(d.contra || '')}</textarea>`)}
    ${field(t('dr_contra_keys'), `<input id="dg-ckeys" value="${esc((Array.isArray(d.contra_keys) ? d.contra_keys : []).join('; '))}">`)}
    ${field(t('dr_prec'), `<textarea id="dg-prec" rows="3">${esc(d.precautions || '')}</textarea>`)}
    ${field('🧪 ' + t('p_liver'), `<textarea id="dg-liver" rows="2">${esc(d.liver || '')}</textarea>`)}
    <div class="grid2">
      ${field('🧬 G6PD risk', `<select id="dg-g6pd"><option value="">—</option>
        ${['high', 'possible'].map(v2 => `<option value="${v2}" ${d.g6pd_risk === v2 ? 'selected' : ''}>${v2}</option>`).join('')}</select>`)}
      ${field('⏱️ ' + t('tim_label'), `<select id="dg-tim">${timingOptions(d.timing || 'any')}</select>`)}
    </div>
    ${field('🗣️ ' + t('ph_counsel'), `<textarea id="dg-coun" rows="3">${esc(d.counsel || '')}</textarea>`)}
    ${field(t('dr_inter'), `<textarea id="dg-inter" rows="3" placeholder="${t('dr_inter_hint')}">${esc(interTxt)}</textarea>`)}
    ${field(t('dr_allergy'), `<textarea id="dg-alg" rows="2">${esc(d.allergy || '')}</textarea>`)}
    ${field(t('dr_preg'), `<textarea id="dg-preg" rows="2">${esc(d.preg || '')}</textarea>`)}
    ${field(t('dr_mon'), `<textarea id="dg-mon" rows="2">${esc(d.mon || '')}</textarea>`)}
    <div class="row">${btn(t('save'), `saveDrug('${id}')`, 'primary')}${btn(t('cancel'), `location.hash='#/drugs'`, 'ghost')}</div>`), 'drugs');
}
window.saveDrug = id => {
  if (!App.isDoctor) return;
  const g = $('#dg-g').value.trim();
  if (!g) { toast(t('p_need_name')); return; }
  const num = x => { const v = $(x).value.trim(); return v === '' ? null : Number(v); };
  const inter = $('#dg-inter').value.split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => { const [a, b, ...c] = l.split('|').map(s => s.trim()); return [a || '', b || 'moderate', c.join(' | ')]; });
  const base = id === 'new' ? {} : Store.get('drugs', id);
  Store.save('drugs', { ...base,
    generic: g, brands: $('#dg-b').value.trim(), formulations: $('#dg-f').value.trim(),
    category: $('#dg-cat').value.trim(), indications: $('#dg-ind').value.trim(),
    dose_adult: $('#dg-da').value.trim(), dose_ped: $('#dg-dp').value.trim(),
    ped_flag: $('#dg-pf').value, ped_freq: $('#dg-pfreq').value.trim(),
    ped_mgkg: num('#dg-mgkg'), ped_mgkg_max: num('#dg-mgkgmax'),
    ped_daymax_mgkg: num('#dg-daymax'), ped_cap_mg: num('#dg-cap'),
    dose_renal: $('#dg-dr').value.trim(), ci: $('#dg-ci').value.trim(),
    contra: $('#dg-contra').value.trim(),
    contra_keys: $('#dg-ckeys').value.split(';').map(s => s.trim().toLowerCase()).filter(Boolean),
    precautions: $('#dg-prec').value.trim(),
    liver: $('#dg-liver').value.trim(), g6pd_risk: $('#dg-g6pd').value || '',
    timing: $('#dg-tim').value || 'any', counsel: $('#dg-coun').value.trim(),
    interactions: inter, allergy: $('#dg-alg').value.trim(),
    preg: $('#dg-preg').value.trim(), mon: $('#dg-mon').value.trim(),
    custom: true, created_by: App.user.id });
  toast(t('dr_saved')); location.hash = '#/drugs';
};

/* ============================================================
   FOLLOW-UPS
   ============================================================ */
function vFollowups() {
  const dt = todayStr();
  const groups = [
    [t('fu_overdue') + ' 🔴', Store.by('followups', f => !f.done && f.due_date < dt).sort((a, b) => a.due_date.localeCompare(b.due_date)), true],
    [t('fu_today') + ' ⏰', Store.by('followups', f => !f.done && f.due_date === dt), false],
    [t('fu_upcoming') + ' 📅', Store.by('followups', f => !f.done && f.due_date > dt).sort((a, b) => a.due_date.localeCompare(b.due_date)), false],
  ];
  const pname = id => { const p = Store.get('patients', id); return p ? esc(p.name) : '—'; };
  layout(groups.map(([title, list, od]) => card(
    `<div class="card-h"><h3>${title} (${list.length})</h3></div>
     ${list.slice(0, 50).map(f => fuRow(f, pname, od)).join('') || `<p class="muted">${t('fu_none')}</p>`}`
  ).join('')), 'followups');
}

/* ============================================================
   ANALYTICS + DISPENSING
   ============================================================ */
let anRange = 30;
function vAnalytics() {
  const logs = Store.all('dispensing_log');
  const cutoff = anRange === 'all' ? null : new Date(Date.now() - anRange * 864e5).toISOString().slice(0, 10);
  const flt = cutoff ? logs.filter(l => (l.dispensed_date || '') >= cutoff) : logs;
  const byQty = {}, byRev = {};
  for (const l of flt) {
    byQty[l.drug_generic] = (byQty[l.drug_generic] || 0) + (Number(l.qty) || 0);
    byRev[l.drug_generic] = (byRev[l.drug_generic] || 0) + (Number(l.total) || 0);
  }
  const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
  const maxQ = Math.max(1, ...top(byQty, 8).map(x => x[1]));
  const maxR = Math.max(1, ...top(byRev, 8).map(x => x[1]));
  const bar = (label, v, max, suffix) => `
    <div class="bar-row"><span class="bar-label">${esc(label)}</span>
      <div class="bar-track"><div class="bar" style="width:${Math.round(v / max * 100)}%"></div></div>
      <span class="bar-val">${suffix === 'mmk' ? mmk(v) : v}</span></div>`;

  // by diagnosis → drug categories
  const dxCat = {};
  for (const rx of Store.all('prescriptions')) {
    const v = rx.visit_id ? Store.get('visits', rx.visit_id) : null;
    const dx = v && v.diagnosis ? v.diagnosis.trim().toLowerCase().slice(0, 40) : null;
    if (!dx) continue;
    for (const it of Store.by('prescription_items', i => i.prescription_id === rx.id)) {
      const d = drugByGeneric(it.drug_generic);
      const cat = d ? (d.category || '?') : '?';
      dxCat[dx] = dxCat[dx] || {};
      dxCat[dx][cat] = (dxCat[dx][cat] || 0) + 1;
    }
  }
  const dxTop = Object.entries(dxCat).sort((a, b) => Object.values(b[1]).reduce((x, y) => x + y, 0) - Object.values(a[1]).reduce((x, y) => x + y, 0)).slice(0, 6);

  // 14-day trend
  const days = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); days.push(d); }
  const perDay = days.map(d => flt.filter(l => (l.dispensed_date || '').slice(0, 10) === d).reduce((s, l) => s + (Number(l.total) || 0), 0));
  const maxD = Math.max(1, ...perDay);

  layout(`
    <div class="row">
      <button class="btn sm ${anRange === 30 ? 'primary' : 'ghost'}" onclick="setAnRange(30)">${t('an_30')}</button>
      <button class="btn sm ${anRange === 'all' ? 'primary' : 'ghost'}" onclick="setAnRange('all')">${t('an_all')}</button>
      ${btn('📋 ' + t('dsp_title'), `location.hash='#/dispensing'`, 'sm ghost')}
      ${btn('💰 ' + t('b_title'), `location.hash='#/billing'`, 'sm ghost')}
    </div>
    ${card(`<h3>📊 ${t('an_top_qty')}</h3><div class="bars">
      ${top(byQty, 8).map(([g, v]) => bar(g, v, maxQ)).join('') || `<p class="muted">${t('an_none')}</p>`}</div>`)}
    ${card(`<h3>💰 ${t('an_top_rev')}</h3><div class="bars">
      ${top(byRev, 8).map(([g, v]) => bar(g, v, maxR, 'mmk')).join('') || `<p class="muted">${t('an_none')}</p>`}</div>`)}
    ${card(`<h3>🩺 ${t('an_by_dx')}</h3>
      ${dxTop.map(([dx, cats]) => `<div class="sec"><b>${esc(dx)}</b><br><small class="muted">${
        Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c2, n2]) => `${esc(c2)} (${n2})`).join(' · ')
      }</small></div>`).join('') || `<p class="muted">${t('an_none')}</p>`}`)}
    ${card(`<h3>📈 ${t('an_trend')}</h3><div class="bars">
      ${days.map((d, i) => bar(fmtDate(d), perDay[i], maxD, 'mmk')).join('')}</div>`)}
  `, 'analytics');
}
window.setAnRange = r => { anRange = r; vAnalytics(); };

function vDispensing() {
  const logs = Store.all('dispensing_log').sort((a, b) => (b.dispensed_date || '').localeCompare(a.dispensed_date || '')).slice(0, 150);
  const pname = id => { const p = Store.get('patients', id); return p ? esc(p.name) : '—'; };
  layout(`
    <div class="row">${btn('＋ ' + t('dsp_new'), `location.hash='#/dispensing/new'`, 'primary')}
    <button class="btn ghost" onclick="location.hash='#/analytics'">${t('back')}</button></div>
    ${logs.map(l => `<div class="p-row"><div class="grow"><b>${esc(l.drug_generic)}</b> × ${l.qty}<br>
      <small class="muted">${fmtDate(l.dispensed_date)} · ${pname(l.patient_id)} · ${mmk(l.total)} ${l.source === 'auto' ? '· 🤖' : ''}</small></div>
      <button class="btn sm ghost" onclick="location.hash='#/dispensing/${l.id}/edit'">${t('edit')}</button>
      ${App.isDoctor ? `<button class="btn sm danger ghost" onclick="delDsp('${l.id}')">✕</button>` : ''}</div>`).join('')
      || `<p class="muted center">${t('dsp_none')}</p>`}
  `, 'analytics');
}
window.delDsp = async id => { if (!App.isDoctor) return; if (await confirmDlg(t('dsp_del_confirm'))) { Store.del('dispensing_log', id); toast(t('dsp_deleted')); route(); } };
function vDispensingForm(id) {
  const l = id === 'new' ? { drug_generic: '', qty: 1, unit_price: 0, dispensed_date: todayStr(), note: '' } : Store.get('dispensing_log', id);
  if (!l) { location.hash = '#/dispensing'; return; }
  layout(card(`<div class="card-h"><h3>${id === 'new' ? '＋' : '✏️'} ${t('dsp_title')}</h3></div>
    ${field(t('dsp_drug'), `<input id="dp-drug" list="dp-drugs" value="${esc(l.drug_generic)}"><datalist id="dp-drugs">${Store.all('drugs').map(d => `<option value="${esc(d.generic)}">`).join('')}</datalist>`)}
    <div class="grid2">
      ${field(t('dsp_qty'), `<input id="dp-qty" type="number" step="any" value="${l.qty}" inputmode="decimal">`)}
      ${field(t('dsp_price'), `<input id="dp-price" type="number" value="${l.unit_price}" inputmode="numeric">`)}
    </div>
    ${field(t('dsp_date'), `<input id="dp-date" type="date" value="${(l.dispensed_date || '').slice(0, 10)}">`)}
    ${field(t('dsp_note'), `<input id="dp-note" value="${esc(l.note || '')}">`)}
    <div class="row">${btn(t('save'), `saveDsp('${id}')`, 'primary')}${btn(t('cancel'), `location.hash='#/dispensing'`, 'ghost')}</div>`), 'analytics');
}
window.saveDsp = id => {
  const base = id === 'new' ? { source: 'manual', created_by: App.user.id } : Store.get('dispensing_log', id);
  const qty = Number($('#dp-qty').value) || 0, price = Number($('#dp-price').value) || 0;
  Store.save('dispensing_log', { ...base, drug_generic: $('#dp-drug').value.trim(), qty, unit_price: price,
    total: qty * price, dispensed_date: $('#dp-date').value || todayStr(), note: $('#dp-note').value.trim() });
  toast(t('dsp_saved')); location.hash = '#/dispensing';
};

/* ============================================================
   BILLING
   ============================================================ */
let billMonth = todayStr().slice(0, 7);
function vBilling() {
  const vs = Store.by('visits', v => (v.visit_date || '').slice(0, 7) === billMonth)
    .sort((a, b) => (b.visit_date || '').localeCompare(a.visit_date || ''));
  const tc = vs.reduce((s, v) => s + (Number(v.fee_consult) || 0), 0);
  const tm = vs.reduce((s, v) => s + (Number(v.fee_medicine) || 0), 0);
  const byDay = {};
  for (const v of vs) {
    const d = (v.visit_date || '').slice(0, 10);
    byDay[d] = byDay[d] || { n: 0, c: 0, m: 0 };
    byDay[d].n++; byDay[d].c += Number(v.fee_consult) || 0; byDay[d].m += Number(v.fee_medicine) || 0;
  }
  layout(`
    ${field(t('b_pick_month'), `<input type="month" id="bm" value="${billMonth}">`)}
    <div class="stats">
      <div class="stat"><b>${vs.length}</b><span>${t('b_visits')}</span></div>
      <div class="stat"><b>${(tc / 1000).toFixed(0)}k</b><span>${t('b_consult')}</span></div>
      <div class="stat"><b>${(tm / 1000).toFixed(0)}k</b><span>${t('b_medicine')}</span></div>
    </div>
    ${card(`<div class="card-h"><h3>💰 ${t('b_total')}: ${mmk(tc + tm)}</h3></div>
      <table class="tbl"><tr><th>${t('v_date')}</th><th>${t('b_visits')}</th><th>${t('b_consult')}</th><th>${t('b_medicine')}</th><th>${t('b_total')}</th></tr>
      ${Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).map(([d, x]) =>
        `<tr><td>${fmtDate(d)}</td><td>${x.n}</td><td>${mmk(x.c)}</td><td>${mmk(x.m)}</td><td><b>${mmk(x.c + x.m)}</b></td></tr>`).join('')
        || `<tr><td colspan="5" class="muted center">${t('b_none')}</td></tr>`}</table>`)}
  `, 'analytics');
  $('#bm').addEventListener('change', e => { billMonth = e.target.value; vBilling(); });
}

/* ============================================================
   v3: GUEST MODE — view-only screens (login skipped entirely)
   ============================================================ */
function guestLayout(content, active) {
  const tabs = [
    ['#/drugs', '💊', t('nav_drugs'), 'drugs'],
    ['#/kb', '🔬', t('nav_kb'), 'kb'],
  ];
  $('#app').innerHTML = `
    <div style="background:#0b6e63;color:#fff;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;position:sticky;top:0;z-index:20">
      <b>${t('g_banner')}</b>
      <button class="btn sm" onclick="showUpgrade()">${t('g_unlock')}</button>
    </div>
    <header class="appbar">
      <div class="brand"><div class="logo">⚕️</div>
        <div><h1>${esc(App.cfg.clinicName || t('appName'))}</h1><p>${t('tagline')}</p></div>
      </div>
      <div class="hbar">${langToggle()}</div>
    </header>
    <main id="view">${content}</main>
    <nav class="tabbar">${tabs.map(([h, ic, lb, k]) =>
      `<a href="${h}" class="${active === k ? 'on' : ''}"><span>${ic}</span><small>${lb}</small></a>`).join('')}
    </nav>
    <footer class="disclaimer">${t('disc')}</footer>`;
}

/* welcome gate: shown on boot when the app was never set up */
function vWelcome() {
  bareLayout(`
    <div class="card center" style="margin-top:24px">
      <div style="font-size:48px">⚕️</div>
      <h2>${t('g_welcome_title')}</h2>
      <p class="muted">${t('g_welcome_sub')}</p>
      <div style="display:grid;gap:12px;margin-top:16px">
        <button class="btn primary" style="padding:18px;font-size:18px" onclick="enterGuest()">${t('g_btn_guest')}</button>
        <button class="btn" style="padding:18px;font-size:18px" onclick="askFullVersion()">${t('g_btn_full')}</button>
      </div>
    </div>`);
}
window.enterGuest = () => {
  localStorage.setItem('clinic_guest_v1', '1');
  location.hash = '#/guest';
};
window.askFullVersion = () => {
  openModal(`<h3>🔓 ${t('g_upgrade_title')}</h3>
    <p class="muted"><small>${t('g_upgrade_d')}</small></p>
    ${field(t('g_password'), `<input id="up-pass" type="password" autocomplete="off">`)}
    <div class="row"><button class="btn ghost" onclick="closeModal()">${t('cancel')}</button>
    <button class="btn primary" id="up-ok">${t('confirm')}</button></div>`);
  $('#up-ok').onclick = () => {
    if ($('#up-pass').value === GUEST_PASS) {
      localStorage.setItem('clinic_unlocked_v1', '1');
      localStorage.removeItem('clinic_guest_v1');
      closeModal();
      location.hash = '#/setup';
      route();
    } else toast(t('g_wrong'));
  };
};
/* upgrade prompt shown when a guest tries a restricted area */
window.showUpgrade = () => window.askFullVersion();

function vGuestHome() {
  guestLayout(`
    ${card(`<div class="card-h"><h3>👤 ${t('g_welcome_title')}</h3></div>
      <p class="muted">${t('g_readonly')}</p>
      <div style="display:grid;gap:12px;margin-top:12px">
        <button class="btn primary" style="padding:16px;font-size:17px" onclick="location.hash='#/drugs'">${t('g_home_drugs')}</button>
        <button class="btn" style="padding:16px;font-size:17px" onclick="location.hash='#/kb'">${t('g_home_kb')}</button>
      </div>`)}
  `, '');
}

/* guest KB + DDx demo: read-only, nothing saved */
function vGuestKB() {
  guestLayout(`
    ${card(`<div class="card-h"><h3>${t('g_kb_title')}</h3></div>
      <p class="muted"><small>${t('g_readonly')}</small></p>
      ${field(t('search'), `<textarea id="kb-q" rows="3" placeholder="${t('g_demo_ph')}"></textarea>`)}
      <div class="row">${btn(t('g_demo_btn'), 'runKbDemo()', 'primary')}</div>
      <div id="kb-res"></div>
      <p class="warn-note">${t('disc2')}</p>`)}
  `, 'kb');
}
window.runKbDemo = () => {
  const q = $('#kb-q').value.trim();
  const box = $('#kb-res');
  if (!q) { box.innerHTML = ''; return; }
  const inv = kbMatch(window.INVEST_KB || [], q).slice(0, 4);
  const ddx = kbMatch(window.DDX_KB || [], q).slice(0, 4);
  const adv = (typeof getAdvice === 'function' ? getAdvice(q, null) : []).slice(0, 3);
  if (!inv.length && !ddx.length && !adv.length) { box.innerHTML = `<p class="muted">${t('ddx_none')}</p>`; return; }
  const my = LANG === 'my';
  box.innerHTML =
    (inv.length ? `<div class="card-h"><h4>${t('inv_title')}</h4></div>` + inv.map(x => {
      const e = x.e;
      return `<div class="sec"><b>${esc(my ? e.pres_my : e.pres_en)}</b><ul>${(e.tests || [])
        .map(x2 => `<li>${esc(my ? x2.t_my : x2.t_en)} <small class="muted">(${esc(x2.src || '')})</small></li>`).join('')}</ul></div>`;
    }).join('') : '') +
    (ddx.length ? `<div class="card-h"><h4>${t('ddx_title')}</h4></div>` + ddx.map(x => {
      const e = x.e;
      return `<div class="sec"><b>${esc(my ? e.pres_my : e.pres_en)}</b><ul>${(e.ddx || [])
        .map(d => `<li><b>${esc(my ? d.dx_my : d.dx_en)}</b> — ${esc(my ? d.why_my : d.why_en)} <small class="muted">(${esc(d.src || '')})</small></li>`).join('')}</ul>
        ${(e.redflags || []).length ? `<div class="warn-box red"><b>${t('ddx_redflags')}</b><ul>${e.redflags.map(r => `<li>${esc(my ? r.my : r.en)}</li>`).join('')}</ul></div>` : ''}</div>`;
    }).join('') : '') +
    (adv.length ? `<div class="card-h"><h4>💡 ${t('adv_title')} <small class="muted">${t('adv_suggest_only')}</small></h4></div>` + adv.map(r =>
      `<div class="advice"><b>${esc(advTitle(r))}</b><ul>${advPoints(r).map(pt => `<li>${esc(pt)}</li>`).join('')}</ul>
        <small class="muted">${t('adv_source')}: ${esc(r.source)}</small></div>`).join('') : '') +
    `<p class="warn-note">${t('disc2')}</p>`;
};
