// ─── EXCALIBUR OS — Practice Module ─────────────────────────────
// Qi Gong, meditation, breathwork tracking

(function() {

var S = EXC.S.practice;

function saveS() { EXC.save(); }
function draw() { EXC.draw(); }

// ──��� ACTIONS ──────────────────────────────────────────────────

function logSession() {
  var typeEl = document.getElementById('prac_type');
  var formEl = document.getElementById('prac_form');
  var durEl = document.getElementById('prac_dur');
  var qualEl = document.getElementById('prac_qual');
  if (!typeEl || !durEl) return;

  var session = {
    id: genId(),
    type: typeEl.value,
    formId: formEl ? formEl.value : '',
    date: TODAY,
    duration: parseInt(durEl.value) || 15,
    quality: parseInt(qualEl ? qualEl.value : '3'),
    timestamp: new Date().toISOString()
  };
  S.sessions.push(session);
  EXC.emit('practice.completed', { type: session.type, duration: session.duration, quality: session.quality });
  saveS(); draw();
  showToast('Session logged!');
}

function deleteSession(idx) {
  S.sessions.splice(idx, 1);
  saveS(); draw();
}

function getSessionsToday() {
  return S.sessions.filter(function(s) { return s.date === TODAY; });
}

function getTotalMinutesThisWeek() {
  var ws = weekStart(TODAY);
  var total = 0;
  S.sessions.forEach(function(s) {
    if (s.date >= ws && s.date <= TODAY) total += (s.duration || 0);
  });
  return total;
}

// ─── RENDER: TODAY ────────────────────────────────────────────

function renderToday() {
  var h = '<div class="sec sIn">';
  var todaySessions = getSessionsToday();
  var weekMins = getTotalMinutesThisWeek();

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">';
  h += '<div class="sbox"><div class="slbl">Today</div><div class="sval" style="color:' + (todaySessions.length > 0 ? '#38b000' : '#555') + '">' + todaySessions.length + ' session' + (todaySessions.length !== 1 ? 's' : '') + '</div></div>';
  h += '<div class="sbox"><div class="slbl">This Week</div><div class="sval" style="color:#00b4d8">' + weekMins + ' min</div></div>';
  h += '</div>';

  // Quick log form
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-size:9px;color:#00b4d8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Log Practice</div>';

  h += '<select class="finput" id="prac_type" onchange="updatePracticeForms()">';
  h += '<option value="qigong">\uD83E\uDDD8 Qi Gong</option>';
  h += '<option value="meditation">\uD83E\uDDE0 Meditation</option>';
  h += '<option value="breathwork">\uD83C\uDF2C\uFE0F Breathwork</option>';
  h += '</select>';

  h += '<select class="finput" id="prac_form">';
  if (typeof PRACTICE_DB !== 'undefined' && PRACTICE_DB.qigong) {
    PRACTICE_DB.qigong.forEach(function(p) {
      h += '<option value="' + p.id + '">' + p.icon + ' ' + p.name + '</option>';
    });
  }
  h += '</select>';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="flabel">Duration (min)</label><input class="finput" id="prac_dur" type="number" value="15" style="margin:0"></div>';
  h += '<div><label class="flabel">Quality (1-5)</label><select class="finput" id="prac_qual" style="margin:0">';
  for (var q = 1; q <= 5; q++) h += '<option value="' + q + '"' + (q === 3 ? ' selected' : '') + '>' + q + '</option>';
  h += '</select></div></div>';

  h += '<button class="btn-pri" onclick="logSession()">Log Session</button>';
  h += '</div>';

  // Today's sessions
  if (todaySessions.length > 0) {
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Today\'s Sessions</div>';
    todaySessions.forEach(function(s) {
      var prac = typeof findPractice === 'function' ? findPractice(s.formId) : null;
      var globalIdx = S.sessions.indexOf(s);
      h += '<div class="card"><div style="display:flex;align-items:center;gap:8px">';
      h += '<span style="font-size:16px">' + (prac ? prac.icon : '\uD83E\uDDD8') + '</span>';
      h += '<div style="flex:1"><div style="font-size:12px;color:#e0e0f0;font-weight:600">' + (prac ? prac.name : s.type) + '</div>';
      h += '<div style="font-size:10px;color:#555">' + s.duration + ' min \u00b7 Quality ' + s.quality + '/5</div></div>';
      h += '<button onclick="deleteSession(' + globalIdx + ')" style="color:#555;font-size:14px;background:none;border:none;cursor:pointer">\u00d7</button>';
      h += '</div></div>';
    });
  }

  h += '</div>';
  return h;
}

// ─── RENDER: HISTORY ──────────────────────────────────────────

function renderHistory() {
  var h = '<div class="sec sIn">';
  if (S.sessions.length === 0) {
    h += '<div class="empty"><div class="empty-icon">\uD83E\uDDD8</div><div style="color:#555">No practice sessions yet</div></div>';
    return h + '</div>';
  }
  var byDate = {};
  S.sessions.forEach(function(s) { if (!byDate[s.date]) byDate[s.date] = []; byDate[s.date].push(s); });
  Object.keys(byDate).sort().reverse().slice(0, 30).forEach(function(date) {
    var sessions = byDate[date];
    var totalMin = sessions.reduce(function(sum, s) { return sum + (s.duration || 0); }, 0);
    h += '<div style="font-size:9px;color:#555;letter-spacing:1px;margin-top:10px;margin-bottom:4px">' + date + ' \u00b7 ' + totalMin + ' min</div>';
    sessions.forEach(function(s) {
      var prac = typeof findPractice === 'function' ? findPractice(s.formId) : null;
      h += '<div class="card" style="padding:8px 12px">';
      h += '<span style="font-size:13px">' + (prac ? prac.icon : '\uD83E\uDDD8') + '</span> ';
      h += '<span style="font-size:11px;color:#ccc">' + (prac ? prac.name : s.type) + '</span>';
      h += '<span style="font-size:10px;color:#555;float:right">' + s.duration + 'min \u00b7 Q' + s.quality + '</span></div>';
    });
  });
  h += '</div>';
  return h;
}

// ─── RENDER: LIBRARY ──────────────────────────────────────────

function renderLibrary() {
  var h = '<div class="sec sIn">';
  if (typeof PRACTICE_DB === 'undefined') {
    h += '<div class="empty"><div style="color:#555">Practice database loading...</div></div>';
    return h + '</div>';
  }
  var categories = [
    { key:'qigong', label:'\uD83E\uDDD8 Qi Gong', items:PRACTICE_DB.qigong || [] },
    { key:'meditation', label:'\uD83E\uDDE0 Meditation', items:PRACTICE_DB.meditation || [] },
    { key:'breathwork', label:'\uD83C\uDF2C\uFE0F Breathwork', items:PRACTICE_DB.breathwork || [] }
  ];
  categories.forEach(function(cat) {
    h += '<div style="font-size:9px;color:#00b4d8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;margin-top:12px">' + cat.label + '</div>';
    cat.items.forEach(function(p) {
      h += '<div class="card"><div style="display:flex;align-items:center;gap:8px">';
      h += '<span style="font-size:18px">' + p.icon + '</span>';
      h += '<div style="flex:1"><div style="font-size:12px;color:#e0e0f0;font-weight:600">' + p.name + '</div>';
      h += '<div style="font-size:10px;color:#555">' + p.difficulty + ' \u00b7 ' + p.durationMin + '-' + p.durationMax + ' min</div>';
      if (p.cues) h += '<div style="font-size:10px;color:#666;margin-top:4px;line-height:1.5">' + p.cues + '</div>';
      h += '</div></div></div>';
    });
  });
  h += '</div>';
  return h;
}

function updatePracticeForms() {
  var typeEl = document.getElementById('prac_type');
  var formEl = document.getElementById('prac_form');
  if (!typeEl || !formEl || typeof PRACTICE_DB === 'undefined') return;
  var items = PRACTICE_DB[typeEl.value] || [];
  formEl.innerHTML = items.map(function(p) {
    return '<option value="' + p.id + '">' + p.icon + ' ' + p.name + '</option>';
  }).join('');
}

// ── Module render dispatcher ──
function practiceRender() {
  var tab = S.subTab || 'today';
  switch(tab) {
    case 'today':   return renderToday();
    case 'history': return renderHistory();
    case 'library': return renderLibrary();
    default:        return renderToday();
  }
}

// ── Register with router ──
EXC.register('practice', {
  title: 'Practice',
  tabs: [
    {id:'today', label:'Today', icon:'\uD83E\uDDD8'},
    {id:'history', label:'History', icon:'\uD83D\uDCCB'},
    {id:'library', label:'Library', icon:'\uD83D\uDCD6'}
  ],
  get subTab() { return S.subTab || 'today'; },
  set subTab(v) { S.subTab = v; },
  render: practiceRender
});

// ── Public API ──
EXC.practice = {
  getSessions: function(date) { return S.sessions.filter(function(s) { return s.date === date; }); },
  getTotalMinutes: function(days) {
    var cutoff = addDays(TODAY, -(days || 7));
    return S.sessions.filter(function(s) { return s.date >= cutoff; })
      .reduce(function(sum, s) { return sum + (s.duration || 0); }, 0);
  }
};

// ── Window exports ──
var fns = ['logSession','deleteSession','updatePracticeForms'];
fns.forEach(function(name) {
  try { var fn = eval(name); if (typeof fn === 'function') window[name] = fn; } catch(e) {}
});

})();
