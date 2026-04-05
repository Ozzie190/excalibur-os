// ─── EXCALIBUR OS — Insights Module ─────────────────────────────
// Cross-system analytics, trends, data export

(function() {

function renderOverview() {
  var h = '<div class="sec sIn">';

  // Readiness trend (last 7 days)
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:8px">Readiness Trend</div>';

  var scores = [];
  for (var i = 6; i >= 0; i--) {
    var d = addDays(TODAY, -i);
    var score = EXC.recovery.getScore(d);
    scores.push({ date: d, score: score.overall });
  }

  h += '<div style="display:flex;align-items:flex-end;gap:4px;height:60px;margin-bottom:6px">';
  scores.forEach(function(s) {
    var pct = Math.max(5, s.score);
    var color = s.score >= 71 ? '#38b000' : s.score >= 41 ? '#ffd60a' : '#ff4444';
    h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">';
    h += '<div style="font-size:8px;color:' + color + '">' + s.score + '</div>';
    h += '<div style="width:100%;height:' + pct + '%;min-height:3px;background:' + color + ';border-radius:3px 3px 0 0;transition:height .3s"></div>';
    h += '</div>';
  });
  h += '</div>';
  h += '<div style="display:flex;gap:4px">';
  scores.forEach(function(s) {
    var dayLabel = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', {weekday:'short'}).slice(0,2);
    h += '<div style="flex:1;text-align:center;font-size:8px;color:#444">' + dayLabel + '</div>';
  });
  h += '</div></div>';

  // Weekly summary
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:8px">This Week</div>';

  var ws = weekStart(TODAY);
  var workoutsThisWeek = (EXC.S.workout.workoutHistory || []).filter(function(w) { return w.startedAt >= ws; }).length;
  var sleepEntries = (EXC.S.wearable.sleepData || []).filter(function(d) { return d.date >= ws; });
  var avgSleep = sleepEntries.length > 0 ? Math.round(sleepEntries.reduce(function(s, d) { return s + d.sleepScore; }, 0) / sleepEntries.length) : null;
  var practiceMin = EXC.practice ? EXC.practice.getTotalMinutes(7) : 0;

  h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">';
  h += '<div class="sbox"><div class="slbl">Workouts</div><div class="sval" style="color:#4cc9f0">' + workoutsThisWeek + '</div></div>';
  h += '<div class="sbox"><div class="slbl">Avg Sleep</div><div class="sval" style="color:' + (avgSleep && avgSleep >= 70 ? '#38b000' : '#ffd60a') + '">' + (avgSleep || '—') + '</div></div>';
  h += '<div class="sbox"><div class="slbl">Practice</div><div class="sval" style="color:#9d4edd">' + practiceMin + 'm</div></div>';
  h += '</div></div>';

  // Sleep data hint if no data
  if (EXC.S.wearable.sleepData.length === 0) {
    h += '<div class="card" onclick="EXC.go(\'wearable\')" style="cursor:pointer;border-color:#00b4d833">';
    h += '<div style="font-size:11px;color:#00b4d8">\uD83D\uDCA4 Log your sleep to activate the full intelligence engine</div>';
    h += '<div style="font-size:10px;color:#555;margin-top:2px">Tap to go to Sleep & Wearable module</div>';
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function renderExport() {
  var h = '<div class="sec sIn">';
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:8px">\uD83D\uDCE4 Data Export</div>';
  h += '<div style="font-size:11px;color:#666;margin-bottom:12px;line-height:1.6">Export all your Excalibur OS data as a JSON backup file. This includes supplements, workouts, habits, practice sessions, sleep data, and all settings.</div>';
  h += '<button class="btn-pri" onclick="EXC.exportData()">Export Full Backup</button>';
  h += '<button class="btn-sec" onclick="EXC.importData()">Import Backup</button>';
  h += '</div></div>';
  return h;
}

function insightsRender() {
  var tab = EXC.S.section === 'insights' ? 'overview' : 'overview';
  // For now, just show overview + export
  return renderOverview() + renderExport();
}

EXC.register('insights', {
  title: 'Insights',
  tabs: [],
  render: insightsRender
});

})();
