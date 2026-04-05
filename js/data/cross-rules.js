// ─── Cross-System Intelligence Rules ────────────────────────────
// Declarative rules: trigger → action. Evaluated on dashboard render.
// Each rule has: id, trigger(S), action(S) → {icon, message, priority, source}

var CROSS_RULES = [

  // ── Sleep → Workout ──
  {
    id: 'sleep_low_deload',
    trigger: function(S) {
      var sleep = S.wearable.sleepData;
      if (!sleep.length) return false;
      var last = sleep[sleep.length - 1];
      return last.sleepScore && last.sleepScore < 40;
    },
    action: function(S) {
      var last = S.wearable.sleepData[S.wearable.sleepData.length - 1];
      return { icon: '😴', message: 'Sleep score ' + last.sleepScore + ' — drop working weights 15% or switch to mobility session', priority: 'high', source: 'sleep→workout' };
    }
  },
  {
    id: 'sleep_great_push',
    trigger: function(S) {
      var sleep = S.wearable.sleepData;
      if (!sleep.length) return false;
      var last = sleep[sleep.length - 1];
      return last.sleepScore && last.sleepScore > 85;
    },
    action: function(S) {
      return { icon: '🚀', message: 'Sleep score 85+ — great recovery. Push intensity today.', priority: 'low', source: 'sleep→workout' };
    }
  },

  // ── Soreness → Supplements ──
  {
    id: 'soreness_high_mg',
    trigger: function(S) {
      if (!EXC.recovery) return false;
      return EXC.recovery.getMaxSoreness() >= 4;
    },
    action: function(S) {
      return { icon: '💊', message: 'High soreness detected — MgGly supports muscle recovery via systemic Mg + glycine. Ensure wind-down dose taken.', priority: 'medium', source: 'soreness→supps' };
    }
  },

  // ── Supplement Phase → Workout ──
  {
    id: 'creatine_loading',
    trigger: function(S) {
      if (!EXC.supp || !EXC.supp.getPhase) return false;
      var supps = EXC.supp.getAllSupps();
      var creatine = supps.find(function(s) { return s.id === 'creatine'; });
      if (!creatine || !S.supp.startDates['creatine']) return false;
      var ph = EXC.supp.getPhase(creatine, S.supp.startDates['creatine']);
      return ph && ph.phase === 'Loading';
    },
    action: function(S) {
      var supps = EXC.supp.getAllSupps();
      var creatine = supps.find(function(s) { return s.id === 'creatine'; });
      var ph = EXC.supp.getPhase(creatine, S.supp.startDates['creatine']);
      return { icon: '⚡', message: 'Creatine still loading — full strength benefit expected after ~28 doses. Current: day ' + ph.days + '.', priority: 'low', source: 'supps→workout' };
    }
  },

  // ── Overtraining Detection ──
  {
    id: 'overtraining_risk',
    trigger: function(S) {
      var history = S.workout.workoutHistory || [];
      var weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      var weekStr = weekAgo.toISOString().split('T')[0];
      var thisWeek = history.filter(function(w) { return w.startedAt >= weekStr; });
      if (thisWeek.length < 5) return false;
      var totalRPE = 0, rpeCount = 0;
      thisWeek.forEach(function(w) {
        (w.exercises || []).forEach(function(ex) {
          (ex.sets || []).forEach(function(s) {
            if (s.rpe && s.completed) { totalRPE += s.rpe; rpeCount++; }
          });
        });
      });
      return rpeCount > 0 && (totalRPE / rpeCount) > 8.5;
    },
    action: function(S) {
      return { icon: '⚠️', message: '5+ sessions this week at high RPE — overtraining risk. Consider a full rest day.', priority: 'high', source: 'workout' };
    }
  },

  // ── Practice → Recovery ──
  {
    id: 'practice_bonus',
    trigger: function(S) {
      var sessions = S.practice.sessions || [];
      return sessions.some(function(s) { return s.date === TODAY; });
    },
    action: function(S) {
      return { icon: '🧘', message: 'Practice session today — parasympathetic recovery bonus active.', priority: 'low', source: 'practice→recovery' };
    }
  },

  // ── Low Supplement Adherence ──
  {
    id: 'low_adherence',
    trigger: function(S) {
      if (!EXC.supp) return false;
      var supps = EXC.supp.getAllSupps();
      if (supps.length < 3) return false;
      var checked = supps.filter(function(s) { return EXC.supp.isChecked(s.id); }).length;
      var now = new Date();
      var wakeHour = parseInt((S.wakeTime || '12:00').split(':')[0]);
      // Only trigger if past midpoint of day
      var awake = now.getHours() - wakeHour;
      if (awake < 0) awake += 24;
      return awake > 6 && (checked / supps.length) < 0.3;
    },
    action: function(S) {
      var supps = EXC.supp.getAllSupps();
      var checked = supps.filter(function(s) { return EXC.supp.isChecked(s.id); }).length;
      return { icon: '💊', message: 'Only ' + checked + '/' + supps.length + ' supplements checked — stack adherence below 30%.', priority: 'medium', source: 'supps' };
    }
  },

  // ── Mg Budget Warning ──
  {
    id: 'mg_over_budget',
    trigger: function(S) {
      if (!EXC.supp || !EXC.supp.getMgSources) return false;
      var mg = EXC.supp.getMgSources();
      return mg.total > 450;
    },
    action: function(S) {
      var mg = EXC.supp.getMgSources();
      return { icon: '⚡', message: 'Magnesium load ' + mg.total + 'mg — ' + (mg.total - 420) + 'mg over 420mg ceiling. Watch for GI symptoms.', priority: 'medium', source: 'supps' };
    }
  },

  // ── Ashwagandha Cycle Ending ──
  {
    id: 'ashwa_cycle_ending',
    trigger: function(S) {
      if (!EXC.supp || !EXC.supp.cycleStatus) return false;
      var supps = EXC.supp.getAllSupps();
      var ashwa = supps.find(function(s) { return s.id === 'ashwa'; });
      if (!ashwa || !S.supp.startDates['ashwa']) return false;
      var cs = EXC.supp.cycleStatus(ashwa, S.supp.startDates['ashwa']);
      if (!cs || !cs.on) return false;
      var match = cs.lbl.match(/(\d+)d until rest/);
      return match && parseInt(match[1]) <= 5;
    },
    action: function(S) {
      var supps = EXC.supp.getAllSupps();
      var ashwa = supps.find(function(s) { return s.id === 'ashwa'; });
      var cs = EXC.supp.cycleStatus(ashwa, S.supp.startDates['ashwa']);
      return { icon: '🔄', message: 'Ashwagandha cycle break in ' + cs.lbl.match(/(\d+)d/)[1] + ' days — stress tolerance may drop. Monitor RPE.', priority: 'medium', source: 'supps→workout' };
    }
  }

];
