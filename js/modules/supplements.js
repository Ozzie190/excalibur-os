// ─── EXCALIBUR OS — Supplements Module ──────────────────────────
// Ported from Biohack OS biohack-os.html
// All supplement logic: scheduling, cycling, safety, dosing, rendering

(function() {

// ── State alias — makes all existing S.checks, S.gymDays etc just work ──
var S = EXC.S.supp;

// Proxy shared fields to global EXC.S
Object.defineProperty(S, 'wakeTime', {
  get: function() { return EXC.S.wakeTime; },
  set: function(v) { EXC.S.wakeTime = v; },
  configurable: true
});
Object.defineProperty(S, 'bedTime', {
  get: function() { return EXC.S.bedTime; },
  set: function(v) { EXC.S.bedTime = v; },
  configurable: true
});

// ── Notification state ──
var _notifTimers = [];
var _swReg = null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(function(reg) { _swReg = reg; });
}

// ── Replaced functions ──
// saveS() -> EXC.save()
function saveS() { EXC.save(); }

// go(tab) -> set subTab and redraw
function go(tab) {
  S.subTab = tab;
  EXC.save();
  EXC.draw();
}

// draw() -> EXC.draw()
function draw() { EXC.draw(); }

// closeModal() -> EXC.closeModal() but also needs local modal rendering
function closeModal() {
  var root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

// ─── SYMPTOM LOG ACTIONS ─────────────────────────────────────
function setLogMode(mode) {
  S.logMode = mode; draw();
}

function addSymptomLog() {
  var symptomEl = document.getElementById('sl_symptom');
  if (!symptomEl || !symptomEl.value) return;
  var severity = parseInt((document.getElementById('sl_severity')||{value:'3'}).value);
  var isPos = symptomEl.value.startsWith('✅');
  var suppIds = [];
  document.querySelectorAll('.sl-supp-cb:checked').forEach(function(el){suppIds.push(el.value);});
  var notesEl = document.getElementById('sl_notes');
  // Snapshot which supplements were checked today at time of logging
  var checkedToday = getAllSupps().filter(function(x){ return !!S.checks[x.id+'_'+TODAY]; }).map(function(x){ return x.id; });
  var entry = {
    type:'symptom',
    dt: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}),
    date: TODAY,
    symptom: symptomEl.value,
    severity: isNaN(severity) ? 3 : severity,
    isPositive: isPos,
    suppIds: suppIds,
    checkedAtLog: checkedToday, // all supplements checked today when this entry was logged
    notes: notesEl ? notesEl.value.trim() : '',
    phasesAtLog: {}
  };
  suppIds.forEach(function(id){
    var s = getAllSupps().find(function(x){return x.id===id;});
    if (s && S.startDates[id]) {
      var ph = getPhase(s, S.startDates[id]);
      if (ph) entry.phasesAtLog[id] = {phase:ph.phase, day:ph.days, effectPct:ph.effectPct};
    }
  });
  S.symptomLogs.push(entry);
  saveS(); draw();
}

function delSymptomLog(i) { S.symptomLogs.splice(i,1); saveS(); draw(); }

function addNoteInCard(id) {
  var el = document.getElementById('card_note_'+id);
  if (!el || !el.value.trim()) return;
  S.notes.push({txt:el.value.trim(), sid:id, dt:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})});
  saveS(); draw();
}

function updateSymptomCrossRef() {
  var el = document.getElementById('sl_symptom');
  var refEl = document.getElementById('sl_crossref');
  if (!el || !refEl) return;
  var sym = el.value;
  if (!sym) { refEl.innerHTML=''; return; }

  var out = '';
  var isPos = sym.startsWith('✅');

  // Individual supplement cross-ref
  var ref = SYMPTOM_CROSSREF[sym];
  if (ref) {
    var matchSupps = getAllSupps().filter(function(s){return ref.supps.indexOf(s.id)>=0;});
    var names = matchSupps.length ? matchSupps.map(function(s){return '<span style="color:'+s.color+'">'+s.icon+' '+s.name.split(' ')[0]+'</span>';}).join(', ') : ref.supps.join(', ');
    out += '<div style="padding:7px 9px;border-radius:7px;background:rgba('+(isPos?'56,176,0':'255,107,53')+',.08);border:1px solid rgba('+(isPos?'56,176,0':'255,107,53')+',.3);font-size:10px;line-height:1.6;color:#aaa;margin-top:6px">'+(isPos?'✅':'⚠️')+' <strong>Individual associations:</strong> '+names+'<br>'+ref.note+'</div>';
  }

  // Combo risks for this symptom
  var checkedIds = [];
  document.querySelectorAll('.sl-supp-cb:checked').forEach(function(cb){ checkedIds.push(cb.value); });
  var comboMatches = COMBO_RISKS.filter(function(cr){
    return cr.risks.indexOf(sym) >= 0 && cr.supps.some(function(id){ return checkedIds.indexOf(id) >= 0; });
  });
  comboMatches.forEach(function(cr){
    var isGood = !cr.risks.length || cr.risks.indexOf(sym) < 0;
    out += '<div style="padding:7px 9px;border-radius:7px;background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.3);font-size:10px;line-height:1.6;color:#aaa;margin-top:5px">🔗 <strong>Combination risk — '+cr.label+':</strong><br>'+cr.note+'</div>';
  });

  refEl.innerHTML = out;
}


// ─── GET ACTIVE SUPPS ────────────────────────────────────────
function getAllSupps() {
  var builtin = BUILTIN.filter(function(s){ return S.removedBuiltin.indexOf(s.id) < 0; });
  return builtin.concat(S.customSupps);
}

// ─── HELPERS ─────────────────────────────────────────────────
// rgb() is in utils.js (global scope)

function daysSince(ds) {
  if (!ds) return 0;
  var s = new Date(ds); s.setHours(0,0,0,0);
  var n = new Date(); n.setHours(0,0,0,0);
  return Math.floor((n-s)/86400000);
}

// ─── PHASE / META / SYNERGIES ────────────────────────────────
function getMeta(id) { return SUPP_META[id] || {}; }

function getPhase(sup, startDate) {
  if (!startDate) return null;
  var days = getDaysChecked(sup.id, startDate);
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

function getSynergies(id, activeIds) {
  if (!activeIds || activeIds.length < 2) return [];
  return SYNERGIES.filter(function(syn) {
    return syn.supps.indexOf(id) >= 0 &&
           syn.supps.every(function(sid){ return activeIds.indexOf(sid) >= 0; });
  });
}

// ─── CHECK-BASED HELPERS ─────────────────────────────────────
// Count actual checked days from fromDate up to today (or optional toDate)
function getDaysChecked(id, fromDate, toDate) {
  if (!fromDate) return 0;
  var from = new Date(fromDate); from.setHours(0,0,0,0);
  var to = toDate ? new Date(toDate) : new Date(); to.setHours(0,0,0,0);
  var count = 0, d = new Date(from);
  while (d <= to) { if (S.checks[id+'_'+localDateStr(d)]) count++; d.setDate(d.getDate()+1); }
  return count;
}

// Consecutive checked days backwards from today; intentional skips don't break the streak
function getConsecutiveStreak(id) {
  var d = new Date(); d.setHours(0,0,0,0);
  if (!S.checks[id+'_'+localDateStr(d)]) d.setDate(d.getDate()-1); // today not checked yet — start from yesterday
  var streak = 0;
  while (streak < 3650) {
    var ds = localDateStr(d);
    if (S.checks[id+'_'+ds])       { streak++; }
    else if (S.skips[id+'_'+ds])   { /* intentional skip — continue without counting */ }
    else                            { break; }
    d.setDate(d.getDate()-1);
  }
  return streak;
}

// Simulate cycle state for sup from startDate through toDate, recording state per day
// Returns map of dateStr -> {on: bool}
function getCycleStatesForRange(sup, sd, fromDate, toDate) {
  if (!sup.hasCycle || !sd) return {};
  var daysOn, daysOff;
  if (sup.cycleType === 'days')   { daysOn = sup.daysOn;               daysOff = sup.daysOff; }
  else if (sup.cycleType === 'weeks')  { daysOn = (sup.weeksOn||8)*7;  daysOff = (sup.weeksOff||2)*7; }
  else if (sup.cycleType === 'course') { daysOn = (sup.courseWksOn||4)*7; daysOff = daysOn; }
  else return {};
  var from = new Date(sd); from.setHours(0,0,0,0);
  var to   = new Date(toDate); to.setHours(0,0,0,0);
  var cal  = new Date(fromDate); cal.setHours(0,0,0,0);
  var phase = 'on', onCount = 0, offCount = 0, result = {};
  var d = new Date(from);
  while (d <= to) {
    var ds = localDateStr(d);
    if (d >= cal) result[ds] = {on: phase === 'on'};  // record state at START of this day
    var checked = !!S.checks[sup.id+'_'+ds];
    if (phase === 'on') {
      if (checked) { onCount++; if (onCount >= daysOn) { phase='off'; offCount=0; onCount=0; } }
      // miss or skip: on-phase doesn't advance — you earn your off days
    } else {
      offCount++;
      if (offCount >= daysOff) { phase='on'; offCount=0; }
    }
    d.setDate(d.getDate()+1);
  }
  return result;
}

// Simulation-based cycle status — skipping a dose EXTENDS the on-phase
function cycleStatus(sup, sd) {
  if (!sup.hasCycle || !sd) return null;
  var from = new Date(sd); from.setHours(0,0,0,0);
  var now  = new Date(); now.setHours(0,0,0,0);
  if (from > now) return null;
  var daysOn, daysOff;
  if (sup.cycleType === 'days')        { daysOn = sup.daysOn;               daysOff = sup.daysOff; }
  else if (sup.cycleType === 'weeks')  { daysOn = (sup.weeksOn||8)*7;       daysOff = (sup.weeksOff||2)*7; }
  else if (sup.cycleType === 'course') { daysOn = (sup.courseWksOn||4)*7;   daysOff = daysOn; }
  else return null;
  var phase = 'on', onCount = 0, offCount = 0;
  var d = new Date(from);
  while (d <= now) {
    var ds = localDateStr(d);
    var checked = !!S.checks[sup.id+'_'+ds];
    if (phase === 'on') {
      if (checked) { onCount++; if (onCount >= daysOn) { phase='off'; offCount=0; onCount=0; } }
    } else {
      offCount++;
      if (offCount >= daysOff) { phase='on'; offCount=0; }
    }
    d.setDate(d.getDate()+1);
  }
  if (phase === 'on') {
    var left = daysOn - onCount;
    return {on:true,  pct:(onCount/daysOn)*100, lbl:'Active — '+left+'d until rest'};
  } else {
    var left = daysOff - offCount;
    return {on:false, pct:100, lbl:'Rest — '+left+'d until active'};
  }
}

function getMgSources() {
  var supps = getAllSupps();
  var total = 0, parts = [];
  supps.forEach(function(s) {
    var d = getDose(s.id, s);
    var mg = 0;
    if (s.id === 'mgt' || s.unit === 'caps' && s.mgPerCap) mg = d * s.mgPerCap;
    else if (s.id === 'mgg') mg = d * 70;
    else if (s.id === 'minerals') mg = 200;
    else if (s.mgPerUnit) mg = d * s.mgPerUnit;
    if (mg > 0) { parts.push({name:s.name, mg:Math.round(mg), color:s.color}); total += mg; }
  });
  return {total:Math.round(total), parts:parts};
}

function getDose(id, supp) {
  if (S.doseOverrides[id] !== undefined) return parseFloat(S.doseOverrides[id]);
  if (supp && supp.dose !== undefined) return parseFloat(supp.dose) || 0;
  return 0;
}

function getSafetyLevel(supp, dose) {
  if (!supp.maxDose) return null;
  if (supp.hardCeiling && dose >= supp.hardCeiling) return {level:'danger', msg:supp.ceilingMsg, color:'#ff4444'};
  if (supp.safetyThreshold && dose >= supp.safetyThreshold) return {level:'caution', msg:supp.safetyMsg, color:'#ffd60a'};
  return null;
}

function isGym() { return !!S.gymDays[TODAY_DAY]; }
function isChecked(id) { return !!S.checks[id+"_"+TODAY]; }


// svgRing is in utils.js — using the global one

function toggleGym(d) { S.gymDays[d]=!S.gymDays[d]; saveS(); draw(); }
function toggleCheck(id) {
  var key = id+'_'+TODAY;
  var wasChecked = !!S.checks[key];
  S.checks[key] = !wasChecked;
  delete S.skips[key]; // checking overrides any skip
  if (!wasChecked) {
    var now = new Date();
    S.doseTimes[key] = ('0'+now.getHours()).slice(-2)+':'+('0'+now.getMinutes()).slice(-2);
    checkDoseTiming(id);
  } else {
    delete S.doseTimes[key];
  }
  saveS(); draw();
}
function skipDay(id, ds) {
  var key = id+'_'+(ds||TODAY);
  S.skips[key] = !S.skips[key]; // toggle — tap again to un-skip
  delete S.checks[key];          // can't be both checked and skipped
  saveS(); draw();
}
function isSkipped(id, ds) { return !!S.skips[id+'_'+(ds||TODAY)]; }

function checkDoseTiming(id) {
  var now = new Date();
  var nowMins = now.getHours()*60 + now.getMinutes();
  var warnings = [];
  TIMING_CONFLICTS.forEach(function(pair) {
    var other = null;
    if (pair[0] === id) other = pair[1];
    else if (pair[1] === id) other = pair[0];
    if (!other) return;
    var otherKey = other+'_'+TODAY;
    var otherTime = S.doseTimes[otherKey];
    if (!otherTime) return;
    var parts = otherTime.split(':');
    var otherMins = parseInt(parts[0])*60 + parseInt(parts[1]);
    var gapMins = Math.abs(nowMins - otherMins);
    if (gapMins < pair[2]*60) {
      var otherSupp = getAllSupps().find(function(s){return s.id===other;});
      var otherName = otherSupp ? otherSupp.name.split('(')[0].trim() : other;
      var gapStr = gapMins >= 60 ? Math.floor(gapMins/60)+'h '+('0'+(gapMins%60)).slice(-2)+'m' : gapMins+'min';
      warnings.push(otherName+' was taken '+gapStr+' ago — '+pair[3]);
    }
  });
  if (warnings.length) showTimingWarning(warnings);
}

function showTimingWarning(warnings) {
  var old = document.getElementById('_timing_warn');
  if (old) old.remove();
  var div = document.createElement('div');
  div.id = '_timing_warn';
  div.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);max-width:440px;width:calc(100% - 24px);background:#1a0d0d;border:1px solid #ff6b3566;border-radius:10px;padding:11px 14px;z-index:1000;font-size:11px;line-height:1.7;color:#ff9a6b;box-shadow:0 4px 24px rgba(0,0,0,.6)';
  div.innerHTML = '<div style="font-size:9px;color:#ff6b35;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">⏱ Timing Conflict Detected</div>'+warnings.map(function(w){return '⚠️ '+w;}).join('<br>')+'<button onclick="document.getElementById(\'_timing_warn\').remove()" style="display:block;margin-top:8px;font-size:10px;color:#555;background:none;border:none;cursor:pointer;padding:0">Dismiss</button>';
  document.body.appendChild(div);
  setTimeout(function(){ var el=document.getElementById('_timing_warn'); if(el) el.remove(); }, 9000);
}

function setSD(id,v) { S.startDates[id]=v; saveS(); draw(); }
function toggleExp(key) { S.expanded = S.expanded===key ? null : key; draw(); }
function toggleAlert(key) { S.expandedAlert = S.expandedAlert===key ? null : key; draw(); }
function toggleCycleExp(key) { S.expandedCycle = S.expandedCycle===key ? null : key; draw(); }
function dismiss(id) { S.dismissed["caution_"+id]=true; saveS(); draw(); }

function setDoseFromInput(id) {
  var el = document.getElementById('di_'+id);
  if (!el) return;
  var v = parseFloat(el.value);
  if (isNaN(v) || v < 0) return;
  S.doseOverrides[id] = v;
  delete S.dismissed["caution_"+id];
  if (!S.doseHistory[id]) S.doseHistory[id] = [];
  S.doseHistory[id].push({date:TODAY, dose:v});
  saveS(); draw();
}

function adjDose(id, dir) {
  var supp = getAllSupps().find(function(s){return s.id===id;});
  if (!supp) return;
  var cur = getDose(id, supp);
  var step = supp.doseStep || (supp.unit==='g'?0.5 : supp.unit==='mg'?10 : supp.unit==='ml'?0.1 : supp.unit==='caps'?1 : 0.5);
  var nxt = Math.max(0, parseFloat((cur + dir*step).toFixed(4)));
  S.doseOverrides[id] = nxt;
  delete S.dismissed["caution_"+id];
  if (!S.doseHistory[id]) S.doseHistory[id] = [];
  S.doseHistory[id].push({date:TODAY, dose:nxt});
  saveS(); draw();
}

function addNote() {
  var inp = document.getElementById('ni');
  var sel = document.getElementById('ns');
  if (!inp) return;
  var txt = inp.value.trim();
  if (!txt) return;
  S.notes.push({txt:txt, sid:sel?sel.value:'', dt:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})});
  saveS(); draw();
}

function delNote(i) { S.notes.splice(i,1); saveS(); draw(); }

function removeSupp(id) {
  // Accumulate actual checked days into lifetime total before removing
  if (S.startDates[id]) {
    var actualDays = getDaysChecked(id, S.startDates[id]);
    if (actualDays > 0) S.lifetimeDays[id] = (S.lifetimeDays[id]||0) + actualDays;
  }
  var isBuiltin = BUILTIN.some(function(s){return s.id===id;});
  if (isBuiltin) {
    S.removedBuiltin.push(id);
  } else {
    S.customSupps = S.customSupps.filter(function(s){return s.id!==id;});
  }
  saveS(); draw();
}

function restoreBuiltin(id) {
  S.removedBuiltin = S.removedBuiltin.filter(function(x){return x!==id;});
  saveS(); draw();
}

function saveSchedTime(blockId) {
  var el = document.getElementById('st_'+blockId);
  if (!el) return;
  S.schedTimes[blockId] = el.value;
  saveS(); draw();
}

function saveWakeBed() {
  var w = document.getElementById('wake_inp');
  var b = document.getElementById('bed_inp');
  var g = document.getElementById('gym_inp');
  if (w) S.wakeTime = w.value;
  if (b) S.bedTime = b.value;
  if (g) S.gymTime = g.value;
  // Auto-optimize block times based on wake/bed
  autoOptimizeTimes();
  computeToday();
  saveS(); draw();
}

function autoOptimizeTimes() {
  // Parse wake time and calculate optimal windows
  var wParts = S.wakeTime.split(':');
  var wake = parseInt(wParts[0])*60 + parseInt(wParts[1]||0);
  var bParts = S.bedTime.split(':');
  var bed = parseInt(bParts[0])*60 + parseInt(bParts[1]||0);
  if (bed < wake) bed += 1440; // next day
  var awake = bed - wake;
  var gParts = S.gymTime.split(':');
  var gym = parseInt(gParts[0])*60 + parseInt(gParts[1]||0);

  function toHHMM(mins) {
    var m = ((mins % 1440) + 1440) % 1440;
    return ('0'+Math.floor(m/60)).slice(-2)+':'+('0'+(m%60)).slice(-2);
  }

  S.schedTimes.wake    = toHHMM(wake);
  S.schedTimes.meal1   = toHHMM(wake + 60);
  S.schedTimes.alone   = toHHMM(wake + Math.floor(awake*0.3));
  S.schedTimes.dinner  = toHHMM(wake + Math.floor(awake*0.42));
  S.schedTimes.pregym  = toHHMM(gym - 90);
  S.schedTimes.winddown= toHHMM(bed - 120);
  S.schedTimes.bedtime = toHHMM(bed);
}


// ─── SUPPLY TRACKING ─────────────────────────────────────────
function saveSupply(id) {
  var btEl = document.getElementById('sup_bt_'+id);
  var odEl = document.getElementById('sup_od_'+id);
  var slEl = document.getElementById('sup_sl_'+id);
  var bt = btEl ? parseFloat(btEl.value) : NaN;
  var od = odEl ? odEl.value : '';
  if (isNaN(bt) || bt <= 0 || !od) { alert('Enter bottle total and opened date.'); return; }
  if (!S.supply[id]) S.supply[id] = {};
  S.supply[id].bottleTotal = bt;
  S.supply[id].openedDate = od;
  if (slEl) S.supply[id].servingDesc = slEl.value.trim();
  saveS(); draw();
}

function scanLabel(id) {
  var inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
  inp.onchange = function() {
    if (!inp.files[0]) return;
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-bg"><div class="modal" style="text-align:center;padding:36px 20px">' +
      '<div style="font-size:32px;margin-bottom:12px">📷</div>' +
      '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700;color:#e0e0f0;margin-bottom:8px">Reading Label</div>' +
      '<div id="ocr-status" style="font-size:12px;color:#555">Loading OCR engine...</div></div></div>';
    function run() {
      var statusEl = document.getElementById('ocr-status');
      if (statusEl) statusEl.textContent = 'Scanning...';
      Tesseract.recognize(inp.files[0], 'eng', {logger: function(m){ if(m.status==='recognizing text'){ var el=document.getElementById('ocr-status'); if(el) el.textContent='Scanning... '+Math.round(m.progress*100)+'%'; }}}).then(function(r) {
        closeModal();
        var result = parseOCRText(id, r.data.text);
        showOCRConfirm(id, result, r.data.text);
      }).catch(function() { closeModal(); alert('OCR failed — please enter supply info manually.'); });
    }
    if (!window.Tesseract) {
      var sc = document.createElement('script');
      sc.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      sc.onload = run; document.head.appendChild(sc);
    } else { run(); }
  };
  inp.click();
}

function parseOCRText(id, text) {
  var supp = getAllSupps().find(function(s){return s.id===id;});
  if (!supp) return null;
  var suppUnit = (supp.unit || '').toLowerCase();
  var suppDose = getDose(id, supp) || 1;

  // Normalize: fix common OCR misreads, collapse whitespace
  var t = text
    .replace(/\b[Oo](?=\d)|(?<=\d)[Oo]\b/g, '0')
    .replace(/[Il](?=\d)|(?<=\d)[Il]/g, '1')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ');

  // ── Servings Per Container ──────────────────────────────────
  var servPerContainer = null;
  var spcPats = [
    /servings?\s+per\s+container\s*[:\-]?\s*([0-9,]+)/i,
    /([0-9,]+)\s+servings?\s+per\s+container/i,
    /([0-9,]+)\s+servings?\s*$/i,
    /total\s+servings?\s*[:\-]?\s*([0-9,]+)/i,
    /contains?\s+([0-9,]+)\s+servings?/i,
    /approx\.?\s+([0-9,]+)\s+servings?/i,
    /about\s+([0-9,]+)\s+servings?/i,
    /([0-9,]+)\s+servings?\b/i
  ];
  for (var i = 0; i < spcPats.length; i++) {
    var m = t.match(spcPats[i]);
    if (m) { servPerContainer = parseFloat(m[1].replace(/,/g,'')); break; }
  }

  // ── Total Count fallback (e.g. "90 Capsules", "120 Tablets") ─
  var totalCount = null;
  var countUnit = null;
  var cntM = t.match(/([0-9,]+)\s*(capsule|softgel|vegcap|vcap|tablet|cap|tab|count|ct)\b/i);
  if (cntM) { totalCount = parseFloat(cntM[1].replace(/,/g,'')); countUnit = cntM[2].toLowerCase(); }

  // ── Serving Size ────────────────────────────────────────────
  var servingSizeVal = null;
  var servingSizeUnit = null;
  var ssvPats = [
    /serving\s+size\s*[:\-]?\s*([0-9.]+)\s*(capsule|softgel|vegcap|vcap|tablet|cap|tab|g|mg|ml|scoop)\b/i,
    /([0-9.]+)\s*(capsule|softgel|vegcap|vcap|tablet|cap|tab)\s*(?:per\s+serving|daily|each)/i,
    /take\s+([0-9.]+)\s*(capsule|softgel|tablet|cap|tab)\b/i,
    /suggested\s+use[^.]*?([0-9.]+)\s*(capsule|softgel|tablet|cap|tab)\b/i,
    /per\s+serving[:\-]?\s*([0-9.]+)\s*(g|mg|ml)\b/i,
    /([0-9.]+)\s*(g|mg|ml)\s+per\s+serving/i,
    /([0-9]+)\s*(capsule|softgel|vcap|tab|cap)\b/i  // loose last resort
  ];
  for (var i = 0; i < ssvPats.length; i++) {
    var m = t.match(ssvPats[i]);
    if (m) { servingSizeVal = parseFloat(m[1]); servingSizeUnit = m[2].toLowerCase(); break; }
  }

  // ── Calculate bottleTotal in supplement's native unit ───────
  // Rule: bottleTotal must match suppUnit so daysSince math works
  var capsUnits = ['capsule','softgel','vegcap','vcap','cap','tablet','tab'];
  var isCapsUnit = capsUnits.indexOf(suppUnit) >= 0;
  var servSizeIsCap = servingSizeUnit && capsUnits.indexOf(servingSizeUnit) >= 0;
  var bottleTotal = null;
  var servingDesc = '';
  var confidence = 'high';

  if (servPerContainer && servingSizeVal) {
    if (isCapsUnit) {
      // Supplement tracked in caps — total caps
      bottleTotal = Math.round(servPerContainer * servingSizeVal);
      servingDesc = servPerContainer + ' servings × ' + servingSizeVal + ' ' + (servingSizeUnit || suppUnit);
    } else if (servSizeIsCap) {
      // Label says "2 capsules" per serving but supp unit is mg/g
      // Assume user's dose setting = mg per capsule
      var mgPerCap = suppDose / servingSizeVal;
      bottleTotal = Math.round(servPerContainer * servingSizeVal * mgPerCap * 100) / 100;
      servingDesc = servPerContainer + ' servings × ' + servingSizeVal + ' caps × ~' + Math.round(mgPerCap) + suppUnit + '/cap';
      confidence = 'estimated';
    } else {
      // Both in same unit (mg/g)
      bottleTotal = Math.round(servPerContainer * servingSizeVal * 100) / 100;
      servingDesc = servPerContainer + ' servings × ' + servingSizeVal + (servingSizeUnit || suppUnit);
    }
  } else if (totalCount && servingSizeVal && servSizeIsCap) {
    if (isCapsUnit) {
      bottleTotal = totalCount;
      servingDesc = totalCount + ' ' + countUnit + ' (' + Math.round(totalCount / servingSizeVal) + ' servings of ' + servingSizeVal + ')';
    } else {
      var mgPerCap2 = suppDose;
      bottleTotal = Math.round(totalCount * mgPerCap2 * 100) / 100;
      servingDesc = totalCount + ' caps × ' + Math.round(mgPerCap2) + suppUnit + '/cap';
      confidence = 'estimated';
    }
  } else if (servPerContainer) {
    // Only have serving count — use current dose as serving size
    bottleTotal = Math.round(servPerContainer * suppDose * 100) / 100;
    servingDesc = servPerContainer + ' servings × ' + suppDose + suppUnit + ' (current dose used as serving size)';
    confidence = 'low';
  } else if (totalCount && isCapsUnit) {
    bottleTotal = totalCount;
    servingDesc = totalCount + ' ' + (countUnit || suppUnit) + ' total';
    confidence = 'low';
  }

  if (!bottleTotal || bottleTotal <= 0) return null;

  return {
    bottleTotal: Math.round(bottleTotal * 100) / 100,
    servPerContainer: servPerContainer,
    servingSizeVal: servingSizeVal,
    totalCount: totalCount,
    servingDesc: servingDesc,
    unit: suppUnit,
    confidence: confidence
  };
}

// ─── OCR CONFIRMATION MODAL ──────────────────────────────────
function showOCRConfirm(id, result, rawText) {
  var supp = getAllSupps().find(function(s){return s.id===id;}) || {};
  var m = document.getElementById('modal-root');
  var confColor = result ? (result.confidence==='high'?'#38b000':result.confidence==='estimated'?'#ffd60a':'#ff6b35') : '#ff6b35';
  var confLabel = result ? (result.confidence==='high'?'✅ High confidence':result.confidence==='estimated'?'⚠️ Estimated':'❓ Low confidence') : '⚠️ Could not parse';
  var bt = result ? result.bottleTotal : '';
  var sd = result ? result.servingDesc : '';

  m.innerHTML = '<div class="modal-bg"><div class="modal">' +
    '<div class="modal-hdr"><span style="font-family:\'Space Grotesk\',sans-serif;font-size:15px;font-weight:700">📷 Scan Results — '+supp.name+'</span>' +
    '<button onclick="closeModal()" style="color:#555;font-size:20px">×</button></div>' +

    '<div style="background:#0a0a14;border:1px solid #1a1a2e;border-radius:8px;padding:10px 12px;margin-bottom:12px">' +
    '<div style="font-size:9px;color:'+confColor+';text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">'+confLabel+'</div>' +
    (result
      ? '<div style="font-size:11px;color:#888;line-height:1.7">'+result.servingDesc+'</div>'
      : '<div style="font-size:11px;color:#666">Could not find serving data — raw OCR below. Enter values manually.</div>'
    ) + '</div>' +

    '<label class="flabel">Total in bottle ('+((supp.unit)||'units')+')</label>' +
    '<input class="finput" id="ocr_bt" type="number" value="'+bt+'" placeholder="Enter total '+((supp.unit)||'units')+'">' +

    '<label class="flabel">Opened on</label>' +
    '<input class="finput" id="ocr_od" type="date" value="'+((S.supply[id]&&S.supply[id].openedDate)||TODAY)+'">' +

    '<label class="flabel">Description (optional)</label>' +
    '<input class="finput" id="ocr_sd" value="'+sd+'" placeholder="e.g. 90 servings × 2 caps">' +

    (rawText
      ? '<details style="margin-top:8px"><summary style="font-size:9px;color:#444;cursor:pointer;text-transform:uppercase;letter-spacing:1px">Raw OCR text ▼</summary>' +
        '<div style="font-size:9px;color:#333;background:#080810;border-radius:6px;padding:8px;margin-top:5px;max-height:100px;overflow-y:auto;line-height:1.5;white-space:pre-wrap">'+rawText.substring(0,600).replace(/</g,'&lt;')+'</div></details>'
      : '') +

    '<button class="btn-pri" onclick="confirmOCRSave(\''+id+'\')" style="margin-top:12px">Save Supply Info</button>' +
    '<button class="btn-sec" onclick="closeModal()">Cancel</button>' +
    '</div></div>';
}

function confirmOCRSave(id) {
  var bt = parseFloat(document.getElementById('ocr_bt').value);
  var od = document.getElementById('ocr_od').value;
  var sd = (document.getElementById('ocr_sd').value||'').trim();
  if (isNaN(bt) || bt <= 0 || !od) { alert('Enter a valid total and opened date.'); return; }
  if (!S.supply[id]) S.supply[id] = {};
  S.supply[id].bottleTotal = bt;
  S.supply[id].openedDate = od;
  if (sd) S.supply[id].servingDesc = sd;
  saveS(); closeModal(); draw();
}

// ─── ADD SUPPLEMENT MODAL ────────────────────────────────────
function openAddSupp() {
  var m = document.getElementById('modal-root');
  m.innerHTML = '<div class="modal-bg" onclick="if(event.target===this)closeModal()">' +
  '<div class="modal">' +
  '<div class="modal-hdr"><span style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700">Add Supplement / Drug</span>' +
  '<button onclick="closeModal()" style="color:#555;font-size:20px;cursor:pointer">×</button></div>' +

  '<label class="flabel">Type</label>' +
  '<div class="seg" id="supp-type-seg">' +
  '<button class="seg-btn on" onclick="setSuppType(\'supplement\')">Supplement</button>' +
  '<button class="seg-btn" onclick="setSuppType(\'nootropic\')">Nootropic</button>' +
  '<button class="seg-btn" onclick="setSuppType(\'rx\')">Rx / Drug</button>' +
  '<button class="seg-btn" onclick="setSuppType(\'other\')">Other</button>' +
  '</div>' +
  '<div class="db-name-wrap"><input class="finput" id="ns_name" placeholder="Name (e.g. NMN, Modafinil, Berberine)..." oninput="dbSuggest(this.value)" autocomplete="off" style="margin-bottom:0"><div id="db-suggestions" class="db-suggestions" style="display:none"></div></div>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
  '<div><label class="flabel">Default Dose (number)</label><input class="finput" id="ns_dose" type="number" placeholder="e.g. 500" style="margin:0"></div>' +
  '<div><label class="flabel">Unit</label><select id="ns_unit" class="finput" style="margin:0"><option value="mg">mg</option><option value="g">g</option><option value="mcg">mcg</option><option value="ml">ml</option><option value="caps">caps</option><option value="drops">drops</option><option value="IU">IU</option><option value="scoop">scoop</option></select></div>' +
  '</div>' +
  '<label class="flabel">Icon (emoji)</label>' +
  '<input class="finput" id="ns_icon" placeholder="💊" style="width:80px">' +
  '<label class="flabel">Schedule Timing</label>' +
  '<select id="ns_timing" class="finput">' +
  '<option value="wake">Upon Waking (empty stomach)</option>' +
  '<option value="meal1">First Meal</option>' +
  '<option value="alone">Alone Window (isolated)</option>' +
  '<option value="dinner">Pre-Work Dinner</option>' +
  '<option value="pregym">Pre-Gym (gym days)</option>' +
  '<option value="winddown">Wind-Down (~2:30 AM)</option>' +
  '<option value="bedtime">Bedtime</option>' +
  '</select>' +
  '<label class="flabel">With Food?</label>' +
  '<div class="seg" id="food-seg"><button class="seg-btn on" onclick="setFoodPref(true)">Yes</button><button class="seg-btn" onclick="setFoodPref(false)">No</button></div>' +
  '<label class="flabel">Notes / Instructions</label>' +
  '<textarea id="ns_notes" rows="2" placeholder="Purpose, interactions, timing notes..."></textarea>' +
  '<label class="flabel">Warnings / Interactions</label>' +
  '<textarea id="ns_warns" rows="2" placeholder="Any drug interactions, contraindications..."></textarea>' +
  '<label class="flabel">Safety ceiling dose (optional)</label>' +
  '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
  '<input class="finput" id="ns_caution" type="number" placeholder="Caution at (e.g. 800)" style="margin:0">' +
  '<input class="finput" id="ns_ceiling" type="number" placeholder="Hard ceiling (e.g. 1200)" style="margin:0">' +
  '</div>' +
  '<label class="flabel">Cycle? (optional)</label>' +
  '<select id="ns_cycle" class="finput">' +
  '<option value="none">No cycling needed</option>' +
  '<option value="days">Days on/off (e.g. 5/2)</option>' +
  '<option value="weeks">Weeks on/off (e.g. 8/3)</option>' +
  '<option value="course">Timed courses</option>' +
  '</select>' +
  '<button class="btn-pri" onclick="saveNewSupp()">Add to Protocol</button>' +
  '<button class="btn-sec" onclick="closeModal()">Cancel</button>' +
  '</div></div>';

  window._foodPref = true;
  window._suppType = 'supplement';
}

function setSuppType(t) {
  window._suppType = t;
  document.querySelectorAll('#supp-type-seg .seg-btn').forEach(function(b,i){
    b.classList.toggle('on', ['supplement','nootropic','rx','other'][i]===t);
  });
}

function setFoodPref(v) {
  window._foodPref = v;
  document.querySelectorAll('#food-seg .seg-btn').forEach(function(b,i){
    b.classList.toggle('on', i===(v?0:1));
  });
}

function saveNewSupp() {
  var name = document.getElementById('ns_name').value.trim();
  if (!name) { alert('Please enter a name'); return; }
  var dose = parseFloat(document.getElementById('ns_dose').value) || 0;
  var unit = document.getElementById('ns_unit').value;
  var icon = document.getElementById('ns_icon').value.trim() || '💊';
  var timing = document.getElementById('ns_timing').value;
  var notes = document.getElementById('ns_notes').value.trim();
  var warns = document.getElementById('ns_warns').value.trim();
  var cautionAt = parseFloat(document.getElementById('ns_caution').value) || null;
  var ceilingAt = parseFloat(document.getElementById('ns_ceiling').value) || null;
  var cycleType2 = document.getElementById('ns_cycle').value;

  var db = window._dbEntry || null;
  window._dbEntry = null; // clear after use
  var colors = ['#00b4d8','#e63946','#f77f00','#80b918','#4cc9f0','#9d4edd','#ffd60a','#a0522d'];
  var color = (db && db.color) || colors[S.customSupps.length % colors.length];

  var catMap = {supplement:'Custom', nootropic:'Nootropic', rx:'Prescription', other:'Custom'};
  var newSupp = {
    id: 'custom_' + Date.now(),
    name: name,
    icon: icon,
    color: color,
    cat: (db && db.cat) || catMap[window._suppType] || 'Custom',
    dose: dose,
    unit: unit,
    timing: timing,
    gymTiming: timing,
    food: !!window._foodPref,
    foodNote: window._foodPref ? 'Take with food' : 'Take without food',
    hasCycle: cycleType2 !== 'none',
    cycleType: cycleType2 !== 'none' ? cycleType2 : null,
    daysOn: 5, daysOff: 2, weeksOn: 8, weeksOff: 3, courseWksOn: 4, courseWksOff: 4,
    cycleNote: cycleType2 === 'none' ? 'Daily — no cycling' : 'Cycling protocol',
    cycleWhy: (db && db.cycleNote) || 'User-defined cycling protocol.',
    instructions: notes || 'No specific instructions added.',
    benefits: (db && db.notes) || 'User-defined supplement.',
    synergies: 'Monitor interactions with existing stack.',
    warns: warns ? warns.split('\n').filter(function(w){return w.trim();}) : [],
    timingNote: (db && db.timing) || 'User-defined timing',
    minDose: (db && db.dose) ? db.dose * 0.25 : 0,
    maxDose: ceilingAt ? ceilingAt * 2 : ((dose * 5) || 1000),
    safetyThreshold: cautionAt || null,
    safetyMsg: cautionAt ? '⚠️ Above '+cautionAt+unit+': caution threshold.' : null,
    hardCeiling: ceilingAt || null,
    ceilingMsg: ceilingAt ? '⛔ Above '+ceilingAt+unit+': hard ceiling.' : null,
    isCustom: true,
    suppType: window._suppType || 'supplement',
    // DB-sourced meta for phase timeline
    _onsetDays: (db && db.onsetDays) || null,
    _peakDays: (db && db.peakDays) || null
  };

  // Register timeline meta if from DB
  if (db && db.onsetDays) {
    SUPP_META[newSupp.id] = {onsetDays: db.onsetDays, peakDays: db.peakDays || 30,
      peakNote: 'Full effect based on database research data.',
      fullEffectNote: db.notes ? db.notes.split('.')[0]+'.' : '',
      sideEffectWatches:[], benefitSigns:[]};
  }

  S.customSupps.push(newSupp);
  saveS();
  closeModal();
  draw();
}

// ─── SUPPLEMENT DB AUTOCOMPLETE ───────────────────────────────
function dbSuggest(val) {
  var box = document.getElementById('db-suggestions');
  if (!box) return;
  if (!val || val.length < 2 || typeof SUPPLEMENT_DB === 'undefined') {
    box.style.display = 'none'; return;
  }
  var results = searchDB(val);
  if (!results.length) { box.style.display = 'none'; return; }
  // Store results FIRST so onclick can access them
  window._dbResults = results;
  box.innerHTML = results.map(function(s, i) {
    return '<div class="db-sugg-item" onclick="fillFromDB('+i+')">' +
      '<span class="db-sugg-icon">'+s.icon+'</span>' +
      '<span class="db-sugg-name">'+s.name+'</span>' +
      '<span class="db-sugg-cat">'+s.cat+'</span></div>';
  }).join('');
  box.style.display = 'block';
}

function fillFromDB(idx) {
  var s = window._dbResults && window._dbResults[idx];
  if (!s) return;
  // Hide suggestions
  var box = document.getElementById('db-suggestions');
  if (box) box.style.display = 'none';

  // Fill name, dose, unit, icon
  var nameEl = document.getElementById('ns_name');
  if (nameEl) nameEl.value = s.name;
  var doseEl = document.getElementById('ns_dose');
  if (doseEl) doseEl.value = s.dose || '';
  var unitEl = document.getElementById('ns_unit');
  if (unitEl) unitEl.value = s.unit || 'mg';
  var iconEl = document.getElementById('ns_icon');
  if (iconEl) iconEl.value = s.icon || '💊';

  // Fill timing
  var timingEl = document.getElementById('ns_timing');
  if (timingEl && s.timing) timingEl.value = s.timing;

  // Fill food preference
  window._foodPref = !!s.food;
  document.querySelectorAll('#food-seg .seg-btn').forEach(function(b,i){
    b.classList.toggle('on', i===(s.food?0:1));
  });

  // Fill supp type
  var t = s.suppType || 'supplement';
  window._suppType = t;
  document.querySelectorAll('#supp-type-seg .seg-btn').forEach(function(b,i){
    b.classList.toggle('on', ['supplement','nootropic','rx','other'][i]===t);
  });

  // Fill notes: combine instructions + benefits
  var notesEl = document.getElementById('ns_notes');
  if (notesEl) notesEl.value = s.notes || '';

  // Fill warns
  var warnsEl = document.getElementById('ns_warns');
  if (warnsEl) warnsEl.value = s.warns || '';

  // Fill safety thresholds
  var cautionEl = document.getElementById('ns_caution');
  if (cautionEl) cautionEl.value = s.safetyThreshold || '';
  var ceilEl = document.getElementById('ns_ceiling');
  if (ceilEl) ceilEl.value = s.hardCeiling || '';

  // Fill cycle
  var cycleEl = document.getElementById('ns_cycle');
  if (cycleEl && s.cycleType) cycleEl.value = s.cycleType;

  // Store DB entry for use during save (to inject onsetDays/peakDays)
  window._dbEntry = s;
}

function confirmRemove(id) {
  var s = getAllSupps().find(function(x){return x.id===id;});
  if (s && confirm('Remove '+s.name+' from protocol?')) removeSupp(id);
}


// ─── RENDER SECOND DOSE CARD ──────────────────────────────────
function renderSecondDoseCard(s) {
  var id2 = s.id+'_2nd';
  var key2 = id2+'_'+TODAY;
  var ck2 = !!S.checks[key2];
  var dt2 = S.doseTimes && S.doseTimes[key2];
  var dtStr = '';
  if (dt2) { var _bp=dt2.split(':'),_bh2=parseInt(_bp[0]),_ap2=_bh2>=12?'pm':'am'; _bh2=_bh2%12||12; dtStr='<div style="font-size:9px;color:#38b000;margin-top:1px">✓ taken at '+_bh2+':'+_bp[1]+_ap2+'</div>'; }
  var dose2 = getDose(s.id, s);
  var doseLabel2 = dose2+' '+(s.unit||'');
  if (s.id==='mgt') doseLabel2 = dose2+' caps ('+(dose2*36)+'mg Mg)';
  if (s.id==='mgg') doseLabel2 = dose2+' caps ('+(dose2*70)+'mg Mg)';
  var open2 = S.expanded === id2;
  var t2 = S.secondDoseTiming[s.id] || 'bedtime';
  var h = '<div style="margin-bottom:'+(open2?'0':'7px')+'">';
  h += '<div class="card" onclick="toggleExp(\''+id2+'\')" style="border-color:'+(ck2?s.color+'55':'#1e1e30')+';background:'+(ck2?'linear-gradient(135deg,#0d0d1a,rgba('+rgb(s.color)+',.05))':'#0d0d1a')+'">';
  h += '<div style="display:flex;align-items:center;gap:10px">';
  h += '<button class="chk" onclick="event.stopPropagation();toggleCheck(\''+id2+'\')" style="background:'+(ck2?s.color:'transparent')+';border-color:'+(ck2?s.color:'#333')+';color:'+(ck2?'#000':'#555')+'">'+(ck2?'✓':'')+'</button>';
  h += '<span style="font-size:18px">'+s.icon+'</span>';
  h += '<div style="flex:1"><div style="font-size:13px;font-weight:600;font-family:\'Space Grotesk\',sans-serif;color:#e0e0f0">'+s.name+' <span style="font-size:10px;font-weight:400;color:'+s.color+'">2nd dose</span></div>';
  h += '<div style="font-size:10px;color:#666;margin-top:1px">'+doseLabel2+' · '+(s.food?'with food':'empty stomach')+'</div>'+dtStr+'</div>';
  h += '<span style="color:#333;font-size:12px;'+(open2?'transform:rotate(90deg);':'')+'transition:transform .2s;flex-shrink:0">›</span>';
  h += '</div></div>';
  if (open2) {
    h += '<div class="panel" style="border-color:'+s.color+'33">';
    h += '<div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Timing Block</div>';
    h += '<select onchange="S.secondDoseTiming[\''+s.id+'\']=this.value;saveS();draw()" onclick="event.stopPropagation()" style="width:100%;background:#111;border:1px solid #222;border-radius:6px;padding:6px 8px;color:#ccc;font-size:11px;margin-bottom:10px">';
    DEFAULT_BLOCKS.forEach(function(blk2) { h += '<option value="'+blk2.id+'"'+(t2===blk2.id?' selected':'')+'>'+blk2.label+'</option>'; });
    h += '</select>';
    h += '<button onclick="S.secondDose[\''+s.id+'\']=false;S.expanded=null;saveS();draw()" style="width:100%;padding:8px;border-radius:7px;background:rgba(255,107,53,.1);border:1px solid rgba(255,107,53,.3);color:#ff6b35;font-size:11px;cursor:pointer">Remove 2nd Dose</button>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

// ─── RENDER SCHEDULE ─────────────────────────────────────────
function renderSchedule() {
  var gym = isGym();
  var mg = getMgSources();
  var mgc = mg.total>450?'#ff6b35':mg.total>420?'#ffd60a':'#38b000';
  var mgpct = Math.min(100,(mg.total/500)*100);
  var allSupps = getAllSupps();
  var checked = allSupps.filter(function(s){return isChecked(s.id);}).length;
  var pct = allSupps.length ? (checked/allSupps.length)*100 : 0;

  var h = '<div class="sec sIn">';

  // Pre-wake mode banner
  if (isPreWake()) {
    var logD = new Date(TODAY+'T12:00:00');
    var logDStr = logD.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    h += '<div style="background:rgba(100,80,200,.12);border:1px solid rgba(100,80,200,.3);border-radius:10px;padding:10px 12px;margin-bottom:11px;font-size:11px;line-height:1.6">';
    h += '<div style="font-size:9px;color:#9d7fff;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">🌙 Pre-Wake Mode — Overnight Shift</div>';
    h += 'Before wake time ('+S.wakeTime+'). All dose checks stamp to <strong style="color:#e0e0f0">'+logDStr+'</strong> — your active protocol day.';
    h += '</div>';
  }

  // Gym selector
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:10px 12px;margin-bottom:11px">';
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Gym Days</div>';
  h += '<div style="display:flex;gap:5px;flex-wrap:wrap">';
  Object.keys(S.gymDays).forEach(function(d) {
    h += '<button class="daybtn'+(S.gymDays[d]?' on':'')+(d===TODAY_DAY?' today':'')+'" onclick="toggleGym(\''+d+'\')">'+d+'</button>';
  });
  h += '</div><div style="margin-top:6px;font-size:10px;color:'+(gym?'#4cc9f0':'#555')+'">'+(gym?'🏋️ Gym Day — creatine → pre-gym ('+S.schedTimes.pregym+')':'Rest day — creatine at first meal')+'</div></div>';

  // Mg bar
  if (mg.total > 0) {
    h += '<div class="wbar" style="border-color:'+mgc+'44;background:rgba('+rgb(mgc)+',.05)">';
    h += '<div style="font-size:9px;color:'+mgc+';letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">⚡ Daily Magnesium Load</div>';
    h += '<div style="background:#111;border-radius:3px;height:6px;margin-bottom:4px"><div style="width:'+mgpct+'%;height:6px;border-radius:3px;background:'+mgc+';transition:width .5s"></div></div>';
    var parts = mg.parts.map(function(p){ return '<span style="color:'+p.color+'">'+p.name.split(' ')[0]+' '+p.mg+'mg</span>'; }).join(' + ');
    h += '<div style="font-size:10px;color:#888">'+parts+' = <strong style="color:'+mgc+'">'+mg.total+'mg</strong>'+(mg.total>420?' — <strong>+'+(mg.total-420)+'mg over ceiling</strong>':' — within range')+'</div></div>';
  }

  // Stack health score
  var onCycleSupps = allSupps.filter(function(s){ var cs=cycleStatus(s,S.startDates[s.id]); return !s.hasCycle || !cs || cs.on; });
  var checkedOnCycle = onCycleSupps.filter(function(s){ return isChecked(s.id); }).length;
  var todayPct = onCycleSupps.length ? Math.round((checkedOnCycle/onCycleSupps.length)*100) : 0;
  var lowSupply = allSupps.filter(function(s){ var sup=S.supply[s.id]; if(!sup||!sup.bottleTotal||!sup.openedDate) return false; var d=getDose(s.id,s)||1; var left=Math.max(0,sup.bottleTotal-d*getDaysChecked(s.id,sup.openedDate)); return (left/d)<=14; }).length;
  var avg7 = (function(){ var tot=0,cnt=0; allSupps.forEach(function(s){ for(var i=1;i<=7;i++){var d=new Date();d.setDate(d.getDate()-i);var ds=localDateStr(d);var cs=cycleStatus(s,S.startDates[s.id]);var offD=s.hasCycle&&S.startDates[s.id]&&getCycleStatesForRange(s,S.startDates[s.id],d,d)[ds];if(!offD||offD.on){cnt++;if(S.checks[s.id+'_'+ds])tot++;}} }); return cnt?Math.round((tot/cnt)*100):100; })();
  var healthScore = Math.round(avg7*0.5 + todayPct*0.3 + (lowSupply===0?20:lowSupply===1?10:0));
  var hsc = healthScore>=80?'#38b000':healthScore>=55?'#ffd60a':'#ff6b35';
  var hsl = healthScore>=80?'On track':'Needs attention';
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:10px 12px;margin-bottom:11px">';
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">';
  h += '<span style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:2px">Stack Health</span>';
  h += '<span style="font-size:14px;font-weight:700;color:'+hsc+'">'+healthScore+'<span style="font-size:9px;font-weight:400;color:#444"> / 100 · '+hsl+'</span></span>';
  h += '</div>';
  h += '<div style="background:#111;border-radius:3px;height:5px;margin-bottom:6px"><div style="width:'+healthScore+'%;height:5px;border-radius:3px;background:'+hsc+';transition:width .4s"></div></div>';
  h += '<div style="display:flex;gap:12px;font-size:10px;color:#555">';
  h += '<span>Today: <strong style="color:'+(todayPct>=80?'#38b000':todayPct>=50?'#ffd60a':'#ff6b35')+'">'+checkedOnCycle+'/'+onCycleSupps.length+'</strong></span>';
  h += '<span>7d adherence: <strong style="color:'+(avg7>=80?'#38b000':avg7>=50?'#ffd60a':'#ff6b35')+'">'+avg7+'%</strong></span>';
  if (lowSupply>0) h += '<span style="color:#ff6b35">⚠️ '+lowSupply+' low supply</span>';
  h += '</div></div>';

  // Schedule blocks
  DEFAULT_BLOCKS.forEach(function(blk) {
    if (blk.id === "pregym" && !gym) return;
    var tkey = gym ? "gymTiming" : "timing";
    var blkSupps = allSupps.filter(function(s) {
      return (s[tkey] || s.timing) === blk.id;
    });
    var secondSupps = allSupps.filter(function(s) {
      return !!S.secondDose[s.id] && (S.secondDoseTiming[s.id] || 'bedtime') === blk.id;
    });
    if (blkSupps.length === 0 && secondSupps.length === 0) return;
    h += blkRow(blk, gym);
    blkSupps.forEach(function(s) { h += suppCard(s, blk.id); });
    secondSupps.forEach(function(s) { h += renderSecondDoseCard(s); });
  });

  // Add supplement button
  h += '<div style="margin-top:6px;margin-bottom:4px"><button onclick="openAddSupp()" style="width:100%;padding:11px;border-radius:10px;border:1px dashed #2a2a2e;color:#444;font-size:11px;letter-spacing:1px;cursor:pointer;background:transparent;transition:all .15s" onmouseover="this.style.borderColor=\'#00b4d8\';this.style.color=\'#00b4d8\'" onmouseout="this.style.borderColor=\'#2a2a2e\';this.style.color=\'#444\'">+ Add Supplement / Prescription Drug</button></div>';

  // Show removed built-ins if any
  if (S.removedBuiltin.length) {
    h += '<div style="margin-top:8px;padding:8px 10px;background:#0a0a14;border-radius:8px;border:1px solid #1a1a2e">';
    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Removed from protocol:</div>';
    S.removedBuiltin.forEach(function(id) {
      var s = BUILTIN.find(function(x){return x.id===id;});
      if (!s) return;
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      h += '<span style="font-size:13px">'+s.icon+'</span><span style="font-size:11px;color:#555;flex:1">'+s.name+'</span>';
      h += '<button onclick="restoreBuiltin(\''+id+'\')" style="font-size:10px;color:#00b4d8;background:#00b4d822;border:1px solid #00b4d833;border-radius:4px;padding:2px 7px;cursor:pointer">Restore</button>';
      h += '</div>';
    });
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function blkRow(blk, gym) {
  var timeLabel = S.schedTimes[blk.id] || '';
  var optNote = gym && TIMING_RULES[blk.id] && TIMING_RULES[blk.id].gym ? TIMING_RULES[blk.id].gym.note : blk.note;
  var h = '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;margin-top:14px">';
  h += '<div style="width:14px;height:1px;background:'+blk.color+';opacity:.7"></div>';
  h += '<span style="font-size:10px;color:'+blk.color+';letter-spacing:2px;text-transform:uppercase">'+blk.label+'</span>';
  if (timeLabel) h += '<span style="font-size:9px;color:#444">'+timeLabel+'</span>';
  h += '<div style="flex:1;height:1px;background:linear-gradient(90deg,'+blk.color+'33,transparent)"></div></div>';
  h += '<div style="font-size:10px;color:#445;margin-bottom:7px;padding-left:21px">'+optNote+'</div>';
  return h;
}

function suppCard(s, blkId) {
  var ck = isChecked(s.id);
  var cs = cycleStatus(s, S.startDates[s.id]);
  var off = cs && !cs.on;
  var key = s.id+"_"+blkId;
  var open = S.expanded === key;
  var dose = getDose(s.id, s);
  var safety = getSafetyLevel(s, dose);
  var showCaut = safety && !S.dismissed["caution_"+s.id];
  var persist = safety && safety.level==='danger' && S.dismissed["caution_"+s.id];

  var doseLabel = dose + ' ' + (s.unit||'');
  if (s.id==='mgt') doseLabel = dose+' caps ('+(dose*36)+'mg Mg)'+(S.secondDose['mgt']?' · 2nd dose at bedtime':'');
  if (s.id==='mgg') doseLabel = dose+' caps ('+(dose*70)+'mg Mg)';

  var cycleTag = '';
  if (s.hasCycle) {
    if (!S.startDates[s.id]) cycleTag = '<span class="tag" style="background:#1a1a1a;color:#555;margin-left:4px">set date</span>';
    else if (off) cycleTag = '<span class="tag" style="background:#222;color:#666;margin-left:4px">OFF CYCLE</span>';
    else if (cs) cycleTag = '<span class="tag" style="background:'+s.color+'22;color:'+s.color+';margin-left:4px">'+cs.lbl+'</span>';
  }
  if (s.isCustom) cycleTag += '<span class="tag" style="background:#1a1a2e;color:#555;margin-left:4px;text-transform:none">'+(s.suppType||'custom')+'</span>';

  var skipped = isSkipped(s.id, TODAY);
  var h = '<div style="margin-bottom:'+(open?'0':'7px')+'">';
  h += '<div class="card" onclick="toggleExp(\''+key+'\')" style="border-color:'+(off?'#1e1e30':ck?s.color+'55':skipped?'#333':'#1e1e30')+';opacity:'+(off?'.4':'1')+';background:'+(ck?'linear-gradient(135deg,#0d0d1a,rgba('+rgb(s.color)+',.05))':skipped?'#0d0d0d':'#0d0d1a')+'">';
  h += '<div style="display:flex;align-items:center;gap:10px">';
  if (off) {
    // Off-cycle: show REST badge instead of checkmark — grayed, not interactive
    h += '<div style="width:28px;height:28px;border-radius:50%;background:#1a1a2e;border:2px solid #2a2a3e;display:flex;align-items:center;justify-content:center;font-size:8px;color:#444;flex-shrink:0">REST</div>';
  } else if (skipped) {
    h += '<button class="chk" onclick="event.stopPropagation();skipDay(\''+s.id+'\')" style="background:#1a1a1a;border-color:#444;color:#666;font-size:9px;letter-spacing:0" title="Tap to un-skip">⏭</button>';
  } else {
    h += '<button class="chk" onclick="event.stopPropagation();toggleCheck(\''+s.id+'\')" style="background:'+(ck?s.color:'transparent')+';border-color:'+(ck?s.color:'#333')+';color:'+(ck?'#000':'#555')+'">'+(ck?'✓':'')+'</button>';
  }
  h += '<span style="font-size:18px">'+s.icon+'</span>';
  h += '<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;flex-wrap:wrap"><span style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:'+(off?'#555':'#e0e0f0')+'">'+s.name+'</span>'+cycleTag+'</div>';
  h += '<div style="font-size:10px;color:#666;margin-top:1px">'+doseLabel+' · '+(s.food?'with food':'empty stomach')+'</div>';
  var _dt = S.doseTimes[s.id+'_'+TODAY];
  if (_dt) {
    var _dtp = _dt.split(':'), _dth = parseInt(_dtp[0]), _ampm = _dth>=12?'pm':'am';
    _dth = _dth%12||12;
    h += '<div style="font-size:9px;color:#38b000;margin-top:1px">✓ taken at '+_dth+':'+_dtp[1]+_ampm+'</div>';
  }
  var ph = getPhase(s, S.startDates[s.id]);
  if (ph) {
    h += '<div style="font-size:9px;color:'+ph.color+';margin-top:2px;display:flex;align-items:center;gap:4px"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:'+ph.color+'"></span>'+ph.phase+' · '+ph.effectPct+'% effective · '+ph.label+'</div>';
  }
  h += '</div>';
  // Dose controls
  h += '<div style="display:flex;align-items:center;gap:4px" onclick="event.stopPropagation()">';
  h += '<button class="adj" onclick="adjDose(\''+s.id+'\',-1)">−</button>';
  var safetyBorder = safety && !S.dismissed["caution_"+s.id] ? safety.color : '#2a2a2a';
  h += '<input class="dinput" id="di_'+s.id+'" value="'+dose+'" onchange="setDoseFromInput(\''+s.id+'\')" style="border-color:'+safetyBorder+'" onclick="event.stopPropagation()">';
  h += '<button class="adj" onclick="adjDose(\''+s.id+'\',1)" style="border-color:'+safetyBorder+'">+</button>';
  h += '</div>';
  h += '<span style="color:#333;font-size:12px;'+(open?'transform:rotate(90deg);':'')+'transition:transform .2s;flex-shrink:0">›</span>';
  h += '</div>';

  if (showCaut) {
    h += '<div onclick="event.stopPropagation()" style="margin-top:8px;padding:7px 9px;border-radius:7px;background:rgba('+rgb(safety.color)+',.08);border:1px solid '+safety.color+'44;display:flex;align-items:flex-start;gap:6px">';
    h += '<span style="font-size:10px">⚠️</span><div style="flex:1;font-size:10px;color:'+safety.color+';line-height:1.4">'+safety.msg+'</div>';
    h += '<button onclick="event.stopPropagation();dismiss(\''+s.id+'\')" style="background:'+safety.color+'22;border:1px solid '+safety.color+'44;border-radius:4px;color:'+safety.color+';font-size:9px;padding:2px 6px;cursor:pointer;flex-shrink:0;white-space:nowrap">Got it</button>';
    h += '</div>';
  }
  if (persist) h += '<div style="margin-top:5px;font-size:10px;color:'+safety.color+'">'+safety.msg+'</div>';

  // Skip button — only when on-cycle and not already checked
  if (!off && !ck) {
    h += '<div style="margin-top:7px;display:flex;gap:6px" onclick="event.stopPropagation()">';
    h += '<button onclick="event.stopPropagation();skipDay(\''+s.id+'\')" style="flex:1;padding:5px 8px;background:'+(skipped?'#2a1a1a':'#0d0d1a')+';border:1px solid '+(skipped?'#ff6b3566':'#1a1a2e')+';border-radius:6px;font-size:10px;color:'+(skipped?'#ff6b35':'#444')+';cursor:pointer">'+(skipped?'⏭ Skipped today — tap to undo':'⏭ Skip today (intentional)')+'</button>';
    h += '</div>';
  }
  if (off) {
    h += '<div style="margin-top:7px;font-size:10px;color:#555;text-align:center;padding:4px 0">'+cs.lbl+' — no dose needed</div>';
  }

  h += '</div>'; // close card

  if (open) {
    h += '<div class="panel" style="border-color:'+s.color+'33">';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:9px">';
    h += '<div class="sbox"><div class="slbl">Dose</div><div class="sval">'+doseLabel+'</div></div>';
    h += '<div class="sbox"><div class="slbl">Food</div><div class="sval" style="color:'+(s.food?'#38b000':'#ff6b35')+'">'+(s.food?'Required':'No food')+'</div></div>';
    h += '</div>';
    h += '<div class="sbox" style="margin-bottom:9px"><div class="slbl">Cycle</div><div class="sval">'+s.cycleNote+'</div></div>';
    // Second dose toggle
    var _has2nd = !!S.secondDose[s.id];
    var _t2nd = S.secondDoseTiming[s.id] || 'bedtime';
    h += '<div onclick="event.stopPropagation()" style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:8px;padding:9px 11px;margin-bottom:9px">';
    h += '<div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Second Dose</div>';
    if (!_has2nd) {
      h += '<button onclick="event.stopPropagation();S.secondDose[\''+s.id+'\']=true;if(!S.secondDoseTiming[\''+s.id+'\'])S.secondDoseTiming[\''+s.id+'\']=\'bedtime\';saveS();draw()" style="width:100%;padding:7px;border-radius:6px;background:#111;border:1px solid #2a2a2e;color:#555;font-size:11px;cursor:pointer">+ Add Second Dose</button>';
    } else {
      h += '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">';
      h += '<select onchange="event.stopPropagation();S.secondDoseTiming[\''+s.id+'\']=this.value;saveS();draw()" onclick="event.stopPropagation()" style="flex:1;background:#111;border:1px solid #222;border-radius:6px;padding:5px 8px;color:#ccc;font-size:10px">';
      DEFAULT_BLOCKS.forEach(function(blk2) { h += '<option value="'+blk2.id+'"'+(_t2nd===blk2.id?' selected':'')+'>'+blk2.label+'</option>'; });
      h += '</select>';
      h += '<button onclick="event.stopPropagation();S.secondDose[\''+s.id+'\']=false;S.expanded=null;saveS();draw()" style="padding:5px 10px;border-radius:6px;background:rgba(255,107,53,.1);border:1px solid rgba(255,107,53,.3);color:#ff6b35;font-size:10px;cursor:pointer;white-space:nowrap">Remove</button>';
      h += '</div>';
    }
    h += '</div>';
    // Remove from protocol
    h += '<button onclick="event.stopPropagation();confirmRemove(\''+s.id+'\')" style="width:100%;padding:7px;border-radius:7px;background:rgba(255,107,53,.05);border:1px solid rgba(255,107,53,.15);color:#ff6b35;font-size:10px;cursor:pointer;margin-bottom:9px">🗑 Remove from Protocol</button>';

    // ── Adherence Calendar ───────────────────────────────────────
    var calOpen = !!(_calOffset[s.id] !== undefined || window['_calVis_'+s.id]);
    h += '<button onclick="event.stopPropagation();window[\'_calVis_'+s.id+'\']=!window[\'_calVis_'+s.id+'\'];draw()" style="width:100%;background:#0d0d1a;border:1px solid #1a1a2e;border-radius:7px;padding:7px 10px;color:#777;font-size:10px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;margin-bottom:9px">';
    h += '<span>📅 Dose History &amp; Adherence</span><span style="font-size:12px">'+(window['_calVis_'+s.id]?'▲':'▼')+'</span></button>';
    if (window['_calVis_'+s.id]) {
      h += renderSuppCalendar(s.id, s);
    }

    // ── Time on Protocol ────────────────────────────────────────
    var currentStreak = S.startDates[s.id] ? getConsecutiveStreak(s.id) : null;
    var totalCheckedDays = S.startDates[s.id] ? getDaysChecked(s.id, S.startDates[s.id]) : 0;
    var lifetimeTotal = (S.lifetimeDays[s.id]||0) + totalCheckedDays;
    if (currentStreak !== null || lifetimeTotal > 0) {
      var hasPrior = (S.lifetimeDays[s.id]||0) > 0;
      h += '<div style="display:grid;grid-template-columns:'+(hasPrior?'1fr 1fr':'1fr')+';gap:6px;margin-bottom:9px">';
      if (currentStreak !== null) {
        var streakColor = currentStreak < 7 ? '#555' : currentStreak < 30 ? '#ffd60a' : '#38b000';
        h += '<div class="sbox"><div class="slbl">Streak (actual)</div><div class="sval" style="color:'+streakColor+'">'+currentStreak+' days</div></div>';
      }
      h += '<div class="sbox"><div class="slbl">Total Doses</div><div class="sval" style="color:#00b4d8">'+lifetimeTotal+'</div></div>';
      h += '</div>';
    }

    // ── Dose History ─────────────────────────────────────────────
    var dh = S.doseHistory[s.id];
    if (dh && dh.length > 1) {
      h += '<div class="sbox" style="margin-bottom:9px"><div class="slbl">Dose History</div>';
      dh.slice(-4).reverse().forEach(function(e){
        h += '<div style="font-size:10px;color:#555;margin-top:3px">'+e.date+' → <span style="color:#aaa">'+e.dose+' '+s.unit+'</span></div>';
      });
      h += '</div>';
    }

    // ── Notes for this supplement ────────────────────────────────
    var suppNotes = S.notes.filter(function(n){ return n.sid === s.id; });
    if (suppNotes.length) {
      h += '<div class="sbox" style="margin-bottom:9px"><div class="slbl">Notes</div>';
      suppNotes.slice(-3).reverse().forEach(function(n){
        h += '<div style="font-size:10px;color:#666;margin-top:4px;line-height:1.5"><span style="color:#444">'+n.dt+'</span><br>'+n.txt+'</div>';
      });
      h += '</div>';
    }

    // ── Supply Tracker ──────────────────────────────────────────
    var sup = S.supply[s.id] || {};
    var supplyDaysLeft = null, supplyPct = 0;
    if (sup.bottleTotal && sup.openedDate) {
      var dailyDoseS = getDose(s.id, s) || 1;
      var daysActuallyTaken = getDaysChecked(s.id, sup.openedDate); // only count actual doses
      var unitsUsed = dailyDoseS * daysActuallyTaken;
      var unitsLeft = Math.max(0, sup.bottleTotal - unitsUsed);
      supplyDaysLeft = Math.round(unitsLeft / dailyDoseS);
      supplyPct = Math.min(100, Math.round((unitsUsed / sup.bottleTotal) * 100));
    }
    h += '<div style="margin-bottom:9px;padding:10px 11px;background:#080810;border:1px solid #1a1a2e;border-radius:9px" onclick="event.stopPropagation()">';
    h += '<div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">📦 Supply Tracker</div>';
    if (supplyDaysLeft !== null) {
      var supC = supplyDaysLeft <= 5 ? '#ff4444' : supplyDaysLeft <= 14 ? '#ffd60a' : '#38b000';
      var daysToReorder = Math.max(0, supplyDaysLeft - 7);
      var reorderDate = new Date(); reorderDate.setDate(reorderDate.getDate() + daysToReorder);
      var reorderStr = reorderDate.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      h += '<div style="background:#111;border-radius:4px;height:5px;margin-bottom:7px"><div style="width:'+supplyPct+'%;height:5px;border-radius:4px;background:'+supC+';transition:width .5s"></div></div>';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
      h += '<span style="font-size:11px;color:'+supC+'"><strong>'+supplyDaysLeft+' days</strong> left</span>';
      h += '<span style="font-size:10px;color:#555">Order by '+reorderStr+'</span></div>';
      if (supplyDaysLeft <= 14) h += '<div style="font-size:10px;color:'+supC+';background:rgba('+rgb(supC)+',.08);border:1px solid rgba('+rgb(supC)+',.25);padding:5px 8px;border-radius:6px;margin-bottom:7px">'+(supplyDaysLeft<=5?'🔴 Order now — critically low':'🟡 Order soon — 2-week warning')+'</div>';
      if (sup.servingDesc) h += '<div style="font-size:10px;color:#444;margin-bottom:7px">'+sup.servingDesc+'</div>';
    } else {
      h += '<div style="font-size:11px;color:#333;margin-bottom:8px">No supply data — enter bottle info below.</div>';
    }
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px">';
    h += '<div><div style="font-size:9px;color:#444;margin-bottom:3px">Total in bottle ('+s.unit+')</div>';
    h += '<input type="number" id="sup_bt_'+s.id+'" value="'+(sup.bottleTotal||'')+'" placeholder="e.g. '+(s.unit==='caps'?'90':s.unit==='g'?'200':s.unit==='mg'?'45000':'90')+'" style="width:100%;background:#111;border:1px solid #222;border-radius:6px;padding:5px 8px;color:#ccc;font-size:11px"></div>';
    h += '<div><div style="font-size:9px;color:#444;margin-bottom:3px">Opened on</div>';
    h += '<input type="date" id="sup_od_'+s.id+'" value="'+(sup.openedDate||'')+'" style="width:100%;background:#111;border:1px solid #222;border-radius:6px;padding:5px 8px;color:#ccc;font-size:11px"></div>';
    h += '</div>';
    h += '<input type="text" id="sup_sl_'+s.id+'" value="'+(sup.servingDesc||'')+'" placeholder="Label notes (optional, e.g. 90 servings × 2 caps)" style="width:100%;background:#111;border:1px solid #222;border-radius:6px;padding:5px 8px;color:#555;font-size:10px;margin-bottom:6px">';
    h += '<div style="display:flex;gap:6px">';
    h += '<button onclick="saveSupply(\''+s.id+'\')" style="flex:1;padding:6px;background:'+s.color+';color:#000;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer">Save Supply</button>';
    h += '<button onclick="scanLabel(\''+s.id+'\')" style="padding:6px 12px;background:#1a1a2e;border:1px solid #2a2a3e;color:#aaa;border-radius:6px;font-size:10px;cursor:pointer">📷 Scan Label</button>';
    h += '</div></div>';

    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Food Note</div><div style="font-size:11px;color:#888;padding:6px 9px;background:#111;border-radius:6px;margin-bottom:9px">'+s.foodNote+'</div>';
    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Instructions</div><div style="font-size:11px;color:#999;line-height:1.7;margin-bottom:9px">'+s.instructions+'</div>';
    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Benefits</div><div style="font-size:11px;color:#888;line-height:1.7;margin-bottom:9px">'+s.benefits+'</div>';
    var activeSuppIds2 = getAllSupps().map(function(x){return x.id;});
    var activeSyns = getSynergies(s.id, activeSuppIds2);
    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Synergies with Your Stack</div>';
    if (activeSyns.length) {
      activeSyns.forEach(function(syn){
        h += '<div style="padding:7px 9px;border-radius:7px;background:rgba('+rgb(syn.color)+',.07);border:1px solid rgba('+rgb(syn.color)+',.25);margin-bottom:6px">';
        h += '<div style="font-size:10px;font-weight:700;color:'+syn.color+';margin-bottom:3px">🔗 '+syn.label+'</div>';
        h += '<div style="font-size:11px;color:#888;line-height:1.6">'+syn.note+'</div></div>';
      });
    } else {
      h += '<div style="font-size:11px;color:#888;line-height:1.7;margin-bottom:9px">'+s.synergies+'</div>';
    }
    if (s.warns && s.warns.length) {
      s.warns.forEach(function(w){ h += '<div style="font-size:11px;color:#ff6b35;background:rgba(255,107,53,.08);padding:6px 9px;border-radius:6px;line-height:1.6;margin-bottom:5px">'+w+'</div>'; });
    }
    if (s.hasCycle && s.cycleWhy) {
      h += '<div style="margin-top:9px;padding-top:9px;border-top:1px solid #1a1a2e">';
      h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Why Cycle?</div>';
      h += '<div style="font-size:11px;color:#777;line-height:1.7">'+s.cycleWhy+'</div></div>';
    }
    // ── Inline log section ──────────────────────────────────
    var cardNotes = S.notes.filter(function(n){return n.sid===s.id;});
    var cardSymps = (S.symptomLogs||[]).filter(function(e){return (e.suppIds||[]).indexOf(s.id)>=0;});
    h += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #1a1a2e">';
    h += '<div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px">'+s.icon+' Log for '+s.name.split(' ')[0]+'</div>';

    // Quick-add note
    h += '<div style="display:flex;gap:6px;margin-bottom:9px" onclick="event.stopPropagation()">';
    h += '<input type="text" id="card_note_'+s.id+'" placeholder="Quick note for this supplement..." style="flex:1;background:#0a0a14;border:1px solid #222;border-radius:6px;padding:5px 8px;color:#ccc;font-size:11px">';
    h += '<button onclick="event.stopPropagation();addNoteInCard(\''+s.id+'\')" style="background:'+s.color+';color:#000;padding:5px 10px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap">+ Note</button>';
    h += '</div>';

    // Existing notes for this supplement
    if (cardNotes.length || cardSymps.length) {
      var allEntries = [];
      cardNotes.forEach(function(n,i){allEntries.push({type:'note', data:n, idx:S.notes.indexOf(n)});});
      cardSymps.forEach(function(e,i){allEntries.push({type:'symptom', data:e, idx:S.symptomLogs.indexOf(e)});});
      allEntries.sort(function(a,b){ return 0; }); // newest at bottom (array order = chronological)
      allEntries.slice(-5).forEach(function(entry) { // show last 5 entries
        if (entry.type === 'note') {
          h += '<div style="padding:6px 8px;background:#0a0a14;border-radius:6px;margin-bottom:4px;display:flex;justify-content:space-between;align-items:flex-start">';
          h += '<div style="font-size:11px;color:#777;line-height:1.5;flex:1">'+entry.data.txt+'</div>';
          h += '<span style="font-size:9px;color:#444;margin-left:8px;white-space:nowrap">'+entry.data.dt+'</span></div>';
        } else {
          var isPos = entry.data.isPositive || entry.data.symptom.startsWith('✅');
          h += '<div style="padding:6px 8px;background:#0a0a14;border-left:2px solid '+(isPos?'#38b000':'#ff6b35')+';border-radius:0 6px 6px 0;margin-bottom:4px;display:flex;justify-content:space-between;align-items:flex-start">';
          h += '<div style="flex:1"><span style="font-size:11px;color:'+(isPos?'#38b000':'#ff6b35')+'">'+entry.data.symptom+'</span>';
          var sevDots = Array(entry.data.severity||1).fill('●').join('')+Array(5-(entry.data.severity||1)).fill('○').join('');
          h += ' <span style="font-size:9px;color:#555">'+sevDots+'</span>';
          if (entry.data.notes) h += '<div style="font-size:10px;color:#666;margin-top:2px">'+entry.data.notes+'</div>';
          h += '</div><span style="font-size:9px;color:#444;margin-left:8px;white-space:nowrap">'+entry.data.dt+'</span></div>';
        }
      });
      if (allEntries.length > 5) h += '<div style="font-size:10px;color:#555;text-align:center;padding:4px 0">+ '+(allEntries.length-5)+' more in Log tab</div>';
    } else {
      h += '<div style="font-size:11px;color:#333;padding:6px 0">No entries yet for this supplement.</div>';
    }
    h += '</div>';

    // Remove button
    h += '<div style="margin-top:9px;padding-top:9px;border-top:1px solid #1a1a2e;display:flex;justify-content:flex-end">';
    if (s.isCustom) {
      h += '<button onclick="removeSupp(\''+s.id+'\')" style="background:rgba(255,107,53,.1);border:1px solid rgba(255,107,53,.3);border-radius:6px;color:#ff6b35;font-size:10px;padding:5px 11px;cursor:pointer">Remove from Protocol</button>';
    } else {
      h += '<button onclick="removeSupp(\''+s.id+'\')" style="background:rgba(100,100,100,.1);border:1px solid #2a2a2a;border-radius:6px;color:#555;font-size:10px;padding:5px 11px;cursor:pointer">Remove from Protocol</button>';
    }
    h += '</div>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

// ─── PER-SUPPLEMENT CALENDAR ─────────────────────────────────
var _calOffset = {}; // id → month offset (0=current, -1=prev, etc.)

function calNav(id, dir) {
  _calOffset[id] = ((_calOffset[id]||0) + dir);
  if (_calOffset[id] > 0) _calOffset[id] = 0;
  draw();
}

function togglePastCheck(id, ds) {
  var key = id+'_'+ds;
  S.checks[key] = !S.checks[key];
  delete S.skips[key]; // checking clears any skip
  saveS(); draw();
}

function renderSuppCalendar(id, s) {
  var offset = _calOffset[id] || 0;
  var now = new Date(); now.setHours(0,0,0,0);
  var viewDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  var yr = viewDate.getFullYear(), mo = viewDate.getMonth();
  var mNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  var firstDay = new Date(yr, mo, 1).getDay();
  var daysInMo = new Date(yr, mo+1, 0).getDate();

  // Pre-compute cycle states for every day in this month (one forward pass from startDate)
  var lastDayOfMonth = new Date(yr, mo, daysInMo);
  var cycleStates = S.startDates[id] && s.hasCycle
    ? getCycleStatesForRange(s, S.startDates[id], new Date(yr, mo, 1), lastDayOfMonth)
    : {};

  // Adherence for this month
  var taken = 0, total = 0;
  for (var d = 1; d <= daysInMo; d++) {
    var ds = yr+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var dayDate = new Date(yr, mo, d);
    if (dayDate <= now) {
      var wasOffCyc = cycleStates[ds] !== undefined && !cycleStates[ds].on;
      if (!wasOffCyc) { // don't count off-cycle days against adherence
        total++;
        if (S.checks[id+'_'+ds]) taken++;
      }
    }
  }
  var adPct = total > 0 ? Math.round((taken/total)*100) : null;
  var adColor = adPct===null?'#555':adPct>=80?'#38b000':adPct>=50?'#ffd60a':'#ff6b35';

  var h = '<div style="background:#080810;border:1px solid #1a1a2e;border-radius:9px;padding:11px;margin-bottom:9px" onclick="event.stopPropagation()">';

  // Month nav header
  h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">';
  h += '<button onclick="event.stopPropagation();calNav(\''+id+'\',-(1))" style="background:#111;border:1px solid #222;color:#aaa;border-radius:5px;width:26px;height:26px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">‹</button>';
  h += '<div style="text-align:center"><div style="font-family:\'Space Grotesk\',sans-serif;font-size:12px;font-weight:600;color:#ccc">'+mNames[mo]+' '+yr+'</div>';
  if (adPct !== null) {
    h += '<div style="font-size:9px;color:'+adColor+';margin-top:1px">'+adPct+'% adherence · '+taken+'/'+total+' days</div>';
  }
  h += '</div>';
  h += '<button onclick="event.stopPropagation();calNav(\''+id+'\',1)" '+(offset>=0?'disabled style="opacity:.25;cursor:default"':'')+' style="background:#111;border:1px solid #222;color:#aaa;border-radius:5px;width:26px;height:26px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">›</button>';
  h += '</div>';

  // Adherence bar
  if (adPct !== null) {
    h += '<div style="background:#111;border-radius:3px;height:3px;margin-bottom:8px"><div style="width:'+adPct+'%;height:3px;background:'+adColor+';border-radius:3px;transition:width .4s"></div></div>';
  }

  // Day name headers
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:3px">';
  dNames.forEach(function(dn) {
    h += '<div style="text-align:center;font-size:8px;color:#444;padding:1px 0">'+dn+'</div>';
  });
  h += '</div>';

  // Day cells
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">';
  for (var i = 0; i < firstDay; i++) h += '<div></div>';

  for (var d = 1; d <= daysInMo; d++) {
    var ds = yr+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    var dayDate = new Date(yr, mo, d);
    var isFuture = dayDate > now;
    var isToday = ds === TODAY;
    var checked  = !isFuture && !!S.checks[id+'_'+ds];
    var wasSkip  = !isFuture && !!S.skips[id+'_'+ds];
    var isOffCyc = !isFuture && (cycleStates[ds] !== undefined) && !cycleStates[ds].on;

    var bg, tc, bc, label, clickable;
    if (isFuture)      { bg='transparent';                    tc='#252535'; bc='transparent';    label=d; clickable=false; }
    else if (isOffCyc) { bg='#111';                           tc='#333';    bc='#1a1a2e';        label='·'; clickable=false; }
    else if (checked)  { bg='rgba('+rgb(s.color)+',.25)';    tc=s.color;   bc=s.color+'66';     label=d; clickable=true; }
    else if (wasSkip)  { bg='#1a1200';                        tc='#665500'; bc='#332200';        label='S'; clickable=true; }
    else               { bg='#0d0d1a';                        tc='#3a3a55'; bc='#1a1a2e';        label=d; clickable=true; }

    var extraStyle = isToday ? 'outline:2px solid '+s.color+';outline-offset:-1px;' : '';
    if (clickable) {
      h += '<div onclick="event.stopPropagation();togglePastCheck(\''+id+'\',\''+ds+'\')" title="'+(isOffCyc?'Off-cycle day':wasSkip?'Skipped (tap to toggle)':checked?'Taken (tap to un-mark)':'Missed (tap to mark taken')+'" style="cursor:pointer;background:'+bg+';border:1px solid '+bc+';border-radius:4px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:9px;color:'+tc+';font-weight:'+(checked?'700':'400')+';'+extraStyle+'">';
    } else {
      h += '<div title="'+(isOffCyc?'Off-cycle rest day':'Future')+'" style="background:'+bg+';border:1px solid '+bc+';border-radius:4px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:9px;color:'+tc+';'+extraStyle+'">';
    }
    h += label + '</div>';
  }
  h += '</div>';

  // Legend
  h += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:7px;font-size:9px;color:#444">';
  h += '<span><span style="display:inline-block;width:8px;height:8px;background:rgba('+rgb(s.color)+',.25);border:1px solid '+s.color+'66;border-radius:2px;margin-right:3px"></span>Taken</span>';
  h += '<span><span style="display:inline-block;width:8px;height:8px;background:#0d0d1a;border:1px solid #1a1a2e;border-radius:2px;margin-right:3px"></span>Missed</span>';
  h += '<span><span style="display:inline-block;width:8px;height:8px;background:#1a1200;border:1px solid #332200;border-radius:2px;margin-right:3px"></span>Skipped</span>';
  if (s.hasCycle) h += '<span><span style="display:inline-block;width:8px;height:8px;background:#111;border:1px solid #1a1a2e;border-radius:2px;margin-right:3px"></span>Off-cycle</span>';
  h += '<span style="color:#555">Tap past days to toggle</span>';
  h += '</div>';
  h += '</div>';
  return h;
}

// ─── RENDER TIMELINE ─────────────────────────────────────────
function renderCycles() {
  var h = '<div class="sec sIn"><div class="ibar">Set a start date for every supplement to track onset, peak effects, and total time on protocol. Phase % reflects documented effect timeline — not just cycling.</div>';

  // ── Cycling supplements ──
  h += '<div style="font-size:9px;color:#ff6b35;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">⚠️ Requires Cycling</div>';

  getAllSupps().filter(function(s){return s.hasCycle;}).forEach(function(s) {
    var cs = cycleStatus(s, S.startDates[s.id]);
    var ph = getPhase(s, S.startDates[s.id]);
    var meta = getMeta(s.id);
    var days = getDaysChecked(s.id, S.startDates[s.id]); // actual doses taken
    var rc = cs ? (cs.on ? s.color : "#444") : "#333";
    var rp = cs ? cs.pct : 0;
    var expKey = "cy_"+s.id;
    var isOpen = S.expandedCycle === expKey;

    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:8px">';
    // Header row: cycle ring + phase ring + info
    h += '<div style="display:flex;align-items:center;gap:10px">';
    h += svgRing(18, rp, rc, 4);
    if (ph) h += svgRing(14, ph.effectPct, ph.color, 4);
    h += '<div style="flex:1">';
    h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0">'+s.name+'</div>';
    h += '<div style="font-size:10px;margin-top:2px;color:'+(cs?(cs.on?s.color:'#666'):'#555')+'">'+(cs?cs.lbl:(S.startDates[s.id]?'Calculating...':'Set start date to track'))+'</div>';
    if (ph) h += '<div style="font-size:10px;color:'+ph.color+';margin-top:1px">'+ph.phase+' phase · '+ph.effectPct+'% of documented effects active</div>';
    if (S.startDates[s.id]) h += '<div style="font-size:10px;color:#444;margin-top:1px">'+days+' actual doses taken</div>';
    h += '</div></div>';

    // Start date + protocol
    h += '<div style="margin-top:9px;display:grid;grid-template-columns:1fr 1fr;gap:7px">';
    h += '<div><div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Start Date</div>';
    h += '<input type="date" value="'+(S.startDates[s.id]||'')+'" onchange="setSD(\''+s.id+'\',this.value)" style="width:100%"></div>';
    h += '<div><div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Cycle Protocol</div>';
    h += '<div style="font-size:10px;color:#777;padding-top:4px;line-height:1.5">'+s.cycleNote+'</div></div></div>';

    // Phase timeline bar
    if (ph && meta.peakDays) {
      h += '<div style="margin-top:9px">';
      h += '<div style="display:flex;justify-content:space-between;font-size:9px;color:#555;margin-bottom:3px">';
      h += '<span>Onset: day '+(meta.onsetDays||'?')+'</span><span>Peak: day '+(meta.peakDays||'?')+'</span>';
      h += '</div>';
      h += '<div style="background:#111;border-radius:4px;height:8px;overflow:hidden">';
      h += '<div style="width:'+ph.effectPct+'%;height:8px;background:linear-gradient(90deg,#333,'+ph.color+');border-radius:4px;transition:width .5s"></div></div>';
      h += '<div style="font-size:9px;color:'+ph.color+';margin-top:3px">'+ph.label+'</div>';
      if (meta.peakNote) h += '<div style="font-size:10px;color:#666;margin-top:3px;line-height:1.5">'+meta.peakNote+'</div>';
      h += '</div>';
    }

    // Expandable details
    h += '<div style="margin-top:9px;padding:8px 9px;background:#0a0a14;border-radius:7px;cursor:pointer" onclick="toggleCycleExp(\''+expKey+'\')">';
    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Timeline & Why Cycle ↓</div>';
    if (isOpen) {
      if (meta.fullEffectNote) h += '<div style="font-size:11px;color:#888;line-height:1.7;margin-bottom:8px">'+meta.fullEffectNote+'</div>';
      if (s.cycleWhy) h += '<div style="font-size:11px;color:#777;line-height:1.7;padding:7px 9px;background:#0d0d1a;border-radius:6px;margin-bottom:7px">'+s.cycleWhy+'</div>';
      if (meta.benefitSigns && meta.benefitSigns.length) {
        h += '<div style="font-size:9px;color:#38b000;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Signs it\'s working</div>';
        meta.benefitSigns.forEach(function(b){ h += '<div style="font-size:10px;color:#599;margin-bottom:2px">✓ '+b+'</div>'; });
      }
      if (meta.sideEffectWatches && meta.sideEffectWatches.length) {
        h += '<div style="font-size:9px;color:#ff6b35;text-transform:uppercase;letter-spacing:1px;margin-top:7px;margin-bottom:4px">Watch for</div>';
        meta.sideEffectWatches.forEach(function(w){ h += '<div style="font-size:10px;color:#c87;margin-bottom:2px">⚠ '+w+'</div>'; });
      }
      h += '<div style="font-size:10px;color:'+s.color+';margin-top:5px">Show less ↑</div>';
    } else {
      var preview = meta.fullEffectNote ? meta.fullEffectNote.substring(0,100)+'...' : s.cycleWhy ? s.cycleWhy.substring(0,100)+'...' : '';
      if (preview) h += '<div style="font-size:11px;color:#555;line-height:1.5">'+preview+'</div>';
    }
    h += '</div>';
    h += '</div>';
  });

  // ── Daily supplements ──
  h += '<div style="font-size:9px;color:#38b000;letter-spacing:2px;text-transform:uppercase;margin:16px 0 9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">✅ Daily — No Cycling Required</div>';

  getAllSupps().filter(function(s){return !s.hasCycle;}).forEach(function(s) {
    var ph = getPhase(s, S.startDates[s.id]);
    var meta = getMeta(s.id);
    var days = S.startDates[s.id] ? getDaysChecked(s.id, S.startDates[s.id]) : null;
    var expKey = "cy_"+s.id;
    var isOpen = S.expandedCycle === expKey;

    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:8px">';
    h += '<div style="display:flex;align-items:center;gap:10px">';
    if (ph) h += svgRing(18, ph.effectPct, ph.color, 4);
    else h += '<div style="width:44px;height:44px;border-radius:50%;background:'+s.color+'22;border:2px solid '+s.color+'33;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+s.icon+'</div>';
    h += '<div style="flex:1">';
    h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0">'+s.name+'</div>';
    if (ph) {
      h += '<div style="font-size:10px;color:'+ph.color+';margin-top:2px">'+ph.phase+' · '+ph.effectPct+'% effective · '+ph.label+'</div>';
    } else {
      h += '<div style="font-size:10px;color:#555;margin-top:2px">Set start date to track progress</div>';
    }
    if (days !== null) h += '<div style="font-size:10px;color:#444;margin-top:1px">Day '+days+' · ∞ '+s.cycleNote+'</div>';
    else h += '<div style="font-size:10px;color:#444;margin-top:1px">∞ '+s.cycleNote+'</div>';
    h += '</div></div>';

    // Start date input
    h += '<div style="margin-top:9px"><div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Protocol Start Date</div>';
    h += '<input type="date" value="'+(S.startDates[s.id]||'')+'" onchange="setSD(\''+s.id+'\',this.value)" style="width:100%"></div>';

    // Phase bar if started
    if (ph && meta.peakDays) {
      h += '<div style="margin-top:8px">';
      h += '<div style="display:flex;justify-content:space-between;font-size:9px;color:#555;margin-bottom:3px"><span>Onset: day '+(meta.onsetDays||'?')+'</span><span>Peak: day '+(meta.peakDays||'?')+'</span></div>';
      h += '<div style="background:#111;border-radius:4px;height:8px;overflow:hidden"><div style="width:'+ph.effectPct+'%;height:8px;background:linear-gradient(90deg,#333,'+ph.color+');border-radius:4px;transition:width .5s"></div></div>';
      if (meta.peakNote) h += '<div style="font-size:9px;color:'+ph.color+';margin-top:3px">'+meta.peakNote+'</div>';
      h += '</div>';
    }

    // Expandable details
    h += '<div style="margin-top:8px;padding:7px 9px;background:#0a0a14;border-radius:7px;cursor:pointer" onclick="toggleCycleExp(\''+expKey+'\')">';
    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Timeline Details ↓</div>';
    if (isOpen) {
      if (meta.fullEffectNote) h += '<div style="font-size:11px;color:#888;line-height:1.7;margin-bottom:8px">'+meta.fullEffectNote+'</div>';
      if (meta.benefitSigns && meta.benefitSigns.length) {
        h += '<div style="font-size:9px;color:#38b000;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Signs it\'s working</div>';
        meta.benefitSigns.forEach(function(b){ h += '<div style="font-size:10px;color:#599;margin-bottom:2px">✓ '+b+'</div>'; });
      }
      if (meta.sideEffectWatches && meta.sideEffectWatches.length) {
        h += '<div style="font-size:9px;color:#ff6b35;text-transform:uppercase;letter-spacing:1px;margin-top:7px;margin-bottom:4px">Watch for</div>';
        meta.sideEffectWatches.forEach(function(w){ h += '<div style="font-size:10px;color:#c87;margin-bottom:2px">⚠ '+w+'</div>'; });
      }
      if (s.cycleWhy) h += '<div style="font-size:10px;color:#555;margin-top:7px;line-height:1.5">'+s.cycleWhy+'</div>';
      h += '<div style="font-size:10px;color:'+s.color+';margin-top:5px">Show less ↑</div>';
    } else {
      var p2 = meta.fullEffectNote ? meta.fullEffectNote.substring(0,90)+'...' : '';
      if (p2) h += '<div style="font-size:10px;color:#555;line-height:1.5">'+p2+'</div>';
    }
    h += '</div>';
    h += '</div>';
  });

  h += '</div>';
  return h;
}

// ─── RENDER LIBRARY ──────────────────────────────────────────
function renderLibrary() {
  var cats = [];
  getAllSupps().forEach(function(s){if(cats.indexOf(s.cat)<0) cats.push(s.cat);});
  var h = '<div class="sec sIn">';

  cats.forEach(function(cat) {
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #1a1a2e">'+cat+'</div>';
    getAllSupps().filter(function(s){return s.cat===cat;}).forEach(function(s) {
      var key = "lib_"+s.id, open = S.expanded===key;
      var dose = getDose(s.id, s);
      h += '<div style="margin-bottom:7px">';
      h += '<div class="card" style="border-color:'+(open?s.color+'44':'#1a1a2e')+'" onclick="toggleExp(\''+key+'\')">';
      h += '<div style="display:flex;align-items:center;gap:9px"><span style="font-size:18px">'+s.icon+'</span>';
      h += '<div style="flex:1"><div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:'+(open?s.color:'#e0e0f0')+'">'+s.name+'</div>';
      h += '<div style="font-size:10px;color:#555;margin-top:1px">'+dose+s.unit+' · '+s.cycleNote+'</div></div>';
      h += '<span style="color:#333;'+(open?'transform:rotate(90deg);':'')+'transition:transform .2s">›</span></div></div>';
      if (open) {
        h += '<div class="panel" style="border-color:'+s.color+'33">';
        h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:9px">';
        h += '<div class="sbox"><div class="slbl">Dose</div><div class="sval">'+dose+s.unit+'</div></div>';
        h += '<div class="sbox"><div class="slbl">Food</div><div class="sval" style="color:'+(s.food?'#38b000':'#ff6b35')+'">'+(s.food?'Required':'No')+'</div></div>';
        h += '<div class="sbox" style="grid-column:1/-1"><div class="slbl">Cycle</div><div class="sval" style="color:'+(s.hasCycle?'#ffd60a':'#38b000')+'">'+s.cycleNote+'</div></div>';
        h += '</div>';
        h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Instructions</div><div style="font-size:11px;color:#888;line-height:1.7;margin-bottom:9px">'+s.instructions+'</div>';
        h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Benefits</div><div style="font-size:11px;color:#777;line-height:1.7;margin-bottom:9px">'+s.benefits+'</div>';
        h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Synergies</div><div style="font-size:11px;color:#777;line-height:1.7;margin-bottom:9px">'+s.synergies+'</div>';
        if (s.warns && s.warns.length) s.warns.forEach(function(w){ h += '<div style="font-size:11px;color:#ff6b35;background:rgba(255,107,53,.08);padding:6px 9px;border-radius:6px;line-height:1.6;margin-bottom:5px">'+w+'</div>'; });
        // Timeline & evidence section
        var meta2 = getMeta(s.id);
        if (meta2.onsetDays || meta2.peakDays) {
          h += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #1a1a2e">';
          h += '<div style="font-size:9px;color:#00b4d8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Timeline to Peak Effects</div>';
          h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:7px">';
          if (meta2.onsetDays) h += '<div class="sbox"><div class="slbl">Onset</div><div class="sval">Day '+meta2.onsetDays+'</div></div>';
          if (meta2.peakDays) h += '<div class="sbox"><div class="slbl">Full Effect</div><div class="sval">Day '+meta2.peakDays+'</div></div>';
          h += '</div>';
          if (meta2.fullEffectNote) h += '<div style="font-size:10px;color:#777;line-height:1.6;margin-bottom:7px">'+meta2.fullEffectNote+'</div>';
          if (meta2.peakNote) h += '<div style="font-size:10px;color:#888;background:#111;padding:6px 9px;border-radius:6px;line-height:1.5;margin-bottom:7px"><strong style="color:#00b4d8">At peak:</strong> '+meta2.peakNote+'</div>';
          if (meta2.benefitSigns && meta2.benefitSigns.length) {
            h += '<div style="font-size:9px;color:#38b000;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Signs it\'s working</div>';
            meta2.benefitSigns.forEach(function(b){ h += '<div style="font-size:10px;color:#599;margin-bottom:2px">✓ '+b+'</div>'; });
          }
          if (meta2.sideEffectWatches && meta2.sideEffectWatches.length) {
            h += '<div style="font-size:9px;color:#ff6b35;text-transform:uppercase;letter-spacing:1px;margin-top:7px;margin-bottom:3px">Watch for</div>';
            meta2.sideEffectWatches.forEach(function(w2){ h += '<div style="font-size:10px;color:#c87;margin-bottom:2px">⚠ '+w2+'</div>'; });
          }
          h += '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
    });
    h += '<div style="margin-bottom:14px"></div>';
  });
  h += '</div>';
  return h;
}

// ─── RENDER ALERTS ───────────────────────────────────────────
function renderAlerts() {
  var ALERTS = [
    {type:"critical",color:"#ff4444",title:"⛔ MB + Serotonergic Drugs — FDA Black Box",detail:"Methylene Blue is a potent MAO inhibitor. NEVER combine with SSRIs, SNRIs, MAOIs, 5-HTP, or St. John's Wort. Risk: serotonin syndrome (potentially fatal)."},
    {type:"caution",color:"#ff6b35",title:"⚠️ MB + Ashwagandha — Serotonin Monitor",detail:"Ashwagandha enhances serotonergic transmission. No published serotonin syndrome cases with this combination, but caution is warranted. Keep MB at ≤15mg in this stack."},
    {type:"caution",color:"#ff6b35",title:"⚠️ Chlorella — 2-Hour Isolation",detail:"Chlorella's cell wall binds divalent metal ions in the GI tract. Taking chlorella within 2 hours of Optimized Minerals, shilajit, or any mineral supplement significantly reduces their absorption."},
    {type:"caution",color:"#ff6b35",title:"⚠️ Triple Magnesium — Budget",detail:"3 Mg sources: MgT + MgGly + Opt. Minerals = ~414mg. Monitor for loose stools — that is your personal tolerance ceiling."},
    {type:"caution",color:"#ff6b35",title:"⚠️ Oregano Oil + Probiotics",detail:"Carvacrol at 93% kills probiotic bacteria if taken simultaneously. Separate by 2–3 hours minimum."},
    {type:"synergy",color:"#38b000",title:"✅ MB + Creatine — Dual Brain Energy",detail:"Complementary mechanisms: creatine provides phosphocreatine buffer for rapid ATP; MB optimizes electron transport for sustained ATP. No conflicts."},
    {type:"synergy",color:"#38b000",title:"✅ Lion's Mane + MgT — Elite Nootropic Pair",detail:"LM stimulates NGF for neurogenesis. MgT raises brain Mg for synaptic density. One builds new pathways, the other strengthens existing ones."},
    {type:"synergy",color:"#38b000",title:"✅ Ashwagandha + Shilajit — Testosterone Stack",detail:"Ashwagandha: 22–33% T increase (Shoden RCT). Shilajit: 20.45% total T increase (PrimaVie RCT). Traditional Ayurvedic pair — synergistic."},
    {type:"synergy",color:"#38b000",title:"✅ Rhodiola (AM) + Ashwagandha (PM)",detail:"Rhodiola energizes morning; ashwagandha calms night. Complete HPA axis support across the day. Cycle both off simultaneously."},
    {type:"info",color:"#00b4d8",title:"ℹ️ Shilajit + Chlorella Spacing",detail:"Shilajit's fulvic acid is itself a chelator. Your schedule already separates them (meal 1 vs 3:30 PM alone window) — maintain this gap."},
    {type:"info",color:"#00b4d8",title:"ℹ️ Cycle Both Adaptogens Together",detail:"Rhodiola and ashwagandha both affect the HPA axis. Taking off-cycle breaks at the same time gives a complete 2–3 week adrenal rest."}
  ];

  var h = '<div class="sec sIn"><div class="wbar">Review all alerts before starting your protocol. Critical warnings must be understood.</div>';
  var types = [{t:"critical",lbl:"⛔ Critical",c:"#ff4444"},{t:"caution",lbl:"⚠️ Cautions",c:"#ff6b35"},{t:"synergy",lbl:"✅ Synergies",c:"#38b000"},{t:"info",lbl:"ℹ️ Notes",c:"#00b4d8"}];

  types.forEach(function(tp) {
    var items = ALERTS.filter(function(a){return a.type===tp.t;});
    if (!items.length) return;
    h += '<div style="font-size:9px;color:'+tp.c+';letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;margin-top:13px">'+tp.lbl+'</div>';
    items.forEach(function(item, i) {
      var key = tp.t+"_"+i, open = S.expandedAlert===key;
      h += '<div class="introw" style="border-color:'+item.color+'" onclick="toggleAlert(\''+key+'\')">';
      h += '<div style="font-size:12px;font-family:\'Space Grotesk\',sans-serif;font-weight:600;color:'+(open?item.color:'#ccc')+'">'+item.title+'</div>';
      if (open) h += '<div style="font-size:11px;color:#888;margin-top:7px;line-height:1.7">'+item.detail+'</div>';
      h += '</div>';
    });
  });
  h += '</div>';
  return h;
}

// ─── RENDER DOSE ─────────────────────────────────────────────
function renderDose() {
  var h = '<div class="sec sIn"><div class="ibar">Adjust doses manually or use +/− buttons. The field accepts any value including decimals. Safety thresholds show as yellow warnings — you can dismiss them to proceed.</div>';

  getAllSupps().forEach(function(s) {
    var dose = getDose(s.id, s);
    var safety = getSafetyLevel(s, dose);
    var isDanger = safety && safety.level==='danger';
    var isCaution = safety && safety.level==='caution';

    h += '<div style="background:#0d0d1a;border:1px solid '+(isDanger?'#ff444455':isCaution?'#ff6b3544':'#1a1a2e')+';border-radius:12px;padding:12px;margin-bottom:11px">';
    h += '<div style="display:flex;align-items:center;gap:9px;margin-bottom:10px">';
    h += '<span style="font-size:20px">'+s.icon+'</span>';
    h += '<div style="flex:1"><div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0">'+s.name+'</div>';
    if (s.isCustom) h += '<div style="font-size:10px;color:#555;margin-top:1px">'+(s.suppType||'custom')+'</div>';
    h += '</div></div>';

    // Main dose control
    h += '<div style="background:#111;border-radius:9px;padding:10px;margin-bottom:9px">';
    h += '<div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:2px;margin-bottom:7px">Current Dose</div>';
    h += '<div style="display:flex;align-items:center;gap:9px">';
    h += '<button class="adj" style="width:34px;height:34px;font-size:20px" onclick="adjDose(\''+s.id+'\',-1)">−</button>';
    h += '<div style="flex:1;text-align:center">';
    h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:24px;font-weight:700;color:'+s.color+'">'+dose+'<span style="font-size:14px;margin-left:3px">'+s.unit+'</span></div>';
    if (s.id==='mgt') h += '<div style="font-size:10px;color:#555;margin-top:1px">'+Math.round(dose*36)+'mg elemental Mg</div>';
    if (s.id==='mgg') h += '<div style="font-size:10px;color:#555;margin-top:1px">'+Math.round(dose*70)+'mg elemental Mg</div>';
    h += '</div>';
    h += '<button class="adj" style="width:34px;height:34px;font-size:20px;border-color:'+(safety?safety.color:'#2a2a2a')+'" onclick="adjDose(\''+s.id+'\',1)">+</button>';
    h += '</div>';
    // Manual text input
    h += '<div style="margin-top:8px;display:flex;align-items:center;gap:8px">';
    h += '<div style="font-size:10px;color:#555">Manual:</div>';
    h += '<input type="number" id="dmain_'+s.id+'" value="'+dose+'" step="any" style="flex:1;background:#0a0a14;border:1px solid #333;border-radius:6px;padding:5px 8px;color:#ccc;font-size:12px" onchange="setDoseFromMainInput(\''+s.id+'\')">';
    h += '<span style="font-size:11px;color:#555">'+s.unit+'</span>';
    h += '</div>';

    if (safety) h += '<div style="margin-top:8px;padding:6px 9px;border-radius:6px;background:rgba('+rgb(safety.color)+',.1);border:1px solid '+safety.color+'44;font-size:10px;color:'+safety.color+'">'+safety.msg+'</div>';
    if (s.id==='mgt') {
      var mg2 = getMgSources();
      h += '<div style="margin-top:6px;font-size:10px;color:#666">Total stack Mg: <strong style="color:'+(mg2.total>420?'#ffd60a':'#38b000')+'">'+mg2.total+'mg</strong> / 420mg ceiling</div>';
    }
    h += '</div>';

    // Range reference
    if (s.minDose !== undefined && s.maxDose !== undefined) {
      h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">Dose Reference</div>';
      var rangeWidth = s.maxDose - s.minDose;
      var pct = rangeWidth > 0 ? Math.min(100,Math.max(0,(dose-s.minDose)/rangeWidth*100)) : 50;
      var barColor = dose >= (s.hardCeiling||9999)?'#ff4444': dose >= (s.safetyThreshold||9999)?'#ffd60a':'#38b000';
      h += '<div style="position:relative;height:20px;background:#111;border-radius:4px;margin-bottom:6px;overflow:hidden">';
      h += '<div style="position:absolute;left:0;top:0;height:100%;width:'+pct+'%;background:'+barColor+';border-radius:4px;transition:width .3s"></div>';
      if (s.safetyThreshold) {
        var thPct = (s.safetyThreshold-s.minDose)/rangeWidth*100;
        h += '<div style="position:absolute;left:'+thPct+'%;top:0;height:100%;width:2px;background:#ffd60a44"></div>';
      }
      h += '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:9px;color:#888">'+s.minDose+s.unit+' — '+s.maxDose+s.unit+'</div></div>';
    }

    if (s.isCustom) {
      h += '<div style="display:flex;justify-content:flex-end;margin-top:4px">';
      h += '<button onclick="removeSupp(\''+s.id+'\')" style="background:rgba(255,107,53,.1);border:1px solid rgba(255,107,53,.3);border-radius:6px;color:#ff6b35;font-size:10px;padding:4px 10px;cursor:pointer">Remove</button>';
      h += '</div>';
    }
    h += '</div>';
  });

  h += '<div style="margin-top:8px"><button onclick="openAddSupp()" style="width:100%;padding:11px;border-radius:10px;border:1px dashed #2a2a2e;color:#444;font-size:11px;cursor:pointer;background:transparent">+ Add Supplement / Prescription Drug</button></div>';
  h += '</div>';
  return h;
}

function setDoseFromMainInput(id) {
  var el = document.getElementById('dmain_'+id);
  if (!el) return;
  var v = parseFloat(el.value);
  if (isNaN(v) || v < 0) return;
  S.doseOverrides[id] = v;
  delete S.dismissed["caution_"+id];
  saveS(); draw();
}

// ─── RENDER SCHEDULE EDITOR ──────────────────────────────────
function renderSchedEdit() {
  var gym = isGym();
  var h = '<div class="sec sIn">';
  h += '<div class="ibar">Set your wake/sleep/gym times and tap "Apply & Optimize" to auto-calculate optimal windows for each supplement block. Or edit individual block times manually.</div>';

  // Core times
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:11px">';
  h += '<div style="font-size:9px;color:#00b4d8;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px">Your Daily Schedule</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">';
  h += '<div><label class="flabel">⏰ Wake Up</label><input type="time" id="wake_inp" value="'+S.wakeTime+'" style="width:100%"></div>';
  h += '<div><label class="flabel">🌙 Bedtime</label><input type="time" id="bed_inp" value="'+S.bedTime+'" style="width:100%"></div>';
  h += '<div><label class="flabel">🏋️ Gym Time</label><input type="time" id="gym_inp" value="'+S.gymTime+'" style="width:100%"></div>';
  h += '</div>';
  h += '<button onclick="saveWakeBed()" style="width:100%;padding:9px;border-radius:8px;background:#00b4d8;color:#000;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer">Apply &amp; Optimize Block Times</button>';
  h += '</div>';

  // Individual block times
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">Block Times (manual override)</div>';

  DEFAULT_BLOCKS.forEach(function(blk) {
    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:10px 12px;margin-bottom:7px">';
    h += '<div style="display:flex;align-items:center;gap:9px">';
    h += '<div style="width:10px;height:10px;border-radius:50%;background:'+blk.color+';flex-shrink:0"></div>';
    h += '<div style="flex:1"><div style="font-size:12px;color:#ccc;font-family:\'Space Grotesk\',sans-serif;font-weight:600">'+blk.label+'</div>';
    h += '<div style="font-size:10px;color:#555;margin-top:1px">'+blk.note+'</div></div>';
    h += '<input type="time" id="st_'+blk.id+'" value="'+(S.schedTimes[blk.id]||'')+'" onchange="saveSchedTime(\''+blk.id+'\')" style="width:90px">';
    h += '</div>';

    // Optimization note
    var note = gym && TIMING_RULES[blk.id] ? TIMING_RULES[blk.id].gym.note : (TIMING_RULES[blk.id] ? TIMING_RULES[blk.id].rest.note : null);
    if (note) {
      h += '<div style="margin-top:7px;padding:6px 8px;background:#0a0a14;border-radius:5px;font-size:10px;color:#556;line-height:1.5">💡 '+note+'</div>';
    }

    // Show which supps are in this block
    var tkey = gym ? "gymTiming" : "timing";
    var blkSupps = getAllSupps().filter(function(s){
      var t = s[tkey]||s.timing;
      return t===blk.id;
    });
    if (blkSupps.length) {
      h += '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">';
      blkSupps.forEach(function(s){ h += '<span style="font-size:10px;background:'+s.color+'22;color:'+s.color+';padding:2px 6px;border-radius:4px">'+s.icon+' '+s.name.split(' ')[0]+'</span>'; });
      h += '</div>';
    }
    h += '</div>';
  });

  // Supplement timing editor
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin:14px 0 9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">Move Supplements Between Blocks</div>';
  h += '<div class="ibar" style="font-size:10px">Select a block for each supplement. Changes take effect immediately in the Today tab.</div>';

  getAllSupps().forEach(function(s) {
    var curTiming = S.doseOverrides['timing_'+s.id] || s.timing;
    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:9px 11px;margin-bottom:6px;display:flex;align-items:center;gap:9px">';
    h += '<span style="font-size:17px">'+s.icon+'</span>';
    h += '<div style="flex:1;font-size:12px;color:#ccc">'+s.name+'</div>';
    h += '<select onchange="moveSuppTiming(\''+s.id+'\',this.value)" style="background:#111;border:1px solid #222;border-radius:5px;padding:4px 7px;color:#ccc;font-size:10px">';
    DEFAULT_BLOCKS.forEach(function(blk) {
      h += '<option value="'+blk.id+'"'+(curTiming===blk.id?' selected':'')+'>'+blk.label+'</option>';
    });
    h += '</select></div>';
  });

  h += '</div>';
  return h;
}

function moveSuppTiming(id, timing) {
  S.doseOverrides['timing_'+id] = timing;
  // Also update in custom supps if applicable
  S.customSupps.forEach(function(s){
    if (s.id===id) { s.timing=timing; s.gymTiming=timing; }
  });
  saveS(); draw();
}

// ─── RENDER LOG ──────────────────────────────────────────────
function renderLog() {
  var mode = S.logMode || 'notes';
  var h = '<div class="sec sIn">';

  // Mode switcher
  h += '<div class="seg" style="margin-bottom:12px">';
  h += '<button class="seg-btn'+(mode==='notes'?' on':'')+'" onclick="setLogMode(\'notes\')">📝 Notes</button>';
  h += '<button class="seg-btn'+(mode==='symptoms'?' on':'')+'" onclick="setLogMode(\'symptoms\')">🔬 Symptoms</button>';
  h += '</div>';

  if (mode === 'notes') {
    // ── Notes mode (original) ──
    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:13px">';
    h += '<textarea id="ni" rows="3" placeholder="Log how you feel, side effects, cycle notes, energy levels..."></textarea>';
    h += '<div style="display:flex;gap:7px;margin-top:7px;align-items:center">';
    h += '<select id="ns" style="flex:1;background:#111;border:1px solid #222;border-radius:6px;padding:5px 8px;color:#ccc;font-size:11px"><option value="">General note</option>';
    getAllSupps().forEach(function(s){ h += '<option value="'+s.id+'">'+s.icon+' '+s.name+'</option>'; });
    h += '</select>';
    h += '<button onclick="addNote()" style="background:#00b4d8;color:#000;padding:6px 13px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer">Log</button>';
    h += '</div></div>';

    if (!S.notes.length) {
      h += '<div style="text-align:center;color:#333;font-size:12px;padding:36px 0">No notes yet.</div>';
    } else {
      for (var i=S.notes.length-1; i>=0; i--) {
        var note = S.notes[i];
        var sup = note.sid ? getAllSupps().find(function(s){return s.id===note.sid;}) : null;
        h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:10px 12px;margin-bottom:6px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px">';
        h += '<div>'+(sup?sup.icon+' <span style="font-size:11px;color:'+sup.color+'">'+sup.name+'</span>':'<span style="font-size:11px;color:#555">General</span>')+'</div>';
        h += '<div style="display:flex;gap:7px;align-items:center"><span style="font-size:10px;color:#444">'+note.dt+'</span>';
        h += '<button onclick="delNote('+i+')" style="color:#444;font-size:14px;cursor:pointer;line-height:1">×</button></div>';
        h += '</div><div style="font-size:12px;color:#888;line-height:1.6">'+note.txt+'</div></div>';
      }
    }

  } else {
    // ── Symptoms mode ──
    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:13px">';

    // Symptom selector
    h += '<label class="flabel">Symptom / Effect</label>';
    h += '<select id="sl_symptom" onchange="updateSymptomCrossRef()" style="width:100%;background:#111;border:1px solid #222;border-radius:6px;padding:6px 8px;color:#ccc;font-size:11px;margin-bottom:4px"><option value="">Select symptom or effect...</option>';
    SYMPTOM_LIST.forEach(function(sym){ h += '<option value="'+sym+'">'+sym+'</option>'; });
    h += '</select>';
    h += '<div id="sl_crossref"></div>';

    // Severity
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px">';
    h += '<div><label class="flabel">Severity (1=mild, 5=severe)</label>';
    h += '<select id="sl_severity" style="width:100%;background:#111;border:1px solid #222;border-radius:6px;padding:6px 8px;color:#ccc;font-size:11px">';
    for (var sv=1; sv<=5; sv++) h += '<option value="'+sv+'"'+(sv===3?' selected':'')+'>'+sv+' — '+(sv===1?'Mild':sv===2?'Noticeable':sv===3?'Moderate':sv===4?'Strong':'Severe')+'</option>';
    h += '</select></div>';
    h += '<div><label class="flabel">Extra notes</label>';
    h += '<input type="text" id="sl_notes" placeholder="Any detail..." style="width:100%;background:#111;border:1px solid #222;border-radius:6px;padding:6px 8px;color:#ccc;font-size:11px"></div>';
    h += '</div>';

    // Multi-supplement tagging
    h += '<div style="margin-top:9px"><label class="flabel">Which supplements do you associate? (check all that apply)</label>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:4px">';
    getAllSupps().forEach(function(s){
      h += '<label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;background:#111;padding:4px 8px;border-radius:6px;border:1px solid #222;cursor:pointer">';
      h += '<input type="checkbox" class="sl-supp-cb" value="'+s.id+'" onchange="updateSymptomCrossRef()" style="accent-color:'+s.color+'">';
      h += s.icon+' '+s.name.split(' ')[0]+'</label>';
    });
    h += '</div></div>';

    h += '<button onclick="addSymptomLog()" style="width:100%;margin-top:10px;padding:9px;border-radius:8px;background:#00b4d8;color:#000;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer">Log Entry</button>';
    h += '</div>';

    // Symptom log entries
    var symLogs = S.symptomLogs || [];
    if (!symLogs.length) {
      h += '<div style="text-align:center;color:#333;font-size:12px;padding:36px 0">No symptom entries yet.</div>';
    } else {
      for (var j=symLogs.length-1; j>=0; j--) {
        var entry = symLogs[j];
        var isPos2 = entry.isPositive || entry.symptom.startsWith('✅');
        var ec = isPos2 ? '#38b000' : '#ff6b35';
        h += '<div style="background:#0d0d1a;border:1px solid '+(isPos2?'#38b00033':'#ff6b3533')+';border-radius:10px;padding:10px 12px;margin-bottom:6px">';
        h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px">';
        h += '<div><span style="font-size:12px;color:'+ec+';font-weight:600">'+entry.symptom+'</span>';
        // Severity dots
        h += ' <span style="font-size:10px;color:#555">'+Array(entry.severity||1).fill('●').join('')+Array(5-(entry.severity||1)).fill('○').join('')+'</span></div>';
        h += '<div style="display:flex;gap:7px;align-items:center"><span style="font-size:10px;color:#444">'+entry.dt+'</span>';
        h += '<button onclick="delSymptomLog('+j+')" style="color:#444;font-size:14px;cursor:pointer;line-height:1">×</button></div>';
        h += '</div>';
        // Tagged supplements
        if (entry.suppIds && entry.suppIds.length) {
          h += '<div style="font-size:9px;color:#444;margin-bottom:3px">Associated:</div>';
          h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:5px">';
          entry.suppIds.forEach(function(sid){
            var ts = getAllSupps().find(function(x){return x.id===sid;});
            if (ts) {
              var phAtLog = entry.phasesAtLog && entry.phasesAtLog[sid];
              h += '<span style="font-size:10px;background:'+ts.color+'22;color:'+ts.color+';padding:2px 6px;border-radius:4px">'+ts.icon+' '+ts.name.split(' ')[0]+(phAtLog?' D'+phAtLog.day:'')+'</span>';
            }
          });
          h += '</div>';
        }
        // Stack snapshot — what was actually checked that day
        var stackThatDay = entry.checkedAtLog || (entry.date ? getAllSupps().filter(function(x){ return !!S.checks[x.id+'_'+entry.date]; }).map(function(x){ return x.id; }) : []);
        if (stackThatDay.length) {
          h += '<div style="font-size:9px;color:#333;margin-bottom:3px">Stack on this day:</div>';
          h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:4px">';
          stackThatDay.forEach(function(sid){
            var ts = getAllSupps().find(function(x){return x.id===sid;});
            if (ts) h += '<span style="font-size:9px;background:#111;color:#555;padding:1px 5px;border-radius:3px">'+ts.icon+' '+ts.name.split(' ')[0]+'</span>';
          });
          h += '</div>';
        }
        if (entry.notes) h += '<div style="font-size:11px;color:#666;line-height:1.5">'+entry.notes+'</div>';
        // Cross-ref note
        var ref2 = SYMPTOM_CROSSREF[entry.symptom];
        if (ref2) {
          var matchedSupps2 = getAllSupps().filter(function(s){return ref2.supps.indexOf(s.id)>=0;});
          if (matchedSupps2.length) h += '<div style="font-size:10px;color:#555;margin-top:5px;line-height:1.5">'+ref2.note+'</div>';
        }
        h += '</div>';
      }

      // Correlation + combination analysis
      if (symLogs.length >= 2) {
        var sympCounts = {};
        symLogs.forEach(function(e){ sympCounts[e.symptom] = (sympCounts[e.symptom]||0)+1; });
        var repeats = Object.keys(sympCounts).filter(function(k){return sympCounts[k]>=2;});
        if (repeats.length) {
          h += '<div style="margin-top:12px;padding:10px 12px;background:#0a0a14;border:1px solid #1a1a2e;border-radius:10px">';
          h += '<div style="font-size:9px;color:#00b4d8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Correlation Analysis</div>';
          repeats.forEach(function(sym2) {
            var entries2 = symLogs.filter(function(e){return e.symptom===sym2;});
            var isP = sym2.startsWith('✅');
            var sympColor = isP ? '#38b000' : '#ff6b35';

            // Individual supplement frequency
            var suppFreq = {};
            entries2.forEach(function(e){(e.suppIds||[]).forEach(function(id){suppFreq[id]=(suppFreq[id]||0)+1;});});
            var topSupps = Object.keys(suppFreq).sort(function(a,b){return suppFreq[b]-suppFreq[a];}).slice(0,4);

            h += '<div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #1a1a2e">';
            h += '<div style="font-size:11px;color:'+sympColor+'">'+sym2+' <span style="color:#555">×'+sympCounts[sym2]+'</span></div>';
            if (topSupps.length) {
              h += '<div style="font-size:10px;color:#666;margin-top:3px;margin-bottom:5px">';
              topSupps.forEach(function(sid2){
                var ts2 = getAllSupps().find(function(x){return x.id===sid2;});
                var pct2 = Math.round(suppFreq[sid2]/sympCounts[sym2]*100);
                if (ts2) h += '<span style="color:'+ts2.color+'">'+ts2.icon+' '+ts2.name.split(' ')[0]+'</span><span style="color:#444"> '+suppFreq[sid2]+'/'+sympCounts[sym2]+'×</span>  ';
              });
              h += '</div>';
            }

            // Combination pattern detection
            var comboCounts = {};
            entries2.forEach(function(e){
              var ids = (e.suppIds||[]).slice().sort();
              if (ids.length >= 2) {
                // Check all pairs
                for (var a=0; a<ids.length; a++) {
                  for (var b=a+1; b<ids.length; b++) {
                    var pairKey = ids[a]+'|'+ids[b];
                    comboCounts[pairKey] = (comboCounts[pairKey]||0)+1;
                  }
                }
              }
            });
            var topCombos = Object.keys(comboCounts).filter(function(k){return comboCounts[k]>=2;}).sort(function(a,b){return comboCounts[b]-comboCounts[a];}).slice(0,2);
            if (topCombos.length) {
              h += '<div style="font-size:9px;color:#ff6b35;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Combination patterns</div>';
              topCombos.forEach(function(ck){
                var ids2 = ck.split('|');
                var s1 = getAllSupps().find(function(x){return x.id===ids2[0];});
                var s2 = getAllSupps().find(function(x){return x.id===ids2[1];});
                if (!s1||!s2) return;
                // Check if there's a known combo risk for these + this symptom
                var knownRisk = COMBO_RISKS.find(function(cr){
                  return ids2.every(function(id){return cr.supps.indexOf(id)>=0;}) && (!cr.risks.length || cr.risks.indexOf(sym2)>=0);
                });
                h += '<div style="padding:5px 7px;background:#0d0d1a;border-radius:5px;margin-bottom:4px;border-left:2px solid #ff6b35">';
                h += '<div style="font-size:10px;color:#bbb"><span style="color:'+s1.color+'">'+s1.icon+' '+s1.name.split(' ')[0]+'</span> + <span style="color:'+s2.color+'">'+s2.icon+' '+s2.name.split(' ')[0]+'</span> <span style="color:#555">together '+comboCounts[ck]+'/'+sympCounts[sym2]+'× when this occurred</span></div>';
                if (knownRisk) h += '<div style="font-size:10px;color:#ff6b35;margin-top:3px;line-height:1.5">🔗 Known risk: '+knownRisk.note+'</div>';
                h += '</div>';
              });
            }
            h += '</div>';
          });
          h += '</div>';
        }
      }
    }
  }

  h += '</div>';
  return h;
}

function scheduleNotifications() {
  if (!S.notifEnabled) return;
  if (Notification.permission !== 'granted') return;
  // Clear old timers
  _notifTimers.forEach(clearTimeout);
  _notifTimers = [];

  var now = new Date();
  var allSupps = getAllSupps();

  // Group supplements by block — skip off-cycle and already-checked ones
  var blocks = {};
  allSupps.forEach(function(s) {
    var cs = cycleStatus(s, S.startDates[s.id]);
    if (cs && !cs.on) return; // off-cycle: no reminder
    if (isChecked(s.id)) return; // already taken today
    if (isSkipped(s.id)) return; // intentionally skipped
    var gym = isGym();
    var blk = gym ? (s.gymTiming || s.timing) : s.timing;
    if (!blocks[blk]) blocks[blk] = [];
    blocks[blk].push(s.name.split(' ')[0]);
  });

  Object.keys(S.schedTimes).forEach(function(blkId) {
    var timeStr = S.schedTimes[blkId];
    if (!timeStr || !blocks[blkId]) return;
    var parts = timeStr.split(':');
    var fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                          parseInt(parts[0]), parseInt(parts[1]), 0, 0);
    var ms = fireAt - now;
    if (ms < 0 || ms > 86400000) return; // only today, not past
    var names = blocks[blkId].join(', ');
    var blkLabels = {wake:'⏰ Wake Window',meal1:'🍽️ First Meal',alone:'🧪 Alone Window',
                     dinner:'🍽️ Dinner Window',pregym:'🏋️ Pre-Gym',winddown:'🌙 Wind-Down',bedtime:'💤 Bedtime'};
    var title = blkLabels[blkId] || blkId;
    var body = names + ' · Tap to check in';
    var t = setTimeout(function() { sendNotif(title, body, blkId); }, ms);
    _notifTimers.push(t);
  });
}

function sendNotif(title, body, tag) {
  if (_swReg && _swReg.active) {
    _swReg.active.postMessage({type:'SHOW_NOTIFICATION', title:title, body:body, tag:tag});
  } else if (Notification.permission === 'granted') {
    new Notification(title, {body:body, icon:'/icon.svg', tag:tag});
  }
}

function enableNotifications() {
  Notification.requestPermission().then(function(perm) {
    S.notifEnabled = perm === 'granted';
    saveS();
    if (perm === 'granted') {
      scheduleNotifications();
      alert('✅ Notifications enabled! You\'ll be reminded at each dose window.');
    } else {
      alert('⚠️ Notifications blocked. Enable them in your browser/system settings.');
    }
    closeModal();
    draw();
  });
}



// ─���─ RENDER INSIGHTS ────────────��────────────────────────────
function renderInsights() {
  var allSupps = getAllSupps();
  var h = '<div class="sec sIn">';

  // ── 30-Day Heatmap ──
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:11px">';
  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:3px">30-Day Adherence</div>';
  h += '<div style="font-size:10px;color:#555;margin-bottom:10px">Each column = one day · Each row = one supplement · Darker = taken</div>';

  var days30 = [];
  for (var i = 29; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    days30.push({ ds: localDateStr(d), label: i % 5 === 0 ? String(d.getDate()) : '' });
  }

  h += '<div style="display:flex;margin-bottom:4px;margin-left:80px">';
  days30.forEach(function(day) { h += '<div style="flex:1;font-size:7px;color:#444;text-align:center">'+day.label+'</div>'; });
  h += '</div>';

  var heatmapCycleStates = {};
  allSupps.forEach(function(s) {
    if (s.hasCycle && S.startDates[s.id]) {
      var d30ago = new Date(); d30ago.setDate(d30ago.getDate()-29); d30ago.setHours(0,0,0,0);
      heatmapCycleStates[s.id] = getCycleStatesForRange(s, S.startDates[s.id], d30ago, new Date());
    }
  });

  allSupps.forEach(function(s) {
    h += '<div style="display:flex;align-items:center;margin-bottom:3px">';
    h += '<div style="width:80px;font-size:9px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:6px">'+s.icon+' '+s.name.split('(')[0].trim().split(' ').slice(0,2).join(' ')+'</div>';
    days30.forEach(function(day) {
      var taken    = !!S.checks[s.id+'_'+day.ds];
      var skipped  = !!S.skips[s.id+'_'+day.ds];
      var isFuture = day.ds > TODAY;
      var cycSt    = heatmapCycleStates[s.id] && heatmapCycleStates[s.id][day.ds];
      var isOff    = s.hasCycle && S.startDates[s.id] && cycSt !== undefined && !cycSt.on;
      var bg, opacity;
      if (isFuture)   { bg='#0a0a0f';  opacity='0'; }
      else if (isOff) { bg='#151520';  opacity='1'; }
      else if (taken) { bg=s.color;    opacity='1'; }
      else if(skipped){ bg='#332200';  opacity='1'; }
      else            { bg='#111';     opacity='0.5'; }
      h += '<div title="'+(isOff?'Off-cycle':taken?'Taken':skipped?'Skipped':'Missed')+'" style="flex:1;height:12px;background:'+bg+';opacity:'+opacity+';border-radius:2px;margin:0 1px"></div>';
    });
    h += '</div>';
  });

  var totalPossible = 0, totalTaken = 0;
  allSupps.forEach(function(s) {
    days30.forEach(function(d) {
      if (d.ds > TODAY) return;
      var cycSt = heatmapCycleStates[s.id] && heatmapCycleStates[s.id][d.ds];
      var isOff = s.hasCycle && S.startDates[s.id] && cycSt !== undefined && !cycSt.on;
      if (!isOff) { totalPossible++; if (S.checks[s.id+'_'+d.ds]) totalTaken++; }
    });
  });
  var overallPct = totalPossible > 0 ? Math.round((totalTaken / totalPossible) * 100) : 0;
  var ovColor = overallPct >= 80 ? '#38b000' : overallPct >= 50 ? '#ffd60a' : '#ff6b35';
  h += '<div style="margin-top:9px;display:flex;align-items:center;gap:10px">';
  h += '<div style="flex:1;background:#111;border-radius:3px;height:4px"><div style="width:'+overallPct+'%;height:4px;background:'+ovColor+';border-radius:3px"></div></div>';
  h += '<span style="font-size:11px;color:'+ovColor+';font-weight:700">'+overallPct+'% overall · '+totalTaken+'/'+totalPossible+' doses</span>';
  h += '</div></div>';

  // ── Per-Supplement Adherence Bars ──
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:11px">';
  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:10px">This Month by Supplement</div>';
  var now2 = new Date(); now2.setHours(0,0,0,0);
  var yr2 = now2.getFullYear(), mo2 = now2.getMonth();
  var daysInMo2 = now2.getDate();

  allSupps.sort(function(a, b) {
    var pctA = days30.filter(function(d){ return !!S.checks[a.id+'_'+d.ds]; }).length;
    var pctB = days30.filter(function(d){ return !!S.checks[b.id+'_'+d.ds]; }).length;
    return pctB - pctA;
  }).forEach(function(s) {
    var taken = 0;
    for (var d = 1; d <= daysInMo2; d++) {
      var ds = yr2+'-'+String(mo2+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      if (S.checks[s.id+'_'+ds]) taken++;
    }
    var pct = daysInMo2 > 0 ? Math.round((taken/daysInMo2)*100) : 0;
    var bc = pct >= 80 ? s.color : pct >= 50 ? '#ffd60a' : '#ff4444';
    h += '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px">';
    h += '<span style="font-size:10px;color:#aaa">'+s.icon+' '+s.name.split('(')[0].trim()+'</span>';
    h += '<span style="font-size:10px;color:'+bc+';font-weight:700">'+pct+'% · '+taken+'/'+daysInMo2+'d</span></div>';
    h += '<div style="background:#111;border-radius:3px;height:5px"><div style="width:'+pct+'%;height:5px;background:'+bc+';border-radius:3px;transition:width .4s"></div></div></div>';
  });
  h += '</div>';

  // ── Streak Leaderboard ──
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:11px">';
  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:10px">\ud83c\udfc6 Current Streaks</div>';
  var streakData = allSupps.map(function(s) {
    return {s:s, streak: S.startDates[s.id] ? getConsecutiveStreak(s.id) : 0};
  }).sort(function(a,b){ return b.streak - a.streak; });
  streakData.forEach(function(item, idx) {
    var medal = idx===0?'\ud83e\udd47':idx===1?'\ud83e\udd48':idx===2?'\ud83e\udd49':'  ';
    var streakColor = item.streak < 7 ? '#555' : item.streak < 30 ? '#ffd60a' : item.streak < 90 ? item.s.color : '#38b000';
    h += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1a1a2e">';
    h += '<span style="font-size:14px;width:20px">'+medal+'</span>';
    h += '<span style="font-size:13px">'+item.s.icon+'</span>';
    h += '<span style="font-size:11px;color:#aaa;flex:1">'+item.s.name.split('(')[0].trim()+'</span>';
    h += '<span style="font-size:12px;color:'+streakColor+';font-weight:700">'+(item.streak > 0 ? item.streak+' days' : 'Not started')+'</span></div>';
  });
  h += '</div>';

  // ── Supply Status Overview ──
  var suppWithSupply = allSupps.filter(function(s){ return S.supply[s.id] && S.supply[s.id].bottleTotal; });
  if (suppWithSupply.length) {
    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:11px">';
    h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:10px">\ud83d\udce6 Supply Overview</div>';
    suppWithSupply.sort(function(a, b) {
      var dA = (function(s){ var sup=S.supply[s.id]; if(!sup.openedDate) return 999; var d=getDose(s.id,s)||1; return Math.round((Math.max(0,sup.bottleTotal - d*getDaysChecked(s.id,sup.openedDate)))/d); })(a);
      var dB = (function(s){ var sup=S.supply[s.id]; if(!sup.openedDate) return 999; var d=getDose(s.id,s)||1; return Math.round((Math.max(0,sup.bottleTotal - d*getDaysChecked(s.id,sup.openedDate)))/d); })(b);
      return dA - dB;
    }).forEach(function(s) {
      var sup = S.supply[s.id];
      var daily = getDose(s.id, s) || 1;
      var left = Math.max(0, sup.bottleTotal - daily * getDaysChecked(s.id, sup.openedDate));
      var daysLeft = Math.round(left / daily);
      var pct = Math.min(100, Math.round((left / sup.bottleTotal) * 100));
      var c = daysLeft <= 5 ? '#ff4444' : daysLeft <= 14 ? '#ffd60a' : '#38b000';
      h += '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px">';
      h += '<span style="font-size:10px;color:#aaa">'+s.icon+' '+s.name.split('(')[0].trim()+'</span>';
      h += '<span style="font-size:10px;color:'+c+';font-weight:700">'+daysLeft+'d left</span></div>';
      h += '<div style="background:#111;border-radius:3px;height:5px"><div style="width:'+pct+'%;height:5px;background:'+c+';border-radius:3px;transition:width .4s"></div></div>';
      if (daysLeft <= 14) h += '<div style="font-size:9px;color:'+c+';margin-top:2px">'+(daysLeft<=5?'\ud83d\udd34 Order now':'\ud83d\udfe1 Order soon')+'</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  h += '</div>';
  return h;
}

// ── Module render dispatcher ──
function suppRender() {
  computeToday();
  var tab = S.subTab || 'schedule';
  switch(tab) {
    case 'schedule':   return renderSchedule();
    case 'cycles':     return renderCycles();
    case 'library':    return renderLibrary();
    case 'alerts':     return renderAlerts();
    case 'dose':       return renderDose();
    case 'sched_edit': return renderSchedEdit();
    case 'log':        return renderLog();
    case 'insights':   return renderInsights();
    default:           return renderSchedule();
  }
}

// ── Register with router ──
EXC.register('supplements', {
  title: 'Supplement Protocol',
  tabs: [
    {id:'schedule', label:'Today', icon:'\ud83d\udccb'},
    {id:'cycles', label:'Timeline', icon:'\ud83d\udcc5'},
    {id:'library', label:'Library', icon:'\ud83d\udcd6'},
    {id:'alerts', label:'Alerts', icon:'\u26a1'},
    {id:'dose', label:'Dose', icon:'\u2696\ufe0f'},
    {id:'sched_edit', label:'Schedule', icon:'\ud83d\udd50'},
    {id:'log', label:'Log', icon:'\ud83d\udcdd'},
    {id:'insights', label:'Stats', icon:'\ud83d\udcca'}
  ],
  get subTab() { return S.subTab || 'schedule'; },
  set subTab(v) { S.subTab = v; },
  render: suppRender,
  afterRender: function() { scheduleNotifications(); }
});

// ── Expose public API for cross-module access ──
EXC.supp = {
  cycleStatus: cycleStatus,
  getPhase: getPhase,
  getAllSupps: getAllSupps,
  isChecked: isChecked,
  getMgSources: getMgSources,
  getSafetyLevel: getSafetyLevel,
  getDose: getDose
};

// ── Expose onclick functions on window (required for innerHTML onclick attributes) ──
var fns = [
  'go','toggleGym','toggleCheck','skipDay','toggleExp','toggleAlert','toggleCycleExp',
  'dismiss','setSD','setDoseFromInput','adjDose','addNote','delNote','removeSupp',
  'restoreBuiltin','saveSchedTime','saveWakeBed','autoOptimizeTimes',
  'saveSupply','scanLabel','openAddSupp','setSuppType','setFoodPref','saveNewSupp',
  'closeModal','dbSuggest','fillFromDB','confirmRemove','checkDoseTiming',
  'showTimingWarning','enableNotifications','parseOCRText',
  'showOCRConfirm','confirmOCRSave','setLogMode',
  'addSymptomLog','delSymptomLog','addNoteInCard','updateSymptomCrossRef',
  'calNav','togglePastCheck','moveSuppTiming','setDoseFromMainInput',
  'renderSecondDoseCard'
];
fns.forEach(function(name) {
  try { var fn = eval(name); if (typeof fn === 'function') window[name] = fn; } catch(e) {}
});

// ── Emit events on key actions ──
var _origToggleCheck = toggleCheck;
toggleCheck = function(id) {
  _origToggleCheck(id);
  if (isChecked(id)) {
    var supp = getAllSupps().find(function(s) { return s.id === id; });
    EXC.emit('supplement.checked', { id: id, name: supp ? supp.name : id });
  }
};
window.toggleCheck = toggleCheck;

})();
