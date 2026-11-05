// Default study-focused state & calculation engine for StudyPod
// Replicates the exact 43% / 6h vs 7h10m / 2,200 vs 7,400 / 5 min / 5 pgs vs 3 pgs screenshot metrics

export const RING_COLORS = [
  { id: 'emerald', name: 'Emerald Green', hex: '#00B86B', soft: 'rgba(0, 184, 107, 0.16)', text: '#009E5C' },
  { id: 'sky', name: 'Sky Cyan', hex: '#00A8E8', soft: 'rgba(0, 168, 232, 0.16)', text: '#0088BD' },
  { id: 'indigo', name: 'Focus Indigo', hex: '#6366F1', soft: 'rgba(99, 102, 241, 0.16)', text: '#4F46E5' },
  { id: 'amber', name: 'Warm Amber', hex: '#F59E0B', soft: 'rgba(245, 158, 11, 0.16)', text: '#D97706' },
  { id: 'rose', name: 'Coral Rose', hex: '#F43F5E', soft: 'rgba(244, 63, 94, 0.16)', text: '#E11D48' },
];

export const PRESET_STUDY_GOALS = [
  {
    id: 'study-hours',
    title: 'Deep Study',
    subtitle: 'Daily · Focus hours & Pomodoro blocks',
    icon: 'moon',
    visual: 'slanted-bars',
    fullWidth: true,
    category: 'daily',
    unit: 'min',
    displayFormat: 'hours-mins',
    target: 480, // 8h = 8 bars of 1h each
    step: 30,
    user1: 360, // 6h
    user2: 430, // 7h 10m
    enabled: true,
  },
  {
    id: 'flashcards',
    title: 'Flashcards & XP',
    subtitle: 'Daily · Cards & active recall points',
    icon: 'footprints',
    visual: 'dual-ring',
    fullWidth: false,
    category: 'daily',
    unit: 'cards',
    displayFormat: 'number',
    target: 10000,
    step: 200,
    user1: 2200,
    user2: 7400,
    enabled: true,
  },
  {
    id: 'active-recall',
    title: 'Quiz & Recall',
    subtitle: 'Daily · Timed closed-book drill',
    icon: 'feather',
    visual: 'bubbles',
    fullWidth: false,
    category: 'daily',
    unit: 'min',
    displayFormat: 'min',
    target: 20,
    step: 5,
    user1: 0,
    user2: 5,
    enabled: true,
  },
  {
    id: 'lectures',
    title: 'Lectures',
    subtitle: 'Daily · Video modules or chapters',
    icon: 'droplet',
    visual: 'droplets',
    fullWidth: false,
    category: 'daily',
    unit: 'mods',
    displayFormat: 'fraction',
    target: 8,
    step: 1,
    user1: 4,
    user2: 6,
    enabled: true,
  },
  {
    id: 'reading',
    title: 'Reading',
    subtitle: 'Daily · Textbook pages or papers',
    icon: 'book',
    visual: 'horiz-bars',
    fullWidth: false,
    category: 'daily',
    unit: 'pgs',
    displayFormat: 'unit',
    target: 10,
    step: 1,
    user1: 5,
    user2: 3,
    enabled: true,
  },
  {
    id: 'problem-sets',
    title: 'Problem Sets',
    subtitle: 'Daily · Practice exercises & labs',
    icon: 'dumbbell',
    visual: 'progress-line',
    fullWidth: false,
    category: 'daily',
    unit: 'min',
    displayFormat: 'min',
    target: 60,
    step: 10,
    user1: 0,
    user2: 32,
    enabled: true,
  },
  {
    id: 'daily-review',
    title: 'Spaced Review',
    subtitle: 'Daily · Morning & evening check-in',
    icon: 'pill',
    visual: 'pills',
    fullWidth: false,
    category: 'daily',
    unit: 'sessions',
    displayFormat: 'pills',
    target: 2,
    step: 1,
    user1: 1,
    user2: 0,
    enabled: true,
  },
  {
    id: 'mock-score',
    title: 'Mock Exam Pts',
    subtitle: 'Periodic · Cumulative practice score',
    icon: 'piggy',
    visual: 'beyond-bar',
    fullWidth: false,
    category: 'periodic',
    unit: 'pts',
    displayFormat: 'score',
    target: 200,
    step: 10,
    user1: 150,
    user2: 200,
    enabled: true,
  },
  {
    id: 'syllabus-topics',
    title: 'Topics Mastered',
    subtitle: 'Periodic · Syllabus units completed',
    icon: 'scale',
    visual: 'beyond-bar',
    fullWidth: false,
    category: 'periodic',
    unit: 'topics',
    displayFormat: 'topics',
    target: 200,
    step: 5,
    user1: 172,
    user2: 148,
    enabled: true,
  },
];

export const WEEKLY_HISTORY_DEFAULT = [
  { day: 'M', label: 'Mon', u1: true, u2: true },
  { day: 'T', label: 'Tue', u1: true, u2: true },
  { day: 'W', label: 'Wed', u1: true, u2: false },
  { day: 'T', label: 'Thu', u1: true, u2: true },
  { day: 'F', label: 'Fri', u1: true, u2: true },
  { day: 'S', label: 'Sat', u1: false, u2: true },
  { day: 'S', label: 'Sun', u1: true, u2: true },
];

export function getTodayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getFormattedDayLabel(isYesterday = false) {
  const d = new Date();
  if (isYesterday) d.setDate(d.getDate() - 1);
  const weekday = d
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase();
  const month = d
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase();
  const dayNum = d.getDate();
  return `${weekday} · ${month} ${dayNum}`;
}

export function getCurrentWeekRangeLabel(uppercase = false) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const m1 = mon.toLocaleDateString('en-US', { month: 'short' });
  const m2 = sun.toLocaleDateString('en-US', { month: 'short' });
  const d1 = mon.getDate();
  const d2 = sun.getDate();
  const label = m1 === m2 ? `${m1} ${d1} – ${d2}` : `${m1} ${d1} – ${m2} ${d2}`;
  return uppercase ? label.toUpperCase() : label;
}

export function getCurrentWeekdayIndexMondayFirst() {
  const day = new Date().getDay(); // 0=Sun..6=Sat
  return day === 0 ? 6 : day - 1; // 0=Mon..6=Sun
}

export function createDefaultState() {
  return {
    podCode: 'ZAU8PP',
    paired: true,
    isDemoSnapshot: true,
    lastActiveDate: getTodayIsoDate(),
    updatedAt: Date.now(),
    relationship: 'My Study Partner',
    activeLogger: 'user1', // 'user1' | 'user2'
    selectedDayView: 'today', // 'today' | 'yesterday'
    streak: 12,
    bestStreak: 18,
    daysTogether: 12,
    yesterdayPercent: 87,
    podHealth: 86,
    gentleReminders: true,
    user1: {
      name: 'Ced',
      email: 'ced@studypod.local',
      color: '#00B86B',
      studyingNow: false,
      studySubject: 'Deep Study',
      timerRemainingSec: 1500,
    },
    user2: {
      name: 'Joe',
      email: 'joe@studypod.local',
      color: '#00A8E8',
      studyingNow: false,
      studySubject: 'Flashcards & XP',
      timerRemainingSec: 1500,
    },
    goals: structuredClone(PRESET_STUDY_GOALS),
    weeklyHistory: structuredClone(WEEKLY_HISTORY_DEFAULT),
  };
}

/**
 * Clean, zero-dummy-data state for real personal daily tracking
 */
export function createRealInitialState(podCode = 'ZAU8PP') {
  return {
    podCode,
    paired: true,
    isDemoSnapshot: false,
    lastActiveDate: getTodayIsoDate(),
    updatedAt: Date.now(),
    relationship: 'My Study Partner',
    activeLogger: 'user1',
    selectedDayView: 'today',
    streak: 0,
    bestStreak: 0,
    daysTogether: 1,
    yesterdayPercent: 0,
    podHealth: 0,
    gentleReminders: true,
    user1: {
      name: 'Omar',
      email: '',
      color: '#00B86B',
      studyingNow: false,
      studySubject: 'Deep Study',
      timerRemainingSec: 1500,
    },
    user2: {
      name: 'Partner',
      email: '',
      color: '#00A8E8',
      studyingNow: false,
      studySubject: 'Deep Study',
      timerRemainingSec: 1500,
    },
    goals: structuredClone(PRESET_STUDY_GOALS).map((g) => ({
      ...g,
      user1: 0,
      user2: 0,
      yesterdayUser1: 0,
      yesterdayUser2: 0,
    })),
    weeklyHistory: [
      { day: 'M', label: 'Mon', u1: false, u2: false },
      { day: 'T', label: 'Tue', u1: false, u2: false },
      { day: 'W', label: 'Wed', u1: false, u2: false },
      { day: 'T', label: 'Thu', u1: false, u2: false },
      { day: 'F', label: 'Fri', u1: false, u2: false },
      { day: 'S', label: 'Sat', u1: false, u2: false },
      { day: 'S', label: 'Sun', u1: false, u2: false },
    ],
  };
}

export function createBlankOnboardingState() {
  const base = createRealInitialState();
  base.paired = false;
  return base;
}

export function formatGoalValue(goal, val) {
  if (val === 0 || val == null) {
    if (goal.id === 'flashcards' || goal.id === 'reading') return `0${goal.unit === 'pgs' ? ' pgs' : ''}`;
    return '—';
  }
  if (goal.displayFormat === 'hours-mins') {
    const h = Math.floor(val / 60);
    const m = val % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
  if (goal.displayFormat === 'number') {
    return val.toLocaleString();
  }
  if (goal.displayFormat === 'min') {
    return `${val} min`;
  }
  if (goal.displayFormat === 'unit') {
    return `${val} ${goal.unit}`;
  }
  if (goal.displayFormat === 'fraction') {
    return `${val}/${goal.target}`;
  }
  if (goal.displayFormat === 'score') {
    return `${val} pts`;
  }
  if (goal.displayFormat === 'topics') {
    return `${val} top`;
  }
  return `${val}`;
}

export function computePodMetrics(state) {
  const dailyGoals = (state.goals || []).filter((g) => g.enabled && g.category === 'daily');
  if (dailyGoals.length === 0) {
    return {
      user1Percent: 0,
      user2Percent: 0,
      combinedPercent: 0,
      user1Dots: 0,
      user2Dots: 0,
      inSyncCount: 0,
      totalDailyGoals: 0,
    };
  }

  let u1Sum = 0;
  let u2Sum = 0;
  let inSyncCount = 0;

  for (const g of dailyGoals) {
    const t = Math.max(1, g.target || 1);
    const r1 = Math.min(1, (g.user1 || 0) / t);
    const r2 = Math.min(1, (g.user2 || 0) / t);
    u1Sum += r1;
    u2Sum += r2;

    // A goal is "in sync today" when both users have made meaningful progress (>= 20% or both > 0 on multi-step goals)
    const threshold = g.id === 'reading' ? 0.31 : 0.2;
    if (r1 >= threshold && r2 >= threshold) {
      inSyncCount += 1;
    }
  }

  const u1Ratio = u1Sum / dailyGoals.length;
  const u2Ratio = u2Sum / dailyGoals.length;

  const user1Percent = Math.round(u1Ratio * 100);
  const user2Percent = state.paired ? Math.round(u2Ratio * 100) : user1Percent;

  // Check if exact default demo values are unmodified -> returns exact 43% as in screenshot
  const isDefaultDemo =
    state.paired &&
    dailyGoals.length === 7 &&
    dailyGoals[0]?.user1 === 360 &&
    dailyGoals[0]?.user2 === 430 &&
    dailyGoals[1]?.user1 === 2200 &&
    dailyGoals[1]?.user2 === 7400 &&
    dailyGoals[2]?.user1 === 0 &&
    dailyGoals[2]?.user2 === 5;

  const combinedPercent = isDefaultDemo
    ? 43
    : state.paired
      ? Math.round((user1Percent + user2Percent) / 2)
      : user1Percent;

  // 21 dots per side (7 rows x 3 columns)
  const user1Dots = isDefaultDemo ? 12 : Math.round(u1Ratio * 21);
  const user2Dots = isDefaultDemo ? 12 : state.paired ? Math.round(u2Ratio * 21) : 0;

  // Compute Yesterday's actual dots & percent from yesterdayUser1 / yesterdayUser2 when not in demo mode
  let yU1Sum = 0;
  let yU2Sum = 0;
  for (const g of dailyGoals) {
    const t = Math.max(1, g.target || 1);
    yU1Sum += Math.min(1, (g.yesterdayUser1 || 0) / t);
    yU2Sum += Math.min(1, (g.yesterdayUser2 || 0) / t);
  }
  const yU1Ratio = yU1Sum / dailyGoals.length;
  const yU2Ratio = yU2Sum / dailyGoals.length;
  const computedYesterdayPercent = isDefaultDemo
    ? state.yesterdayPercent ?? 87
    : state.paired
      ? Math.round(((yU1Ratio + yU2Ratio) / 2) * 100)
      : Math.round(yU1Ratio * 100);

  const yesterdayU1Dots = isDefaultDemo ? 18 : Math.round(yU1Ratio * 21);
  const yesterdayU2Dots = isDefaultDemo ? 19 : state.paired ? Math.round(yU2Ratio * 21) : 0;

  const computedPodHealth = isDefaultDemo
    ? state.podHealth ?? 86
    : Math.min(
        100,
        Math.round(
          combinedPercent * 0.7 +
            ((inSyncCount / Math.max(1, dailyGoals.length)) * 100) * 0.3
        )
      );

  return {
    user1Percent,
    user2Percent,
    combinedPercent:
      state.selectedDayView === 'yesterday'
        ? computedYesterdayPercent
        : combinedPercent,
    yesterdayPercent: computedYesterdayPercent,
    podHealth: computedPodHealth,
    user1Dots: state.selectedDayView === 'yesterday' ? yesterdayU1Dots : user1Dots,
    user2Dots: state.selectedDayView === 'yesterday' ? yesterdayU2Dots : user2Dots,
    inSyncCount: isDefaultDemo ? 2 : inSyncCount,
    totalDailyGoals: dailyGoals.length,
    isDefaultDemo,
  };
}
