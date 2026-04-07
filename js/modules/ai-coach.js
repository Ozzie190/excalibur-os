// ─── EXCALIBUR OS — AI Coach Module ──────────────────────────────
// LLM-powered coaching via MiniMax (OpenAI-compatible), Claude, or OpenAI.
// Builds a data packet from all modules, sends for analysis, caches 4h.

(function() {

var S;
var CACHE_DURATION = 4 * 3600000; // 4 hours

function getS() {
  if (!S) S = EXC.S.aiCoach || {};
  return S;
}

// ─── DATA PACKET ─────────────────────────────────────────────

function buildDataPacket() {
  var packet = { timestamp: new Date().toISOString(), today: TODAY };

  // Sleep (last 3 days)
  var sleep = EXC.S.wearable.sleepData || [];
  packet.recentSleep = sleep.slice(-3).map(function(d) {
    return { date: d.date, score: d.sleepScore, hours: d.hours, hrv: d.hrv, quality: d.quality };
  });

  // Readiness
  if (EXC.recovery && EXC.recovery.getScore) {
    var rs = EXC.recovery.getScore();
    packet.readiness = { overall: rs.overall, components: {} };
    if (rs.components) {
      Object.keys(rs.components).forEach(function(k) {
        packet.readiness.components[k] = rs.components[k].score;
      });
    }
  }

  // Recent workouts (last 5)
  var history = EXC.S.workout.workoutHistory || [];
  packet.recentWorkouts = history.slice(-5).map(function(w) {
    var totalVol = 0, rpeSum = 0, rpeCount = 0;
    (w.exercises || []).forEach(function(ex) {
      (ex.sets || []).forEach(function(s) {
        if (s.completed) {
          totalVol += (s.weight || 0) * (s.reps || 0);
          if (s.rpe) { rpeSum += s.rpe; rpeCount++; }
        }
      });
    });
    return {
      name: w.name || 'Unnamed',
      date: w.startedAt ? w.startedAt.split('T')[0] : null,
      exercises: (w.exercises || []).length,
      totalVolume: totalVol,
      avgRPE: rpeCount > 0 ? Math.round(rpeSum / rpeCount * 10) / 10 : null
    };
  });

  // Soreness
  var soreness = EXC.S.workout.sorenessLog || {};
  var soreEntries = {};
  Object.keys(soreness).forEach(function(k) {
    var entry = soreness[k];
    if (entry && entry.level > 0) soreEntries[k] = entry.level;
  });
  if (Object.keys(soreEntries).length > 0) packet.soreness = soreEntries;

  // Supplement adherence
  if (EXC.supp && EXC.supp.getAllSupps) {
    var supps = EXC.supp.getAllSupps();
    var checked = supps.filter(function(s) { return EXC.supp.isChecked(s.id); });
    packet.supplements = {
      total: supps.length,
      checked: checked.length,
      missed: supps.filter(function(s) { return !EXC.supp.isChecked(s.id); }).map(function(s) { return s.name; }).slice(0, 5)
    };

    // Active cycles
    var cycles = [];
    supps.forEach(function(s) {
      if (s.hasCycle && EXC.supp.cycleStatus) {
        var cs = EXC.supp.cycleStatus(s, EXC.S.supp.startDates[s.id]);
        if (cs) cycles.push({ name: s.name, status: cs.lbl });
      }
    });
    if (cycles.length > 0) packet.supplementCycles = cycles;
  }

  // Practice this week
  var sessions = EXC.S.practice.sessions || [];
  var weekSessions = sessions.filter(function(s) { return s.date >= weekStart(TODAY); });
  if (weekSessions.length > 0) {
    packet.practiceThisWeek = weekSessions.map(function(s) {
      return { type: s.type, duration: s.duration, quality: s.quality };
    });
  }

  // Habits
  var habits = EXC.S.habits.definitions || [];
  if (habits.length > 0) {
    var done = habits.filter(function(h) {
      var comp = EXC.S.habits.completions[h.id + '_' + TODAY];
      return comp && comp.completed;
    }).length;
    packet.habits = { total: habits.length, completedToday: done };
  }

  // Muscle recovery (fatigued only)
  if (EXC.workout && EXC.workout.getMuscleRecovery && typeof MUSCLE_GROUPS !== 'undefined') {
    var fatigued = {};
    Object.keys(MUSCLE_GROUPS).forEach(function(mid) {
      var rec = EXC.workout.getMuscleRecovery(mid);
      if (rec.pct < 100) fatigued[MUSCLE_GROUPS[mid].name] = rec.pct + '%';
    });
    if (Object.keys(fatigued).length > 0) packet.muscleRecovery = fatigued;
  }

  return packet;
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────

function getSystemPrompt() {
  return 'You are an evidence-based sports science and biohacking coach integrated into Excalibur OS, a unified health tracking platform. ' +
    'The user tracks supplements (with cycling protocols), workouts (with smart weight progression), sleep, habits, and Qi Gong/meditation practice. ' +
    'Analyze the data packet provided and give actionable coaching. Be concise — 2-4 sentences max. ' +
    'Focus on the most impactful insight right now based on the data. ' +
    'Reference specific numbers from the data (sleep score, readiness, RPE, etc). ' +
    'If readiness is low, suggest specific modifications. If high, encourage pushing. ' +
    'If supplements were missed, note which matter most. ' +
    'Always respond as valid JSON with this exact structure: ' +
    '{"coaching":"your 2-4 sentence recommendation","priority":"high|medium|low","focus":"sleep|workout|supplements|recovery|practice|habits"}';
}

// ─── API CALL ────────────────────────────────────────────────

function getAPIConfig() {
  var s = getS();
  var provider = s.provider || 'minimax';

  if (provider === 'minimax') {
    return {
      endpoint: 'https://api.minimax.io/v1/chat/completions',
      headers: { 'Authorization': 'Bearer ' + s.apiKey, 'Content-Type': 'application/json' },
      model: 'MiniMax-M2.5',
      extractText: function(data) { return data.choices[0].message.content; }
    };
  }
  if (provider === 'claude') {
    return {
      endpoint: 'https://api.anthropic.com/v1/messages',
      headers: { 'x-api-key': s.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' },
      model: 'claude-sonnet-4-20250514',
      isClaude: true,
      extractText: function(data) { return data.content[0].text; }
    };
  }
  // openai
  return {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: { 'Authorization': 'Bearer ' + s.apiKey, 'Content-Type': 'application/json' },
    model: 'gpt-4o-mini',
    extractText: function(data) { return data.choices[0].message.content; }
  };
}

function fetchCoaching() {
  var s = getS();
  if (!s.apiKey) return Promise.resolve(null);

  // Check cache
  if (s.lastResponse && s.lastFetchTs && (Date.now() - s.lastFetchTs) < CACHE_DURATION) {
    return Promise.resolve(s.lastResponse);
  }

  var packet = buildDataPacket();
  var config = getAPIConfig();
  var body;

  if (config.isClaude) {
    body = JSON.stringify({
      model: config.model,
      max_tokens: 500,
      system: getSystemPrompt(),
      messages: [{ role: 'user', content: JSON.stringify(packet) }]
    });
  } else {
    body = JSON.stringify({
      model: config.model,
      max_tokens: 500,
      messages: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: JSON.stringify(packet) }
      ]
    });
  }

  return fetch(config.endpoint, {
    method: 'POST',
    headers: config.headers,
    body: body
  })
  .then(function(r) {
    if (!r.ok) throw new Error('API returned ' + r.status);
    return r.json();
  })
  .then(function(data) {
    var text = config.extractText(data);
    var parsed;
    try {
      // Try to extract JSON from response (may have markdown wrapping)
      var jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { coaching: text, priority: 'medium', focus: 'general' };
    } catch(e) {
      parsed = { coaching: text, priority: 'medium', focus: 'general' };
    }

    s.lastResponse = parsed;
    s.lastFetchTs = Date.now();
    if (!s.history) s.history = [];
    s.history.push({ ts: Date.now(), response: parsed });
    if (s.history.length > 10) s.history = s.history.slice(-10);
    EXC.save();

    return parsed;
  })
  .catch(function(err) {
    console.warn('AI Coach fetch failed:', err);
    return null;
  });
}

// ─── RENDER ──────────────────────────────────────────────────

function renderCoachCard() {
  var s = getS();

  if (!s.apiKey) {
    return '<div class="card" onclick="EXC.openSettings()" style="cursor:pointer;border-color:#9d4edd33">' +
      '<div style="font-size:11px;color:#9d4edd">\uD83E\uDD16 Set up AI Coach in Settings</div>' +
      '<div style="font-size:10px;color:#444;margin-top:2px">Add your API key for personalized coaching</div>' +
      '</div>';
  }

  // Show cached response
  if (s.lastResponse) {
    var r = s.lastResponse;
    var pColor = r.priority === 'high' ? '#ff4444' : r.priority === 'low' ? '#38b000' : '#ffd60a';
    var focusIcons = { sleep:'\uD83D\uDCA4', workout:'\uD83C\uDFCB\uFE0F', supplements:'\uD83D\uDC8A', recovery:'\uD83D\uDCC8', practice:'\uD83E\uDDD8', habits:'\u2705', general:'\uD83E\uDD16' };
    var icon = focusIcons[r.focus] || '\uD83E\uDD16';
    var age = s.lastFetchTs ? Math.round((Date.now() - s.lastFetchTs) / 60000) : 0;
    var ageStr = age < 60 ? age + 'm ago' : Math.round(age / 60) + 'h ago';

    var h = '<div style="background:linear-gradient(135deg,#9d4edd08,#00b4d808);border:1px solid #9d4edd33;border-radius:12px;padding:12px;margin-bottom:12px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    h += '<div style="font-size:9px;color:#9d4edd;letter-spacing:2px;text-transform:uppercase">\uD83E\uDD16 AI Coach</div>';
    h += '<div style="display:flex;gap:6px;align-items:center">';
    h += '<span style="font-size:8px;color:#444">' + ageStr + '</span>';
    h += '<button onclick="event.stopPropagation();refreshCoaching()" style="font-size:9px;color:#9d4edd;background:none;border:1px solid #9d4edd33;border-radius:4px;padding:2px 6px;cursor:pointer">\u21BB</button>';
    h += '</div></div>';
    h += '<div style="display:flex;gap:8px;align-items:flex-start">';
    h += '<span style="font-size:18px;flex-shrink:0">' + icon + '</span>';
    h += '<div style="font-size:11px;color:#ccc;line-height:1.6">' + r.coaching + '</div>';
    h += '</div>';
    h += '<div style="margin-top:6px;display:flex;gap:6px">';
    h += '<span style="font-size:8px;padding:2px 6px;border-radius:8px;background:' + pColor + '22;color:' + pColor + ';border:1px solid ' + pColor + '33">' + (r.priority || 'medium') + '</span>';
    h += '<span style="font-size:8px;padding:2px 6px;border-radius:8px;background:#9d4edd11;color:#9d4edd;border:1px solid #9d4edd22">' + (r.focus || 'general') + '</span>';
    h += '</div></div>';
    return h;
  }

  // Loading / no response yet
  return '<div style="background:#0d0d1a;border:1px solid #9d4edd33;border-radius:12px;padding:12px;margin-bottom:12px">' +
    '<div style="font-size:9px;color:#9d4edd;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">\uD83E\uDD16 AI Coach</div>' +
    '<div style="font-size:11px;color:#555">Loading coaching analysis...</div>' +
    '</div>';
}

function refreshCoaching() {
  var s = getS();
  s.lastFetchTs = 0; // clear cache
  s.lastResponse = null;
  EXC.save();
  EXC.draw();
  // Trigger fetch
  fetchCoaching().then(function() { EXC.draw(); });
}

// ─── PUBLIC API ──────────────────────────────────────────────

EXC.aiCoach = {
  fetchCoaching: fetchCoaching,
  renderCoachCard: renderCoachCard,
  buildDataPacket: buildDataPacket
};

// ── Window exports ──
window.refreshCoaching = refreshCoaching;

})();
