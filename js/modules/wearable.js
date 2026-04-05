// ─── EXCALIBUR OS — Wearable Module ─────────────────────────────
// Placeholder — manual entry in Phase 7, APIs in Phase 8
(function() {
  EXC.wearable = {
    getLastSleep: function(date) {
      date = date || TODAY;
      var data = EXC.S.wearable.sleepData || [];
      for (var i = data.length - 1; i >= 0; i--) {
        if (data[i].date === date || data[i].date === addDays(date, -1)) return data[i];
      }
      return null;
    },
    logSleep: function(entry) {
      entry.source = entry.source || 'manual';
      EXC.S.wearable.sleepData.push(entry);
      EXC.save();
      EXC.emit('sleep.logged', entry);
    }
  };
})();
