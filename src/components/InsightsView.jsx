import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Footprints,
  Feather,
  Droplet,
  BookOpen,
  Dumbbell,
  Pill,
  Award,
  Layers,
  Sparkles,
  Star,
  Flame,
  PartyPopper,
} from 'lucide-react';
import {
  WEEKLY_HISTORY_DEFAULT,
  formatGoalValue,
  getCurrentWeekdayIndexMondayFirst,
} from '../data/studyData.js';
import {
  getTexts,
  getGoalTitle,
  getWeekdayLabel,
  getLocalizedWeekRange,
} from '../data/i18n.js';
import { RollingNumber } from './RollingNumber.jsx';
import { triggerIosHaptic } from './IosPwaInstallModal.jsx';

const GOAL_ICON_MAP = {
  moon: { Icon: Moon, color: '#6E8597' },
  footprints: { Icon: Footprints, color: '#E05A47' },
  feather: { Icon: Feather, color: '#D99B26' },
  droplet: { Icon: Droplet, color: '#1EA4F2' },
  book: { Icon: BookOpen, color: '#EB5769' },
  dumbbell: { Icon: Dumbbell, color: '#5E7185' },
  pill: { Icon: Pill, color: '#E85C90' },
  piggy: { Icon: Award, color: '#EC4899' },
  scale: { Icon: Layers, color: '#0EA5E9' },
};

const GOAL_WEEKLY_PATTERNS = {
  'study-hours': [
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: true, u2: false },
    { u1: true, u2: true },
    { u1: false, u2: true },
    { u1: true, u2: true },
    { u1: true, u2: true },
  ],
  flashcards: [
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: false, u2: true },
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: false, u2: true },
  ],
  reading: [
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: false, u2: true },
    { u1: true, u2: false },
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: false, u2: true },
  ],
  lectures: [
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: true, u2: false },
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: false, u2: true },
    { u1: true, u2: true },
  ],
  'active-recall': [
    { u1: true, u2: true },
    { u1: false, u2: true },
    { u1: true, u2: false },
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: false, u2: true },
    { u1: true, u2: true },
  ],
  'problem-sets': [
    { u1: false, u2: true },
    { u1: true, u2: true },
    { u1: false, u2: true },
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: false, u2: true },
    { u1: true, u2: true },
  ],
  'daily-review': [
    { u1: true, u2: true },
    { u1: true, u2: false },
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: true, u2: true },
    { u1: true, u2: false },
    { u1: true, u2: true },
  ],
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function describeArcSegment(cx, cy, r, startAngleDeg, endAngleDeg) {
  const start = polarToCartesian(cx, cy, r, startAngleDeg);
  const end = polarToCartesian(cx, cy, r, endAngleDeg);
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/**
 * 3D Glossy Green Mascot Orb (Matches 00:58 & 01:00 in the video)
 */
function MascotOrb({ size = 34 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full shrink-0 flex items-center justify-center shadow-[0_6px_16px_-2px_rgba(0,196,90,0.45),inset_0_2px_2px_rgba(255,255,255,0.75)]"
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(85% 85% at 32% 24%, #52FF9E 0%, #00C853 52%, #009940 100%)',
        }}
      />
      {/* Top glass lens highlight */}
      <div className="absolute top-[2px] left-[20%] w-[60%] h-[34%] rounded-full bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
      {/* Subtle friendly eyes & smile */}
      <svg
        width={size * 0.56}
        height={size * 0.42}
        viewBox="0 0 20 14"
        className="relative z-10 opacity-75"
      >
        <circle cx="5.5" cy="4.5" r="1.35" fill="#064E26" />
        <circle cx="14.5" cy="4.5" r="1.35" fill="#064E26" />
        <path
          d="M 6.5 9.2 Q 10 12 13.5 9.2"
          fill="none"
          stroke="#064E26"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Split Semicircle Indicator (Matches 01:00 - 01:02 in the video)
 * Left half = User 1, Right half = User 2, separated by a crisp gap
 */
function SplitHalfCircle({
  u1,
  u2,
  u1Color = '#00B86B',
  u2Color = '#00A8E8',
  size = 30,
  hideWhenEmpty = false,
}) {
  const r = size / 2;
  const pad = 1.2;
  const gap = size >= 24 ? 1.3 : 1.0;

  if (hideWhenEmpty && !u1 && !u2) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-black/[0.04]"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 overflow-visible"
    >
      {/* Left Half-Moon (User 1) */}
      <path
        d={`M ${r - gap} ${pad} A ${r - pad} ${r - pad} 0 0 0 ${r - gap} ${size - pad} Z`}
        fill={u1 ? u1Color : 'rgba(15, 28, 24, 0.06)'}
      />
      {/* Right Half-Moon (User 2) */}
      <path
        d={`M ${r + gap} ${pad} A ${r - pad} ${r - pad} 0 0 1 ${r + gap} ${size - pad} Z`}
        fill={u2 ? u2Color : 'rgba(15, 28, 24, 0.06)'}
      />
    </svg>
  );
}

/**
 * 10-Segment 240° Horseshoe Pod Health Gauge (Exact replica of 00:58 - 00:59 in video)
 */
function PodHealthHorseshoeGauge({ podHealth = 0, lang = 'en' }) {
  const [showHealthInfo, setShowHealthInfo] = useState(false);
  const t = getTexts(lang);
  const totalSegments = 10;
  const clampedHealth = Math.max(0, Math.min(100, podHealth));
  // At 86%, 9 of the 10 segments are lit; at 0%, 0 segments are lit
  const activeSegments =
    clampedHealth <= 0
      ? 0
      : clampedHealth === 86
        ? 9
        : Math.max(1, Math.round((clampedHealth / 100) * totalSegments));

  // 240° horseshoe sweep: from 210° (bottom-left) clockwise through 90° (top) to -30° (bottom-right)
  const totalSpan = 240;
  const gapDeg = 9.5;
  const segSpan = (totalSpan - gapDeg * (totalSegments - 1)) / totalSegments;

  const cx = 130;
  const cy = 114;
  const radius = 84;

  const segments = Array.from({ length: totalSegments }, (_, idx) => {
    const startAngle = 210 - idx * (segSpan + gapDeg);
    const endAngle = startAngle - segSpan;
    const isFilled = idx < activeSegments;
    return {
      idx,
      d: describeArcSegment(cx, cy, radius, startAngle, endAngle),
      isFilled,
    };
  });

  const statusText =
    clampedHealth >= 75
      ? t.thriving
      : clampedHealth >= 50
        ? t.steady
        : t.warmingUp;

  return (
    <div className="relative flex flex-col items-center pt-1 pb-2">
      {/* Top Label: POD HEALTH ⓘ (Interactive iOS Popover Toggle) */}
      <button
        type="button"
        onClick={() => {
          triggerIosHaptic('light');
          setShowHealthInfo((v) => !v);
        }}
        className="icon-button flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.15em] text-[#788A83] uppercase mb-1 cursor-pointer"
        aria-expanded={showHealthInfo}
      >
        <span>{t.podHealth}</span>
        <span className="w-3.5 h-3.5 rounded-full border border-[#96A7A0]/60 text-[8.5px] font-bold flex items-center justify-center text-[#84968F] leading-none">
          i
        </span>
      </button>
      {showHealthInfo && (
        <div className="mb-2 px-3 py-1.5 rounded-full bg-white/80 border border-white/95 text-[11px] font-semibold text-[#364943] text-center shadow-2xs animate-fadeIn">
          {t.podHealthInfo}
        </div>
      )}

      {/* 240° Horseshoe SVG + Inner Mascot & 86 THRIVING */}
      <div className="relative w-[260px] h-[200px] flex items-center justify-center">
        <svg
          width="260"
          height="200"
          viewBox="0 0 260 200"
          className="overflow-visible"
        >
          <defs>
            <linearGradient
              id="horseshoeGreen"
              gradientUnits="userSpaceOnUse"
              x1="30"
              y1="20"
              x2="230"
              y2="180"
            >
              <stop offset="0%" stopColor="#05D666" />
              <stop offset="100%" stopColor="#00B24F" />
            </linearGradient>
            <filter
              id="segGlow"
              filterUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="260"
              height="200"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2.5"
                floodColor="#00C458"
                floodOpacity="0.32"
              />
            </filter>
          </defs>

          {segments.map((seg) => (
            <path
              key={seg.idx}
              d={seg.d}
              fill="none"
              stroke={
                seg.isFilled
                  ? 'url(#horseshoeGreen)'
                  : 'rgba(0, 184, 107, 0.14)'
              }
              filter={seg.isFilled ? 'url(#segGlow)' : undefined}
              strokeWidth="10.5"
              strokeLinecap="round"
              style={{ '--seg-idx': seg.idx }}
              className="ios-seg-bloom transition-all duration-500"
            />
          ))}
        </svg>

        {/* Center Stack Inside Horseshoe: Mascot Orb -> 86 -> THRIVING */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-5 pointer-events-none">
          <div className="ios-mascot-entrance animate-float">
            <MascotOrb size={34} />
          </div>
          <div className="mt-2 text-[58px] font-extrabold text-[#141E28] leading-[0.92] tracking-[-0.04em] tabular-nums drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
            <RollingNumber value={clampedHealth} />
          </div>
          <div className="mt-2 text-[11px] font-extrabold tracking-[0.15em] text-[#00A859] uppercase">
            {statusText}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom Golden Rising Sun SVG for the "YOUR WEEK" Card (Matches 00:59 in video)
 */
function RisingSunIllustration() {
  return (
    <div className="w-[54px] h-[44px] flex items-center justify-center shrink-0">
      <svg width="52" height="40" viewBox="0 0 52 40" className="overflow-visible">
        <defs>
          <linearGradient id="sunDomeGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFE484" />
            <stop offset="55%" stopColor="#F6B236" />
            <stop offset="100%" stopColor="#E09119" />
          </linearGradient>
          <filter id="sunGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="4"
              floodColor="#F5A623"
              floodOpacity="0.38"
            />
          </filter>
        </defs>
        {/* Rising Sun Semi-Circle Dome */}
        <path
          d="M 8 27 A 18 18 0 0 1 44 27 Z"
          fill="url(#sunDomeGrad)"
          filter="url(#sunGlow)"
        />
        {/* Inner Specular Crescent on the Sun Dome */}
        <path
          d="M 13 24 A 13 13 0 0 1 39 24"
          fill="none"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Primary Horizon Line */}
        <line
          x1="4"
          y1="30"
          x2="48"
          y2="30"
          stroke="#DCA03A"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Secondary Shimmer Reflection Line */}
        <line
          x1="14"
          y1="34.5"
          x2="38"
          y2="34.5"
          stroke="#E5B869"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

export function InsightsView({ state, metrics }) {
  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);

  const lang = state?.lang === 'ar' ? 'ar' : 'en';
  const t = getTexts(lang);

  const u1Name = state?.user1?.name || 'Ced';
  const u2Name = state?.user2?.name || 'Joe';
  const u1Color = state?.user1?.color || '#00B86B';
  const u2Color = state?.user2?.color || '#00A8E8';

  const weeklyHistory =
    state?.weeklyHistory && state.weeklyHistory.length === 7
      ? state.weeklyHistory
      : WEEKLY_HISTORY_DEFAULT;

  const weeklySyncDays = weeklyHistory.filter((d) => d.u1 && d.u2).length;
  const weekRangeLabel = getLocalizedWeekRange(false, lang);
  const weekRangeUpper = getLocalizedWeekRange(true, lang);
  const todayWeekdayIdx = getCurrentWeekdayIndexMondayFirst();
  const isDemo = Boolean(metrics?.isDefaultDemo);

  const dailyGoals = (state?.goals || []).filter(
    (g) => g.enabled && g.category === 'daily'
  );

  const u1Percent = metrics?.user1Percent ?? 0;
  const u2Percent = metrics?.user2Percent ?? 0;
  const effectivePodHealth = metrics?.podHealth ?? state?.podHealth ?? 0;

  // =========================================================================
  // VIEW 2: Weekly Sync Detail Recap Screen
  // =========================================================================
  if (showWeeklyDetail) {
    return (
      <div className="px-5 pt-1 pb-28 max-w-[560px] mx-auto animate-fadeIn">
        {/* Clean Top-Start Back Button */}
        <div className="flex items-center mb-1">
          <button
            type="button"
            onClick={() => setShowWeeklyDetail(false)}
            aria-label="Back to Insights"
            className="w-9 h-9 -ms-1.5 rounded-full liquid-glass-pill flex items-center justify-center text-[#141E28] cursor-pointer"
          >
            <ChevronLeft
              className={`w-5 h-5 stroke-[2.3] ${
                lang === 'ar' ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Hero Sync Number + Floating Mascot Orb */}
        <div className="relative text-center mt-1 mb-6">
          <div className="text-[10.5px] font-bold tracking-[0.15em] text-[#788A83] uppercase">
            {lang === 'ar'
              ? `أنت و ${u2Name} · ${weekRangeUpper}`
              : `YOU & ${u2Name.toUpperCase()} · ${weekRangeUpper}`}
          </div>

          <div className="relative inline-flex items-center justify-center mt-1">
            <span className="text-[78px] font-extrabold text-[#141E28] leading-[0.9] tracking-[-0.045em] tabular-nums">
              <RollingNumber value={weeklySyncDays} />
            </span>
            {/* Mascot Orb floating to upper-right of the 5 */}
            <div className="absolute -right-14 top-1 ios-mascot-entrance animate-float">
              <MascotOrb size={34} />
            </div>
          </div>

          <div className="text-[20px] font-bold text-[#141E28] tracking-[-0.025em] mt-1.5">
            {t.daysInSyncThisWeek}
          </div>
          <p className="text-[12.5px] font-medium text-[#7A8B85] mt-0.5">
            {t.bothHitEveryGoal}
          </p>
        </div>

        {/* 7-Day Split Circles Row (Circles on top, M T W T F S S below) */}
        <div
          dir="ltr"
          className="grid grid-cols-7 gap-2 justify-items-center mb-7 px-2"
        >
          {weeklyHistory.map((item, idx) => {
            const both = item.u1 && item.u2;
            return (
              <div
                key={idx}
                style={{ '--stagger': idx }}
                className="flex flex-col items-center gap-2 ios-stagger-card"
              >
                <div className="h-[34px] flex items-center justify-center">
                  <SplitHalfCircle
                    u1={Boolean(item.u1)}
                    u2={Boolean(item.u2)}
                    u1Color={u1Color}
                    u2Color={u2Color}
                    size={32}
                    hideWhenEmpty
                  />
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    both ? 'text-[#141E28]' : 'text-[#8FA19A]'
                  }`}
                >
                  {getWeekdayLabel(item.day, idx, lang)}
                </span>
              </div>
            );
          })}
        </div>

        {/* GOALS — Where you both showed up this week */}
        <div
          style={{ '--stagger': 3 }}
          className="liquid-glass-card p-5 ios-stagger-card"
        >
          <div className="text-[10.5px] font-extrabold tracking-[0.14em] text-[#7A8B85] uppercase">
            {t.goalsHeader}
          </div>
          <div className="text-[13px] text-[#6B7E77] font-medium mt-0.5 mb-4">
            {t.whereYouBothShowedUp}
          </div>

          <div className="divide-y divide-black/[0.05]">
            {dailyGoals.map((goal) => {
              const iconMeta = GOAL_ICON_MAP[goal.icon] || {
                Icon: Sparkles,
                color: '#009E5C',
              };
              const IconComponent = iconMeta.Icon;
              const threshold = goal.id === 'reading' ? 0.31 : 0.2;
              const u1HitToday =
                (goal.user1 || 0) / Math.max(1, goal.target || 1) >= threshold;
              const u2HitToday =
                (goal.user2 || 0) / Math.max(1, goal.target || 1) >= threshold;

              const pattern = isDemo
                ? GOAL_WEEKLY_PATTERNS[goal.id] || weeklyHistory
                : weeklyHistory.map((d, idx) =>
                    idx === todayWeekdayIdx
                      ? { u1: d.u1 || u1HitToday, u2: d.u2 || u2HitToday }
                      : { u1: Boolean(d.u1), u2: Boolean(d.u2) }
                  );
              const goalSyncCount = pattern.filter((d) => d.u1 && d.u2).length;
              const shortTitle = getGoalTitle(goal, lang, true);

              return (
                <div
                  key={goal.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2"
                >
                  {/* Goal Icon + Name */}
                  <div className="flex items-center gap-2.5 min-w-[110px]">
                    <IconComponent
                      className="w-4 h-4 shrink-0 stroke-[2.2]"
                      style={{ color: iconMeta.color }}
                    />
                    <span className="text-[15px] font-bold text-[#141E28] tracking-[-0.02em] truncate">
                      {shortTitle}
                    </span>
                  </div>

                  {/* 7 Split Semicircle Indicators */}
                  <div dir="ltr" className="flex items-center gap-1.5">
                    {pattern.map((d, i) => (
                      <SplitHalfCircle
                        key={i}
                        u1={d.u1}
                        u2={d.u2}
                        u1Color={u1Color}
                        u2Color={u2Color}
                        size={19}
                      />
                    ))}
                  </div>

                  {/* Right Sync Count */}
                  <div className="w-6 text-end shrink-0">
                    <span className="text-[21px] font-extrabold text-[#141E28] tracking-[-0.03em] tabular-nums">
                      {goalSyncCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: Main Insights Screen (Exact replica of 00:58 - 00:59 in video)
  // =========================================================================
  return (
    <div className="px-5 pt-2 pb-28 max-w-[580px] mx-auto animate-fadeIn">
      {/* Top Header Row: Left "Insights", Right "Ced + Joe · together 12 days" */}
      <div className="flex items-baseline justify-between mb-3">
        <h1 className="text-[28px] font-extrabold text-[#141E28] tracking-[-0.035em] leading-none">
          {t.insights}
        </h1>
        <p className="text-[12.5px] font-semibold text-[#748680] tracking-[-0.01em] tabular-nums">
          {t.togetherDays(u1Name, u2Name, state?.daysTogether ?? 12)}
        </p>
      </div>

      {/* Open Hero Section: 240° Horseshoe Pod Health Gauge + 3 Borderless Stat Columns */}
      <div
        style={{ '--stagger': 0 }}
        className="liquid-glass-card px-5 pt-5 pb-6 mb-6 ios-stagger-card"
      >
        <PodHealthHorseshoeGauge podHealth={effectivePodHealth} lang={lang} />

        {/* 3 Borderless Stat Columns */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-white/60 text-center">
          {/* Column 1: Best streak */}
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-amber-400/15 flex items-center justify-center mb-1">
              <Star className="w-4 h-4 text-[#F5A623] fill-[#F5A623]" />
            </div>
            <div className="text-[24px] font-extrabold text-[#00A859] leading-none tracking-[-0.03em] tabular-nums mt-0.5">
              <RollingNumber value={state?.bestStreak ?? 0} />
            </div>
            <div className="text-[10.5px] font-medium text-[#8C9E97] mt-0.5">
              {t.days}
            </div>
            <div className="text-[12px] font-bold text-[#263330] mt-0.5 tracking-[-0.01em]">
              {t.bestStreak}
            </div>
          </div>

          {/* Column 2: Days together */}
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-indigo-500/12 flex items-center justify-center mb-1">
              <PartyPopper className="w-4 h-4 text-[#4F46E5]" />
            </div>
            <div className="text-[24px] font-extrabold text-[#1E1B5E] leading-none tracking-[-0.03em] tabular-nums mt-0.5">
              <RollingNumber value={state?.daysTogether ?? 1} />
            </div>
            <div className="text-[10.5px] font-medium text-[#8C9E97] mt-0.5">
              {t.totalDays}
            </div>
            <div className="text-[12px] font-bold text-[#263330] mt-0.5 tracking-[-0.01em]">
              {t.daysTogether}
            </div>
          </div>

          {/* Column 3: Current streak */}
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-orange-500/15 flex items-center justify-center mb-1">
              <Flame className="w-4 h-4 text-[#E04F16] fill-[#F59E0B]" />
            </div>
            <div className="text-[24px] font-extrabold text-[#9E2A14] leading-none tracking-[-0.03em] tabular-nums mt-0.5">
              <RollingNumber value={state?.streak ?? 0} />
            </div>
            <div className="text-[10.5px] font-medium text-[#8C9E97] mt-0.5">
              {t.days}
            </div>
            <div className="text-[12px] font-bold text-[#263330] mt-0.5 tracking-[-0.01em]">
              {t.currentStreak}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Section */}
      <div style={{ '--stagger': 1 }} className="mb-6 ios-stagger-card">
        <div className="flex items-baseline justify-between mb-2.5 px-0.5">
          <h2 className="text-[19px] font-bold tracking-[-0.025em] text-[#141E28]">
            {t.weekly}
          </h2>
          <button
            type="button"
            onClick={() => setShowWeeklyDetail(true)}
            className="text-[12.5px] font-semibold text-[#7A8B85] hover:text-[#141E28] transition cursor-pointer"
          >
            {t.recap} {lang === 'ar' ? '‹' : '›'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowWeeklyDetail(true)}
          className="w-full text-start relative overflow-hidden rounded-[26px] p-5 flex items-center justify-between gap-4 ios-press cursor-pointer group"
          style={{
            background:
              'linear-gradient(135deg, rgba(255, 251, 238, 0.84) 0%, rgba(252, 239, 202, 0.68) 52%, rgba(247, 231, 186, 0.78) 100%)',
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            border: '1px solid rgba(255, 252, 240, 0.92)',
            boxShadow:
              '0 14px 34px -8px rgba(180, 130, 30, 0.12), 0 4px 10px -2px rgba(160, 115, 20, 0.06), inset 0 2px 1.5px 0 rgba(255, 255, 255, 0.98), inset 0 -2px 6px 0 rgba(255, 245, 215, 0.65)',
          }}
        >
          {/* Subtle Warm Sunlight Glow */}
          <div
            className="pointer-events-none absolute -left-6 -bottom-6 w-32 h-24 rounded-full blur-2xl opacity-45"
            style={{ backgroundColor: '#F5B027' }}
          />

          <div className="relative z-10 flex items-center gap-4">
            <RisingSunIllustration />

            <div>
              <div className="text-[10px] font-extrabold tracking-[0.14em] text-[#B88624] uppercase">
                {t.yourWeek}
              </div>
              <div className="text-[20px] font-extrabold text-[#141E28] tracking-[-0.03em] leading-tight mt-0.5">
                {weekRangeLabel}
              </div>
              <div className="text-[12.5px] font-medium text-[#8C7A54] mt-0.5">
                {t.tapToOpenRecap(weeklySyncDays)}
              </div>
            </div>
          </div>

          <div className="relative z-10 w-8 h-8 rounded-full bg-white/55 border border-white/80 flex items-center justify-center text-[#A8791E] group-hover:translate-x-0.5 transition">
            <ChevronRight
              className={`w-4 h-4 stroke-[2.4] ${
                lang === 'ar' ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Individual Section (Matches bottom of 00:59 in video) */}
      <div style={{ '--stagger': 2 }} className="ios-stagger-card">
        <div className="flex items-baseline justify-between mb-2.5 px-0.5">
          <h2 className="text-[19px] font-bold tracking-[-0.025em] text-[#141E28]">
            {t.individual}
          </h2>
          <span className="text-[12px] font-semibold text-[#7A8B85]">
            {t.todaysPace}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* User 1 Individual Card */}
          <div className="liquid-glass-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-extrabold text-[#141E28] tracking-[-0.02em]">
                {u1Name}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: u1Color,
                  boxShadow: `0 0 8px ${u1Color}`,
                }}
              />
            </div>

            <div className="my-3">
              <div className="text-[26px] font-extrabold tracking-[-0.035em] text-[#141E28] leading-none tabular-nums">
                <RollingNumber value={`${u1Percent}%`} />
              </div>
              <div className="text-[11.5px] font-medium text-[#748680] mt-1">
                <span dir="ltr">
                  {formatGoalValue(
                    dailyGoals[0] || { displayFormat: 'hours-mins' },
                    dailyGoals[0]?.user1 ?? 0
                  ) === '—'
                    ? '0m'
                    : formatGoalValue(
                        dailyGoals[0] || { displayFormat: 'hours-mins' },
                        dailyGoals[0]?.user1 ?? 0
                      )}
                </span>{' '}
                {t.studied}
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden p-0.5 liquid-glass-slot">
              <div
                className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: `${u1Percent <= 0 ? 0 : Math.max(10, u1Percent)}%`,
                  backgroundColor: u1Color,
                }}
              />
            </div>
          </div>

          {/* User 2 Individual Card */}
          <div className="liquid-glass-card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-extrabold text-[#141E28] tracking-[-0.02em]">
                {u2Name}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: u2Color,
                  boxShadow: `0 0 8px ${u2Color}`,
                }}
              />
            </div>

            <div className="my-3">
              <div className="text-[26px] font-extrabold tracking-[-0.035em] text-[#141E28] leading-none tabular-nums">
                <RollingNumber value={`${u2Percent}%`} />
              </div>
              <div className="text-[11.5px] font-medium text-[#748680] mt-1">
                <span dir="ltr">
                  {formatGoalValue(
                    dailyGoals[0] || { displayFormat: 'hours-mins' },
                    dailyGoals[0]?.user2 ?? 0
                  ) === '—'
                    ? '0m'
                    : formatGoalValue(
                        dailyGoals[0] || { displayFormat: 'hours-mins' },
                        dailyGoals[0]?.user2 ?? 0
                      )}
                </span>{' '}
                {t.studied}
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-black/[0.06] overflow-hidden p-0.5 liquid-glass-slot">
              <div
                className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: `${u2Percent <= 0 ? 0 : Math.max(10, u2Percent)}%`,
                  backgroundColor: u2Color,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InsightsView;
