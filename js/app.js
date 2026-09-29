/* ============================================================
   Clinic EMR — router + boot
   ============================================================ */
'use strict';

function parseHash() {
  const h = location.hash || '#/';
  const [path, query] = h.slice(2).split('?');
  return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(query || '') };
}

async function route() {
  const { parts, q } = parseHash();
  const [r1, r2, r3] = parts;

  // not configured → setup
  if (!isConfigured() && r1 !== 'setup') { location.hash = '#/setup'; return; }
  if (r1 === 'setup') { vSetup(); return; }

  // not logged in → login
  if (!Auth.user()) {
    if (r1 !== 'login') { location.hash = '#/login'; return; }
    vLogin(); return;
  }
  if (!App.profile) await loadProfile();

  try {
    if (!r1) vDashboard();
    else if (r1 === 'login') location.hash = '#/';
    else if (r1 === 'patients') vPatients();
    else if (r1 === 'patient' && r2 === 'new') vPatientNew();
    else if (r1 === 'patient' && r3 === 'edit') vPatientEdit(r2);
    else if (r1 === 'patient' && r2) vPatientDetail(r2);
    else if (r1 === 'visit' && r2 === 'new') vVisitNew(q.get('patient'));
    else if (r1 === 'visit' && r2) vVisitDetail(r2);
    else if (r1 === 'rx' && r2 === 'new') vRxNew(q.get('patient'), q.get('visit'));
    else if (r1 === 'rx' && r3 === 'print') vRxPrint(r2);
    else if (r1 === 'rx' && r2) vRxDetail(r2);
    else if (r1 === 'drugs') vDrugs();
    else if (r1 === 'drug' && r2 === 'new') vDrugForm('new');
    else if (r1 === 'drug' && r3 === 'edit') vDrugForm(r2);
    else if (r1 === 'drug' && r2) vDrugDetail(r2);
    else if (r1 === 'templates') vTemplates();
    else if (r1 === 'template' && r2) vTemplateForm(r2);
    else if (r1 === 'followups') vFollowups();
    else if (r1 === 'analytics') vAnalytics();
    else if (r1 === 'billing') vBilling();
    else if (r1 === 'dispensing' && r2 === 'new') vDispensingForm('new');
    else if (r1 === 'dispensing' && r3 === 'edit') vDispensingForm(r2);
    else if (r1 === 'dispensing') vDispensing();
    else if (r1 === 'users') vUsers();
    else if (r1 === 'settings') vSettings();
    else vDashboard();
  } catch (e) {
    console.error('route error', e);
    $('#app').innerHTML = `<main id="view"><div class="card"><h3>⚠️ Error</h3><p class="muted">${esc(e.message)}</p>
      <button class="btn" onclick="location.hash='#/'">Home</button></div></main>`;
  }
  window.scrollTo(0, 0);
}

async function boot() {
  document.documentElement.lang = LANG === 'my' ? 'my' : 'en';
  window.addEventListener('hashchange', route);
  window.addEventListener('online', () => { UIkit.syncBadge(); Sync.run(); });
  window.addEventListener('offline', () => UIkit.syncBadge());
  // service worker (offline PWA)
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('sw.js'); } catch (e) { console.warn('sw', e); }
  }
  if (isConfigured() && Auth.user()) {
    await loadProfile();
    await ensureLocalDrugSeed();
    await ensureStarterTemplates();
    Sync.run();
  }
  route();
}

document.addEventListener('DOMContentLoaded', boot);
