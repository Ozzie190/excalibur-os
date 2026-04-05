// ─── Practice Database ──────────────────────────────────────────
// Qi Gong forms, meditation types, breathwork protocols

var PRACTICE_DB = {
  qigong: [
    { id:'8brocades', name:'Eight Pieces of Brocade', icon:'🧘', difficulty:'beginner', durationMin:15, durationMax:30,
      muscles:['shoulders','back','hips','spine'],
      recoveryBonus:5, stressReduction:7,
      cues:'Slow, rhythmic movements. Focus on breath coordination. Full range of motion on each piece.',
      progression:['Learn each piece individually','Chain all 8 with breath','Add visualization + intention'] },
    { id:'5animals', name:'Five Animal Frolics', icon:'🐯', difficulty:'intermediate', durationMin:20, durationMax:45,
      muscles:['full_body','core','legs','spine'],
      recoveryBonus:7, stressReduction:6,
      cues:'Embody each animal\'s spirit. Tiger: power + rooting. Deer: grace + spine. Bear: strength + grounding. Monkey: agility + play. Crane: balance + calm.',
      progression:['Master Bear + Crane first','Add Tiger + Deer','Full sequence with Monkey'] },
    { id:'taichi_basics', name:'Tai Chi Foundations', icon:'☯️', difficulty:'beginner', durationMin:10, durationMax:20,
      muscles:['legs','core','balance'],
      recoveryBonus:4, stressReduction:8,
      cues:'Weight shifts, not steps. Sink into every movement. Shoulders down, crown lifting.',
      progression:['Standing meditation (zhan zhuang)','Weight shift drills','Opening form sequence'] }
  ],
  meditation: [
    { id:'breath_focus', name:'Breath Focus', icon:'🌬️', difficulty:'beginner', durationMin:5, durationMax:20,
      recoveryBonus:3, stressReduction:8,
      cues:'Count breaths 1-10, restart if lost. No judgment on wandering mind.' },
    { id:'body_scan', name:'Body Scan', icon:'🔍', difficulty:'beginner', durationMin:10, durationMax:30,
      recoveryBonus:4, stressReduction:7,
      cues:'Systematic attention from feet to crown. Notice sensation without changing it.' },
    { id:'vipassana', name:'Vipassana (Insight)', icon:'💎', difficulty:'advanced', durationMin:20, durationMax:60,
      recoveryBonus:5, stressReduction:9,
      cues:'Observe sensation as impermanent. Equanimity with pleasant and unpleasant alike.' }
  ],
  breathwork: [
    { id:'box_breathing', name:'Box Breathing (4-4-4-4)', icon:'📦', difficulty:'beginner', durationMin:3, durationMax:10,
      recoveryBonus:3, stressReduction:7,
      cues:'Inhale 4s, hold 4s, exhale 4s, hold 4s. Navy SEAL stress protocol.' },
    { id:'wim_hof', name:'Wim Hof Method', icon:'🧊', difficulty:'intermediate', durationMin:10, durationMax:20,
      recoveryBonus:6, stressReduction:5,
      cues:'30 power breaths, exhale + hold, inhale + hold 15s. 3 rounds. Cold exposure optional.' },
    { id:'478_breathing', name:'4-7-8 Breathing', icon:'😴', difficulty:'beginner', durationMin:3, durationMax:5,
      recoveryBonus:2, stressReduction:8,
      cues:'Inhale 4s, hold 7s, exhale 8s. Dr. Andrew Weil sleep protocol. Best before bed.' }
  ]
};

function findPractice(id) {
  var all = PRACTICE_DB.qigong.concat(PRACTICE_DB.meditation).concat(PRACTICE_DB.breathwork);
  return all.find(function(p) { return p.id === id; }) || null;
}

function getAllPractices() {
  return PRACTICE_DB.qigong.concat(PRACTICE_DB.meditation).concat(PRACTICE_DB.breathwork);
}
