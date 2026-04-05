// ─── EXCALIBUR OS — Habits Module ───────────────────────────────
// Habit tracking: CRUD, daily check-off, streaks, heat maps, categories

(function() {

var S = EXC.S.habits;

function saveS() { EXC.save(); }
function draw() { EXC.draw(); }

// ─── HELPERS ──────────────────────────────────────────────────

function getHabitById(id) {
  return S.definitions.find(function(h) { return h.id === id; }) || null;
}

function isHabitDue(habit) {
  if (!habit.frequency || habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific_days' && habit.targetDays) {
    return !!habit.targetDays[TODAY_DAY];
  }
  // 'x_per_week': always show, but track against target
  return true;
}

function isCompleted(habitId, date) {
  date = date || TODAY;
  var key = habitId + '_' + date;
  var comp = S.completions[key];
  return comp && comp.completed;
}

function getStreak(habitId) {
  var d = new Date(); d.setHours(0,0,0,0);
  if (!isCompleted(habitId, localDateStr(d))) d.setDate(d.getDate() - 1);
  var streak = 0;
  while (streak < 365) {
    var ds = localDateStr(d);
    if (isCompleted(habitId, ds)) { streak++; }
    else { break; }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function getWeekCount(habitId) {
  var ws = weekStart(TODAY);
  var count = 0;
  for (var i = 0; i < 7; i++) {
    var d = addDays(ws, i);
    if (d > TODAY) break;
    if (isCompleted(habitId, d)) count++;
  }
  return count;
}

// ─── ACTIONS ──────────────────────────────────────────────────

function toggleHabit(id) {
  var key = id + '_' + TODAY;
  if (S.completions[key] && S.completions[key].completed) {
    delete S.completions[key];
  } else {
    S.completions[key] = { completed: true, timestamp: new Date().toISOString() };
    EXC.emit('habit.completed', { id: id, streak: getStreak(id) });
  }
  saveS(); draw();
}

function addHabit() {
  var nameEl = document.getElementById('hab_name');
  var iconEl = document.getElementById('hab_icon');
  var catEl = document.getElementById('hab_cat');
  var freqEl = document.getElementById('hab_freq');
  if (!nameEl || !nameEl.value.trim()) return;
  var habit = {
    id: genId(),
    name: nameEl.value.trim(),
    icon: (iconEl && iconEl.value.trim()) || '✅',
    color: ['#00b4d8','#38b000','#ffd60a','#e63946','#9d4edd','#4cc9f0','#f77f00'][S.definitions.length % 7],
    category: (catEl && catEl.value) || 'Custom',
    frequency: (freqEl && freqEl.value) || 'daily',
    targetDays: {mon:true,tue:true,wed:true,thu:true,fri:true,sat:true,sun:true},
    createdAt: TODAY
  };
  S.definitions.push(habit);
  saveS(); draw();
}

function deleteHabit(id) {
  if (!confirm('Delete this habit?')) return;
  S.definitions = S.definitions.filter(function(h) { return h.id !== id; });
  saveS(); draw();
}

// ─── RENDER: TODAY ────────────────────────────────────────────

function renderToday() {
  var h = '<div class="sec sIn">';
  var dueHabits = S.definitions.filter(isHabitDue);

  if (dueHabits.length === 0) {
    h += '<div class="empty"><div class="empty-icon">✅</div>';
    h += '<div style="color:#555;margin-bottom:8px">No habits defined yet</div>';
    h += '<div style="font-size:10px;color:#333">Go to Manage tab to add habits</div></div>';
    return h + '</div>';
  }

  // Progress summary
  var done = dueHabits.filter(function(hab) { return isCompleted(hab.id); }).length;
  var pct = Math.round((done / dueHabits.length) * 100);
  var pColor = pct >= 80 ? '#38b000' : pct >= 50 ? '#ffd60a' : '#ff6b35';
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:10px;padding:10px 12px;margin-bottom:12px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
  h += '<span style="font-size:11px;color:#888">Today\'s Progress</span>';
  h += '<span style="font-size:14px;font-weight:700;color:' + pColor + '">' + done + '/' + dueHabits.length + '</span></div>';
  h += '<div style="background:#111;border-radius:3px;height:5px"><div style="width:' + pct + '%;height:5px;background:' + pColor + ';border-radius:3px;transition:width .4s"></div></div></div>';

  // Habit cards
  dueHabits.forEach(function(hab) {
    var done = isCompleted(hab.id);
    var streak = getStreak(hab.id);
    h += '<div class="card" onclick="toggleHabit(\'' + hab.id + '\')" style="cursor:pointer;border-color:' + (done ? hab.color + '55' : '#1e1e30') + ';background:' + (done ? 'linear-gradient(135deg,#0d0d1a,rgba(' + rgb(hab.color) + ',.05))' : '#0d0d1a') + '">';
    h += '<div style="display:flex;align-items:center;gap:10px">';
    h += '<div style="width:28px;height:28px;border-radius:50%;background:' + (done ? hab.color : 'transparent') + ';border:2px solid ' + (done ? hab.color : '#333') + ';display:flex;align-items:center;justify-content:center;color:' + (done ? '#000' : '#555') + ';font-size:12px;flex-shrink:0">' + (done ? '✓' : '') + '</div>';
    h += '<span style="font-size:16px">' + hab.icon + '</span>';
    h += '<div style="flex:1">';
    h += '<div style="font-size:13px;font-weight:600;color:' + (done ? hab.color : '#e0e0f0') + '">' + hab.name + '</div>';
    if (streak > 0) h += '<div style="font-size:9px;color:' + (streak >= 30 ? '#38b000' : streak >= 7 ? '#ffd60a' : '#555') + '">🔥 ' + streak + ' day streak</div>';
    h += '</div>';
    if (hab.frequency === 'x_per_week') {
      var wk = getWeekCount(hab.id);
      h += '<span style="font-size:10px;color:#555">' + wk + '/wk</span>';
    }
    h += '</div></div>';
  });

  h += '</div>';
  return h;
}

// ─── RENDER: STREAKS ──────────────────────────────────────────

function renderStreaks() {
  var h = '<div class="sec sIn">';
  var streakData = S.definitions.map(function(hab) {
    return { hab: hab, streak: getStreak(hab.id) };
  }).sort(function(a, b) { return b.streak - a.streak; });

  if (streakData.length === 0) {
    h += '<div class="empty"><div class="empty-icon">🔥</div><div style="color:#555">No habits to track</div></div>';
    return h + '</div>';
  }

  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:10px">🏆 Streak Leaderboard</div>';
  streakData.forEach(function(item, idx) {
    var medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
    var sc = item.streak < 7 ? '#555' : item.streak < 30 ? '#ffd60a' : '#38b000';
    h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #1a1a2e">';
    h += '<span style="font-size:14px;width:20px">' + medal + '</span>';
    h += '<span style="font-size:15px">' + item.hab.icon + '</span>';
    h += '<span style="font-size:11px;color:#aaa;flex:1">' + item.hab.name + '</span>';
    h += '<span style="font-size:13px;font-weight:700;color:' + sc + '">' + (item.streak > 0 ? item.streak + 'd' : '—') + '</span>';
    h += '</div>';
  });

  h += '</div>';
  return h;
}

// ─── RENDER: STATS ────────────────────────────────────────────

function renderStats() {
  var h = '<div class="sec sIn">';

  if (S.definitions.length === 0) {
    h += '<div class="empty"><div class="empty-icon">📊</div><div style="color:#555">Add habits to see stats</div></div>';
    return h + '</div>';
  }

  // 30-day heatmap per habit
  h += '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;color:#e0e0f0;margin-bottom:8px">30-Day Overview</div>';
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';

  var days30 = [];
  for (var i = 29; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    days30.push({ ds: localDateStr(d), label: i % 5 === 0 ? String(d.getDate()) : '' });
  }

  h += '<div style="display:flex;margin-bottom:4px;margin-left:80px">';
  days30.forEach(function(day) { h += '<div style="flex:1;font-size:7px;color:#444;text-align:center">' + day.label + '</div>'; });
  h += '</div>';

  S.definitions.forEach(function(hab) {
    h += '<div style="display:flex;align-items:center;margin-bottom:3px">';
    h += '<div style="width:80px;font-size:9px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:6px">' + hab.icon + ' ' + hab.name + '</div>';
    days30.forEach(function(day) {
      var done = isCompleted(hab.id, day.ds);
      var isFuture = day.ds > TODAY;
      h += '<div style="flex:1;height:12px;background:' + (isFuture ? '#0a0a0f' : done ? hab.color : '#111') + ';opacity:' + (isFuture ? '0' : done ? '1' : '0.5') + ';border-radius:2px;margin:0 1px"></div>';
    });
    h += '</div>';
  });

  h += '</div></div>';
  return h;
}

// ─── RENDER: MANAGE ───────────────────────────────────────────

function renderManage() {
  var h = '<div class="sec sIn">';

  // Add new habit form
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-size:9px;color:#00b4d8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Add New Habit</div>';
  h += '<input class="finput" id="hab_name" placeholder="Habit name (e.g. Cold shower, Read 30min)">';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<input class="finput" id="hab_icon" placeholder="Icon (emoji)" style="margin:0">';
  h += '<select class="finput" id="hab_cat" style="margin:0">';
  S.categories.forEach(function(c) { h += '<option value="' + c + '">' + c + '</option>'; });
  h += '</select></div>';
  h += '<select class="finput" id="hab_freq">';
  h += '<option value="daily">Daily</option>';
  h += '<option value="specific_days">Specific Days</option>';
  h += '<option value="x_per_week">X per Week</option>';
  h += '</select>';
  h += '<button class="btn-pri" onclick="addHabit()">Add Habit</button>';
  h += '</div>';

  // Existing habits
  if (S.definitions.length > 0) {
    h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Your Habits</div>';
    S.definitions.forEach(function(hab) {
      h += '<div class="card" style="display:flex;align-items:center;gap:10px">';
      h += '<span style="font-size:18px">' + hab.icon + '</span>';
      h += '<div style="flex:1">';
      h += '<div style="font-size:12px;color:#e0e0f0;font-weight:600">' + hab.name + '</div>';
      h += '<div style="font-size:9px;color:#555">' + hab.category + ' · ' + hab.frequency + '</div>';
      h += '</div>';
      h += '<button onclick="event.stopPropagation();deleteHabit(\'' + hab.id + '\')" style="color:#ff6b35;font-size:14px;background:none;border:none;cursor:pointer">×</button>';
      h += '</div>';
    });
  }

  h += '</div>';
  return h;
}

// ── Module render dispatcher ──
function habitsRender() {
  var tab = S.subTab || 'today';
  switch(tab) {
    case 'today':   return renderToday();
    case 'streaks': return renderStreaks();
    case 'stats':   return renderStats();
    case 'manage':  return renderManage();
    default:        return renderToday();
  }
}

// ── Register with router ──
EXC.register('habits', {
  title: 'Habits',
  tabs: [
    {id:'today', label:'Today', icon:'✅'},
    {id:'streaks', label:'Streaks', icon:'🔥'},
    {id:'stats', label:'Stats', icon:'📊'},
    {id:'manage', label:'Manage', icon:'⚙️'}
  ],
  get subTab() { return S.subTab || 'today'; },
  set subTab(v) { S.subTab = v; },
  render: habitsRender
});

// ── Window exports ──
var fns = ['toggleHabit','addHabit','deleteHabit'];
fns.forEach(function(name) {
  try { var fn = eval(name); if (typeof fn === 'function') window[name] = fn; } catch(e) {}
});

})();
