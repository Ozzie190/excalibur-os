// ─── EXCALIBUR OS — Dashboard Module ────────────────────────────
// Hub: readiness score, "right now" block, timeline, intel cards, weekly scorecard

(function() {

  function renderReadinessHero() {
    var score = EXC.recovery.getScore();
    var overall = score.overall;
    var color = overall >= 71 ? '#38b000' : overall >= 41 ? '#ffd60a' : '#ff4444';
    var label = overall >= 71 ? 'Ready to Push' : overall >= 41 ? 'Moderate' : 'Recovery Mode';

    var h = '<div style="text-align:center;padding:20px 0 16px">';
    h += '<div class="readiness-ring">';
    h += svgRing(54, overall, color, 6);
    h += '<div class="ring-label">';
    h += '<div class="ring-score" style="color:' + color + '">' + overall + '</div>';
    h += '<div class="ring-subtitle">' + label + '</div>';
    h += '</div></div>';

    // Component breakdown
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:320px;margin:0 auto">';
    var comps = score.components;
    var labels = {sleep:'Sleep',hrv:'HRV',soreness:'Soreness',recovery:'Recovery',strain:'Strain',adherence:'Adherence',practice:'Practice'};
    Object.keys(comps).forEach(function(k) {
      var c = comps[k];
      var cc = c.score >= 70 ? '#38b000' : c.score >= 40 ? '#ffd60a' : '#ff4444';
      h += '<div class="sbox" style="min-width:70px;text-align:center">';
      h += '<div class="slbl">' + (labels[k] || k) + '</div>';
      h += '<div class="sval" style="color:' + cc + '">' + c.score + '</div>';
      h += '</div>';
    });
    h += '</div></div>';
    return h;
  }

  function renderRightNow() {
    var h = '<div style="margin-bottom:12px">';
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">';
    h += '\u23f0 Right Now</div>';

    // Show current time context
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
    h += '<div class="card">';
    h += '<div style="font-size:11px;color:#888">' + timeStr;
    if (isPreWake()) h += ' \u00b7 <span style="color:#9d7fff">\ud83c\udf19 Pre-wake</span>';
    h += '</div>';

    // Supplement status
    var allSupps = EXC.supp.getAllSupps();
    if (allSupps.length > 0) {
      var checked = allSupps.filter(function(s) { return EXC.supp.isChecked(s.id); }).length;
      h += '<div style="margin-top:6px;font-size:11px;color:#ccc">';
      h += '\ud83d\udc8a Supplements: <strong style="color:' + (checked === allSupps.length ? '#38b000' : '#ffd60a') + '">' +
           checked + '/' + allSupps.length + '</strong> checked today';
      h += '</div>';
    }

    // Workout status
    var wo = EXC.S.workout;
    if (wo.activeWorkout) {
      h += '<div style="margin-top:6px;font-size:11px;color:#4cc9f0">\ud83c\udfcb\ufe0f Workout in progress: ' +
           (wo.activeWorkout.name || 'Unnamed') + '</div>';
    } else {
      var todayWorkouts = (wo.workoutHistory || []).filter(function(w) { return w.startedAt && w.startedAt.startsWith(TODAY); });
      if (todayWorkouts.length > 0) {
        h += '<div style="margin-top:6px;font-size:11px;color:#38b000">\u2705 Workout completed today</div>';
      }
    }

    // Habits status
    var habits = EXC.S.habits.definitions || [];
    if (habits.length > 0) {
      var doneCount = habits.filter(function(hab) {
        var key = hab.id + '_' + TODAY;
        var comp = EXC.S.habits.completions[key];
        return comp && comp.completed;
      }).length;
      h += '<div style="margin-top:6px;font-size:11px;color:#ccc">';
      h += '\u2705 Habits: <strong>' + doneCount + '/' + habits.length + '</strong> done</div>';
    }

    h += '</div></div>';
    return h;
  }

  function renderIntelCards() {
    // Evaluate cross-system rules
    var recs = [];
    if (typeof CROSS_RULES !== 'undefined') {
      CROSS_RULES.forEach(function(rule) {
        try {
          if (rule.trigger(EXC.S)) {
            var rec = rule.action(EXC.S);
            rec.ruleId = rule.id;
            recs.push(rec);
          }
        } catch(e) {}
      });
    }

    if (recs.length === 0) return '';

    var h = '<div style="margin-bottom:12px">';
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">';
    h += '\ud83e\udde0 Recovery Intel</div>';

    recs.forEach(function(r) {
      var pClass = r.priority === 'high' ? ' priority-high' : r.priority === 'medium' ? ' priority-medium' : '';
      h += '<div class="intel-card' + pClass + '">';
      h += '<div class="intel-icon">' + (r.icon || '\u2139\ufe0f') + '</div>';
      h += '<div class="intel-body">' + r.message + '</div>';
      h += '</div>';
    });

    h += '</div>';
    return h;
  }

  function renderMuscleRecovery() {
    if (!EXC.workout || !EXC.workout.getMuscleRecovery) return '';
    if (typeof MUSCLE_GROUPS === 'undefined') return '';

    var fatigued = [];
    Object.keys(MUSCLE_GROUPS).forEach(function(mid) {
      var rec = EXC.workout.getMuscleRecovery(mid);
      if (rec.pct < 100) {
        fatigued.push({ id: mid, name: MUSCLE_GROUPS[mid].name, pct: rec.pct, color: rec.color });
      }
    });
    if (fatigued.length === 0) return '';

    fatigued.sort(function(a, b) { return a.pct - b.pct; });

    var h = '<div style="margin-bottom:12px">';
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">';
    h += '\uD83D\uDCAA Muscle Recovery</div>';
    h += '<div class="card" style="cursor:default">';

    fatigued.forEach(function(m) {
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">';
      h += '<span style="font-size:10px;color:#888;width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + m.name + '</span>';
      h += '<div style="flex:1;height:5px;background:#111;border-radius:3px;overflow:hidden">';
      h += '<div style="height:5px;width:' + m.pct + '%;background:' + m.color + ';border-radius:3px;transition:width .3s"></div></div>';
      h += '<span style="font-size:9px;color:' + m.color + ';width:30px;text-align:right">' + m.pct + '%</span>';
      h += '</div>';
    });

    // Ready to train
    var fresh = [];
    Object.keys(MUSCLE_GROUPS).forEach(function(mid) {
      var rec = EXC.workout.getMuscleRecovery(mid);
      if (rec.pct >= 100) fresh.push(MUSCLE_GROUPS[mid].name);
    });
    if (fresh.length > 0 && fresh.length <= 14) {
      h += '<div style="font-size:9px;color:#38b000;margin-top:8px">\u2705 Ready: ' + fresh.slice(0, 6).join(', ');
      if (fresh.length > 6) h += ' +' + (fresh.length - 6) + ' more';
      h += '</div>';
    }

    h += '</div></div>';
    return h;
  }

  function renderWeeklyScorecard() {
    var h = '<div style="margin-bottom:12px">';
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">';
    h += '\ud83d\udcc5 This Week</div>';
    h += '<div class="card" style="cursor:default">';
    h += '<div class="scorecard-grid">';

    var dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var ws = weekStart(TODAY);

    // Day headers
    dayLabels.forEach(function(d) { h += '<div class="day-col">' + d + '</div>'; });

    // Supplement row
    for (var i = 0; i < 7; i++) {
      var date = addDays(ws, i);
      var isFuture = date > TODAY;
      if (isFuture) {
        h += '<div class="dot"></div>';
      } else {
        // Check if any supplements were taken
        var anyChecked = false;
        var supps = EXC.supp.getAllSupps();
        supps.forEach(function(s) {
          if (EXC.S.supp.checks[s.id + '_' + date]) anyChecked = true;
        });
        h += '<div class="dot' + (anyChecked ? ' done' : (date === TODAY ? '' : ' missed')) + '" title="Supps"></div>';
      }
    }

    // Workout row
    for (var j = 0; j < 7; j++) {
      var date2 = addDays(ws, j);
      var isFuture2 = date2 > TODAY;
      if (isFuture2) {
        h += '<div class="dot"></div>';
      } else {
        var hasWorkout = (EXC.S.workout.workoutHistory || []).some(function(w) {
          return w.startedAt && w.startedAt.startsWith(date2);
        });
        h += '<div class="dot' + (hasWorkout ? ' done' : '') + '" title="Train"></div>';
      }
    }

    h += '</div>';
    h += '<div style="display:flex;gap:12px;margin-top:8px;font-size:9px;color:#444">';
    h += '<span>\ud83d\udd35 Row 1: Supps</span><span>\ud83d\udd35 Row 2: Training</span>';
    h += '</div></div></div>';
    return h;
  }

  EXC.register('dashboard', {
    title: 'Excalibur OS',
    tabs: [],
    render: function() {
      var h = '<div class="sec sIn">';
      h += renderReadinessHero();
      h += renderRightNow();
      h += renderMuscleRecovery();
      h += renderIntelCards();
      h += renderWeeklyScorecard();
      h += '</div>';
      return h;
    }
  });

})();
