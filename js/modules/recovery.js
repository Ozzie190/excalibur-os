// ─── EXCALIBUR OS — Recovery & Readiness Engine ─────────────────
// Computes daily readiness score from all data sources

(function() {

  function getLastSleep(date) {
    date = date || TODAY;
    var data = EXC.S.wearable.sleepData;
    for (var i = data.length - 1; i >= 0; i--) {
      if (data[i].date === date || data[i].date === addDays(date, -1)) return data[i];
    }
    return null;
  }

  function getAvgHRV(days) {
    var data = EXC.S.wearable.sleepData;
    var vals = [];
    for (var i = data.length - 1; i >= 0 && vals.length < days; i--) {
      if (data[i].hrv) vals.push(data[i].hrv);
    }
    if (vals.length === 0) return null;
    return vals.reduce(function(s,v){return s+v;},0) / vals.length;
  }

  function getMaxSoreness() {
    var log = EXC.S.workout.sorenessLog || {};
    var maxLevel = 0;
    var cutoff = Date.now() - 72 * 3600000; // last 72h
    Object.keys(log).forEach(function(wid) {
      var entry = log[wid];
      if (entry && entry.date) {
        var t = new Date(entry.date).getTime();
        if (t > cutoff && entry.level > maxLevel) maxLevel = entry.level;
      }
    });
    return maxLevel;
  }

  function computeScore(date) {
    date = date || TODAY;
    var components = {
      sleep:     { weight: 0.30, score: 65 },
      hrv:       { weight: 0.15, score: 65 },
      soreness:  { weight: 0.15, score: 80 },
      recovery:  { weight: 0.15, score: 100 },
      strain:    { weight: 0.10, score: 80 },
      adherence: { weight: 0.10, score: 70 },
      practice:  { weight: 0.05, score: 0 }
    };

    // Sleep
    var sleep = getLastSleep(date);
    if (sleep && sleep.sleepScore) components.sleep.score = sleep.sleepScore;

    // HRV
    if (sleep && sleep.hrv) {
      var avgHrv = getAvgHRV(7);
      if (avgHrv) components.hrv.score = Math.min(100, Math.round((sleep.hrv / avgHrv) * 75));
    }

    // Soreness (inverse)
    var maxSore = getMaxSoreness();
    components.soreness.score = Math.max(0, 100 - maxSore * 20);

    // Muscle recovery — uses workout module if available
    if (EXC.workout && EXC.workout.getMuscleRecovery) {
      // Will be wired in Phase 3
    }

    // Strain — recent workout RPE
    var history = EXC.S.workout.workoutHistory || [];
    var recentRPE = [];
    for (var i = history.length - 1; i >= 0 && recentRPE.length < 3; i--) {
      var w = history[i];
      if (w.exercises) {
        var rpes = [];
        w.exercises.forEach(function(ex) {
          (ex.sets || []).forEach(function(s) { if (s.rpe) rpes.push(s.rpe); });
        });
        if (rpes.length) recentRPE.push(rpes.reduce(function(a,b){return a+b;},0) / rpes.length);
      }
    }
    if (recentRPE.length) {
      var avgRPE = recentRPE.reduce(function(a,b){return a+b;},0) / recentRPE.length;
      components.strain.score = Math.max(0, 100 - Math.round(avgRPE * 10));
    }

    // Practice bonus
    var sessions = EXC.S.practice.sessions || [];
    var didPractice = sessions.some(function(s) { return s.date === date; });
    components.practice.score = didPractice ? 100 : 0;

    // Weighted sum
    var total = 0, totalWeight = 0;
    Object.keys(components).forEach(function(k) {
      total += components[k].score * components[k].weight;
      totalWeight += components[k].weight;
    });
    var overall = Math.round(total / totalWeight);

    return { overall: overall, components: components, date: date };
  }

  // Public API
  EXC.recovery = {
    getScore: function(date) {
      date = date || TODAY;
      var cached = EXC.S.recovery.dailyScores[date];
      if (cached && (Date.now() - (cached._ts || 0)) < 300000) return cached; // 5min cache
      var score = computeScore(date);
      score._ts = Date.now();
      EXC.S.recovery.dailyScores[date] = score;
      return score;
    },
    getLastSleep: getLastSleep,
    getAvgHRV: getAvgHRV,
    getMaxSoreness: getMaxSoreness
  };

  // Listen for events that invalidate cache
  EXC.on('sleep.logged', function() { delete EXC.S.recovery.dailyScores[TODAY]; });
  EXC.on('workout.completed', function() { delete EXC.S.recovery.dailyScores[TODAY]; });
  EXC.on('workout.soreness', function() { delete EXC.S.recovery.dailyScores[TODAY]; });
  EXC.on('practice.completed', function() { delete EXC.S.recovery.dailyScores[TODAY]; });

})();
