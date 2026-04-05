// ─── EXCALIBUR OS — Shared Utilities ────────────────────────────
// Helpers used across all modules

// Global namespace — must be first
var EXC = window.EXC || {};

var TODAY = '';
var TODAY_DAY = '';

function computeToday() {
  var now = new Date();
  var wParts = (EXC.S.wakeTime || '12:00').split(':');
  var wakeHour = parseInt(wParts[0]), wakeMin = parseInt(wParts[1] || 0);
  var isBeforeWake = now.getHours() < wakeHour || (now.getHours() === wakeHour && now.getMinutes() < wakeMin);
  var d = new Date(now);
  if (isBeforeWake) d.setDate(d.getDate() - 1);
  TODAY = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  TODAY_DAY = ['sun','mon','tue','wed','thu','fri','sat'][d.getDay()];
}

function isPreWake() {
  var now = new Date();
  var wParts = (EXC.S.wakeTime || '12:00').split(':');
  var wakeHour = parseInt(wParts[0]), wakeMin = parseInt(wParts[1] || 0);
  return now.getHours() < wakeHour || (now.getHours() === wakeHour && now.getMinutes() < wakeMin);
}

function localDateStr(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function rgb(hex) {
  hex = hex.replace('#','');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  var r = parseInt(hex.substring(0,2),16);
  var g = parseInt(hex.substring(2,4),16);
  var b = parseInt(hex.substring(4,6),16);
  return r+','+g+','+b;
}

function svgRing(r, pct, color, strokeWidth) {
  strokeWidth = strokeWidth || 3;
  var circ = 2 * Math.PI * r;
  var offset = circ * (1 - Math.min(1, Math.max(0, pct / 100)));
  return '<svg width="'+(r*2+strokeWidth*2)+'" height="'+(r*2+strokeWidth*2)+'" class="ring">' +
    '<circle cx="'+(r+strokeWidth)+'" cy="'+(r+strokeWidth)+'" r="'+r+'" fill="none" stroke="#1a1a2e" stroke-width="'+strokeWidth+'"/>' +
    '<circle cx="'+(r+strokeWidth)+'" cy="'+(r+strokeWidth)+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+strokeWidth+'" ' +
    'stroke-dasharray="'+circ+'" stroke-dashoffset="'+offset+'" stroke-linecap="round" style="transition:stroke-dashoffset .5s"/>' +
    '</svg>';
}

function genId() {
  return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function fmtDur(ms) {
  var s = Math.floor(ms / 1000);
  var m = Math.floor(s / 60);
  s = s % 60;
  var h = Math.floor(m / 60);
  m = m % 60;
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm ' + s + 's';
  return s + 's';
}

function showToast(msg, duration) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(function() { el.classList.remove('show'); }, duration || 3000);
}

function daysBetween(d1, d2) {
  var a = new Date(d1 + 'T12:00:00');
  var b = new Date(d2 + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}

function weekStart(dateStr) {
  var d = new Date(dateStr + 'T12:00:00');
  var day = d.getDay();
  d.setDate(d.getDate() - day);
  return localDateStr(d);
}

function addDays(dateStr, n) {
  var d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}
