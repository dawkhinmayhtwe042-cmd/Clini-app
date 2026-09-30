/* ============================================================
   i18n — Myanmar / English dictionary. Persisted in localStorage.
   ============================================================ */
'use strict';
const LANG_KEY = 'clinic_lang';
let LANG = localStorage.getItem(LANG_KEY) || 'my';
function setLang(l) { LANG = (l === 'en') ? 'en' : 'my'; localStorage.setItem(LANG_KEY, LANG); }
function t(k, ...a) {
  let s = (STR[LANG] && STR[LANG][k]) ?? STR.my[k] ?? k;
  a.forEach((v, i) => { s = String(s).split('{' + i + '}').join(v); });
  return s;
}

const STR = {
/* ================= MYANMAR ================= */
my: {
  appName: 'ဆေးခန်း', tagline: 'Clinic EMR',
  nav_dashboard: 'ပင်မ', nav_patients: 'လူနာ', nav_drugs: 'ဆေး', nav_followup: 'ပြန်လာ', nav_analytics: 'စာရင်း',
  save: 'သိမ်းမည်', cancel: 'မလုပ်တော့ပါ', close: 'ပိတ်မည်', edit: 'ပြင်ရန်', delete: 'ဖျက်ရန်',
  add: 'ထည့်ရန်', search: 'ရှာရန်', back: '← ပြန်သွားမည်', confirm: 'အတည်ပြုပါ', print: 'Print ထုတ်မည်',
  all: 'အားလုံး', view_all: 'အားလုံး →', open: 'ဖွင့်ရန်', mark_done: '✅ ပြီးပြီ', years: 'နှစ်', kg: 'kg', kyat: 'ကျပ်',

  d_today_patients: 'ယနေ့လူနာ', d_followups: 'ပြန်လာရန်', d_month_revenue: 'လဝင်ငွေ(ကျပ်)',
  d_due_today: 'ယနေ့ပြန်လာရမည့်လူနာများ', d_overdue: 'ရက်လွန်နေသူများ', d_new_patient: '➕ လူနာအသစ်',
  d_find_patient: '🔍 လူနာရှာရန်', d_none_today: 'ယနေ့မရှိပါ', d_role_apprentice: 'အသုံးပြုသူ: {0} (တပည့်)',

  p_title: 'လူနာများ', p_search_ph: '🔍 နာမည် / ဖုန်းနံပါတ်ဖြင့် ရှာရန်', p_new: 'လူနာအသစ်မှတ်ပုံတင်ရန်',
  p_name: 'အမည် *', p_age: 'အသက်', p_years_old: '{0} နှစ်', p_sex: 'ကျား/မ', p_male: 'ကျား', p_female: 'မ',
  p_phone: 'ဖုန်း', p_weight: 'ကိုယ်အလေးချိန် (kg)', p_allergies: 'Allergy (ကော်မာခြား၍ ရေးပါ)',
  p_allergies_ph: 'ဥပမာ: penicillin, sulfa', p_chronic: 'နာတာရှည်ရောဂါ', p_chronic_ph: 'ဥပမာ: HTN, T2DM',
  p_current_meds: 'လက်ရှိသောက်နေသောဆေးများ', p_current_meds_ph: 'ကော်မာခြား၍ ရေးပါ',
  p_pregnant: 'ကိုယ်ဝန်ဆောင်', p_renal: 'ကျောက်ကပ်မကောင်း', p_notes: 'မှတ်ချက်',
  p_need_name: 'အမည်ထည့်ပါ', p_saved: 'လူနာမှတ်ပုံတင်ပြီးပါပြီ', p_updated: 'သိမ်းပြီးပါပြီ',
  p_visits: 'လာရောက်မှုမှတ်တမ်း', p_prescriptions: 'ဆေးညွှန်းများ', p_followups: 'ပြန်လည်ပြသမှု',
  p_new_visit: '🩺 လာရောက်မှုအသစ်', p_new_rx: '💊 ဆေးညွှန်းအသစ်', p_edit: '✏️ ပြင်ရန်', p_delete: '🗑️ ဖျက်ရန်',
  p_none: 'မရှိသေးပါ', p_no_patient: 'လူနာမရှိသေးပါ', p_del_confirm: 'ဤလူနာ၏မှတ်တမ်းအားလုံး ဖျက်မည်လား?',
  p_deleted: 'ဖျက်ပြီးပါပြီ', p_edit_title: 'လူနာပြင်ဆင်ရန်', p_allergy_is: 'Allergy', p_chronic_is: 'နာတာရှည်',

  v_new: 'လာရောက်မှုအသစ်', v_date: 'ရက်စွဲ', v_complaint: 'လာရသည့်အကြောင်းအရင်း',
  v_history: 'ရောဂါရာဇဝင် (History)', v_exam: 'စစ်ဆေးတွေ့ရှိချက် (Examination)',
  v_diagnosis: 'ရောဂါအမည် (Diagnosis)', v_diagnosis_ph: 'ဥပမာ: Hypertension',
  v_plan: 'ကုသမှုအစီအစဉ် (Plan)', v_next_visit: 'နောက်တစ်ကြိမ်ပြန်လာရန်ရက်',
  v_fee_consult: 'စမ်းသပ်ခ (ကျပ်)', v_fee_medicine: 'ဆေးဖိုး (ကျပ်)',
  v_saved: 'လာရောက်မှုမှတ်တမ်း သိမ်းပြီးပါပြီ', v_save_rx: '💾+💊 ဆေးညွှန်းဆက်ရေးမည်',
  v_advice_btn: '💡 အကြံပြုချက်', v_no_advice: 'ဤရောဂါအတွက် အကြံပြုချက်မရှိပါ',
  v_billing: 'ငွေစာရင်း', v_next_date: 'ပြန်လာရန်ရက်', v_tpl_inserted: '"{0}" ထည့်ပြီးပါပြီ',

  t_title: 'မှတ်တမ်းပုံစံများ', t_new: 'ပုံစံအသစ်', t_code: 'အတိုကောက် (ဥပမာ: htn)',
  t_name: 'ခေါင်းစဉ်', t_field: 'ကွက်လပ်', t_body: 'ပုံစံစာသား', t_saved: 'သိမ်းပြီးပါပြီ',
  t_deleted: 'ဖျက်ပြီးပါပြီ', t_del_confirm: 'ဤပုံစံကို ဖျက်မည်လား?', t_none: 'ပုံစံမရှိသေးပါ',
  t_hint: 'မှတ်တမ်းရေးရာတွင် အတိုကောက်ခလုတ် (chip) ကို နှိပ်ရုံနှင့် ပုံစံစာသား ထည့်သွင်းနိုင်သည်။',
  f_complaint: 'အကြောင်းအရင်း', f_history: 'ရာဇဝင်', f_exam: 'စစ်ဆေးချက်', f_plan: 'အစီအစဉ်',

  rx_new: 'ဆေးညွှန်းအသစ်', rx_search_ph: '🔍 ဆေးအမည် ရိုက်ရှာပါ (ဥပမာ: amox)',
  rx_add: 'ဆေးထည့်ရန်', rx_list: 'ဆေးစာရင်း', rx_formulation: 'ပုံစံ', rx_dose: 'ပမာဏ',
  rx_unit: 'ယူနစ်', rx_freq: 'အကြိမ်', rx_days: 'ရက်', rx_qty: 'အရေအတွက်',
  rx_price: 'တစ်ယူနစ်ဈေး (ကျပ်)', rx_instructions: 'ညွှန်ကြားချက်', rx_instructions_ph: 'ဥပမာ: အစာစားပြီးသောက်ရန်',
  rx_add_to_list: 'စာရင်းထဲထည့်မည်', rx_check: '🔍 ဆေးစစ်ဆေးရန်', rx_save_print: '💾 သိမ်းပြီး Print ထုတ်မည်',
  rx_no_warn: '✅ သတိပေးချက်မရှိပါ — ဆေးညွှန်းကို သိမ်းနိုင်ပါပြီ', rx_warnings: 'သတိပေးချက်များ',
  rx_ack: 'သတိပေးချက်များကို သိရှိပြီး၊ ဆရာဝန်အနေဖြင့် ဆက်လက်ညွှန်းပါမည် (override)',
  rx_saved: 'ဆေးညွှန်း သိမ်းပြီးပါပြီ', rx_need_items: 'ဆေးအရင်ထည့်ပါ',
  rx_need_check: 'သတိပေးချက်ရှိပါက "ဆေးစစ်ဆေးရန်" နှိပ်ပြီး အတည်ပြုချက် (override) လုပ်ပါ',
  rx_added: 'ထည့်ပြီးပါပြီ', rx_close: 'ပိတ်မည်', rx_not_found: 'မတွေ့ပါ',
  rx_child: 'ကလေး', rx_no_weight: 'အလေးချိန်မရှိ',
  rx_weight_needed: 'ကလေးလူနာ၏ ကိုယ်အလေးချိန် မရှိသေးပါ — ဆေးပမာဏ တိကျစွာစစ်ရန် အလေးချိန်လိုအပ်သည်။',
  rx_ask_weight: '⚖️ အလေးချိန်ထည့်ရန်', rx_weight_title: 'ကလေး၏ ကိုယ်အလေးချိန်',
  rx_ped_dose: 'ကလေး', rx_adult_dose: 'လူကြီး', rx_ped_contra_box: '⛔ ကလေးတွင် လုံးဝမသုံးရ',
  rx_detail: 'ဆေးညွှန်း', rx_patient: 'လူနာ', rx_overridden: 'Override လုပ်ထားသောသတိပေးချက် {0} ခု',
  rx_del_confirm: 'ဤဆေးညွှန်းကို ဖျက်မည်လား?', rx_deleted: 'ဖျက်ပြီးပါပြီ',
  rx_print_title: 'ဆရာဝန်လက်မှတ်', rx_print_note: 'ဤဆေးညွှန်းသည် ဆရာဝန်၏ ဆုံးဖြတ်ချက်အတိုင်း ထုတ်ပေးခြင်းဖြစ်သည်။',
  rx_no: 'စဉ်', rx_drug: 'ဆေးအမည်', rx_form: 'ပုံစံ', rx_amount: 'ပမာဏ', rx_times: 'အကြိမ်', rx_dayn: 'ရက်', rx_how: 'ညွှန်ကြားချက်',

  dr_title: 'ဆေးများ', dr_search_ph: '🔍 ဆေးအမည် / brand ဖြင့် ရှာရန်', dr_new: 'ဆေးအသစ်ထည့်ရန်',
  dr_brands: 'Brand အမည်များ (; ခြား၍ရေးပါ)', dr_forms: 'ပုံစံ/အားအင်မျိုး (; ခြား)',
  dr_category: 'အုပ်စု', dr_ind: 'ရောဂါညွှန်းများ (Indications)', dr_dose_adult: 'လူကြီးဆေးပမာဏ',
  dr_dose_ped: 'ကလေးဆေးပမာဏ (mg/kg အတိအကျ)', dr_ped_flag: 'ကလေးအခြေအနေ',
  dr_dose_renal: 'ကျောက်ကပ်မကောင်းသူ', dr_ci: 'မသုံးသင့်သောအခြေအနေ', dr_inter: 'ဓာတ်ပြုနိုင်သောဆေးများ',
  dr_inter_hint: 'တစ်ကြောင်းတစ်ခု: ဆေးအမည် | major/moderate/minor | မှတ်ချက်',
  dr_contra: 'လုံးဝမသုံးသင့်သောအခြေအနေများ (အကြောင်းရင်းနှင့်တကွ)',
  dr_contra_keys: 'Contraindication keywords (; ခြား, အင်္ဂလိပ်လို)',
  dr_prec: 'သတိပြုရန်များ (သက်ကြီး/အသည်း/အစားအသောက်/စောင့်ကြည့်ရန်)',
  dr_allergy: 'Allergy ဓာတ်ပြုမှု', dr_preg: 'ကိုယ်ဝန်/နို့တိုက်', dr_mon: 'စောင့်ကြည့်ရန်',
  dr_saved: 'သိမ်းပြီးပါပြီ', dr_deleted: 'ဖျက်ပြီးပါပြီ', dr_del_confirm: 'ဤဆေးကို ဖျက်မည်လား?',
  dr_not_found: 'ဆေးမတွေ့ပါ', dr_none: 'ဆေးမရှိသေးပါ', dr_import: '📥 CSV import',
  dr_count: 'ဆေးစုစုပေါင်း: {0} မျိုး', dr_show_more: 'ပိုပြရန် (ကျန် {0} မျိုး)',
  dr_import_done: 'သွင်းပြီးပါပြီ: {0} မျိုး', dr_hint_doc: 'ဆရာဝန်သာ ပြင်/ဖျက်/ထည့်နိုင်သည်',
  ped_ok: 'ပုံမှန်', ped_caution: 'သတိထား', ped_contra: 'မသုံးရ', ped_no_data: 'အချက်အလက်မရှိ',

  fu_title: 'ပြန်လည်ပြသမှု', fu_today: 'ယနေ့', fu_overdue: 'ရက်လွန်', fu_upcoming: 'နောင်လာမည်',
  fu_done_msg: 'မှတ်သားပြီးပါပြီ', fu_none: 'မရှိပါ',

  an_title: 'ရောင်းအားဆန်းစစ်ချက်', an_top_qty: 'အရောင်းရဆုံးဆေးများ (အရေအတွက်)',
  an_top_rev: 'အရောင်းရဆုံးဆေးများ (ငွေပမာဏ)', an_by_dx: 'ရောဂါအလိုက် ဆေးအုပ်စုများ',
  an_trend: 'ရက် ၁၄ ရက် ရောင်းအားလမ်းကြောင်း', an_30: 'ရက် ၃၀', an_all: 'အားလုံး',
  an_none: 'အချက်အလက်မရှိသေးပါ', an_qty: 'အရေ', an_revenue: 'ငွေ',

  b_title: 'ငွေစာရင်း', b_pick_month: 'လ ရွေးပါ', b_consult: 'စမ်းသပ်ခ', b_medicine: 'ဆေးဖိုး',
  b_total: 'စုစုပေါင်း', b_none: 'ဤလတွင် မှတ်တမ်းမရှိပါ', b_visits: 'လူနာဦးရေ',

  dsp_title: 'ဆေးထုတ်ပေးမှုမှတ်တမ်း', dsp_new: 'လက်ဖြင့်ထည့်ရန်', dsp_drug: 'ဆေး',
  dsp_qty: 'အရေအတွက်', dsp_price: 'တစ်ယူနစ်ဈေး', dsp_date: 'ရက်စွဲ', dsp_note: 'မှတ်ချက်',
  dsp_saved: 'သိမ်းပြီးပါပြီ', dsp_deleted: 'ဖျက်ပြီးပါပြီ', dsp_del_confirm: 'ဤမှတ်တမ်းကို ဖျက်မည်လား?',
  dsp_none: 'မှတ်တမ်းမရှိသေးပါ', dsp_auto: 'ဆေးညွှန်းမှ အလိုအလျောက်',

  s_title: 'ဆက်တင်', s_conn: 'ချိတ်ဆက်မှု (Supabase)', s_url: 'Project URL',
  s_url_ph: 'https://xxxx.supabase.co', s_key: 'anon public key',
  s_key_ph: 'Supabase → Settings → Data API → anon key', s_clinic: 'ဆေးခန်းအမည်', s_doctor: 'ဆရာဝန်အမည်',
  s_save: 'သိမ်းမည်', s_saved: 'သိမ်းပြီးပါပြီ', s_test: 'ချိတ်ဆက်မှုစမ်းမည်',
  s_test_ok: '✅ ချိတ်ဆက်မှုအောင်မြင်ပါသည်', s_test_fail: '❌ ချိတ်ဆက်မရပါ: {0}',
  s_sync_now: '🔄 ယခု Sync လုပ်မည်', s_synced: 'Sync ပြီးပါပြီ', s_pending: 'မပို့ရသေးသောအချက်အလက်: {0}',
  s_user: 'အသုံးပြုသူ', s_role: 'အခန်းကဏ္ဍ', s_logout: '🚪 ထွက်မည်',
  s_logout_confirm: 'အကောင့်မှ ထွက်မည်လား?', s_clear: 'ဖုန်းတွင်းဒေတာရှင်းမည်',
  s_clear_confirm: 'ဖုန်းထဲသိမ်းထားသောဒေတာများ ဖျက်မည်လား? (server ပေါ်ကဒေတာ မထိပါ)', s_cleared: 'ရှင်းပြီးပါပြီ',
  s_add_user: 'အသုံးပြုသူအသစ်ထည့်ရန်', s_users: '👥 အသုံးပြုသူများ',
  s_key_help: '⚠️ anon key ကို Settings စာမျက်နှာမှာသာ ထည့်ပါ။ service_role (secret) key ကို မည်သူ့ကိုမှ မပေးပါနှင့်။',
  s_add_hint: 'တပည့်က app တွင် "အကောင့်ဖွင့်ရန်" နှိပ်၍ ကိုယ်တိုင်မှတ်ပုံတင်နိုင်သည် (တပည့်အခန်းကဏ္ဍဖြင့်)။',
  s_lang: 'ဘာသာစကား / Language',

  u_title: 'အသုံးပြုသူများ', u_role: 'အခန်းကဏ္ဍ', u_doctor: 'ဆရာဝန်', u_apprentice: 'တပည့်',
  u_saved: 'အခန်းကဏ္ဍ ပြောင်းပြီးပါပြီ', u_last_doctor: 'နောက်ဆုံးဆရာဝန်ကို ပြောင်း၍မရပါ — အရင်ဆရာဝန်အသစ်ထားပါ',

  a_login: 'ဝင်ရောက်ရန်', a_signup: 'အကောင့်ဖွင့်ရန်', a_email: 'အီးမေးလ်', a_password: 'စကားဝှက်',
  a_password2: 'စကားဝှက် (အတည်ပြုရန်)', a_name: 'အမည်', a_name_ph: 'ဥပမာ: ဒေါက်တာ...',
  a_login_btn: 'ဝင်မည်', a_signup_btn: 'အကောင့်ဖွင့်မည်', a_have_account: 'အကောင့်ရှိပြီးသားလား? ဝင်ရောက်ရန်',
  a_no_account: 'အကောင့်မရှိသေးလား? ဖွင့်ရန်',
  a_first_note: 'ℹ️ ပထမဆုံးမှတ်ပုံတင်သူက ဆရာဝန် (admin) ဖြစ်မည်။ နောက်လူများက တပည့်အခန်းကဏ္ဍဖြင့် ဝင်မည်။',
  a_welcome: 'ကြိုဆိုပါတယ်, {0}', a_fail: 'မအောင်မြင်ပါ: {0}', a_mismatch: 'စကားဝှက် ၂ ခု မတူပါ',
  a_fill_all: 'အကွက်အားလုံးဖြည့်ပါ', a_check_email: 'အီးမေးလ်အတည်ပြုရန် လိုအပ်နိုင်သည် — Supabase Auth ဆက်တင်တွင် "Confirm email" ပိတ်ထားပါ',

  su_title: 'စတင်ရန် ဆက်တင်', su_desc: 'Supabase ချိတ်ဆက်မှုထည့်ပါ (တစ်ကြိမ်တည်း)',
  su_start: 'စတင်မည်', su_need: 'URL နှင့် key ထည့်ပါ',
  su_offline: '📴 Offline သုံးမည် (Supabase မလို)', su_offline_hint: 'ဒေတာအားလုံး ဒီဖုန်းထဲမှာပဲ သိမ်းမယ်။ နောက်မှ Settings မှာ Supabase ထည့်ပြီး sync လုပ်လို့ရတယ်။',
  bk_title: 'အရန်သိမ်းဆည်းမှု (Backup)', bk_last: 'နောက်ဆုံး backup', bk_folder: 'Backup folder',
  bk_now: '💾 အခု backup လုပ်မည်', bk_saved: 'Backup သိမ်းပြီးပါပြီ ✅', bk_failed: 'Backup မအောင်မြင်ပါ: {0}',
  bk_never: 'မလုပ်ရသေးပါ', bk_downloaded: 'ဖိုင်ဒေါင်းလုဒ်လုပ်ပြီး',
  bk_browser_note: 'Browser မှာ ဖိုင်ဒေါင်းလုဒ်အနေနဲ့ သိမ်းမယ်',
  bk_auto_hint: 'App ဖွင့်တိုင်း နောက်ဆုံး backup က ၂၄ နာရီကျော်နေရင် အလိုအလျောက် backup လုပ်မယ်။',

  w_allergy: 'Allergy သတိပေးချက်', w_ped_weight: 'ကလေးလူနာ — ကိုယ်အလေးချိန်လိုအပ်သည်',
  w_ped_weight_d: 'ဆေးပမာဏ တိကျစွာစစ်ဆေးရန် ကလေး၏ ကိုယ်အလေးချိန် (kg) ကို လူနာမှတ်တမ်းတွင် ထည့်ပါ။',
  w_ped_contra: 'ကလေးတွင် မသုံးရ', w_ped_caution: 'ကလေးတွင် သတိထားသုံးရန်',
  w_ped_nodata: 'ကလေးဆေးပမာဏ သတ်မှတ်မထား', w_ped_nodata_d: '{0}: ကလေးအတွက် တရားဝင်ဆေးပမာဏ မရှိပါ — ဆရာဝန်ဆုံးဖြတ်ချက်ဖြင့် ညွှန်းပါ။',
  w_dose_cap: 'တစ်ကြိမ်ပမာဏ များနေသည်', w_dose_mgkg: 'တစ်ကြိမ်ပမာဏ (mg/kg) များနေသည်',
  w_dose_high: 'ပုံမှန်ပမာဏထက် များနေသည်', w_day_max: 'တစ်နေ့တာပမာဏ များနေသည်',
  w_preg: 'ကိုယ်ဝန်ဆောင် သတိပေးချက်', w_renal: 'ကျောက်ကပ်အခြေအနေ — ပမာဏညှိရန်',
  w_interact: 'ဆေးဓာတ်ပြုမှု ({0})', w_interact_cur: 'လက်ရှိသောက်နေသောဆေးနှင့် ဓာတ်ပြုမှု ({0})',
  w_drug_unknown: 'ဆေးဒေတာဘေ့စ်တွင် မတွေ့ပါ', w_drug_unknown_d: '{0} အတွက် အချက်အလက်မရှိသဖြင့် အပြည့်အဝစစ်ဆေးမရပါ။',

  adv_title: 'ဆေးညွှန်းအကြံပြုချက်', adv_suggest_only: '(အကြံပြုချက်သာ)', adv_source: 'ရင်းမြစ်',
  adv_note: '⚠️ အကြံပြုချက်သာဖြစ်ပြီး ဆရာဝန်၏ ဆုံးဖြတ်ချက်ကို အစားမထိုးပါ။',

  /* ===== v3: extended patient factors ===== */
  p_liver: 'အသည်းအခြေအနေ', liver_none: 'ပုံမှန်', liver_mild: 'အနည်းငယ်',
  liver_moderate: 'အလယ်အလတ်', liver_severe: 'ပြင်းထန်',
  p_g6pd: 'G6PD ချို့တဲ့ခြင်း', p_hf: 'နှလုံးအားနည်းခြင်း',
  p_asthma_copd: 'ပန်းနာ / COPD', p_epilepsy: 'တက်ခြင်း (Epilepsy)',
  p_thyroid: 'သိုင်းရွိုက်ရောဂါ', p_smoking: 'ဆေးလိပ်သောက်ခြင်း', p_alcohol: 'အရက်သောက်ခြင်း',
  smoke_no: 'မသောက်ပါ', smoke_occ: 'တစ်ခါတစ်ရံ', smoke_daily: 'နေ့စဉ်',
  alc_no: 'မသောက်ပါ', alc_occ: 'တစ်ခါတစ်ရံ', alc_reg: 'ပုံမှန်',
  p_elderly: 'သက်ကြီးရွယ်အို (≥65)',

  /* ===== v3: vitals ===== */
  v_vitals: 'အသက်လက္ခဏာများ (Vitals)',
  vit_bp_sys: 'သွေးပေါင်ချိန် အပေါ် (sys)', vit_bp_dia: 'သွေးပေါင်ချိန် အောက် (dia)',
  vit_hr: 'နှလုံးခုန်နှုန်း (/min)', vit_wt: 'အလေးချိန် (kg)',
  vit_temp: 'အပူချိန် (°F)', vit_rbs: 'RBS (mg/dL)', vit_fbs: 'FBS (mg/dL)', vit_hba1c: 'HbA1c (%)',

  /* ===== v3: investigations + DDx ===== */
  inv_suggest_btn: '🔬 စစ်ဆေးချက်အကြံပြုချက်', inv_title: 'စစ်ဆေးရန်အကြံပြုချက်များ',
  inv_planned: 'စီစဉ်ထားသောစစ်ဆေးချက်များ', inv_source: 'ရင်းမြစ်',
  inv_added: 'စစ်ဆေးချက်ထည့်ပြီးပါပြီ', inv_none: 'ရောဂါလက္ခဏာနှင့်ကိုက်ညီသော အကြံပြုချက်မတွေ့ပါ',
  ddx_btn: '🩺 လုပ်ဖော်ဆရာဝန်အကြံ (DDx)', ddx_title: 'လုပ်ဖော်ဆရာဝန်အကြံ — ဖြစ်နိုင်သောရောဂါများ',
  ddx_reason: 'အကြောင်းရင်း', ddx_redflags: '🚩 အနီရောင်အချက်ပြများ (သတိထား)',
  ddx_summary_btn: '📋 Case summary ထုတ်မည်', ddx_summary_title: 'Case Presentation (Senior သို့တင်ပြရန်)',
  ddx_copy: '📋 ကူးယူမည်', ddx_copied: 'ကူးယူပြီးပါပြီ', ddx_none: 'မတွေ့ပါ — ရောဂါလက္ခဏာကို ရှင်းရှင်းရေးပါ',

  /* ===== v3: food timing ===== */
  tim_label: 'အစားအသောက်နှင့်ဆက်စပ်မှု',
  tim_after_food: 'အစာစားပြီးတိုင်း', tim_before_food: 'အစာမစားမီ', tim_with_food: 'အစာနှင့်အတူ',
  tim_bedtime: 'အိပ်ရာဝင်ချိန်', tim_morning: 'မနက်ပိုင်း', tim_any: 'အချိန်မရွေး',
  rx_autofill_timing: '⏱️ ဆေးအချိန်အလိုအလျောက် ဖြည့်မည်',

  /* ===== v3: pharmacist review ===== */
  ph_title: 'ဆေးပညာရှင်ပြန်လည်စစ်ဆေးချက် (Pharmacist review)',
  ph_dup: '🔁 ထပ်နေသောကုထုံး (Duplicate therapy)',
  ph_counsel: '🗣️ လူနာအားပြောပြရန် (Counseling)',
  ph_note: 'ဆေးပညာရှင်မှတ်ချက်', ph_note_ph: 'ဥပမာ: ပမာဏပြန်စစ်ပြီး — မှန်ကန်ပါသည်',
  ph_std: 'ပုံမှန်စံပမာဏအတိုင်း — အထူးသတိပြုရန်မရှိ',

  /* ===== v3: follow-up trends ===== */
  fu_trend: '📈 အသက်လက္ခဏာလမ်းကြောင်း',
  fu_bp3: 'သွေးပေါင်ချိန် ၃ ကြိမ်ဆက် ≥140/90 — ကုထုံးတိုးမြှင့်ရန် စဉ်းစားပါ (WHO HEARTS)',
  fu_bp_urgent: 'သွေးပေါင်ချိန်အလွန်မြင့် (≥180/110) — အရေးပေါ်ပြန်လည်စစ်ဆေးပါ (WHO HEARTS)',
  fu_glucose: 'သွေးတွင်းသကြားဓာတ်များနေသည် — ထိန်းချုပ်မှုပြန်လည်သုံးသပ်ပါ (ADA Standards of Care)',

  /* ===== v3: guest mode ===== */
  nav_kb: 'အသိပညာ',
  g_welcome_title: 'ဆေးခန်းမှတ်တမ်းမှ ကြိုဆိုပါတယ်',
  g_welcome_sub: 'မည်သို့ဆက်လုပ်မလဲ ရွေးချယ်ပါ',
  g_btn_guest: '👤 Guest mode (ကြည့်ရှုရန်သာ)',
  g_btn_full: '🔓 Complete version',
  g_password: 'စကားဝှက်', g_wrong: '❌ စကားဝှက်မှားနေပါသည်',
  g_banner: '👤 Guest mode — ကြည့်ရှုရန်သာ',
  g_unlock: '🔓 Complete version ဖွင့်မည်',
  g_upgrade_title: '🔓 Complete version ဖွင့်ရန်',
  g_upgrade_d: 'ဤလုပ်ဆောင်ချက်အတွက် complete version လိုအပ်ပါသည်။ ဆရာဝန်ထံမှ ရထားသော စကားဝှက်ထည့်ပါ။',
  g_home_drugs: '💊 ဆေးအဘိဓာန်ကြည့်ရန်', g_home_kb: '🔬 စစ်ဆေးချက် + DDx အသိပညာ',
  g_readonly: 'ℹ️ ကြည့်ရှုရန်သာ — မှတ်တမ်းသိမ်းဆည်းခြင်း မရှိပါ',
  g_kb_title: '🔬 စစ်ဆေးချက် + DDx အသိပညာ',
  g_demo_ph: 'ရောဂါလက္ခဏာရိုက်ထည့်ပါ (ဥပမာ: fever, cough / အဖျား, ချောင်းဆိုး)',
  g_demo_btn: '🔍 အကြံပြုချက်ရှာမည်',

  disc2: 'ဤအကြံပြုချက်များသည် အကူအညီသက်သက်ဖြစ်ပြီး ဆရာဝန်၏ဆုံးဖြတ်ချက်ကို အစားမထိုးပါ။',

  disc: '⚠️ ဤအက်ပ်သည် အကူအညီပေးစနစ်သာဖြစ်ပြီး ဆရာဝန်၏ ဆုံးဖြတ်ချက်ကို အစားမထိုးပါ။ သတိပေးချက်များသည် အကြံပြုချက်သာဖြစ်သည်။',
  offline: '📴 offline', sync_wait: '🔄 {0} စောင့်', sync_ok: '✅ sync',
},

/* ================= ENGLISH ================= */
en: {
  appName: 'Clinic', tagline: 'Clinic EMR',
  nav_dashboard: 'Home', nav_patients: 'Patients', nav_drugs: 'Drugs', nav_followup: 'Follow-up', nav_analytics: 'Reports',
  save: 'Save', cancel: 'Cancel', close: 'Close', edit: 'Edit', delete: 'Delete',
  add: 'Add', search: 'Search', back: '← Back', confirm: 'Confirm', print: 'Print',
  all: 'All', view_all: 'View all →', open: 'Open', mark_done: '✅ Done', years: 'yrs', kg: 'kg', kyat: 'MMK',

  d_today_patients: "Today's patients", d_followups: 'Follow-ups due', d_month_revenue: 'Month revenue (MMK)',
  d_due_today: 'Due for follow-up today', d_overdue: 'Overdue', d_new_patient: '➕ New patient',
  d_find_patient: '🔍 Find patient', d_none_today: 'None today', d_role_apprentice: 'User: {0} (apprentice)',

  p_title: 'Patients', p_search_ph: '🔍 Search by name / phone', p_new: 'Register new patient',
  p_name: 'Name *', p_age: 'Age', p_years_old: '{0} yrs', p_sex: 'Sex', p_male: 'Male', p_female: 'Female',
  p_phone: 'Phone', p_weight: 'Weight (kg)', p_allergies: 'Allergies (comma separated)',
  p_allergies_ph: 'e.g. penicillin, sulfa', p_chronic: 'Chronic conditions', p_chronic_ph: 'e.g. HTN, T2DM',
  p_current_meds: 'Current medications', p_current_meds_ph: 'comma separated',
  p_pregnant: 'Pregnant', p_renal: 'Renal impairment', p_notes: 'Notes',
  p_need_name: 'Please enter a name', p_saved: 'Patient registered', p_updated: 'Saved',
  p_visits: 'Visit history', p_prescriptions: 'Prescriptions', p_followups: 'Follow-ups',
  p_new_visit: '🩺 New visit', p_new_rx: '💊 New prescription', p_edit: '✏️ Edit', p_delete: '🗑️ Delete',
  p_none: 'None yet', p_no_patient: 'No patients yet', p_del_confirm: 'Delete this patient and all records?',
  p_deleted: 'Deleted', p_edit_title: 'Edit patient', p_allergy_is: 'Allergy', p_chronic_is: 'Chronic',

  v_new: 'New visit', v_date: 'Date', v_complaint: 'Chief complaint',
  v_history: 'History', v_exam: 'Examination findings',
  v_diagnosis: 'Diagnosis', v_diagnosis_ph: 'e.g. Hypertension',
  v_plan: 'Treatment plan', v_next_visit: 'Next follow-up date',
  v_fee_consult: 'Consultation fee (MMK)', v_fee_medicine: 'Medicine charges (MMK)',
  v_saved: 'Visit saved', v_save_rx: '💾+💊 Save & prescribe',
  v_advice_btn: '💡 Advice', v_no_advice: 'No advice available for this diagnosis',
  v_billing: 'Billing', v_next_date: 'Return date', v_tpl_inserted: '"{0}" inserted',

  t_title: 'Note templates', t_new: 'New template', t_code: 'Shorthand (e.g. htn)',
  t_name: 'Title', t_field: 'Field', t_body: 'Template text', t_saved: 'Saved',
  t_deleted: 'Deleted', t_del_confirm: 'Delete this template?', t_none: 'No templates yet',
  t_hint: 'Tap a shorthand chip while writing a note to insert the template text.',
  f_complaint: 'Complaint', f_history: 'History', f_exam: 'Exam', f_plan: 'Plan',

  rx_new: 'New prescription', rx_search_ph: '🔍 Type drug name (e.g. amox)',
  rx_add: 'Add drug', rx_list: 'Drug list', rx_formulation: 'Formulation', rx_dose: 'Dose',
  rx_unit: 'Unit', rx_freq: 'Frequency', rx_days: 'Days', rx_qty: 'Quantity',
  rx_price: 'Unit price (MMK)', rx_instructions: 'Instructions', rx_instructions_ph: 'e.g. take after food',
  rx_add_to_list: 'Add to list', rx_check: '🔍 Check drugs', rx_save_print: '💾 Save & print',
  rx_no_warn: '✅ No warnings — safe to save the prescription', rx_warnings: 'Warnings',
  rx_ack: 'I have reviewed the warnings and will proceed as the doctor (override)',
  rx_saved: 'Prescription saved', rx_need_items: 'Add a drug first',
  rx_need_check: 'Warnings present — tap "Check drugs" and acknowledge (override) first',
  rx_added: 'Added', rx_close: 'Close', rx_not_found: 'Not found',
  rx_child: 'Child', rx_no_weight: 'no weight',
  rx_weight_needed: "Child's weight is missing — weight is needed for accurate dose checking.",
  rx_ask_weight: '⚖️ Enter weight', rx_weight_title: "Child's weight",
  rx_ped_dose: 'Child', rx_adult_dose: 'Adult', rx_ped_contra_box: '⛔ Contraindicated in children',
  rx_detail: 'Prescription', rx_patient: 'Patient', rx_overridden: '{0} overridden warning(s)',
  rx_del_confirm: 'Delete this prescription?', rx_deleted: 'Deleted',
  rx_print_title: "Doctor's signature", rx_print_note: 'Prescribed at the discretion of the treating doctor.',
  rx_no: '#', rx_drug: 'Drug', rx_form: 'Form', rx_amount: 'Dose', rx_times: 'Freq', rx_dayn: 'Days', rx_how: 'Instructions',

  dr_title: 'Drugs', dr_search_ph: '🔍 Search generic / brand', dr_new: 'Add new drug',
  dr_brands: 'Brand names (separate with ;)', dr_forms: 'Formulations/strengths (separate with ;)',
  dr_category: 'Category', dr_ind: 'Indications', dr_dose_adult: 'Adult dosing',
  dr_dose_ped: 'Pediatric dosing (precise mg/kg)', dr_ped_flag: 'Pediatric status',
  dr_dose_renal: 'Renal dosing', dr_ci: 'Contraindications', dr_inter: 'Drug interactions',
  dr_inter_hint: 'One per line: drug name | major/moderate/minor | note',
  dr_contra: 'Absolute contraindications (with reasons)',
  dr_contra_keys: 'Contraindication keywords (; separated, English)',
  dr_prec: 'Precautions (elderly/hepatic/food/monitoring)',
  dr_allergy: 'Allergy cross-reactivity', dr_preg: 'Pregnancy/breastfeeding', dr_mon: 'Monitoring',
  dr_saved: 'Saved', dr_deleted: 'Deleted', dr_del_confirm: 'Delete this drug?',
  dr_not_found: 'Drug not found', dr_none: 'No drugs yet', dr_import: '📥 Import CSV',
  dr_count: 'Total drugs: {0}', dr_show_more: 'Show more ({0} remaining)',
  dr_import_done: 'Imported: {0} drugs', dr_hint_doc: 'Only the doctor can add/edit/delete',
  ped_ok: 'Standard', ped_caution: 'Caution', ped_contra: 'Contra', ped_no_data: 'No data',

  fu_title: 'Follow-ups', fu_today: 'Today', fu_overdue: 'Overdue', fu_upcoming: 'Upcoming',
  fu_done_msg: 'Marked done', fu_none: 'None',

  an_title: 'Sales analytics', an_top_qty: 'Top-selling drugs (quantity)',
  an_top_rev: 'Top-selling drugs (revenue)', an_by_dx: 'Drug classes by diagnosis',
  an_trend: '14-day sales trend', an_30: '30 days', an_all: 'All time',
  an_none: 'No data yet', an_qty: 'Qty', an_revenue: 'Revenue',

  b_title: 'Billing records', b_pick_month: 'Pick month', b_consult: 'Consultation', b_medicine: 'Medicine',
  b_total: 'Total', b_none: 'No records this month', b_visits: 'Patients',

  dsp_title: 'Dispensing log', dsp_new: 'Add manually', dsp_drug: 'Drug',
  dsp_qty: 'Quantity', dsp_price: 'Unit price', dsp_date: 'Date', dsp_note: 'Note',
  dsp_saved: 'Saved', dsp_deleted: 'Deleted', dsp_del_confirm: 'Delete this record?',
  dsp_none: 'No records', dsp_auto: 'Auto from prescription',

  s_title: 'Settings', s_conn: 'Connection (Supabase)', s_url: 'Project URL',
  s_url_ph: 'https://xxxx.supabase.co', s_key: 'anon public key',
  s_key_ph: 'Supabase → Settings → Data API → anon key', s_clinic: 'Clinic name', s_doctor: "Doctor's name",
  s_save: 'Save', s_saved: 'Saved', s_test: 'Test connection',
  s_test_ok: '✅ Connection successful', s_test_fail: '❌ Connection failed: {0}',
  s_sync_now: '🔄 Sync now', s_synced: 'Sync complete', s_pending: 'Pending uploads: {0}',
  s_user: 'User', s_role: 'Role', s_logout: '🚪 Log out',
  s_logout_confirm: 'Log out of this account?', s_clear: 'Clear phone data',
  s_clear_confirm: 'Clear data stored on this phone? (server data untouched)', s_cleared: 'Cleared',
  s_add_user: 'Add user', s_users: '👥 Users',
  s_key_help: '⚠️ Enter the anon key in Settings only. Never share the service_role (secret) key with anyone.',
  s_add_hint: 'The apprentice can tap "Sign up" in the app to self-register (apprentice role).',
  s_lang: 'ဘာသာစကား / Language',

  u_title: 'Users', u_role: 'Role', u_doctor: 'Doctor', u_apprentice: 'Apprentice',
  u_saved: 'Role updated', u_last_doctor: 'Cannot change the last doctor — appoint another doctor first',

  a_login: 'Log in', a_signup: 'Sign up', a_email: 'Email', a_password: 'Password',
  a_password2: 'Password (confirm)', a_name: 'Name', a_name_ph: 'e.g. Dr. ...',
  a_login_btn: 'Log in', a_signup_btn: 'Sign up', a_have_account: 'Have an account? Log in',
  a_no_account: "No account yet? Sign up",
  a_first_note: 'ℹ️ The first person to sign up becomes the doctor (admin). Later signups get the apprentice role.',
  a_welcome: 'Welcome, {0}', a_fail: 'Failed: {0}', a_mismatch: 'Passwords do not match',
  a_fill_all: 'Please fill all fields', a_check_email: 'Email confirmation may be required — turn off "Confirm email" in Supabase Auth settings',

  su_title: 'Initial setup', su_desc: 'Enter your Supabase connection (one time)',
  su_start: 'Start', su_need: 'Please enter URL and key',
  su_offline: '📴 Use offline only (no Supabase)', su_offline_hint: 'All data stays on this phone. You can add Supabase sync later in Settings.',
  bk_title: 'Backup', bk_last: 'Last backup', bk_folder: 'Backup folder',
  bk_now: '💾 Backup now', bk_saved: 'Backup saved ✅', bk_failed: 'Backup failed: {0}',
  bk_never: 'Never', bk_downloaded: 'downloaded file',
  bk_browser_note: 'Saved as a downloaded file in the browser',
  bk_auto_hint: 'Auto-backup runs on launch when the last backup is over 24h old.',

  w_allergy: 'Allergy alert', w_ped_weight: 'Child patient — weight needed',
  w_ped_weight_d: "Enter the child's weight (kg) in the patient record for accurate dose checking.",
  w_ped_contra: 'Contraindicated in children', w_ped_caution: 'Use with caution in children',
  w_ped_nodata: 'No established pediatric dose', w_ped_nodata_d: '{0}: no established pediatric dose — prescribe at your discretion.',
  w_dose_cap: 'Single dose too high', w_dose_mgkg: 'Single dose (mg/kg) too high',
  w_dose_high: 'Above usual dose', w_day_max: 'Daily dose too high',
  w_preg: 'Pregnancy warning', w_renal: 'Renal impairment — adjust dose',
  w_interact: 'Drug interaction ({0})', w_interact_cur: 'Interaction with current medication ({0})',
  w_drug_unknown: 'Not in drug database', w_drug_unknown_d: '{0}: no data — could not fully check.',

  adv_title: 'Prescribing advice', adv_suggest_only: '(suggestions only)', adv_source: 'Source',
  adv_note: '⚠️ Suggestions only — they do not replace the doctor\'s judgment.',

  /* ===== v3: extended patient factors ===== */
  p_liver: 'Liver status', liver_none: 'Normal', liver_mild: 'Mild',
  liver_moderate: 'Moderate', liver_severe: 'Severe',
  p_g6pd: 'G6PD deficiency', p_hf: 'Heart failure',
  p_asthma_copd: 'Asthma / COPD', p_epilepsy: 'Epilepsy',
  p_thyroid: 'Thyroid disease', p_smoking: 'Smoking', p_alcohol: 'Alcohol use',
  smoke_no: 'No', smoke_occ: 'Occasional', smoke_daily: 'Daily',
  alc_no: 'No', alc_occ: 'Occasional', alc_reg: 'Regular',
  p_elderly: 'Elderly (≥65)',

  /* ===== v3: vitals ===== */
  v_vitals: 'Vitals',
  vit_bp_sys: 'BP systolic', vit_bp_dia: 'BP diastolic',
  vit_hr: 'Heart rate (/min)', vit_wt: 'Weight (kg)',
  vit_temp: 'Temp (°F)', vit_rbs: 'RBS (mg/dL)', vit_fbs: 'FBS (mg/dL)', vit_hba1c: 'HbA1c (%)',

  /* ===== v3: investigations + DDx ===== */
  inv_suggest_btn: '🔬 Investigation suggestions', inv_title: 'Suggested investigations',
  inv_planned: 'Planned investigations', inv_source: 'Source',
  inv_added: 'Investigation added', inv_none: 'No matching suggestions — describe the symptoms more clearly',
  ddx_btn: '🩺 Colleague advice (DDx)', ddx_title: 'Colleague advice — possible diagnoses',
  ddx_reason: 'Reasoning', ddx_redflags: '🚩 Red flags (watch for)',
  ddx_summary_btn: '📋 Generate case summary', ddx_summary_title: 'Case Presentation (for senior review)',
  ddx_copy: '📋 Copy', ddx_copied: 'Copied', ddx_none: 'None found — describe the symptoms more clearly',

  /* ===== v3: food timing ===== */
  tim_label: 'Food timing',
  tim_after_food: 'after food', tim_before_food: 'before food', tim_with_food: 'with food',
  tim_bedtime: 'at bedtime', tim_morning: 'in the morning', tim_any: 'any time',
  rx_autofill_timing: '⏱️ Auto-fill food timing',

  /* ===== v3: pharmacist review ===== */
  ph_title: 'Pharmacist review',
  ph_dup: '🔁 Duplicate therapy',
  ph_counsel: '🗣️ Counseling points',
  ph_note: 'Pharmacist note', ph_note_ph: 'e.g. dose re-verified — correct',
  ph_std: 'Standard dosing — nothing special flagged',

  /* ===== v3: follow-up trends ===== */
  fu_trend: '📈 Vitals trend',
  fu_bp3: 'BP ≥140/90 on 3 consecutive visits — consider intensifying therapy (WHO HEARTS)',
  fu_bp_urgent: 'Very high BP (≥180/110) — urgent review needed (WHO HEARTS)',
  fu_glucose: 'High blood glucose — review glycaemic control (ADA Standards of Care)',

  /* ===== v3: guest mode ===== */
  nav_kb: 'Knowledge',
  g_welcome_title: 'Welcome to Clinic EMR',
  g_welcome_sub: 'Choose how to continue',
  g_btn_guest: '👤 Guest mode (view only)',
  g_btn_full: '🔓 Complete version',
  g_password: 'Password', g_wrong: '❌ Wrong password',
  g_banner: '👤 Guest mode — view only',
  g_unlock: '🔓 Unlock complete version',
  g_upgrade_title: '🔓 Unlock complete version',
  g_upgrade_d: 'This feature needs the complete version. Enter the password from the doctor.',
  g_home_drugs: '💊 Browse drug reference', g_home_kb: '🔬 Investigations + DDx knowledge',
  g_readonly: 'ℹ️ View only — nothing is saved',
  g_kb_title: '🔬 Investigations + DDx knowledge',
  g_demo_ph: 'Type symptoms (e.g. fever, cough)',
  g_demo_btn: '🔍 Get suggestions',

  disc2: 'These suggestions are for assistance only and do not replace the doctor\'s judgment.',

  disc: '⚠️ This app assists only and does not replace clinical judgment. Warnings are advisory.',
  offline: '📴 offline', sync_wait: '🔄 {0} pending', sync_ok: '✅ sync',
}
};
