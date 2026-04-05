// ─── EXCALIBUR OS — Practice Module ─────────────────────────────
// Placeholder — built in Phase 6
(function() {
  // Practice is accessed via the Habits section "Practice" sub-tab
  // This module provides the practice-specific logic
  EXC.practice = {
    getSessions: function(date) {
      return (EXC.S.practice.sessions || []).filter(function(s) { return s.date === date; });
    },
    getTotalMinutes: function(days) {
      var cutoff = addDays(TODAY, -(days || 7));
      return (EXC.S.practice.sessions || []).filter(function(s) { return s.date >= cutoff; })
        .reduce(function(sum, s) { return sum + (s.duration || 0); }, 0);
    }
  };
})();
