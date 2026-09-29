/* ============================================================
   Decision support checks — ADVISORY ONLY, always overridable.
   Warnings carry {my,en} text so they render in either language,
   including when loaded back from the server.
   warning = {level:'red'|'amber', title:{my,en}, detail:{my,en}, itemIdx}
   ============================================================ */
'use strict';

function norm(s) { return (s || '').toLowerCase().trim(); }

function freqPerDay(f) {
  const x = norm(f).replace(/\s+/g, ' ');
  if (!x) return 1;
  if (/stat|single dose/.test(x)) return 1;
  if (/\bqd\b|\bod\b|once daily|daily|od$|mane/.test(x)) return 1;
  if (/\bbd\b|twice|12 hourly|nocte/.test(x)) return 2;
  if (/\btds\b|three times|8 hourly/.test(x)) return 3;
  if (/\bqid\b|four times|6 hourly/.test(x)) return 4;
  if (/weekly/.test(x)) return 1 / 7;
  if (/prn|as needed| sos/.test(x)) return 1;
  return 1;
}

function drugByGeneric(g) {
  const gl = norm(g);
  return Store.all('drugs').find(d => norm(d.generic) === gl) || null;
}

const B = (my, en) => ({ my, en });
const W = (level, tMy, tEn, dMy, dEn, itemIdx = -1) =>
  ({ level, title: B(tMy, tEn), detail: B(dMy, dEn), itemIdx });

function runChecks(patient, items) {
  const warnings = [];
  const push = w => warnings.push(w);

  const allergies = norm(patient.allergies).split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  const child = patient.age != null && patient.age !== '' && Number(patient.age) < 18;
  const weight = patient.weight_kg ? Number(patient.weight_kg) : null;

  if (child && !weight) push(W('amber',
    'ကလေးလူနာ — ကိုယ်အလေးချိန်လိုအပ်သည်', 'Child patient — weight needed',
    'ဆေးပမာဏ တိကျစွာစစ်ဆေးရန် ကလေး၏ ကိုယ်အလေးချိန် (kg) ကို လူနာမှတ်တမ်းတွင် ထည့်ပါ။',
    "Enter the child's weight (kg) in the patient record for accurate dose checking."));

  items.forEach((it, idx) => {
    const drug = drugByGeneric(it.drug_generic);
    const label = `${it.drug_generic}${it.formulation ? ' (' + it.formulation + ')' : ''}`;

    // --- allergy ---
    if (drug && allergies.length) {
      for (const a of allergies) {
        const hay = norm(drug.generic) + ' ' + norm(drug.allergy || '');
        const hit = norm(drug.generic).includes(a) || a.includes(norm(drug.generic)) ||
          norm(drug.allergy || '').includes(a) ||
          (a === 'penicillin' && /penicillin|amoxicillin|cloxacillin|cephalosporin/i.test(hay)) ||
          (a === 'sulfa' && /sulfonamide|sulfamethoxazole/i.test(hay)) ||
          (a === 'aspirin' && /salicylate/i.test(hay));
        if (hit) {
          push(W('red', 'Allergy သတိပေးချက်', 'Allergy alert',
            `${label}: လူနာတွင် "${a}" allergy ရှိသည်။ ${drug.allergy || ''}`,
            `${label}: patient has "${a}" allergy. ${drug.allergy || ''}`, idx));
          break;
        }
      }
    }

    if (!drug) {
      push(W('amber', 'ဆေးဒေတာဘေ့စ်တွင် မတွေ့ပါ', 'Not in drug database',
        `${label} အတွက် အချက်အလက်မရှိသဖြင့် အပြည့်အဝစစ်ဆေးမရပါ။`,
        `No data for ${label} — could not fully check.`, idx));
      return;
    }

    // --- pediatric dosing ---
    if (child) {
      if (drug.ped_flag === 'contra')
        push(W('red', 'ကလေးတွင် မသုံးရ', 'Contraindicated in children', `${label}: ${drug.dose_ped || ''}`, `${label}: ${drug.dose_ped || ''}`, idx));
      else if (drug.ped_flag === 'caution')
        push(W('amber', 'ကလေးတွင် သတိထားသုံးရန်', 'Use with caution in children', `${label}: ${drug.dose_ped || ''}`, `${label}: ${drug.dose_ped || ''}`, idx));
      else if (drug.ped_flag === 'no_data' || !drug.dose_ped)
        push(W('amber', 'ကလေးဆေးပမာဏ သတ်မှတ်မထား', 'No established pediatric dose',
          `${label}: ကလေးအတွက် တရားဝင်ဆေးပမာဏ မရှိပါ — ဆရာဝန်ဆုံးဖြတ်ချက်ဖြင့် ညွှန်းပါ။`,
          `${label}: no established pediatric dose — prescribe at your discretion.`, idx));
      if (weight && it.dose_mg) {
        const mgkgDose = Number(it.dose_mg) / weight;
        const mgkgDay = mgkgDose * freqPerDay(it.frequency);
        const f2 = v => Math.round(v * 100) / 100;
        if (drug.ped_cap_mg && Number(it.dose_mg) > drug.ped_cap_mg)
          push(W('red', 'တစ်ကြိမ်ပမာဏ များနေသည်', 'Single dose too high',
            `${label}: ${it.dose_mg} mg > အများဆုံး ${drug.ped_cap_mg} mg/ကြိမ်`,
            `${label}: ${it.dose_mg} mg > max ${drug.ped_cap_mg} mg/dose`, idx));
        if (drug.ped_mgkg_max && mgkgDose > drug.ped_mgkg_max)
          push(W('red', 'တစ်ကြိမ်ပမာဏ (mg/kg) များနေသည်', 'Single dose (mg/kg) too high',
            `${label}: ${f2(mgkgDose)} mg/kg/ကြိမ် > အများဆုံး ${drug.ped_mgkg_max} mg/kg/ကြိမ် (အလေးချိန် ${weight} kg)`,
            `${label}: ${f2(mgkgDose)} mg/kg/dose > max ${drug.ped_mgkg_max} mg/kg/dose (weight ${weight} kg)`, idx));
        else if (drug.ped_mgkg && mgkgDose > drug.ped_mgkg * 1.5)
          push(W('amber', 'ပုံမှန်ပမာဏထက် များနေသည်', 'Above usual dose',
            `${label}: ${f2(mgkgDose)} mg/kg/ကြိမ် (ပုံမှန် ~${drug.ped_mgkg} mg/kg/ကြိမ်)`,
            `${label}: ${f2(mgkgDose)} mg/kg/dose (usual ~${drug.ped_mgkg} mg/kg/dose)`, idx));
        if (drug.ped_daymax_mgkg && mgkgDay > drug.ped_daymax_mgkg)
          push(W('red', 'တစ်နေ့တာပမာဏ များနေသည်', 'Daily dose too high',
            `${label}: ${f2(mgkgDay)} mg/kg/နေ့ > အများဆုံး ${drug.ped_daymax_mgkg} mg/kg/နေ့`,
            `${label}: ${f2(mgkgDay)} mg/kg/day > max ${drug.ped_daymax_mgkg} mg/kg/day`, idx));
      }
    }

    // --- contraindications vs patient conditions (red, overridable) ---
    {
      const keys = Array.isArray(drug.contra_keys) ? drug.contra_keys : [];
      const ptext = norm([patient.chronic, patient.allergies, patient.notes].join(' '));
      const age = patient.age != null && patient.age !== '' ? Number(patient.age) : null;
      const seen = new Set();
      for (const k of keys) {
        const key = norm(k);
        if (!key || seen.has(key)) continue;
        let whyMy = '', whyEn = '';
        if (key === 'pregnancy' && patient.pregnant) { whyMy = 'ကိုယ်ဝန်ဆောင်'; whyEn = 'pregnancy'; }
        else if ((key === 'breastfeeding') && /breastfeed|နို့တိုက်/.test(ptext)) { whyMy = 'နို့တိုက်နေခြင်း'; whyEn = 'breastfeeding'; }
        else if (['renal impairment', 'kidney', 'ckd'].includes(key) && patient.renal_issue) { whyMy = 'ကျောက်ကပ်မကောင်း'; whyEn = 'renal impairment'; }
        else if (['hepatic impairment', 'liver'].includes(key) && /liver|hepat| cirrhosis|jaundice|အသည်း/.test(ptext)) { whyMy = 'အသည်းရောဂါ'; whyEn = 'hepatic impairment'; }
        else if (['children', 'child', 'pediatric'].includes(key) && age != null && age < 18) { whyMy = 'ကလေး'; whyEn = 'child'; }
        else if (key === 'elderly' && age != null && age >= 65) { whyMy = 'သက်ကြီး'; whyEn = 'elderly'; }
        else if (ptext.includes(key) && key.length > 2) { whyMy = key; whyEn = key; }
        if (whyMy) {
          seen.add(key);
          push(W('red', '⛔ တားမြစ်ချက် (Contraindication)', '⛔ Contraindication',
            `${label}: ${drug.contra || ''} — လူနာအခြေအနေ "${whyMy}" နှင့် ဆန့်ကျင်ဘက်ဖြစ်သည်`,
            `${label}: ${drug.contra || ''} — conflicts with patient condition "${whyEn}"`, idx));
        }
      }
      // elderly precaution (amber)
      if (age != null && age >= 65 && /elderly/i.test(drug.precautions || '') && ![...seen].includes('elderly')) {
        push(W('amber', '👴 သက်ကြီးရွယ်အို သတိပြုရန်', '👴 Elderly precaution',
          `${label}: ${drug.precautions || ''}`, `${label}: ${drug.precautions || ''}`, idx));
      }
    }

    // --- pregnancy ---
    if (patient.pregnant && drug.preg) {
      const bad = /contraindicat|avoid|teratogenic|not recommended/i.test(drug.preg);
      push(W(bad ? 'red' : 'amber', 'ကိုယ်ဝန်ဆောင် သတိပေးချက်', 'Pregnancy warning',
        `${label}: ${drug.preg}`, `${label}: ${drug.preg}`, idx));
    }

    // --- renal ---
    if (patient.renal_issue && drug.dose_renal)
      push(W('amber', 'ကျောက်ကပ်အခြေအနေ — ပမာဏညှိရန်', 'Renal impairment — adjust dose',
        `${label}: ${drug.dose_renal}`, `${label}: ${drug.dose_renal}`, idx));
  });

  // --- drug-drug interactions ---
  const pairCheck = (di, gj, labelI, labelJ, idx, cur) => {
    const list = Array.isArray(di.interactions) ? di.interactions : [];
    for (const [other, sev, note] of list) {
      const no = norm(other);
      if (gj === no || gj.includes(no) || no.includes(gj)) {
        const tm = cur ? (LANG === 'my' ? `လက်ရှိသောက်နေသောဆေးနှင့် ဓာတ်ပြုမှု (${sev})` : `Interaction with current medication (${sev})`)
                       : (LANG === 'my' ? `ဆေးဓာတ်ပြုမှု (${sev})` : `Drug interaction (${sev})`);
        const te = `Drug interaction (${sev})`;
        push({ level: sev === 'major' ? 'red' : 'amber',
          title: B(tm, te),
          detail: B(`${labelI} + ${labelJ}: ${note || ''}`, `${labelI} + ${labelJ}: ${note || ''}`),
          itemIdx: idx });
      }
    }
  };
  for (let i = 0; i < items.length; i++) {
    const di = drugByGeneric(items[i].drug_generic);
    if (!di) continue;
    for (let j = 0; j < items.length; j++)
      if (i !== j) pairCheck(di, norm(items[j].drug_generic), items[i].drug_generic, items[j].drug_generic, i, false);
  }
  const curMeds = norm(patient.current_meds).split(/[,;]+/).map(s => s.trim()).filter(Boolean);
  if (curMeds.length) items.forEach((it, idx) => {
    const drug = drugByGeneric(it.drug_generic);
    if (!drug) return;
    for (const cm of curMeds) pairCheck(drug, cm, it.drug_generic, cm, idx, true);
  });

  return warnings;
}

function warnHtml(w) {
  const L = LANG === 'my' ? 'my' : 'en';
  return `<div class="warn ${w.level}"><b>${esc(w.title[L])}</b><br><small>${esc(w.detail[L])}</small></div>`;
}
