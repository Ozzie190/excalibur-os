// ─── Science-Based Intelligence Rules ────────────────────────────
// Evidence-based training and supplementation rules.
// Appended to CROSS_RULES at load time — evaluated on dashboard render.

var SCIENCE_RULES = [

  // ── CNS Fatigue: 2+ nights of poor sleep ──
  // Ref: Knowles et al. 2018 — sleep restriction impairs maximal strength 9-20%
  {
    id: 'cns_fatigue_consecutive',
    trigger: function(S) {
      var sleep = S.wearable.sleepData;
      if (sleep.length < 2) return false;
      var recent = sleep.slice(-2);
      return recent.every(function(d) { return d.hours && d.hours < 6; });
    },
    action: function(S) {
      return { icon: '🧠', message: 'Two+ nights under 6h — CNS fatigued. Reduce compound lift intensity 20%, favor isolation and machine work.', priority: 'high', source: 'science' };
    }
  },

  // ── HRV Declining Trend ──
  // Ref: Plews et al. 2013 — HRV-guided training outperforms predetermined plans
  {
    id: 'hrv_declining_trend',
    trigger: function(S) {
      var sleep = S.wearable.sleepData;
      if (sleep.length < 4) return false;
      var recent = sleep.slice(-4).filter(function(d) { return d.hrv > 0; });
      if (recent.length < 3) return false;
      // Check if HRV declining across last 3+ entries
      var declining = true;
      for (var i = 1; i < recent.length; i++) {
        if (recent[i].hrv >= recent[i-1].hrv) { declining = false; break; }
      }
      return declining;
    },
    action: function(S) {
      return { icon: '📉', message: 'HRV declining 3+ days — parasympathetic deficit. Prioritize breathwork, reduce workout frequency this week.', priority: 'high', source: 'science' };
    }
  },

  // ── Creatine + Caffeine Timing Conflict ──
  // Ref: Trexler et al. 2015 — caffeine may blunt creatine uptake if co-ingested
  {
    id: 'creatine_caffeine_spacing',
    trigger: function(S) {
      if (!EXC.supp) return false;
      var supps = EXC.supp.getAllSupps();
      var hasCr = supps.some(function(s) { return s.id === 'creatine' && EXC.supp.isChecked(s.id); });
      var hasCaff = supps.some(function(s) { return (s.id === 'caffeine' || s.name.toLowerCase().indexOf('caffeine') >= 0) && EXC.supp.isChecked(s.id); });
      if (!hasCr || !hasCaff) return false;
      // Check if dose times are within 2h
      var crTime = S.supp.doseTimes['creatine_' + TODAY];
      var caffTime = S.supp.doseTimes['caffeine_' + TODAY];
      if (!crTime || !caffTime) return false;
      var crMin = parseInt(crTime.split(':')[0]) * 60 + parseInt(crTime.split(':')[1]);
      var caffMin = parseInt(caffTime.split(':')[0]) * 60 + parseInt(caffTime.split(':')[1]);
      return Math.abs(crMin - caffMin) < 120;
    },
    action: function(S) {
      return { icon: '☕', message: 'Creatine and caffeine taken within 2h — caffeine may reduce creatine uptake. Separate by 2+ hours for optimal absorption.', priority: 'low', source: 'science' };
    }
  },

  // ── Ashwagandha Cortisol Window ──
  // Ref: Salve et al. 2019 — ashwagandha 2h before bed optimizes cortisol reduction
  {
    id: 'ashwa_timing_cortisol',
    trigger: function(S) {
      if (!EXC.supp) return false;
      var supps = EXC.supp.getAllSupps();
      var ashwa = supps.find(function(s) { return s.id === 'ashwa'; });
      if (!ashwa) return false;
      var ashwaTime = S.supp.doseTimes['ashwa_' + TODAY];
      if (!ashwaTime) return false;
      // Check if taken less than 90min before bed
      var bedMins = parseInt((S.bedTime || '04:00').split(':')[0]) * 60 + parseInt((S.bedTime || '04:00').split(':')[1]);
      var ashwaMins = parseInt(ashwaTime.split(':')[0]) * 60 + parseInt(ashwaTime.split(':')[1]);
      var diff = bedMins - ashwaMins;
      if (diff < 0) diff += 1440; // next day bed
      return diff < 90;
    },
    action: function(S) {
      return { icon: '🌙', message: 'Ashwagandha taken close to bedtime — optimal cortisol reduction window is 2h before bed. Consider moving earlier.', priority: 'low', source: 'science' };
    }
  },

  // ── Post-Workout Protein Window ──
  // Ref: Schoenfeld & Aragon 2018 — MPS elevated for 24h but peaks within ~2h
  {
    id: 'post_workout_protein',
    trigger: function(S) {
      if (!EXC.supp) return false;
      var history = S.workout.workoutHistory || [];
      if (!history.length) return false;
      var last = history[history.length - 1];
      if (!last.completedAt) return false;
      // Workout completed within last 2h
      var elapsed = (Date.now() - new Date(last.completedAt).getTime()) / 3600000;
      if (elapsed > 2 || elapsed < 0) return false;
      // Check if protein supplement exists and not yet checked
      var supps = EXC.supp.getAllSupps();
      var protein = supps.find(function(s) {
        var name = s.name.toLowerCase();
        return name.indexOf('protein') >= 0 || name.indexOf('whey') >= 0 || name.indexOf('amino') >= 0;
      });
      return protein && !EXC.supp.isChecked(protein.id);
    },
    action: function(S) {
      return { icon: '🥛', message: 'Workout completed recently — protein/amino supplement unchecked. MPS peaks within 2h of training.', priority: 'medium', source: 'science' };
    }
  },

  // ── Periodization Deload ──
  // Ref: Zourdos et al. 2016 — auto-regulated training; deload every 4-6 weeks
  {
    id: 'periodization_deload',
    trigger: function(S) {
      var history = S.workout.workoutHistory || [];
      if (history.length < 12) return false;
      // Check last 5 weeks of consistent training without a light week
      var now = Date.now();
      var fiveWeeksAgo = now - (35 * 86400000);
      var recent = history.filter(function(w) {
        return w.startedAt && new Date(w.startedAt).getTime() > fiveWeeksAgo;
      });
      if (recent.length < 12) return false; // not enough sessions
      // Check if any week had notably lower volume (deload)
      var weekVolumes = [0, 0, 0, 0, 0];
      recent.forEach(function(w) {
        var weekIdx = Math.floor((now - new Date(w.startedAt).getTime()) / (7 * 86400000));
        if (weekIdx < 5) {
          var vol = 0;
          (w.exercises || []).forEach(function(ex) {
            (ex.sets || []).forEach(function(s) { if (s.completed) vol += (s.weight || 0) * (s.reps || 0); });
          });
          weekVolumes[weekIdx] += vol;
        }
      });
      var max = Math.max.apply(null, weekVolumes.filter(function(v) { return v > 0; }));
      var hasDeload = weekVolumes.some(function(v) { return v > 0 && v < max * 0.6; });
      return !hasDeload && weekVolumes.filter(function(v) { return v > 0; }).length >= 4;
    },
    action: function(S) {
      return { icon: '📊', message: '4+ weeks of consistent volume without deload — periodization science recommends a light week. Drop volume 40-50%.', priority: 'medium', source: 'science' };
    }
  },

  // ── Supercompensation Window ──
  // Ref: Kiviniemi et al. 2007 — HRV-guided recovery timing
  {
    id: 'supercompensation_window',
    trigger: function(S) {
      var sleep = S.wearable.sleepData;
      if (sleep.length < 3) return false;
      var last = sleep[sleep.length - 1];
      if (!last.sleepScore || last.sleepScore < 80) return false;
      // HRV above personal average
      var avg = 0;
      var count = 0;
      sleep.forEach(function(d) { if (d.hrv > 0) { avg += d.hrv; count++; } });
      if (count < 3) return false;
      avg = avg / count;
      return last.hrv > avg * 1.1; // 10% above baseline
    },
    action: function(S) {
      var last = S.wearable.sleepData[S.wearable.sleepData.length - 1];
      return { icon: '⚡', message: 'Sleep ' + last.sleepScore + ' + HRV above baseline — supercompensation window. Push for PRs today.', priority: 'low', source: 'science' };
    }
  }

];

// Auto-append to CROSS_RULES
if (typeof CROSS_RULES !== 'undefined') {
  CROSS_RULES.push.apply(CROSS_RULES, SCIENCE_RULES);
}
