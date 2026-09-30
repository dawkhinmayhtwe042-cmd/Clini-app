/* ============================================================
   Clinic EMR — auto daily backup
   Native bridge (Android APK): window.AndroidBackup.backupJson(json, filename)
   Fallback (browser/PWA): downloads the JSON file.
   Secrets (anonKey, session tokens) are NEVER included in backups.
   ============================================================ */
'use strict';

const BK_META_KEY = 'clinic_backup_meta_v1';
const BK_DAY_MS = 24 * 3600 * 1000;

function bkMeta() { try { return JSON.parse(localStorage.getItem(BK_META_KEY)) || {}; } catch { return {}; } }
function bkSaveMeta(m) { try { localStorage.setItem(BK_META_KEY, JSON.stringify(m)); } catch {} }
function bkDateStr(d) { d = d || new Date(); return d.toISOString().slice(0, 10); }

/* v3: guest mode never backs up (view-only, no user data of its own) */
function bkIsGuest() {
  try { return localStorage.getItem('clinic_guest_v1') === '1' && !isConfigured(); }
  catch { return false; }
}

/* Collect everything stored locally, minus secrets. */
function bkCollect() {
  const cfg = (typeof getCfg === 'function') ? getCfg() : {};
  const safeCfg = { clinicName: cfg.clinicName || '', doctorName: cfg.doctorName || '', offlineOnly: !!cfg.offlineOnly };
  let cache = {}, meta = {};
  try { cache = JSON.parse(localStorage.getItem('clinic_cache_v2')) || {}; } catch {}
  try { meta = JSON.parse(localStorage.getItem('clinic_meta_v2')) || {}; } catch {}
  return {
    app: 'clinic-emr', format: 1, exported_at: new Date().toISOString(),
    lang: (typeof LANG !== 'undefined' ? LANG : 'my'),
    config: safeCfg, cache: cache, meta: meta
  };
}

function bkHasBridge() {
  return (typeof window.AndroidBackup !== 'undefined') && window.AndroidBackup &&
    (typeof window.AndroidBackup.backupJson === 'function');
}

async function bkDoBackup() {
  if (bkIsGuest()) return '';
  const data = bkCollect();
  const json = JSON.stringify(data);
  const filename = 'clinic-backup-' + bkDateStr() + '.json';
  let dest = '';
  if (bkHasBridge()) {
    let res = '';
    try { res = String(window.AndroidBackup.backupJson(json, filename)); }
    catch (e) { res = 'ERR|' + (e && e.message ? e.message : e); }
    if (res.indexOf('OK|') === 0) { dest = res.slice(3); }
    else { throw new Error(res.indexOf('ERR|') === 0 ? res.slice(4) : res); }
  } else {
    // browser fallback: download the file
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch {} a.remove(); }, 4000);
    dest = t('bk_downloaded');
  }
  bkSaveMeta({ last: Date.now(), dest: dest });
  return dest;
}

/* Auto backup on launch if the last backup is >= 24h ago (or never). Silent. */
async function bkMaybeAuto() {
  if (bkIsGuest()) return false;
  const m = bkMeta();
  if (m.last && (Date.now() - m.last) < BK_DAY_MS) return false;
  try { await bkDoBackup(); toast(t('bk_saved')); return true; }
  catch (e) { console.warn('auto backup failed', e.message); return false; }
}

window.bkNow = async () => {
  try { await bkDoBackup(); toast(t('bk_saved')); }
  catch (e) { toast(t('bk_failed', e.message)); }
  route();
};

function bkLastText() {
  const m = bkMeta();
  if (!m.last) return t('bk_never');
  let s = '';
  try { s = new Date(m.last).toLocaleString(); } catch { s = String(m.last); }
  return s + (m.dest ? ' · ' + m.dest : '');
}
function bkDirText() {
  if (bkHasBridge()) {
    try { return String(window.AndroidBackup.getBackupDir()); } catch { return ''; }
  }
  return t('bk_browser_note');
}
