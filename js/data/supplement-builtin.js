// ─── EXCALIBUR OS — Supplement Built-in Data ─────────────────
// Extracted from Biohack OS biohack-os.html

var BUILTIN = [
  { id:"mb", name:"Methylene Blue", icon:"⚡", color:"#00b4d8", cat:"Energy",
    dose:"15mg", unit:"mg", timing:"wake", gymTiming:"wake", food:false,
    foodNote:"Empty stomach only — wait 15–20 min before eating",
    hasCycle:true, cycleType:"days", daysOn:5, daysOff:2,
    cycleNote:"5 days ON / 2 days OFF",
    cycleWhy:"Continuous daily use causes mitochondrial adaptation — cells stop responding to the electron transport boost. The 2 rest days reset hormetic sensitivity so MB keeps working at full effect. Without breaks, cognitive enhancement fades within 2–3 months.",
    instructions:"Take first thing upon waking on empty stomach. Stimulatory — MORNING ONLY. Mild blue tint to urine is normal.",
    benefits:"70% cytochrome oxidase activity increase (1mg/kg animal), 7% memory retrieval improvement (human fMRI), ETC optimization",
    synergies:"Creatine: dual brain energy layers. Lion's Mane: complementary neuroprotection. Keep dose low given ashwagandha in stack.",
    warns:["⚠️ CRITICAL — FDA Black Box: Never combine with SSRIs, SNRIs, MAOIs, 5-HTP, St. John's Wort (serotonin syndrome risk)","⚠️ Ashwagandha mildly affects serotonin — keep MB at ≤15mg in this stack","⚠️ Hormetic compound — never exceed ~4mg/kg"],
    timingNote:"Take immediately upon waking. Stimulatory — morning ONLY",
    minDose:5, maxDose:30, safetyThreshold:25,
    safetyMsg:"⚠️ Approaching hormetic reversal point (>30mg). Higher doses inhibit the same enzymes they are meant to support. FDA black box risk increases above 20mg.",
    hardCeiling:60, ceilingMsg:"⛔ Hard ceiling exceeded — MB reverses from enhancing to inhibiting Complex IV above ~4mg/kg body weight" },

  { id:"rhodiola", name:"Rhodiola Rosea", icon:"🌿", color:"#f77f00", cat:"Adaptogen",
    dose:"500mg", unit:"mg", timing:"meal1", gymTiming:"meal1", food:true,
    foodNote:"Take with first meal. BioPerine boosts absorption of other meal-1 supplements by ~30–60%",
    hasCycle:true, cycleType:"weeks", weeksOn:10, weeksOff:3,
    cycleNote:"8–10 weeks ON / 2–3 weeks OFF",
    cycleWhy:"Rhodiola modulates serotonin, dopamine, norepinephrine and mildly inhibits MAO. Continuous use causes monoamine receptor downregulation — anti-fatigue effects diminish around weeks 10–14. Some users develop paradoxical irritability. 2–3 week break fully resets receptor sensitivity.",
    instructions:"Energizing adaptogen — take early in your day. Do NOT take within 4–5 hours of bedtime.",
    benefits:"~30% fatigue reduction (28-day RCT), ~5% VO2peak boost (acute 200mg), cortisol thermostat effect",
    synergies:"Ashwagandha (PM) + Rhodiola (AM) = complete HPA axis support. BioPerine boosts meal-1 supplements.",
    warns:["⚠️ Do NOT take within 4–5 hours of bedtime — stimulatory effect disrupts sleep"],
    timingNote:"Energizing — early day only",
    minDose:200, maxDose:600, safetyThreshold:581,
    safetyMsg:"⚠️ HARD CEILING — Rhodiola has a documented bell-curve dose response. Above 680mg effectiveness DECREASES and paradoxical sedation may emerge.",
    hardCeiling:680, ceilingMsg:"⛔ Exceeded documented bell-curve ceiling. Effectiveness drops, adverse effects increase." },

  { id:"shilajit", name:"Shilajit (PrimaVie)", icon:"🏔️", color:"#a0522d", cat:"Energy",
    dose:"500mg", unit:"mg", timing:"meal1", gymTiming:"meal1", food:true,
    foodNote:"Take with food — fulvic acid works synergistically with meal nutrients",
    hasCycle:false, cycleNote:"Daily — no cycling needed",
    cycleWhy:"Shilajit replaces mineral deficiencies and provides fulvic acid as a natural electron carrier. No receptor tolerance develops.",
    instructions:"Take with first meal. PrimaVie is the only shilajit form used in human testosterone RCTs.",
    benefits:"20.45% total testosterone increase (500mg/day, 90-day RCT, n=60), 19.14% free testosterone, 31% DHEAS increase",
    synergies:"Ashwagandha: synergistic testosterone pair. Creatine: complementary ATP mechanisms.",
    warns:["Space 2+ hours from chlorella — fulvic acid competes with chlorella's metal-binding"],
    timingNote:"With food — fulvic acid needs meal nutrients",
    minDose:200, maxDose:1000, safetyThreshold:501,
    safetyMsg:"⚠️ Above 500mg: only one human RCT exists for PrimaVie at this dose. Limited safety data above 500mg.",
    hardCeiling:2000, ceilingMsg:"⚠️ Very high dose — no human safety data at this level" },

  { id:"lm", name:"Lion's Mane (FreshCap)", icon:"🍄", color:"#80b918", cat:"Cognition",
    dose:"1000mg", unit:"mg", timing:"meal1", gymTiming:"meal1", food:true,
    foodNote:"Take with food",
    hasCycle:false, cycleNote:"Daily — NGF benefits build progressively",
    cycleWhy:"Lion's mane stimulates NGF through structural neuroplasticity. This pathway does not downregulate with continuous use.",
    instructions:"FreshCap 14:1 extract with 31% beta-glucans delivers ~14g raw equivalent. Allow 4–6 weeks for benefits to manifest.",
    benefits:"~5× NGF mRNA increase (in vitro), 60.6% neurite outgrowth, significant cognitive improvement (16-week human RCT)",
    synergies:"MgT + Lion's Mane = best nootropic pairing. MB + LM = complementary neuroprotection.",
    warns:["Allow 4–8 weeks before judging effectiveness"],
    timingNote:"Morning/day — cognitive support",
    minDose:500, maxDose:3000, safetyThreshold:2001,
    safetyMsg:"ℹ️ Above 2g: exceeds studied doses. No safety concern documented but limited data.",
    hardCeiling:5000, ceilingMsg:"ℹ️ Very high dose — monitor for any digestive sensitivity" },

  { id:"creatine", name:"Creatine Monohydrate", icon:"💪", color:"#4cc9f0", cat:"Performance",
    dose:"5g", unit:"g", timing:"meal1", gymTiming:"pregym", food:true,
    foodNote:"Rest days: first meal. GYM DAYS: shift to pre-gym for max phosphocreatine loading",
    hasCycle:false, cycleNote:"Daily — no cycling needed",
    cycleWhy:"Creatine replenishes phosphocreatine stores depleted by training. Works through substrate availability, not receptor signaling.",
    instructions:"NON-GYM DAYS: with first meal. GYM DAYS: pre-workout (~11 PM). Stay well hydrated.",
    benefits:"Memory +0.31 SMD, processing speed +0.51 SMD (2024 meta-analysis), 5–15% strength increase",
    synergies:"MB + Creatine = dual brain energy. Shilajit + Creatine = performance via different ATP pathways.",
    warns:["Minimum 3L water daily — creatine draws water into muscle cells","GYM DAYS: shift dose to pre-workout"],
    timingNote:"Rest day: first meal. Gym day: pre-workout",
    minDose:2, maxDose:20, safetyThreshold:10.1,
    safetyMsg:"ℹ️ Above 10g: no additional strength/cognitive benefit. Muscle creatine has a physiological ceiling regardless of dose.",
    hardCeiling:25, ceilingMsg:"⚠️ Very high dose — GI distress, osmotic diarrhea likely" },

  { id:"chlorella", name:"Chlorella Powder", icon:"🌱", color:"#38b000", cat:"Detox",
    dose:"5g", unit:"g", timing:"alone", gymTiming:"alone", food:false,
    foodNote:"Mix in water — MUST be taken alone, isolated from all other supplements",
    hasCycle:false, cycleNote:"Daily — no cycling needed",
    cycleWhy:"Chlorella's metal-binding and immune effects are physical/cellular mechanisms that do not create tolerance.",
    instructions:"⚠️ STRICT: Take at 3:30–4 PM window, at least 2 hours from ALL other supplements. Cell wall binds zinc, copper, magnesium, calcium in GI tract.",
    benefits:"NK cell activity +10% (8-week RCT), IFN-γ +152% above placebo, blocks heavy metal absorption",
    synergies:"Chlorella + Oregano Oil (2h apart) = comprehensive gut protocol.",
    warns:["⚠️ MANDATORY 2+ hour separation from ALL other supplements","⚠️ 1+ hour separation from any probiotic"],
    timingNote:"Alone window only — 2h away from everything",
    minDose:1, maxDose:15, safetyThreshold:6.1,
    safetyMsg:"⚠️ Above 6g: increased risk of GI discomfort and excessive vitamin K intake. Immune data is for 5g/day.",
    hardCeiling:20, ceilingMsg:"⚠️ Very high dose — significant GI distress, excessive vitamin K" },

  { id:"oregano", name:"Oregano Oil C93 + Garlic", icon:"🌶️", color:"#ff6b35", cat:"Antimicrobial",
    dose:"0.5ml", unit:"ml", timing:"dinner", gymTiming:"dinner", food:true,
    foodNote:"ALWAYS with food — 93% carvacrol causes GI distress on empty stomach",
    hasCycle:true, cycleType:"course", courseWksOn:4, courseWksOff:4,
    cycleNote:"2–6 week COURSES only — NOT indefinite",
    cycleWhy:"Carvacrol at 93% cannot distinguish pathogenic from beneficial organisms. Extended use depletes Lactobacillus and Bifidobacterium strains.",
    instructions:"Targeted courses only. Separate from probiotics by 2–3 hours. Use prebiotic during/after course.",
    benefits:"MIC against S. aureus ~81μg/mL, Candida 128–512μg/mL, broad-spectrum biofilm disruption",
    synergies:"Oregano Oil + Chlorella (2h gap) = antimicrobial + metal detox.",
    warns:["⚠️ COURSES ONLY — 2–6 weeks maximum","⚠️ 2–3 hour separation from any probiotic"],
    timingNote:"With food — always",
    minDose:0.1, maxDose:2, safetyThreshold:1.1,
    safetyMsg:"⚠️ Above 1ml per dose: risk of mucous membrane irritation and accelerated microbiome disruption.",
    hardCeiling:3, ceilingMsg:"⛔ Very high dose — significant GI/mucosal irritation risk" },

  { id:"minerals", name:"Optimized Minerals", icon:"⚗️", color:"#ffd60a", cat:"Foundation",
    dose:"1", unit:"scoop", timing:"dinner", gymTiming:"dinner", food:true,
    foodNote:"Take with substantial meal — fat aids mineral absorption",
    hasCycle:false, cycleNote:"Daily — foundation supplement",
    cycleWhy:"Mineral supplementation replaces genuine dietary deficiencies. No receptor tolerance.",
    instructions:"Contains 200mg elemental Mg (malate) — COUNTS toward daily Mg budget. Also: methylated B12/folate, taurine 250mg, ginkgo 250mg, 70+ trace minerals, vitamin C 500mg.",
    benefits:"70+ ionic trace minerals, methylated B-complex, 500mg Vitamin C, 250mg taurine, 250mg ginkgo biloba",
    synergies:"Methylated B12 supports ashwagandha stress-response. Ginkgo + Lion's Mane = additive cerebral blood flow.",
    warns:["⚠️ Contains 200mg elemental Mg — counts toward total Mg budget","⚠️ 2+ hour separation from chlorella REQUIRED"],
    timingNote:"With dinner — substantial meal needed",
    minDose:0.5, maxDose:2, safetyThreshold:1.1,
    safetyMsg:"⚠️ Above 1 scoop: exceeds intended dose, doubles all minerals including Mg contribution.",
    hardCeiling:3, ceilingMsg:"⚠️ Very high dose — excessive mineral intake" },

  { id:"ashwa", name:"Ashwagandha (Shoden)", icon:"🧘", color:"#e63946", cat:"Adaptogen/Sleep",
    dose:"120mg", unit:"mg", timing:"winddown", gymTiming:"winddown", food:false,
    foodNote:"Can be taken without food; if sensitive, take with small snack",
    hasCycle:true, cycleType:"weeks", weeksOn:10, weeksOff:3,
    cycleNote:"8–10 weeks ON / 2–3 weeks OFF — non-negotiable",
    cycleWhy:"Ashwagandha works through GABA-A receptors and HPA axis modulation. After 3–4 months: GABAergic calming diminishes, sustained cortisol suppression blunts motivation, 'flat affect' reported, 6 documented cases of liver enzyme elevation with long-term high-dose use.",
    instructions:"Take 1.5–2 hours BEFORE target sleep time. Shoden at 35% withanolide glycosides is 7× more potent per mg than KSM-66.",
    benefits:"66–67% cortisol reduction vs placebo (60-day RCT, p<0.0001), 33% testosterone increase at 120mg, sleep quality +72% vs +29% placebo",
    synergies:"Shilajit + Ashwagandha = Ayurvedic testosterone pair. MgT + MgGly + Ashwagandha = powerful sleep stack.",
    warns:["⚠️ MUST CYCLE: 8–10 weeks on, 2–3 weeks off","⚠️ Both MB and ashwagandha affect serotonin — keep MB at ≤15mg","⚠️ Thyroid conditions: ashwagandha can alter thyroid hormone levels"],
    timingNote:"1.5–2h before sleep — calming, do NOT take in morning",
    minDose:60, maxDose:600, safetyThreshold:241,
    safetyMsg:"⚠️ Above 240mg: exceeds studied Shoden doses. Liver enzyme monitoring recommended at high doses.",
    hardCeiling:800, ceilingMsg:"⛔ Very high dose — liver enzyme elevation risk increases significantly" },

  { id:"mgt", name:"Magnesium L-Threonate", icon:"🧠", color:"#7b2d8b", cat:"Cognition/Sleep",
    dose:"4", unit:"caps", timing:"winddown", gymTiming:"winddown", food:false,
    foodNote:"No food required. Split: 2 caps at wind-down, 2 caps at bedtime",
    hasCycle:false, cycleNote:"Daily — cognitive/sleep benefits are cumulative",
    cycleWhy:"MgT raises brain magnesium concentration — structural mineral replenishment, not receptor signaling. No downregulation.",
    instructions:"SPLIT DOSE: 2 caps at wind-down + 2 caps at bedtime. Each cap = 500mg MgT / 36mg elemental Mg.",
    benefits:"7–15% brain magnesium increase (CSF), memory improvement p<0.001 (30-day RCT), only Mg form proven to raise CSF levels",
    synergies:"Lion's Mane + MgT = best nootropic pairing. MgGly + MgT = sleep stack. Ashwagandha + MgT = cortisol + brain Mg.",
    warns:["⚠️ Each extra cap adds 36mg elemental Mg to total stack budget","⚠️ Monitor total Mg: MgT + MgGly + Minerals = ~414mg"],
    timingNote:"Split around sleep — wind-down + bedtime",
    mgPerCap:36, minDose:2, maxDose:6, safetyThreshold:5,
    safetyMsg:"⚠️ Above 4 caps: above studied clinical dose. Adds to total Mg budget.",
    hardCeiling:8, ceilingMsg:"⚠️ Very high dose — excessive Mg load, GI symptoms likely" },

  { id:"mgg", name:"Magnesium Glycinate", icon:"😴", color:"#9d4edd", cat:"Sleep",
    dose:"1", unit:"caps", timing:"winddown", gymTiming:"winddown", food:false,
    foodNote:"No food required",
    hasCycle:false, cycleNote:"Daily — no cycling needed",
    cycleWhy:"Magnesium glycinate replenishes systemic Mg and provides glycine. No receptor tolerance.",
    instructions:"Take 1 capsule only (NOT the label's 2) — stack already has 344mg Mg from other sources. Each cap = ~70mg elemental Mg.",
    benefits:"Glycine promotes sleep onset via core body temperature lowering, systemic muscle relaxation, GABA potentiation",
    synergies:"MgT + MgGly = complementary: MgT for brain, glycinate for systemic. Ashwagandha + MgGly = GABA amplification.",
    warns:["⚠️ Take 1 capsule ONLY — not the label's 2 caps. Stack Mg budget is nearly full","⚠️ Each cap = 70mg elemental Mg"],
    timingNote:"Wind-down — with sleep stack",
    mgPerCap:70, minDose:1, maxDose:4, safetyThreshold:2,
    safetyMsg:"⚠️ Above 1 cap (70mg): pushes total stack Mg toward/above 420mg ceiling. Monitor for loose stools.",
    hardCeiling:6, ceilingMsg:"⚠️ Excessive Mg — osmotic diarrhea risk" },

  { id:"boron", name:"Boron (Triple Boron)", icon:"🔬", color:"#06d6a0", cat:"Foundation",
    dose:"3", unit:"mg", timing:"meal1", gymTiming:"meal1", food:true,
    foodNote:"Take with first meal — fat aids absorption of fat-soluble boron complexes",
    hasCycle:false, cycleNote:"Daily — no cycling needed",
    cycleWhy:"Boron works through enzyme inhibition (SHBG), mineral metabolism regulation, and NF-κB suppression. No tolerance mechanism at standard doses.",
    instructions:"Start at 3mg/day. Takes ~1 week to show hormonal effects. Food-form boron (fructoborate) has best bioavailability. Take with first meal alongside other fat-soluble supplements.",
    benefits:"28% free testosterone increase at 10mg/day (Naghii 2011, 1-week RCT), SHBG reduction freeing bioactive T, 24% CRP reduction (anti-inflammatory), enhances Mg absorption and retention, bone mineral density support (Nielsen FH, USDA Human Nutrition Lab), improved hand-eye coordination + attention + short-term memory at ~10mg/day",
    synergies:"Boron + Shilajit + Ashwagandha = synergistic testosterone support. Boron enhances Mg retention — amplifies MgT/MgGly benefits. Boron + minerals = complete micronutrient foundation.",
    warns:["⚠️ UL (Tolerable Upper Intake Level) = 20mg/day — set by Institute of Medicine 2001","ℹ️ Space 2+ hours from iron supplements — boron may affect iron metabolism"],
    timingNote:"With first meal",
    minDose:1, maxDose:20, safetyThreshold:11,
    safetyMsg:"ℹ️ Above 10mg: exceeds most studied supplemental doses. UL is 20mg/day. Hormonal effects may amplify further at higher doses — monitor.",
    hardCeiling:20, ceilingMsg:"⚠️ At Tolerable Upper Intake Level (Institute of Medicine). Do not exceed without medical supervision." }
];

// ─── SUPPLEMENT TIMELINE + EVIDENCE META ─────────────────────
var SUPP_META = {
  mb:       {onsetDays:1,  peakDays:14,  peakNote:"Full mitochondrial ETC upregulation. Cognitive boost maximized with correct 5/2 cycling.",
             fullEffectNote:"Acute same-day mitochondrial boost. Days 7-14: cytochrome c oxidase upregulation plateaus with cycling maintained.",
             sideEffectWatches:["Headache (vasodilatory at higher doses)","Insomnia if taken after early morning","Anxiety/jitteriness at doses >20mg"],
             benefitSigns:["Mental clarity on waking","Sustained energy without crash","Improved memory recall"]},
  rhodiola: {onsetDays:5,  peakDays:42,  peakNote:"HPA axis fully normalized — full cortisol thermostat, anti-fatigue, and VO2 optimization.",
             fullEffectNote:"Acute anti-fatigue within 3-5 days. Sub-acute monoamine modulation at 2-3 weeks. Full HPA adaptive response at 4-6 weeks.",
             sideEffectWatches:["Insomnia if taken within 5h of sleep","Mild jitteriness/stimulation","Irritability at 10+ weeks (cycling signal)"],
             benefitSigns:["Reduced fatigue during work/exercise","Better stress resilience","Improved workout endurance"]},
  shilajit: {onsetDays:14, peakDays:90,  peakNote:"Full testosterone optimization — 20.45% total T, 19.14% free T, 31% DHEAS at 90-day RCT endpoint.",
             fullEffectNote:"Mineral repletion begins in first weeks. Hormonal effects cumulative — primary PrimaVie RCT measured at 90 days (n=60).",
             sideEffectWatches:["GI discomfort if taken without food","Excessive warmth/heat"],
             benefitSigns:["Strength and recovery improvement","Libido improvement","Sustained energy levels"]},
  lm:       {onsetDays:28, peakDays:112, peakNote:"Full NGF-driven neuroplasticity. Memory, focus, nerve regeneration per 16-week human RCT.",
             fullEffectNote:"NGF synthesis is slow — structural neuroplasticity takes weeks. 4-6 weeks before any noticeable effect. Full cognitive benefit at ~4 months consistent use.",
             sideEffectWatches:["Rare skin rash (mushroom allergy)","Mild GI discomfort","Occasional vivid dreams"],
             benefitSigns:["Improved memory and recall","Clearer sustained focus","Better cognitive stamina"]},
  creatine: {onsetDays:7,  peakDays:28,  peakNote:"Muscle phosphocreatine fully saturated. Full cognitive and strength benefits active.",
             fullEffectNote:"Muscle creatine pools saturate over 2-4 weeks at 5g/day. Cognitive benefits (memory +0.31 SMD, processing speed +0.51 SMD) correlate with saturation.",
             sideEffectWatches:["GI upset if taken without water","Muscle cramps (dehydration)","Water retention (normal — 1-2kg)"],
             benefitSigns:["Extra rep capacity in sets","Faster recovery between sets","Better short-term memory"]},
  chlorella:{onsetDays:7,  peakDays:56,  peakNote:"Full immune enhancement — NK cell +10%, IFN-γ +152% above placebo per 8-week RCT.",
             fullEffectNote:"Heavy metal binding is acute per dose. Immune modulation (NK cells, IFN-γ) builds over 8 weeks. Timing window adherence is critical for binding.",
             sideEffectWatches:["Green/darkened stools (normal)","GI discomfort if dose increased too quickly"],
             benefitSigns:["Less frequent illness","Improved gut regularity","Heavy metal detox support"]},
  oregano:  {onsetDays:3,  peakDays:14,  peakNote:"Full biofilm disruption and broad-spectrum antimicrobial action within course window.",
             fullEffectNote:"Carvacrol is acutely antimicrobial — effects begin with first dose. 2-6 week courses target biofilms and chronic organisms. No cumulative benefit beyond course.",
             sideEffectWatches:["GI burning on empty stomach","Heartburn","Microbiome disruption (use prebiotic)"],
             benefitSigns:["Reduced gut discomfort","Less bloating","Clearer skin if gut-related"]},
  minerals: {onsetDays:7,  peakDays:30,  peakNote:"Mineral deficiencies resolved. Methylated B-vitamins, taurine, ginkgo at steady state.",
             fullEffectNote:"Substrate-based replenishment — fills deficiencies in first 30 days. Benefits most pronounced if previously deficient. Ongoing use maintains levels.",
             sideEffectWatches:["GI discomfort (reduce dose temporarily)","Excess energy if previously B12-deficient"],
             benefitSigns:["Improved energy levels","Better mood (B-vitamins)","Sharper cognition (ginkgo + taurine)"]},
  ashwa:    {onsetDays:14, peakDays:60,  peakNote:"66-67% cortisol reduction. Full testosterone benefit (~33%) and sleep quality +72% vs +29% placebo documented at 60 days.",
             fullEffectNote:"Primary 60-day RCT (Shoden 120mg). Cortisol suppression builds progressively. Sleep quality peaks around weeks 4-8. At 10+ weeks: cycling required to prevent GABAergic downregulation.",
             sideEffectWatches:["Drowsiness if taken too early in day","Flat affect / reduced motivation at 10+ weeks (cycling signal)","Thyroid changes","Rare: liver enzyme elevation at high doses"],
             benefitSigns:["Deeper sleep quality","Reduced anxiety","Better morning energy","Increased libido"]},
  mgt:      {onsetDays:7,  peakDays:30,  peakNote:"CSF magnesium elevated 7-15%. Memory and synaptic plasticity improvements per 30-day RCT (p<0.001).",
             fullEffectNote:"Brain magnesium rises steadily over 4 weeks. Only Mg form proven to raise CSF levels. Benefits continue accumulating beyond 30 days.",
             sideEffectWatches:["Loose stools (excess total Mg)","Vivid dreams (normal — NMDA activation)","Morning grogginess at >4 caps"],
             benefitSigns:["Better dream recall","Improved memory retention","Easier sustained focus","Better sleep depth"]},
  mgg:      {onsetDays:2,  peakDays:14,  peakNote:"Glycine sleep-onset optimization and systemic Mg replenishment complete.",
             fullEffectNote:"Glycine: acute sleep onset improvement within 1-3 days via core body temperature lowering. Systemic Mg replenishment: 1-2 weeks.",
             sideEffectWatches:["Excessive morning sleepiness (reduce dose)","Loose stools (excess Mg with rest of stack)"],
             benefitSigns:["Faster sleep onset","More restful sleep","Less muscle tension on waking"]},
  boron:    {onsetDays:7,  peakDays:28,  peakNote:"Full SHBG suppression and free testosterone optimization. Anti-inflammatory and mineral-retention effects at steady state.",
             fullEffectNote:"Free testosterone improvement documented at 1 week (Naghii 2011 RCT, n=8, 10mg/day). Bone and mineral metabolism effects accumulate over months. Anti-inflammatory (CRP reduction) peaks around 4 weeks of consistent use.",
             sideEffectWatches:["GI discomfort at high doses (>10mg)","Hormonal shifts in sensitive individuals"],
             benefitSigns:["Increased libido / drive (free testosterone)","Reduced joint stiffness","Better Mg retention from stack","Improved strength at same workload"]}
};

function getMeta(id) { return SUPP_META[id] || {}; }

function getPhase(sup, startDate) {
  if (!startDate) return null;
  var days = getDaysChecked(sup.id, startDate); // actual doses taken, not calendar days
  if (days < 0) return null;
  var meta = getMeta(sup.id);
  var onset = meta.onsetDays || 7;
  var peak = meta.peakDays || 30;
  var effectPct, label, color, phase;
  if (days === 0) {
    return {phase:'Day 1', effectPct:0, label:'Starting today', color:'#555', days:0};
  } else if (days < onset) {
    effectPct = Math.round((days/onset)*25);
    label = 'Loading — '+(onset-days)+' more doses to onset';
    color = '#555'; phase = 'Loading';
  } else if (days < peak) {
    var progress = (days-onset)/(peak-onset);
    effectPct = Math.round(25 + progress*65);
    label = 'Building — '+(peak-days)+' more doses to peak';
    color = '#ffd60a'; phase = 'Building';
  } else {
    effectPct = Math.min(100, 90 + Math.floor((days-peak)/30)*2);
    label = 'At peak — '+days+' actual doses';
    color = '#38b000'; phase = 'Peak';
  }
  return {phase:phase, effectPct:Math.min(100,effectPct), label:label, color:color, days:days};
}

// ─── SYMPTOM CROSS-REFERENCE ──────────────────────────────────
var SYMPTOM_LIST = [
  "Headache","Insomnia / sleep disruption","Fatigue / low energy",
  "Anxiety / jitteriness","GI upset / nausea","Loose stools",
  "Mood change / flat affect","Brain fog","Vivid / intense dreams",
  "Muscle cramps","Skin changes","Appetite change",
  "Blue / dark urine","Excessive sleepiness",
  "✅ Increased energy","✅ Better focus / clarity","✅ Better sleep quality",
  "✅ Improved mood","✅ Reduced anxiety","✅ Increased strength","✅ Increased libido","Other"
];

var SYMPTOM_CROSSREF = {
  "Headache":{supps:["mb","rhodiola"],note:"MB: vasodilatory — check dose and timing. Rhodiola: stimulatory tension headache if taken too late."},
  "Insomnia / sleep disruption":{supps:["mb","rhodiola"],note:"Both are stimulatory — must be taken in your morning window only. Confirm schedule timing."},
  "Fatigue / low energy":{supps:["ashwa"],note:"Ashwagandha: excessive cortisol suppression can cause fatigue past the 8-10 week mark — cycling signal."},
  "Anxiety / jitteriness":{supps:["mb","rhodiola","creatine"],note:"MB+Rhodiola: stimulatory stack. High creatine: restlessness in some. Check doses."},
  "GI upset / nausea":{supps:["oregano","shilajit","chlorella","minerals"],note:"Oregano: always with food (93% carvacrol). Shilajit: with food. Chlorella: increase slowly. Minerals: substantial meal."},
  "Loose stools":{supps:["mgt","mgg","minerals","chlorella","creatine"],note:"Most likely: excess total magnesium (>420mg). Check Mg budget in Today tab. Creatine: ensure 3L+ water."},
  "Mood change / flat affect":{supps:["ashwa","rhodiola"],note:"Ashwagandha: cortisol suppression blunting motivation is a cycling signal at 8+ weeks. Rhodiola: paradoxical irritability near 10-week mark."},
  "Brain fog":{supps:["mgt","ashwa","mgg"],note:"MgT: morning grogginess at >4 caps. Ashwagandha: sedative carry-over if taken too close to wake time."},
  "Vivid / intense dreams":{supps:["mgt","mgg","ashwa"],note:"Normal and expected from the sleep stack. Magnesium activates NMDA signaling, ashwagandha enables deeper REM."},
  "Muscle cramps":{supps:["creatine"],note:"Creatine draws water into muscle cells — ensure 3L+ water daily."},
  "Excessive sleepiness":{supps:["ashwa","mgt","mgg"],note:"Sleep stack too strong or taken too close to wake time. Consider pushing wind-down timing earlier."},
  "Blue / dark urine":{supps:["mb"],note:"Normal at any dose — methylene blue is a dye. Not a side effect."},
  "✅ Increased energy":{supps:["mb","rhodiola","shilajit","creatine","minerals"],note:"Positive expected response. Note which supplement you attribute it to and what phase you're in."},
  "✅ Better focus / clarity":{supps:["mb","lm","mgt","creatine"],note:"Positive expected response. MB: acute. Lion's Mane: builds over 4-16 weeks."},
  "✅ Better sleep quality":{supps:["ashwa","mgt","mgg"],note:"Positive expected response from sleep stack. Improves progressively over 2-4 weeks."},
  "✅ Improved mood":{supps:["rhodiola","ashwa","lm","minerals"],note:"Positive expected benefit from HPA axis and B-vitamin support."},
  "✅ Reduced anxiety":{supps:["ashwa","mgt","mgg"],note:"Positive expected response from GABA modulation and cortisol suppression."},
  "✅ Increased strength":{supps:["creatine","shilajit","ashwa","boron"],note:"Performance stack response. Creatine: 7-28 days. Shilajit+Ashwa: 4-12 weeks. Boron: free T increase amplifies strength gains within 1-2 weeks."},
  "✅ Increased libido":{supps:["ashwa","shilajit","boron"],note:"Expected testosterone-stack benefit. Typically noticeable after 4-6 weeks (Shilajit: 8-12 weeks for full T increase). Boron: free T increase often noticed within 1 week at 10mg/day."}
};

// Known risks from taking specific supplements together
var COMBO_RISKS = [
  {supps:["mb","ashwa"],          label:"MB + Ashwagandha",    color:"#ff4444",
   risks:["Anxiety / jitteriness","Insomnia / sleep disruption","Headache"],
   note:"Both affect serotonergic pathways. MB is a MAO inhibitor; ashwagandha upregulates serotonin signaling. Keep MB ≤15mg. Any serotonin-like symptoms (agitation, rapid heart rate, sweating) are a hard stop — stop MB immediately."},
  {supps:["mb","rhodiola"],        label:"MB + Rhodiola",       color:"#ff6b35",
   risks:["Insomnia / sleep disruption","Anxiety / jitteriness","Headache"],
   note:"Dual stimulatory stack. Both are energizing — timing is critical. If either is taken within 5 hours of sleep, insomnia and anxiety are expected, not a drug interaction. Confirm both are taken in your morning window."},
  {supps:["mgt","mgg","minerals"], label:"Triple Mg Stack",     color:"#ffd60a",
   risks:["Loose stools","GI upset / nausea"],
   note:"Combined Mg from MgT + MgGly + Minerals = ~414mg. Osmotic threshold for GI effects is ~420mg for most people. Loose stools from this combination means you've hit your personal ceiling — reduce MgGly to 0 caps or cut Minerals to ½ scoop."},
  {supps:["ashwa","rhodiola"],     label:"Ashwagandha + Rhodiola", color:"#ffd60a",
   risks:["Fatigue / low energy","Mood change / flat affect"],
   note:"Both modulate the HPA axis. Rhodiola (AM) + Ashwagandha (PM) is an intentional synergistic pairing. However, if taken during the same time window OR if Ashwagandha is taken too early, combined sedation + stimulation can cause mood dysregulation. Should be at least 8 hours apart."},
  {supps:["oregano","mgt"],        label:"Oregano Oil + MgT",   color:"#ffd60a",
   risks:["GI upset / nausea","Loose stools"],
   note:"Carvacrol is a gut irritant; high-dose Mg is osmotic. These do not interact pharmacologically but combined GI load is significant. If GI symptoms occur, separate by 3+ hours."},
  {supps:["chlorella","minerals"], label:"Chlorella + Minerals", color:"#ff6b35",
   risks:["GI upset / nausea"],
   note:"Chlorella cell wall binds divalent metal ions. If taken within 2 hours of Minerals (zinc, copper, magnesium, ginkgo), Chlorella will bind and excrete a significant portion of what the Minerals supplement delivered. Maintain strict 2-hour separation."},
  {supps:["mb","creatine"],        label:"MB + Creatine",       color:"#38b000",
   risks:[],
   note:"✅ Intentional synergy — dual brain energy. No adverse combination effects documented. Creatine provides phosphocreatine buffer; MB optimizes electron transport. Safe to take together or close together."},
  {supps:["ashwa","shilajit"],     label:"Ashwagandha + Shilajit", color:"#38b000",
   risks:[],
   note:"✅ Classic Ayurvedic testosterone pair. No adverse combination risks. Synergistic HPA axis + androgenic pathway support. Both must be taken consistently for 4-12 weeks to see full combined effect."}
];

function getComboRisks(suppIds) {
  if (!suppIds || suppIds.length < 2) return [];
  return COMBO_RISKS.filter(function(cr){
    return cr.supps.every(function(id){ return suppIds.indexOf(id) >= 0; });
  });
}

// ─── SYNERGIES ────────────────────────────────────────────────
// Bidirectional synergy definitions — add one entry, appears on all involved cards.
// supps: all must be active in the stack for this to display.
var SYNERGIES = [
  // ── Cognitive / Energy ──────────────────────────────────────
  {supps:["mb","creatine"], label:"MB + Creatine", color:"#4cc9f0",
   note:"Dual-layer brain energy: MB optimizes Complex IV electron transport (upstream), creatine replenishes phosphocreatine buffer (downstream). Independent mechanisms — stacking is additive. No interaction risk. Safe to take in the same morning window."},
  {supps:["mb","lm"], label:"MB + Lion's Mane", color:"#80b918",
   note:"Complementary neuroprotection: MB acutely optimizes mitochondrial function; Lion's Mane drives long-term NGF-mediated neuroplasticity. Short-term cognitive enhancement + long-term structural brain support operating in parallel."},
  {supps:["lm","mgt"], label:"Lion's Mane + MgT", color:"#7b2d8b",
   note:"Strongest nootropic pairing in the stack. Lion's Mane increases synaptic plasticity via NGF upregulation; MgT raises brain Mg concentration, which directly enables NMDA-receptor-dependent long-term potentiation (LTP). Structural + mineral support for memory formation. Both must be consistent for 4–8 weeks for full effect."},
  {supps:["mb","lm","mgt"], label:"MB + Lion's Mane + MgT", color:"#4cc9f0",
   note:"Full nootropic triad: MB for acute mitochondrial performance, Lion's Mane for NGF-driven neuroplasticity, MgT for brain magnesium and NMDA function. Each operates on a different timescale (hours, weeks, months) and a different mechanism. No overlap, no redundancy — convergent cognitive support."},
  // ── HPA Axis / Stress ───────────────────────────────────────
  {supps:["ashwa","rhodiola"], label:"Ashwagandha + Rhodiola", color:"#f77f00",
   note:"Full HPA axis support across the day: Rhodiola (AM) normalizes acute stress response and reduces cortisol reactivity via monoamine modulation; Ashwagandha (PM) suppresses chronic cortisol via GABA-A and sustained HPA down-regulation. Intentional AM/PM pairing — MUST be 8+ hours apart. Do not overlap timing windows."},
  // ── Testosterone Stack ───────────────────────────────────────
  {supps:["ashwa","shilajit"], label:"Ashwagandha + Shilajit", color:"#a0522d",
   note:"Classic Ayurvedic testosterone pair. Shilajit raises total T (+20.45% at 90 days, PrimaVie RCT n=60) via fulvic acid and mineral delivery; Ashwagandha raises T (+33%, Shoden 60-day RCT) and crushes cortisol (-67%). Documented synergistic androgenic effect — run concurrently for full benefit."},
  {supps:["boron","shilajit"], label:"Boron + Shilajit", color:"#06d6a0",
   note:"Complementary testosterone mechanisms: Shilajit raises total testosterone via mitochondrial/mineral pathways; Boron suppresses SHBG, making more of that total T bioavailable as free T. Shilajit delivers the T — Boron ensures it isn't sequestered. Strong pair for androgenic optimization."},
  {supps:["boron","ashwa"], label:"Boron + Ashwagandha", color:"#06d6a0",
   note:"Boron reduces SHBG; Ashwagandha raises total T by ~33% and suppresses cortisol. Result: more total T (ashwa) + more of it unbound and bioactive (boron) + better anabolic-to-catabolic ratio (cortisol down). Synergistic across three hormonal variables."},
  {supps:["boron","shilajit","ashwa"], label:"Triple Testosterone Stack", color:"#06d6a0",
   note:"Three independent testosterone mechanisms: (1) Boron suppresses SHBG — frees bound T. (2) Shilajit raises total T +20% via fulvic acid and mitochondrial support. (3) Ashwagandha raises T +33% and annihilates cortisol -67%. Each pathway is distinct — stacking all three is additive, not redundant. This combination targets total T, free T, and catabolic interference simultaneously."},
  // ── Sleep Stack ──────────────────────────────────────────────
  {supps:["mgt","mgg"], label:"MgT + MgGly", color:"#9d4edd",
   note:"Complementary Mg forms targeting different systems: MgT is the only form proven to cross the blood-brain barrier and raise CSF Mg, supporting NMDA receptor function and synaptic plasticity during sleep. MgGly delivers systemic Mg + glycine — glycine lowers core body temperature to trigger sleep onset and promotes deeper slow-wave sleep. Together: brain-targeted neurological sleep quality + systemic sleep onset."},
  {supps:["ashwa","mgt"], label:"Ashwagandha + MgT", color:"#7b2d8b",
   note:"Ashwagandha reduces cortisol via GABA-A activation, removing the hormonal barrier to deep sleep; MgT raises brain magnesium, enabling the NMDA receptor function required for memory consolidation during sleep. Cortisol suppression + brain mineral optimization = sleep that actually restores and encodes."},
  {supps:["ashwa","mgt","mgg"], label:"Full Sleep Stack", color:"#7b2d8b",
   note:"Three-mechanism sleep optimization: Ashwagandha reduces cortisol and activates GABA-A receptors (anxiety/arousal down); MgT raises brain Mg for deeper sleep architecture and memory consolidation; MgGly provides glycine for core temp drop and sleep onset + systemic Mg. Each supplement targets a distinct sleep pathway — onset, architecture, and hormonal interference. Full coverage."},
  // ── Gut / Detox ──────────────────────────────────────────────
  {supps:["chlorella","oregano"], label:"Chlorella + Oregano Oil", color:"#38b000",
   note:"Sequential gut protocol: Oregano Oil (93% carvacrol) handles antimicrobial and antifungal action, disrupting biofilms and pathogenic organisms; Chlorella binds and eliminates the debris and heavy metals in the aftermath. Strict 2+ hour separation required — carvacrol will damage chlorella's cell wall if co-ingested, destroying its binding capacity."},
  // ── Foundation / Minerals ────────────────────────────────────
  {supps:["minerals","ashwa"], label:"Minerals + Ashwagandha", color:"#ffd60a",
   note:"Methylated B12 and folate in the Minerals formula directly support the neurotransmitter synthesis pathways that ashwagandha modulates (dopamine, serotonin). B12 enables the methylation cycle that ashwagandha depends on for cortisol metabolism. Natural timing synergy: minerals with dinner, ashwagandha at wind-down."},
  {supps:["minerals","lm"], label:"Minerals + Lion's Mane", color:"#80b918",
   note:"Ginkgo biloba (250mg in Minerals) + Lion's Mane = additive cerebral blood flow and neuroprotection. Ginkgo increases NO-mediated vasodilation and inhibits platelet aggregation; LM drives NGF synthesis for structural neuroplasticity. Different mechanisms converging on cognitive and vascular brain health."},
  {supps:["boron","minerals"], label:"Boron + Minerals", color:"#06d6a0",
   note:"Boron enhances the absorption and retention of calcium, magnesium, and phosphorus from the Minerals formula — directly amplifying its effectiveness. Boron also activates vitamin D3, which further improves Ca/Mg utilization. One supplement making another work better."},
  {supps:["boron","mgt"], label:"Boron + MgT", color:"#06d6a0",
   note:"Boron reduces urinary Mg excretion (Nielsen FH, USDA Human Nutrition Lab), meaning more of the Mg from MgT is retained in the body and brain. This amplifies MgT's core mechanism — raising CSF magnesium for NMDA receptor support. Boron doesn't add magnesium; it prevents you from losing what MgT provides."},
  {supps:["boron","mgg"], label:"Boron + MgGly", color:"#06d6a0",
   note:"Same mechanism as Boron+MgT: boron reduces urinary Mg excretion, improving systemic Mg retention from magnesium glycinate. Better systemic Mg status = better sleep, muscle relaxation, and neuromuscular function."},
  // ── Performance ──────────────────────────────────────────────
  {supps:["creatine","shilajit"], label:"Creatine + Shilajit", color:"#4cc9f0",
   note:"Complementary ATP pathways: creatine replenishes phosphocreatine (immediate high-intensity energy buffer); shilajit supports mitochondrial ATP synthesis via fulvic acid electron carrying and mineral co-factors (sustained aerobic energy). One covers the explosive pathway, one covers the oxidative pathway."},
  {supps:["rhodiola","creatine"], label:"Rhodiola + Creatine", color:"#f77f00",
   note:"Performance stack: Rhodiola acutely boosts VO2peak (~5%), reduces lactate accumulation, and blunts cortisol during training; Creatine extends high-intensity output via phosphocreatine replenishment. Combined: better endurance ceiling and better peak power within the same session."}
];

function getSynergies(id, activeIds) {
  if (!activeIds || activeIds.length < 2) return [];
  return SYNERGIES.filter(function(syn) {
    return syn.supps.indexOf(id) >= 0 &&
           syn.supps.every(function(sid){ return activeIds.indexOf(sid) >= 0; });
  });
}

// ─── SCHEDULE BLOCKS ─────────────────────────────────────────
var DEFAULT_BLOCKS = [
  {id:"wake",     label:"Upon Waking",      color:"#00b4d8", note:"Empty stomach — wait before eating"},
  {id:"meal1",    label:"First Meal",       color:"#4cc9f0", note:"BioPerine in Rhodiola boosts absorption ~30–60%"},
  {id:"alone",    label:"Afternoon (ALONE)",color:"#38b000", note:"⚠️ Chlorella ONLY — 2+ hour buffer from all other supps"},
  {id:"dinner",   label:"Pre-Work Dinner",  color:"#ffd60a", note:"Substantial meal — fat aids mineral absorption"},
  {id:"pregym",   label:"Pre-Gym",          color:"#4cc9f0", note:"Gym days only — creatine here for max loading"},
  {id:"winddown", label:"Wind-Down",        color:"#7b2d8b", note:"1.5–2h before bedtime — cortisol/sleep stack"},
  {id:"bedtime",  label:"Bedtime",          color:"#9d4edd", note:"Final MgT dose (2 caps) — completes split"}
];

// Timing optimization rules
var TIMING_RULES = {
  wake: {
    gym: {note:"MB stimulates mitochondrial ETC — morning timing maximizes cognitive energy for training prep. Allow 60 min before gym."},
    rest: {note:"MB on empty stomach upon waking provides clean mitochondrial boost for the day."}
  },
  pregym: {
    gym: {note:"Creatine pre-gym (~60–90 min before) maximizes muscle phosphocreatine loading at peak demand. Avoid if gut-sensitive."},
    rest: {note:"Not applicable — rest day. Creatine stays at first meal."}
  },
  meal1: {
    gym: {note:"BioPerine from Rhodiola enhances absorption of shilajit, LM, creatine (rest days). Take together."},
    rest: {note:"BioPerine from Rhodiola enhances absorption of shilajit, LM, creatine. Take together."}
  },
  winddown: {
    gym: {note:"Post-gym wind-down: ashwagandha helps lower post-workout cortisol spike. MgT + MgGly promote recovery sleep."},
    rest: {note:"Ashwagandha + MgT + MgGly: sleep + cortisol stack. Take 1.5–2h before target sleep time."}
  }
};

var TIMING_CONFLICTS = (function() {
  var chlorellaConflicts = [
    ['chlorella','mb',       2,'Chlorella cell wall binds compounds in GI tract — 2hr gap required'],
    ['chlorella','rhodiola', 2,'Chlorella cell wall binds compounds in GI tract — 2hr gap required'],
    ['chlorella','shilajit', 2,'Fulvic acid competes with chlorella binding — 2hr gap required'],
    ['chlorella','lm',       2,'Chlorella cell wall binds compounds in GI tract — 2hr gap required'],
    ['chlorella','creatine', 2,'Chlorella cell wall binds compounds in GI tract — 2hr gap required'],
    ['chlorella','minerals', 2,'Chlorella binds zinc/copper/magnesium from Minerals — 2hr gap required'],
    ['chlorella','ashwa',    2,'Chlorella cell wall binds compounds in GI tract — 2hr gap required'],
    ['chlorella','mgt',      2,'Chlorella binds magnesium from MgT — 2hr gap required'],
    ['chlorella','mgg',      2,'Chlorella binds magnesium from MgGly — 2hr gap required'],
    ['chlorella','boron',    2,'Chlorella cell wall binds compounds in GI tract — 2hr gap required'],
    ['chlorella','oregano',  2,'Carvacrol damages chlorella cell wall if co-ingested — 2hr gap required']
  ];
  return chlorellaConflicts;
})();
