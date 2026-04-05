// ─── EXCALIBUR OS — Wearable Module ─────────────────────────────
// Manual sleep/activity entry. API integration in future phase.

(function() {

var S = EXC.S.wearable;

function saveS() { EXC.save(); }
function draw() { EXC.draw(); }

// ─── ACTIONS ──────────────────────────────────────────────────

function logSleep() {
  var hoursEl = document.getElementById('sleep_hours');
  var qualEl = document.getElementById('sleep_qual');
  var hrvEl = document.getElementById('sleep_hrv');
  if (!hoursEl) return;

  var hours = parseFloat(hoursEl.value) || 7;
  var quality = parseInt(qualEl ? qualEl.value : '3');
  var hrvProxy = hrvEl ? hrvEl.value : 'normal';

  var sleepScore = Math.round(Math.min(100, (hours / 8) * 50 + quality * 10));
  var hrvValue = hrvProxy === 'rested' ? 65 : hrvProxy === 'stressed' ? 35 : 50;

  var entry = {
    date: TODAY,
    sleepScore: sleepScore,
    totalSleepMin: Math.round(hours * 60),
    deepSleepMin: Math.round(hours * 60 * 0.2),
    remSleepMin: Math.round(hours * 60 * 0.25),
    hrv: hrvValue,
    restingHR: 0,
    source: 'manual',
    quality: quality,
    hours: hours
  };

  // Replace existing entry for today or push new
  var idx = S.sleepData.findIndex(function(d) { return d.date === TODAY; });
  if (idx >= 0) S.sleepData[idx] = entry;
  else S.sleepData.push(entry);

  EXC.emit('sleep.logged', entry);
  saveS(); draw();
  showToast('Sleep logged!');
}

function deleteSleep(idx) {
  S.sleepData.splice(idx, 1);
  saveS(); draw();
}

// ─── RENDER ───────────────────────────────────────────────────

function renderManualLog() {
  var h = '<div class="sec sIn">';

  // Last night's sleep
  var lastSleep = S.sleepData.find(function(d) { return d.date === TODAY; });
  if (lastSleep) {
    var sc = lastSleep.sleepScore >= 70 ? '#38b000' : lastSleep.sleepScore >= 40 ? '#ffd60a' : '#ff4444';
    h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Last Night\'s Sleep</div>';
    h += '<div style="display:flex;align-items:center;gap:12px">';
    h += svgRing(22, lastSleep.sleepScore, sc, 4);
    h += '<div>';
    h += '<div style="font-size:20px;font-weight:700;color:' + sc + '">' + lastSleep.sleepScore + '</div>';
    h += '<div style="font-size:10px;color:#555">' + (lastSleep.hours || Math.round(lastSleep.totalSleepMin / 60 * 10) / 10) + 'h · Quality ' + (lastSleep.quality || '?') + '/5</div>';
    h += '</div></div></div>';
  }

  // Log form
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-size:9px;color:#00b4d8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">\uD83D\uDCA4 Log Sleep</div>';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="flabel">Hours Slept</label><input class="finput" id="sleep_hours" type="number" step="0.5" value="7" style="margin:0"></div>';
  h += '<div><label class="flabel">Quality (1-5)</label><select class="finput" id="sleep_qual" style="margin:0">';
  for (var q = 1; q <= 5; q++) h += '<option value="' + q + '"' + (q === 3 ? ' selected' : '') + '>' + q + ' \u2014 ' + ['Poor','Below avg','Average','Good','Excellent'][q-1] + '</option>';
  h += '</select></div></div>';

  h += '<label class="flabel">How do you feel? (HRV proxy)</label>';
  h += '<div class="seg" id="hrv-seg">';
  h += '<button class="seg-btn" onclick="setHrvProxy(\'stressed\')">Stressed</button>';
  h += '<button class="seg-btn on" onclick="setHrvProxy(\'normal\')">Normal</button>';
  h += '<button class="seg-btn" onclick="setHrvProxy(\'rested\')">Rested</button>';
  h += '</div>';
  h += '<input type="hidden" id="sleep_hrv" value="normal">';

  h += '<button class="btn-pri" onclick="logSleep()" style="margin-top:8px">Log Sleep</button>';
  h += '</div>';

  // History
  if (S.sleepData.length > 0) {
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Sleep History</div>';
    for (var i = S.sleepData.length - 1; i >= Math.max(0, S.sleepData.length - 14); i--) {
      var d = S.sleepData[i];
      var sc2 = d.sleepScore >= 70 ? '#38b000' : d.sleepScore >= 40 ? '#ffd60a' : '#ff4444';
      h += '<div class="card" style="display:flex;align-items:center;gap:10px;padding:8px 12px">';
      h += '<span style="font-size:10px;color:#555;width:70px">' + d.date + '</span>';
      h += '<span style="font-size:13px;font-weight:700;color:' + sc2 + '">' + d.sleepScore + '</span>';
      h += '<span style="font-size:10px;color:#666;flex:1">' + (d.hours || Math.round(d.totalSleepMin / 60 * 10) / 10) + 'h · HRV ' + (d.hrv || '?') + '</span>';
      h += '<button onclick="deleteSleep(' + i + ')" style="color:#444;font-size:12px;background:none;border:none;cursor:pointer">\u00d7</button>';
      h += '</div>';
    }
  }

  h += '</div>';
  return h;
}

function setHrvProxy(val) {
  var el = document.getElementById('sleep_hrv');
  if (el) el.value = val;
  document.querySelectorAll('#hrv-seg .seg-btn').forEach(function(b, i) {
    b.classList.toggle('on', ['stressed','normal','rested'][i] === val);
  });
}

// ── Register ──
// Wearable is not in the bottom nav but accessible from settings/hub
// For now, register it as a hidden module accessible via direct URL
EXC.register('wearable', {
  title: 'Sleep & Wearable',
  tabs: [],
  render: renderManualLog
});

// ── Public API ──
EXC.wearable = {
  getLastSleep: function(date) {
    date = date || TODAY;
    for (var i = S.sleepData.length - 1; i >= 0; i--) {
      if (S.sleepData[i].date === date || S.sleepData[i].date === addDays(date, -1)) return S.sleepData[i];
    }
    return null;
  },
  logSleep: logSleep
};

// ── Window exports ──
var fns = ['logSleep','deleteSleep','setHrvProxy'];
fns.forEach(function(name) {
  try { var fn = eval(name); if (typeof fn === 'function') window[name] = fn; } catch(e) {}
});

})();
