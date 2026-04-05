// ─── MUSCLE GROUP DEFINITIONS ────────────────────────────────
var MUSCLE_GROUPS = {
  chest_mid:    { name:"Chest (Mid)",     region:"upper", recoveryHours:48, weeklySetTarget:{min:10,max:20}, color:"#4cc9f0" },
  chest_upper:  { name:"Chest (Upper)",   region:"upper", recoveryHours:48, weeklySetTarget:{min:6,max:12},  color:"#4cc9f0" },
  chest_lower:  { name:"Chest (Lower)",   region:"upper", recoveryHours:48, weeklySetTarget:{min:4,max:8},   color:"#4cc9f0" },
  back_lats:    { name:"Lats",            region:"upper", recoveryHours:48, weeklySetTarget:{min:10,max:20}, color:"#38b000" },
  back_upper:   { name:"Upper Back",      region:"upper", recoveryHours:48, weeklySetTarget:{min:8,max:16},  color:"#38b000" },
  back_traps:   { name:"Traps",           region:"upper", recoveryHours:48, weeklySetTarget:{min:6,max:12},  color:"#38b000" },
  back_erector: { name:"Erector Spinae",  region:"core",  recoveryHours:72, weeklySetTarget:{min:4,max:8},   color:"#38b000" },
  front_delts:  { name:"Front Delts",     region:"upper", recoveryHours:48, weeklySetTarget:{min:6,max:12},  color:"#9d4edd" },
  side_delts:   { name:"Side Delts",      region:"upper", recoveryHours:48, weeklySetTarget:{min:10,max:20}, color:"#9d4edd" },
  rear_delts:   { name:"Rear Delts",      region:"upper", recoveryHours:48, weeklySetTarget:{min:8,max:16},  color:"#9d4edd" },
  biceps:       { name:"Biceps",          region:"upper", recoveryHours:36, weeklySetTarget:{min:8,max:14},  color:"#ffd60a" },
  triceps:      { name:"Triceps",         region:"upper", recoveryHours:36, weeklySetTarget:{min:8,max:14},  color:"#ffd60a" },
  quads:        { name:"Quadriceps",      region:"lower", recoveryHours:72, weeklySetTarget:{min:10,max:20}, color:"#f77f00" },
  hamstrings:   { name:"Hamstrings",      region:"lower", recoveryHours:72, weeklySetTarget:{min:10,max:16}, color:"#f77f00" },
  glutes:       { name:"Glutes",          region:"lower", recoveryHours:72, weeklySetTarget:{min:8,max:16},  color:"#e63946" },
  calves:       { name:"Calves",          region:"lower", recoveryHours:36, weeklySetTarget:{min:8,max:16},  color:"#f77f00" },
  core:         { name:"Core",            region:"core",  recoveryHours:24, weeklySetTarget:{min:6,max:12},  color:"#06d6a0" },
  forearms:     { name:"Forearms",        region:"upper", recoveryHours:24, weeklySetTarget:{min:4,max:8},   color:"#ffd60a" }
};

// ─── EXERCISE DATABASE ──────────────────────────────────────
var EXERCISE_DB = [

  // ════════════════════════════════════════════════════════════
  //  CHEST
  // ════════════════════════════════════════════════════════════

  { id:"barbell_bench_press", name:"Barbell Bench Press", icon:"\u{1F3CB}", color:"#4cc9f0",
    category:"compound", equipment:"barbell", difficulty:"intermediate", bwRatio:0.5, aliases:["flat bench","bench press","barbell press"],
    musclesPrimary:[
      {muscle:"chest_mid", pct:60, note:"Sternal head of pectoralis major \u2014 primary mover through horizontal adduction"}
    ],
    musclesSecondary:[
      {muscle:"triceps", pct:25, note:"Long + lateral heads \u2014 elbow extension in top half of ROM"},
      {muscle:"front_delts", pct:15, note:"Anterior deltoid \u2014 shoulder flexion component"}
    ],
    stabilizers:["core","back_lats"],
    movementPattern:"horizontal_push",
    biomechanics:"Horizontal adduction + elbow extension. Bar path follows slight J-curve: lower to nipple line, press up toward eyes. Scapulae retracted and depressed throughout to protect shoulder joint. Grip width affects emphasis: wider = more pec stretch, narrower = more tricep.",
    repRanges:[
      {goal:"strength", reps:"1-5", rest:180, sets:"4-6", why:"Near-maximal loads recruit high-threshold motor units (Henneman's size principle). Neural adaptations dominate. RCT (Schoenfeld 2014, n=20): 3-5RM produced superior 1RM gains vs 10-12RM."},
      {goal:"hypertrophy", reps:"6-12", rest:90, sets:"3-5", why:"Moderate loads maximize mechanical tension + metabolic stress. Meta-analysis (Schoenfeld 2017): similar hypertrophy across rep ranges IF near failure, but 6-12 is most time-efficient."},
      {goal:"endurance", reps:"15-25", rest:45, sets:"2-3", why:"High reps increase capillary density and mitochondrial biogenesis in type I fibers. Limited hypertrophy benefit."}
    ],
    warnings:[
      "Flaring elbows >75\u00B0 increases subacromial impingement risk \u2014 tuck to ~45\u00B0",
      "Bouncing bar off chest removes eccentric loading and risks sternum injury",
      "Unracking without scapular retraction shifts load to anterior deltoid",
      "Lifting hips off bench reduces pec activation and increases lumbar compression"
    ],
    progressionCues:[
      "All sets completed with 1+ RIR \u2192 increase 2.5-5 lbs next session",
      "Form breaks down rep 3+ \u2192 deload 10% and rebuild",
      "Stalled 3+ sessions \u2192 switch variation (incline, close-grip, DB) for 3-4 weeks"
    ],
    synergies:[
      {exerciseId:"incline_db_press", type:"complement", note:"Hits clavicular head that flat bench underloads. EMG: 35% more upper pec activation at 30-45\u00B0 incline (Trebs 2010)."},
      {exerciseId:"cable_fly", type:"superset", note:"Isolation after compound \u2014 constant tension through full ROM where bench has a dead spot at lockout."},
      {exerciseId:"barbell_row", type:"antagonist", note:"Push/pull superset \u2014 active rest for pecs while training back. Maintains shoulder balance."}
    ],
    substitutes:[
      {exerciseId:"db_bench_press", similarity:95, note:"Greater ROM, unilateral balance, lower shoulder stress. Slightly less total load."},
      {exerciseId:"machine_chest_press", similarity:75, note:"Stable path, good for beginners or fatigued sets. Less stabilizer recruitment."},
      {exerciseId:"pushup", similarity:65, note:"Bodyweight alternative. Add bands/vest for overload. Self-limiting at higher strength."}
    ],
    scienceNotes:"EMG activation: 80-100% MVC pectoralis major at 70-85% 1RM (Lehman 2005). Flat vs incline (30\u00B0): flat shows 10-15% higher mid-pec activation, incline 35% higher upper pec (Trebs 2010). Optimal grip width: 1.5x biacromial maximizes pec activation while minimizing shoulder stress (Green & Comfort 2007)."
  },

  { id:"incline_db_press", name:"Incline Dumbbell Press", icon:"\u{1F4AA}", color:"#4cc9f0",
    category:"compound", equipment:"dumbbell", difficulty:"intermediate", bwRatio:0.15, aliases:["incline press","incline dumbbell"],
    musclesPrimary:[
      {muscle:"chest_upper", pct:55, note:"Clavicular head of pectoralis major \u2014 targeted by 30-45\u00B0 incline angle"},
      {muscle:"front_delts", pct:20, note:"Anterior deltoid \u2014 increased shoulder flexion demand at incline"}
    ],
    musclesSecondary:[
      {muscle:"triceps", pct:20, note:"Elbow extension component"},
      {muscle:"chest_mid", pct:5, note:"Sternal head still assists"}
    ],
    stabilizers:["core","biceps"],
    movementPattern:"incline_push",
    biomechanics:"Incline angle shifts emphasis from sternal to clavicular pec fibers. Dumbbells allow greater ROM at bottom and more adduction at top vs barbell. 30\u00B0 incline is optimal \u2014 45\u00B0+ shifts too much to delts. Neutral or slight pronation grip reduces shoulder impingement.",
    repRanges:[
      {goal:"strength", reps:"4-6", rest:150, sets:"3-5", why:"Heavy DB pressing builds unilateral pressing strength and stabilizer capacity that carries over to barbell work."},
      {goal:"hypertrophy", reps:"8-12", rest:75, sets:"3-4", why:"Sweet spot for upper pec hypertrophy. DB ROM advantage maximizes stretch-mediated hypertrophy (Pedrosa 2023: lengthened partials produced 2x muscle growth)."},
      {goal:"endurance", reps:"15-20", rest:45, sets:"2-3", why:"Metabolic stress focus. Good finisher after heavy pressing."}
    ],
    warnings:[
      "Incline >45\u00B0 shifts primary load to anterior deltoid \u2014 keep at 30-40\u00B0",
      "Excessive flare at bottom position strains shoulder capsule",
      "Avoid slamming DBs together at top \u2014 reduces time under tension"
    ],
    progressionCues:[
      "All sets completed at target reps \u2192 increase 5 lbs per DB",
      "DB pressing progress is slower than barbell \u2014 2.5-5 lb jumps are normal",
      "If shoulder pain at bottom, reduce ROM slightly or switch to neutral grip"
    ],
    synergies:[
      {exerciseId:"barbell_bench_press", type:"complement", note:"Flat bench hits mid-pec; incline targets upper. Together: complete pec development."},
      {exerciseId:"low_cable_fly", type:"superset", note:"Low-to-high cable fly after incline press \u2014 isolation for clavicular head with constant tension."}
    ],
    substitutes:[
      {exerciseId:"incline_barbell_press", similarity:90, note:"Heavier loading but less ROM and no unilateral work."},
      {exerciseId:"landmine_press", similarity:70, note:"Natural arc matches incline pressing angle. Shoulder-friendly."},
      {exerciseId:"machine_chest_press", similarity:65, note:"Incline machine variant. Fixed path, less stabilizer demand."}
    ],
    scienceNotes:"30\u00B0 incline = 35% greater clavicular head activation vs flat (Trebs 2010). Dumbbell bench allows ~10\u00B0 more shoulder horizontal abduction at bottom ROM than barbell, increasing pec stretch. Stretch-mediated hypertrophy (Pedrosa 2023): training at long muscle lengths may be superior for growth."
  },

  { id:"cable_fly", name:"Cable Fly", icon:"\u{1F3AF}", color:"#4cc9f0",
    category:"isolation", equipment:"cable", difficulty:"beginner", bwRatio:0.1, aliases:["cable crossover","chest fly","pec fly"],
    musclesPrimary:[
      {muscle:"chest_mid", pct:80, note:"Pectoralis major through horizontal adduction with constant cable tension"}
    ],
    musclesSecondary:[
      {muscle:"front_delts", pct:15, note:"Assists in transverse flexion"},
      {muscle:"biceps", pct:5, note:"Elbow stabilization with slight bend"}
    ],
    stabilizers:["core"],
    movementPattern:"horizontal_adduction",
    biomechanics:"Pure horizontal adduction isolating the pec. Cable provides constant tension throughout entire ROM \u2014 unlike DB flies which lose tension at the top. Slight elbow bend (~15-20\u00B0) protects biceps tendon. Adjust pulley height to target different pec regions: high = lower pec, mid = mid pec, low = upper pec.",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"3-4", why:"Isolation exercises respond best to moderate-high reps with controlled tempo. Constant tension through full ROM maximizes metabolic stress."},
      {goal:"endurance", reps:"15-25", rest:30, sets:"2-3", why:"Pump/finisher work. High reps with cable tension create massive metabolic stress in the pec."}
    ],
    warnings:[
      "Straight arms = biceps tendon strain. Always maintain slight elbow bend.",
      "Don't go too heavy \u2014 this is an isolation movement, not a pressing exercise",
      "Control the eccentric. Letting cables snap back risks shoulder injury."
    ],
    progressionCues:[
      "Focus on squeeze at peak contraction rather than load increases",
      "Progress by adding reps or slowing tempo (3s eccentric) before adding weight",
      "When 15 reps becomes easy, increase weight by one pin"
    ],
    synergies:[
      {exerciseId:"barbell_bench_press", type:"superset", note:"Compound-to-isolation superset. Bench fatigues triceps first; cables isolate pec to failure."},
      {exerciseId:"pushup", type:"superset", note:"Cable fly to pushup drop set. Isolation to compound \u2014 extend the set past cable failure."}
    ],
    substitutes:[
      {exerciseId:"db_fly", similarity:80, note:"Similar motion but tension drops at top. Better stretch at bottom."},
      {exerciseId:"pec_deck", similarity:85, note:"Machine version. Fixed path, easier to load. Same adduction pattern."}
    ],
    scienceNotes:"Cable fly maintains tension through full ROM. EMG shows sustained pec activation at peak contraction where DB fly drops to near zero. Ideal for metabolic stress and sarcoplasmic hypertrophy stimulus."
  },

  { id:"pushup", name:"Push-Up", icon:"\u{1F4AA}", color:"#4cc9f0",
    category:"compound", equipment:"bodyweight", difficulty:"beginner", bwRatio:0, aliases:["push up","press up"],
    musclesPrimary:[
      {muscle:"chest_mid", pct:55, note:"Pectoralis major \u2014 horizontal push against bodyweight"}
    ],
    musclesSecondary:[
      {muscle:"triceps", pct:25, note:"Elbow extension"},
      {muscle:"front_delts", pct:15, note:"Shoulder flexion"},
      {muscle:"core", pct:5, note:"Anti-extension stabilization throughout"}
    ],
    stabilizers:["core","back_erector"],
    movementPattern:"horizontal_push",
    biomechanics:"Closed-chain horizontal push. Body acts as lever \u2014 roughly 64% of bodyweight is pressed at standard position (Suprak 2011). Scapulae should protract at top (serratus activation). Hand width affects emphasis: wider = more pec, narrower = more triceps. Feet elevated = more upper pec + increased load.",
    repRanges:[
      {goal:"hypertrophy", reps:"8-20", rest:60, sets:"3-4", why:"For trained individuals, add band resistance or weight vest to stay in hypertrophy range. Bodyweight alone may be too easy."},
      {goal:"endurance", reps:"20-50+", rest:30, sets:"2-3", why:"Muscular endurance and work capacity. Also functions as active recovery between heavy sets."}
    ],
    warnings:[
      "Sagging hips = lumbar hyperextension. Brace core throughout.",
      "Elbows flaring 90\u00B0 = shoulder impingement risk. Tuck to 45\u00B0.",
      "Head dropping = cervical strain. Keep neutral spine."
    ],
    progressionCues:[
      "Can do 20+ strict reps \u2192 add resistance (band, vest, plate on back)",
      "Archer push-ups and ring push-ups are excellent progressions",
      "Deficit push-ups (hands elevated on blocks) increase ROM and pec stretch"
    ],
    synergies:[
      {exerciseId:"cable_fly", type:"superset", note:"Fly to push-up \u2014 isolation to compound extends the pec-focused set."},
      {exerciseId:"barbell_bench_press", type:"complement", note:"Push-ups as a warm-up or burnout finisher for bench day."}
    ],
    substitutes:[
      {exerciseId:"barbell_bench_press", similarity:80, note:"Barbell version of horizontal push. Higher load capacity."},
      {exerciseId:"machine_chest_press", similarity:70, note:"Machine version. Good for those with wrist issues."}
    ],
    scienceNotes:"~64% of bodyweight pressed at standard position (Suprak 2011). EMG comparable to bench press at equivalent relative intensity. Adding band resistance linearizes the strength curve. Incline push-up = regressed version (~40% BW). Decline push-up = progressed (~75% BW)."
  },

  { id:"dip", name:"Dip (Chest Focus)", icon:"\u{1F4AA}", color:"#4cc9f0",
    category:"compound", equipment:"bodyweight", difficulty:"beginner", bwRatio:0, aliases:["chest dip","parallel bar dip"],
    musclesPrimary:[
      {muscle:"chest_lower", pct:45, note:"Lower pec fibers emphasized by forward lean"},
      {muscle:"triceps", pct:35, note:"Heavy elbow extension component"}
    ],
    musclesSecondary:[
      {muscle:"front_delts", pct:15, note:"Shoulder extension under load"},
      {muscle:"core", pct:5, note:"Stabilization"}
    ],
    stabilizers:["core","back_lats"],
    movementPattern:"vertical_push",
    biomechanics:"Forward lean (15-30\u00B0) shifts emphasis from triceps to lower pec. Wider grip increases pec stretch. Descend until upper arm is roughly parallel to floor \u2014 deeper increases shoulder strain. Lock out at top for full triceps contraction. Adding weight via belt makes this a premier mass builder.",
    repRanges:[
      {goal:"strength", reps:"3-6", rest:180, sets:"4-5", why:"Weighted dips build enormous pressing strength. One of the best strength indicators for upper body push capacity."},
      {goal:"hypertrophy", reps:"8-12", rest:90, sets:"3-4", why:"Moderate reps with added weight or bodyweight. Full stretch at bottom is key for pec growth."},
      {goal:"endurance", reps:"15-25", rest:45, sets:"2-3", why:"Bodyweight dips for muscular endurance and work capacity."}
    ],
    warnings:[
      "Descending too deep with shoulders rolled forward \u2192 anterior capsule strain",
      "If you have shoulder impingement history, use machine dips or decline press instead",
      "Don't swing or kip \u2014 controlled eccentric is essential"
    ],
    progressionCues:[
      "Can do 15+ bodyweight reps \u2192 add weight via dip belt (start with 10-25 lbs)",
      "Progress weighted dips by 2.5-5 lbs when all sets completed",
      "If bodyweight is too hard, use band assistance or machine dips"
    ],
    synergies:[
      {exerciseId:"barbell_bench_press", type:"complement", note:"Dips target the lower pec and deeper stretch that bench doesn't reach."},
      {exerciseId:"overhead_tricep_ext", type:"superset", note:"Compound-to-isolation for triceps."}
    ],
    substitutes:[
      {exerciseId:"decline_bench_press", similarity:80, note:"Similar lower pec emphasis without bodyweight requirement."},
      {exerciseId:"machine_chest_press", similarity:65, note:"Machine variant for those unable to do bodyweight dips."}
    ],
    scienceNotes:"EMG: forward lean increases pec activation by ~30% vs upright dip position (Gentil 2017). Weighted dips correlate strongly with bench press 1RM. One of the highest pec stretch positions of any pressing movement."
  },

  // ════════════════════════════════════════════════════════════
  //  BACK
  // ════════════════════════════════════════════════════════════

  { id:"barbell_row", name:"Barbell Row", icon:"\u{1F3CB}", color:"#38b000",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.45, aliases:["bent over row","pendlay row","BB row"],
    musclesPrimary:[
      {muscle:"back_lats", pct:40, note:"Latissimus dorsi \u2014 shoulder extension and adduction"},
      {muscle:"back_upper", pct:30, note:"Rhomboids + middle traps \u2014 scapular retraction"}
    ],
    musclesSecondary:[
      {muscle:"biceps", pct:15, note:"Elbow flexion component"},
      {muscle:"rear_delts", pct:10, note:"Horizontal abduction"},
      {muscle:"back_erector", pct:5, note:"Isometric spinal stabilization"}
    ],
    stabilizers:["core","hamstrings","glutes"],
    movementPattern:"horizontal_pull",
    biomechanics:"Hip hinge position (~45\u00B0 torso angle) with bar pulled to lower chest/upper abdomen. Overhand grip emphasizes upper back and rear delts; underhand grip increases lat and bicep involvement. Drive elbows back, squeeze scapulae at top. Controlled lower \u2014 don't bounce off the floor.",
    repRanges:[
      {goal:"strength", reps:"3-6", rest:180, sets:"4-5", why:"Heavy rows build pulling strength that transfers to deadlifts and other pulling movements. Core stability under load is a major benefit."},
      {goal:"hypertrophy", reps:"8-12", rest:90, sets:"3-4", why:"Moderate load with strict form and full ROM. Focus on the squeeze at peak contraction."},
      {goal:"endurance", reps:"12-20", rest:60, sets:"2-3", why:"Higher reps build back endurance and postural stamina."}
    ],
    warnings:[
      "Rounding the lower back under load \u2192 disc injury risk. Maintain neutral spine.",
      "Excessive body English (heaving) reduces back activation and risks injury",
      "Don't jerk the bar off the floor \u2014 initiate with scapular retraction"
    ],
    progressionCues:[
      "All sets completed with strict form \u2192 increase 5-10 lbs",
      "If lower back fatigues before upper back, switch to chest-supported rows",
      "Pendlay rows (from floor each rep) enforce strict form"
    ],
    synergies:[
      {exerciseId:"barbell_bench_press", type:"antagonist", note:"Push/pull superset. Maintains shoulder balance."},
      {exerciseId:"pullup", type:"complement", note:"Horizontal + vertical pull covers all lat fiber angles."},
      {exerciseId:"face_pull", type:"complement", note:"Rows hit lats/mid-back; face pulls target rear delts and external rotators."}
    ],
    substitutes:[
      {exerciseId:"db_row", similarity:85, note:"Unilateral variant. Better for those with lower back issues."},
      {exerciseId:"cable_row", similarity:80, note:"Constant tension. Adjustable body angle."},
      {exerciseId:"t_bar_row", similarity:90, note:"Similar movement, more stable with chest support option."}
    ],
    scienceNotes:"EMG: overhand grip shows ~15% more upper trap and rear delt activation; underhand grip shows ~20% more lat and bicep activation (Lehman 2004). Torso angle significantly affects muscle emphasis: more upright = more upper back, more bent = more lats."
  },

  { id:"pullup", name:"Pull-Up", icon:"\u{1F4AA}", color:"#38b000",
    category:"compound", equipment:"bodyweight", difficulty:"beginner", bwRatio:0, aliases:["pull up","chin up","chinup"],
    musclesPrimary:[
      {muscle:"back_lats", pct:55, note:"Latissimus dorsi \u2014 shoulder adduction and extension from overhead"},
      {muscle:"biceps", pct:20, note:"Elbow flexion against bodyweight"}
    ],
    musclesSecondary:[
      {muscle:"back_upper", pct:10, note:"Lower traps and rhomboids during scapular depression"},
      {muscle:"rear_delts", pct:10, note:"Shoulder extension component"},
      {muscle:"forearms", pct:5, note:"Grip endurance"}
    ],
    stabilizers:["core"],
    movementPattern:"vertical_pull",
    biomechanics:"Shoulder adduction from a dead hang. Initiate with scapular depression (pull shoulder blades down), then drive elbows toward hips. Chin over bar = full rep. Wide grip = more lat width emphasis, close grip = more lat thickness + bicep. Pronated grip = standard pull-up, supinated = chin-up (more bicep).",
    repRanges:[
      {goal:"strength", reps:"1-5", rest:180, sets:"5-6", why:"Weighted pull-ups are one of the best upper body strength builders. Add weight via belt when bodyweight is easy."},
      {goal:"hypertrophy", reps:"6-12", rest:90, sets:"3-4", why:"Bodyweight or lightly weighted. Control the eccentric for 2-3 seconds for maximum lat tension."},
      {goal:"endurance", reps:"15+", rest:60, sets:"2-3", why:"High rep pull-ups build grip endurance and work capacity."}
    ],
    warnings:[
      "Kipping reduces muscle activation and increases shoulder injury risk for general training",
      "Dead hang between reps \u2014 half reps shortchange lat development",
      "If you feel elbow pain (golfer's elbow), switch to neutral grip"
    ],
    progressionCues:[
      "Can't do 1 pull-up \u2192 use band assistance or negatives (3-5s eccentrics)",
      "Can do 10+ strict reps \u2192 add weight (start with 10 lbs)",
      "Plateau at 5-8 reps \u2192 grease the groove (multiple sets throughout the day at 50% max reps)"
    ],
    synergies:[
      {exerciseId:"barbell_row", type:"complement", note:"Vertical + horizontal pull = complete back development."},
      {exerciseId:"lat_pulldown", type:"complement", note:"Pulldown allows more volume at controlled loads when fatigued from pull-ups."},
      {exerciseId:"dip", type:"antagonist", note:"Pull-up/dip superset = complete upper body push-pull."}
    ],
    substitutes:[
      {exerciseId:"lat_pulldown", similarity:85, note:"Same movement pattern, adjustable load. Better for beginners."},
      {exerciseId:"assisted_pullup_machine", similarity:90, note:"Direct pull-up progression with counterweight assistance."}
    ],
    scienceNotes:"EMG: pull-up activates lats at 117-130% MVC (Youdas 2010). One of the highest lat activation exercises measured. Chin-up shows 18% higher biceps activation than pull-up. Dead hang decompresses the spine \u2014 therapeutic benefit."
  },

  { id:"lat_pulldown", name:"Lat Pulldown", icon:"\u{1F3CB}", color:"#38b000",
    category:"compound", equipment:"cable", difficulty:"beginner", bwRatio:0.4, aliases:["pulldown","lat pull","cable pulldown"],
    musclesPrimary:[
      {muscle:"back_lats", pct:55, note:"Latissimus dorsi \u2014 shoulder adduction against cable resistance"},
      {muscle:"biceps", pct:20, note:"Elbow flexion"}
    ],
    musclesSecondary:[
      {muscle:"back_upper", pct:10, note:"Scapular depression and retraction"},
      {muscle:"rear_delts", pct:10, note:"Shoulder extension"},
      {muscle:"forearms", pct:5, note:"Grip"}
    ],
    stabilizers:["core"],
    movementPattern:"vertical_pull",
    biomechanics:"Machine version of pull-up. Pull bar to upper chest, driving elbows down and back. Lean back slightly (10-15\u00B0) to clear the face and align the pull with lat fibers. Behind-the-neck pulldowns increase shoulder injury risk with minimal benefit. Wide grip = lat width, close/neutral grip = lat thickness + bicep.",
    repRanges:[
      {goal:"strength", reps:"6-8", rest:120, sets:"3-4", why:"Heavy pulldowns build pulling foundation for those working toward weighted pull-ups."},
      {goal:"hypertrophy", reps:"10-15", rest:75, sets:"3-4", why:"Moderate load with strict form. Focus on full stretch at top and hard squeeze at bottom."},
      {goal:"endurance", reps:"15-20", rest:45, sets:"2-3", why:"High rep pulldowns for volume and endurance."}
    ],
    warnings:[
      "Behind-the-neck pulling = shoulder impingement risk. Pull to front of chest.",
      "Leaning too far back turns it into a row. Keep lean to 10-15\u00B0.",
      "Using momentum (jerking the weight down) reduces lat activation"
    ],
    progressionCues:[
      "Progress by increasing weight when all sets completed at target reps",
      "When pulldown reaches ~80% bodyweight, start integrating pull-ups",
      "Try single-arm pulldowns for unilateral work"
    ],
    synergies:[
      {exerciseId:"pullup", type:"complement", note:"Pulldowns build the strength base for pull-ups."},
      {exerciseId:"cable_row", type:"complement", note:"Vertical + horizontal cable pulling for complete back work."}
    ],
    substitutes:[
      {exerciseId:"pullup", similarity:85, note:"Bodyweight progression. Harder but more functional."},
      {exerciseId:"db_pullover", similarity:60, note:"Different movement but targets lat stretch under load."}
    ],
    scienceNotes:"EMG comparable to pull-ups at equivalent relative load (Signorile 2002). Front pulldowns show 10-15% higher lat activation than behind-the-neck (Sperandei 2009). Moderate grip width (1.5x shoulder width) optimal for lat activation."
  },

  { id:"db_row", name:"Dumbbell Row", icon:"\u{1F4AA}", color:"#38b000",
    category:"compound", equipment:"dumbbell", difficulty:"beginner", bwRatio:0.2, aliases:["dumbbell row","one arm row","single arm row"],
    musclesPrimary:[
      {muscle:"back_lats", pct:45, note:"Unilateral lat activation through shoulder extension"},
      {muscle:"back_upper", pct:25, note:"Rhomboids and mid-traps via scapular retraction"}
    ],
    musclesSecondary:[
      {muscle:"biceps", pct:15, note:"Elbow flexion"},
      {muscle:"rear_delts", pct:10, note:"Horizontal abduction"},
      {muscle:"forearms", pct:5, note:"Grip"}
    ],
    stabilizers:["core","back_erector"],
    movementPattern:"horizontal_pull",
    biomechanics:"Unilateral horizontal pull with bench support. Non-working hand and knee on bench, flat back. Pull DB toward hip (lat emphasis) or lower chest (upper back emphasis). Allows greater ROM than barbell rows. Anti-rotation core demand is a hidden benefit.",
    repRanges:[
      {goal:"strength", reps:"5-8", rest:120, sets:"3-4", why:"Heavy single-arm rows build unilateral pulling strength and expose left-right imbalances."},
      {goal:"hypertrophy", reps:"8-12", rest:75, sets:"3-4", why:"Classic hypertrophy range. Control the eccentric and squeeze at peak."},
      {goal:"endurance", reps:"15-20", rest:45, sets:"2-3", why:"Lighter DB, high reps. Great for back endurance and blood flow."}
    ],
    warnings:[
      "Rotating torso to heave the weight = lower back risk. Keep hips square.",
      "Don't shrug the shoulder \u2014 depress the scapula first, then row",
      "Full stretch at bottom is important \u2014 don't short-rep"
    ],
    progressionCues:[
      "Increase by 5 lbs per DB when all sets completed",
      "Kroc rows (high rep, slight body English) are a valid progression for grip and back endurance",
      "If grip limits you, use straps for working sets"
    ],
    synergies:[
      {exerciseId:"pullup", type:"complement", note:"Horizontal + vertical pulling combination."},
      {exerciseId:"face_pull", type:"complement", note:"Rows hit lats; face pulls hit rear delts and external rotators."}
    ],
    substitutes:[
      {exerciseId:"barbell_row", similarity:85, note:"Bilateral version. Higher total load but more lower back demand."},
      {exerciseId:"cable_row", similarity:80, note:"Cable version with constant tension."}
    ],
    scienceNotes:"Unilateral rowing shows higher core EMG (obliques, transverse abdominis) than bilateral rowing due to anti-rotation demand (Saeterbakken 2015). DB row allows ~15% more ROM than barbell row."
  },

  { id:"cable_row", name:"Seated Cable Row", icon:"\u{1F3CB}", color:"#38b000",
    category:"compound", equipment:"cable", difficulty:"beginner", bwRatio:0.35, aliases:["seated row","low row","cable pull"],
    musclesPrimary:[
      {muscle:"back_lats", pct:40, note:"Shoulder extension against constant cable tension"},
      {muscle:"back_upper", pct:30, note:"Scapular retraction \u2014 rhomboids and mid-traps"}
    ],
    musclesSecondary:[
      {muscle:"biceps", pct:15, note:"Elbow flexion"},
      {muscle:"rear_delts", pct:10, note:"Horizontal abduction"},
      {muscle:"back_erector", pct:5, note:"Isometric stabilization"}
    ],
    stabilizers:["core","hamstrings"],
    movementPattern:"horizontal_pull",
    biomechanics:"Seated horizontal pull with constant cable tension. Close neutral grip = more lat emphasis and bicep. Wide grip = more upper back and rear delt. Drive elbows past torso and squeeze scapulae. Slight forward lean at stretch, upright at contraction \u2014 but don't excessively swing.",
    repRanges:[
      {goal:"hypertrophy", reps:"8-12", rest:75, sets:"3-4", why:"Constant tension makes this ideal for hypertrophy. Control tempo for maximum time under tension."},
      {goal:"endurance", reps:"15-20", rest:45, sets:"2-3", why:"High rep cable rows for back endurance and pump."}
    ],
    warnings:[
      "Excessive forward lean = lower back rounding risk. Keep chest proud.",
      "Don't use momentum by rocking back and forth",
      "Grip too narrow with heavy weight = bicep tendon strain"
    ],
    progressionCues:[
      "Increase weight by one pin when all sets completed with strict form",
      "Try different attachments: V-bar, wide bar, rope for variation",
      "Pause reps (2s hold at peak contraction) for advanced progression"
    ],
    synergies:[
      {exerciseId:"lat_pulldown", type:"complement", note:"Horizontal + vertical cable pulling = full back coverage."},
      {exerciseId:"face_pull", type:"complement", note:"Cable row + face pull = mid-back + rear delt in same superset."}
    ],
    substitutes:[
      {exerciseId:"barbell_row", similarity:80, note:"Free weight version. More core demand, less constant tension."},
      {exerciseId:"db_row", similarity:80, note:"Unilateral free weight version."},
      {exerciseId:"machine_row", similarity:85, note:"Machine version with chest support. Even less lower back demand."}
    ],
    scienceNotes:"Constant cable tension provides ~15% more time under tension per rep compared to free weight rows. Close grip shows higher lat EMG; wide grip shows higher rhomboid and mid-trap EMG (Lehman 2004)."
  },

  { id:"face_pull", name:"Face Pull", icon:"\u{1F3AF}", color:"#38b000",
    category:"isolation", equipment:"cable", difficulty:"beginner", bwRatio:0.1, aliases:["face pulls","rear delt pull","band pull apart"],
    musclesPrimary:[
      {muscle:"rear_delts", pct:50, note:"Posterior deltoid \u2014 horizontal abduction and external rotation"},
      {muscle:"back_upper", pct:30, note:"Mid-traps and rhomboids \u2014 scapular retraction"}
    ],
    musclesSecondary:[
      {muscle:"forearms", pct:10, note:"Grip on rope attachment"},
      {muscle:"biceps", pct:10, note:"Slight elbow flexion"}
    ],
    stabilizers:["core"],
    movementPattern:"horizontal_pull",
    biomechanics:"Cable set at face height or slightly above. Pull rope toward face, separating hands as they pass ears \u2014 external rotation at the end. Elbows high and wide. This is a shoulder health exercise as much as a muscle builder. Targets the external rotators (infraspinatus, teres minor) that are neglected by pressing movements.",
    repRanges:[
      {goal:"hypertrophy", reps:"12-20", rest:60, sets:"3-4", why:"Higher reps with moderate weight. This is a quality movement \u2014 feel the rear delts and external rotators working."},
      {goal:"endurance", reps:"20-30", rest:30, sets:"2-3", why:"Light weight, high reps for shoulder health maintenance."}
    ],
    warnings:[
      "Don't go too heavy \u2014 form breakdown means traps take over from rear delts",
      "If your elbows drop below shoulder height, the weight is too heavy",
      "This is a corrective/health exercise \u2014 ego lifting defeats the purpose"
    ],
    progressionCues:[
      "Progress by adding reps or slowing tempo before adding weight",
      "If 20 reps is easy, add a 2-second hold at peak contraction",
      "Can be done every training day as a warm-up or finisher"
    ],
    synergies:[
      {exerciseId:"barbell_bench_press", type:"complement", note:"Essential counterbalance to pressing. Every bench day should include face pulls."},
      {exerciseId:"barbell_row", type:"complement", note:"Rows hit lats/mid-back; face pulls specifically target rear delts and rotator cuff."},
      {exerciseId:"lateral_raise", type:"complement", note:"Side + rear delt coverage for complete deltoid development."}
    ],
    substitutes:[
      {exerciseId:"reverse_fly", similarity:75, note:"DB or machine version. No external rotation component."},
      {exerciseId:"band_pull_apart", similarity:80, note:"Band version. Great warm-up. Can be done anywhere."}
    ],
    scienceNotes:"Face pulls with external rotation are one of the few exercises that train both the posterior deltoid and infraspinatus simultaneously. Critical for shoulder health in pressing-dominant programs. Recommended by most sports physiotherapists as a daily exercise."
  },

  // ════════════════════════════════════════════════════════════
  //  SHOULDERS
  // ════════════════════════════════════════════════════════════

  { id:"overhead_press", name:"Overhead Press", icon:"\u{1F3CB}", color:"#9d4edd",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.35, aliases:["OHP","military press","shoulder press","standing press"],
    musclesPrimary:[
      {muscle:"front_delts", pct:50, note:"Anterior deltoid \u2014 primary shoulder flexion against gravity"},
      {muscle:"side_delts", pct:20, note:"Medial deltoid assists in abduction above 90\u00B0"}
    ],
    musclesSecondary:[
      {muscle:"triceps", pct:20, note:"Elbow extension in top half of press"},
      {muscle:"back_upper", pct:5, note:"Upper traps stabilize at lockout"},
      {muscle:"core", pct:5, note:"Anti-extension stabilization"}
    ],
    stabilizers:["core","back_erector","glutes"],
    movementPattern:"vertical_push",
    biomechanics:"Strict standing press from front rack to overhead lockout. Bar starts on anterior delts, presses in slight arc around face, finishes directly over mid-foot. Standing version requires significant core stability. Head pushes through at lockout (\"look through the window\"). Grip just outside shoulders.",
    repRanges:[
      {goal:"strength", reps:"3-5", rest:180, sets:"4-5", why:"Heavy overhead pressing builds raw pressing strength and shoulder stability. The standing version is a true test of full-body pressing power."},
      {goal:"hypertrophy", reps:"6-10", rest:90, sets:"3-4", why:"Moderate reps for delt mass. Strict form \u2014 no leg drive (that's a push press)."},
      {goal:"endurance", reps:"12-15", rest:60, sets:"2-3", why:"Lighter weight for shoulder endurance and work capacity."}
    ],
    warnings:[
      "Excessive back lean = lumbar hyperextension. Brace core hard, squeeze glutes.",
      "Behind-the-neck pressing = shoulder impingement risk. Press from front.",
      "Lock out fully overhead \u2014 partial reps miss upper trap and scapular upward rotation work"
    ],
    progressionCues:[
      "OHP progresses slowly \u2014 2.5 lb increases are normal and good",
      "Stalled \u2192 add push press for overload or DB press for unilateral work",
      "Microplates (1.25 lbs) are helpful for OHP progression"
    ],
    synergies:[
      {exerciseId:"lateral_raise", type:"complement", note:"OHP is front-delt dominant. Lateral raises target the often-underdeveloped medial delt."},
      {exerciseId:"face_pull", type:"complement", note:"Pressing-to-pulling balance for shoulder health."},
      {exerciseId:"pullup", type:"antagonist", note:"Vertical push/pull superset."}
    ],
    substitutes:[
      {exerciseId:"db_shoulder_press", similarity:85, note:"DB version. Greater ROM, more stabilizer demand. Less total load."},
      {exerciseId:"machine_shoulder_press", similarity:70, note:"Machine version. Good for those with stability issues."}
    ],
    scienceNotes:"Standing OHP shows 7-15% higher core EMG than seated (Saeterbakken 2013). Anterior delt EMG: 80-100% MVC during heavy pressing. The overhead press was the original Olympic press and is still considered the best test of upper body pressing strength."
  },

  { id:"lateral_raise", name:"Lateral Raise", icon:"\u{1F3AF}", color:"#9d4edd",
    category:"isolation", equipment:"dumbbell", difficulty:"beginner", bwRatio:0.05, aliases:["side raise","lateral fly","side delt raise","lat raise"],
    musclesPrimary:[
      {muscle:"side_delts", pct:80, note:"Medial deltoid \u2014 shoulder abduction from 15\u00B0 to 90\u00B0"}
    ],
    musclesSecondary:[
      {muscle:"front_delts", pct:10, note:"Assists in early abduction"},
      {muscle:"back_traps", pct:10, note:"Upper traps activate above 90\u00B0 \u2014 stop at 90\u00B0 to isolate delts"}
    ],
    stabilizers:["core"],
    movementPattern:"lateral_raise",
    biomechanics:"Shoulder abduction in the scapular plane (slightly forward, ~30\u00B0). Slight forward lean increases medial delt tension at the top. Raise to 90\u00B0 only \u2014 above 90\u00B0 shifts to upper trap. Lead with the elbow, not the hand. Slight pinky-up rotation (\"pour the water\") is optional but may increase supraspinatus risk.",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"3-4", why:"Side delts respond well to moderate-high reps with strict form. The muscle is small \u2014 heavy weight just recruits traps."},
      {goal:"endurance", reps:"15-25", rest:30, sets:"2-3", why:"High reps for constant tension and metabolic stress. Great mechanical drop sets."}
    ],
    warnings:[
      "Going too heavy = body English and trap takeover. Use strict form with lighter weight.",
      "Don't raise above 90\u00B0 unless intentionally training traps",
      "Momentum (swinging) completely defeats the purpose of this isolation exercise"
    ],
    progressionCues:[
      "Progress by adding reps or slowing tempo before adding weight",
      "When you can do 15 strict reps, increase by 2.5 lbs",
      "Mechanical drop set: lateral raise \u2192 front raise \u2192 shoulder press with same weight"
    ],
    synergies:[
      {exerciseId:"overhead_press", type:"complement", note:"OHP hits front delt; lateral raises complete the side delt."},
      {exerciseId:"face_pull", type:"complement", note:"Side + rear delt = complete deltoid aesthetic."},
      {exerciseId:"rear_delt_fly", type:"complement", note:"All three delt heads covered."}
    ],
    substitutes:[
      {exerciseId:"cable_lateral_raise", similarity:90, note:"Cable version. Constant tension, especially at the bottom where DBs have zero resistance."},
      {exerciseId:"machine_lateral_raise", similarity:85, note:"Machine version. Fixed path, easier to load progressively."}
    ],
    scienceNotes:"Medial deltoid EMG peaks at 90\u00B0 abduction (Reinold 2009). Cable lateral raises maintain tension throughout ROM whereas DBs have a dead zone at bottom. Side delts have a high proportion of type I fibers, suggesting they respond well to higher rep ranges."
  },

  // ════════════════════════════════════════════════════════════
  //  LEGS - QUADS
  // ════════════════════════════════════════════════════════════

  { id:"barbell_squat", name:"Barbell Back Squat", icon:"\u{1F3CB}", color:"#f77f00",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.6, aliases:["back squat","squat","BB squat"],
    musclesPrimary:[
      {muscle:"quads", pct:50, note:"Quadriceps \u2014 knee extension against heavy load through full ROM"},
      {muscle:"glutes", pct:25, note:"Gluteus maximus \u2014 hip extension from deep position"}
    ],
    musclesSecondary:[
      {muscle:"hamstrings", pct:10, note:"Assist hip extension + knee stabilization"},
      {muscle:"back_erector", pct:10, note:"Isometric spinal stabilization under heavy load"},
      {muscle:"core", pct:5, note:"Intra-abdominal pressure and anti-flexion"}
    ],
    stabilizers:["core","calves","back_upper"],
    movementPattern:"squat",
    biomechanics:"The king of lower body exercises. Bar on upper traps (high bar) or rear delts (low bar). Descend by breaking at hips and knees simultaneously. Depth: hip crease below top of knee = parallel. Deeper = more glute activation. Knees tracking over toes is normal and necessary. Drive through whole foot, not just heels.",
    repRanges:[
      {goal:"strength", reps:"1-5", rest:240, sets:"4-6", why:"Squats are THE strength exercise. Heavy squats produce systemic anabolic response (growth hormone, testosterone elevation) that benefits entire body."},
      {goal:"hypertrophy", reps:"6-12", rest:120, sets:"3-5", why:"Moderate load with full depth. High bar, controlled tempo. Quad hypertrophy is strongly correlated with squat volume."},
      {goal:"endurance", reps:"15-20", rest:90, sets:"2-3", why:"High rep squats (\"widowmakers\" at 20 reps) are brutally effective for leg growth and mental toughness."}
    ],
    warnings:[
      "Butt wink (posterior pelvic tilt) at depth = lumbar flexion under load. Work on ankle/hip mobility.",
      "Knees caving inward = valgus collapse. Cue \"spread the floor\" with feet.",
      "Good morning squat (hips shoot up first) = weak quads. Reduce weight, focus on upright torso.",
      "Always use safety pins/bars when squatting heavy"
    ],
    progressionCues:[
      "Linear progression: add 5 lbs per session (beginners can do this for months)",
      "When linear gains stall, switch to weekly progression (+5 lbs/week)",
      "If depth is the issue, do pause squats (3s hold at bottom) with lighter weight"
    ],
    synergies:[
      {exerciseId:"romanian_deadlift", type:"complement", note:"Squat = quad/glute dominant. RDL = hamstring/glute dominant. Together: complete leg development."},
      {exerciseId:"leg_press", type:"complement", note:"Leg press after squats for additional quad volume without spinal loading."},
      {exerciseId:"leg_curl", type:"complement", note:"Squats underload hamstrings. Direct hamstring work is essential."}
    ],
    substitutes:[
      {exerciseId:"front_squat", similarity:85, note:"More quad dominant, less spinal load, requires less hip mobility."},
      {exerciseId:"leg_press", similarity:70, note:"Machine version. No spinal loading. Less functional."},
      {exerciseId:"goblet_squat", similarity:65, note:"DB version. Great for beginners learning squat pattern."}
    ],
    scienceNotes:"Squats below parallel produce ~25% more glute activation than parallel squats (Caterisano 2002). Systemic hormonal response: acute testosterone increase of 15-20% and GH increase of 200-400% following heavy squat sessions (Kraemer 1990). Quad EMG: 80-100% MVC at 70-90% 1RM."
  },

  { id:"front_squat", name:"Front Squat", icon:"\u{1F3CB}", color:"#f77f00",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.45, aliases:["front rack squat"],
    musclesPrimary:[
      {muscle:"quads", pct:60, note:"More quad-dominant than back squat due to upright torso"},
      {muscle:"glutes", pct:20, note:"Hip extension from deep position"}
    ],
    musclesSecondary:[
      {muscle:"core", pct:10, note:"Significant anti-flexion demand to keep torso upright"},
      {muscle:"back_upper", pct:5, note:"Upper back must fight to prevent bar rolling forward"},
      {muscle:"hamstrings", pct:5, note:"Knee stabilization"}
    ],
    stabilizers:["core","back_erector","back_upper"],
    movementPattern:"squat",
    biomechanics:"Bar rests on front deltoids in clean grip or cross-arm position. Elbows high throughout. More upright torso = more knee flexion = more quad loading. Less spinal compression than back squat at equal quad stimulus. Requires good wrist, shoulder, and ankle mobility.",
    repRanges:[
      {goal:"strength", reps:"2-5", rest:180, sets:"4-5", why:"Front squat strength directly transfers to Olympic lifts and back squat. Core strength under load is a massive benefit."},
      {goal:"hypertrophy", reps:"6-10", rest:120, sets:"3-4", why:"Excellent quad builder with less spinal loading than back squat."},
      {goal:"endurance", reps:"10-15", rest:90, sets:"2-3", why:"Higher reps with lighter weight. Upper back fatigue often limits before legs."}
    ],
    warnings:[
      "Elbows dropping = bar rolls forward. Cue: \"elbows to the ceiling\"",
      "Wrist pain with clean grip \u2192 use cross-arm or strap-assisted grip",
      "Upper back rounding under load = too heavy. Front squat self-limits \u2014 you'll dump the bar safely."
    ],
    progressionCues:[
      "Front squat is typically 70-85% of back squat weight",
      "Wrist mobility is often the bottleneck \u2014 stretch wrists daily",
      "Progress 5 lbs per session for beginners, 2.5-5 lbs/week for intermediates"
    ],
    synergies:[
      {exerciseId:"barbell_squat", type:"complement", note:"Front + back squat in same program = complete quad and glute development with different stress patterns."},
      {exerciseId:"leg_extension", type:"superset", note:"Compound-to-isolation for quad burnout."}
    ],
    substitutes:[
      {exerciseId:"barbell_squat", similarity:80, note:"Less quad-specific but allows heavier loading."},
      {exerciseId:"goblet_squat", similarity:75, note:"DB version of front-loaded squat. Easier to learn."},
      {exerciseId:"hack_squat", similarity:70, note:"Machine version with similar quad emphasis."}
    ],
    scienceNotes:"Front squat shows ~10% higher vastus medialis (inner quad) activation than back squat (Gullett 2009). Compressive force on the knee is actually LOWER in front squat vs back squat due to reduced forward lean. Excellent rehab exercise post-ACL."
  },

  { id:"leg_press", name:"Leg Press", icon:"\u{1F3CB}", color:"#f77f00",
    category:"compound", equipment:"machine", difficulty:"beginner", bwRatio:1, aliases:["machine leg press","45 degree leg press"],
    musclesPrimary:[
      {muscle:"quads", pct:55, note:"Knee extension against sled resistance"},
      {muscle:"glutes", pct:25, note:"Hip extension from deep position"}
    ],
    musclesSecondary:[
      {muscle:"hamstrings", pct:15, note:"Assist hip extension"},
      {muscle:"calves", pct:5, note:"Ankle plantar flexion at bottom"}
    ],
    stabilizers:[],
    movementPattern:"squat",
    biomechanics:"Machine squat pattern without spinal loading. Foot placement determines emphasis: high + wide = more glute/hamstring, low + narrow = more quad. Descend until knees reach ~90\u00B0 or deeper if mobility allows. Don't let lower back round off the pad at the bottom. Full lockout optional \u2014 keeping slight bend maintains tension.",
    repRanges:[
      {goal:"strength", reps:"5-8", rest:150, sets:"3-5", why:"Heavy leg press builds raw leg strength without taxing the back. Good after squats to continue loading legs."},
      {goal:"hypertrophy", reps:"10-15", rest:90, sets:"3-4", why:"Classic bodybuilding rep range. Leg press allows high volume with minimal CNS fatigue."},
      {goal:"endurance", reps:"20-30", rest:60, sets:"2-3", why:"High rep leg press is a brutal finisher. Quads burn."}
    ],
    warnings:[
      "Don't let lower back round off the pad \u2014 reduce depth if needed",
      "Locking knees fully under heavy load can be dangerous \u2014 keep slight bend",
      "Don't ego-load with 1/4 reps. Full ROM with moderate weight > heavy partials."
    ],
    progressionCues:[
      "Add 10-20 lbs per session. Leg press numbers climb fast.",
      "When progress stalls, try tempo work (4s eccentric, 2s pause at bottom)",
      "Single-leg press for unilateral work and identifying imbalances"
    ],
    synergies:[
      {exerciseId:"barbell_squat", type:"complement", note:"Squat for compounds, leg press for volume. Classic combo."},
      {exerciseId:"leg_extension", type:"superset", note:"Leg press to leg extension \u2014 compound to isolation quad destroyer."},
      {exerciseId:"leg_curl", type:"superset", note:"Quad-dominant press + hamstring isolation for balance."}
    ],
    substitutes:[
      {exerciseId:"barbell_squat", similarity:75, note:"Free weight version. More functional, more core demand."},
      {exerciseId:"hack_squat", similarity:85, note:"Similar machine movement with more quad emphasis."}
    ],
    scienceNotes:"Leg press EMG shows comparable quad activation to squats at equivalent relative loads (Escamilla 2001). Low foot placement increases knee extension moment = more quad. No spinal compression = can train legs heavy on days when back is fatigued."
  },

  { id:"leg_extension", name:"Leg Extension", icon:"\u{1F3AF}", color:"#f77f00",
    category:"isolation", equipment:"machine", difficulty:"beginner", bwRatio:0.25, aliases:["quad extension","knee extension","leg ext"],
    musclesPrimary:[
      {muscle:"quads", pct:95, note:"Pure quadriceps isolation through open-chain knee extension"},
      {muscle:"core", pct:5, note:"Minor stabilization"}
    ],
    musclesSecondary:[],
    stabilizers:[],
    movementPattern:"knee_extension",
    biomechanics:"Open-chain knee extension isolating the quads. Rectus femoris is most active in the shortened position (full extension). Extend fully and squeeze at the top for peak contraction. Controlled eccentric. Seat adjustment matters: back of knee should align with the axis of rotation.",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"3-4", why:"Moderate reps with controlled tempo. Great for quad hypertrophy as a finisher after compounds."},
      {goal:"endurance", reps:"15-25", rest:30, sets:"2-3", why:"High reps for massive quad pump and metabolic stress."}
    ],
    warnings:[
      "Previously thought to be hard on the ACL \u2014 recent research shows it's safe for healthy knees at moderate loads",
      "Don't bounce at the bottom \u2014 controlled ROM only",
      "Avoid if currently rehabbing acute knee injury (follow PT guidance)"
    ],
    progressionCues:[
      "Progress by adding reps or tempo before weight",
      "Try partial reps at end of set for extra quad stimulus",
      "Single-leg extensions expose imbalances"
    ],
    synergies:[
      {exerciseId:"barbell_squat", type:"complement", note:"Compound + isolation for maximum quad stimulus."},
      {exerciseId:"leg_curl", type:"superset", note:"Extension + curl superset = complete thigh work."}
    ],
    substitutes:[
      {exerciseId:"sissy_squat", similarity:70, note:"Bodyweight quad isolation. Harder than it looks."},
      {exerciseId:"front_squat", similarity:50, note:"Compound alternative with high quad emphasis."}
    ],
    scienceNotes:"Leg extension is one of the few exercises that fully isolates the quads without hamstring co-contraction. Rectus femoris is maximally shortened at full extension \u2014 peak contraction. Recent meta-analysis shows no increased ACL injury risk in healthy individuals (Jewiss 2017)."
  },

  // ════════════════════════════════════════════════════════════
  //  LEGS - HAMSTRINGS / GLUTES
  // ════════════════════════════════════════════════════════════

  { id:"romanian_deadlift", name:"Romanian Deadlift", icon:"\u{1F3CB}", color:"#f77f00",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.45, aliases:["RDL","romanian DL","stiff leg deadlift","SLDL"],
    musclesPrimary:[
      {muscle:"hamstrings", pct:45, note:"Hamstrings through deep eccentric stretch under load"},
      {muscle:"glutes", pct:30, note:"Hip extension from stretched position"}
    ],
    musclesSecondary:[
      {muscle:"back_erector", pct:15, note:"Isometric spinal stabilization"},
      {muscle:"back_upper", pct:5, note:"Upper back maintains bar position"},
      {muscle:"forearms", pct:5, note:"Grip endurance"}
    ],
    stabilizers:["core","calves"],
    movementPattern:"hip_hinge",
    biomechanics:"Hip hinge with slight knee bend. Bar slides down thighs, hips push back. Hamstrings stretch as hips flex. Go as deep as hamstring flexibility allows while maintaining flat back \u2014 typically mid-shin to just below knee. Squeeze glutes hard at top lockout. This is NOT a deadlift from the floor.",
    repRanges:[
      {goal:"strength", reps:"5-8", rest:150, sets:"3-4", why:"Heavy RDLs build posterior chain strength. Eccentric loading builds hamstring resilience \u2014 injury prevention benefit."},
      {goal:"hypertrophy", reps:"8-12", rest:90, sets:"3-4", why:"Moderate load with slow eccentric (3s down). The stretch under load is the primary hypertrophy stimulus."},
      {goal:"endurance", reps:"12-15", rest:60, sets:"2-3", why:"Lighter weight for hamstring endurance and work capacity."}
    ],
    warnings:[
      "Rounding the lower back = disc injury risk. Maintain neutral spine throughout.",
      "Don't go past the point where your back starts to round. Flexibility is the limiting factor.",
      "This is a hip hinge, not a squat. Minimal knee bend. Hips go BACK."
    ],
    progressionCues:[
      "Progress 5-10 lbs per session when form stays strict",
      "If grip limits you, use mixed grip or straps",
      "Deficit RDLs (standing on a plate) increase ROM for advanced lifters"
    ],
    synergies:[
      {exerciseId:"barbell_squat", type:"complement", note:"Squat = quad dominant. RDL = hamstring dominant. Essential pairing."},
      {exerciseId:"leg_curl", type:"complement", note:"RDL hits hamstrings at the hip. Leg curl hits them at the knee. Both are needed."},
      {exerciseId:"hip_thrust", type:"complement", note:"RDL + hip thrust = complete glute work through different ranges."}
    ],
    substitutes:[
      {exerciseId:"stiff_leg_deadlift", similarity:90, note:"Even less knee bend. More hamstring stretch. Higher technical demand."},
      {exerciseId:"good_morning", similarity:75, note:"Bar on back instead of in hands. Similar hip hinge."},
      {exerciseId:"db_rdl", similarity:85, note:"DB version. Less total load but easier to learn."}
    ],
    scienceNotes:"RDL produces highest hamstring EMG during the eccentric phase (McAllister 2014). Eccentric hamstring training reduces injury risk by 51% (Petersen 2011, n=942 soccer players). Stretch-mediated hypertrophy makes RDL superior to leg curl for hamstring growth at long muscle lengths."
  },

  { id:"leg_curl", name:"Leg Curl (Lying/Seated)", icon:"\u{1F3AF}", color:"#f77f00",
    category:"isolation", equipment:"machine", difficulty:"beginner", bwRatio:0.2, aliases:["hamstring curl","lying leg curl","seated leg curl"],
    musclesPrimary:[
      {muscle:"hamstrings", pct:90, note:"Pure hamstring isolation through knee flexion"},
      {muscle:"calves", pct:10, note:"Gastrocnemius assists in knee flexion"}
    ],
    musclesSecondary:[],
    stabilizers:[],
    movementPattern:"knee_flexion",
    biomechanics:"Isolated knee flexion. Lying version = more hamstring stretch at start. Seated version = more tension at peak contraction. Both are valuable. Full ROM \u2014 fully extend at bottom, curl as far as possible at top. Toes pointed away reduces calf assistance and increases hamstring isolation.",
    repRanges:[
      {goal:"hypertrophy", reps:"8-12", rest:60, sets:"3-4", why:"Moderate reps with strict form. Control the eccentric \u2014 don't let the weight stack slam down."},
      {goal:"endurance", reps:"15-20", rest:30, sets:"2-3", why:"High reps for hamstring endurance. Great finisher."}
    ],
    warnings:[
      "Don't lift hips off the pad (lying) to cheat the weight up",
      "Hamstring cramps during curls = dehydration or electrolyte imbalance",
      "If you feel it in your lower back, the weight is too heavy"
    ],
    progressionCues:[
      "Increase weight when all sets completed with controlled form",
      "Eccentric emphasis: curl up with both legs, lower with one leg",
      "Isometric holds at peak contraction (2-3s) for advanced stimulus"
    ],
    synergies:[
      {exerciseId:"romanian_deadlift", type:"complement", note:"RDL = hamstrings at the hip. Curl = hamstrings at the knee. You need BOTH for complete development."},
      {exerciseId:"leg_extension", type:"superset", note:"Curl + extension superset = complete thigh work with no wasted time."}
    ],
    substitutes:[
      {exerciseId:"nordic_curl", similarity:75, note:"Bodyweight version. Extremely challenging. Elite hamstring exercise."},
      {exerciseId:"swiss_ball_curl", similarity:60, note:"Stability ball version. Good home alternative."}
    ],
    scienceNotes:"Seated leg curl produces higher hamstring EMG at short muscle lengths vs lying curl which is better at long lengths (Maeo 2021). Ideally do BOTH variations or combine with RDLs for full length-tension coverage."
  },

  { id:"hip_thrust", name:"Hip Thrust", icon:"\u{1F4AA}", color:"#e63946",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.5, aliases:["barbell hip thrust","glute bridge","BB hip thrust"],
    musclesPrimary:[
      {muscle:"glutes", pct:70, note:"Gluteus maximus \u2014 peak activation at top of hip extension"},
      {muscle:"hamstrings", pct:20, note:"Assist hip extension"}
    ],
    musclesSecondary:[
      {muscle:"core", pct:5, note:"Stabilization"},
      {muscle:"quads", pct:5, note:"Knee extension to maintain position"}
    ],
    stabilizers:["core"],
    movementPattern:"hip_extension",
    biomechanics:"Upper back on bench, bar across hips, feet flat on floor. Drive hips up by squeezing glutes. At top: shins vertical, hips fully extended, chin tucked (posterior pelvic tilt). Don't hyperextend the lower back at the top. The glute is maximally loaded at the top where it's fully shortened \u2014 this is unique to hip thrusts.",
    repRanges:[
      {goal:"strength", reps:"5-8", rest:120, sets:"3-4", why:"Heavy hip thrusts build peak glute strength at full extension."},
      {goal:"hypertrophy", reps:"8-15", rest:75, sets:"3-4", why:"Classic hypertrophy range. Pause at top for 1-2 seconds for peak contraction."},
      {goal:"endurance", reps:"15-25", rest:45, sets:"2-3", why:"High rep thrusts for glute endurance and pump."}
    ],
    warnings:[
      "Hyperextending the lower back at the top = lumbar pain. Squeeze glutes, not arch back.",
      "Bar placement: use a thick pad. Unpadded bar across hip bones is painful and limits performance.",
      "Don't push through heels only \u2014 drive through whole foot."
    ],
    progressionCues:[
      "Hip thrusts progress fast. 10-20 lb increases per session are normal early on.",
      "When bodyweight is easy, add a band around knees for extra glute activation",
      "Single-leg hip thrusts are the gold standard for glute activation"
    ],
    synergies:[
      {exerciseId:"barbell_squat", type:"complement", note:"Squat loads glutes at long muscle length. Hip thrust loads at short length. Both needed for full development."},
      {exerciseId:"romanian_deadlift", type:"complement", note:"RDL = glute stretch under load. Hip thrust = glute peak contraction under load."}
    ],
    substitutes:[
      {exerciseId:"glute_bridge", similarity:85, note:"Floor version. Less ROM but easier setup. Good starting point."},
      {exerciseId:"cable_pull_through", similarity:65, note:"Standing hip extension. Less peak contraction loading."}
    ],
    scienceNotes:"Hip thrust produces highest peak glute EMG of any exercise (Contreras 2015). Upper gluteus maximus: 86% MVC, lower gluteus maximus: 98% MVC. Squats load glutes most at the bottom; hip thrusts load glutes most at the top. These exercises are complementary, not redundant."
  },

  // ════════════════════════════════════════════════════════════
  //  LEGS - CALVES
  // ════════════════════════════════════════════════════════════

  { id:"standing_calf_raise", name:"Standing Calf Raise", icon:"\u{1F4AA}", color:"#f77f00",
    category:"isolation", equipment:"machine", difficulty:"beginner", bwRatio:0.5, aliases:["calf raise","standing calf","machine calf raise"],
    musclesPrimary:[
      {muscle:"calves", pct:90, note:"Gastrocnemius \u2014 both heads. Straight knee maximizes gastrocnemius contribution."},
      {muscle:"core", pct:10, note:"Balance stabilization"}
    ],
    musclesSecondary:[],
    stabilizers:["core"],
    movementPattern:"ankle_plantar_flexion",
    biomechanics:"Ankle plantar flexion with straight legs. Full ROM is essential: stretch at bottom (heel below platform), drive to peak contraction at top. Straight legs maximize gastrocnemius (the visible calf muscle). Toe angle affects emphasis: neutral = both heads, toes in = lateral head, toes out = medial head (but differences are minimal).",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"4-6", why:"Calves have high Type I fiber content and need volume. 4-6 sets with controlled tempo (2-3s eccentric, 1s pause at stretch)."},
      {goal:"endurance", reps:"20-30", rest:30, sets:"3-4", why:"Calves are used for thousands of steps daily. High reps mimic their natural function."}
    ],
    warnings:[
      "Bouncing at the bottom wastes the stretch reflex \u2014 pause at the bottom for 1-2s",
      "Partial reps are common. Use full ROM even if it means less weight.",
      "Don't hyperextend knees under heavy load"
    ],
    progressionCues:[
      "Progress in reps first, then weight. Calves need volume over load.",
      "Train calves 3-4x per week \u2014 they recover fast due to high type I fiber content",
      "Slow eccentrics (5s) are extremely effective for calf growth"
    ],
    synergies:[
      {exerciseId:"seated_calf_raise", type:"complement", note:"Standing = gastrocnemius. Seated = soleus. Both needed for complete calf development."}
    ],
    substitutes:[
      {exerciseId:"seated_calf_raise", similarity:70, note:"Targets soleus more than gastrocnemius due to bent knee."},
      {exerciseId:"donkey_calf_raise", similarity:90, note:"Same muscle emphasis with different loading angle. Arnold's favorite."}
    ],
    scienceNotes:"Gastrocnemius is ~50% Type I (slow-twitch) fibers, explaining why calves often need higher volume and frequency to grow. Standing calf raise EMG shows ~20% higher gastrocnemius activation than seated (Riemann 2011)."
  },

  // ════════════════════════════════════════════════════════════
  //  ARMS - BICEPS
  // ════════════════════════════════════════════════════════════

  { id:"barbell_curl", name:"Barbell Curl", icon:"\u{1F4AA}", color:"#ffd60a",
    category:"isolation", equipment:"barbell", difficulty:"beginner", bwRatio:0.15, aliases:["bicep curl","BB curl","EZ bar curl"],
    musclesPrimary:[
      {muscle:"biceps", pct:80, note:"Both heads of biceps brachii \u2014 elbow flexion with supinated grip"},
      {muscle:"forearms", pct:20, note:"Brachioradialis and wrist flexors assist"}
    ],
    musclesSecondary:[],
    stabilizers:["core"],
    movementPattern:"elbow_flexion",
    biomechanics:"Standing elbow flexion with supinated (palms up) grip. Upper arms stay pinned to sides. Curl through full ROM from full extension to peak contraction. Straight bar forces full supination which maximally activates the short head. EZ bar is easier on wrists but slightly reduces supination.",
    repRanges:[
      {goal:"strength", reps:"5-8", rest:120, sets:"3-4", why:"Heavy curls build bicep strength. Cheat curls (slight body English on last reps) are a valid advanced technique when used purposefully."},
      {goal:"hypertrophy", reps:"8-12", rest:60, sets:"3-4", why:"Classic bicep rep range. Control the eccentric (3s down). Don't swing."},
      {goal:"endurance", reps:"15-20", rest:30, sets:"2-3", why:"High rep curls for pump and metabolic stress."}
    ],
    warnings:[
      "Swinging the body to lift the weight = using momentum, not biceps",
      "Hyperextending elbows at the bottom risks bicep tendon strain",
      "Wrist pain with straight bar \u2192 switch to EZ bar"
    ],
    progressionCues:[
      "Bicep exercises progress slowly. 2.5-5 lb increases are normal.",
      "When 12 reps is easy with strict form, increase weight",
      "21s (7 bottom half, 7 top half, 7 full) are an effective intensity technique"
    ],
    synergies:[
      {exerciseId:"hammer_curl", type:"complement", note:"Barbell curl = short head emphasis. Hammer curl = long head + brachialis."},
      {exerciseId:"incline_db_curl", type:"complement", note:"Incline curl stretches the long head more. Different length-tension emphasis."}
    ],
    substitutes:[
      {exerciseId:"db_curl", similarity:90, note:"Dumbbell version. Allows natural supination and unilateral work."},
      {exerciseId:"cable_curl", similarity:85, note:"Cable version. Constant tension throughout ROM."}
    ],
    scienceNotes:"Supinated grip barbell curl shows highest short head biceps EMG. EZ bar shows ~10% less bicep activation but significantly less wrist strain (Marcolin 2018). Incline curls produce highest long head activation due to increased stretch."
  },

  { id:"hammer_curl", name:"Hammer Curl", icon:"\u{1F4AA}", color:"#ffd60a",
    category:"isolation", equipment:"dumbbell", difficulty:"beginner", bwRatio:0.1, aliases:["neutral grip curl","hammer curls"],
    musclesPrimary:[
      {muscle:"biceps", pct:50, note:"Long head of biceps \u2014 neutral grip shifts emphasis from short to long head"},
      {muscle:"forearms", pct:50, note:"Brachioradialis \u2014 primary elbow flexor in neutral grip position"}
    ],
    musclesSecondary:[],
    stabilizers:["core"],
    movementPattern:"elbow_flexion",
    biomechanics:"Elbow flexion with neutral (palms facing each other) grip. Targets the brachioradialis (forearm) and long head of biceps more than supinated curls. Also heavily recruits the brachialis (muscle underneath the bicep that pushes it up for a bigger arm appearance). Can be done alternating or simultaneously.",
    repRanges:[
      {goal:"hypertrophy", reps:"8-12", rest:60, sets:"3-4", why:"Classic rep range. Hammer curls are typically stronger than regular curls \u2014 the brachioradialis is powerful."},
      {goal:"endurance", reps:"15-20", rest:30, sets:"2-3", why:"High rep hammer curls for forearm endurance and grip."}
    ],
    warnings:[
      "Don't swing. Upper arms stay still.",
      "Avoid letting the wrist bend backward under load"
    ],
    progressionCues:[
      "Typically stronger than regular curls. Progress 5 lb jumps.",
      "Cross-body hammer curls (across the body) hit the brachialis more",
      "Rope cable hammer curls provide constant tension"
    ],
    synergies:[
      {exerciseId:"barbell_curl", type:"complement", note:"Supinated curl + neutral curl = complete bicep and forearm development."},
      {exerciseId:"reverse_curl", type:"complement", note:"Hammer + reverse curl = complete forearm and brachialis coverage."}
    ],
    substitutes:[
      {exerciseId:"cable_hammer_curl", similarity:90, note:"Cable version with rope attachment. Constant tension."},
      {exerciseId:"reverse_curl", similarity:70, note:"Pronated grip. Even more brachioradialis, less bicep."}
    ],
    scienceNotes:"Neutral grip shifts activation from biceps brachii to brachioradialis and brachialis. The brachialis sits under the biceps and when developed, pushes the bicep up for a bigger arm appearance. Hammer curls are essential for arm thickness, not just peak."
  },

  // ════════════════════════════════════════════════════════════
  //  ARMS - TRICEPS
  // ════════════════════════════════════════════════════════════

  { id:"tricep_pushdown", name:"Tricep Pushdown", icon:"\u{1F3AF}", color:"#ffd60a",
    category:"isolation", equipment:"cable", difficulty:"beginner", bwRatio:0.15, aliases:["rope pushdown","cable pushdown","tri pushdown"],
    musclesPrimary:[
      {muscle:"triceps", pct:90, note:"All three heads \u2014 lateral and medial heads emphasized at this angle"},
      {muscle:"forearms", pct:10, note:"Wrist stabilization"}
    ],
    musclesSecondary:[],
    stabilizers:["core"],
    movementPattern:"elbow_extension",
    biomechanics:"Standing elbow extension against cable resistance. Upper arms pinned to sides. Extend fully at bottom and squeeze. Rope attachment allows for wrist rotation (\"spreading the rope\") at the bottom for extra lateral head activation. Straight bar = heavier loading, rope = more range and contraction.",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"3-4", why:"Moderate-high reps with strict form. Feel the squeeze at full extension. Triceps respond well to volume."},
      {goal:"endurance", reps:"15-25", rest:30, sets:"2-3", why:"High reps for pump. Great finisher."}
    ],
    warnings:[
      "Leaning forward and using bodyweight to push = cheating. Stand upright.",
      "Elbows drifting forward = shoulder involvement. Keep elbows pinned.",
      "Don't let the weight stack slam between reps"
    ],
    progressionCues:[
      "Progress in reps first, then add weight",
      "Try different attachments: straight bar, V-bar, rope for variation",
      "Drop sets are extremely effective on cable pushdowns"
    ],
    synergies:[
      {exerciseId:"overhead_tricep_ext", type:"complement", note:"Pushdown = lateral/medial head. Overhead = long head (stretched position)."},
      {exerciseId:"barbell_bench_press", type:"complement", note:"Compound pressing + isolation extension = complete tricep work."}
    ],
    substitutes:[
      {exerciseId:"overhead_tricep_ext", similarity:70, note:"Different angle \u2014 more long head. Complementary, not the same."},
      {exerciseId:"close_grip_bench", similarity:65, note:"Compound alternative for heavy tricep loading."}
    ],
    scienceNotes:"Tricep pushdown shows highest lateral and medial head EMG among isolation exercises. Long head is relatively underloaded because the arm is at the side (long head crosses the shoulder joint). For complete tricep development, combine with overhead extensions."
  },

  { id:"overhead_tricep_ext", name:"Overhead Tricep Extension", icon:"\u{1F3AF}", color:"#ffd60a",
    category:"isolation", equipment:"dumbbell", difficulty:"beginner", bwRatio:0.1, aliases:["skull crusher","french press","overhead extension"],
    musclesPrimary:[
      {muscle:"triceps", pct:90, note:"Long head of triceps \u2014 maximally stretched in overhead position"},
      {muscle:"forearms", pct:10, note:"Wrist stabilization"}
    ],
    musclesSecondary:[],
    stabilizers:["core"],
    movementPattern:"elbow_extension",
    biomechanics:"Elbow extension with arm overhead. The long head of the triceps crosses both the elbow and shoulder joints. Putting the arm overhead stretches the long head, increasing its activation. Can use single DB (two-handed), cable, or single-arm variations. Full stretch at bottom, full extension at top.",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"3-4", why:"Moderate reps with controlled stretch at the bottom. The stretch-mediated stimulus is the key benefit of this exercise."},
      {goal:"endurance", reps:"15-20", rest:30, sets:"2-3", why:"High reps for metabolic stress and pump in the long head."}
    ],
    warnings:[
      "Elbows flaring wide reduces long head emphasis. Keep elbows close to head.",
      "Don't go too heavy \u2014 shoulder strain risk in overhead position",
      "If shoulder impingement occurs overhead, switch to incline skull crushers"
    ],
    progressionCues:[
      "Progress by reps then weight. 2.5-5 lb increases.",
      "Cable overhead extension provides constant tension vs DB which has a dead zone",
      "Single-arm version addresses left-right imbalances"
    ],
    synergies:[
      {exerciseId:"tricep_pushdown", type:"complement", note:"Pushdown = lateral/medial head. Overhead = long head. Both essential."},
      {exerciseId:"dip", type:"complement", note:"Compound (dip) + isolation (overhead ext) for complete tricep work."}
    ],
    substitutes:[
      {exerciseId:"skull_crusher", similarity:80, note:"Lying version. Similar long head stretch with less shoulder demand."},
      {exerciseId:"cable_overhead_ext", similarity:95, note:"Cable version. Constant tension. Slightly better stimulus."}
    ],
    scienceNotes:"The long head of the triceps makes up ~50% of total tricep mass. It's maximally activated when the arm is overhead (Kholinne 2018). Stretch-mediated hypertrophy (Pedrosa 2023): training muscles at long lengths produces superior growth. Overhead extensions exploit this for the long head."
  },

  // ════════════════════════════════════════════════════════════
  //  COMPOUND LIFTS
  // ════════════════════════════════════════════════════════════

  { id:"deadlift", name:"Conventional Deadlift", icon:"\u{1F3CB}", color:"#e63946",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.7, aliases:["conventional deadlift","DL","barbell deadlift"],
    musclesPrimary:[
      {muscle:"back_erector", pct:25, note:"Erector spinae \u2014 maintains spinal extension under maximal load"},
      {muscle:"glutes", pct:25, note:"Hip extension from the floor"},
      {muscle:"hamstrings", pct:20, note:"Hip extension + knee stabilization"},
      {muscle:"quads", pct:15, note:"Knee extension off the floor (first half of pull)"}
    ],
    musclesSecondary:[
      {muscle:"back_lats", pct:5, note:"Keeps bar close to body"},
      {muscle:"back_upper", pct:5, note:"Scapular retraction at lockout"},
      {muscle:"forearms", pct:5, note:"Grip"}
    ],
    stabilizers:["core","calves","back_upper"],
    movementPattern:"hip_hinge",
    biomechanics:"The most complete posterior chain exercise. Bar starts on the floor, pulled to lockout. Hip hinge + knee extension. Setup: bar over mid-foot, shoulder blades over bar, neutral spine, brace core. Push floor away (leg drive off floor) then hip hinge to lockout. Bar stays in contact with legs throughout. NOT a squat with the bar in your hands.",
    repRanges:[
      {goal:"strength", reps:"1-5", rest:300, sets:"3-5", why:"Heavy deadlifts build total-body strength. The heaviest lift most people will ever perform. Long rest periods required due to CNS demand."},
      {goal:"hypertrophy", reps:"5-8", rest:180, sets:"3-4", why:"Moderate reps. Controlled eccentric. Deadlifts are taxing \u2014 lower rep hypertrophy work is more practical."},
      {goal:"endurance", reps:"10-15", rest:120, sets:"2-3", why:"Higher rep deadlifts are brutal on the cardiovascular system. Good for general conditioning."}
    ],
    warnings:[
      "Rounding the lower back under load = disc injury risk. If your back rounds, the weight is too heavy.",
      "Don't jerk the bar off the floor. Take the slack out first, then pull.",
      "Mixed grip: alternate which hand is supinated to prevent imbalances. Or use hook grip / straps.",
      "Heavy deadlifts are CNS-intensive. Don't deadlift heavy more than 1-2x per week."
    ],
    progressionCues:[
      "Beginners: +10 lbs per session is common for the first few months",
      "Intermediate: +5 lbs per week or per two weeks",
      "Plateau \u2192 try deficit deadlifts (stand on plate) for off-the-floor weakness, or rack pulls for lockout weakness"
    ],
    synergies:[
      {exerciseId:"barbell_squat", type:"complement", note:"Squat + deadlift = the two pillars of strength training. Squat is quad-dominant, deadlift is posterior-chain dominant."},
      {exerciseId:"barbell_row", type:"complement", note:"Deadlift builds the posterior chain. Row builds the upper back. Together they build a bulletproof back."},
      {exerciseId:"hip_thrust", type:"complement", note:"Deadlift loads glutes at stretched position. Hip thrust loads at shortened position."}
    ],
    substitutes:[
      {exerciseId:"sumo_deadlift", similarity:85, note:"Wider stance, more upright torso. More quad and adductor, less lower back."},
      {exerciseId:"trap_bar_deadlift", similarity:80, note:"Neutral grip, more centered load. Easier on the lower back. Good starting point."},
      {exerciseId:"romanian_deadlift", similarity:70, note:"Top-down version. More hamstring emphasis, less off-the-floor quad work."}
    ],
    scienceNotes:"Deadlift activates more total muscle mass than any other single exercise. Erector spinae: 80-100% MVC. Gluteus maximus: 70-90% MVC (Escamilla 2001). Acute hormonal response comparable to squats. Grip strength is often the limiting factor \u2014 address with hook grip or straps to avoid limiting back development."
  },

  // ════════════════════════════════════════════════════════════
  //  CORE
  // ════════════════════════════════════════════════════════════

  { id:"cable_crunch", name:"Cable Crunch", icon:"\u{1F3AF}", color:"#06d6a0",
    category:"isolation", equipment:"cable", difficulty:"beginner", bwRatio:0.2, aliases:["ab crunch","cable ab","kneeling crunch"],
    musclesPrimary:[
      {muscle:"core", pct:90, note:"Rectus abdominis \u2014 spinal flexion against cable resistance"}
    ],
    musclesSecondary:[
      {muscle:"front_delts", pct:10, note:"Isometric hold of the rope"}
    ],
    stabilizers:[],
    movementPattern:"spinal_flexion",
    biomechanics:"Kneeling in front of cable, rope behind head. Crunch by flexing the spine (ribs toward pelvis), NOT by bending at the hips. The distinction is critical: hip flexion = hip flexors doing the work. Spinal flexion = abs doing the work. Weight is adjustable, making this one of the best exercises for progressive overload on abs.",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"3-4", why:"Abs respond to progressive overload just like any other muscle. Cable crunches allow you to add weight over time."},
      {goal:"endurance", reps:"15-25", rest:30, sets:"2-3", why:"Higher reps for metabolic stress and endurance."}
    ],
    warnings:[
      "Don't flex at the hips \u2014 flex at the SPINE. Hips stay stationary.",
      "Pulling with arms = arm exercise, not ab exercise. Arms just hold the rope.",
      "If you feel this in your hip flexors, you're doing it wrong"
    ],
    progressionCues:[
      "Progress by adding weight on the cable stack",
      "Pause at peak contraction (2s) for extra difficulty",
      "Slow eccentric (3-4s) increases time under tension significantly"
    ],
    synergies:[
      {exerciseId:"hanging_leg_raise", type:"complement", note:"Cable crunch = upper abs emphasis (flexion from top). Leg raise = lower abs emphasis (flexion from bottom)."},
      {exerciseId:"plank", type:"complement", note:"Dynamic (crunch) + isometric (plank) = complete ab training."}
    ],
    substitutes:[
      {exerciseId:"weighted_crunch", similarity:80, note:"Floor version with plate on chest. Less range of motion."},
      {exerciseId:"ab_rollout", similarity:70, note:"Different movement pattern but excellent ab exercise."}
    ],
    scienceNotes:"Cable crunches allow progressive overload \u2014 the key driver of muscle growth. Abs are muscles like any other: they grow with progressive tension, adequate volume (10-20 sets/week), and proper nutrition. Bodyweight crunches become too easy quickly for trained individuals."
  },

  { id:"hanging_leg_raise", name:"Hanging Leg Raise", icon:"\u{1F4AA}", color:"#06d6a0",
    category:"compound", equipment:"bodyweight", difficulty:"beginner", bwRatio:0, aliases:["leg raise","hanging raise","knee raise"],
    musclesPrimary:[
      {muscle:"core", pct:80, note:"Rectus abdominis + hip flexors \u2014 posterior pelvic tilt is key to ab activation"}
    ],
    musclesSecondary:[
      {muscle:"forearms", pct:20, note:"Grip endurance hanging from bar"}
    ],
    stabilizers:["back_lats"],
    movementPattern:"spinal_flexion",
    biomechanics:"Hang from pull-up bar. Raise legs by curling the pelvis up (posterior pelvic tilt), not just lifting legs. Lifting straight legs without pelvic tilt = hip flexor exercise. Curling the pelvis = ab exercise. Full version: toes to bar. Regression: bent knee raises. The difference between a hip flexor exercise and an ab exercise is the pelvic tilt.",
    repRanges:[
      {goal:"hypertrophy", reps:"8-15", rest:60, sets:"3-4", why:"Bodyweight progressive exercise. Add ankle weights or DB between feet for overload."},
      {goal:"endurance", reps:"15-25", rest:30, sets:"2-3", why:"High rep leg raises for endurance and control."}
    ],
    warnings:[
      "Swinging = momentum, not abs. Control the movement.",
      "If you only feel hip flexors, focus on the pelvic tilt at the top",
      "Grip often fails before abs \u2014 use straps if needed"
    ],
    progressionCues:[
      "Progression: bent knee raises \u2192 straight leg raises \u2192 toes to bar \u2192 weighted",
      "L-sit holds (isometric at 90\u00B0) are excellent for building static strength",
      "If grip is the limiter, use ab straps"
    ],
    synergies:[
      {exerciseId:"cable_crunch", type:"complement", note:"Leg raise = bottom-up flexion. Crunch = top-down flexion. Together = complete ab development."},
      {exerciseId:"pullup", type:"complement", note:"Both use the pull-up bar. Alternate sets for efficiency."}
    ],
    substitutes:[
      {exerciseId:"lying_leg_raise", similarity:80, note:"Floor version. Easier on grip. Same ab pattern."},
      {exerciseId:"reverse_crunch", similarity:75, note:"Similar bottom-up flexion pattern on a bench."}
    ],
    scienceNotes:"Hanging leg raises produce highest lower rectus abdominis EMG when posterior pelvic tilt is achieved (Contreras 2014). Without the tilt, hip flexors (iliopsoas) dominate. The hanging position also decompresses the spine \u2014 therapeutic benefit."
  },

  { id:"plank", name:"Plank", icon:"\u{1F4AA}", color:"#06d6a0",
    category:"isolation", equipment:"bodyweight", difficulty:"beginner", bwRatio:0, aliases:["front plank","ab plank"],
    musclesPrimary:[
      {muscle:"core", pct:80, note:"Transverse abdominis + rectus abdominis \u2014 anti-extension isometric hold"}
    ],
    musclesSecondary:[
      {muscle:"front_delts", pct:10, note:"Shoulder stabilization"},
      {muscle:"glutes", pct:10, note:"Hip extension to maintain alignment"}
    ],
    stabilizers:["back_erector"],
    movementPattern:"anti_extension",
    biomechanics:"Isometric anti-extension hold. Forearms on ground, straight body from head to heels. The goal is to resist gravity trying to extend (arch) the spine. Squeeze glutes, brace abs as if about to be punched. Neutral spine \u2014 no sagging hips, no piking up. Time under tension is the stimulus.",
    repRanges:[
      {goal:"hypertrophy", reps:"30-60s holds", rest:60, sets:"3-4", why:"Isometric holds build core endurance and stability. Once 60s is easy, progress to harder variations."},
      {goal:"endurance", reps:"60-120s holds", rest:30, sets:"2-3", why:"Extended holds for endurance. Diminishing returns past 2 minutes."}
    ],
    warnings:[
      "Sagging hips = lumbar hyperextension. Squeeze glutes and brace.",
      "Holding breath = counterproductive. Breathe normally while bracing.",
      "If 2+ minutes is easy, progress the variation \u2014 don't just hold longer"
    ],
    progressionCues:[
      "60s plank easy \u2192 progress to: RKC plank (squeeze everything), body saw, long-lever plank",
      "Add weight plate on back for loading",
      "Ab rollout is the dynamic progression of the plank pattern"
    ],
    synergies:[
      {exerciseId:"cable_crunch", type:"complement", note:"Plank = isometric stability. Cable crunch = dynamic flexion. Both are needed."},
      {exerciseId:"hanging_leg_raise", type:"complement", note:"Anti-extension (plank) + flexion (leg raise) = complete core."}
    ],
    substitutes:[
      {exerciseId:"dead_bug", similarity:70, note:"Supine anti-extension. Easier to learn, great for beginners."},
      {exerciseId:"ab_rollout", similarity:80, note:"Dynamic version of the plank pattern. Much harder."}
    ],
    scienceNotes:"Planks produce high transverse abdominis activation (the deep core stabilizer). RKC plank (maximal full-body tension) shows 4x higher EMG than standard plank (Contreras 2014). For advanced trainees, standard planks quickly become too easy. Progress the variation, don't just hold longer."
  },

  // ════════════════════════════════════════════════════════════
  //  ADDITIONAL EXERCISES (for coverage)
  // ════════════════════════════════════════════════════════════

  { id:"db_bench_press", name:"Dumbbell Bench Press", icon:"\u{1F4AA}", color:"#4cc9f0",
    category:"compound", equipment:"dumbbell", difficulty:"beginner", bwRatio:0.15, aliases:["dumbbell bench","DB bench","flat DB press"],
    musclesPrimary:[
      {muscle:"chest_mid", pct:55, note:"Greater ROM than barbell \u2014 deeper stretch at bottom, more adduction at top"},
      {muscle:"triceps", pct:25, note:"Elbow extension"}
    ],
    musclesSecondary:[
      {muscle:"front_delts", pct:15, note:"Shoulder flexion"},
      {muscle:"core", pct:5, note:"Stabilization against unilateral loading"}
    ],
    stabilizers:["core","biceps"],
    movementPattern:"horizontal_push",
    biomechanics:"Bilateral horizontal press with dumbbells. Greater ROM than barbell: deeper stretch at bottom, can bring DBs together at top for more adduction. Each arm works independently, exposing and correcting imbalances. Requires more stabilizer activation than barbell.",
    repRanges:[
      {goal:"strength", reps:"5-8", rest:120, sets:"3-4", why:"Heavy DB press builds unilateral strength and stabilizer capacity."},
      {goal:"hypertrophy", reps:"8-12", rest:75, sets:"3-4", why:"Classic hypertrophy range with superior ROM for pec growth."},
      {goal:"endurance", reps:"15-20", rest:45, sets:"2-3", why:"Lighter DB for endurance and pump."}
    ],
    warnings:[
      "Getting heavy DBs into position is the hardest part. Use the knee kick-up technique.",
      "Don't clang DBs together at top \u2014 brief contact is fine, smashing risks wrist injury",
      "DB pressing is typically 70-80% of barbell bench weight"
    ],
    progressionCues:[
      "Increase 5 lbs per DB when all sets completed",
      "DB jumps are often 5 lb increments \u2014 slower progression than barbell is normal",
      "If gym doesn't have small increments, do more reps before jumping weight"
    ],
    synergies:[
      {exerciseId:"barbell_bench_press", type:"complement", note:"Barbell for max load, DB for ROM and balance."},
      {exerciseId:"cable_fly", type:"superset", note:"Compound-to-isolation for chest."}
    ],
    substitutes:[
      {exerciseId:"barbell_bench_press", similarity:90, note:"Barbell version. Higher max load, less ROM."},
      {exerciseId:"machine_chest_press", similarity:75, note:"Machine version. Stable path."}
    ],
    scienceNotes:"DB bench press allows ~10% greater pec stretch at bottom ROM vs barbell (due to no bar restricting depth). Each arm working independently increases core activation by ~15%. The adduction component at top activates pec fibers that barbell misses."
  },

  { id:"db_shoulder_press", name:"Dumbbell Shoulder Press", icon:"\u{1F4AA}", color:"#9d4edd",
    category:"compound", equipment:"dumbbell", difficulty:"beginner", bwRatio:0.12, aliases:["dumbbell OHP","DB shoulder press","seated DB press"],
    musclesPrimary:[
      {muscle:"front_delts", pct:50, note:"Anterior deltoid \u2014 shoulder flexion"},
      {muscle:"side_delts", pct:20, note:"Medial deltoid assists above 90\u00B0"}
    ],
    musclesSecondary:[
      {muscle:"triceps", pct:20, note:"Elbow extension"},
      {muscle:"back_upper", pct:5, note:"Upper traps at lockout"},
      {muscle:"core", pct:5, note:"Stabilization (especially standing)"}
    ],
    stabilizers:["core"],
    movementPattern:"vertical_push",
    biomechanics:"Seated or standing overhead press with DBs. Start at shoulder height, press to lockout. DBs allow natural arcing path and greater ROM. Seated provides back support for heavier loading. Standing adds core demand.",
    repRanges:[
      {goal:"strength", reps:"5-8", rest:120, sets:"3-4", why:"Heavy DB pressing for unilateral shoulder strength."},
      {goal:"hypertrophy", reps:"8-12", rest:75, sets:"3-4", why:"Classic range for delt mass."},
      {goal:"endurance", reps:"12-15", rest:60, sets:"2-3", why:"Lighter weight for shoulder endurance."}
    ],
    warnings:[
      "Back arching excessively (seated) = use less weight or lower the incline slightly",
      "Don't bounce off the bottom position \u2014 controlled throughout"
    ],
    progressionCues:[
      "Increase 5 lbs per DB when all sets completed at target reps",
      "Arnold press variation (rotation during press) adds variety"
    ],
    synergies:[
      {exerciseId:"lateral_raise", type:"complement", note:"Press = front delt dominant. Lateral raise covers the side delt."},
      {exerciseId:"face_pull", type:"complement", note:"Pressing + pulling for shoulder health."}
    ],
    substitutes:[
      {exerciseId:"overhead_press", similarity:85, note:"Barbell version. Higher max load."},
      {exerciseId:"machine_shoulder_press", similarity:75, note:"Machine version. Fixed path."}
    ],
    scienceNotes:"DB shoulder press shows ~10% higher medial deltoid activation than barbell OHP due to the wider arc path (Saeterbakken 2013). Standing vs seated: standing shows higher core EMG but seated allows heavier loading."
  },

  { id:"goblet_squat", name:"Goblet Squat", icon:"\u{1F4AA}", color:"#f77f00",
    category:"compound", equipment:"dumbbell", difficulty:"beginner", bwRatio:0.15, aliases:["goblet","KB squat","kettlebell squat"],
    musclesPrimary:[
      {muscle:"quads", pct:50, note:"Knee extension with upright torso"},
      {muscle:"glutes", pct:30, note:"Hip extension from deep position"}
    ],
    musclesSecondary:[
      {muscle:"core", pct:10, note:"Anti-flexion to hold DB in front"},
      {muscle:"biceps", pct:5, note:"Isometric hold of dumbbell"},
      {muscle:"hamstrings", pct:5, note:"Knee stabilization"}
    ],
    stabilizers:["core","back_upper"],
    movementPattern:"squat",
    biomechanics:"Front-loaded squat holding a DB or KB at chest level. The counterbalance naturally promotes upright torso and deep squat. Excellent for learning squat pattern. Elbows inside knees at bottom position help push knees out. Self-limiting \u2014 when the weight gets too heavy to hold, you're done.",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:75, sets:"3-4", why:"Moderate reps with full depth. Great for beginners building squat pattern."},
      {goal:"endurance", reps:"15-25", rest:45, sets:"2-3", why:"High rep goblet squats for conditioning and mobility."}
    ],
    warnings:[
      "Grip/arm strength often limits before legs \u2014 this is normal",
      "Don't round upper back trying to hold heavy DB",
      "If knees cave, lighten weight and work on hip abductor strength"
    ],
    progressionCues:[
      "When the heaviest DB in the gym is easy, progress to barbell front or back squat",
      "Pause goblet squats (3s at bottom) build mobility and strength simultaneously",
      "Great warm-up exercise for barbell squat days"
    ],
    synergies:[
      {exerciseId:"barbell_squat", type:"complement", note:"Goblet squat as a warm-up or technique primer for barbell squats."},
      {exerciseId:"romanian_deadlift", type:"complement", note:"Quad-dominant (goblet) + hamstring-dominant (RDL) for complete legs."}
    ],
    substitutes:[
      {exerciseId:"barbell_squat", similarity:75, note:"Progression from goblet squat. Heavier loading."},
      {exerciseId:"front_squat", similarity:80, note:"Barbell front-loaded version. Same upright pattern."}
    ],
    scienceNotes:"Goblet squat naturally promotes optimal squat mechanics: upright torso, full depth, knees out. Dan John popularized it as THE exercise to teach squatting. The front load acts as a counterbalance that allows deeper squats with less ankle mobility."
  },

  { id:"close_grip_bench", name:"Close-Grip Bench Press", icon:"\u{1F3CB}", color:"#ffd60a",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.4, aliases:["CGBP","close grip bench","narrow grip bench"],
    musclesPrimary:[
      {muscle:"triceps", pct:55, note:"Increased elbow extension range with narrow grip"},
      {muscle:"chest_mid", pct:30, note:"Still significant pec involvement"}
    ],
    musclesSecondary:[
      {muscle:"front_delts", pct:15, note:"Shoulder flexion"}
    ],
    stabilizers:["core"],
    movementPattern:"horizontal_push",
    biomechanics:"Standard bench press with grip narrowed to shoulder width (or slightly inside). The reduced grip width increases the range of motion at the elbow, shifting emphasis from pec to tricep. Touch bar slightly lower on chest than regular bench. Same scapular retraction cues as regular bench.",
    repRanges:[
      {goal:"strength", reps:"3-6", rest:150, sets:"3-5", why:"Heavy CGBP is one of the best tricep strength builders and directly improves lockout strength on regular bench."},
      {goal:"hypertrophy", reps:"8-12", rest:90, sets:"3-4", why:"Classic tricep mass builder. Heavier loading than isolation exercises."}
    ],
    warnings:[
      "Grip too narrow (hands touching) = wrist strain. Shoulder width is sufficient.",
      "Elbows should tuck more than regular bench to protect shoulders",
      "Expect to use ~80-85% of your regular bench weight"
    ],
    progressionCues:[
      "Progress same as bench press: 2.5-5 lbs when all sets completed",
      "CGBP improvements directly transfer to regular bench lockout",
      "Alternate between CGBP and overhead pressing for tricep development"
    ],
    synergies:[
      {exerciseId:"overhead_tricep_ext", type:"complement", note:"Compound (CGBP) + isolation (overhead ext) for complete tricep development."},
      {exerciseId:"barbell_bench_press", type:"complement", note:"CGBP builds lockout strength that improves regular bench."}
    ],
    substitutes:[
      {exerciseId:"dip", similarity:75, note:"Another compound tricep-focused presser."},
      {exerciseId:"tricep_pushdown", similarity:55, note:"Isolation alternative. Less total load."}
    ],
    scienceNotes:"Narrowing grip by 50% shifts ~20% of muscle activation from pec to tricep (Lehman 2005). CGBP allows heavier loading than any isolation tricep exercise, making it the primary tricep mass builder for strength athletes."
  },

  { id:"sumo_deadlift", name:"Sumo Deadlift", icon:"\u{1F3CB}", color:"#e63946",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.65, aliases:["sumo DL","wide stance deadlift"],
    musclesPrimary:[
      {muscle:"quads", pct:30, note:"More knee extension than conventional due to wider stance"},
      {muscle:"glutes", pct:30, note:"Hip extension + abduction"},
      {muscle:"hamstrings", pct:15, note:"Hip extension component"}
    ],
    musclesSecondary:[
      {muscle:"back_erector", pct:10, note:"Less demand than conventional due to more upright torso"},
      {muscle:"back_lats", pct:5, note:"Keeps bar close"},
      {muscle:"forearms", pct:5, note:"Grip"},
      {muscle:"core", pct:5, note:"Stabilization"}
    ],
    stabilizers:["core","back_upper"],
    movementPattern:"hip_hinge",
    biomechanics:"Wide stance deadlift with toes pointed out 30-45\u00B0. Hands inside knees. More upright torso reduces spinal loading. Hips closer to bar = shorter moment arm = can often lift more than conventional. Requires good hip mobility. Different leverages favor different body types.",
    repRanges:[
      {goal:"strength", reps:"1-5", rest:300, sets:"3-5", why:"Sumo can allow heavier pulls for lifters with the right leverages (long torso, short femurs)."},
      {goal:"hypertrophy", reps:"5-8", rest:180, sets:"3-4", why:"More quad and adductor emphasis than conventional."}
    ],
    warnings:[
      "Requires significant hip mobility. Don't force the stance width.",
      "Knees MUST track over toes. If knees cave, the stance is too wide or weight is too heavy.",
      "Opening hips without proper warm-up risks adductor strain"
    ],
    progressionCues:[
      "Hip mobility is often the limiting factor \u2014 stretch adductors daily",
      "Progress 5-10 lbs per session (beginners), 5 lbs/week (intermediates)",
      "Deficit sumo pulls for off-the-floor weakness"
    ],
    synergies:[
      {exerciseId:"barbell_squat", type:"complement", note:"Both are quad-heavy compound lifts. Sumo is more hip-dominant than squat."},
      {exerciseId:"hip_thrust", type:"complement", note:"Sumo = hip extension from stretched. Hip thrust = hip extension at shortened."}
    ],
    substitutes:[
      {exerciseId:"deadlift", similarity:85, note:"Conventional version. More back, less quad."},
      {exerciseId:"trap_bar_deadlift", similarity:75, note:"Neutral grip, centered load. Different leverages."}
    ],
    scienceNotes:"Sumo deadlift shows ~25% less spinal erector EMG and ~10% more quad EMG vs conventional (Escamilla 2002). Neither stance is inherently superior \u2014 the best stance depends on individual anthropometry (limb lengths, hip structure)."
  },

  { id:"incline_barbell_press", name:"Incline Barbell Press", icon:"\u{1F3CB}", color:"#4cc9f0",
    category:"compound", equipment:"barbell", difficulty:"beginner", bwRatio:0.4, aliases:["incline bench","incline barbell"],
    musclesPrimary:[
      {muscle:"chest_upper", pct:50, note:"Clavicular head emphasized at 30-45\u00B0"},
      {muscle:"front_delts", pct:25, note:"Increased shoulder flexion demand"}
    ],
    musclesSecondary:[
      {muscle:"triceps", pct:20, note:"Elbow extension"},
      {muscle:"chest_mid", pct:5, note:"Sternal head still assists"}
    ],
    stabilizers:["core"],
    movementPattern:"incline_push",
    biomechanics:"Barbell press on 30-45\u00B0 incline bench. Lower to upper chest/clavicle line. Allows heavier loading than DB incline. Same scapular retraction cues as flat bench. 30\u00B0 is optimal for upper pec; above 45\u00B0 is essentially a shoulder press.",
    repRanges:[
      {goal:"strength", reps:"3-6", rest:150, sets:"3-5", why:"Heavy incline pressing for upper pec and shoulder strength."},
      {goal:"hypertrophy", reps:"8-12", rest:90, sets:"3-4", why:"Moderate load for upper pec mass building."}
    ],
    warnings:[
      "Angle >45\u00B0 shifts predominantly to shoulders",
      "Same bench safety rules apply: rack with spotter or use safety pins"
    ],
    progressionCues:[
      "Typically 75-85% of flat bench weight",
      "Progress 2.5-5 lbs per session",
      "Alternate with incline DB press for variation"
    ],
    synergies:[
      {exerciseId:"barbell_bench_press", type:"complement", note:"Flat + incline for complete pec development."},
      {exerciseId:"cable_fly", type:"superset", note:"Compound to isolation for pec."}
    ],
    substitutes:[
      {exerciseId:"incline_db_press", similarity:90, note:"DB version for more ROM."},
      {exerciseId:"landmine_press", similarity:65, note:"Natural incline arc. Shoulder-friendly."}
    ],
    scienceNotes:"30\u00B0 incline = optimal upper pec activation. 45\u00B0+ shows diminishing returns for upper pec and increasing front delt dominance (Trebs 2010)."
  },

  { id:"rear_delt_fly", name:"Rear Delt Fly", icon:"\u{1F3AF}", color:"#9d4edd",
    category:"isolation", equipment:"dumbbell", difficulty:"beginner", bwRatio:0.05, aliases:["reverse fly","rear fly","bent over fly"],
    musclesPrimary:[
      {muscle:"rear_delts", pct:70, note:"Posterior deltoid \u2014 horizontal abduction"},
      {muscle:"back_upper", pct:20, note:"Rhomboids and mid-traps"}
    ],
    musclesSecondary:[
      {muscle:"forearms", pct:10, note:"Grip"}
    ],
    stabilizers:["core","back_erector"],
    movementPattern:"horizontal_pull",
    biomechanics:"Bent over with flat back, arms hang down. Raise DBs out to sides with slight elbow bend. Lead with elbows. Don't squeeze shoulder blades together forcefully at top \u2014 that shifts to traps. Can be done standing bent over, seated bent over, or on an incline bench (chest supported).",
    repRanges:[
      {goal:"hypertrophy", reps:"12-20", rest:60, sets:"3-4", why:"Light weight, high reps. Rear delts are small \u2014 heavy weight recruits traps."},
      {goal:"endurance", reps:"20-30", rest:30, sets:"2-3", why:"High reps for rear delt endurance and shoulder health."}
    ],
    warnings:[
      "Going too heavy = trap takeover. Use light weight and feel the rear delt.",
      "Don't swing the body. Chest-supported version eliminates cheating.",
      "Momentum defeats the purpose of this isolation exercise"
    ],
    progressionCues:[
      "Progress by adding reps or slowing tempo before adding weight",
      "Chest-supported on incline bench removes all momentum possibility",
      "Reverse pec deck is a machine alternative"
    ],
    synergies:[
      {exerciseId:"lateral_raise", type:"complement", note:"Side + rear delt = complete lateral deltoid development."},
      {exerciseId:"face_pull", type:"complement", note:"Fly hits posterior delt. Face pull adds external rotation."}
    ],
    substitutes:[
      {exerciseId:"face_pull", similarity:75, note:"Cable version with external rotation. More rotator cuff work."},
      {exerciseId:"reverse_pec_deck", similarity:85, note:"Machine version. Fixed path."}
    ],
    scienceNotes:"Rear delt fly isolates the posterior deltoid more purely than face pulls (which add external rotation). Both should be in a complete program. Chest-supported version shows ~15% more rear delt isolation due to elimination of body English."
  },

  { id:"shrug", name:"Barbell Shrug", icon:"\u{1F4AA}", color:"#38b000",
    category:"isolation", equipment:"barbell", difficulty:"beginner", bwRatio:0.4, aliases:["barbell shrug","trap shrug","shoulder shrug"],
    musclesPrimary:[
      {muscle:"back_traps", pct:85, note:"Upper trapezius \u2014 scapular elevation"},
      {muscle:"forearms", pct:15, note:"Grip strength"}
    ],
    musclesSecondary:[],
    stabilizers:["core"],
    movementPattern:"scapular_elevation",
    biomechanics:"Stand holding barbell, shrug shoulders straight up toward ears. Hold at top briefly. Don't roll shoulders \u2014 just up and down. The upper trap is a powerful scapular elevator. Heavy shrugs with controlled tempo. Use straps if grip limits you.",
    repRanges:[
      {goal:"strength", reps:"6-10", rest:90, sets:"3-4", why:"Heavy shrugs for trap mass. Traps respond well to heavy loading."},
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"3-4", why:"Moderate weight with pause at top."}
    ],
    warnings:[
      "Don't roll shoulders in circles \u2014 just straight up and down",
      "Heavy shrugs with no control = waste of time. Hold the contraction.",
      "Use straps if grip limits trap training"
    ],
    progressionCues:[
      "Progress 10-20 lbs when all sets completed with full ROM",
      "Pause at top (2s) for extra activation",
      "DB shrugs allow more ROM (bar doesn't hit thighs)"
    ],
    synergies:[
      {exerciseId:"deadlift", type:"complement", note:"Deadlifts build traps isometrically. Shrugs target them concentrically."},
      {exerciseId:"face_pull", type:"complement", note:"Upper traps (shrug) + mid traps/rear delts (face pull) = complete trap development."}
    ],
    substitutes:[
      {exerciseId:"db_shrug", similarity:95, note:"DB version allows more ROM."},
      {exerciseId:"farmer_walk", similarity:60, note:"Dynamic trap + grip exercise. Functional alternative."}
    ],
    scienceNotes:"Upper trapezius EMG: 80-100% MVC during heavy shrugs. Traps have a high proportion of Type II fibers and respond well to heavy loading. Compound movements (deadlifts, rows) also train traps, so dedicated shrug work may not be necessary for all trainees."
  },

  { id:"seated_calf_raise", name:"Seated Calf Raise", icon:"\u{1F4AA}", color:"#f77f00",
    category:"isolation", equipment:"machine", difficulty:"beginner", bwRatio:0.3, aliases:["seated calf","soleus raise"],
    musclesPrimary:[
      {muscle:"calves", pct:95, note:"Soleus \u2014 bent knee position reduces gastrocnemius contribution"},
      {muscle:"core", pct:5, note:"Minimal"}
    ],
    musclesSecondary:[],
    stabilizers:[],
    movementPattern:"ankle_plantar_flexion",
    biomechanics:"Ankle plantar flexion with bent knees (~90\u00B0). Bent knee position shortens the gastrocnemius (which crosses the knee), making it less effective. This shifts work to the soleus (single-joint muscle). Full ROM: deep stretch at bottom, hard squeeze at top. The soleus makes up ~60% of calf volume.",
    repRanges:[
      {goal:"hypertrophy", reps:"10-15", rest:60, sets:"4-6", why:"Higher volume for calves. Slow eccentric (3s) and pause at stretch (2s)."},
      {goal:"endurance", reps:"20-30", rest:30, sets:"3-4", why:"High reps for calf endurance. Calves are endurance muscles."}
    ],
    warnings:[
      "Don't bounce. Pause at the bottom stretch for 1-2 seconds.",
      "Full ROM is essential \u2014 partial reps are very common and limit growth"
    ],
    progressionCues:[
      "Progress in reps first, then weight",
      "Train calves frequently: 3-4x per week",
      "5-second eccentrics are highly effective for stubborn calves"
    ],
    synergies:[
      {exerciseId:"standing_calf_raise", type:"complement", note:"Standing = gastrocnemius. Seated = soleus. Both needed."}
    ],
    substitutes:[
      {exerciseId:"standing_calf_raise", similarity:70, note:"Different muscle emphasis. Complementary, not interchangeable."}
    ],
    scienceNotes:"Soleus is ~60% of total calf cross-sectional area and is ~80% Type I (slow-twitch) fibers. This means it responds to higher reps and higher frequency. Seated calf raise is the only effective way to isolate the soleus."
  }

,

// ─── NEW EXERCISES (expanded database) ────────────────────────

{
  id:"bulgarian_split_squat",name:"Bulgarian Split Squat",icon:"🦵",color:"#e74c3c",
  category:"legs",equipment:"dumbbell",difficulty:"intermediate",
  bwRatio:0.15,
  aliases:["BSS","rear foot elevated split squat","RFESS","single leg squat"],
  musclesPrimary:[{muscle:"quads",pct:45},{muscle:"glutes",pct:35}],
  musclesSecondary:[{muscle:"hamstrings",pct:10},{muscle:"glutes",pct:10}],
  stabilizers:["core","hip_flexors"],
  movementPattern:"squat",
  biomechanics:{joint:"knee+hip",type:"compound",plane:"sagittal",rom:"deep",grip:"neutral"},
  repRanges:{strength:"5-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Keep front shin vertical","Don't let knee cave inward","Rear foot is for balance only, not pushing"],
  progressionCues:["Increase depth before weight","Add pause at bottom","Progress to barbell version"],
  synergies:{antagonist:["romanian_deadlift"],complement:["leg_press","hip_thrust"],superset:["leg_curl"]},
  substitutes:["walking_lunge","goblet_squat","leg_press"],
  scienceNotes:"Unilateral training addresses strength imbalances between limbs. EMG studies show similar quad activation to back squat with significantly less spinal loading. The elevated rear foot increases ROM and hip flexor stretch."
},
{
  id:"hack_squat",name:"Hack Squat",icon:"🦿",color:"#3498db",
  category:"legs",equipment:"machine",difficulty:"beginner",
  bwRatio:0.8,
  aliases:["hack squat machine","reverse hack squat","plate loaded hack"],
  musclesPrimary:[{muscle:"quads",pct:60},{muscle:"glutes",pct:20}],
  musclesSecondary:[{muscle:"hamstrings",pct:10},{muscle:"glutes",pct:10}],
  stabilizers:["core"],
  movementPattern:"squat",
  biomechanics:{joint:"knee+hip",type:"compound",plane:"sagittal",rom:"full",grip:"handles"},
  repRanges:{strength:"6-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Don't lock out knees at top","Keep back flat against pad","Control the negative"],
  progressionCues:["Increase depth before adding plates","Try narrow stance for more quad focus","Slow eccentric for growth"],
  synergies:{antagonist:["leg_curl"],complement:["leg_extension","leg_press"],superset:["calf_raise"]},
  substitutes:["leg_press","barbell_squat","goblet_squat"],
  scienceNotes:"The fixed plane of motion reduces stabilizer demand, allowing heavier quad loading. The angled sled reduces spinal compression compared to barbell squats while maintaining high quadriceps activation."
},
{
  id:"preacher_curl",name:"Preacher Curl",icon:"💪",color:"#e67e22",
  category:"arms",equipment:"barbell",difficulty:"beginner",
  bwRatio:0.2,
  aliases:["scott curl","EZ bar preacher curl","preacher bench curl"],
  musclesPrimary:[{muscle:"biceps",pct:85}],
  musclesSecondary:[{muscle:"forearms",pct:15}],
  stabilizers:["core"],
  movementPattern:"pull",
  biomechanics:{joint:"elbow",type:"isolation",plane:"sagittal",rom:"full",grip:"supinated"},
  repRanges:{strength:"6-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Don't hyperextend at bottom","Control the negative — no dropping","Keep elbows on pad throughout"],
  progressionCues:["Use EZ bar to reduce wrist strain","Try single-arm dumbbell version","Add slow negatives"],
  synergies:{antagonist:["skull_crusher","tricep_pushdown"],complement:["hammer_curl","barbell_curl"],superset:["tricep_pushdown"]},
  substitutes:["barbell_curl","incline_dumbbell_curl","ez_bar_curl"],
  scienceNotes:"The preacher bench eliminates momentum and fixes the shoulder angle, isolating the brachialis and short head of biceps more effectively. EMG studies show peak biceps activation at ~80° elbow flexion on the preacher bench."
},
{
  id:"skull_crusher",name:"Skull Crusher",icon:"💀",color:"#9b59b6",
  category:"arms",equipment:"barbell",difficulty:"intermediate",
  bwRatio:0.25,
  aliases:["lying tricep extension","french press","nose breaker","LTE"],
  musclesPrimary:[{muscle:"triceps",pct:90}],
  musclesSecondary:[{muscle:"chest_mid",pct:5},{muscle:"front_delts",pct:5}],
  stabilizers:["core","front_delts"],
  movementPattern:"push",
  biomechanics:{joint:"elbow",type:"isolation",plane:"sagittal",rom:"full",grip:"pronated"},
  repRanges:{strength:"6-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Lower to forehead or behind head, not face","Keep elbows tucked — don't flare","Use spotter for heavy sets"],
  progressionCues:["Lower behind head for more long-head stretch","Use EZ bar for wrist comfort","Try incline version for more stretch"],
  synergies:{antagonist:["barbell_curl","preacher_curl"],complement:["tricep_pushdown","close_grip_bench"],superset:["barbell_curl"]},
  substitutes:["tricep_pushdown","overhead_tricep","close_grip_bench"],
  scienceNotes:"Skull crushers place the long head of the triceps under maximum stretch, which is critical for hypertrophy. Lowering behind the head (vs. to forehead) increases long head stretch by ~15% based on muscle length-tension data."
},
{
  id:"cable_lateral_raise",name:"Cable Lateral Raise",icon:"🔗",color:"#1abc9c",
  category:"shoulders",equipment:"cable",difficulty:"beginner",
  bwRatio:0.05,
  aliases:["cable side raise","single arm cable lateral","cable side delt raise"],
  musclesPrimary:[{muscle:"side_delts",pct:80}],
  musclesSecondary:[{muscle:"front_delts",pct:10},{muscle:"back_traps",pct:10}],
  stabilizers:["core","rotator_cuff"],
  movementPattern:"push",
  biomechanics:{joint:"shoulder",type:"isolation",plane:"frontal",rom:"full",grip:"neutral"},
  repRanges:{strength:"8-10",hypertrophy:"12-15",endurance:"15-20"},
  warnings:["Don't shrug — keep traps down","Lead with elbow, not hand","Slight forward lean for better delt isolation"],
  progressionCues:["Behind-back cable path for more stretch","Try leaning away for constant tension","Pause at top for peak contraction"],
  synergies:{antagonist:["face_pull"],complement:["lateral_raise","overhead_press"],superset:["face_pull"]},
  substitutes:["lateral_raise","machine_lateral_raise","overhead_press"],
  scienceNotes:"Cables provide constant tension throughout the ROM, unlike dumbbells where tension drops at the bottom. The lateral deltoid has a high proportion of Type II fibers but responds well to moderate-to-high reps due to its short moment arm."
},
{
  id:"landmine_press",name:"Landmine Press",icon:"🏴",color:"#e74c3c",
  category:"shoulders",equipment:"barbell",difficulty:"intermediate",
  bwRatio:0.25,
  aliases:["angled press","landmine shoulder press","single arm landmine"],
  musclesPrimary:[{muscle:"front_delts",pct:40},{muscle:"chest_mid",pct:30}],
  musclesSecondary:[{muscle:"triceps",pct:15},{muscle:"side_delts",pct:10},{muscle:"core",pct:5}],
  stabilizers:["core","rotator_cuff"],
  movementPattern:"push",
  biomechanics:{joint:"shoulder+elbow",type:"compound",plane:"sagittal",rom:"full",grip:"neutral"},
  repRanges:{strength:"5-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Keep core braced throughout","Don't arch lower back","Control the arc path"],
  progressionCues:["Start kneeling for strict form","Progress to standing","Try two-hand version for chest focus"],
  synergies:{antagonist:["barbell_row","t_bar_row"],complement:["overhead_press","bench_press"],superset:["face_pull"]},
  substitutes:["overhead_press","dumbbell_press","machine_shoulder_press"],
  scienceNotes:"The arc-shaped pressing path is more shoulder-friendly than straight overhead pressing, making it ideal for those with shoulder impingement. The angled load vector trains the scapular upward rotators effectively."
},
{
  id:"t_bar_row",name:"T-Bar Row",icon:"🔩",color:"#2c3e50",
  category:"back",equipment:"barbell",difficulty:"intermediate",
  bwRatio:0.4,
  aliases:["landmine row","chest supported T-bar","T bar row machine"],
  musclesPrimary:[{muscle:"back_lats",pct:35},{muscle:"back_upper",pct:35}],
  musclesSecondary:[{muscle:"biceps",pct:10},{muscle:"rear_delts",pct:10},{muscle:"back_traps",pct:10}],
  stabilizers:["core","back_erector","hamstrings"],
  movementPattern:"pull",
  biomechanics:{joint:"shoulder+elbow",type:"compound",plane:"sagittal",rom:"full",grip:"neutral"},
  repRanges:{strength:"5-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Keep back flat — no rounding","Brace core like a deadlift","Pull to lower chest, not belly"],
  progressionCues:["Use V-handle for neutral grip","Try chest-supported version to remove lower back","Pause at top for peak contraction"],
  synergies:{antagonist:["bench_press","dumbbell_press"],complement:["barbell_row","cable_row"],superset:["bench_press"]},
  substitutes:["barbell_row","cable_row","pendlay_row"],
  scienceNotes:"The neutral grip and close hand position of the T-bar row shifts emphasis to the mid-back (rhomboids, mid-traps) compared to wide-grip rows. The chest-supported variant eliminates lower back fatigue as a limiting factor."
},
{
  id:"leg_press_calf",name:"Leg Press Calf Raise",icon:"🦶",color:"#e67e22",
  category:"legs",equipment:"machine",difficulty:"beginner",
  bwRatio:0.8,
  aliases:["calf raise on leg press","seated calf press","leg press toe press"],
  musclesPrimary:[{muscle:"calves",pct:90}],
  musclesSecondary:[{muscle:"quads",pct:10}],
  stabilizers:[],
  movementPattern:"push",
  biomechanics:{joint:"ankle",type:"isolation",plane:"sagittal",rom:"full",grip:"feet on platform"},
  repRanges:{strength:"8-10",hypertrophy:"12-15",endurance:"15-25"},
  warnings:["Don't lock knees fully","Use full ROM — stretch at bottom","Keep feet stable on platform edge"],
  progressionCues:["Focus on slow eccentric","Pause at stretched position","Increase volume before weight"],
  synergies:{antagonist:["tibialis_raise"],complement:["calf_raise","seated_calf_raise"],superset:["leg_extension"]},
  substitutes:["calf_raise","seated_calf_raise"],
  scienceNotes:"With knees nearly straight, the gastrocnemius (two-headed calf muscle) is fully lengthened and does most of the work. Allows heavier loading than standing calf raise due to machine support. Calves are ~50/50 Type I/II fibers — train with both heavy and high-rep work."
},
{
  id:"incline_dumbbell_curl",name:"Incline Dumbbell Curl",icon:"📐",color:"#3498db",
  category:"arms",equipment:"dumbbell",difficulty:"beginner",
  bwRatio:0.08,
  aliases:["incline curl","incline bicep curl","seated incline curl"],
  musclesPrimary:[{muscle:"biceps",pct:90}],
  musclesSecondary:[{muscle:"forearms",pct:10}],
  stabilizers:["front_delts"],
  movementPattern:"pull",
  biomechanics:{joint:"elbow",type:"isolation",plane:"sagittal",rom:"full",grip:"supinated"},
  repRanges:{strength:"6-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Don't swing — keep shoulders back on bench","Don't let elbows drift forward","Full extension at bottom"],
  progressionCues:["Start at 45° incline","Try alternating arms for focus","Add supination twist at top"],
  synergies:{antagonist:["skull_crusher","overhead_tricep"],complement:["barbell_curl","hammer_curl"],superset:["overhead_tricep"]},
  substitutes:["barbell_curl","preacher_curl","hammer_curl"],
  scienceNotes:"The incline position places the shoulder in extension, stretching the long head of the biceps. Research shows stretched-position exercises produce superior hypertrophy. This is one of the best exercises for biceps long head development."
},
{
  id:"cable_glute_kickback",name:"Cable Glute Kickback",icon:"🍑",color:"#e91e63",
  category:"legs",equipment:"cable",difficulty:"beginner",
  bwRatio:0.1,
  aliases:["cable kickback","glute kickback","cable donkey kick","cable hip extension"],
  musclesPrimary:[{muscle:"glutes",pct:80}],
  musclesSecondary:[{muscle:"hamstrings",pct:15},{muscle:"core",pct:5}],
  stabilizers:["core","hip_flexors"],
  movementPattern:"push",
  biomechanics:{joint:"hip",type:"isolation",plane:"sagittal",rom:"full",grip:"ankle strap"},
  repRanges:{strength:"8-10",hypertrophy:"12-15",endurance:"15-20"},
  warnings:["Don't arch lower back","Squeeze glute at top","Keep hips square — don't rotate"],
  progressionCues:["Focus on mind-muscle connection first","Add pause at peak contraction","Increase ROM before weight"],
  synergies:{antagonist:["leg_extension"],complement:["hip_thrust","romanian_deadlift"],superset:["leg_extension"]},
  substitutes:["hip_thrust","romanian_deadlift","glute_bridge"],
  scienceNotes:"Cable kickbacks allow constant tension on the glutes through the full ROM. EMG research shows high glute max activation, especially at terminal hip extension. Lower loads with focus on contraction quality outperform heavier momentum-driven reps."
},
{
  id:"machine_chest_press",name:"Machine Chest Press",icon:"🏋️",color:"#e74c3c",
  category:"chest",equipment:"machine",difficulty:"beginner",
  bwRatio:0.4,
  aliases:["chest press machine","seated chest press","hammer strength chest"],
  musclesPrimary:[{muscle:"chest_mid",pct:55}],
  musclesSecondary:[{muscle:"front_delts",pct:20},{muscle:"triceps",pct:25}],
  stabilizers:[],
  movementPattern:"push",
  biomechanics:{joint:"shoulder+elbow",type:"compound",plane:"sagittal",rom:"full",grip:"pronated"},
  repRanges:{strength:"6-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Adjust seat so handles align with mid-chest","Don't let shoulders roll forward","Full ROM — touch chest on eccentric"],
  progressionCues:["Great for burnout sets after free weights","Try single-arm for imbalance work","Use slow negatives for growth"],
  synergies:{antagonist:["cable_row","barbell_row"],complement:["bench_press","dumbbell_press"],superset:["cable_row"]},
  substitutes:["bench_press","dumbbell_press","cable_fly"],
  scienceNotes:"Machine presses eliminate stabilizer fatigue as a limiting factor, allowing you to push chest muscles to true failure safely. Research shows similar chest EMG activation to bench press when performed to failure. Ideal for hypertrophy-focused training or as a finisher."
},
{
  id:"cable_woodchop",name:"Cable Woodchop",icon:"🪓",color:"#27ae60",
  category:"core",equipment:"cable",difficulty:"intermediate",
  bwRatio:0.15,
  aliases:["wood chop","cable chop","rotational chop","high to low chop","low to high chop"],
  musclesPrimary:[{muscle:"core",pct:60}],
  musclesSecondary:[{muscle:"front_delts",pct:15},{muscle:"glutes",pct:15},{muscle:"quads",pct:10}],
  stabilizers:["back_erector","hip_flexors"],
  movementPattern:"push",
  biomechanics:{joint:"spine+hip",type:"compound",plane:"transverse",rom:"full",grip:"both hands"},
  repRanges:{strength:"8-10",hypertrophy:"10-15",endurance:"15-20"},
  warnings:["Rotate through thoracic spine, not lumbar","Keep arms relatively straight","Control the return — don't let cable snap back"],
  progressionCues:["Master high-to-low before low-to-high","Progress to Pallof press for anti-rotation","Try half-kneeling position for hip stability"],
  synergies:{antagonist:["cable_row"],complement:["plank","russian_twist"],superset:["plank"]},
  substitutes:["russian_twist","plank","pallof_press"],
  scienceNotes:"One of the few exercises training the transverse plane (rotation). The obliques are primary movers in rotation. Anti-rotation training (Pallof press) builds stability; woodchops build rotational power. Athletes need both."
},
{
  id:"straight_arm_pulldown",name:"Straight-Arm Pulldown",icon:"🙏",color:"#8e44ad",
  category:"back",equipment:"cable",difficulty:"beginner",
  bwRatio:0.15,
  aliases:["lat prayer","straight arm lat pulldown","cable pullover","lat pushdown"],
  musclesPrimary:[{muscle:"back_lats",pct:80}],
  musclesSecondary:[{muscle:"triceps",pct:10},{muscle:"rear_delts",pct:5},{muscle:"core",pct:5}],
  stabilizers:["core","back_erector"],
  movementPattern:"pull",
  biomechanics:{joint:"shoulder",type:"isolation",plane:"sagittal",rom:"full",grip:"pronated"},
  repRanges:{strength:"8-10",hypertrophy:"10-15",endurance:"15-20"},
  warnings:["Keep arms straight — slight bend only","Don't use momentum","Lean slightly forward for better lat stretch"],
  progressionCues:["Use rope attachment for better contraction","Try single-arm version","Great as pre-exhaust before rows"],
  synergies:{antagonist:["bench_press","overhead_press"],complement:["lat_pulldown","barbell_row"],superset:["cable_fly"]},
  substitutes:["lat_pulldown","dumbbell_pullover"],
  scienceNotes:"Isolates the lats without biceps involvement, making it excellent as a pre-exhaust or finisher. The lat is maximally activated in shoulder extension with straight arms. Research shows this movement produces high lat EMG with relatively low biceps activation."
},
{
  id:"hip_adductor",name:"Hip Adductor Machine",icon:"🦵",color:"#e91e63",
  category:"legs",equipment:"machine",difficulty:"beginner",
  bwRatio:0.5,
  aliases:["adductor machine","inner thigh machine","thigh squeeze","adduction machine"],
  musclesPrimary:[{muscle:"glutes",pct:90}],
  musclesSecondary:[{muscle:"glutes",pct:10}],
  stabilizers:[],
  movementPattern:"push",
  biomechanics:{joint:"hip",type:"isolation",plane:"frontal",rom:"full",grip:"handles"},
  repRanges:{strength:"8-10",hypertrophy:"12-15",endurance:"15-20"},
  warnings:["Don't use momentum — control both phases","Adjust range to comfortable stretch","Don't hold breath"],
  progressionCues:["Increase ROM before weight","Try pause at fully adducted position","Superset with abductor machine"],
  synergies:{antagonist:["hip_abductor"],complement:["goblet_squat","sumo_deadlift"],superset:["hip_abductor"]},
  substitutes:["copenhagen_plank","sumo_squat","cable_adduction"],
  scienceNotes:"The adductors (5 muscles) contribute significantly to squat and deadlift strength. Weak adductors are linked to groin strains. The adductor magnus is one of the largest muscles in the body and acts as a powerful hip extensor, especially in deep squats."
},
{
  id:"ez_bar_curl",name:"EZ Bar Curl",icon:"〰️",color:"#f39c12",
  category:"arms",equipment:"barbell",difficulty:"beginner",
  bwRatio:0.2,
  aliases:["EZ curl","cambered bar curl","easy curl bar","W bar curl"],
  musclesPrimary:[{muscle:"biceps",pct:80}],
  musclesSecondary:[{muscle:"forearms",pct:20}],
  stabilizers:["core"],
  movementPattern:"pull",
  biomechanics:{joint:"elbow",type:"isolation",plane:"sagittal",rom:"full",grip:"semi-supinated"},
  repRanges:{strength:"6-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Don't swing — keep elbows pinned","No leaning back","Full extension at bottom"],
  progressionCues:["Use wide grip for short head focus","Use narrow grip for long head focus","Try reverse grip for brachioradialis"],
  synergies:{antagonist:["skull_crusher","tricep_pushdown"],complement:["barbell_curl","hammer_curl"],superset:["skull_crusher"]},
  substitutes:["barbell_curl","dumbbell_curl","preacher_curl"],
  scienceNotes:"The angled grip of the EZ bar reduces wrist and forearm strain compared to straight bar curls. The semi-pronated grip slightly reduces biceps activation but increases brachioradialis and brachialis involvement, building overall arm thickness."
},
{
  id:"weighted_dip",name:"Chest Dip (Weighted)",icon:"⬇️",color:"#c0392b",
  category:"chest",equipment:"bodyweight",difficulty:"intermediate",
  bwRatio:0,
  aliases:["weighted dip","chest dip","parallel bar dip","dips"],
  musclesPrimary:[{muscle:"chest_mid",pct:40},{muscle:"triceps",pct:35}],
  musclesSecondary:[{muscle:"front_delts",pct:20},{muscle:"core",pct:5}],
  stabilizers:["core","rotator_cuff"],
  movementPattern:"push",
  biomechanics:{joint:"shoulder+elbow",type:"compound",plane:"sagittal",rom:"full",grip:"neutral"},
  repRanges:{strength:"5-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Don't go past 90° if you have shoulder issues","Lean forward for more chest, upright for more triceps","Control the negative"],
  progressionCues:["Master bodyweight first","Add weight with belt or dumbbell","Try ring dips for stability challenge"],
  synergies:{antagonist:["pull_up","barbell_row"],complement:["bench_press","cable_fly"],superset:["pull_up"]},
  substitutes:["bench_press","decline_bench","machine_chest_press"],
  scienceNotes:"Dips are often called the 'upper body squat' — they heavily load chest, triceps, and front delts in a stretched position. Forward lean shifts emphasis to chest; upright emphasizes triceps. Adding weight makes this one of the most effective upper body mass builders."
},
{
  id:"reverse_curl",name:"Reverse Curl",icon:"🔄",color:"#16a085",
  category:"arms",equipment:"barbell",difficulty:"beginner",
  bwRatio:0.15,
  aliases:["reverse barbell curl","pronated curl","overhand curl","reverse EZ curl"],
  musclesPrimary:[{muscle:"forearms",pct:50},{muscle:"biceps",pct:30}],
  musclesSecondary:[{muscle:"biceps",pct:20}],
  stabilizers:["core"],
  movementPattern:"pull",
  biomechanics:{joint:"elbow",type:"isolation",plane:"sagittal",rom:"full",grip:"pronated"},
  repRanges:{strength:"8-10",hypertrophy:"10-15",endurance:"15-20"},
  warnings:["Use lighter weight than regular curls","Keep elbows pinned to sides","Don't swing"],
  progressionCues:["Start with EZ bar for comfort","Progress to straight bar","Try cable version for constant tension"],
  synergies:{antagonist:["tricep_pushdown"],complement:["barbell_curl","hammer_curl"],superset:["tricep_pushdown"]},
  substitutes:["hammer_curl","wrist_curl"],
  scienceNotes:"Reverse curls primarily target the brachioradialis and brachialis — the muscles that give the forearm its thickness. The pronated grip minimizes biceps involvement, forcing these often-neglected muscles to work harder. Essential for balanced arm development."
},
{
  id:"walking_lunge",name:"Walking Lunge",icon:"🚶",color:"#2ecc71",
  category:"legs",equipment:"dumbbell",difficulty:"intermediate",
  bwRatio:0.15,
  aliases:["forward lunge","dumbbell walking lunge","barbell lunge","lunges"],
  musclesPrimary:[{muscle:"quads",pct:40},{muscle:"glutes",pct:35}],
  musclesSecondary:[{muscle:"hamstrings",pct:15},{muscle:"glutes",pct:5},{muscle:"calves",pct:5}],
  stabilizers:["core","hip_flexors"],
  movementPattern:"squat",
  biomechanics:{joint:"knee+hip",type:"compound",plane:"sagittal",rom:"full",grip:"neutral"},
  repRanges:{strength:"6-8 per leg",hypertrophy:"10-12 per leg",endurance:"15-20 per leg"},
  warnings:["Keep front knee behind toes","Don't let knee cave inward","Long steps for glutes, short for quads"],
  progressionCues:["Master bodyweight first","Progress to dumbbells then barbell","Try deficit or reverse lunges for variety"],
  synergies:{antagonist:["leg_curl"],complement:["bulgarian_split_squat","goblet_squat"],superset:["leg_curl"]},
  substitutes:["bulgarian_split_squat","goblet_squat","leg_press"],
  scienceNotes:"Walking lunges combine unilateral strength with dynamic balance and coordination. Longer stride length shifts emphasis to glutes and hamstrings; shorter stride isolates quads. The walking pattern trains deceleration and stabilization that static lunges miss."
},
{
  id:"face_pull_high",name:"High Cable Face Pull",icon:"🎯",color:"#1abc9c",
  category:"shoulders",equipment:"cable",difficulty:"beginner",
  bwRatio:0.1,
  aliases:["face pull","cable face pull","rope face pull","rear delt pull"],
  musclesPrimary:[{muscle:"rear_delts",pct:40},{muscle:"back_upper",pct:30}],
  musclesSecondary:[{muscle:"back_traps",pct:15},{muscle:"rear_delts",pct:15}],
  stabilizers:["core"],
  movementPattern:"pull",
  biomechanics:{joint:"shoulder",type:"compound",plane:"transverse",rom:"full",grip:"rope neutral"},
  repRanges:{strength:"10-12",hypertrophy:"12-15",endurance:"15-25"},
  warnings:["Don't use too much weight — form over load","Pull to face level, not chest","Externally rotate at end position"],
  progressionCues:["Add external rotation at top","Try band version for home workouts","Increase volume rather than weight"],
  synergies:{antagonist:["bench_press","overhead_press"],complement:["face_pull","lateral_raise"],superset:["lateral_raise"]},
  substitutes:["face_pull","reverse_fly","band_pull_apart"],
  scienceNotes:"Face pulls are essential for shoulder health — they strengthen the external rotators and rear delts that counterbalance heavy pressing. Jeff Cavaliere and many PTs recommend these in every workout. High reps work best because the rear delts are small and endurance-oriented."
},
{
  id:"pendlay_row",name:"Pendlay Row",icon:"⚡",color:"#e74c3c",
  category:"back",equipment:"barbell",difficulty:"advanced",
  bwRatio:0.5,
  aliases:["dead stop row","strict barbell row","Pendlay","floor row"],
  musclesPrimary:[{muscle:"back_lats",pct:30},{muscle:"back_upper",pct:35}],
  musclesSecondary:[{muscle:"biceps",pct:10},{muscle:"rear_delts",pct:10},{muscle:"back_traps",pct:10},{muscle:"back_erector",pct:5}],
  stabilizers:["core","hamstrings","glutes"],
  movementPattern:"pull",
  biomechanics:{joint:"shoulder+elbow",type:"compound",plane:"sagittal",rom:"full",grip:"pronated"},
  repRanges:{strength:"3-6",hypertrophy:"6-10",endurance:"10-12"},
  warnings:["Reset on floor each rep — no bouncing","Keep back parallel to floor","Brace core like a deadlift each rep"],
  progressionCues:["Master conventional barbell row first","Use straps for grip if needed","Explosive concentric, controlled eccentric"],
  synergies:{antagonist:["bench_press","overhead_press"],complement:["barbell_row","cable_row"],superset:["bench_press"]},
  substitutes:["barbell_row","t_bar_row","cable_row"],
  scienceNotes:"Named after Glenn Pendlay. The dead stop eliminates stretch-shortening cycle, requiring pure concentric strength each rep. The strict parallel-torso position maximizes lat and mid-back engagement. Favored in strength training for transfer to deadlift performance."
},
{
  id:"machine_shoulder_press",name:"Machine Shoulder Press",icon:"🤖",color:"#3498db",
  category:"shoulders",equipment:"machine",difficulty:"beginner",
  bwRatio:0.35,
  aliases:["shoulder press machine","seated machine press","hammer strength shoulder"],
  musclesPrimary:[{muscle:"front_delts",pct:50},{muscle:"side_delts",pct:20}],
  musclesSecondary:[{muscle:"triceps",pct:25},{muscle:"back_traps",pct:5}],
  stabilizers:[],
  movementPattern:"push",
  biomechanics:{joint:"shoulder+elbow",type:"compound",plane:"sagittal",rom:"full",grip:"pronated"},
  repRanges:{strength:"6-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Adjust seat so handles start at ear level","Don't arch back","Full lockout at top"],
  progressionCues:["Great for burnout sets after free weight OHP","Try single-arm for imbalance correction","Use as pre-exhaust before lateral raises"],
  synergies:{antagonist:["lat_pulldown","pull_up"],complement:["overhead_press","lateral_raise"],superset:["face_pull"]},
  substitutes:["overhead_press","dumbbell_press","landmine_press"],
  scienceNotes:"Machine shoulder press provides a fixed path that eliminates stabilizer demand, allowing focus on pure deltoid overload. Safe for training to failure without a spotter. Research shows comparable deltoid activation to free weight pressing when volume is equated."
},
{
  id:"ab_wheel_rollout",name:"Ab Wheel Rollout",icon:"🛞",color:"#e67e22",
  category:"core",equipment:"bodyweight",difficulty:"intermediate",
  bwRatio:0,
  aliases:["ab roller","rollout","wheel rollout","barbell rollout"],
  musclesPrimary:[{muscle:"core",pct:70}],
  musclesSecondary:[{muscle:"back_lats",pct:10},{muscle:"front_delts",pct:10},{muscle:"core",pct:10}],
  stabilizers:["back_erector","triceps"],
  movementPattern:"push",
  biomechanics:{joint:"spine+shoulder",type:"compound",plane:"sagittal",rom:"full",grip:"both hands"},
  repRanges:{strength:"5-8",hypertrophy:"8-12",endurance:"12-20"},
  warnings:["Don't let lower back sag","Start from knees, progress to standing","Keep core tight — if back hurts, stop"],
  progressionCues:["Master knees version first","Increase ROM gradually","Standing rollouts are elite-level"],
  synergies:{antagonist:["back_extension"],complement:["plank","hanging_leg_raise"],superset:["plank"]},
  substitutes:["plank","dead_bug","hanging_leg_raise"],
  scienceNotes:"Ab wheel rollouts produce the highest rectus abdominis and oblique EMG activation of any core exercise in multiple studies. The anti-extension demand (preventing lumbar hyperextension) trains the core in its primary stabilization function. Superior to crunches for both hypertrophy and functional strength."
},
{
  id:"decline_bench_press",name:"Decline Bench Press",icon:"📉",color:"#c0392b",
  category:"chest",equipment:"barbell",difficulty:"intermediate",
  bwRatio:0.55,
  aliases:["decline press","decline barbell press","lower chest press"],
  musclesPrimary:[{muscle:"chest_mid",pct:55}],
  musclesSecondary:[{muscle:"triceps",pct:25},{muscle:"front_delts",pct:15},{muscle:"core",pct:5}],
  stabilizers:["core","rotator_cuff"],
  movementPattern:"push",
  biomechanics:{joint:"shoulder+elbow",type:"compound",plane:"sagittal",rom:"full",grip:"pronated"},
  repRanges:{strength:"4-6",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Use spotter — can't bail easily on decline","Don't go too steep (15-30° is enough)","Secure legs before unracking"],
  progressionCues:["Master flat bench first","Try dumbbell decline for more ROM","Use as accessory, not primary press"],
  synergies:{antagonist:["barbell_row","cable_row"],complement:["bench_press","cable_fly"],superset:["barbell_row"]},
  substitutes:["bench_press","weighted_dip","cable_fly"],
  scienceNotes:"Decline pressing emphasizes the sternal (lower) fibers of the pectoralis major. Some research suggests decline press produces equal or greater overall chest EMG activation compared to flat bench, with less shoulder stress. The reduced shoulder flexion angle is easier on the rotator cuff."
},
{
  id:"farmer_carry",name:"Farmer's Carry",icon:"🧑‍🌾",color:"#2c3e50",
  category:"full_body",equipment:"dumbbell",difficulty:"beginner",
  bwRatio:0.3,
  aliases:["farmer walk","loaded carry","farmer's walk","suitcase carry"],
  musclesPrimary:[{muscle:"back_traps",pct:25},{muscle:"forearms",pct:25},{muscle:"core",pct:25}],
  musclesSecondary:[{muscle:"glutes",pct:10},{muscle:"calves",pct:5},{muscle:"quads",pct:5},{muscle:"hamstrings",pct:5}],
  stabilizers:["back_erector","rotator_cuff"],
  movementPattern:"carry",
  biomechanics:{joint:"full body",type:"compound",plane:"sagittal",rom:"walking",grip:"neutral"},
  repRanges:{strength:"30-45 sec",hypertrophy:"45-60 sec",endurance:"60-90 sec"},
  warnings:["Keep shoulders packed — don't shrug up","Walk tall — don't lean forward","Start lighter than you think"],
  progressionCues:["Try single-arm (suitcase carry) for oblique focus","Increase distance before weight","Try overhead carry for shoulder stability"],
  synergies:{antagonist:[],complement:["deadlift","barbell_row"],superset:[]},
  substitutes:["trap_bar_deadlift","shrugs"],
  scienceNotes:"Farmer's carries train grip strength, core stability, and postural endurance simultaneously. Dan John calls them 'the one exercise everyone should do.' They build work capacity, strengthen the rotator cuff in a packed position, and have direct carryover to deadlift grip and overall athletic performance."
},
{
  id:"romanian_split_squat",name:"Romanian Split Squat",icon:"🇷🇴",color:"#e74c3c",
  category:"legs",equipment:"dumbbell",difficulty:"intermediate",
  bwRatio:0.15,
  aliases:["RSQ","split squat","static lunge","stationary lunge"],
  musclesPrimary:[{muscle:"quads",pct:40},{muscle:"glutes",pct:35}],
  musclesSecondary:[{muscle:"hamstrings",pct:15},{muscle:"glutes",pct:5},{muscle:"calves",pct:5}],
  stabilizers:["core","hip_flexors"],
  movementPattern:"squat",
  biomechanics:{joint:"knee+hip",type:"compound",plane:"sagittal",rom:"full",grip:"neutral"},
  repRanges:{strength:"6-8 per leg",hypertrophy:"8-12 per leg",endurance:"12-15 per leg"},
  warnings:["Keep front shin vertical","Don't let front knee cave inward","Lower straight down, not forward"],
  progressionCues:["Master bodyweight first","Progress to dumbbells then barbell","Elevate rear foot to become Bulgarian split squat"],
  synergies:{antagonist:["leg_curl"],complement:["bulgarian_split_squat","goblet_squat","leg_press"],superset:["leg_curl"]},
  substitutes:["bulgarian_split_squat","walking_lunge","goblet_squat"],
  scienceNotes:"The split squat is a fundamental unilateral exercise. Both feet stay grounded (unlike lunges), making it more stable and easier to learn. Similar quad and glute activation to back squats with less spinal loading. Progressive overload is straightforward — add weight or elevate the rear foot."
},
{
  id:"smith_machine_squat",name:"Smith Machine Squat",icon:"📊",color:"#9b59b6",
  category:"legs",equipment:"machine",difficulty:"beginner",
  bwRatio:0.6,
  aliases:["smith squat","guided squat","machine squat"],
  musclesPrimary:[{muscle:"quads",pct:50},{muscle:"glutes",pct:30}],
  musclesSecondary:[{muscle:"hamstrings",pct:10},{muscle:"glutes",pct:5},{muscle:"calves",pct:5}],
  stabilizers:["core"],
  movementPattern:"squat",
  biomechanics:{joint:"knee+hip",type:"compound",plane:"sagittal",rom:"full",grip:"barbell"},
  repRanges:{strength:"5-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Place feet slightly forward","Don't lock knees at top","Use safety stops"],
  progressionCues:["Good stepping stone to free barbell squat","Try different foot positions","Use for high-rep burnout sets"],
  synergies:{antagonist:["leg_curl"],complement:["barbell_squat","leg_press"],superset:["calf_raise"]},
  substitutes:["barbell_squat","hack_squat","leg_press"],
  scienceNotes:"The fixed bar path reduces stabilizer demand, allowing focus on quad overload. Placing feet forward shifts emphasis to quads by keeping a more vertical torso. While free squats are superior for functional strength, Smith squats allow safe training to failure without a spotter."
},
{
  id:"seated_row_machine",name:"Seated Row Machine",icon:"🪑",color:"#3498db",
  category:"back",equipment:"machine",difficulty:"beginner",
  bwRatio:0.4,
  aliases:["machine row","chest supported row","seated row","plate loaded row"],
  musclesPrimary:[{muscle:"back_upper",pct:35},{muscle:"back_lats",pct:30}],
  musclesSecondary:[{muscle:"biceps",pct:15},{muscle:"rear_delts",pct:10},{muscle:"back_traps",pct:10}],
  stabilizers:[],
  movementPattern:"pull",
  biomechanics:{joint:"shoulder+elbow",type:"compound",plane:"sagittal",rom:"full",grip:"varies"},
  repRanges:{strength:"6-8",hypertrophy:"8-12",endurance:"12-15"},
  warnings:["Don't use momentum — stay planted","Squeeze shoulder blades together at end","Full stretch on eccentric"],
  progressionCues:["Try different grip attachments","Use for high-rep back work","Single-arm for imbalance correction"],
  synergies:{antagonist:["bench_press","machine_chest_press"],complement:["cable_row","barbell_row"],superset:["machine_chest_press"]},
  substitutes:["cable_row","barbell_row","t_bar_row"],
  scienceNotes:"Machine rows eliminate lower back fatigue as a limiting factor, allowing pure back muscle overload. Chest-supported variants are especially effective for those with lower back issues. Multiple grip options (wide, narrow, neutral) shift emphasis between lats and mid-back."
}

];

// ─── HELPER: Find exercise by ID ─────────────────────────────
function findExercise(id) {
  for (var i = 0; i < EXERCISE_DB.length; i++) {
    if (EXERCISE_DB[i].id === id) return EXERCISE_DB[i];
  }
  return null;
}

// ─── HELPER: Get exercises by muscle group ───────────────────
function getExercisesByMuscle(muscleId) {
  return EXERCISE_DB.filter(function(ex) {
    return ex.musclesPrimary.some(function(m) { return m.muscle === muscleId; }) ||
           ex.musclesSecondary.some(function(m) { return m.muscle === muscleId; });
  });
}

// ─── HELPER: Get exercises by category ───────────────────────
function getExercisesByCategory(cat) {
  return EXERCISE_DB.filter(function(ex) { return ex.category === cat; });
}

// ─── HELPER: Get exercises by equipment ──────────────────────
function getExercisesByEquipment(equip) {
  return EXERCISE_DB.filter(function(ex) { return ex.equipment === equip; });
}

// ─── HELPER: Search exercises ────────────────────────────────
function searchExercises(query) {
  if (!query) return EXERCISE_DB;
  var q = query.toLowerCase();
  return EXERCISE_DB.filter(function(ex) {
    return ex.name.toLowerCase().indexOf(q) >= 0 ||
           ex.category.toLowerCase().indexOf(q) >= 0 ||
           ex.equipment.toLowerCase().indexOf(q) >= 0 ||
           (ex.aliases && ex.aliases.some(function(a) {
             return a.toLowerCase().indexOf(q) >= 0;
           })) ||
           ex.musclesPrimary.some(function(m) {
             var mg = MUSCLE_GROUPS[m.muscle];
             return mg && mg.name.toLowerCase().indexOf(q) >= 0;
           });
  });
}
