// ─── EXCALIBUR OS — Unified State Management ───────────────────
// Single state tree with namespaces per module
// Migrates from legacy bhv6 (Biohack OS) and ip_v1 (Iron Protocol)

EXC.S = {
  // ── Shared globals ──
  wakeTime: '12:00',
  bedTime: '04:00',
  section: 'dashboard',

  // ── Supplement state (migrated from bhv6) ──
  supp: {
    gymDays: {mon:false,tue:false,wed:false,thu:false,fri:false,sat:false,sun:false},
    startDates: {},
    checks: {},
    notes: [],
    doseOverrides: {},
    dismissed: {},
    customSupps: [],
    removedBuiltin: [],
    schedTimes: {
      wake: '12:00', meal1: '13:30', alone: '15:30',
      dinner: '17:00', pregym: '23:00', winddown: '02:30', bedtime: '04:00'
    },
    gymTime: '23:30',
    symptomLogs: [],
    logMode: 'notes',
    lifetimeDays: {},
    supply: {},
    skips: {},
    doseHistory: {},
    doseTimes: {},
    secondDose: {},
    secondDoseTiming: {},
    notifEnabled: false,
    expanded: null,
    expandedAlert: null,
    expandedCycle: null,
    calVis: {},
    subTab: 'schedule'
  },

  // ── Workout state (migrated from ip_v1) ──
  workout: {
    activeWorkout: null,
    restTimer: null,
    workoutHistory: [],
    templates: [],
    prs: {},
    bodyWeight: [],
    measurements: [],
    sorenessLog: {},
    units: 'lbs',
    defaultRestSeconds: 90,
    vibrateOnTimerEnd: true,
    autoStartTimer: true,
    selectedGoal: 'hypertrophy',
    expanded: null,
    searchQuery: '',
    filterMuscle: '',
    filterEquip: '',
    subTab: 'workout'
  },

  // ── Habits (new) ──
  habits: {
    definitions: [],
    completions: {},
    categories: ['Health','Mind','Productivity','Social','Custom'],
    subTab: 'today'
  },

  // ── Practice (new) ──
  practice: {
    sessions: [],
    routines: [],
    subTab: 'today'
  },

  // ── Wearable (new) ──
  wearable: {
    circularToken: null,
    googleFitToken: null,
    sleepData: [],
    activityData: [],
    lastSync: null
  },

  // ── Recovery cache ──
  recovery: {
    dailyScores: {},
    recommendations: {}
  },

  // ── AI Coach ──
  aiCoach: {
    provider: 'minimax',
    apiKey: '',
    autoAdjust: false,
    lastResponse: null,
    lastFetchTs: 0,
    history: []
  }
};

// ─── SAVE / LOAD ──────────────────────────────────────────────

EXC.save = function() {
  try {
    localStorage.setItem('exc_v1', JSON.stringify(EXC.S));
  } catch(e) { console.error('Save error:', e); }
};

EXC.load = function() {
  try {
    var sv = localStorage.getItem('exc_v1');
    if (sv) {
      var p = JSON.parse(sv);
      deepMerge(EXC.S, p);
    } else {
      // First launch — migrate from legacy
      migrateFromLegacy();
    }
  } catch(e) { console.error('Load error:', e); }
};

function deepMerge(target, source) {
  Object.keys(source).forEach(function(k) {
    if (source[k] !== null && typeof source[k] === 'object' && !Array.isArray(source[k])
        && target[k] !== null && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      deepMerge(target[k], source[k]);
    } else {
      target[k] = source[k];
    }
  });
}

function migrateFromLegacy() {
  // Migrate Biohack OS (bhv6)
  var bhv6 = localStorage.getItem('bhv6');
  if (bhv6) {
    try {
      var bh = JSON.parse(bhv6);
      var suppKeys = ['gymDays','startDates','checks','notes','doseOverrides','dismissed',
                      'customSupps','removedBuiltin','schedTimes','symptomLogs','lifetimeDays',
                      'supply','notifEnabled','skips','doseHistory','doseTimes','secondDose',
                      'secondDoseTiming','logMode'];
      suppKeys.forEach(function(k) { if (bh[k] !== undefined) EXC.S.supp[k] = bh[k]; });
      if (bh.wakeTime) EXC.S.wakeTime = bh.wakeTime;
      if (bh.bedTime) EXC.S.bedTime = bh.bedTime;
      if (bh.gymTime) EXC.S.supp.gymTime = bh.gymTime;
      console.log('Migrated Biohack OS data (bhv6)');
    } catch(e) { console.warn('bhv6 migration failed:', e); }
  }

  // Migrate Iron Protocol (ip_v1)
  var ipv1 = localStorage.getItem('ip_v1');
  if (ipv1) {
    try {
      var ip = JSON.parse(ipv1);
      var workKeys = ['activeWorkout','workoutHistory','templates','prs','bodyWeight',
                      'measurements','sorenessLog','units','defaultRestSeconds',
                      'vibrateOnTimerEnd','autoStartTimer','selectedGoal'];
      workKeys.forEach(function(k) { if (ip[k] !== undefined) EXC.S.workout[k] = ip[k]; });
      console.log('Migrated Iron Protocol data (ip_v1)');
    } catch(e) { console.warn('ip_v1 migration failed:', e); }
  }

  // Save unified state
  if (bhv6 || ipv1) EXC.save();
}

// ─── EXPORT / IMPORT ──────────────────────────────────────────

EXC.exportData = function() {
  var blob = new Blob([JSON.stringify(EXC.S, null, 2)], {type: 'application/json'});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'excalibur-os-backup-' + localDateStr() + '.json';
  a.click();
};

EXC.importData = function() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);

        if (data.supp && data.workout) {
          // Excalibur OS native format
          deepMerge(EXC.S, data);
          showToast('Excalibur backup restored');
        } else if (data.checks !== undefined || data.gymDays !== undefined || data.startDates !== undefined) {
          // Biohack OS (bhv6) format
          var suppKeys = ['gymDays','startDates','checks','notes','doseOverrides','dismissed',
                          'customSupps','removedBuiltin','schedTimes','symptomLogs','lifetimeDays',
                          'supply','notifEnabled','skips','doseHistory','doseTimes','secondDose',
                          'secondDoseTiming','logMode'];
          suppKeys.forEach(function(k) { if (data[k] !== undefined) EXC.S.supp[k] = data[k]; });
          if (data.wakeTime) EXC.S.wakeTime = data.wakeTime;
          if (data.bedTime) EXC.S.bedTime = data.bedTime;
          if (data.gymTime) EXC.S.supp.gymTime = data.gymTime;
          showToast('Biohack OS data imported');
        } else if (data.workoutHistory !== undefined && !data.supp) {
          // Iron Protocol (ip_v1) format
          var workKeys = ['activeWorkout','workoutHistory','templates','prs','bodyWeight',
                          'measurements','sorenessLog','units','defaultRestSeconds',
                          'vibrateOnTimerEnd','autoStartTimer','selectedGoal'];
          workKeys.forEach(function(k) { if (data[k] !== undefined) EXC.S.workout[k] = data[k]; });
          showToast('Iron Protocol data imported');
        } else {
          // Unknown format — best-effort merge
          deepMerge(EXC.S, data);
          showToast('Data imported');
        }

        EXC.save();
        EXC.draw();
      } catch(err) { showToast('Import failed: invalid file'); }
    };
    reader.readAsText(file);
  };
  input.click();
};
