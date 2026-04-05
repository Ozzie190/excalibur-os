// ─── EXCALIBUR OS — Event Bus ───────────────────────────────────
// Pub/sub system for cross-module communication

(function() {
  var listeners = {};
  var eventLog = [];

  EXC.on = function(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  };

  EXC.off = function(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function(cb) { return cb !== callback; });
  };

  EXC.emit = function(event, data) {
    var cbs = listeners[event] || [];
    for (var i = 0; i < cbs.length; i++) {
      try { cbs[i](data); } catch(e) { console.warn('Event handler error [' + event + ']:', e); }
    }
    // Log for insights/correlation engine
    eventLog.push({ event: event, data: data, ts: Date.now() });
    if (eventLog.length > 500) eventLog = eventLog.slice(-250);
  };

  EXC.getEventLog = function() { return eventLog; };
})();
