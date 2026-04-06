// ─── EXCALIBUR OS — Workout Module ──────────────────────────
// Ported from Iron Protocol app.js
// All workout logic: tracking, smart weight, rest timer, templates, progress

(function() {

// ── State alias ──
var S = EXC.S.workout;

// ── Replaced core functions ──
function saveS() { EXC.save(); }
function go(tab) { S.subTab = tab; S.expanded = null; EXC.save(); EXC.draw(); }
function draw() { EXC.draw(); }
function closeModal() { document.getElementById("modal-root").innerHTML = ""; }

// TODAY is a global from utils.js

function fmtTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function fmtDuration(ms) {
  var mins = Math.floor(ms / 60000);
  if (mins < 60) return mins + 'm';
  return Math.floor(mins/60) + 'h ' + (mins%60) + 'm';
}

function fmtDate(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
}

function fmtDateFull(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
}


function getWeekStart() {
  var d = new Date(); d.setHours(0,0,0,0);
  var day = d.getDay(); var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); return d.toISOString().split('T')[0];
}


// ─── LAST PERFORMANCE ────────────────────────────────────────
function getLastPerformance(exerciseId) {
  for (var i = S.workoutHistory.length - 1; i >= 0; i--) {
    var w = S.workoutHistory[i];
    for (var j = 0; j < w.exercises.length; j++) {
      if (w.exercises[j].exerciseId === exerciseId) {
        return w.exercises[j];
      }
    }
  }
  return null;
}

// ─── PROGRESSIVE OVERLOAD SUGGESTION ─────────────────────────
function getProgressionSuggestion(exerciseId) {
  var last = getLastPerformance(exerciseId);
  if (!last || !last.sets || last.sets.length === 0) return null;
  var workingSets = last.sets.filter(function(s) { return s.type === 'working' && s.completed; });
  if (workingSets.length === 0) return null;
  var allCompleted = last.sets.filter(function(s){return s.type==='working';}).every(function(s){return s.completed;});
  var lastWeight = workingSets[0].weight;
  var increment = S.units === 'kg' ? 2.5 : 5;

  // Check if reps dropped on later sets (fatigue indicator)
  var repsDrooped = false;
  var targetReps = workingSets[0].reps;
  var setBreakdown = [];
  workingSets.forEach(function(s, i) {
    var hitTarget = s.reps >= targetReps;
    setBreakdown.push({ set:i+1, reps:s.reps, weight:s.weight, hitTarget:hitTarget });
    if (!hitTarget) repsDrooped = true;
  });

  var breakdownStr = setBreakdown.map(function(sb) {
    return 'S' + sb.set + ': ' + sb.weight + '\u00D7' + sb.reps + (sb.hitTarget ? ' \u2713' : ' \u2717');
  }).join('  ');

  // Check soreness from last session for this exercise's muscles
  var ex = findExercise(exerciseId);
  var highSoreness = false;
  if (ex) {
    ex.musclesPrimary.forEach(function(m) {
      var sore = getRecentSoreness(m.muscle);
      if (sore && sore.level >= 4) highSoreness = true;
    });
  }

  if (highSoreness) {
    return { type:'deload', msg:'\u26A0\uFE0F High soreness reported \u2014 consider reducing to ' + Math.round(lastWeight * 0.9) + ' ' + S.units + ' or fewer sets', breakdown:breakdownStr };
  }
  // RPE context in suggestion text
  var rpeHist = getExerciseRPEHistory(exerciseId);
  if (rpeHist.length > 0 && rpeHist[0].avgRPE >= 9) {
    return { type:'same_weight', msg:'Avg RPE ' + rpeHist[0].avgRPE + ' last session \u2014 grinding hard, hold at ' + lastWeight + ' ' + S.units, breakdown:breakdownStr };
  }
  if (allCompleted && !repsDrooped) {
    return { type:'weight_up', msg:'All sets hit target \u2192 try ' + (lastWeight + increment) + ' ' + S.units, breakdown:breakdownStr };
  }
  if (allCompleted && repsDrooped) {
    return { type:'same_weight', msg:'Reps dropped on later sets \u2014 stay at ' + lastWeight + ' ' + S.units + ' until consistent', breakdown:breakdownStr };
  }
  return { type:'same_weight', msg:'Stay at ' + lastWeight + ' ' + S.units + ' \u2014 complete all reps before increasing', breakdown:breakdownStr };
}

// ─── PER-SET LAST SESSION COMPARISON ─────────────────────────
function getLastSetData(exerciseId, setIdx) {
  var last = getLastPerformance(exerciseId);
  if (!last || !last.sets) return null;
  var workingSets = last.sets.filter(function(s) { return s.type === 'working' && s.completed; });
  return workingSets[setIdx] || null;
}

// ─── SMART WEIGHT ENGINE ─────────────────────────────────────
function roundWeight(w) {
  var step = S.units === 'kg' ? 2.5 : 5;
  return Math.round(w / step) * step;
}

function checkExerciseDeload(exerciseId) {
  var volumes = [];
  S.workoutHistory.forEach(function(w) {
    w.exercises.forEach(function(wex) {
      if (wex.exerciseId !== exerciseId) return;
      var vol = wex.sets.reduce(function(s, set) {
        return s + (set.completed && set.type === 'working' ? set.weight * set.reps : 0);
      }, 0);
      if (vol > 0) volumes.push(vol);
    });
  });
  if (volumes.length < 3) return false;
  var last3 = volumes.slice(-3);
  return last3[2] < last3[1] && last3[1] < last3[0];
}

// Get average RPE for an exercise across recent sessions
function getExerciseRPEHistory(exerciseId) {
  var sessions = [];
  for (var i = S.workoutHistory.length - 1; i >= 0 && sessions.length < 5; i--) {
    var w = S.workoutHistory[i];
    w.exercises.forEach(function(wex) {
      if (wex.exerciseId !== exerciseId) return;
      var rpes = wex.sets.filter(function(s){ return s.completed && s.type === 'working' && s.rpe; })
        .map(function(s){ return s.rpe; });
      if (rpes.length > 0) {
        var avg = rpes.reduce(function(a,b){return a+b;},0) / rpes.length;
        var weight = wex.sets.filter(function(s){return s.completed && s.type==='working';})[0];
        sessions.push({ avgRPE:Math.round(avg*10)/10, weight:weight?weight.weight:0 });
      }
    });
  }
  return sessions; // newest first
}

// ─── FORMAT COMPAT HELPERS ──────────────────────────────────
// New exercises use simplified formats; these normalize access.

function getRepRange(ex, goal) {
  if (!ex || !ex.repRanges) return null;
  // Array format (original): [{goal:"strength", reps:"1-5", rest:180, sets:"4-6", why:"..."}]
  if (Array.isArray(ex.repRanges)) {
    return ex.repRanges.find(function(r){return r.goal===goal;}) || ex.repRanges[0];
  }
  // Object format (new): {strength:"5-8", hypertrophy:"8-12", endurance:"12-15"}
  var reps = ex.repRanges[goal] || ex.repRanges.hypertrophy || '';
  return { goal:goal, reps:reps, rest:90, sets:"3-4", why:"" };
}

function getSynergies(ex) {
  if (!ex || !ex.synergies) return [];
  // Array format (original): [{exerciseId:"foo", type:"complement", note:"..."}]
  if (Array.isArray(ex.synergies)) return ex.synergies;
  // Object format (new): {antagonist:["foo"], complement:["bar"], superset:["baz"]}
  var result = [];
  var types = ["antagonist","complement","superset"];
  types.forEach(function(t) {
    if (ex.synergies[t]) {
      ex.synergies[t].forEach(function(id) {
        result.push({ exerciseId:id, type:t, note:"" });
      });
    }
  });
  return result;
}

function getSubstitutes(ex) {
  if (!ex || !ex.substitutes) return [];
  // Array of objects (original): [{exerciseId:"foo", similarity:90, note:"..."}]
  if (ex.substitutes.length > 0 && typeof ex.substitutes[0] === 'object') return ex.substitutes;
  // Array of strings (new): ["foo", "bar"]
  return ex.substitutes.map(function(id) {
    return { exerciseId:id, similarity:80, note:"" };
  });
}

function getBiomechanics(ex) {
  if (!ex || !ex.biomechanics) return '';
  if (typeof ex.biomechanics === 'string') return ex.biomechanics;
  // Object format: {joint, type, plane, rom, grip}
  var b = ex.biomechanics;
  return (b.type||'')+' movement — '+(b.joint||'')+' joint, '+(b.plane||'')+' plane, '+(b.rom||'')+' ROM, '+(b.grip||'')+' grip';
}

function getMuscleNote(m) {
  return m.note || '';
}

function getEstimatedStartingWeight(exerciseId) {
  // Use bodyweight to suggest starting weights for exercises with no history
  var bw = 0;
  if (S.bodyWeight.length > 0) bw = S.bodyWeight[S.bodyWeight.length - 1].weight;
  if (!bw) return 0;
  var ex = findExercise(exerciseId);
  if (!ex || !ex.bwRatio) return 0;
  var raw = bw * ex.bwRatio;
  return roundWeight(raw);
}

function getSmartWeight(exerciseId, setIndex, repTarget) {
  var last = getLastPerformance(exerciseId);
  var defaultReps = repTarget || 8;
  if (!last) {
    var est = getEstimatedStartingWeight(exerciseId);
    if (est > 0) return { weight:est, reps:defaultReps, reason:'estimated' };
    return { weight:0, reps:defaultReps, reason:'first_session' };
  }

  // Base weight/reps from last session
  var baseWeight = 0, baseReps = defaultReps;
  var workingSets = last.sets.filter(function(s){ return s.type === 'working'; });
  var completedWorking = workingSets.filter(function(s){ return s.completed; });
  if (completedWorking[setIndex]) {
    baseWeight = completedWorking[setIndex].weight;
    baseReps = completedWorking[setIndex].reps;
  } else if (completedWorking.length > 0) {
    baseWeight = completedWorking[0].weight;
    baseReps = completedWorking[0].reps;
  }
  if (baseWeight === 0) return { weight:0, reps:baseReps, reason:'no_data' };

  var increment = S.units === 'kg' ? 2.5 : 5;
  var ex = findExercise(exerciseId);

  // 1. Deload check (3+ declining sessions)
  if (checkExerciseDeload(exerciseId)) {
    return { weight:roundWeight(baseWeight * 0.85), reps:baseReps, reason:'deload' };
  }

  // 1.5. System readiness check (sleep, HRV, strain, adherence)
  if (EXC.recovery && EXC.recovery.getScore) {
    var _readiness = EXC.recovery.getScore();
    if (_readiness && _readiness.overall < 40) {
      return { weight:roundWeight(baseWeight * 0.85), reps:baseReps, reason:'low_readiness' };
    }
    if (_readiness && _readiness.overall < 55) {
      return { weight:roundWeight(baseWeight * 0.9), reps:baseReps, reason:'moderate_readiness' };
    }
  }

  // 2. RPE analysis — if avg RPE ≥ 9 last session, too heavy; if trending up at same weight, fatigue
  var rpeHistory = getExerciseRPEHistory(exerciseId);
  if (rpeHistory.length > 0) {
    var lastRPE = rpeHistory[0].avgRPE;
    if (lastRPE >= 9.5) {
      return { weight:roundWeight(baseWeight * 0.9), reps:baseReps, reason:'rpe_overload' };
    }
    if (lastRPE >= 9) {
      // Block progression — grinding too hard
      return { weight:baseWeight, reps:baseReps, reason:'rpe_high' };
    }
    // RPE trending up at same weight = accumulated fatigue
    if (rpeHistory.length >= 3) {
      var sameWeight = rpeHistory.filter(function(s){ return s.weight === rpeHistory[0].weight; });
      if (sameWeight.length >= 3 && sameWeight[0].avgRPE > sameWeight[1].avgRPE && sameWeight[1].avgRPE > sameWeight[2].avgRPE) {
        return { weight:roundWeight(baseWeight * 0.9), reps:baseReps, reason:'rpe_fatigue_trend' };
      }
    }
  }

  // 3. Soreness check on primary muscles
  var maxSoreness = 0;
  if (ex) {
    ex.musclesPrimary.forEach(function(m) {
      var sore = getRecentSoreness(m.muscle);
      if (sore && sore.level > maxSoreness) maxSoreness = sore.level;
    });
  }
  if (maxSoreness >= 4) {
    return { weight:roundWeight(baseWeight * 0.9), reps:baseReps, reason:'high_soreness' };
  }

  // 4. Recovery check on primary muscles
  var minRecovery = 100;
  if (ex) {
    ex.musclesPrimary.forEach(function(m) {
      var rec = getMuscleRecovery(m.muscle);
      if (rec.pct < minRecovery) minRecovery = rec.pct;
    });
  }
  if (minRecovery < 70) {
    return { weight:roundWeight(baseWeight * 0.9), reps:baseReps, reason:'low_recovery' };
  }

  // 5. Moderate soreness — block increase
  if (maxSoreness >= 3) {
    return { weight:baseWeight, reps:baseReps, reason:'moderate_soreness' };
  }

  // 6. Progression check — all sets hit target, no flags, RPE manageable
  var allCompleted = workingSets.every(function(s){ return s.completed; });
  var targetReps = completedWorking.length > 0 ? completedWorking[0].reps : baseReps;
  var allHitTarget = completedWorking.length > 0 && completedWorking.every(function(s){ return s.reps >= targetReps; });
  if (allCompleted && allHitTarget) {
    // Supercompensation: double increment when fully recovered
    var _r = (EXC.recovery && EXC.recovery.getScore) ? EXC.recovery.getScore() : null;
    if (_r && _r.overall > 85) {
      return { weight:baseWeight + increment * 2, reps:baseReps, reason:'super_progress' };
    }
    return { weight:baseWeight + increment, reps:baseReps, reason:'progress' };
  }

  return { weight:baseWeight, reps:baseReps, reason:'same' };
}

// ─── MUSCLE RECOVERY ─────────────────────────────────────────
function getMuscleRecovery(muscleId) {
  var group = MUSCLE_GROUPS[muscleId];
  if (!group) return { status:'fresh', pct:100, color:'#38b000', hoursRemaining:0 };
  var now = Date.now();
  var lastWorked = null;

  for (var i = S.workoutHistory.length - 1; i >= 0; i--) {
    var w = S.workoutHistory[i];
    var wTime = new Date(w.endedAt || w.startedAt).getTime();
    if (now - wTime > group.recoveryHours * 3600000 * 1.5) break;
    for (var j = 0; j < w.exercises.length; j++) {
      var ex = findExercise(w.exercises[j].exerciseId);
      if (!ex) continue;
      var isPrimary = ex.musclesPrimary.some(function(m){return m.muscle===muscleId;});
      var isSecondary = ex.musclesSecondary.some(function(m){return m.muscle===muscleId;});
      if (isPrimary || isSecondary) {
        if (!lastWorked || wTime > lastWorked) lastWorked = wTime;
      }
    }
  }

  if (!lastWorked) return { status:'fresh', pct:100, color:'#38b000', hoursRemaining:0 };
  var elapsed = (now - lastWorked) / 3600000;
  var recoveryPct = Math.min(100, (elapsed / group.recoveryHours) * 100);
  var status = recoveryPct >= 100 ? 'recovered' : recoveryPct >= 70 ? 'recovering' : 'fatigued';
  var color = recoveryPct >= 100 ? '#38b000' : recoveryPct >= 70 ? '#ffd60a' : '#ff6b35';
  return { status:status, pct:Math.round(recoveryPct), color:color, hoursRemaining:Math.max(0, Math.round(group.recoveryHours - elapsed)) };
}

// ─── WEEKLY VOLUME ───────────────────────────────────────────
function getWeeklyVolume(muscleId) {
  var weekStart = getWeekStart();
  var totalSets = 0;
  var breakdown = [];
  S.workoutHistory.forEach(function(w) {
    if (w.startedAt < weekStart) return;
    w.exercises.forEach(function(wex) {
      var ex = findExercise(wex.exerciseId);
      if (!ex) return;
      var completedSets = wex.sets.filter(function(s){return s.completed && s.type==='working';}).length;
      var isPrimary = ex.musclesPrimary.some(function(m){return m.muscle===muscleId;});
      var isSecondary = ex.musclesSecondary.some(function(m){return m.muscle===muscleId;});
      if (isPrimary) {
        totalSets += completedSets;
        if (completedSets > 0) breakdown.push({name:ex.name.split(' ').slice(0,2).join(' '), sets:completedSets, color:ex.color});
      } else if (isSecondary) {
        var half = Math.round(completedSets * 0.5);
        totalSets += half;
        if (half > 0) breakdown.push({name:ex.name.split(' ').slice(0,2).join(' '), sets:half, color:ex.color, secondary:true});
      }
    });
  });
  return { totalSets:totalSets, breakdown:breakdown };
}

// ─── PR DETECTION ────────────────────────────────────────────
function estimate1RM(weight, reps) {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30)); // Epley formula
}

function checkAndUpdatePRs(exerciseId, sets) {
  if (!S.prs[exerciseId]) S.prs[exerciseId] = {};
  var pr = S.prs[exerciseId];
  var newPRs = [];

  sets.forEach(function(set) {
    if (!set.completed || set.type !== 'working') return;
    var e1rm = estimate1RM(set.weight, set.reps);
    if (!pr.e1rm || e1rm > pr.e1rm.weight) {
      pr.e1rm = { weight:e1rm, actualWeight:set.weight, actualReps:set.reps, date:TODAY };
      newPRs.push('Estimated 1RM: ' + e1rm + ' ' + S.units);
    }
    if (!pr.maxWeight || set.weight > pr.maxWeight.weight || (set.weight === pr.maxWeight.weight && set.reps > pr.maxWeight.reps)) {
      pr.maxWeight = { weight:set.weight, reps:set.reps, date:TODAY };
      newPRs.push('Best set: ' + set.weight + ' ' + S.units + ' x ' + set.reps);
    }
  });

  var totalVolume = sets.reduce(function(sum, s) {
    return sum + (s.completed && s.type === 'working' ? s.weight * s.reps : 0);
  }, 0);
  if (totalVolume > 0 && (!pr.maxVolume || totalVolume > pr.maxVolume.volume)) {
    pr.maxVolume = { volume:totalVolume, date:TODAY };
    newPRs.push('Volume PR: ' + totalVolume.toLocaleString() + ' ' + S.units);
  }

  return newPRs;
}

// ─── REST TIMER (Web Worker with setInterval fallback) ───────
var timerWorker = null;
var _fallbackTimer = null;

// Try Web Worker first, fall back to setInterval for file:// protocol
try {
  timerWorker = new Worker('js/workers/rest-timer.js');
  timerWorker.onmessage = function(e) {
    if (e.data.type === 'tick') {
      if (S.restTimer) {
        S.restTimer.remaining = e.data.remaining;
        updateTimerDisplay();
      }
    }
    if (e.data.type === 'done') { onTimerDone(); }
    if (e.data.type === 'stopped') { if (!S.restTimer) updateTimerDisplay(); }
  };
  timerWorker.onerror = function() { timerWorker = null; console.warn("Timer worker error, using fallback"); };
} catch(e) {
  timerWorker = null;
  console.warn("Timer worker unavailable, using setInterval fallback");
}

function onTimerDone() {
  if (S.vibrateOnTimerEnd && navigator.vibrate) navigator.vibrate([200,100,200,100,300]);
  var wasTimer = S.restTimer;
  S.restTimer = null;
  updateTimerDisplay();
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Rest Complete', { body:'Time for your next set!', icon:'icon.svg', tag:'rest-timer' });
  }
  // Flash the timer area green briefly
  var root = document.getElementById('timer-root');
  if (root) {
    root.innerHTML = '<div class="timer-bar" style="border-top-color:#38b000">' +
      '<div style="font-size:16px">\u2705</div>' +
      '<div style="flex:1;font-size:13px;font-weight:600;color:#38b000">Rest Complete \u2014 Go!</div>' +
      '<button onclick="document.getElementById(\'timer-root\').innerHTML=\'\'" style="background:#1a1a2e;border:1px solid #2a2a2e;border-radius:8px;color:#888;padding:6px 12px;font-size:10px;cursor:pointer">OK</button>' +
      '</div>';
    setTimeout(function(){ if (!S.restTimer) { root.innerHTML = ''; } }, 5000);
  }
}

function startRestTimer(seconds, exerciseId) {
  // Stop any existing timer
  if (_fallbackTimer) { clearInterval(_fallbackTimer); _fallbackTimer = null; }
  if (timerWorker) { timerWorker.postMessage({ cmd:'stop' }); }

  S.restTimer = { startedAt:Date.now(), duration:seconds, exerciseId:exerciseId, remaining:seconds };

  if (timerWorker) {
    timerWorker.postMessage({ cmd:'start', seconds:seconds });
  } else {
    // setInterval fallback
    _fallbackTimer = setInterval(function() {
      if (!S.restTimer) { clearInterval(_fallbackTimer); _fallbackTimer = null; return; }
      // Calculate from timestamps for accuracy (survives tab focus issues)
      var elapsed = Math.floor((Date.now() - S.restTimer.startedAt) / 1000);
      S.restTimer.remaining = Math.max(0, S.restTimer.duration - elapsed);
      updateTimerDisplay();
      if (S.restTimer.remaining <= 0) {
        clearInterval(_fallbackTimer);
        _fallbackTimer = null;
        onTimerDone();
      }
    }, 250); // 250ms for smooth countdown
  }
  updateTimerDisplay();
}

function stopRestTimer() {
  if (timerWorker) timerWorker.postMessage({ cmd:'stop' });
  if (_fallbackTimer) { clearInterval(_fallbackTimer); _fallbackTimer = null; }
  S.restTimer = null;
  updateTimerDisplay();
}

function addRestTime(seconds) {
  if (!S.restTimer) return;
  S.restTimer.duration += seconds;
  S.restTimer.remaining += seconds;
  if (timerWorker) timerWorker.postMessage({ cmd:'start', seconds:S.restTimer.remaining });
  updateTimerDisplay();
}

function updateTimerDisplay() {
  var root = document.getElementById('timer-root');
  if (!root) return;
  if (!S.restTimer) { if (root.querySelector('.timer-bar') && !root.innerHTML.match(/Rest Complete/)) root.innerHTML = ''; return; }
  var pct = ((S.restTimer.duration - S.restTimer.remaining) / S.restTimer.duration) * 100;
  var isAlmostDone = S.restTimer.remaining <= 10;
  var color = isAlmostDone ? '#38b000' : '#00b4d8';
  var exName = '';
  if (S.restTimer.exerciseId) {
    var ex = findExercise(S.restTimer.exerciseId);
    if (ex) exName = ex.name;
  }
  root.innerHTML = '<div class="timer-bar" style="'+(isAlmostDone?'border-top-color:#38b000;':'')+'">'+
    '<div class="timer-ring-wrap">' + svgRing(18, pct, color, 4) +
    '<div class="timer-text" style="font-size:12px;font-weight:700;color:'+(isAlmostDone?'#38b000':'#e0e0f0')+'">' + fmtTime(S.restTimer.remaining) + '</div></div>' +
    '<div style="flex:1"><div style="font-size:13px;font-weight:600;color:'+(isAlmostDone?'#38b000':'#e0e0f0')+'">Rest \u2014 '+fmtTime(S.restTimer.remaining)+'</div>' +
    '<div style="font-size:9px;color:#555">'+(exName?exName+' \u2022 ':'')+'total '+fmtTime(S.restTimer.duration)+'</div></div>' +
    '<button onclick="addRestTime(30)" style="background:#1a1a2e;border:1px solid #2a2a2e;border-radius:8px;color:#888;padding:6px 8px;font-size:10px;cursor:pointer">+30s</button>' +
    '<button onclick="stopRestTimer()" style="background:#1a1a2e;border:1px solid #2a2a2e;border-radius:8px;color:#888;padding:6px 8px;font-size:10px;cursor:pointer">Skip</button>' +
    '</div>';
}


function navigateToExerciseDetail(exerciseId) {
  closeModal();
  S.subTab = "exercises";
  S.expanded = "ex_" + exerciseId;
  S.searchQuery = "";
  S.filterMuscle = "";
  S.filterEquip = "";
  EXC.draw();
  setTimeout(function() {
    var card = document.querySelector('[data-exid="' + exerciseId + '"]');
    if (card) card.scrollIntoView({ behavior:"smooth", block:"start" });
  }, 50);
}

var _modalFilterEquip = "";
var _modalFilterMuscle = "";

// ─── IN-WORKOUT COACHING ─────────────────────────────────────

function getSetCoachingNudge(exIdx, setIdx) {
  if (!S.activeWorkout) return null;
  var wex = S.activeWorkout.exercises[exIdx];
  if (!wex) return null;
  var set = wex.sets[setIdx];
  if (!set || !set.completed || set.type === 'warmup') return null;

  var workingSets = wex.sets.filter(function(s) { return s.type === 'working'; });
  var completedWorking = workingSets.filter(function(s) { return s.completed; });
  var setWorkingIdx = workingSets.indexOf(set);

  // Check RPE jump from previous set
  if (setWorkingIdx > 0) {
    var prevSet = workingSets[setWorkingIdx - 1];
    if (prevSet.completed && prevSet.rpe && set.rpe) {
      var rpeJump = set.rpe - prevSet.rpe;
      if (rpeJump >= 2) {
        return { msg:'RPE climbing fast \u2014 consider dropping 5-10 lbs next set', type:'caution' };
      }
    }
  }

  // RPE = 10 warning
  if (set.rpe === 10) {
    return { msg:'Max effort. Take extra rest, consider reducing weight', type:'caution' };
  }

  // Rep drop from first working set
  if (setWorkingIdx > 0 && completedWorking.length >= 2) {
    var firstSet = completedWorking[0];
    if (firstSet.reps - set.reps >= 3 && set.weight === firstSet.weight) {
      return { msg:'Significant rep drop (' + firstSet.reps + ' \u2192 ' + set.reps + '). Consider lighter weight or more rest', type:'caution' };
    }
  }

  // All working sets completed with good performance
  var allDone = completedWorking.length === workingSets.length;
  if (allDone) {
    var allHitTarget = completedWorking.every(function(s) { return s.reps >= completedWorking[0].reps; });
    var avgRPE = 0;
    var rpeCount = 0;
    completedWorking.forEach(function(s) { if (s.rpe) { avgRPE += s.rpe; rpeCount++; } });
    avgRPE = rpeCount > 0 ? avgRPE / rpeCount : 0;
    if (allHitTarget && avgRPE > 0 && avgRPE <= 7) {
      return { msg:'Strong performance! Ready to increase weight next session', type:'positive' };
    }
    if (allHitTarget && avgRPE > 0 && avgRPE <= 8.5) {
      return { msg:'Solid work. Right in the productive range', type:'positive' };
    }
  }

  return null;
}

function getSessionFatigue() {
  if (!S.activeWorkout) return null;
  var totalRPE = 0, rpeCount = 0;
  S.activeWorkout.exercises.forEach(function(wex) {
    wex.sets.forEach(function(s) {
      if (s.completed && s.type === 'working' && s.rpe) {
        totalRPE += s.rpe;
        rpeCount++;
      }
    });
  });
  if (rpeCount < 2) return null;
  var avg = totalRPE / rpeCount;
  var label, color, pct;
  if (avg <= 6) { label = 'Fresh'; color = '#38b000'; pct = avg / 10 * 100; }
  else if (avg <= 8) { label = 'Working'; color = '#ffd60a'; pct = avg / 10 * 100; }
  else if (avg <= 9) { label = 'Fatigued'; color = '#ff6b35'; pct = avg / 10 * 100; }
  else { label = 'Maxed'; color = '#e63946'; pct = 100; }
  return { avg: Math.round(avg * 10) / 10, label: label, color: color, pct: pct };
}

// ─── DAY SCHEDULING HELPERS ──────────────────────────────────
var DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
var DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
var DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getTodayDayKey() { return DAY_KEYS[new Date().getDay()]; }

function getTemplateStats(templateId) {
  var sessions = S.workoutHistory.filter(function(w){ return w.templateId === templateId; });
  var tmpl = S.templates.find(function(t){ return t.id === templateId; });
  var createdAt = tmpl && tmpl.createdAt ? tmpl.createdAt : null;
  var weeksInUse = 0;
  if (createdAt) {
    var diff = Date.now() - new Date(createdAt).getTime();
    weeksInUse = Math.max(1, Math.ceil(diff / (7 * 86400000)));
  }
  return { sessions:sessions.length, weeksInUse:weeksInUse, createdAt:createdAt };
}

function getTodaysTemplates() {
  var dk = getTodayDayKey();
  return S.templates.filter(function(t){ return t.scheduledDays && t.scheduledDays[dk]; });
}

// ─── NEXT SESSION PREDICTION ─────────────────────────────────
function getNextSessionDate(muscleId) {
  // Find templates that train this muscle
  var today = new Date().getDay(); // 0=Sun
  var minDays = Infinity;
  S.templates.forEach(function(t) {
    if (!t.scheduledDays) return;
    var hitsMuscle = t.exercises.some(function(te) {
      var ex = findExercise(te.exerciseId);
      if (!ex) return false;
      return ex.musclesPrimary.some(function(m){return m.muscle===muscleId;});
    });
    if (!hitsMuscle) return;
    DAY_KEYS.forEach(function(dk, di) {
      if (!t.scheduledDays[dk]) return;
      var daysUntil = (di - today + 7) % 7;
      if (daysUntil === 0) daysUntil = 7; // next week if today
      if (daysUntil < minDays) minDays = daysUntil;
    });
  });
  return minDays === Infinity ? null : minDays;
}

function getScheduledDays() {
  var scheduled = {};
  S.templates.forEach(function(t) {
    if (!t.scheduledDays) return;
    DAY_KEYS.forEach(function(dk) {
      if (t.scheduledDays[dk]) scheduled[dk] = true;
    });
  });
  return scheduled;
}

function checkDeloadNeeded() {
  // Check if any exercise has 3+ consecutive sessions of declining performance
  if (S.workoutHistory.length < 3) return null;
  var exerciseHistory = {};
  S.workoutHistory.forEach(function(w) {
    w.exercises.forEach(function(wex) {
      if (!exerciseHistory[wex.exerciseId]) exerciseHistory[wex.exerciseId] = [];
      var totalVol = wex.sets.reduce(function(s, set) {
        return s + (set.completed && set.type === 'working' ? set.weight * set.reps : 0);
      }, 0);
      if (totalVol > 0) exerciseHistory[wex.exerciseId].push(totalVol);
    });
  });
  var declining = [];
  Object.keys(exerciseHistory).forEach(function(exId) {
    var h = exerciseHistory[exId];
    if (h.length < 3) return;
    var last3 = h.slice(-3);
    if (last3[2] < last3[1] && last3[1] < last3[0]) {
      var ex = findExercise(exId);
      if (ex) declining.push(ex.name);
    }
  });
  if (declining.length > 0) {
    return 'Volume declining 3+ sessions on: ' + declining.slice(0, 3).join(', ') + '. Consider a lighter week.';
  }
  return null;
}

function getWorkoutStreak() {
  if (S.workoutHistory.length === 0) return 0;
  var streak = 0;
  var checkDate = new Date(); checkDate.setHours(0,0,0,0);
  for (var w = 0; w < 52; w++) {
    var weekEnd = new Date(checkDate);
    var weekStart = new Date(checkDate); weekStart.setDate(weekStart.getDate() - 7);
    var has = S.workoutHistory.some(function(wk){ var d = new Date(wk.startedAt); return d >= weekStart && d <= weekEnd; });
    if (has) { streak++; checkDate = weekStart; } else break;
  }
  return streak;
}

function renderMiniCalendar() {
  var now = new Date();
  var year = now.getFullYear(), month = now.getMonth(), today = now.getDate();
  var workoutDates = {};
  S.workoutHistory.forEach(function(w) {
    var d = new Date(w.startedAt);
    if (d.getFullYear() === year && d.getMonth() === month) workoutDates[d.getDate()] = (workoutDates[d.getDate()]||0)+1;
  });
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var monthName = now.toLocaleDateString('en-US', {month:'long', year:'numeric'});
  var sessionsThisMonth = Object.keys(workoutDates).length;
  var h = '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:10px 12px;margin-bottom:10px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
  h += '<span style="font-size:10px;color:#888;font-weight:600;letter-spacing:1px">'+monthName.toUpperCase()+'</span>';
  if (sessionsThisMonth > 0) h += '<span style="font-size:9px;color:#00b4d8">'+sessionsThisMonth+' session'+(sessionsThisMonth>1?'s':'')+'</span>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center">';
  DAY_LABELS.forEach(function(d){ h += '<div style="font-size:8px;color:#333;padding:2px 0">'+d+'</div>'; });
  for (var i = 0; i < firstDay; i++) h += '<div></div>';
  var scheduledDays = getScheduledDays();
  for (var d = 1; d <= daysInMonth; d++) {
    var isToday = d === today, count = workoutDates[d]||0;
    var dayDate = new Date(year, month, d);
    var dayKey = DAY_KEYS[dayDate.getDay()];
    var isScheduled = scheduledDays[dayKey] && d >= today;
    var isRest = !scheduledDays[dayKey] && d >= today && Object.keys(scheduledDays).length > 0;
    var bg = isToday ? '#00b4d8' : count>0 ? '#00b4d833' : isScheduled ? '#4cc9f008' : 'transparent';
    var clr = isToday ? '#000' : count>0 ? '#4cc9f0' : isScheduled ? '#4cc9f066' : isRest ? '#222' : '#333';
    var fw = isToday ? '700' : 'normal';
    var border = isScheduled && !isToday && !count ? 'border:1px dashed #4cc9f033;' : '';
    h += '<div style="font-size:9px;padding:3px 1px;border-radius:3px;background:'+bg+';color:'+clr+';font-weight:'+fw+';'+border+'">'+d+'</div>';
  }
  h += '</div>';
  var streak = getWorkoutStreak();
  if (streak > 1) h += '<div style="font-size:9px;color:#ffd60a;margin-top:6px;text-align:center">\uD83D\uDD25 '+streak+' week streak</div>';
  h += '</div>';
  return h;
}

// ════════════════════════════════════════════════════════════════
//  WORKOUT TAB
// ════════════════════════════════════════════════════════════════

function renderWorkout() {
  if (S.activeWorkout) return renderActiveWorkout();
  return renderWorkoutStart();
}

function renderWorkoutStart() {
  var h = '<div class="sec sIn">';

  // ── Readiness banner ──────────────────────────────────────
  if (EXC.recovery && EXC.recovery.getScore) {
    var _rs = EXC.recovery.getScore();
    if (_rs && _rs.overall < 40) {
      h += '<div style="background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.3);border-radius:10px;padding:10px 12px;margin-bottom:12px">';
      h += '<div style="font-size:11px;color:#ff4444;font-weight:600">\u26A0 Recovery Mode \u2014 Readiness '+_rs.overall+'</div>';
      h += '<div style="font-size:10px;color:#aa3333;margin-top:3px">Weights auto-reduced 15%. Consider mobility or light session today.</div>';
      h += '</div>';
    } else if (_rs && _rs.overall < 55) {
      h += '<div style="background:rgba(255,214,10,.06);border:1px solid rgba(255,214,10,.25);border-radius:10px;padding:10px 12px;margin-bottom:12px">';
      h += '<div style="font-size:11px;color:#ffd60a;font-weight:600">\u26A0 Moderate Readiness \u2014 Score '+_rs.overall+'</div>';
      h += '<div style="font-size:10px;color:#aa9500;margin-top:3px">Weights reduced 10%. Listen to your body today.</div>';
      h += '</div>';
    } else if (_rs && _rs.overall > 85) {
      h += '<div style="background:rgba(56,176,0,.06);border:1px solid rgba(56,176,0,.25);border-radius:10px;padding:10px 12px;margin-bottom:12px">';
      h += '<div style="font-size:11px;color:#38b000;font-weight:600">\uD83D\uDE80 Peak Readiness \u2014 Score '+_rs.overall+'</div>';
      h += '<div style="font-size:10px;color:#2a8800;margin-top:3px">Full recovery. Push for PRs \u2014 double weight increments active.</div>';
      h += '</div>';
    }
  }

  var todaysTemplates = getTodaysTemplates();
  var dayName = DAY_NAMES[new Date().getDay()];

  // ── Today's scheduled workout ─────────────────────────────
  if (todaysTemplates.length > 0) {
    todaysTemplates.forEach(function(t) {
      var exNames = t.exercises.slice(0,3).map(function(e){ var ex=findExercise(e.exerciseId); return ex?ex.name:'?'; }).join(' · ');
      if (t.exercises.length > 3) exNames += ' +' + (t.exercises.length-3);
      h += '<div style="background:linear-gradient(135deg,#00b4d811,#4cc9f008);border:1px solid #00b4d844;border-radius:14px;padding:14px;margin-bottom:12px">';
      h += '<div style="font-size:9px;color:#00b4d8;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">\uD83D\uDCC5 Today \u00B7 '+dayName+'</div>';
      h += '<div style="display:flex;align-items:center;gap:10px">';
      h += '<span style="font-size:24px">'+t.icon+'</span>';
      h += '<div style="flex:1"><div style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700;color:#f0f0ff">'+t.name+'</div>';
      h += '<div style="font-size:10px;color:#555;margin-top:2px">'+exNames+'</div></div>';
      h += '<button class="btn-pri" onclick="startFromTemplate(\''+t.id+'\')" style="width:auto;padding:10px 16px;margin:0;font-size:12px">Start</button>';
      h += '</div></div>';
    });
  } else {
    h += '<div style="background:#0d0d1a;border:1px dashed #1a1a2e;border-radius:14px;padding:12px;margin-bottom:12px;display:flex;align-items:center;gap:10px">';
    h += '<div style="font-size:20px">\uD83D\uDCC5</div>';
    h += '<div style="flex:1"><div style="font-size:11px;color:#555">No workout scheduled for '+dayName+'</div>';
    h += '<div style="font-size:9px;color:#333;margin-top:1px">Assign a routine a day in the Templates tab</div></div>';
    h += '<button onclick="startEmptyWorkout()" style="padding:6px 12px;border-radius:8px;border:1px solid #2a2a2e;color:#666;font-size:10px;cursor:pointer;background:#111;white-space:nowrap">Empty</button>';
    h += '</div>';
  }

  // ── Calendar ──────────────────────────────────────────────
  h += renderMiniCalendar();

  // ── Routines ──────────────────────────────────────────────
  if (S.templates.length > 0) {
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\uD83D\uDCCB Your Routines</div>';
    S.templates.forEach(function(t) {
      var exNames = t.exercises.slice(0,2).map(function(e){ var ex=findExercise(e.exerciseId); return ex?ex.name:'?'; }).join(', ');
      if (t.exercises.length > 2) exNames += ' +' + (t.exercises.length-2);
      var days = t.scheduledDays || {};
      h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-left:3px solid '+t.color+';border-radius:12px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:10px">';
      h += '<span style="font-size:16px">'+t.icon+'</span>';
      h += '<div style="flex:1">';
      h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0">'+t.name+'</div>';
      h += '<div style="font-size:9px;color:#555;margin-top:1px">'+exNames+'</div>';
      h += '<div style="display:flex;gap:2px;margin-top:4px">';
      DAY_KEYS.forEach(function(dk,di){
        var on = days[dk];
        h += '<span style="font-size:7px;padding:1px 4px;border-radius:3px;background:'+(on?t.color+'33':'#111')+';color:'+(on?t.color:'#333')+';font-weight:'+(on?'700':'normal')+'">'+DAY_LABELS[di]+'</span>';
      });
      h += '</div></div>';
      h += '<button class="btn-pri" onclick="startFromTemplate(\''+t.id+'\')" style="width:auto;padding:7px 14px;margin:0;font-size:11px">Go</button>';
      h += '</div>';
    });
  } else {
    h += '<div class="empty" style="margin:8px 0 12px"><div class="empty-icon">\uD83D\uDCCB</div>No routines yet.<br><span onclick="go(\'templates\')" style="color:#00b4d8;cursor:pointer;font-size:12px">Create a routine \u2192</span></div>';
  }

  // ── Deload detection ─────────────────────────────────────
  var deloadWarning = checkDeloadNeeded();
  if (deloadWarning) {
    h += '<div class="wbar" style="margin-bottom:10px">\u26A0\uFE0F <strong>Deload suggested</strong> \u2014 '+deloadWarning+'</div>';
  }

  // ── Quick start by type ──────────────────────────────────
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\u26A1 Quick Start</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">';
  Object.keys(WORKOUT_TYPES).forEach(function(key) {
    var wt = WORKOUT_TYPES[key];
    h += '<div onclick="beginTypedWorkout(\''+key+'\')" style="background:#0d0d1a;border:1px solid '+wt.color+'33;border-radius:10px;padding:10px 6px;text-align:center;cursor:pointer">';
    h += '<div style="font-size:18px;margin-bottom:2px">'+wt.icon+'</div>';
    h += '<div style="font-size:10px;font-weight:600;color:'+wt.color+'">'+wt.label+'</div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<button onclick="beginTypedWorkout(null)" style="width:100%;padding:8px;border-radius:10px;border:1px dashed #1a1a2e;color:#444;font-size:10px;cursor:pointer;background:transparent;margin-bottom:16px">+ Start Without Type</button>';

  // ── Muscle Recovery ───────────────────────────────────────
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\uD83D\uDCAA Muscle Recovery</div>';
  var muscles = Object.keys(MUSCLE_GROUPS);
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:16px">';
  muscles.forEach(function(mid) {
    var mg = MUSCLE_GROUPS[mid];
    var rec = getMuscleRecovery(mid);
    var nextDays = getNextSessionDate(mid);
    var warn = nextDays && rec.pct < 70 && nextDays <= 2;
    h += '<div style="background:#0d0d1a;border:1px solid '+(warn?'#ff6b3544':'#1a1a2e')+';border-radius:8px;padding:8px;display:flex;align-items:center;gap:8px">';
    h += svgRing(12, rec.pct, rec.color, 4);
    h += '<div><div style="font-size:10px;color:#ccc">'+mg.name+'</div>';
    h += '<div style="font-size:9px;color:'+rec.color+'">'+rec.status;
    if (rec.hoursRemaining > 0) h += ' \u2014 '+rec.hoursRemaining+'h';
    h += '</div>';
    if (nextDays) {
      h += '<div style="font-size:8px;color:'+(warn?'#ff6b35':'#444')+'">Next in '+nextDays+'d'+(warn?' \u2014 still fatigued':'')+'</div>';
    }
    h += '</div></div>';
  });
  h += '</div>';

  // ── Weekly Volume (only when data exists) ────────────────
  var hasVolume = false, volumeHtml = '';
  muscles.forEach(function(mid) {
    var mg = MUSCLE_GROUPS[mid];
    var vol = getWeeklyVolume(mid);
    if (vol.totalSets === 0) return;
    hasVolume = true;
    var target = mg.weeklySetTarget;
    var pct = Math.min(100, (vol.totalSets / target.max) * 100);
    var vc = vol.totalSets < target.min ? '#ff6b35' : vol.totalSets > target.max ? '#ffd60a' : '#38b000';
    volumeHtml += '<div style="margin-bottom:8px">';
    volumeHtml += '<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span style="color:#ccc">'+mg.name+'</span><span style="color:'+vc+'">'+vol.totalSets+' / '+target.min+'-'+target.max+' sets</span></div>';
    volumeHtml += '<div class="pbar"><div class="pbar-fill" style="width:'+pct+'%;background:'+vc+'"></div></div>';
    if (vol.breakdown.length > 0) {
      volumeHtml += '<div style="font-size:9px;color:#444;margin-top:2px">'+vol.breakdown.map(function(b){return '<span style="color:'+b.color+'">'+b.name+' '+b.sets+'</span>';}).join(' + ')+'</div>';
    }
    volumeHtml += '</div>';
  });
  if (hasVolume) {
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\u26A1 Weekly Volume</div>';
    h += volumeHtml;
  }

  h += '</div>';
  return h;
}

function renderActiveWorkout() {
  var w = S.activeWorkout;
  var elapsed = Date.now() - new Date(w.startedAt).getTime();
  var totalDone = w.exercises.reduce(function(s,e){return s+e.sets.filter(function(ss){return ss.completed;}).length;},0);
  var totalVol = w.exercises.reduce(function(s,e){return s+e.sets.reduce(function(s2,ss){return s2+(ss.completed&&ss.type==='working'?ss.weight*ss.reps:0);},0);},0);
  var h = '<div class="sec sIn">';

  // ── Header with live stats ────────────────────────────────
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:10px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700;color:#f0f0ff">'+(w.name||'Workout');
  if (w.workoutType && WORKOUT_TYPES[w.workoutType]) {
    var _wt = WORKOUT_TYPES[w.workoutType];
    h += ' <span style="font-size:9px;padding:2px 8px;border-radius:6px;background:'+_wt.color+'22;color:'+_wt.color+';border:1px solid '+_wt.color+'33;vertical-align:middle">'+_wt.icon+' '+_wt.label+'</span>';
  }
  h += '</div>';
  h += '<button onclick="finishWorkout()" class="btn-pri" style="width:auto;padding:8px 16px;margin:0;font-size:12px">Finish</button>';
  h += '</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
  h += '<div class="sbox" style="text-align:center;padding:6px"><div class="slbl">Duration</div><div id="workout-elapsed" style="font-size:14px;font-weight:700;color:#4cc9f0;font-family:\'Space Grotesk\',sans-serif">'+fmtDuration(elapsed)+'</div></div>';
  h += '<div class="sbox" style="text-align:center;padding:6px"><div class="slbl">Sets Done</div><div style="font-size:14px;font-weight:700;color:#4cc9f0;font-family:\'Space Grotesk\',sans-serif">'+totalDone+'</div></div>';
  h += '<div class="sbox" style="text-align:center;padding:6px"><div class="slbl">Volume</div><div style="font-size:14px;font-weight:700;color:#38b000;font-family:\'Space Grotesk\',sans-serif">'+(totalVol>0?totalVol.toLocaleString():'—')+'</div></div>';
  h += '</div>';
  // Session fatigue meter
  var fatigue = getSessionFatigue();
  if (fatigue) {
    h += '<div style="margin-top:8px;display:flex;align-items:center;gap:8px">';
    h += '<div style="font-size:9px;color:#555;white-space:nowrap">Fatigue</div>';
    h += '<div style="flex:1;height:6px;background:#111;border-radius:3px;overflow:hidden">';
    h += '<div style="height:6px;border-radius:3px;width:'+fatigue.pct+'%;background:'+fatigue.color+';transition:width .3s"></div></div>';
    h += '<div style="font-size:9px;color:'+fatigue.color+';font-weight:600;white-space:nowrap">'+fatigue.label+' ('+fatigue.avg+')</div>';
    h += '</div>';
  }
  // Workout notes
  h += '<textarea id="workout-notes" placeholder="Workout notes (how you feel, energy, etc.)" rows="2" style="margin-top:8px;background:#0a0a14;border:1px solid #1a1a2e;border-radius:8px;padding:6px 10px;color:#666;font-size:10px;width:100%;resize:none" onchange="setWorkoutNotes(this.value)">'+(w.notes||'')+'</textarea>';
  h += '</div>';

  // ── Exercises ─────────────────────────────────────────────
  w.exercises.forEach(function(wex, exIdx) {
    var ex = findExercise(wex.exerciseId);
    if (!ex) return;
    var suggestion = getProgressionSuggestion(wex.exerciseId);
    var exDone = wex.sets.filter(function(s){return s.completed;}).length;
    var exTotal = wex.sets.length;

    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:8px">';

    // Exercise header
    h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
    h += '<span style="font-size:16px">'+ex.icon+'</span>';
    h += '<div style="flex:1">';
    h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:'+ex.color+';cursor:pointer" onclick="event.stopPropagation();navigateToExerciseDetail(\''+ex.id+'\')">';
    h += ex.name + ' <span style="font-size:10px;color:#555;vertical-align:middle" title="View details">\u24D8</span></div>';
    var last = getLastPerformance(wex.exerciseId);
    if (last && last.sets.length > 0) {
      var ls = last.sets.find(function(s){return s.type==='working'&&s.completed;});
      if (ls) h += '<div style="font-size:9px;color:#555">Last: '+ls.weight+' '+S.units+' \u00D7 '+ls.reps+'</div>';
    }
    h += '</div>';
    h += '<span style="font-size:10px;color:'+(exDone===exTotal&&exTotal>0?'#38b000':'#444')+';background:#111;border-radius:5px;padding:2px 7px">'+exDone+'/'+exTotal+'</span>';
    h += '<button onclick="swapExercise('+exIdx+')" style="color:#444;font-size:12px;padding:4px;line-height:1" title="Swap">\u21C4</button>';
    h += '<button onclick="removeExerciseFromWorkout('+exIdx+')" style="color:#333;font-size:16px;padding:4px;line-height:1">\u00D7</button>';
    h += '</div>';

    if (suggestion) {
      h += '<div class="ibar" style="margin-bottom:8px;padding:6px 10px;font-size:10px">\uD83D\uDCC8 '+suggestion.msg;
      if (suggestion.breakdown) h += '<div style="font-size:9px;color:#555;margin-top:3px">Last: '+suggestion.breakdown+'</div>';
      h += '</div>';
    }

    // Column headers
    h += '<div style="display:flex;align-items:center;gap:4px;padding:2px 0 4px;font-size:8px;color:#333;text-transform:uppercase;letter-spacing:1px">';
    h += '<div style="width:22px;text-align:center">#</div>';
    h += '<div style="flex:1;text-align:center">'+S.units.toUpperCase()+'</div>';
    h += '<div style="flex:1;text-align:center">REPS</div>';
    h += '<div style="width:30px;text-align:center">RPE</div>';
    h += '<div style="width:30px"></div></div>';

    // Sets
    var workingSetCount = 0;
    wex.sets.forEach(function(set, setIdx) {
      var isWarmup = set.type === 'warmup';
      var lastSet = isWarmup ? null : getLastSetData(wex.exerciseId, workingSetCount);
      if (!isWarmup) workingSetCount++;
      var rowBg = set.completed ? 'background:'+ex.color+'0d;' : '';
      h += '<div class="set-row" style="opacity:'+(isWarmup?'.65':'1')+';'+rowBg+'border-radius:6px;margin-bottom:2px">';

      // Set number
      h += '<div style="width:22px;text-align:center;font-size:9px;color:'+(set.completed?ex.color:isWarmup?'#444':'#555')+'">'+
        (isWarmup?'W':workingSetCount)+'</div>';

      // Weight
      h += '<div style="display:flex;align-items:center;gap:2px;flex:1;justify-content:center">';
      h += '<button class="adj" style="width:22px;height:22px;font-size:11px" onclick="adjSet('+exIdx+','+setIdx+',\'weight\',-1)">\u2212</button>';
      h += '<input class="dinput" style="width:46px;font-size:11px" value="'+set.weight+'" onchange="setSetVal('+exIdx+','+setIdx+',\'weight\',this.value)">';
      h += '<button class="adj" style="width:22px;height:22px;font-size:11px" onclick="adjSet('+exIdx+','+setIdx+',\'weight\',1)">+</button></div>';

      // Reps
      h += '<div style="display:flex;align-items:center;gap:2px;flex:1;justify-content:center">';
      h += '<button class="adj" style="width:22px;height:22px;font-size:11px" onclick="adjSet('+exIdx+','+setIdx+',\'reps\',-1)">\u2212</button>';
      h += '<input class="dinput" style="width:36px;font-size:11px" value="'+set.reps+'" onchange="setSetVal('+exIdx+','+setIdx+',\'reps\',this.value)">';
      h += '<button class="adj" style="width:22px;height:22px;font-size:11px" onclick="adjSet('+exIdx+','+setIdx+',\'reps\',1)">+</button></div>';

      // RPE button (shows after set is completed)
      h += '<div style="width:30px;text-align:center">';
      if (set.completed) {
        var rpeColors = ['','#38b000','#38b000','#ffd60a','#ffd60a','#ffd60a','#f77f00','#f77f00','#ff6b35','#ff6b35','#e63946'];
        var rpeClr = set.rpe ? rpeColors[set.rpe] : '#333';
        h += '<button onclick="openRPEPicker('+exIdx+','+setIdx+')" style="font-size:9px;font-weight:600;color:'+rpeClr+';background:#111;border:1px solid #222;border-radius:4px;padding:2px 3px;cursor:pointer;width:28px">'+(set.rpe||'—')+'</button>';
      }
      h += '</div>';

      // Complete checkbox
      h += '<button class="chk" onclick="completeSet('+exIdx+','+setIdx+')" style="width:28px;height:28px;font-size:12px;background:'+(set.completed?ex.color:'transparent')+';border-color:'+(set.completed?ex.color:'#333')+';color:'+(set.completed?'#000':'#555')+'">'+(set.completed?'\u2713':'')+'</button>';
      h += '</div>';
      // Smart weight adjustment label
      if (set.suggestion && !set.completed && set.suggestion !== 'same' && set.suggestion !== 'first_session' && set.suggestion !== 'no_data') {
        var sugLabels = {progress:'\u2191 +'+( S.units==='kg'?'2.5':'5')+S.units, super_progress:'\uD83D\uDE80 peak recovery \u2191\u2191 +'+( S.units==='kg'?'5':'10')+S.units, deload:'\u26A0 deload \u221215%', low_readiness:'\u26A0 low readiness \u221215%', moderate_readiness:'\u26A0 mod readiness \u221210%', high_soreness:'\u26A0 sore \u221210%', low_recovery:'\u26A0 recovering \u221210%', moderate_soreness:'\u2014 hold (sore)', rpe_overload:'\u26A0 RPE too high \u221210%', rpe_high:'\u2014 hold (RPE \u22659)', rpe_fatigue_trend:'\u26A0 fatigue trend \u221210%', estimated:'\uD83C\uDFAF based on bodyweight'};
        var sugColors = {progress:'#38b000', super_progress:'#38b000', deload:'#ff6b35', low_readiness:'#ff4444', moderate_readiness:'#ffd60a', high_soreness:'#ff6b35', low_recovery:'#ffd60a', moderate_soreness:'#ffd60a', rpe_overload:'#e63946', rpe_high:'#ffd60a', rpe_fatigue_trend:'#ff6b35', estimated:'#9d4edd'};
        var lbl = sugLabels[set.suggestion] || set.suggestion;
        var clr = sugColors[set.suggestion] || '#555';
        h += '<div style="font-size:8px;color:'+clr+';padding:0 0 1px 22px;margin-top:-3px;font-weight:600">'+lbl+'</div>';
      }
      // Per-set last session comparison
      if (lastSet && !set.completed) {
        var diffW = set.weight - lastSet.weight;
        var diffStr = diffW > 0 ? ' (+'+diffW+')' : diffW < 0 ? ' ('+diffW+')' : '';
        var diffColor = diffW > 0 ? '#38b000' : diffW < 0 ? '#ff6b35' : '#444';
        h += '<div style="font-size:8px;color:#444;padding:0 0 2px 22px;margin-top:-4px">prev: '+lastSet.weight+'\u00D7'+lastSet.reps;
        if (lastSet.rpe) h += ' @'+lastSet.rpe;
        if (diffStr) h += ' <span style="color:'+diffColor+'">'+diffStr+'</span>';
        h += '</div>';
      }
      // Coaching nudge for completed sets
      if (set.completed && set.type === 'working') {
        var nudge = getSetCoachingNudge(exIdx, setIdx);
        if (nudge) {
          var nudgeColor = nudge.type === 'positive' ? '#38b000' : '#ff6b35';
          h += '<div style="font-size:8px;color:'+nudgeColor+';padding:1px 0 2px 22px;margin-top:-2px">'+(nudge.type==='positive'?'\u2705':'\u26A0\uFE0F')+' '+nudge.msg+'</div>';
        }
      }
    });

    // Add set buttons
    h += '<div style="display:flex;gap:6px;margin-top:8px">';
    h += '<button onclick="addSet('+exIdx+',\'working\')" style="flex:1;padding:6px;border-radius:6px;border:1px dashed #2a2a2e;color:#444;font-size:10px;cursor:pointer;background:transparent">+ Working Set</button>';
    h += '<button onclick="addSet('+exIdx+',\'warmup\')" style="padding:6px 10px;border-radius:6px;border:1px solid #1a1a2e;color:#333;font-size:9px;cursor:pointer;background:#111">+ Warmup</button>';
    h += '<button onclick="autoWarmup('+exIdx+')" style="padding:6px 10px;border-radius:6px;border:1px solid #9d4edd44;color:#9d4edd;font-size:9px;cursor:pointer;background:#9d4edd11">\uD83D\uDD25 Warmup</button>';
    h += '</div>';

    // Intra-workout note for this exercise
    h += '<div style="margin-top:6px">';
    h += '<input type="text" placeholder="Exercise note (grip, pause, etc.)" value="'+(wex.notes||'').replace(/"/g,'&quot;')+'" onchange="setExNote('+exIdx+',this.value)" style="width:100%;background:#0a0a14;border:1px solid #1a1a2e;border-radius:6px;padding:5px 8px;color:#666;font-size:10px">';
    h += '</div>';

    // Rest selector + manual timer start
    h += '<div style="display:flex;align-items:center;gap:4px;margin-top:8px;flex-wrap:wrap">';
    h += '<span style="font-size:9px;color:#444">REST</span>';
    [30,60,90,120,180].forEach(function(sec) {
      var on = wex.restSeconds === sec;
      h += '<button onclick="setRestTime('+exIdx+','+sec+')" style="padding:3px 8px;border-radius:4px;font-size:9px;border:1px solid '+(on?'#00b4d8':'#1a1a2e')+';color:'+(on?'#00b4d8':'#444')+';background:'+(on?'#00b4d811':'transparent')+';cursor:pointer">'+fmtTime(sec)+'</button>';
    });
    h += '<button onclick="startRestTimer('+(wex.restSeconds||S.defaultRestSeconds)+',\''+wex.exerciseId+'\')" style="padding:3px 8px;border-radius:4px;font-size:9px;border:1px solid #38b000;color:#38b000;background:#38b00011;cursor:pointer;margin-left:4px">\u23F1 Start</button>';
    h += '</div>';

    h += '</div>';
  });

  var exCount = w.exercises.length;
  h += '<button onclick="openAddExerciseModal()" style="width:100%;padding:12px;border-radius:10px;border:1px dashed #2a2a2e;color:#444;font-size:12px;letter-spacing:1px;cursor:pointer;background:transparent;margin-bottom:8px">+ Add Exercise'+(exCount > 0 ? ' <span style="color:#555">('+exCount+' in workout)</span>' : '')+'</button>';
  h += '<button onclick="cancelWorkout()" style="width:100%;padding:8px;border-radius:8px;border:1px solid #1a1a2e;color:#444;font-size:10px;cursor:pointer;background:transparent">Cancel Workout</button>';
  h += '</div>';
  return h;
}

// ─── WORKOUT ACTIONS ─────────────────────────────────────────

function startEmptyWorkout() {
  beginTypedWorkout(null);
}

function beginTypedWorkout(type) {
  closeModal();
  var name = 'Workout';
  if (type && WORKOUT_TYPES[type]) name = WORKOUT_TYPES[type].label + ' Day';
  S.activeWorkout = {
    id: genId(),
    templateId: null,
    name: name,
    workoutType: type || null,
    startedAt: new Date().toISOString(),
    exercises: [],
    notes: ''
  };
  saveS(); draw();
  // If type selected, open add-exercise modal so recommendations appear immediately
  if (type) {
    setTimeout(function() { openAddExerciseModal(); }, 100);
  }
}

function startFromTemplate(templateId) {
  var tmpl = S.templates.find(function(t){return t.id===templateId;});
  if (!tmpl) return;
  var exercises = tmpl.exercises.map(function(te) {
    var sets = [];
    for (var i = 0; i < te.sets; i++) {
      var smart = getSmartWeight(te.exerciseId, i, te.repTarget);
      sets.push({ weight:smart.weight, reps:smart.reps, type:'working', completed:false, rpe:null, timestamp:null, suggestion:smart.reason });
    }
    return { exerciseId:te.exerciseId, sets:sets, restSeconds:te.restSeconds||S.defaultRestSeconds, notes:'' };
  });

  S.activeWorkout = {
    id: genId(),
    templateId: templateId,
    name: tmpl.name,
    startedAt: new Date().toISOString(),
    exercises: exercises,
    notes: ''
  };
  saveS(); draw();
}

function addExerciseToWorkout(exerciseId) {
  if (!S.activeWorkout) return;
  var ex = findExercise(exerciseId);
  var defaultRest = S.defaultRestSeconds;
  if (ex) {
    var rr = getRepRange(ex, S.selectedGoal);
    if (rr) defaultRest = rr.rest;
  }
  var sets = [];
  for (var i = 0; i < 3; i++) {
    var smart = getSmartWeight(exerciseId, i, 8);
    sets.push({ weight:smart.weight, reps:smart.reps, type:'working', completed:false, rpe:null, timestamp:null, suggestion:smart.reason });
  }
  S.activeWorkout.exercises.push({ exerciseId:exerciseId, sets:sets, restSeconds:defaultRest, notes:'' });
  closeModal(); saveS(); draw();
}

function removeExerciseFromWorkout(exIdx) {
  if (!S.activeWorkout) return;
  S.activeWorkout.exercises.splice(exIdx, 1);
  saveS(); draw();
}

function completeSet(exIdx, setIdx) {
  if (!S.activeWorkout) return;
  var set = S.activeWorkout.exercises[exIdx].sets[setIdx];
  set.completed = !set.completed;
  if (set.completed) {
    set.timestamp = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    if (S.autoStartTimer && set.type === 'working') {
      // Don't auto-start timer on the last working set — no rest needed after finishing an exercise
      var wex = S.activeWorkout.exercises[exIdx];
      var workingSets = wex.sets.filter(function(s){ return s.type === 'working'; });
      var isLastWorkingSet = workingSets.indexOf(set) === workingSets.length - 1;
      if (!isLastWorkingSet) {
        var restSec = wex.restSeconds || S.defaultRestSeconds;
        startRestTimer(restSec, wex.exerciseId);
      }
    }
  }
  saveS(); draw();
}

function addSet(exIdx, type) {
  if (!S.activeWorkout) return;
  var wex = S.activeWorkout.exercises[exIdx];
  var lastSet = wex.sets.length > 0 ? wex.sets[wex.sets.length - 1] : null;
  var w = lastSet ? lastSet.weight : 0;
  var r = lastSet ? lastSet.reps : 8;
  if (type === 'warmup') { w = Math.round(w * 0.5); }
  wex.sets.push({ weight:w, reps:r, type:type, completed:false, rpe:null, timestamp:null });
  saveS(); draw();
}

function adjSet(exIdx, setIdx, field, dir) {
  if (!S.activeWorkout) return;
  var set = S.activeWorkout.exercises[exIdx].sets[setIdx];
  if (field === 'weight') {
    var step = S.units === 'kg' ? 2.5 : 5;
    set.weight = Math.max(0, set.weight + dir * step);
  } else if (field === 'reps') {
    set.reps = Math.max(0, set.reps + dir);
  }
  saveS(); draw();
}

function setSetVal(exIdx, setIdx, field, val) {
  if (!S.activeWorkout) return;
  var v = parseFloat(val);
  if (isNaN(v) || v < 0) return;
  S.activeWorkout.exercises[exIdx].sets[setIdx][field] = v;
  saveS();
}

function setRestTime(exIdx, seconds) {
  if (!S.activeWorkout) return;
  S.activeWorkout.exercises[exIdx].restSeconds = seconds;
  saveS(); draw();
}

function setExNote(exIdx, val) {
  if (!S.activeWorkout) return;
  S.activeWorkout.exercises[exIdx].notes = val;
  saveS();
}

function autoWarmup(exIdx) {
  if (!S.activeWorkout) return;
  var wex = S.activeWorkout.exercises[exIdx];
  // Find the working weight (first working set)
  var workingWeight = 0;
  wex.sets.forEach(function(s) { if (s.type === 'working' && s.weight > workingWeight) workingWeight = s.weight; });
  if (workingWeight <= 0) { alert('Set a working weight first'); return; }
  // Remove existing warmup sets
  wex.sets = wex.sets.filter(function(s){ return s.type !== 'warmup'; });
  // Generate warmup sets: 50%x8, 70%x5, 85%x3
  var warmups = [
    { pct:0.5, reps:8 },
    { pct:0.7, reps:5 },
    { pct:0.85, reps:3 }
  ];
  var step = S.units === 'kg' ? 2.5 : 5;
  var newSets = [];
  warmups.forEach(function(wu) {
    var w = Math.round((workingWeight * wu.pct) / step) * step;
    if (w < step) w = step;
    newSets.push({ weight:w, reps:wu.reps, type:'warmup', completed:false, rpe:null, timestamp:null });
  });
  wex.sets = newSets.concat(wex.sets);
  saveS(); draw();
}

function swapExercise(exIdx) {
  if (!S.activeWorkout) return;
  var wex = S.activeWorkout.exercises[exIdx];
  var curEx = findExercise(wex.exerciseId);
  if (!curEx || !curEx.substitutes || curEx.substitutes.length === 0) {
    alert('No substitutes available for this exercise');
    return;
  }
  var m = document.getElementById('modal-root');
  var mh = '<div class="modal-bg" onclick="if(event.target===this)closeModal()">';
  mh += '<div class="modal">';
  mh += '<div class="modal-hdr"><span style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700">Swap Exercise</span>';
  mh += '<button onclick="closeModal()" style="color:#555;font-size:20px">\u00D7</button></div>';
  mh += '<div style="font-size:11px;color:#555;margin-bottom:12px">Replace '+curEx.name+' with:</div>';
  getSubstitutes(curEx).forEach(function(sub) {
    var alt = findExercise(sub.exerciseId);
    if (!alt) return;
    var simColor = sub.similarity >= 85 ? '#38b000' : sub.similarity >= 70 ? '#ffd60a' : '#ff6b35';
    mh += '<div class="ex-row" onclick="doSwapExercise('+exIdx+',\''+sub.exerciseId+'\')">';
    mh += '<div style="text-align:center;width:30px"><div style="font-size:12px;font-weight:700;color:'+simColor+'">'+sub.similarity+'%</div></div>';
    mh += '<span style="font-size:16px">'+alt.icon+'</span>';
    mh += '<div style="flex:1"><div style="font-size:12px;color:#e0e0f0">'+alt.name+'</div>';
    if (sub.note) mh += '<div style="font-size:9px;color:#555">'+sub.note+'</div>';
    mh += '</div></div>';
  });
  mh += '</div></div>';
  m.innerHTML = mh;
}

function doSwapExercise(exIdx, newExerciseId) {
  if (!S.activeWorkout) return;
  var wex = S.activeWorkout.exercises[exIdx];
  wex.exerciseId = newExerciseId;
  // Keep same set structure but check for last performance
  var last = getLastPerformance(newExerciseId);
  wex.sets.forEach(function(s, i) {
    if (!s.completed && last && last.sets[i] && last.sets[i].completed) {
      s.weight = last.sets[i].weight;
      s.reps = last.sets[i].reps;
    }
  });
  closeModal(); saveS(); draw();
}

function openRPEPicker(exIdx, setIdx) {
  var rpeColors = ['','#38b000','#38b000','#ffd60a','#ffd60a','#ffd60a','#f77f00','#f77f00','#ff6b35','#ff6b35','#e63946'];
  var cur = S.activeWorkout && S.activeWorkout.exercises[exIdx] && S.activeWorkout.exercises[exIdx].sets[setIdx];
  var m = document.getElementById('modal-root');
  var mh = '<div class="modal-bg" onclick="if(event.target===this)closeModal()">';
  mh += '<div class="modal" style="max-width:280px">';
  mh += '<div class="modal-hdr"><span style="font-size:13px;font-weight:700">Rate of Perceived Exertion</span><button onclick="closeModal()" style="color:#555;font-size:20px">\u00D7</button></div>';
  mh += '<div style="font-size:10px;color:#555;margin-bottom:12px">How hard was that set? (1 = very easy, 10 = all-out)</div>';
  mh += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px">';
  for (var i = 1; i <= 10; i++) {
    var selected = cur && cur.rpe === i;
    mh += '<button onclick="setRPE('+exIdx+','+setIdx+','+i+')" style="padding:10px 4px;border-radius:8px;font-size:15px;font-weight:700;border:2px solid '+(selected?rpeColors[i]:'#222')+';background:'+(selected?rpeColors[i]+'22':'#111')+';color:'+rpeColors[i]+';cursor:pointer">'+i+'</button>';
  }
  mh += '</div>';
  if (cur && cur.rpe) {
    mh += '<button onclick="setRPE('+exIdx+','+setIdx+',null)" style="width:100%;font-size:10px;color:#444;background:transparent;border:1px solid #1a1a2e;border-radius:6px;padding:6px;cursor:pointer">Clear RPE</button>';
  }
  mh += '</div></div>';
  m.innerHTML = mh;
}

function setRPE(exIdx, setIdx, rpe) {
  if (!S.activeWorkout) return;
  S.activeWorkout.exercises[exIdx].sets[setIdx].rpe = rpe;
  closeModal(); saveS(); draw();
}

function finishWorkout() {
  if (!S.activeWorkout) return;
  var w = S.activeWorkout;
  w.endedAt = new Date().toISOString();
  w.duration = Date.now() - new Date(w.startedAt).getTime();

  // Check PRs
  var allPRs = [];
  w.exercises.forEach(function(wex) {
    var prs = checkAndUpdatePRs(wex.exerciseId, wex.sets);
    if (prs.length > 0) {
      var ex = findExercise(wex.exerciseId);
      allPRs.push({ name: ex ? ex.name : wex.exerciseId, prs: prs });
    }
  });

  S.workoutHistory.push(w);
  S.activeWorkout = null;
  stopRestTimer();
  saveS();

  // Show smart completion debrief
  var totalSets = w.exercises.reduce(function(sum,e){return sum+e.sets.filter(function(s){return s.completed;}).length;},0);
  var totalVolume = w.exercises.reduce(function(sum,e){return sum+e.sets.reduce(function(s2,s){return s2+(s.completed?s.weight*s.reps:0);},0);},0);

  var m = document.getElementById('modal-root');
  var mh = '<div class="modal-bg" onclick="if(event.target===this)closeModal()">';
  mh += '<div class="modal" style="text-align:center;max-height:85vh;overflow-y:auto">';
  mh += '<div style="font-size:40px;margin-bottom:8px">\uD83C\uDFC6</div>';
  mh += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:20px;font-weight:700;color:#f0f0ff;margin-bottom:4px">Workout Complete!</div>';
  mh += '<div style="font-size:11px;color:#555;margin-bottom:12px">'+fmtDuration(w.duration)+' \u2022 '+totalSets+' sets \u2022 '+totalVolume.toLocaleString()+' '+S.units+' volume</div>';

  // PRs
  if (allPRs.length > 0) {
    mh += '<div style="background:rgba(255,215,0,.07);border:1px solid rgba(255,215,0,.2);border-radius:10px;padding:12px;margin-bottom:10px;text-align:left">';
    mh += '<div style="font-size:9px;color:#ffd60a;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">\uD83C\uDF1F New Personal Records</div>';
    allPRs.forEach(function(p) {
      mh += '<div style="font-size:12px;color:#e0e0f0;font-weight:600;margin-bottom:2px">'+p.name+'</div>';
      p.prs.forEach(function(pr) {
        mh += '<div style="font-size:11px;color:#ffd60a;margin-bottom:4px">\u2022 '+pr+'</div>';
      });
    });
    mh += '</div>';
  }

  // Performance summary per exercise
  mh += '<div style="text-align:left;margin-bottom:10px">';
  mh += '<div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">\uD83D\uDCCA Performance</div>';
  w.exercises.forEach(function(wex) {
    var ex = findExercise(wex.exerciseId);
    if (!ex) return;
    var working = wex.sets.filter(function(s) { return s.type === 'working'; });
    var completed = working.filter(function(s) { return s.completed; });
    if (completed.length === 0) return;
    var allHit = completed.length === working.length;
    var rpes = completed.filter(function(s) { return s.rpe; }).map(function(s) { return s.rpe; });
    var avgRPE = rpes.length > 0 ? rpes.reduce(function(a,b){return a+b;},0) / rpes.length : 0;
    var firstReps = completed[0].reps, lastReps = completed[completed.length-1].reps;
    var repDrop = firstReps - lastReps;

    var status, statusColor, statusIcon;
    if (!allHit) { status = 'Incomplete'; statusColor = '#555'; statusIcon = '\u23ED'; }
    else if (avgRPE >= 9) { status = 'High effort'; statusColor = '#ff6b35'; statusIcon = '\uD83D\uDD25'; }
    else if (repDrop >= 2) { status = 'Rep drop (-' + repDrop + ')'; statusColor = '#ffd60a'; statusIcon = '\u26A0\uFE0F'; }
    else { status = 'On target'; statusColor = '#38b000'; statusIcon = '\u2705'; }

    mh += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #111">';
    mh += '<span style="font-size:12px">' + ex.icon + '</span>';
    mh += '<div style="flex:1"><div style="font-size:11px;color:#e0e0f0">' + ex.name + '</div>';
    mh += '<div style="font-size:9px;color:#555">' + completed.length + '/' + working.length + ' sets \u2022 ' + completed[0].weight + S.units;
    if (avgRPE > 0) mh += ' \u2022 RPE ' + (Math.round(avgRPE*10)/10);
    mh += '</div></div>';
    mh += '<span style="font-size:9px;color:' + statusColor + ';font-weight:600">' + statusIcon + ' ' + status + '</span>';
    mh += '</div>';
  });
  mh += '</div>';

  // Muscles hit
  var musclesHit = {};
  w.exercises.forEach(function(wex) {
    var ex = findExercise(wex.exerciseId);
    if (!ex) return;
    var completedSets = wex.sets.filter(function(s) { return s.completed && s.type === 'working'; }).length;
    if (completedSets === 0) return;
    ex.musclesPrimary.forEach(function(m) {
      if (!musclesHit[m.muscle]) musclesHit[m.muscle] = 0;
      musclesHit[m.muscle] += completedSets;
    });
  });
  var muscleKeys = Object.keys(musclesHit);
  if (muscleKeys.length > 0) {
    mh += '<div style="text-align:left;margin-bottom:10px">';
    mh += '<div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">\uD83D\uDCAA Muscles Trained (' + muscleKeys.length + ')</div>';
    mh += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
    muscleKeys.forEach(function(mid) {
      var mg = MUSCLE_GROUPS[mid];
      if (!mg) return;
      mh += '<span style="font-size:9px;padding:3px 8px;border-radius:6px;background:' + mg.color + '18;color:' + mg.color + ';border:1px solid ' + mg.color + '33">' + mg.name + ' (' + musclesHit[mid] + ')</span>';
    });
    mh += '</div></div>';
  }

  // Recovery forecast
  mh += '<div style="text-align:left;margin-bottom:10px">';
  mh += '<div style="font-size:9px;color:#555;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">\u23F0 Recovery Forecast</div>';
  muscleKeys.sort(function(a,b) {
    var ha = MUSCLE_GROUPS[a] ? MUSCLE_GROUPS[a].recoveryHours : 48;
    var hb = MUSCLE_GROUPS[b] ? MUSCLE_GROUPS[b].recoveryHours : 48;
    return hb - ha;
  });
  muscleKeys.slice(0, 6).forEach(function(mid) {
    var mg = MUSCLE_GROUPS[mid];
    if (!mg) return;
    var recDate = new Date(Date.now() + mg.recoveryHours * 3600000);
    var dayName = DAY_NAMES[recDate.getDay()];
    var timeStr = recDate.toLocaleTimeString('en-US', { hour:'numeric', hour12:true });
    mh += '<div style="display:flex;justify-content:space-between;font-size:10px;padding:2px 0">';
    mh += '<span style="color:#888">' + mg.name + '</span>';
    mh += '<span style="color:' + mg.color + '">' + dayName + ' ~' + timeStr + ' (' + mg.recoveryHours + 'h)</span>';
    mh += '</div>';
  });
  mh += '</div>';

  // Next session preview
  var todayIdx = new Date().getDay();
  var nextTemplate = null, nextDaysAway = Infinity;
  S.templates.forEach(function(t) {
    if (!t.scheduledDays) return;
    DAY_KEYS.forEach(function(dk, di) {
      if (!t.scheduledDays[dk]) return;
      var daysUntil = (di - todayIdx + 7) % 7;
      if (daysUntil === 0) daysUntil = 7;
      if (daysUntil < nextDaysAway) { nextDaysAway = daysUntil; nextTemplate = t; }
    });
  });
  if (nextTemplate) {
    mh += '<div style="background:rgba(0,180,216,.05);border:1px solid rgba(0,180,216,.15);border-radius:8px;padding:10px;margin-bottom:10px;text-align:left">';
    mh += '<div style="font-size:9px;color:#00b4d8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">\uD83D\uDCC5 Next Session — '+DAY_NAMES[(todayIdx+nextDaysAway)%7]+'</div>';
    mh += '<div style="font-size:12px;color:#e0e0f0;font-weight:600">'+nextTemplate.icon+' '+nextTemplate.name+'</div>';
    // Weight predictions for next session exercises
    var predictions = [];
    nextTemplate.exercises.slice(0, 4).forEach(function(te) {
      var ex = findExercise(te.exerciseId);
      if (!ex) return;
      var smart = getSmartWeight(te.exerciseId, 0, te.repTarget || 8);
      var reasonLabels = {progress:'\u2191', deload:'\u2193\u2193', high_soreness:'\u2193', low_recovery:'\u2193', rpe_overload:'\u2193', same:'\u2192'};
      var arrow = reasonLabels[smart.reason] || '\u2192';
      predictions.push(ex.name + ': ' + smart.weight + S.units + ' ' + arrow);
    });
    if (predictions.length > 0) {
      mh += '<div style="font-size:9px;color:#666;margin-top:6px">';
      predictions.forEach(function(p) { mh += '<div style="padding:1px 0">' + p + '</div>'; });
      if (nextTemplate.exercises.length > 4) mh += '<div style="color:#444">+' + (nextTemplate.exercises.length - 4) + ' more</div>';
      mh += '</div>';
    }
    mh += '</div>';
  }

  // Soreness reminder
  mh += '<div style="background:rgba(157,78,221,.05);border:1px solid rgba(157,78,221,.15);border-radius:8px;padding:8px;margin-bottom:12px;text-align:left">';
  mh += '<div style="font-size:10px;color:#9d4edd">\uD83D\uDCDD Log how you feel in 24-48 hours</div>';
  mh += '<div style="font-size:9px;color:#555;margin-top:2px">Soreness data helps adjust your next workout. Check the History tab tomorrow.</div>';
  mh += '</div>';

  mh += '<button class="btn-pri" onclick="closeModal();draw()">Done</button>';
  mh += '</div></div>';
  m.innerHTML = mh;
}

function setWorkoutNotes(val) {
  if (!S.activeWorkout) return;
  S.activeWorkout.notes = val;
  saveS();
}

function cancelWorkout() {
  if (!confirm('Cancel this workout? Progress will be lost.')) return;
  S.activeWorkout = null;
  stopRestTimer();
  saveS(); draw();
}

// ─── ADD EXERCISE MODAL ──────────────────────────────────────
function openAddExerciseModal() {
  _modalFilterEquip = '';
  _modalFilterMuscle = '';
  var m = document.getElementById('modal-root');
  var exCount = S.activeWorkout ? S.activeWorkout.exercises.length : 0;
  var mh = '<div class="modal-bg" onclick="if(event.target===this)closeModal()">';
  mh += '<div class="modal" style="max-height:85vh;display:flex;flex-direction:column">';
  mh += '<div class="modal-hdr"><span style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700">Add Exercise';
  if (exCount > 0) mh += ' <span style="font-size:11px;color:#555;font-weight:400">('+exCount+' in workout)</span>';
  mh += '</span>';
  mh += '<button onclick="closeModal()" style="color:#555;font-size:20px">\u00D7</button></div>';
  mh += '<input type="search" id="ex-search" placeholder="Search exercises..." oninput="updateExerciseSearch()" style="margin-bottom:8px;flex-shrink:0">';
  mh += '<div id="add-ex-modal-body" style="overflow-y:auto;flex:1">';
  mh += renderAddExerciseModalBody();
  mh += '</div>';
  mh += '<button onclick="closeModal()" style="width:100%;padding:8px;border-radius:6px;border:1px solid #2a2a2e;color:#666;font-size:11px;cursor:pointer;background:#111;margin-top:8px;flex-shrink:0">Done</button>';
  mh += '</div></div>';
  m.innerHTML = mh;
  setTimeout(function(){var el=document.getElementById('ex-search');if(el)el.focus();},100);
}

var _searchTimeout = null;
function updateExerciseSearch() {
  if (_searchTimeout) clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(function() {
    _refreshModalBody();
  }, 300);
}

function updateAddExerciseModal() {
  _refreshModalBody();
}

function _refreshModalBody() {
  var el = document.getElementById('add-ex-modal-body');
  if (!el) return;
  var searchEl = document.getElementById('ex-search');
  var hadFocus = searchEl && document.activeElement === searchEl;
  var cursorPos = searchEl ? searchEl.selectionStart : 0;
  var scrollTop = el.scrollTop;
  el.innerHTML = renderAddExerciseModalBody();
  el.scrollTop = scrollTop;
  if (hadFocus && searchEl) {
    // Defer focus restore to next frame so DOM settles first
    requestAnimationFrame(function() {
      searchEl.focus({ preventScroll: true });
      try { searchEl.setSelectionRange(cursorPos, cursorPos); } catch(e) {}
    });
  }
}

function renderAddExerciseModalBody() {
  var h = '';
  var searchEl = document.getElementById('ex-search');
  var query = searchEl ? searchEl.value : '';

  // Equipment filter chips
  var equipTypes = ['barbell','dumbbell','cable','machine','bodyweight'];
  h += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">';
  h += '<span onclick="_modalFilterEquip=\'\';updateAddExerciseModal()" style="font-size:9px;padding:3px 8px;border-radius:10px;cursor:pointer;border:1px solid '+(!_modalFilterEquip?'#4cc9f0':'#1a1a2e')+';color:'+(!_modalFilterEquip?'#4cc9f0':'#555')+';background:'+(!_modalFilterEquip?'#4cc9f011':'transparent')+'">All</span>';
  equipTypes.forEach(function(eq) {
    var active = _modalFilterEquip === eq;
    h += '<span onclick="_modalFilterEquip=\''+eq+'\';updateAddExerciseModal()" style="font-size:9px;padding:3px 8px;border-radius:10px;cursor:pointer;border:1px solid '+(active?'#4cc9f0':'#1a1a2e')+';color:'+(active?'#4cc9f0':'#555')+';background:'+(active?'#4cc9f011':'transparent')+'">'+eq.charAt(0).toUpperCase()+eq.slice(1)+'</span>';
  });
  h += '</div>';

  // Muscle filter chips
  var muscleFilters = [
    {id:'chest_mid',label:'Chest'},{id:'chest_upper',label:'Upper Chest'},{id:'chest_lower',label:'Lower Chest'},
    {id:'back_lats',label:'Lats'},{id:'back_upper',label:'Upper Back'},{id:'back_traps',label:'Traps'},{id:'back_erector',label:'Erectors'},
    {id:'front_delts',label:'Front Delts'},{id:'side_delts',label:'Side Delts'},{id:'rear_delts',label:'Rear Delts'},
    {id:'biceps',label:'Biceps'},{id:'triceps',label:'Triceps'},
    {id:'quads',label:'Quads'},{id:'hamstrings',label:'Hams'},{id:'glutes',label:'Glutes'},{id:'calves',label:'Calves'},
    {id:'core',label:'Core'},{id:'forearms',label:'Forearms'}
  ];
  h += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">';
  h += '<span onclick="_modalFilterMuscle=\'\';updateAddExerciseModal()" style="font-size:9px;padding:3px 8px;border-radius:10px;cursor:pointer;border:1px solid '+(!_modalFilterMuscle?'#00b4d8':'#1a1a2e')+';color:'+(!_modalFilterMuscle?'#00b4d8':'#555')+';background:'+(!_modalFilterMuscle?'#00b4d811':'transparent')+'">All</span>';
  muscleFilters.forEach(function(mf) {
    var active = _modalFilterMuscle === mf.id;
    h += '<span onclick="_modalFilterMuscle=\''+mf.id+'\';updateAddExerciseModal()" style="font-size:9px;padding:3px 8px;border-radius:10px;cursor:pointer;border:1px solid '+(active?'#00b4d8':'#1a1a2e')+';color:'+(active?'#00b4d8':'#555')+';background:'+(active?'#00b4d811':'transparent')+'">'+mf.label+'</span>';
  });
  h += '</div>';

  // Filter exercises
  var inWorkout = {};
  if (S.activeWorkout) S.activeWorkout.exercises.forEach(function(wex) { inWorkout[wex.exerciseId] = true; });

  var filtered = searchExercises(query).filter(function(ex) {
    if (inWorkout[ex.id]) return false;
    if (_modalFilterEquip && ex.equipment !== _modalFilterEquip) return false;
    if (_modalFilterMuscle) {
      var hitsMuscle = ex.musclesPrimary.some(function(m){ return m.muscle === _modalFilterMuscle; }) ||
                       ex.musclesSecondary.some(function(m){ return m.muscle === _modalFilterMuscle; });
      if (!hitsMuscle) return false;
    }
    return true;
  });

  // Recommended section (when not searching and workout has exercises or type set)
  if (!query && !_modalFilterEquip && !_modalFilterMuscle && S.activeWorkout && (S.activeWorkout.exercises.length > 0 || S.activeWorkout.workoutType)) {
    var recs = getRecommendedExercises(6);
    if (recs.length > 0) {
      h += '<div style="font-size:9px;color:#ffd60a;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #1a1a2e">\u2728 Recommended</div>';
      recs.forEach(function(rec) {
        h += renderExerciseRowEnhanced(rec.exercise, rec.reasons);
      });
    }
  }

  // Recently Used section
  if (!query && !_modalFilterEquip && !_modalFilterMuscle) {
    var recent = getRecentlyUsedExercises(5);
    if (recent.length > 0) {
      h += '<div style="font-size:9px;color:#555;letter-spacing:1.5px;text-transform:uppercase;margin:8px 0 6px;padding-bottom:4px;border-bottom:1px solid #1a1a2e">\uD83D\uDD52 Recently Used</div>';
      recent.forEach(function(ex) {
        h += renderExerciseRowEnhanced(ex, null);
      });
    }
  }

  // All exercises section
  h += '<div style="font-size:9px;color:#555;letter-spacing:1.5px;text-transform:uppercase;margin:8px 0 6px;padding-bottom:4px;border-bottom:1px solid #1a1a2e">';
  h += (query || _modalFilterEquip || _modalFilterMuscle ? '\uD83D\uDD0D Results' : 'All Exercises') + ' <span style="color:#333">(' + filtered.length + ')</span></div>';
  filtered.forEach(function(ex) {
    h += renderExerciseRowEnhanced(ex, null);
  });
  if (filtered.length === 0) h += '<div style="text-align:center;color:#333;font-size:11px;padding:20px 0">No exercises match filters</div>';

  return h;
}

function renderExerciseRowEnhanced(ex, reasons) {
  var muscles = ex.musclesPrimary.map(function(m){return MUSCLE_GROUPS[m.muscle]?MUSCLE_GROUPS[m.muscle].name:'';}).join(', ');
  var h = '<div class="ex-row" style="position:relative">';
  // Main click area — adds exercise
  h += '<div onclick="addExerciseToWorkoutKeepOpen(\''+ex.id+'\')" style="display:flex;align-items:center;gap:8px;flex:1;cursor:pointer">';
  h += '<span style="font-size:16px">'+ex.icon+'</span>';
  h += '<div style="flex:1"><div style="font-size:12px;color:#e0e0f0">'+ex.name+'</div>';
  h += '<div style="font-size:9px;color:#555">'+muscles+' \u2022 '+ex.equipment+'</div>';
  // Reason badges
  if (reasons && reasons.length > 0) {
    h += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:3px">';
    reasons.forEach(function(r) {
      var color = r.indexOf('Pairs') >= 0 ? '#38b000' : r.indexOf('Complement') >= 0 ? '#4cc9f0' : r.indexOf('Superset') >= 0 ? '#9d4edd' : r.indexOf('Fills') >= 0 ? '#ffd60a' : r.indexOf('Balance') >= 0 ? '#00b4d8' : '#555';
      h += '<span style="font-size:8px;padding:1px 5px;border-radius:4px;background:'+color+'18;color:'+color+';border:1px solid '+color+'33">'+r+'</span>';
    });
    h += '</div>';
  }
  h += '</div></div>';
  // Info button — navigates to exercise detail
  h += '<div onclick="event.stopPropagation();navigateToExerciseDetail(\''+ex.id+'\')" style="padding:6px 8px;cursor:pointer;color:#555;font-size:14px" title="View details">\u24D8</div>';
  h += '</div>';
  return h;
}

function addExerciseToWorkoutKeepOpen(exerciseId) {
  if (!S.activeWorkout) return;
  var ex = findExercise(exerciseId);
  var defaultRest = S.defaultRestSeconds;
  if (ex) {
    var rr = getRepRange(ex, S.selectedGoal);
    if (rr) defaultRest = rr.rest;
  }
  var sets = [];
  for (var i = 0; i < 3; i++) {
    var smart = getSmartWeight(exerciseId, i, 8);
    sets.push({ weight:smart.weight, reps:smart.reps, type:'working', completed:false, rpe:null, timestamp:null, suggestion:smart.reason });
  }
  S.activeWorkout.exercises.push({ exerciseId:exerciseId, sets:sets, restSeconds:defaultRest, notes:'' });
  saveS();
  showToast((ex ? ex.icon + ' ' + ex.name : 'Exercise') + ' added');
  // Update modal header count
  var hdr = document.querySelector('.modal-hdr span');
  if (hdr) {
    var count = S.activeWorkout.exercises.length;
    hdr.innerHTML = 'Add Exercise <span style="font-size:11px;color:#555;font-weight:400">(' + count + ' in workout)</span>';
  }
  updateAddExerciseModal();
}

// Keep original for swap modal and template flow
function renderExerciseList(exercises) {
  var h = '';
  exercises.forEach(function(ex) {
    var muscles = ex.musclesPrimary.map(function(m){return MUSCLE_GROUPS[m.muscle]?MUSCLE_GROUPS[m.muscle].name:'';}).join(', ');
    h += '<div class="ex-row" onclick="addExerciseToWorkout(\''+ex.id+'\')">';
    h += '<span style="font-size:16px">'+ex.icon+'</span>';
    h += '<div style="flex:1"><div style="font-size:12px;color:#e0e0f0">'+ex.name+'</div>';
    h += '<div style="font-size:9px;color:#555">'+muscles+' \u2022 '+ex.equipment+'</div></div>';
    h += '<span style="color:#333;font-size:14px">\u203A</span></div>';
  });
  if (exercises.length === 0) h += '<div class="empty"><div class="empty-icon">\uD83D\uDD0D</div>No exercises found</div>';
  return h;
}

// ─── EXERCISE RECOMMENDATION ENGINE ─────────────────────────

var PATTERN_BUCKETS = {
  push: ['horizontal_push','incline_push','vertical_push','horizontal_adduction','elbow_extension'],
  pull: ['horizontal_pull','vertical_pull','elbow_flexion','scapular_elevation'],
  legs: ['squat','hip_hinge','hip_extension','knee_extension','knee_flexion','ankle_plantar_flexion'],
  core: ['spinal_flexion','anti_extension','lateral_raise']
};

function getPatternBucket(pattern) {
  for (var k in PATTERN_BUCKETS) {
    if (PATTERN_BUCKETS[k].indexOf(pattern) >= 0) return k;
  }
  return 'other';
}

// ─── WORKOUT TYPES ──────────────────────────────────────────
var WORKOUT_TYPES = {
  push: {
    label:'Push', icon:'\uD83D\uDCAA', color:'#4cc9f0',
    muscles:['chest_mid','chest_upper','chest_lower','front_delts','side_delts','triceps'],
    patterns:['push']
  },
  pull: {
    label:'Pull', icon:'\uD83E\uDDBE', color:'#38b000',
    muscles:['back_lats','back_upper','back_traps','rear_delts','biceps','forearms'],
    patterns:['pull']
  },
  legs: {
    label:'Legs', icon:'\uD83E\uDDB5', color:'#f77f00',
    muscles:['quads','hamstrings','glutes','calves'],
    patterns:['legs']
  },
  upper: {
    label:'Upper', icon:'\uD83C\uDFCB\uFE0F', color:'#9d4edd',
    muscles:['chest_mid','chest_upper','chest_lower','back_lats','back_upper','back_traps','front_delts','side_delts','rear_delts','biceps','triceps','forearms'],
    patterns:['push','pull']
  },
  lower: {
    label:'Lower', icon:'\uD83C\uDFC3', color:'#e63946',
    muscles:['quads','hamstrings','glutes','calves','core'],
    patterns:['legs','core']
  },
  full: {
    label:'Full Body', icon:'\u26A1', color:'#ffd60a',
    muscles:null,
    patterns:null
  }
};

function getRecommendedExercises(limit) {
  limit = limit || 6;
  if (!S.activeWorkout) return [];
  var workoutType = S.activeWorkout.workoutType;
  if (S.activeWorkout.exercises.length === 0 && !workoutType) return [];

  var inWorkout = {};
  S.activeWorkout.exercises.forEach(function(wex) { inWorkout[wex.exerciseId] = true; });

  var scores = {}; // exerciseId -> { score, reasons[] }

  // Pass 0: Workout type matching
  if (workoutType && WORKOUT_TYPES[workoutType]) {
    var wt = WORKOUT_TYPES[workoutType];
    var isEmptyWorkout = S.activeWorkout.exercises.length === 0;
    EXERCISE_DB.forEach(function(ex) {
      if (inWorkout[ex.id]) return;
      var typeScore = 0;
      var reasons = [];
      // Muscle match
      if (wt.muscles) {
        var matchCount = 0;
        ex.musclesPrimary.forEach(function(m) {
          if (wt.muscles.indexOf(m.muscle) >= 0) matchCount++;
        });
        if (matchCount > 0) {
          typeScore += matchCount * 5;
          reasons.push(wt.label + ' day target');
        }
      } else {
        typeScore += 2; // Full body: slight boost for everything
        reasons.push('Full Body');
      }
      // Pattern match
      if (wt.patterns) {
        var bucket = getPatternBucket(ex.movementPattern);
        if (wt.patterns.indexOf(bucket) >= 0) typeScore += 3;
      }
      // Compound priority for empty workouts
      if (isEmptyWorkout && ex.category === 'compound') {
        typeScore += 4;
        reasons.push('Great starter');
      }
      if (typeScore > 0) {
        if (!scores[ex.id]) scores[ex.id] = { score:0, reasons:[] };
        scores[ex.id].score += typeScore;
        scores[ex.id].reasons = scores[ex.id].reasons.concat(reasons);
      }
    });
    if (isEmptyWorkout) limit = Math.max(limit, 10);
  }

  // Pass 1: Synergy scoring
  S.activeWorkout.exercises.forEach(function(wex) {
    var ex = findExercise(wex.exerciseId);
    if (!ex) return;
    getSynergies(ex).forEach(function(syn) {
      if (inWorkout[syn.exerciseId]) return;
      if (!scores[syn.exerciseId]) scores[syn.exerciseId] = { score:0, reasons:[] };
      var pts = syn.type === 'antagonist' ? 4 : syn.type === 'complement' ? 3 : 2;
      var label = syn.type === 'antagonist' ? 'Pairs with ' : syn.type === 'complement' ? 'Complements ' : 'Superset with ';
      scores[syn.exerciseId].score += pts;
      scores[syn.exerciseId].reasons.push(label + ex.name);
    });
  });

  // Pass 2: Muscle gap filling
  var coveredMuscles = {};
  S.activeWorkout.exercises.forEach(function(wex) {
    var ex = findExercise(wex.exerciseId);
    if (!ex) return;
    ex.musclesPrimary.forEach(function(m) { coveredMuscles[m.muscle] = true; });
    ex.musclesSecondary.forEach(function(m) { coveredMuscles[m.muscle] = true; });
  });
  var majorMuscles = ['chest_mid','back_lats','back_upper','quads','hamstrings','glutes','front_delts','side_delts','rear_delts','biceps','triceps','core'];
  var uncovered = majorMuscles.filter(function(m) { return !coveredMuscles[m]; });

  if (uncovered.length > 0) {
    EXERCISE_DB.forEach(function(ex) {
      if (inWorkout[ex.id]) return;
      var fills = [];
      ex.musclesPrimary.forEach(function(m) {
        if (uncovered.indexOf(m.muscle) >= 0) {
          var mg = MUSCLE_GROUPS[m.muscle];
          fills.push(mg ? mg.name : m.muscle);
        }
      });
      if (fills.length > 0) {
        if (!scores[ex.id]) scores[ex.id] = { score:0, reasons:[] };
        scores[ex.id].score += fills.length * 3;
        scores[ex.id].reasons.push('Fills gap: ' + fills.join(', '));
      }
    });
  }

  // Pass 3: Movement pattern balance
  var bucketCounts = { push:0, pull:0, legs:0, core:0 };
  S.activeWorkout.exercises.forEach(function(wex) {
    var ex = findExercise(wex.exerciseId);
    if (!ex) return;
    var bucket = getPatternBucket(ex.movementPattern);
    if (bucketCounts[bucket] !== undefined) bucketCounts[bucket]++;
  });
  var maxBucket = Math.max(bucketCounts.push, bucketCounts.pull, bucketCounts.legs, bucketCounts.core);
  if (maxBucket > 0) {
    var weakBuckets = [];
    for (var b in bucketCounts) {
      if (bucketCounts[b] < maxBucket * 0.5) weakBuckets.push(b);
    }
    if (weakBuckets.length > 0) {
      EXERCISE_DB.forEach(function(ex) {
        if (inWorkout[ex.id]) return;
        var bucket = getPatternBucket(ex.movementPattern);
        if (weakBuckets.indexOf(bucket) >= 0) {
          if (!scores[ex.id]) scores[ex.id] = { score:0, reasons:[] };
          scores[ex.id].score += 2;
          var label = bucket.charAt(0).toUpperCase() + bucket.slice(1);
          if (scores[ex.id].reasons.indexOf('Balance: add ' + label) < 0) {
            scores[ex.id].reasons.push('Balance: add ' + label);
          }
        }
      });
    }
  }

  // Pass 4: Recovery penalty — penalize exercises targeting fatigued muscles
  EXERCISE_DB.forEach(function(ex) {
    if (inWorkout[ex.id] || !scores[ex.id]) return;
    var maxFatigue = 0;
    var fatiguedName = '';
    ex.musclesPrimary.forEach(function(m) {
      var rec = getMuscleRecovery(m.muscle);
      if (rec.pct < 50) {
        var fatigue = 100 - rec.pct;
        if (fatigue > maxFatigue) {
          maxFatigue = fatigue;
          var mg = MUSCLE_GROUPS[m.muscle];
          fatiguedName = mg ? mg.name : m.muscle;
        }
      }
    });
    if (maxFatigue > 0) {
      scores[ex.id].score -= Math.round(maxFatigue / 20); // -1 to -5 penalty
      scores[ex.id].reasons.push(fatiguedName + ' recovering');
    }
  });

  // Sort and return top results
  var results = [];
  Object.keys(scores).forEach(function(exId) {
    var ex = findExercise(exId);
    if (ex) results.push({ exercise:ex, score:scores[exId].score, reasons:scores[exId].reasons });
  });
  results.sort(function(a, b) { return b.score - a.score; });
  return results.slice(0, limit);
}

function getRecentlyUsedExercises(limit) {
  limit = limit || 5;
  if (S.workoutHistory.length === 0) return [];
  var inWorkout = {};
  if (S.activeWorkout) S.activeWorkout.exercises.forEach(function(wex) { inWorkout[wex.exerciseId] = true; });
  var seen = {}, results = [];
  for (var i = S.workoutHistory.length - 1; i >= 0 && results.length < limit; i--) {
    S.workoutHistory[i].exercises.forEach(function(wex) {
      if (seen[wex.exerciseId] || inWorkout[wex.exerciseId]) return;
      seen[wex.exerciseId] = true;
      var ex = findExercise(wex.exerciseId);
      if (ex && results.length < limit) results.push(ex);
    });
  }
  return results;
}

// ════════════════════════════════════════════════════════════════
//  HISTORY TAB
// ════════════════════════════════════════════════════════════════

function renderHistory() {
  var h = '<div class="sec sIn">';
  if (S.workoutHistory.length === 0) {
    h += '<div class="empty"><div class="empty-icon">\uD83D\uDCCA</div>No workouts yet.<br>Complete your first workout to see it here.</div>';
    h += '</div>';
    return h;
  }

  // Show newest first
  var sorted = S.workoutHistory.slice().reverse();
  sorted.forEach(function(w, idx) {
    var realIdx = S.workoutHistory.length - 1 - idx;
    var totalSets = w.exercises.reduce(function(s,e){return s+e.sets.filter(function(ss){return ss.completed;}).length;},0);
    var totalVolume = w.exercises.reduce(function(s,e){return s+e.sets.reduce(function(s2,ss){return s2+(ss.completed?ss.weight*ss.reps:0);},0);},0);
    var open = S.expanded === 'h_'+realIdx;

    h += '<div style="margin-bottom:'+(open?'0':'8px')+'">';
    h += '<div class="card" onclick="toggleHistory('+realIdx+')">';
    h += '<div style="display:flex;align-items:center;gap:10px">';
    h += '<div style="flex:1">';
    h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:14px;font-weight:600;color:#e0e0f0">'+(w.name||'Workout')+'</div>';
    h += '<div style="font-size:10px;color:#555;margin-top:2px">'+fmtDateFull(w.startedAt)+' \u2022 '+fmtDuration(w.duration||0)+' \u2022 '+totalSets+' sets \u2022 '+totalVolume.toLocaleString()+' '+S.units+'</div>';
    h += '</div>';
    h += '<span style="color:#333;font-size:14px;'+(open?'transform:rotate(90deg);':'')+'transition:transform .2s">\u203A</span></div></div>';

    if (open) {
      h += '<div class="panel">';
      if (w.notes) h += '<div style="font-size:10px;color:#666;background:#0a0a14;border-radius:6px;padding:6px 8px;margin-bottom:8px;font-style:italic">\uD83D\uDCDD '+w.notes+'</div>';
      w.exercises.forEach(function(wex) {
        var ex = findExercise(wex.exerciseId);
        h += '<div style="margin-bottom:10px">';
        h += '<div style="font-size:12px;color:'+(ex?ex.color:'#ccc')+';font-weight:600;margin-bottom:4px">'+(ex?ex.icon+' '+ex.name:wex.exerciseId)+'</div>';
        if (wex.notes) h += '<div style="font-size:9px;color:#555;margin-bottom:3px;font-style:italic">'+wex.notes+'</div>';
        wex.sets.forEach(function(set,si) {
          if (!set.completed) return;
          h += '<div style="font-size:11px;color:#888;padding:2px 0">Set '+(si+1)+': '+set.weight+' '+S.units+' \u00D7 '+set.reps;
          if (set.rpe) h += ' <span style="color:#ffd60a;font-size:9px">@'+set.rpe+'</span>';
          if (set.type !== 'working') h += ' <span style="color:#555;font-size:9px">('+set.type+')</span>';
          h += '</div>';
        });
        h += '</div>';
      });
      // Soreness check-in
      var sore = S.sorenessLog[w.id];
      h += '<div style="border-top:1px solid #111;margin-top:8px;padding-top:8px">';
      h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Soreness Check-in</div>';
      if (sore) {
        var soreColors = ['','#38b000','#38b000','#ffd60a','#ff6b35','#e63946'];
        var soreLabels = ['','None','Mild','Moderate','Heavy','Severe'];
        h += '<div style="font-size:11px;color:'+soreColors[sore.level]+'">'+soreLabels[sore.level]+' ('+sore.level+'/5)';
        if (sore.date) h += ' \u2022 '+fmtDate(sore.date);
        h += '</div>';
        if (sore.notes) h += '<div style="font-size:10px;color:#555;margin-top:2px">'+sore.notes+'</div>';
        h += '<button onclick="clearSoreness(\''+w.id+'\')" style="font-size:9px;color:#444;background:transparent;border:1px solid #1a1a2e;border-radius:4px;padding:3px 8px;cursor:pointer;margin-top:4px">Clear</button>';
      } else {
        h += '<div style="display:flex;gap:4px">';
        for (var sl = 1; sl <= 5; sl++) {
          var slColors = ['','#38b000','#38b000','#ffd60a','#ff6b35','#e63946'];
          var slLabels = ['','None','Mild','Mod','Heavy','Severe'];
          h += '<button onclick="logSoreness(\''+w.id+'\','+sl+')" style="flex:1;padding:6px 2px;border-radius:6px;font-size:8px;font-weight:600;border:1px solid '+slColors[sl]+';background:'+slColors[sl]+'11;color:'+slColors[sl]+';cursor:pointer">'+sl+'<br>'+slLabels[sl]+'</button>';
        }
        h += '</div>';
      }
      h += '</div>';
      h += '<div style="display:flex;gap:6px;margin-top:8px">';
      h += '<button onclick="repeatWorkout('+realIdx+')" style="flex:1;font-size:10px;color:#00b4d8;background:rgba(0,180,216,.1);border:1px solid rgba(0,180,216,.2);border-radius:6px;padding:6px 10px;cursor:pointer">\uD83D\uDD01 Repeat Workout</button>';
      h += '<button onclick="deleteWorkout('+realIdx+')" style="font-size:10px;color:#ff4444;background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.2);border-radius:6px;padding:6px 10px;cursor:pointer">Delete</button>';
      h += '</div>';
      h += '</div>';
    }
    h += '</div>';
  });

  h += '</div>';
  return h;
}

function toggleHistory(idx) { S.expanded = S.expanded === 'h_'+idx ? null : 'h_'+idx; draw(); }

function deleteWorkout(idx) {
  if (!confirm('Delete this workout from history?')) return;
  var wId = S.workoutHistory[idx].id;
  delete S.sorenessLog[wId];
  S.workoutHistory.splice(idx, 1);
  S.expanded = null;
  saveS(); draw();
}

function logSoreness(workoutId, level) {
  S.sorenessLog[workoutId] = { level:level, date:TODAY, notes:'' };
  saveS(); draw();
}

function repeatWorkout(idx) {
  if (S.activeWorkout) {
    if (!confirm('You have an active workout. Cancel it and start this one?')) return;
    stopRestTimer();
  }
  var past = S.workoutHistory[idx];
  var exercises = past.exercises.map(function(wex) {
    return {
      exerciseId: wex.exerciseId,
      sets: wex.sets.map(function(s) {
        return { weight:s.weight, reps:s.reps, type:s.type, completed:false, rpe:null, timestamp:null };
      }),
      restSeconds: wex.restSeconds || S.defaultRestSeconds,
      notes: ''
    };
  });
  S.activeWorkout = {
    id: genId(),
    templateId: past.templateId || null,
    name: past.name || 'Workout',
    startedAt: new Date().toISOString(),
    exercises: exercises,
    notes: ''
  };
  S.subTab = 'workout';
  S.expanded = null;
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  var el = document.getElementById('t-workout');
  if (el) el.classList.add('active');
  saveS(); draw();
}

function clearSoreness(workoutId) {
  delete S.sorenessLog[workoutId];
  saveS(); draw();
}

// Get most recent soreness for a muscle group
function getRecentSoreness(muscleId) {
  var recent = null;
  for (var i = S.workoutHistory.length - 1; i >= 0; i--) {
    var w = S.workoutHistory[i];
    var sore = S.sorenessLog[w.id];
    if (!sore) continue;
    var hitsMuscle = w.exercises.some(function(wex) {
      var ex = findExercise(wex.exerciseId);
      if (!ex) return false;
      return ex.musclesPrimary.some(function(m){return m.muscle===muscleId;});
    });
    if (hitsMuscle) { recent = sore; break; }
  }
  return recent;
}

// ════════════════════════════════════════════════════════════════
//  EXERCISES TAB (Library / Encyclopedia)
// ════════════════════════════════════════════════════════════════

function renderExercises() {
  var h = '<div class="sec sIn">';

  // Search — does NOT call draw(), uses targeted update instead
  h += '<input type="search" id="lib-search" placeholder="Search exercises..." value="'+(S.searchQuery||'')+'" oninput="S.searchQuery=this.value;debouncedExerciseSearch()">';

  // Filter chips (wrapped for targeted re-render)
  h += '<div id="ex-filter-chips">';
  h += renderExerciseFilterChips();
  h += '</div>';

  // Results container (only this part re-renders on search/filter)
  h += '<div id="ex-list-results">';
  h += renderExerciseResultsHTML();
  h += '</div>';

  h += '</div>';
  return h;
}

function renderExerciseFilterChips() {
  var h = '';
  // Muscle group chips
  h += '<div style="margin-bottom:8px;line-height:2">';
  h += '<span class="chip'+(S.filterMuscle===''?' on':'')+'" onclick="S.filterMuscle=\'\';updateExerciseFiltersAndResults()">All Muscles</span>';
  Object.keys(MUSCLE_GROUPS).forEach(function(mid) {
    var mg = MUSCLE_GROUPS[mid];
    h += '<span class="chip'+(S.filterMuscle===mid?' on':'')+'" onclick="S.filterMuscle=\''+mid+'\';updateExerciseFiltersAndResults()" style="'+(S.filterMuscle===mid?'background:rgba('+rgb(mg.color)+',.15);border-color:'+mg.color+';color:'+mg.color:'')+'">'+mg.name+'</span>';
  });
  h += '</div>';
  // Equipment chips
  h += '<div style="margin-bottom:10px;line-height:2">';
  var equips = ['barbell','dumbbell','cable','machine','bodyweight'];
  h += '<span class="chip'+(S.filterEquip===''?' on':'')+'" onclick="S.filterEquip=\'\';updateExerciseFiltersAndResults()">All Equipment</span>';
  equips.forEach(function(eq) {
    h += '<span class="chip'+(S.filterEquip===eq?' on':'')+'" onclick="S.filterEquip=\''+eq+'\';updateExerciseFiltersAndResults()">'+eq+'</span>';
  });
  h += '</div>';
  return h;
}

function renderExerciseResultsHTML() {
  var h = '';
  var results = EXERCISE_DB;
  if (S.searchQuery) results = searchExercises(S.searchQuery);
  if (S.filterMuscle) {
    results = results.filter(function(ex) {
      return ex.musclesPrimary.some(function(m){return m.muscle===S.filterMuscle;}) ||
             ex.musclesSecondary.some(function(m){return m.muscle===S.filterMuscle;});
    });
  }
  if (S.filterEquip) {
    results = results.filter(function(ex){ return ex.equipment === S.filterEquip; });
  }

  h += '<div style="font-size:10px;color:#555;margin-bottom:8px">'+results.length+' exercises</div>';

  results.forEach(function(ex) {
    var open = S.expanded === 'ex_'+ex.id;
    var muscles = ex.musclesPrimary.map(function(m){return MUSCLE_GROUPS[m.muscle]?MUSCLE_GROUPS[m.muscle].name:'';}).join(', ');

    h += '<div data-exid="'+ex.id+'" style="margin-bottom:'+(open?'0':'6px')+'">';
    h += '<div class="card" onclick="toggleExercise(\''+ex.id+'\')" style="border-left:3px solid '+ex.color+'">';
    h += '<div style="display:flex;align-items:center;gap:10px">';
    h += '<span style="font-size:18px">'+ex.icon+'</span>';
    h += '<div style="flex:1">';
    h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0">'+ex.name+'</div>';
    h += '<div style="font-size:10px;color:#555;margin-top:1px">'+muscles+' \u2022 '+ex.equipment+' \u2022 '+ex.difficulty+'</div>';
    h += '<div style="margin-top:3px">';
    h += '<span class="tag" style="background:'+ex.color+'22;color:'+ex.color+'">'+ex.category+'</span> ';
    h += '<span class="tag" style="background:#1a1a2e;color:#666">'+ex.movementPattern.replace(/_/g,' ')+'</span>';
    h += '</div>';
    h += '</div>';
    h += '<span style="color:#333;font-size:14px;'+(open?'transform:rotate(90deg);':'')+'transition:transform .2s">\u203A</span>';
    h += '</div></div>';

    if (open) {
      h += renderExerciseDetail(ex);
    }
    h += '</div>';
  });

  return h;
}

// Targeted updates — never touch the search input
var _exSearchTimeout = null;
function debouncedExerciseSearch() {
  if (_exSearchTimeout) clearTimeout(_exSearchTimeout);
  _exSearchTimeout = setTimeout(updateExerciseResults, 200);
}

function updateExerciseResults() {
  var el = document.getElementById('ex-list-results');
  if (!el) return;
  el.innerHTML = renderExerciseResultsHTML();
}

function updateExerciseFiltersAndResults() {
  var chips = document.getElementById('ex-filter-chips');
  if (chips) chips.innerHTML = renderExerciseFilterChips();
  updateExerciseResults();
}

function renderExerciseDetail(ex) {
  var h = '<div class="panel" style="border-color:'+ex.color+'33">';

  // Form video link
  h += '<a href="'+getFormVideoUrl(ex.id)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px;background:rgba(76,201,240,.1);border:1px solid rgba(76,201,240,.2);color:#4cc9f0;font-size:11px;text-decoration:none;margin-bottom:10px">\uD83C\uDFA5 Watch Form Video</a>';

  // Biomechanics
  h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Biomechanics</div>';
  h += '<div style="font-size:11px;color:#999;line-height:1.7;margin-bottom:12px">'+getBiomechanics(ex)+'</div>';

  // Muscles
  h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Muscles Worked</div>';
  ex.musclesPrimary.forEach(function(m) {
    var mg = MUSCLE_GROUPS[m.muscle];
    h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
    h += '<div class="mdot" style="background:'+(mg?mg.color:'#555')+'"></div>';
    h += '<div style="flex:1;font-size:11px;color:#ccc">'+(mg?mg.name:m.muscle)+' <span style="color:'+ex.color+'">'+m.pct+'%</span></div>';
    h += '</div>';
    if (m.note) h += '<div style="font-size:10px;color:#666;padding-left:14px;margin-bottom:6px">'+m.note+'</div>';
  });
  if (ex.musclesSecondary.length > 0) {
    h += '<div style="font-size:9px;color:#444;margin-top:4px;margin-bottom:4px">Secondary:</div>';
    ex.musclesSecondary.forEach(function(m) {
      var mg = MUSCLE_GROUPS[m.muscle];
      h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;padding-left:8px">';
      h += '<div class="mdot" style="background:'+(mg?mg.color:'#555')+';width:6px;height:6px"></div>';
      h += '<span style="font-size:10px;color:#888">'+(mg?mg.name:m.muscle)+' '+m.pct+'%</span></div>';
    });
  }
  if (ex.stabilizers.length > 0) {
    h += '<div style="font-size:10px;color:#555;margin-top:4px">Stabilizers: '+ex.stabilizers.map(function(s){var mg=MUSCLE_GROUPS[s];return mg?mg.name:s;}).join(', ')+'</div>';
  }

  // Rep ranges
  h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">Optimal Rep Ranges</div>';
  var goals = ['strength','hypertrophy','endurance'];
  goals.forEach(function(goal) {
    var rr = getRepRange(ex, goal);
    if (!rr || !rr.reps) return;
    var goalColor = goal === 'strength' ? '#ff6b35' : goal === 'hypertrophy' ? '#00b4d8' : '#38b000';
    h += '<div style="background:#111;border-radius:8px;padding:8px 10px;margin-bottom:6px;border-left:3px solid '+goalColor+'">';
    h += '<div style="display:flex;justify-content:space-between;margin-bottom:3px">';
    h += '<span style="font-size:11px;font-weight:600;color:'+goalColor+';text-transform:capitalize">'+goal+'</span>';
    h += '<span style="font-size:10px;color:#888">'+rr.reps+' reps'+(rr.sets?' \u2022 '+rr.sets+' sets':'')+(rr.rest?' \u2022 '+fmtTime(rr.rest)+' rest':'')+'</span></div>';
    if (rr.why) h += '<div style="font-size:10px;color:#666;line-height:1.6">'+rr.why+'</div>';
    h += '</div>';
  });

  // Warnings
  if (ex.warnings.length > 0) {
    h += '<div style="font-size:9px;color:#ff6b35;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">\u26A0\uFE0F Warnings</div>';
    ex.warnings.forEach(function(w) {
      h += '<div style="font-size:11px;color:#ff6b35;background:rgba(255,107,53,.08);padding:6px 9px;border-radius:6px;line-height:1.6;margin-bottom:4px">'+w+'</div>';
    });
  }

  // Progression cues
  h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">Progression Cues</div>';
  ex.progressionCues.forEach(function(cue) {
    h += '<div style="font-size:11px;color:#888;padding:4px 0;line-height:1.6">\u2022 '+cue+'</div>';
  });

  // Synergies
  var syns = getSynergies(ex);
  if (syns.length > 0) {
    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">Synergies & Pairings</div>';
    syns.forEach(function(syn) {
      var partner = findExercise(syn.exerciseId);
      var typeColor = syn.type === 'complement' ? '#00b4d8' : syn.type === 'superset' ? '#ffd60a' : '#38b000';
      h += '<div style="padding:6px 9px;background:#111;border-radius:6px;margin-bottom:4px;border-left:2px solid '+typeColor+'">';
      h += '<div style="font-size:10px;color:'+typeColor+';text-transform:uppercase;margin-bottom:2px">'+syn.type+'</div>';
      h += '<div style="font-size:11px;color:#ccc">'+(partner?partner.icon+' '+partner.name:syn.exerciseId)+'</div>';
      if (syn.note) h += '<div style="font-size:10px;color:#666;line-height:1.5">'+syn.note+'</div>';
      h += '</div>';
    });
  }

  // Substitutes
  var subs = getSubstitutes(ex);
  if (subs.length > 0) {
    h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">Substitutes</div>';
    subs.forEach(function(sub) {
      var alt = findExercise(sub.exerciseId);
      var simColor = sub.similarity >= 85 ? '#38b000' : sub.similarity >= 70 ? '#ffd60a' : '#ff6b35';
      h += '<div style="display:flex;align-items:center;gap:8px;padding:6px 9px;background:#111;border-radius:6px;margin-bottom:4px">';
      h += '<div style="text-align:center"><div style="font-size:12px;font-weight:700;color:'+simColor+'">'+sub.similarity+'%</div><div style="font-size:8px;color:#555">match</div></div>';
      h += '<div style="flex:1"><div style="font-size:11px;color:#ccc">'+(alt?alt.icon+' '+alt.name:sub.exerciseId)+'</div>';
      if (sub.note) h += '<div style="font-size:10px;color:#666;line-height:1.5">'+sub.note+'</div>';
      h += '</div></div>';
    });
  }

  // Science notes
  h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">Science Notes</div>';
  h += '<div style="font-size:11px;color:#777;line-height:1.7;background:#111;border-radius:8px;padding:8px 10px">'+ex.scienceNotes+'</div>';

  // PR info
  var pr = S.prs[ex.id];
  if (pr) {
    h += '<div style="font-size:9px;color:#ffd60a;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px">\uD83C\uDFC6 Personal Records</div>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
    if (pr.e1rm) h += '<div class="sbox"><div class="slbl">Est. 1RM</div><div class="sval" style="color:#ffd60a">'+pr.e1rm.weight+' '+S.units+'</div></div>';
    if (pr.maxWeight) h += '<div class="sbox"><div class="slbl">Best Set</div><div class="sval" style="color:#ffd60a">'+pr.maxWeight.weight+'\u00D7'+pr.maxWeight.reps+'</div></div>';
    if (pr.maxVolume) h += '<div class="sbox"><div class="slbl">Volume PR</div><div class="sval" style="color:#ffd60a">'+pr.maxVolume.volume.toLocaleString()+'</div></div>';
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function toggleExercise(id) {
  S.expanded = S.expanded === 'ex_'+id ? null : 'ex_'+id;
  if (S.subTab === 'exercises') { updateExerciseResults(); } else { draw(); }
}

// ════════════════════════════════════════════════════════════════
//  PROGRESS TAB
// ════════════════════════════════════════════════════════════════

function renderProgress() {
  var h = '<div class="sec sIn">';

  // Stats summary
  var totalWorkouts = S.workoutHistory.length;
  var totalSets = S.workoutHistory.reduce(function(s,w){return s+w.exercises.reduce(function(s2,e){return s2+e.sets.filter(function(ss){return ss.completed;}).length;},0);},0);
  var totalVolume = S.workoutHistory.reduce(function(s,w){return s+w.exercises.reduce(function(s2,e){return s2+e.sets.reduce(function(s3,ss){return s3+(ss.completed?ss.weight*ss.reps:0);},0);},0);},0);

  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:16px">';
  h += '<div class="sbox" style="text-align:center"><div class="slbl">Workouts</div><div class="sval" style="font-size:18px;color:#00b4d8;font-family:\'Space Grotesk\',sans-serif;font-weight:700">'+totalWorkouts+'</div></div>';
  h += '<div class="sbox" style="text-align:center"><div class="slbl">Total Sets</div><div class="sval" style="font-size:18px;color:#4cc9f0;font-family:\'Space Grotesk\',sans-serif;font-weight:700">'+totalSets+'</div></div>';
  h += '<div class="sbox" style="text-align:center"><div class="slbl">Volume ('+S.units+')</div><div class="sval" style="font-size:18px;color:#38b000;font-family:\'Space Grotesk\',sans-serif;font-weight:700">'+totalVolume.toLocaleString()+'</div></div>';
  h += '</div>';

  // PRs
  var prKeys = Object.keys(S.prs);
  if (prKeys.length > 0) {
    h += '<div style="font-size:9px;color:#ffd60a;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\uD83C\uDFC6 Personal Records</div>';
    prKeys.forEach(function(exId) {
      var ex = findExercise(exId);
      var pr = S.prs[exId];
      h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:10px 12px;margin-bottom:6px">';
      h += '<div style="font-size:12px;color:'+(ex?ex.color:'#ccc')+';font-weight:600;margin-bottom:4px">'+(ex?ex.icon+' '+ex.name:exId)+'</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">';
      if (pr.e1rm) h += '<div class="sbox"><div class="slbl">Est. 1RM</div><div class="sval" style="color:#ffd60a">'+pr.e1rm.weight+' '+S.units+'</div><div style="font-size:9px;color:#555">'+pr.e1rm.actualWeight+'\u00D7'+pr.e1rm.actualReps+'</div></div>';
      if (pr.maxWeight) h += '<div class="sbox"><div class="slbl">Best Set</div><div class="sval" style="color:#ffd60a">'+pr.maxWeight.weight+'\u00D7'+pr.maxWeight.reps+'</div><div style="font-size:9px;color:#555">'+fmtDate(pr.maxWeight.date)+'</div></div>';
      if (pr.maxVolume) h += '<div class="sbox"><div class="slbl">Volume</div><div class="sval" style="color:#ffd60a">'+pr.maxVolume.volume.toLocaleString()+'</div><div style="font-size:9px;color:#555">'+fmtDate(pr.maxVolume.date)+'</div></div>';
      h += '</div></div>';
    });
  } else {
    h += '<div class="empty"><div class="empty-icon">\uD83C\uDFC6</div>Complete workouts to start tracking PRs.</div>';
  }

  // Session volume trend
  if (S.workoutHistory.length >= 2) {
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin:16px 0 9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\uD83D\uDCCA Session Volume Trend</div>';
    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:10px 12px;margin-bottom:6px">';
    var volPts = S.workoutHistory.slice(-20).map(function(w) {
      var vol = w.exercises.reduce(function(s,e){return s+e.sets.reduce(function(s2,ss){return s2+(ss.completed?ss.weight*ss.reps:0);},0);},0);
      return { date:w.startedAt, vol:vol };
    });
    var maxVol = Math.max.apply(null, volPts.map(function(p){return p.vol;}));
    var minVol = Math.min.apply(null, volPts.map(function(p){return p.vol;}));
    var vRange = maxVol - minVol || 1;
    var vw = 280, vht = 50;
    var vStep = volPts.length > 1 ? vw / (volPts.length - 1) : 0;
    var volPath = volPts.map(function(p, i) {
      var x = i * vStep;
      var y = vht - ((p.vol - minVol) / vRange) * (vht - 6) - 3;
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    });
    // Area fill
    var areaPath = volPath.join(' ') + ' L' + ((volPts.length-1)*vStep).toFixed(1) + ',' + vht + ' L0,' + vht + ' Z';
    h += '<svg width="'+vw+'" height="'+vht+'" style="display:block;margin-bottom:4px">';
    h += '<path d="'+areaPath+'" fill="rgba(0,180,216,.1)" stroke="none"/>';
    h += '<path d="'+volPath.join(' ')+'" fill="none" stroke="#00b4d8" stroke-width="2" stroke-linecap="round"/></svg>';
    h += '<div style="display:flex;justify-content:space-between;font-size:9px;color:#555">';
    h += '<span>'+volPts[0].vol.toLocaleString()+' '+S.units+'</span>';
    h += '<span>'+volPts[volPts.length-1].vol.toLocaleString()+' '+S.units+'</span></div>';
    // Trend arrow
    var recent = volPts.slice(-3).reduce(function(s,p){return s+p.vol;},0)/Math.min(3,volPts.length);
    var older = volPts.slice(0,3).reduce(function(s,p){return s+p.vol;},0)/Math.min(3,volPts.length);
    var trendPct = older > 0 ? Math.round(((recent-older)/older)*100) : 0;
    h += '<div style="text-align:center;font-size:10px;margin-top:4px;color:'+(trendPct>0?'#38b000':trendPct<0?'#e63946':'#555')+'">'+(trendPct>0?'\u2191 +':trendPct<0?'\u2193 ':'')+trendPct+'% overall trend</div>';
    h += '</div>';
  }

  // Per-exercise history with 1RM trending
  var exercisesWithHistory = {};
  S.workoutHistory.forEach(function(w) {
    w.exercises.forEach(function(wex) {
      if (!exercisesWithHistory[wex.exerciseId]) exercisesWithHistory[wex.exerciseId] = [];
      var bestSet = null;
      wex.sets.forEach(function(s) {
        if (s.completed && s.type === 'working' && (!bestSet || s.weight > bestSet.weight)) bestSet = s;
      });
      if (bestSet) {
        var e1rm = bestSet.reps > 1 ? estimate1RM(bestSet.weight, bestSet.reps) : bestSet.weight;
        exercisesWithHistory[wex.exerciseId].push({ date:w.startedAt, weight:bestSet.weight, reps:bestSet.reps, e1rm:Math.round(e1rm) });
      }
    });
  });

  var histKeys = Object.keys(exercisesWithHistory).filter(function(k){ return exercisesWithHistory[k].length >= 2; });
  if (histKeys.length > 0) {
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin:16px 0 9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\uD83D\uDCC8 Strength Progress</div>';
    histKeys.forEach(function(exId) {
      var ex = findExercise(exId);
      var pts = exercisesWithHistory[exId];

      h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:10px 12px;margin-bottom:6px">';
      h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">';
      h += '<div style="font-size:12px;color:'+(ex?ex.color:'#ccc')+';font-weight:600">'+(ex?ex.icon+' '+ex.name:exId)+'</div>';
      // Change indicator
      var firstW = pts[0].weight, lastW = pts[pts.length-1].weight;
      var diff = lastW - firstW;
      if (diff !== 0) {
        h += '<div style="font-size:10px;color:'+(diff>0?'#38b000':'#e63946')+'">'+(diff>0?'\u2191 +':'\u2193 ')+Math.abs(diff)+' '+S.units+'</div>';
      }
      h += '</div>';

      // Dual sparkline: weight (solid) + est 1RM (dashed)
      var w = 280, ht = 50;
      var all1RM = pts.map(function(p){return p.e1rm;});
      var allW = pts.map(function(p){return p.weight;});
      var globalMax = Math.max(Math.max.apply(null, all1RM), Math.max.apply(null, allW));
      var globalMin = Math.min(Math.min.apply(null, all1RM), Math.min.apply(null, allW));
      var range = globalMax - globalMin || 1;
      var step = pts.length > 1 ? w / (pts.length - 1) : 0;

      var weightPath = pts.map(function(p, i) {
        var x = i * step;
        var y = ht - ((p.weight - globalMin) / range) * (ht - 6) - 3;
        return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
      });
      var e1rmPath = pts.map(function(p, i) {
        var x = i * step;
        var y = ht - ((p.e1rm - globalMin) / range) * (ht - 6) - 3;
        return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
      });

      h += '<svg width="'+w+'" height="'+ht+'" style="display:block;margin-bottom:4px">';
      h += '<path d="'+e1rmPath.join(' ')+'" fill="none" stroke="#ffd60a" stroke-width="1.5" stroke-dasharray="4,3" stroke-linecap="round" opacity=".6"/>';
      h += '<path d="'+weightPath.join(' ')+'" fill="none" stroke="'+(ex?ex.color:'#00b4d8')+'" stroke-width="2" stroke-linecap="round"/>';
      h += '</svg>';

      // Legend + values
      h += '<div style="display:flex;justify-content:space-between;font-size:9px;color:#555">';
      h += '<div><span style="color:'+(ex?ex.color:'#00b4d8')+'">\u2500</span> '+pts[pts.length-1].weight+S.units+' \u00D7'+pts[pts.length-1].reps;
      h += ' &nbsp;<span style="color:#ffd60a">- -</span> 1RM: '+pts[pts.length-1].e1rm+S.units+'</div>';
      h += '<span>'+pts.length+' sessions</span></div>';
      h += '</div>';
    });
  }

  h += '</div>';
  return h;
}

// ════════════════════════════════════════════════════════════════
//  TEMPLATES TAB
// ════════════════════════════════════════════════════════════════

function renderTemplates() {
  var h = '<div class="sec sIn">';

  h += '<button class="btn-pri" onclick="openCreateTemplateModal()" style="margin-bottom:16px">+ Create Template</button>';

  // Weekly program overview (cross-template analysis)
  h += renderWeeklyOverview();

  if (S.templates.length === 0) {
    h += '<div class="empty"><div class="empty-icon">\uD83D\uDCDD</div>No templates yet.<br>Create one to quickly start workouts.</div>';
  }

  S.templates.forEach(function(t, idx) {
    var open = S.expanded === 'tmpl_'+idx;
    h += '<div style="margin-bottom:'+(open?'0':'8px')+'">';
    h += '<div class="card" onclick="toggleTemplate('+idx+')" style="border-left:3px solid '+t.color+'">';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<span style="font-size:18px">'+t.icon+'</span>';
    h += '<div style="flex:1">';
    var tStats = getTemplateStats(t.id);
    h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:14px;font-weight:600;color:#e0e0f0">'+t.name+'</div>';
    h += '<div style="font-size:10px;color:#555;margin-top:2px">'+t.exercises.length+' exercises';
    if (tStats.sessions > 0) h += ' \u2022 '+tStats.sessions+' session'+(tStats.sessions>1?'s':'');
    if (tStats.weeksInUse > 0) h += ' \u2022 '+tStats.weeksInUse+'w';
    h += '</div></div>';
    h += '<span style="color:#333;font-size:14px;'+(open?'transform:rotate(90deg);':'')+'transition:transform .2s">\u203A</span></div></div>';

    if (open) {
      h += '<div class="panel">';
      t.exercises.forEach(function(te, teIdx) {
        var ex = findExercise(te.exerciseId);
        h += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #111">';
        h += '<span style="font-size:14px">'+(ex?ex.icon:'\u2022')+'</span>';
        h += '<div style="flex:1"><div style="font-size:11px;color:#ccc">'+(ex?ex.name:te.exerciseId)+'</div>';
        h += '<div style="font-size:9px;color:#555">'+te.sets+' sets \u00D7 '+te.repTarget+' reps \u2022 '+fmtTime(te.restSeconds)+' rest'+(ex?' \u2022 <span style="color:#4cc9f0;cursor:pointer" title="Watch form">\u25B6</span>':'')+'</div></div>';
        if (ex) h += '<a href="'+getFormVideoUrl(te.exerciseId)+'" target="_blank" rel="noopener" style="color:#4cc9f0;font-size:12px;padding:4px;text-decoration:none" title="Form video">\uD83C\uDFA5</a>';
        h += '<button onclick="removeExerciseFromTemplate('+idx+','+teIdx+')" style="color:#444;font-size:14px;padding:4px">\u00D7</button></div>';
      });
      // Template intelligence analysis
      h += renderTemplateAnalysis(t);
      // Day scheduling
      var days = t.scheduledDays || {};
      h += '<div style="border-top:1px solid #111;margin-top:8px;padding-top:8px">';
      h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Schedule days</div>';
      h += '<div style="display:flex;gap:4px">';
      DAY_KEYS.forEach(function(dk, di) {
        var on = days[dk];
        h += '<button onclick="toggleTemplateDay('+idx+',\''+dk+'\')" style="flex:1;padding:5px 2px;border-radius:5px;font-size:9px;font-weight:'+(on?'700':'400')+';border:1px solid '+(on?t.color:'#222')+';background:'+(on?t.color+'22':'#111')+';color:'+(on?t.color:'#333')+';cursor:pointer">'+DAY_LABELS[di]+'</button>';
      });
      h += '</div></div>';
      h += '<div style="display:flex;gap:6px;margin-top:8px">';
      h += '<button onclick="openAddExerciseToTemplateModal('+idx+')" style="flex:1;padding:6px;border-radius:6px;border:1px dashed #2a2a2e;color:#444;font-size:10px;cursor:pointer;background:transparent">+ Add Exercise</button>';
      h += '<button onclick="autoOrderTemplate('+idx+')" style="padding:6px 10px;border-radius:6px;font-size:10px;color:#4cc9f0;background:rgba(76,201,240,.1);border:1px solid rgba(76,201,240,.2);cursor:pointer" title="Sort compounds before isolations">\u2195 Order</button>';
      h += '<button onclick="deleteTemplate('+idx+')" style="padding:6px 12px;border-radius:6px;font-size:10px;color:#ff4444;background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.2);cursor:pointer">Delete</button>';
      h += '</div></div>';
    }
    h += '</div>';
  });

  h += '</div>';
  return h;
}

// ─── TEMPLATE INTELLIGENCE ───────────────────────────────────

function analyzeWeeklyProgram() {
  // Cross-template analysis: weekly volume, balance, recovery conflicts
  var result = { weeklyVolume:{}, scheduleConflicts:[], warnings:[], suggestions:[], totalWeeklySets:0, daysUsed:{}, templatesByDay:{} };
  if (S.templates.length === 0) return result;

  // Build per-day template map and weekly muscle volume
  DAY_KEYS.forEach(function(dk) { result.templatesByDay[dk] = []; });
  S.templates.forEach(function(t) {
    var days = t.scheduledDays || {};
    DAY_KEYS.forEach(function(dk) {
      if (days[dk]) {
        result.templatesByDay[dk].push(t);
        result.daysUsed[dk] = true;
      }
    });
    t.exercises.forEach(function(te) {
      var ex = findExercise(te.exerciseId);
      if (!ex) return;
      var sets = te.sets || 3;
      // Count how many days/week this template runs
      var freq = 0;
      DAY_KEYS.forEach(function(dk) { if (days[dk]) freq++; });
      var weeklySets = sets * Math.max(1, freq);
      result.totalWeeklySets += weeklySets;
      ex.musclesPrimary.forEach(function(m) {
        if (!result.weeklyVolume[m.muscle]) result.weeklyVolume[m.muscle] = 0;
        result.weeklyVolume[m.muscle] += weeklySets;
      });
      ex.musclesSecondary.forEach(function(m) {
        if (!result.weeklyVolume[m.muscle]) result.weeklyVolume[m.muscle] = 0;
        result.weeklyVolume[m.muscle] += Math.round(weeklySets * 0.5);
      });
    });
  });

  // Check weekly volume vs targets
  var overTrained = [], underTrained = [];
  Object.keys(MUSCLE_GROUPS).forEach(function(mid) {
    var mg = MUSCLE_GROUPS[mid];
    var vol = result.weeklyVolume[mid] || 0;
    if (vol > mg.weeklySetTarget.max * 1.3) overTrained.push(mg.name + ' (' + vol + '/' + mg.weeklySetTarget.max + ')');
    else if (vol > 0 && vol < mg.weeklySetTarget.min) underTrained.push(mg.name + ' (' + vol + '/' + mg.weeklySetTarget.min + ')');
  });
  if (overTrained.length > 0) result.warnings.push('Overtraining risk: ' + overTrained.join(', '));
  if (underTrained.length > 0) result.suggestions.push('Below minimum volume: ' + underTrained.join(', '));

  // Check for same-muscle groups on consecutive days (recovery conflict)
  var dayOrder = ['sun','mon','tue','wed','thu','fri','sat'];
  for (var d = 0; d < 7; d++) {
    var day1 = dayOrder[d], day2 = dayOrder[(d+1)%7];
    var t1 = result.templatesByDay[day1], t2 = result.templatesByDay[day2];
    if (t1.length === 0 || t2.length === 0) continue;
    var muscles1 = {}, muscles2 = {};
    t1.forEach(function(t) { t.exercises.forEach(function(te) {
      var ex = findExercise(te.exerciseId);
      if (ex) ex.musclesPrimary.forEach(function(m) { muscles1[m.muscle] = true; });
    }); });
    t2.forEach(function(t) { t.exercises.forEach(function(te) {
      var ex = findExercise(te.exerciseId);
      if (ex) ex.musclesPrimary.forEach(function(m) { muscles2[m.muscle] = true; });
    }); });
    var overlap = Object.keys(muscles1).filter(function(m) { return muscles2[m]; });
    overlap.forEach(function(mid) {
      var mg = MUSCLE_GROUPS[mid];
      if (mg && mg.recoveryHours >= 48) {
        result.scheduleConflicts.push(mg.name + ' trained ' + DAY_LABELS[dayOrder.indexOf(day1)] + ' & ' + DAY_LABELS[dayOrder.indexOf(day2)] + ' (needs ' + mg.recoveryHours + 'h recovery)');
      }
    });
  }
  if (result.scheduleConflicts.length > 0) result.warnings.push('Recovery conflicts: ' + result.scheduleConflicts.slice(0,3).join('; '));

  // Missing major muscle groups entirely
  var majorMuscles = ['chest_mid','back_lats','quads','hamstrings','glutes','front_delts'];
  var missing = majorMuscles.filter(function(m) { return !result.weeklyVolume[m]; });
  if (missing.length > 0) {
    var names = missing.map(function(m) { var mg = MUSCLE_GROUPS[m]; return mg ? mg.name : m; });
    result.suggestions.push('Not trained at all: ' + names.join(', '));
  }

  // Training frequency
  var trainDays = Object.keys(result.daysUsed).length;
  if (trainDays > 6) result.warnings.push('Training 7 days/week — rest days are critical for growth');
  else if (trainDays <= 2 && S.templates.length > 0) result.suggestions.push('Only ' + trainDays + ' training day' + (trainDays>1?'s':'') + '/week — consider adding more for better results');

  return result;
}

function renderWeeklyOverview() {
  var wp = analyzeWeeklyProgram();
  if (S.templates.length === 0) return '';
  var h = '<div style="background:#0a0a14;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:16px">';
  h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">\uD83D\uDCCA Weekly Program Overview</div>';

  // Weekly schedule mini row
  h += '<div style="display:flex;gap:3px;margin-bottom:10px">';
  var dayOrder = ['sun','mon','tue','wed','thu','fri','sat'];
  dayOrder.forEach(function(dk, di) {
    var templates = wp.templatesByDay[dk] || [];
    var hasWork = templates.length > 0;
    h += '<div style="flex:1;text-align:center;padding:4px 2px;border-radius:5px;background:'+(hasWork?'rgba(0,180,216,.1)':'#0d0d1a')+';border:1px solid '+(hasWork?'#00b4d822':'#111')+'">';
    h += '<div style="font-size:8px;color:'+(hasWork?'#00b4d8':'#333')+'">'+DAY_LABELS[di]+'</div>';
    if (hasWork) {
      templates.forEach(function(t) {
        h += '<div style="font-size:7px;color:'+t.color+';margin-top:2px">'+t.icon+'</div>';
      });
    } else {
      h += '<div style="font-size:8px;color:#222;margin-top:2px">REST</div>';
    }
    h += '</div>';
  });
  h += '</div>';

  // Muscle volume vs weekly targets (top 8 muscles)
  var muscleKeys = Object.keys(wp.weeklyVolume).sort(function(a,b) { return wp.weeklyVolume[b] - wp.weeklyVolume[a]; });
  if (muscleKeys.length > 0) {
    h += '<div style="margin-bottom:8px">';
    muscleKeys.slice(0, 8).forEach(function(mid) {
      var mg = MUSCLE_GROUPS[mid];
      if (!mg) return;
      var vol = wp.weeklyVolume[mid];
      var pct = Math.min(120, (vol / mg.weeklySetTarget.max) * 100);
      var overMax = vol > mg.weeklySetTarget.max;
      var underMin = vol < mg.weeklySetTarget.min;
      var barColor = overMax ? '#e63946' : underMin ? '#ffd60a' : mg.color;
      h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">';
      h += '<div style="width:70px;font-size:9px;color:#888;text-align:right">'+mg.name+'</div>';
      h += '<div style="flex:1;height:5px;background:#111;border-radius:2px;position:relative">';
      // Target zone indicator
      var minPct = (mg.weeklySetTarget.min / mg.weeklySetTarget.max) * 100;
      h += '<div style="position:absolute;left:'+minPct+'%;right:0;height:5px;background:#ffffff08;border-radius:2px"></div>';
      h += '<div style="height:5px;border-radius:2px;width:'+Math.min(100,pct)+'%;background:'+barColor+'"></div></div>';
      h += '<div style="width:40px;font-size:8px;color:'+(overMax?'#e63946':underMin?'#ffd60a':'#555')+'">'+vol+'/'+mg.weeklySetTarget.min+'-'+mg.weeklySetTarget.max+'</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  // Warnings & suggestions
  wp.warnings.forEach(function(w) {
    h += '<div style="font-size:10px;color:#ff6b35;background:rgba(255,107,53,.08);padding:4px 8px;border-radius:5px;margin-bottom:3px">\u26A0 '+w+'</div>';
  });
  wp.suggestions.forEach(function(s) {
    h += '<div style="font-size:10px;color:#4cc9f0;background:rgba(76,201,240,.08);padding:4px 8px;border-radius:5px;margin-bottom:3px">\uD83D\uDCA1 '+s+'</div>';
  });

  h += '</div>';
  return h;
}

function analyzeTemplate(template) {
  var result = { grade:'', score:0, muscleCoverage:{}, patterns:{}, warnings:[], suggestions:[], totalSets:0 };
  if (template.exercises.length === 0) return result;

  // Tally muscles, patterns, volume
  var pushSets = 0, pullSets = 0, legSets = 0;
  template.exercises.forEach(function(te) {
    var ex = findExercise(te.exerciseId);
    if (!ex) return;
    var sets = te.sets || 3;
    result.totalSets += sets;

    // Movement pattern tracking
    var pat = ex.movementPattern;
    result.patterns[pat] = (result.patterns[pat] || 0) + sets;
    if (pat.indexOf('push') >= 0 || pat === 'lateral_raise') pushSets += sets;
    else if (pat.indexOf('pull') >= 0 || pat === 'elbow_flexion') pullSets += sets;
    else if (pat === 'squat' || pat === 'hip_hinge' || pat === 'hip_extension' || pat === 'knee_extension' || pat === 'knee_flexion' || pat.indexOf('ankle') >= 0) legSets += sets;

    // Muscle coverage
    ex.musclesPrimary.forEach(function(m) {
      if (!result.muscleCoverage[m.muscle]) result.muscleCoverage[m.muscle] = 0;
      result.muscleCoverage[m.muscle] += sets;
    });
    ex.musclesSecondary.forEach(function(m) {
      if (!result.muscleCoverage[m.muscle]) result.muscleCoverage[m.muscle] = 0;
      result.muscleCoverage[m.muscle] += Math.round(sets * 0.5);
    });
  });

  // Check exercise ordering (compounds should come before isolations)
  var lastWasIsolation = false;
  var orderIssues = 0;
  template.exercises.forEach(function(te) {
    var ex = findExercise(te.exerciseId);
    if (!ex) return;
    if (ex.category === 'compound' && lastWasIsolation) orderIssues++;
    lastWasIsolation = ex.category === 'isolation';
  });
  if (orderIssues > 0) result.warnings.push('Compound exercises should come before isolations for optimal performance');

  // Push/pull balance
  if (pushSets > 0 && pullSets === 0) result.warnings.push('All push, no pull \u2014 add rows or pulldowns for shoulder health');
  else if (pullSets > 0 && pushSets === 0) result.warnings.push('All pull, no push \u2014 consider adding a pressing movement');
  else if (pushSets > 0 && pullSets > 0) {
    var ratio = pushSets / pullSets;
    if (ratio > 2) result.warnings.push('Push/pull ratio is ' + ratio.toFixed(1) + ':1 \u2014 aim for closer to 1:1');
    else if (ratio < 0.5) result.warnings.push('Pull/push ratio is high \u2014 consider more pressing volume');
  }

  // Volume check per session
  if (result.totalSets > 25) result.warnings.push('High volume session (' + result.totalSets + ' sets) \u2014 quality may drop after 20-25 sets');
  if (result.totalSets < 6 && template.exercises.length > 0) result.suggestions.push('Low volume \u2014 consider adding exercises for a more complete session');

  // Check for missing muscle groups that synergize with what's there
  var hasChest = result.muscleCoverage.chest_mid || result.muscleCoverage.chest_upper;
  var hasBack = result.muscleCoverage.back_lats || result.muscleCoverage.back_upper;
  var hasQuads = result.muscleCoverage.quads;
  var hasHams = result.muscleCoverage.hamstrings;
  var hasRearDelts = result.muscleCoverage.rear_delts;
  if (hasChest && !hasRearDelts) result.suggestions.push('Add face pulls or rear delt flyes \u2014 essential balance for pressing');
  if (hasQuads && !hasHams) result.suggestions.push('Add hamstring work (RDLs, leg curls) to balance quad volume');
  if (hasHams && !hasQuads) result.suggestions.push('Add quad work (squats, leg press) to balance hamstring volume');

  // Volume vs weekly targets (what fraction of weekly target does this session provide)
  var overloaded = [], underHit = [];
  Object.keys(result.muscleCoverage).forEach(function(mid) {
    var mg = MUSCLE_GROUPS[mid];
    if (!mg) return;
    var sets = result.muscleCoverage[mid];
    if (sets > mg.weeklySetTarget.max) overloaded.push(mg.name + ' (' + sets + '/' + mg.weeklySetTarget.max + ' max)');
  });
  if (overloaded.length > 0) result.warnings.push('Single-session volume exceeds weekly max for: ' + overloaded.join(', '));

  // Scoring (out of 100)
  var score = 50; // base
  if (template.exercises.length >= 3) score += 10;
  if (template.exercises.length >= 5) score += 5;
  if (orderIssues === 0 && template.exercises.length > 1) score += 10;
  if (pushSets > 0 && pullSets > 0 && Math.abs(pushSets - pullSets) <= 3) score += 10; // balanced push/pull
  if (result.warnings.length === 0) score += 15;
  score -= result.warnings.length * 5;
  if (Object.keys(result.muscleCoverage).length >= 4) score += 10; // hits multiple muscles
  score = Math.max(0, Math.min(100, score));
  result.score = score;
  result.grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return result;
}

function renderTemplateAnalysis(template) {
  var a = analyzeTemplate(template);
  if (template.exercises.length === 0) return '';
  var h = '<div style="border-top:1px solid #111;margin-top:8px;padding-top:8px">';
  h += '<div style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">\uD83E\uDDE0 Template Analysis</div>';

  // Grade badge
  var gradeColors = {A:'#38b000',B:'#4cc9f0',C:'#ffd60a',D:'#ff6b35',F:'#e63946'};
  h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
  h += '<div style="width:36px;height:36px;border-radius:8px;background:'+(gradeColors[a.grade]||'#555')+'22;border:2px solid '+(gradeColors[a.grade]||'#555')+';display:flex;align-items:center;justify-content:center;font-family:\'Space Grotesk\',sans-serif;font-size:18px;font-weight:700;color:'+(gradeColors[a.grade]||'#555')+'">'+a.grade+'</div>';
  h += '<div><div style="font-size:11px;color:#ccc">'+a.totalSets+' total sets</div>';
  // Pattern summary
  var patSummary = [];
  var pushTotal = 0, pullTotal = 0, legTotal = 0;
  Object.keys(a.patterns).forEach(function(p) {
    if (p.indexOf('push') >= 0 || p === 'lateral_raise') pushTotal += a.patterns[p];
    else if (p.indexOf('pull') >= 0 || p === 'elbow_flexion') pullTotal += a.patterns[p];
    else legTotal += a.patterns[p];
  });
  if (pushTotal) patSummary.push('Push: ' + pushTotal);
  if (pullTotal) patSummary.push('Pull: ' + pullTotal);
  if (legTotal) patSummary.push('Legs: ' + legTotal);
  h += '<div style="font-size:9px;color:#555">' + patSummary.join(' \u2022 ') + '</div></div></div>';

  // Muscle coverage mini-bars
  var muscles = Object.keys(a.muscleCoverage).sort(function(a2,b2){ return a.muscleCoverage[b2]-a.muscleCoverage[a2]; });
  if (muscles.length > 0) {
    h += '<div style="margin-bottom:6px">';
    muscles.slice(0, 6).forEach(function(mid) {
      var mg = MUSCLE_GROUPS[mid];
      if (!mg) return;
      var sets = a.muscleCoverage[mid];
      var pct = Math.min(100, (sets / mg.weeklySetTarget.max) * 100);
      h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">';
      h += '<div style="width:70px;font-size:9px;color:#888;text-align:right">'+mg.name+'</div>';
      h += '<div style="flex:1;height:4px;background:#111;border-radius:2px"><div style="height:4px;border-radius:2px;width:'+pct+'%;background:'+mg.color+'"></div></div>';
      h += '<div style="width:24px;font-size:8px;color:#555">'+sets+'</div>';
      h += '</div>';
    });
    h += '</div>';
  }

  // Warnings
  a.warnings.forEach(function(w) {
    h += '<div style="font-size:10px;color:#ff6b35;background:rgba(255,107,53,.08);padding:4px 8px;border-radius:5px;margin-bottom:3px">\u26A0 '+w+'</div>';
  });
  // Suggestions
  a.suggestions.forEach(function(s) {
    h += '<div style="font-size:10px;color:#4cc9f0;background:rgba(76,201,240,.08);padding:4px 8px;border-radius:5px;margin-bottom:3px">\uD83D\uDCA1 '+s+'</div>';
  });

  h += '</div>';
  return h;
}

function autoOrderTemplate(idx) {
  var t = S.templates[idx];
  if (!t || t.exercises.length < 2) return;
  // Sort: compounds first, then isolations. Within each group, preserve order.
  var compounds = [], isolations = [];
  t.exercises.forEach(function(te) {
    var ex = findExercise(te.exerciseId);
    if (ex && ex.category === 'isolation') isolations.push(te);
    else compounds.push(te);
  });
  t.exercises = compounds.concat(isolations);
  saveS(); draw();
}

function getFormVideoUrl(exerciseId) {
  var ex = findExercise(exerciseId);
  if (!ex) return '';
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.name + ' proper form tutorial');
}

function toggleTemplate(idx) { S.expanded = S.expanded === 'tmpl_'+idx ? null : 'tmpl_'+idx; draw(); }

function openCreateTemplateModal() {
  var colors = ['#4cc9f0','#38b000','#f77f00','#e63946','#9d4edd','#ffd60a','#06d6a0','#00b4d8'];
  var icons = ['\uD83D\uDCAA','\uD83C\uDFCB\uFE0F','\uD83D\uDD25','\u26A1','\uD83D\uDE80','\uD83C\uDFC3','\uD83E\uDD38','\uD83E\uDDBE'];
  var m = document.getElementById('modal-root');
  var mh = '<div class="modal-bg" onclick="if(event.target===this)closeModal()">';
  mh += '<div class="modal">';
  mh += '<div class="modal-hdr"><span style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700">Create Template</span>';
  mh += '<button onclick="closeModal()" style="color:#555;font-size:20px">\u00D7</button></div>';
  mh += '<label class="flabel">Name</label><input class="finput" id="tmpl_name" placeholder="e.g. Push Day, Leg Day...">';
  mh += '<label class="flabel">Icon</label><div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">';
  icons.forEach(function(ic,i) {
    mh += '<button onclick="document.getElementById(\'tmpl_icon\').value=\''+ic+'\';document.querySelectorAll(\'.ic-btn\').forEach(function(b){b.style.border=\'1px solid #222\'});this.style.border=\'1px solid #00b4d8\'" class="ic-btn" style="font-size:18px;padding:6px 8px;background:#111;border:1px solid '+(i===0?'#00b4d8':'#222')+';border-radius:6px;cursor:pointer">'+ic+'</button>';
  });
  mh += '</div><input type="hidden" id="tmpl_icon" value="'+icons[0]+'">';
  mh += '<button class="btn-pri" onclick="createTemplate()">Create</button>';
  mh += '<button class="btn-sec" onclick="closeModal()">Cancel</button>';
  mh += '</div></div>';
  m.innerHTML = mh;
}

function createTemplate() {
  var name = document.getElementById('tmpl_name').value.trim();
  if (!name) { alert('Please enter a name'); return; }
  var icon = document.getElementById('tmpl_icon').value || '\uD83D\uDCAA';
  var colors = ['#4cc9f0','#38b000','#f77f00','#e63946','#9d4edd','#ffd60a','#06d6a0','#00b4d8'];
  S.templates.push({
    id: genId(),
    name: name,
    icon: icon,
    color: colors[S.templates.length % colors.length],
    exercises: [],
    scheduledDays: {mon:false,tue:false,wed:false,thu:false,fri:false,sat:false,sun:false},
    createdAt: TODAY
  });
  closeModal(); saveS(); draw();
}

function deleteTemplate(idx) {
  if (!confirm('Delete this template?')) return;
  S.templates.splice(idx, 1);
  S.expanded = null;
  saveS(); draw();
}

function toggleTemplateDay(idx, dayKey) {
  var t = S.templates[idx];
  if (!t.scheduledDays) t.scheduledDays = {sun:false,mon:false,tue:false,wed:false,thu:false,fri:false,sat:false};
  t.scheduledDays[dayKey] = !t.scheduledDays[dayKey];
  saveS(); draw();
}

function removeExerciseFromTemplate(tmplIdx, exIdx) {
  S.templates[tmplIdx].exercises.splice(exIdx, 1);
  saveS(); draw();
}

function openAddExerciseToTemplateModal(tmplIdx) {
  var m = document.getElementById('modal-root');
  var mh = '<div class="modal-bg" onclick="if(event.target===this)closeModal()">';
  mh += '<div class="modal">';
  mh += '<div class="modal-hdr"><span style="font-family:\'Space Grotesk\',sans-serif;font-size:16px;font-weight:700">Add Exercise to Template</span>';
  mh += '<button onclick="closeModal()" style="color:#555;font-size:20px">\u00D7</button></div>';
  mh += '<input type="search" id="tmpl-ex-search" placeholder="Search exercises..." oninput="updateTemplateExSearch('+tmplIdx+')">';
  mh += '<div id="tmpl-ex-results">';
  EXERCISE_DB.forEach(function(ex) {
    mh += '<div class="ex-row" onclick="addExToTemplate('+tmplIdx+',\''+ex.id+'\')">';
    mh += '<span style="font-size:16px">'+ex.icon+'</span>';
    mh += '<div style="flex:1"><div style="font-size:12px;color:#e0e0f0">'+ex.name+'</div></div>';
    mh += '<span style="color:#333;font-size:14px">\u203A</span></div>';
  });
  mh += '</div></div></div>';
  m.innerHTML = mh;
}

function updateTemplateExSearch(tmplIdx) {
  var q = document.getElementById('tmpl-ex-search').value;
  var results = searchExercises(q);
  var h = '';
  results.forEach(function(ex) {
    h += '<div class="ex-row" onclick="addExToTemplate('+tmplIdx+',\''+ex.id+'\')">';
    h += '<span style="font-size:16px">'+ex.icon+'</span>';
    h += '<div style="flex:1"><div style="font-size:12px;color:#e0e0f0">'+ex.name+'</div></div>';
    h += '<span style="color:#333;font-size:14px">\u203A</span></div>';
  });
  document.getElementById('tmpl-ex-results').innerHTML = h;
}

function addExToTemplate(tmplIdx, exerciseId) {
  var ex = findExercise(exerciseId);
  var rr = ex ? getRepRange(ex, S.selectedGoal) : null;
  S.templates[tmplIdx].exercises.push({
    exerciseId: exerciseId,
    sets: 3,
    repTarget: rr ? parseInt(rr.reps.split('-')[1]) || 10 : 10,
    restSeconds: rr ? rr.rest : S.defaultRestSeconds
  });
  closeModal(); saveS(); draw();
}

// ════════════════════════════════════════════════════════════════
//  BODY TAB
// ════════════════════════════════════════════════════════════════

function renderBody() {
  var h = '<div class="sec sIn">';

  // Weight tracking
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\u2696\uFE0F Body Weight</div>';

  // Input
  h += '<div style="display:flex;gap:6px;margin-bottom:12px">';
  h += '<input type="number" id="bw_input" placeholder="Weight" style="flex:1;padding:8px 10px;font-size:12px;border-radius:8px">';
  h += '<button onclick="addBodyWeight()" class="btn-pri" style="width:auto;padding:8px 16px;margin:0">Log</button></div>';

  // Weight history
  if (S.bodyWeight.length > 0) {
    var recent = S.bodyWeight.slice(-10).reverse();

    // Sparkline
    if (S.bodyWeight.length >= 2) {
      var pts = S.bodyWeight.slice(-20);
      var maxW = Math.max.apply(null, pts.map(function(p){return p.weight;}));
      var minW = Math.min.apply(null, pts.map(function(p){return p.weight;}));
      var range = maxW - minW || 1;
      var w = 280, ht = 50;
      var step = pts.length > 1 ? w / (pts.length - 1) : 0;
      var pathParts = pts.map(function(p,i) {
        var x = i*step;
        var y = ht - ((p.weight-minW)/range)*(ht-4) - 2;
        return (i===0?'M':'L')+x.toFixed(1)+','+y.toFixed(1);
      });
      h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:10px 12px;margin-bottom:10px">';
      h += '<svg width="'+w+'" height="'+ht+'" style="display:block"><path d="'+pathParts.join(' ')+'" fill="none" stroke="#00b4d8" stroke-width="2" stroke-linecap="round"/></svg>';
      h += '<div style="display:flex;justify-content:space-between;font-size:9px;color:#555;margin-top:4px">';
      h += '<span>'+fmtDate(pts[0].date)+': '+pts[0].weight+'</span>';
      h += '<span>'+fmtDate(pts[pts.length-1].date)+': '+pts[pts.length-1].weight+'</span></div></div>';
    }

    recent.forEach(function(bw, idx) {
      var realIdx = S.bodyWeight.length - 1 - idx;
      h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #111">';
      h += '<span style="font-size:11px;color:#ccc">'+bw.weight+' '+S.units+'</span>';
      h += '<div style="display:flex;align-items:center;gap:8px">';
      h += '<span style="font-size:10px;color:#555">'+fmtDate(bw.date)+'</span>';
      h += '<button onclick="deleteBodyWeight('+realIdx+')" style="color:#444;font-size:12px;padding:2px 4px">\u00D7</button></div></div>';
    });
    if (S.bodyWeight.length > 10) {
      h += '<div style="font-size:10px;color:#444;text-align:center;padding:6px 0">Showing last 10 of '+S.bodyWeight.length+' entries</div>';
    }
  } else {
    h += '<div style="font-size:11px;color:#333;padding:8px 0">No weight entries yet.</div>';
  }

  // Settings
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin:20px 0 9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\u2699\uFE0F Settings</div>';

  // Units
  h += '<div style="margin-bottom:10px"><label class="flabel">Weight Unit</label>';
  h += '<div class="seg"><button class="seg-btn'+(S.units==='lbs'?' on':'')+'" onclick="S.units=\'lbs\';saveS();draw()">lbs</button>';
  h += '<button class="seg-btn'+(S.units==='kg'?' on':'')+'" onclick="S.units=\'kg\';saveS();draw()">kg</button></div></div>';

  // Goal
  h += '<div style="margin-bottom:10px"><label class="flabel">Training Goal (default rep ranges)</label>';
  h += '<div class="seg"><button class="seg-btn'+(S.selectedGoal==='strength'?' on':'')+'" onclick="S.selectedGoal=\'strength\';saveS();draw()">Strength</button>';
  h += '<button class="seg-btn'+(S.selectedGoal==='hypertrophy'?' on':'')+'" onclick="S.selectedGoal=\'hypertrophy\';saveS();draw()">Hypertrophy</button>';
  h += '<button class="seg-btn'+(S.selectedGoal==='endurance'?' on':'')+'" onclick="S.selectedGoal=\'endurance\';saveS();draw()">Endurance</button></div></div>';

  // Timer settings
  h += '<div style="margin-bottom:10px"><label class="flabel">Auto-start rest timer</label>';
  h += '<div class="seg"><button class="seg-btn'+(S.autoStartTimer?' on':'')+'" onclick="S.autoStartTimer=true;saveS();draw()">On</button>';
  h += '<button class="seg-btn'+(!S.autoStartTimer?' on':'')+'" onclick="S.autoStartTimer=false;saveS();draw()">Off</button></div></div>';

  h += '<div style="margin-bottom:10px"><label class="flabel">Vibrate on timer end</label>';
  h += '<div class="seg"><button class="seg-btn'+(S.vibrateOnTimerEnd?' on':'')+'" onclick="S.vibrateOnTimerEnd=true;saveS();draw()">On</button>';
  h += '<button class="seg-btn'+(!S.vibrateOnTimerEnd?' on':'')+'" onclick="S.vibrateOnTimerEnd=false;saveS();draw()">Off</button></div></div>';

  // Export/Import
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin:20px 0 9px;padding-bottom:5px;border-bottom:1px solid #1a1a2e">\uD83D\uDCBE Data</div>';
  h += '<button onclick="exportData()" class="btn-sec" style="margin-bottom:6px">Export Data (JSON)</button>';
  h += '<button onclick="document.getElementById(\'import-file\').click()" class="btn-sec">Import Data (JSON)</button>';
  h += '<input type="file" id="import-file" accept=".json" style="display:none" onchange="importData(event)">';

  h += '</div>';
  return h;
}

function addBodyWeight() {
  var el = document.getElementById('bw_input');
  if (!el) return;
  var w = parseFloat(el.value);
  if (isNaN(w) || w <= 0) return;
  S.bodyWeight.push({ date:TODAY, weight:w });
  el.value = '';
  saveS(); draw();
}

function deleteBodyWeight(idx) {
  S.bodyWeight.splice(idx, 1);
  saveS(); draw();
}

// ─── EXPORT / IMPORT ─────────────────────────────────────────
function exportData() {
  var data = JSON.stringify({
    version: 'ip_v1',
    exportDate: new Date().toISOString(),
    workoutHistory: S.workoutHistory,
    templates: S.templates,
    prs: S.prs,
    bodyWeight: S.bodyWeight,
    measurements: S.measurements,
    sorenessLog: S.sorenessLog,
    units: S.units,
    selectedGoal: S.selectedGoal
  }, null, 2);
  var blob = new Blob([data], {type:'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'iron-protocol-backup-'+TODAY+'.json';
  a.click(); URL.revokeObjectURL(url);
}

function importData(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (data.workoutHistory) S.workoutHistory = data.workoutHistory;
      if (data.templates) S.templates = data.templates;
      if (data.prs) S.prs = data.prs;
      if (data.bodyWeight) S.bodyWeight = data.bodyWeight;
      if (data.measurements) S.measurements = data.measurements;
      if (data.sorenessLog) S.sorenessLog = data.sorenessLog;
      if (data.units) S.units = data.units;
      if (data.selectedGoal) S.selectedGoal = data.selectedGoal;
      saveS(); draw();
      alert('Data imported successfully!');
    } catch(err) {
      alert('Error importing data: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ── Module render dispatcher ──
function workoutRender() {
  var tab = S.subTab || "workout";
  switch(tab) {
    case "workout":   return renderWorkout();
    case "history":   return renderHistory();
    case "exercises": return renderExercises();
    case "progress":  return renderProgress();
    case "templates": return renderTemplates();
    case "body":      return renderBody();
    default:          return renderWorkout();
  }
}

// ── Register with router ──
EXC.register("workout", {
  title: "Iron Protocol",
  tabs: [
    {id:"workout", label:"Workout", icon:"🏋️"},
    {id:"history", label:"History", icon:"📋"},
    {id:"exercises", label:"Exercises", icon:"💪"},
    {id:"progress", label:"Progress", icon:"📈"},
    {id:"templates", label:"Templates", icon:"📄"},
    {id:"body", label:"Body", icon:"⚖️"}
  ],
  get subTab() { return S.subTab || "workout"; },
  set subTab(v) { S.subTab = v; },
  render: workoutRender,
  afterRender: function() {
    updateTimerDisplay();
    if (!window._workoutTickInterval) {
      window._workoutTickInterval = setInterval(function() {
        if (!S.activeWorkout) return;
        var el = document.getElementById("workout-elapsed");
        if (el) {
          var elapsed = Date.now() - new Date(S.activeWorkout.startedAt).getTime();
          el.textContent = fmtDuration(elapsed);
        }
      }, 1000);
    }
  }
});

// ── Public API for cross-module access ──
EXC.workout = {
  getSmartWeight: getSmartWeight,
  getMuscleRecovery: getMuscleRecovery,
  getWeeklyVolume: getWeeklyVolume,
  getRecentWorkouts: function(n) { return S.workoutHistory.slice(-(n || 5)); },
  getRecentSoreness: getRecentSoreness,
  getTodaysTemplates: getTodaysTemplates,
  isActive: function() { return !!S.activeWorkout; }
};

// ── Expose onclick functions on window ──
var fns = [
  "go","closeModal","navigateToExerciseDetail",
  "startEmptyWorkout","beginTypedWorkout","startFromTemplate",
  "addExerciseToWorkout","removeExerciseFromWorkout","moveExercise",
  "addSet","removeLastSet","toggleSetComplete","updateSetWeight","updateSetReps",
  "updateSetType","updateSetRPE","toggleExerciseNotes","saveExerciseNotes",
  "completeWorkout","cancelWorkout",
  "startRestTimer","stopRestTimer","addRestTime",
  "openAddExerciseModal","updateExerciseSearch","updateAddExerciseModal",
  "addExerciseToWorkoutKeepOpen",
  "toggleHistory","deleteWorkout","logSoreness","repeatWorkout","clearSoreness",
  "toggleExercise","debouncedExerciseSearch","updateExerciseResults",
  "updateExerciseFiltersAndResults",
  "toggleTemplate","openCreateTemplateModal","createTemplate","deleteTemplate",
  "toggleTemplateDay","removeExerciseFromTemplate",
  "openAddExerciseToTemplateModal","updateTemplateExSearch","addExToTemplate",
  "autoOrderTemplate",
  "addBodyWeight","deleteBodyWeight",
  "exportData","importData","renderWeeklyOverview","renderTemplateAnalysis"
];
fns.forEach(function(name) {
  try { var fn = eval(name); if (typeof fn === "function") window[name] = fn; } catch(e) {}
});

// ── Emit events on key actions ──
var _origComplete = completeWorkout;
completeWorkout = function() {
  var w = S.activeWorkout;
  _origComplete();
  if (w) {
    var muscles = [];
    w.exercises.forEach(function(wex) {
      var ex = findExercise(wex.exerciseId);
      if (ex) ex.musclesPrimary.forEach(function(m) {
        if (muscles.indexOf(m.muscle) < 0) muscles.push(m.muscle);
      });
    });
    EXC.emit("workout.completed", { muscles: muscles, name: w.name });
  }
};
window.completeWorkout = completeWorkout;

})();