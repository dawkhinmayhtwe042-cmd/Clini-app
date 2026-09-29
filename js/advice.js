/* ============================================================
   Prescribing advice engine — guideline-based SUGGESTIONS only.
   Advisory, never orders. Bilingual (my/en). Sources named.
   ============================================================ */
'use strict';

const ADVICE_RULES = [
  {
    keys: ['type 2 diabetes', 't2dm', 'diabetes mellitus type 2', 'ဆီးချို', 'dm type 2', 'new diabetes'],
    title: { my: 'ဆီးချို အမျိုးအစား ၂ (လူနာသစ်၊ ရောဂါတွဲမရှိ)', en: 'Type 2 diabetes (new patient, no comorbidities)' },
    points: {
      my: ['ပထမတန်း: Metformin — တဖြည်းဖြည်းတိုးပြီး 1000 mg BD အထိ (GI ဘေးထွက်ဆိုးကျိုးသတိထား)',
           'အစားအသောက် + ကိုယ်လက်လှုပ်ရှားမှု အကြံပေးခြင်းနှင့် တွဲလုပ်ပါ',
           'HbA1c ≥ 8.5% ဆို နှစ်မျိုးတွဲကုထုံး စဉ်းစားပါ'],
      en: ['First-line: Metformin — titrate up to 1000 mg BD (watch GI side effects)',
           'Combine with diet and exercise counselling',
           'If HbA1c ≥ 8.5%, consider dual therapy']
    },
    source: 'ADA Standards of Care in Diabetes'
  },
  {
    keys: ['diabetes ascvd', 'diabetes heart failure', 'diabetes ckd', 'diabetes kidney', 'diabetes hf'],
    title: { my: 'ဆီးချို + နှလုံး/ကျောက်ကပ်ရောဂါတွဲ', en: 'Diabetes + ASCVD / heart failure / CKD' },
    points: {
      my: ['ASCVD / Heart failure / CKD ရှိရင် SGLT2 inhibitor (Empagliflozin, Dapagliflozin) သို့မဟုတ် GLP-1 receptor agonist ကို ဦးစားပေးပါ',
           'Metformin ကို eGFR ≥ 30 မှာ ဆက်သုံးနိုင်ပါတယ် (ပမာဏညှိရန်)'],
      en: ['With ASCVD / HF / CKD, prefer an SGLT2 inhibitor (Empagliflozin, Dapagliflozin) or GLP-1 receptor agonist',
           'Metformin may continue if eGFR ≥ 30 (dose-adjust)']
    },
    source: 'ADA Standards of Care in Diabetes'
  },
  {
    keys: ['hypertension', 'htn', 'high blood pressure', 'သွေးတိုး'],
    title: { my: 'သွေးတိုးရောဂါ (အထွေထွေ)', en: 'Hypertension (general)' },
    points: {
      my: ['ပထမတန်း: Thiazide diuretic (HCTZ/Indapamide), Calcium-channel blocker (Amlodipine), ACE inhibitor သို့မဟုတ် ARB',
           'အသက် 55+ ဆို CCB / thiazide ကို ဦးစားပေးပါ',
           'ဆေး ၂ မျိုးလိုရင် တွဲဖက်ကုထုံး စဉ်းစားပါ'],
      en: ['First-line: thiazide diuretic (HCTZ/indapamide), calcium-channel blocker (amlodipine), ACE inhibitor or ARB',
           'Age 55+: prefer CCB or thiazide',
           'Consider combination therapy if 2 agents needed']
    },
    source: 'WHO HEARTS technical package'
  },
  {
    keys: ['hypertension diabetes', 'htn dm', 'hypertension ckd'],
    title: { my: 'သွေးတိုး + ဆီးချို/ကျောက်ကပ်ရောဂါတွဲ', en: 'Hypertension + diabetes/CKD' },
    points: {
      my: ['ACE inhibitor (Lisinopril/Enalapril) သို့မဟုတ် ARB (Losartan) ကို ဦးစားပေးပါ — ကျောက်ကပ်ကာကွယ်မှုအတွက်',
           'Potassium နှင့် creatinine ကို စောင့်ကြည့်ပါ'],
      en: ['Prefer ACE inhibitor (lisinopril/enalapril) or ARB (losartan) — renal protection',
           'Monitor potassium and creatinine']
    },
    source: 'WHO HEARTS / ADA Standards of Care'
  },
  {
    keys: ['common cold', 'viral urti', 'flu', 'influenza', 'အအေးမိ', 'တုပ်ကွေး'],
    title: { my: 'အအေးမိ / ဗိုင်းရပ်စ် အသက်ရှူလမ်းကြောင်းရောဂါ', en: 'Common cold / viral URTI' },
    points: {
      my: ['Antibiotic မလိုပါ — အနားယူခြင်း၊ ရေများများသောက်ခြင်း၊ Paracetamol (အဖျားရှိရင်)',
           'Antihistamine (Cetirizine/Loratadine) က နှာရည်ယိုသက်သာစေနိုင်ပါတယ်',
           '၃ ရက်ထက်ပို အဖျားကြီးတာ၊ အသက်ရှူကြပ်တာ ရှိရင် ပြန်လာပါ'],
      en: ['No antibiotic needed — rest, fluids, paracetamol if febrile',
           'Antihistamine (cetirizine/loratadine) may help rhinorrhoea',
           'Return if fever > 3 days or breathlessness']
    },
    source: 'WHO AWaRe antibiotic guidance'
  },
  {
    keys: ['strep throat', 'streptococcal pharyngitis', 'tonsillitis bacterial', 'လည်ချောင်းနာ'],
    title: { my: 'ဘက်တီးရီးယား လည်ချောင်းနာ (Strep)', en: 'Streptococcal pharyngitis' },
    points: {
      my: ['Amoxicillin 500 mg BD (ကလေး 50 mg/kg OD, max 1g) ၁၀ ရက် — ပထမတန်း',
           'Penicillin allergy ဆို Azithromycin ၅ ရက်',
           'Paracetamol ဖြင့် အကိုက်သက်သာစေပါ'],
      en: ['Amoxicillin 500 mg BD (child 50 mg/kg OD, max 1 g) for 10 days — first-line',
           'If penicillin-allergic: azithromycin 5 days',
           'Paracetamol for pain']
    },
    source: 'WHO / IDSA pharyngitis guidance'
  },
  {
    keys: ['pneumonia', 'cap', 'အဆုတ်ရောင်'],
    title: { my: 'အဆုတ်ရောင်ရောဂါ (ပြင်ပလူနာ၊ မပြင်းထန်)', en: 'Pneumonia (outpatient, mild)' },
    points: {
      my: ['Amoxicillin 500 mg–1 g TDS ၅–၇ ရက် — ပထမတန်း',
           'အသက်ရှူကြပ်တာ၊ သွေးခုန်မြန်တာ၊ စိုးရိမ်ရတဲ့ လက္ခဏာရှိရင် ဆေးရုံလွှဲပါ'],
      en: ['Amoxicillin 500 mg–1 g TDS for 5–7 days — first-line',
           'Refer to hospital if breathless, tachycardic or worrying signs']
    },
    source: 'WHO pneumonia guidance'
  },
  {
    keys: ['uti', 'cystitis', 'urinary tract infection', 'ဆီးလမ်းကြောင်းပိုးဝင်'],
    title: { my: 'ဆီးလမ်းကြောင်းပိုးဝင်ခြင်း (မပြင်းထန်)', en: 'UTI (uncomplicated)' },
    points: {
      my: ['Nitrofurantoin 100 mg BD ၅–၇ ရက် (ကိုယ်ဝန်ဆောင်/ကျောက်ကပ်မကောင်းသူ သတိထား)',
           'ရေများများသောက်ရန်၊ ဆီးမအောင့်ရန် အကြံပေးပါ'],
      en: ['Nitrofurantoin 100 mg BD for 5–7 days (caution in pregnancy/renal impairment)',
           'Advise fluids, not holding urine']
    },
    source: 'IDSA uncomplicated UTI guidance'
  },
  {
    keys: ['gerd', 'gastritis', 'acid reflux', 'အစာအိမ်ရောင်', 'ရင်ပူ'],
    title: { my: 'အစာအိမ်ရောင်ခြင်း / အက်ဆစ်ပြန်တက်ခြင်း', en: 'GERD / gastritis' },
    points: {
      my: ['PPI (Omeprazole 20 mg OD) မနက်စာ မစားမီ နာရီဝက် — ၂–၄ ပတ်',
           'အစားအသောက်: နည်းနည်းနဲ့ခဏခဏစား၊ အစပ်/အဆီများရှောင်၊ ဆေးလိပ်/အရက်ရှောင်',
           'သွေးအန်တာ၊ မည်းမည်းဝမ်းသွားတာ ရှိရင် အရေးပေါ်ပြန်လာပါ'],
      en: ['PPI (omeprazole 20 mg OD) 30 min before breakfast — 2–4 weeks',
           'Small frequent meals; avoid spicy/fatty food, smoking, alcohol',
           'Return urgently if vomiting blood or black stools']
    },
    source: 'Standard GERD management guidance'
  },
  {
    keys: ['diarrhoea', 'diarrhea', 'gastroenteritis', 'ဝမ်းလျှော'],
    title: { my: 'ဝမ်းလျှောခြင်း (အထွေထွေ)', en: 'Diarrhoea (general)' },
    points: {
      my: ['ORS — ရေဓာတ်ပြန်ဖြည့်တာ အရေးအကြီးဆုံး',
           'ကလေးဆို Zinc 20 mg OD (၆ လအောက် 10 mg) ၁၀–၁၄ ရက်',
           'သွေးပါဝမ်းသွားတာ၊ ရေဓာတ်ခမ်းခြောက်လက္ခဏာ ရှိရင် အရေးပေါ်ကုသပါ'],
      en: ['ORS — rehydration is the priority',
           'Child: zinc 20 mg OD (10 mg if < 6 months) for 10–14 days',
           'Bloody stools or dehydration signs → urgent care']
    },
    source: 'WHO diarrhoea management'
  },
  {
    keys: ['asthma', 'ပန်းနာရင်ကြပ်'],
    title: { my: 'ပန်းနာရင်ကြပ်', en: 'Asthma' },
    points: {
      my: ['ထိန်းချုပ်ဆေး: Inhaled corticosteroid (Budesonide/Beclomethasone) နေ့စဉ်',
           'သက်သာဆေး: Salbutamol inhaler လိုအပ်သလို',
           'ပြင်းထန်တိုက်ခိုက်မှုဆို Prednisolone 40–50 mg OD ၅ ရက် + Salbutamol neb'],
      en: ['Controller: inhaled corticosteroid (budesonide/beclomethasone) daily',
           'Reliever: salbutamol inhaler as needed',
           'Severe attack: prednisolone 40–50 mg OD 5 days + salbutamol neb']
    },
    source: 'GINA asthma guidance'
  },
  {
    keys: ['anaemia', 'anemia', 'iron deficiency', 'သွေးအားနည်း'],
    title: { my: 'သံဓာတ်ချို့တဲ့ သွေးအားနည်းခြင်း', en: 'Iron-deficiency anaemia' },
    points: {
      my: ['Ferrous sulfate 200 mg OD–BD, အစာမစားမီ — ၃ လ',
           'Vitamin C နဲ့တွဲသောက်ရင် စုပ်ယူမှုကောင်းပါတယ်; လက်ဖက်ရည်နဲ့ ဝေးဝေးသောက်ပါ'],
      en: ['Ferrous sulfate 200 mg OD–BD before food — 3 months',
           'Take with vitamin C; avoid tea around dosing']
    },
    source: 'WHO anaemia guidance'
  },
  {
    keys: ['scabies', 'ယားနာ'],
    title: { my: 'ယားနာ (Scabies)', en: 'Scabies' },
    points: {
      my: ['Permethrin 5% cream — လည်ပင်းအောက်တစ်ကိုယ်လုံး ညအိပ်လိမ်း၊ ၈–၁၄ နာရီနေ ရေချိုး',
           'အိမ်တွင်းရှိသူအားလုံး တစ်ပြိုင်တည်း ကုသပါ; အဝတ်အစားများ ရေနွေးနဲ့လျှော်ပါ'],
      en: ['Permethrin 5% cream — whole body below neck overnight, wash after 8–14 h',
           'Treat all household contacts; hot-wash clothing/bedding']
    },
    source: 'WHO / standard dermatology guidance'
  },
  {
    keys: ['tinea', 'ringworm', 'fungal skin', 'မှို'],
    title: { my: 'အရေပြားမှိုစွဲခြင်း', en: 'Dermatophyte infection' },
    points: {
      my: ['Topical antifungal (Clotrimazole/Miconazole/Terbinafine) — ၂–၄ ပတ်',
           'ကျယ်ပြန့်ရင်/ပြန်ဖြစ်ရင် oral antifungal စဉ်းစားပါ'],
      en: ['Topical antifungal (clotrimazole/miconazole/terbinafine) — 2–4 weeks',
           'Extensive/recurrent: consider oral antifungal']
    },
    source: 'Standard dermatology guidance'
  },
  {
    keys: ['allergic rhinitis', 'hay fever', 'နှာမွှန်နှာရည်ယို'],
    title: { my: 'ဓာတ်မတည့်နှာခေါင်းရောင်ခြင်း', en: 'Allergic rhinitis' },
    points: {
      my: ['Cetirizine/Loratadine 10 mg OD', 'မသက်သာရင် intranasal steroid ထပ်ထည့်စဉ်းစားပါ'],
      en: ['Cetirizine/loratadine 10 mg OD', 'If uncontrolled, consider adding intranasal steroid']
    },
    source: 'Standard allergy guidance'
  }
];

function getAdvice(diagnosis, patient) {
  if (!diagnosis) return [];
  const dx = diagnosis.toLowerCase();
  const hits = ADVICE_RULES.filter(r => r.keys.some(k => dx.includes(k.toLowerCase())));
  const comorb = /ascvd|heart failure|hf\b|ckd|kidney|myocardial|stroke/.test(dx) ||
    /ascvd|heart failure|ckd|kidney/.test(((patient && patient.chronic) || '').toLowerCase());
  if (comorb) {
    const spec = hits.find(h => /ASCVD|CKD|နှလုံး/.test(h.title.my));
    if (spec) return [spec];
  }
  return hits.slice(0, 3);
}
function advTitle(r) { return LANG === 'my' ? r.title.my : r.title.en; }
function advPoints(r) { return LANG === 'my' ? r.points.my : r.points.en; }
