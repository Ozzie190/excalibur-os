// ─── EXCALIBUR OS — Wearable Module ─────────────────────────────
// Sleep/activity tracking. Manual entry, Google Fit OAuth, data import.

(function() {

var S = EXC.S.wearable;

function saveS() { EXC.save(); }
function draw() { EXC.draw(); }

// ─── MANUAL SLEEP LOGGING ────────────────────────────────────

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

// ─── GOOGLE FIT OAUTH2 ──────────────────────────────────────

function initiateGoogleFitAuth() {
  var clientId = S.googleFitClientId;
  if (!clientId) {
    showToast('Enter Google Client ID first');
    return;
  }
  var redirectUri = window.location.origin + window.location.pathname;
  var scope = [
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.activity.read'
  ].join(' ');
  var url = 'https://accounts.google.com/o/oauth2/v2/auth' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&response_type=token' +
    '&scope=' + encodeURIComponent(scope) +
    '&prompt=consent';
  window.location.href = url;
}

function handleOAuthCallback() {
  var hash = window.location.hash;
  if (!hash || hash.indexOf('access_token') < 0) return false;
  var params = {};
  hash.substring(1).split('&').forEach(function(p) {
    var kv = p.split('=');
    params[kv[0]] = decodeURIComponent(kv[1] || '');
  });
  if (params.access_token) {
    S.googleFitToken = params.access_token;
    S.lastSync = new Date().toISOString();
    saveS();
    // Clean URL
    history.replaceState(null, '', window.location.pathname + window.location.search);
    showToast('Google Fit connected!');
    syncGoogleFit();
    return true;
  }
  return false;
}

function syncGoogleFit() {
  if (!S.googleFitToken) return;

  var now = Date.now();
  var weekAgo = now - (7 * 86400000);

  // Fetch sleep sessions
  fetch('https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=' +
    new Date(weekAgo).toISOString() + '&endTime=' + new Date(now).toISOString() +
    '&activityType=72', {
    headers: { 'Authorization': 'Bearer ' + S.googleFitToken }
  })
  .then(function(r) {
    if (r.status === 401) {
      S.googleFitToken = null;
      saveS();
      showToast('Google Fit token expired — reconnect');
      draw();
      return null;
    }
    return r.json();
  })
  .then(function(data) {
    if (!data || !data.session) return;
    var imported = 0;
    data.session.forEach(function(session) {
      var startMs = parseInt(session.startTimeMillis);
      var endMs = parseInt(session.endTimeMillis);
      var date = localDateStr(new Date(endMs)); // date of waking
      var totalMin = Math.round((endMs - startMs) / 60000);
      var hours = Math.round(totalMin / 6) / 10; // 1 decimal

      // Don't overwrite manual entries
      var existing = S.sleepData.find(function(d) { return d.date === date; });
      if (existing && existing.source === 'manual') return;

      var entry = {
        date: date,
        sleepScore: Math.round(Math.min(100, (hours / 8) * 60 + 20)), // estimate
        totalSleepMin: totalMin,
        deepSleepMin: Math.round(totalMin * 0.2),
        remSleepMin: Math.round(totalMin * 0.25),
        hrv: 0,
        restingHR: 0,
        source: 'googlefit',
        hours: hours
      };

      if (existing) {
        var idx = S.sleepData.indexOf(existing);
        S.sleepData[idx] = entry;
      } else {
        S.sleepData.push(entry);
      }
      imported++;
    });

    // Also fetch heart rate for HRV estimate
    return fetchHeartRate(weekAgo, now).then(function() {
      if (imported > 0) {
        S.lastSync = new Date().toISOString();
        saveS(); draw();
        showToast('Synced ' + imported + ' sleep sessions from Google Fit');
      } else {
        showToast('Google Fit sync complete — no new data');
      }
    });
  })
  .catch(function(err) {
    console.warn('Google Fit sync error:', err);
    showToast('Sync failed — check connection');
  });
}

function fetchHeartRate(startMs, endMs) {
  if (!S.googleFitToken) return Promise.resolve();
  return fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + S.googleFitToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName: 'com.google.heart_rate.bpm' }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startMs,
      endTimeMillis: endMs
    })
  })
  .then(function(r) { return r.ok ? r.json() : null; })
  .then(function(data) {
    if (!data || !data.bucket) return;
    data.bucket.forEach(function(bucket) {
      var date = localDateStr(new Date(parseInt(bucket.startTimeMillis)));
      var sleepEntry = S.sleepData.find(function(d) { return d.date === date; });
      if (!sleepEntry) return;
      bucket.dataset.forEach(function(ds) {
        ds.point.forEach(function(pt) {
          pt.value.forEach(function(v) {
            if (v.fpVal && !sleepEntry.restingHR) {
              sleepEntry.restingHR = Math.round(v.fpVal);
              // Rough HRV estimate from resting HR (inverse relationship)
              if (!sleepEntry.hrv || sleepEntry.hrv === 0) {
                sleepEntry.hrv = Math.max(20, Math.min(100, Math.round(120 - v.fpVal)));
              }
            }
          });
        });
      });
    });
  })
  .catch(function() { /* heart rate is optional */ });
}

function disconnectGoogleFit() {
  S.googleFitToken = null;
  saveS(); draw();
  showToast('Google Fit disconnected');
}

// ─── DATA IMPORT ─────────────────────────────────────────────

function importSleepData() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.csv';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var text = ev.target.result;
        var imported = 0;

        if (file.name.endsWith('.csv')) {
          imported = importCSV(text);
        } else {
          imported = importJSON(text);
        }

        if (imported > 0) {
          saveS(); draw();
          showToast('Imported ' + imported + ' sleep entries');
        } else {
          showToast('No new data found in file');
        }
      } catch(err) {
        showToast('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function importJSON(text) {
  var data = JSON.parse(text);
  var entries = [];

  // Handle array of entries directly
  if (Array.isArray(data)) {
    entries = data;
  }
  // Health Connect export format
  else if (data.sleepSessions || data.sleep) {
    entries = (data.sleepSessions || data.sleep).map(function(s) {
      var totalMin = s.durationMinutes || s.totalSleepMin || Math.round(((s.endTime || 0) - (s.startTime || 0)) / 60000);
      return {
        date: s.date || (s.endTime ? localDateStr(new Date(s.endTime)) : TODAY),
        totalSleepMin: totalMin,
        hours: Math.round(totalMin / 6) / 10,
        hrv: s.hrv || s.heartRateVariability || 0,
        restingHR: s.restingHR || s.restingHeartRate || 0,
        deepSleepMin: s.deepSleepMin || s.deepSleepDuration || 0,
        remSleepMin: s.remSleepMin || s.remSleepDuration || 0
      };
    });
  }
  // Circular Ring format
  else if (data.nights || data.data) {
    entries = (data.nights || data.data).map(function(n) {
      return {
        date: n.date || n.night_date || TODAY,
        totalSleepMin: n.total_sleep_duration || n.totalSleepMin || 0,
        hours: (n.total_sleep_duration || n.totalSleepMin || 0) / 60,
        hrv: n.average_hrv || n.hrv || 0,
        restingHR: n.average_hr || n.restingHR || 0,
        deepSleepMin: n.deep_sleep_duration || n.deepSleepMin || 0,
        remSleepMin: n.rem_sleep_duration || n.remSleepMin || 0
      };
    });
  }
  // Single entry
  else if (data.date || data.sleepScore || data.totalSleepMin) {
    entries = [data];
  }

  var imported = 0;
  entries.forEach(function(e) {
    if (!e.date) return;
    var existing = S.sleepData.find(function(d) { return d.date === e.date; });
    if (existing && existing.source === 'manual') return; // don't overwrite manual

    var hours = e.hours || (e.totalSleepMin ? Math.round(e.totalSleepMin / 6) / 10 : 7);
    var entry = {
      date: e.date,
      sleepScore: e.sleepScore || Math.round(Math.min(100, (hours / 8) * 60 + 20)),
      totalSleepMin: e.totalSleepMin || Math.round(hours * 60),
      deepSleepMin: e.deepSleepMin || Math.round(hours * 60 * 0.2),
      remSleepMin: e.remSleepMin || Math.round(hours * 60 * 0.25),
      hrv: e.hrv || 0,
      restingHR: e.restingHR || 0,
      source: 'import',
      quality: e.quality || 0,
      hours: hours
    };

    if (existing) {
      S.sleepData[S.sleepData.indexOf(existing)] = entry;
    } else {
      S.sleepData.push(entry);
    }
    imported++;
  });
  return imported;
}

function importCSV(text) {
  var lines = text.trim().split('\n');
  if (lines.length < 2) return 0;
  var headers = lines[0].toLowerCase().split(',').map(function(h) { return h.trim().replace(/"/g, ''); });
  var dateCol = headers.indexOf('date');
  if (dateCol < 0) dateCol = headers.indexOf('night_date');
  if (dateCol < 0) return 0;

  var imported = 0;
  for (var i = 1; i < lines.length; i++) {
    var cols = lines[i].split(',').map(function(c) { return c.trim().replace(/"/g, ''); });
    var date = cols[dateCol];
    if (!date || date.length < 8) continue;

    // Normalize date format to YYYY-MM-DD
    if (date.indexOf('/') >= 0) {
      var parts = date.split('/');
      if (parts[2].length === 4) date = parts[2] + '-' + ('0'+parts[0]).slice(-2) + '-' + ('0'+parts[1]).slice(-2);
    }

    var getValue = function(name) {
      var idx = headers.indexOf(name);
      return idx >= 0 ? parseFloat(cols[idx]) || 0 : 0;
    };

    var totalMin = getValue('total_sleep_duration') || getValue('totalsleepmin') || getValue('duration');
    var hours = totalMin > 0 ? Math.round(totalMin / 6) / 10 : getValue('hours') || 7;
    if (totalMin === 0) totalMin = Math.round(hours * 60);

    var existing = S.sleepData.find(function(d) { return d.date === date; });
    if (existing && existing.source === 'manual') continue;

    var entry = {
      date: date,
      sleepScore: getValue('sleep_score') || getValue('sleepscore') || Math.round(Math.min(100, (hours / 8) * 60 + 20)),
      totalSleepMin: totalMin,
      deepSleepMin: getValue('deep_sleep_duration') || getValue('deepsleepmin') || Math.round(totalMin * 0.2),
      remSleepMin: getValue('rem_sleep_duration') || getValue('remsleepmin') || Math.round(totalMin * 0.25),
      hrv: getValue('average_hrv') || getValue('hrv'),
      restingHR: getValue('average_hr') || getValue('restinghr') || getValue('resting_heart_rate'),
      source: 'import',
      hours: hours
    };

    if (existing) {
      S.sleepData[S.sleepData.indexOf(existing)] = entry;
    } else {
      S.sleepData.push(entry);
    }
    imported++;
  }
  return imported;
}

function pasteSleepData() {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    showToast('Clipboard not available — use Import File instead');
    return;
  }
  navigator.clipboard.readText().then(function(text) {
    if (!text || !text.trim()) {
      showToast('Clipboard is empty');
      return;
    }
    try {
      var imported = importJSON(text);
      if (imported > 0) {
        saveS(); draw();
        showToast('Imported ' + imported + ' entries from clipboard');
      } else {
        showToast('No sleep data found in clipboard');
      }
    } catch(e) {
      showToast('Could not parse clipboard data');
    }
  }).catch(function() {
    showToast('Clipboard access denied');
  });
}

// ─── RENDER: CONNECT ─────────────────────────────────────────

function renderConnect() {
  var h = '<div class="sec sIn">';

  // Status overview
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-size:9px;color:#00b4d8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Connection Status</div>';

  var dataCount = S.sleepData.length;
  var sources = {};
  S.sleepData.forEach(function(d) { sources[d.source || 'unknown'] = (sources[d.source || 'unknown'] || 0) + 1; });
  h += '<div style="font-size:12px;color:#e0e0f0;margin-bottom:4px">' + dataCount + ' sleep entries</div>';
  Object.keys(sources).forEach(function(src) {
    var color = src === 'manual' ? '#ffd60a' : src === 'googlefit' ? '#4285f4' : src === 'import' ? '#9d4edd' : '#555';
    h += '<span style="font-size:9px;padding:2px 6px;border-radius:8px;background:' + color + '22;color:' + color + ';border:1px solid ' + color + '33;margin-right:4px">' + src + ': ' + sources[src] + '</span>';
  });
  if (S.lastSync) {
    h += '<div style="font-size:9px;color:#444;margin-top:6px">Last sync: ' + new Date(S.lastSync).toLocaleString() + '</div>';
  }
  h += '</div>';

  // Google Fit
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
  h += '<span style="font-size:18px">\uD83C\uDFCB\uFE0F</span>';
  h += '<div><div style="font-size:12px;color:#e0e0f0;font-weight:600">Google Fit</div>';
  h += '<div style="font-size:9px;color:#555">Reads sleep & heart rate from Health Connect via Google Fit</div></div></div>';

  if (S.googleFitToken) {
    h += '<div style="display:flex;gap:8px">';
    h += '<button class="btn-pri" onclick="syncGoogleFit()" style="flex:1">Sync Now</button>';
    h += '<button class="btn-sec" onclick="disconnectGoogleFit()">Disconnect</button>';
    h += '</div>';
  } else {
    h += '<div class="flabel">Google OAuth Client ID</div>';
    h += '<input class="finput" id="gfit_client_id" value="' + (S.googleFitClientId || '') + '" placeholder="xxxx.apps.googleusercontent.com" onchange="saveGFitClientId(this.value)">';
    h += '<button class="btn-pri" onclick="initiateGoogleFitAuth()">Connect Google Fit</button>';
    h += '<div style="font-size:9px;color:#444;margin-top:6px;line-height:1.6">';
    h += 'Requires Google Cloud project with Fitness API enabled. ';
    h += 'Circular Ring → Health Connect → Google Fit → Excalibur OS.</div>';
  }
  h += '</div>';

  // Import
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
  h += '<span style="font-size:18px">\uD83D\uDCE5</span>';
  h += '<div><div style="font-size:12px;color:#e0e0f0;font-weight:600">Import Data</div>';
  h += '<div style="font-size:9px;color:#555">JSON or CSV from Circular, Health Connect, or any sleep tracker</div></div></div>';
  h += '<div style="display:flex;gap:8px">';
  h += '<button class="btn-sec" onclick="importSleepData()" style="flex:1">\uD83D\uDCC1 Import File</button>';
  h += '<button class="btn-sec" onclick="pasteSleepData()" style="flex:1">\uD83D\uDCCB Paste Data</button>';
  h += '</div>';
  h += '<div style="font-size:9px;color:#444;margin-top:6px;line-height:1.6">';
  h += 'Accepts JSON arrays, Health Connect exports, Circular exports, or CSV with columns: date, total_sleep_duration, hrv, average_hr</div>';
  h += '</div>';

  // Sample format
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-size:9px;color:#555;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Expected JSON Format</div>';
  h += '<pre style="font-size:9px;color:#666;background:#080812;border-radius:6px;padding:8px;overflow-x:auto;white-space:pre-wrap;margin:0">[{\n  "date": "2026-04-06",\n  "totalSleepMin": 420,\n  "hrv": 58,\n  "restingHR": 52,\n  "deepSleepMin": 90,\n  "remSleepMin": 105\n}]</pre>';
  h += '</div>';

  h += '</div>';
  return h;
}

function saveGFitClientId(val) {
  S.googleFitClientId = val;
  saveS();
}

// ─── RENDER: MANUAL LOG ──────────────────────────────────────

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
    h += '<div style="font-size:10px;color:#555">' + (lastSleep.hours || Math.round(lastSleep.totalSleepMin / 60 * 10) / 10) + 'h';
    if (lastSleep.quality) h += ' \u00b7 Quality ' + lastSleep.quality + '/5';
    if (lastSleep.hrv > 0) h += ' \u00b7 HRV ' + lastSleep.hrv;
    if (lastSleep.restingHR > 0) h += ' \u00b7 RHR ' + lastSleep.restingHR;
    h += '</div>';
    h += '<div style="font-size:8px;color:#444;margin-top:1px">Source: ' + (lastSleep.source || 'manual') + '</div>';
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

  h += '</div>';
  return h;
}

// ─── RENDER: HISTORY ─────────────────────────────────────────

function renderHistory() {
  var h = '<div class="sec sIn">';

  if (S.sleepData.length === 0) {
    h += '<div class="empty"><div class="empty-icon">\uD83D\uDCA4</div><div style="color:#555">No sleep data yet</div>';
    h += '<div style="font-size:10px;color:#333;margin-top:4px">Log manually or connect a wearable</div></div>';
    return h + '</div>';
  }

  // 7-day trend chart
  h += '<div style="background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:12px;margin-bottom:12px">';
  h += '<div style="font-size:9px;color:#00b4d8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Sleep Trend</div>';
  h += '<div style="display:flex;align-items:flex-end;gap:4px;height:60px;margin-bottom:6px">';
  for (var i = 6; i >= 0; i--) {
    var d = addDays(TODAY, -i);
    var entry = S.sleepData.find(function(s) { return s.date === d; });
    var score = entry ? entry.sleepScore : 0;
    var pct = Math.max(5, score);
    var color = score >= 70 ? '#38b000' : score >= 40 ? '#ffd60a' : score > 0 ? '#ff4444' : '#1a1a2e';
    h += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">';
    h += '<div style="font-size:8px;color:' + (score > 0 ? color : '#222') + '">' + (score || '\u2014') + '</div>';
    h += '<div style="width:100%;height:' + pct + '%;min-height:3px;background:' + color + ';border-radius:3px 3px 0 0;transition:height .3s"></div>';
    h += '</div>';
  }
  h += '</div>';
  h += '<div style="display:flex;gap:4px">';
  for (var j = 6; j >= 0; j--) {
    var d2 = addDays(TODAY, -j);
    var dayLabel = new Date(d2 + 'T12:00:00').toLocaleDateString('en-US', {weekday:'short'}).slice(0,2);
    h += '<div style="flex:1;text-align:center;font-size:8px;color:#444">' + dayLabel + '</div>';
  }
  h += '</div></div>';

  // History list
  h += '<div style="font-size:9px;color:#555;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Sleep History</div>';
  var sorted = S.sleepData.slice().sort(function(a, b) { return b.date.localeCompare(a.date); });
  sorted.slice(0, 30).forEach(function(d, idx) {
    var sc2 = d.sleepScore >= 70 ? '#38b000' : d.sleepScore >= 40 ? '#ffd60a' : '#ff4444';
    var srcColor = d.source === 'manual' ? '#ffd60a' : d.source === 'googlefit' ? '#4285f4' : '#9d4edd';
    var globalIdx = S.sleepData.indexOf(d);
    h += '<div class="card" style="display:flex;align-items:center;gap:10px;padding:8px 12px">';
    h += '<span style="font-size:10px;color:#555;width:70px">' + d.date + '</span>';
    h += '<span style="font-size:13px;font-weight:700;color:' + sc2 + '">' + d.sleepScore + '</span>';
    h += '<span style="font-size:10px;color:#666;flex:1">' + (d.hours || Math.round(d.totalSleepMin / 60 * 10) / 10) + 'h';
    if (d.hrv > 0) h += ' \u00b7 HRV ' + d.hrv;
    if (d.restingHR > 0) h += ' \u00b7 RHR ' + d.restingHR;
    h += '</span>';
    h += '<span style="font-size:7px;color:' + srcColor + '">' + (d.source || '?') + '</span>';
    h += '<button onclick="deleteSleep(' + globalIdx + ')" style="color:#444;font-size:12px;background:none;border:none;cursor:pointer">\u00d7</button>';
    h += '</div>';
  });

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

// ── Module render dispatcher ──
function wearableRender() {
  var tab = S.subTab || 'log';
  switch(tab) {
    case 'connect': return renderConnect();
    case 'log':     return renderManualLog();
    case 'history': return renderHistory();
    default:        return renderManualLog();
  }
}

// ── Register ──
EXC.register('wearable', {
  title: 'Sleep & Wearable',
  tabs: [
    {id:'log', label:'Log', icon:'\uD83D\uDCA4'},
    {id:'history', label:'History', icon:'\uD83D\uDCCA'},
    {id:'connect', label:'Connect', icon:'\uD83D\uDD17'}
  ],
  get subTab() { return S.subTab || 'log'; },
  set subTab(v) { S.subTab = v; },
  render: wearableRender
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
  logSleep: logSleep,
  syncGoogleFit: syncGoogleFit
};

// ── Window exports ──
var fns = ['logSleep','deleteSleep','setHrvProxy','initiateGoogleFitAuth','syncGoogleFit',
           'disconnectGoogleFit','importSleepData','pasteSleepData','saveGFitClientId'];
fns.forEach(function(name) {
  try { var fn = eval(name); if (typeof fn === 'function') window[name] = fn; } catch(e) {}
});

// ── Handle OAuth callback on load ──
handleOAuthCallback();

})();
