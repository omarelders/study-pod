import React, { useState, useEffect } from 'react';
import {
  Moon,
  Footprints,
  Feather,
  Droplet,
  BookOpen,
  Dumbbell,
  Pill,
  Award,
  Layers,
  Check,
  Plus,
} from 'lucide-react';
import { formatGoalValue } from '../data/studyData.js';
import {
  getTexts,
  getGoalTitle,
  getLocalizedDayHeader,
} from '../data/i18n.js';
import { RollingNumber } from './RollingNumber.jsx';
import { triggerIosHaptic } from './IosPwaInstallModal.jsx';

function hexToRgba(hex, alpha = 0.14) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(0, 184, 107, ${alpha})`;
  }
  const clean = hex.replace('#', '');
  const num = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16
  );
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function GoalHeaderIcon({ iconName }) {
  switch (iconName) {
    case 'moon':
      return <Moon className="w-3.5 h-3.5 text-[#6E8597] fill-[#6E8597]/35 stroke-[2.2]" />;
    case 'footprints':
      return <Footprints className="w-3.5 h-3.5 text-[#E05A47] fill-[#E05A47]/25 stroke-[2.2]" />;
    case 'feather':
      return <Feather className="w-3.5 h-3.5 text-[#D99B26] fill-[#D99B26]/30 stroke-[2.2]" />;
    case 'droplet':
      return <Droplet className="w-3.5 h-3.5 text-[#1EA4F2] fill-[#1EA4F2]/25 stroke-[2.2]" />;
    case 'book':
      return <BookOpen className="w-3.5 h-3.5 text-[#EB5769] fill-[#EB5769]/18 stroke-[2.2]" />;
    case 'dumbbell':
      return <Dumbbell className="w-3.5 h-3.5 text-[#5E7185] stroke-[2.2]" />;
    case 'pill':
      return <Pill className="w-3.5 h-3.5 text-[#E85C90] fill-[#E85C90]/22 stroke-[2.2]" />;
    case 'piggy':
      return <Award className="w-3.5 h-3.5 text-[#EC4899] fill-[#EC4899]/22 stroke-[2.2]" />;
    case 'scale':
      return <Layers className="w-3.5 h-3.5 text-[#0EA5E9] fill-[#0EA5E9]/22 stroke-[2.2]" />;
    default:
      return <Moon className="w-3.5 h-3.5 text-[#6E8597]" />;
  }
}

function getDisplayCardTitle(goal) {
  if (goal.id === 'flashcards' && goal.title === 'Flashcards & XP') {
    return 'Flashcards';
  }
  if (goal.id === 'active-recall' && goal.title === 'Quiz & Recall') {
    return 'Recall';
  }
  return goal.title;
}

const LIQUID_CARD_CLASS =
  'liquid-glass-card p-4 sm:p-4.5 cursor-pointer select-none';

export function StudyBentoGrid({
  state,
  metrics,
  onSelectGoal,
  onQuickStep,
  onSwitchActiveLogger,
}) {
  const lang = state?.lang === 'ar' ? 'ar' : 'en';
  const t = getTexts(lang);
  const u1Color = state?.user1?.color || '#00B86B';
  const u2Color = state?.user2?.color || '#00A8E8';
  const u1Soft = hexToRgba(u1Color, 0.15);
  const u2Soft = hexToRgba(u2Color, 0.15);
  const u2TextColor = u2Color.toUpperCase() === '#00A8E8' ? '#0098D8' : u2Color;

  const paired = state?.paired !== false;
  const activeLogger = state?.activeLogger || 'user1';
  const isYesterday = state?.selectedDayView === 'yesterday';

  const enabledGoals = (state?.goals || []).filter((g) => g.enabled);
  const dailyGoals = enabledGoals.filter((g) => g.category === 'daily');
  const periodicGoals = enabledGoals.filter((g) => g.category === 'periodic');

  const getEffectiveVal = (goal, userKey) => {
    if (userKey === 'user2' && !paired) return 0;
    const raw = goal[userKey] || 0;
    if (!isYesterday) return raw;
    if (metrics?.isDefaultDemo) {
      return Math.min(goal.target, Math.round(raw * 1.15 + (goal.step || 1)));
    }
    const yKey = userKey === 'user2' ? 'yesterdayUser2' : 'yesterdayUser1';
    return goal[yKey] || 0;
  };

  return (
    <div className="px-4 pt-1 pb-4">
      {/* Sub-header: Live Calendar Date / Today's Progress / Minimal User Legend */}
      <div className="mb-3.5 px-0.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold tracking-[0.11em] text-[#6E827B] uppercase">
            {getLocalizedDayHeader(isYesterday, lang)}
          </div>

          {/* Minimal Native Legend: ● Ced  ● Joe */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onSwitchActiveLogger && onSwitchActiveLogger('user1')}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-semibold transition cursor-pointer ${
                activeLogger === 'user1'
                  ? 'liquid-glass-pill text-[#141E28]'
                  : 'text-[#5A6B65] hover:bg-white/40'
              }`}
              title={`Tap to log as ${state?.user1?.name || 'Ced'}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: u1Color, color: u1Color }}
              />
              <span>{state?.user1?.name || 'Ced'}</span>
              {state?.user1?.studyingNow && (
                <span className="text-[10px] animate-pulse" title="Studying now">
                  ⏱
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSwitchActiveLogger && onSwitchActiveLogger('user2')}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-semibold transition cursor-pointer ${
                activeLogger === 'user2'
                  ? 'liquid-glass-pill text-[#141E28]'
                  : 'text-[#5A6B65] hover:bg-white/40'
              }`}
              title={`Tap to log as ${state?.user2?.name || 'Joe'}`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                style={{
                  backgroundColor: paired ? u2Color : '#94A3B8',
                  color: paired ? u2Color : '#94A3B8',
                }}
              />
              <span>
                {paired ? state?.user2?.name || 'Joe' : t.partnerDefault}
              </span>
              {state?.user2?.studyingNow && (
                <span className="text-[10px] animate-pulse" title="Studying now">
                  ⏱
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-0.5">
          <h2 className="text-[22px] font-bold tracking-[-0.028em] text-[#111B24] leading-tight">
            {isYesterday ? t.yesterdaysProgress : t.todaysProgress}
          </h2>
          <p
            className="text-[12.5px] text-[#6E827B] font-medium mt-0.5"
            data-testid="goals-in-sync-subtitle"
          >
            {paired
              ? t.goalsInSyncToday(
                  metrics?.inSyncCount ?? 2,
                  metrics?.totalDailyGoals ?? 7
                )
              : t.pairToSyncGoals}
          </p>
        </div>
      </div>

      {/* Daily Study Liquid Glass Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-3.5">
        {dailyGoals.map((goal, cardIdx) => {
          const u1Val = getEffectiveVal(goal, 'user1');
          const u2Val = getEffectiveVal(goal, 'user2');
          const cardTitle = getGoalTitle(goal, lang, true);

          // Full-Width Slanted Bars Card (Deep Study)
          if (goal.visual === 'slanted-bars' || goal.fullWidth) {
            const u1Bars = Math.min(8, Math.round((u1Val / (goal.target || 480)) * 8));
            const u2Bars = Math.min(8, Math.round((u2Val / (goal.target || 480)) * 8));

            return (
              <div
                key={goal.id}
                onClick={() => {
                  triggerIosHaptic('light');
                  onSelectGoal && onSelectGoal(goal.id);
                }}
                data-testid={`goal-card-${goal.id}`}
                style={{ '--stagger': cardIdx }}
                className={`col-span-2 ios-stagger-card ${LIQUID_CARD_CLASS}`}
              >
                {/* Subtle Internal Chromatic Refraction Caustics */}
                <div
                  className="pointer-events-none absolute -left-8 -bottom-8 w-36 h-28 rounded-full blur-2xl opacity-30"
                  style={{ backgroundColor: u1Color }}
                />
                <div
                  className="pointer-events-none absolute -right-8 -bottom-8 w-36 h-28 rounded-full blur-2xl opacity-30"
                  style={{ backgroundColor: u2Color }}
                />

                {/* Clean Top-Left Header + 1-Tap Quick-Step Pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <GoalHeaderIcon iconName={goal.icon} />
                    <span className="text-[13px] font-bold text-[#1B2724]">
                      {cardTitle}
                    </span>
                  </div>
                  {!isYesterday && onQuickStep && (
                    <button
                      type="button"
                      aria-label={`Quick log ${cardTitle}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerIosHaptic('light');
                        onQuickStep(goal.id);
                      }}
                      className="icon-button w-6 h-6 rounded-full bg-white/75 border border-white/95 shadow-2xs flex items-center justify-center text-[#243630] active:scale-90 transition cursor-pointer"
                      title={`Quick log +${goal.step || 1} ${goal.unit || ''}`}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* 8 Glossy Liquid Slanted Bars Left + Moon Divider + 8 Glossy Slanted Bars Right */}
                <div
                  dir="ltr"
                  className="mt-3.5 flex items-center justify-between gap-2 sm:gap-5 px-1 sm:px-3"
                >
                  {/* Left: User 1 */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full max-w-[230px] flex items-center justify-center gap-[4.5px] sm:gap-[6px]">
                      {Array.from({ length: 8 }).map((_, idx) => {
                        const filled = idx < u1Bars;
                        const unfilledAlpha = idx === 7 ? 0.08 : 0.15;
                        return (
                          <span
                            key={`u1-bar-${idx}`}
                            className={`flex-1 h-[35px] sm:h-[38px] rounded-[4px] -skew-x-[15deg] ios-bar-wave transition-all duration-300 ${
                              filled ? '' : 'liquid-glass-slot'
                            }`}
                            style={{
                              '--bar-idx': idx,
                              backgroundColor: filled
                                ? u1Color
                                : hexToRgba(u1Color, unfilledAlpha),
                              boxShadow: filled
                                ? `0 4px 10px -2px ${hexToRgba(u1Color, 0.42)}, inset 0 1.5px 1px rgba(255,255,255,0.58)`
                                : undefined,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div
                      className="text-[20px] font-extrabold tracking-[-0.025em] text-[#141E28] mt-2.5 leading-none tabular-nums"
                      data-testid={`goal-${goal.id}-u1`}
                    >
                      <RollingNumber value={formatGoalValue(goal, u1Val)} />
                    </div>
                  </div>

                  {/* Center Crescent Icon */}
                  <div className="pb-6 flex items-center justify-center shrink-0">
                    <Moon className="w-4 h-4 text-[#8499AC] fill-[#8499AC]/35 mx-1 sm:mx-2 stroke-[2]" />
                  </div>

                  {/* Right: User 2 */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className="w-full max-w-[230px] flex items-center justify-center gap-[4.5px] sm:gap-[6px]">
                      {Array.from({ length: 8 }).map((_, idx) => {
                        const filled = idx < u2Bars;
                        const unfilledAlpha = idx === 7 ? 0.10 : 0.15;
                        return (
                          <span
                            key={`u2-bar-${idx}`}
                            className={`flex-1 h-[35px] sm:h-[38px] rounded-[4px] -skew-x-[15deg] ios-bar-wave transition-all duration-300 ${
                              filled ? '' : 'liquid-glass-slot'
                            }`}
                            style={{
                              '--bar-idx': idx + 2,
                              backgroundColor: filled
                                ? u2Color
                                : hexToRgba(u2Color, unfilledAlpha),
                              boxShadow: filled
                                ? `0 4px 10px -2px ${hexToRgba(u2Color, 0.42)}, inset 0 1.5px 1px rgba(255,255,255,0.58)`
                                : undefined,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div
                      className="text-[20px] font-extrabold tracking-[-0.025em] text-[#141E28] mt-2.5 leading-none tabular-nums"
                      data-testid={`goal-${goal.id}-u2`}
                    >
                      <RollingNumber value={formatGoalValue(goal, u2Val)} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Half-Width 2-Column Liquid Glass Cards
          const isDualRing = goal.visual === 'dual-ring';
          const isBubbles = goal.visual === 'bubbles';

          return (
            <div
              key={goal.id}
              onClick={() => {
                triggerIosHaptic('light');
                onSelectGoal && onSelectGoal(goal.id);
              }}
              data-testid={`goal-card-${goal.id}`}
              style={{ '--stagger': cardIdx }}
              className={`col-span-1 flex flex-col justify-between min-h-[166px] ios-stagger-card ${LIQUID_CARD_CLASS}`}
            >
              {/* Subtle Ambient Bottom Caustic Glow Inside Glass Card */}
              <div
                className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 h-20 rounded-full blur-2xl opacity-25"
                style={{
                  background: `linear-gradient(90deg, ${u1Color}, ${u2Color})`,
                }}
              />

              {/* Clean Card Header + 1-Tap Quick-Step Button */}
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <GoalHeaderIcon iconName={goal.icon} />
                  <span className="text-[13px] font-bold text-[#1B2724] truncate">
                    {cardTitle}
                  </span>
                </div>
                {!isYesterday && onQuickStep && (
                  <button
                    type="button"
                    aria-label={`Quick log ${cardTitle}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerIosHaptic('light');
                      onQuickStep(goal.id);
                    }}
                    className="icon-button w-5.5 h-5.5 rounded-full bg-white/75 border border-white/95 shadow-2xs flex items-center justify-center text-[#243630] shrink-0 active:scale-90 transition cursor-pointer"
                    title={`Quick log +${goal.step || 1} ${goal.unit || ''}`}
                  >
                    <Plus className="w-3 h-3 stroke-[2.6]" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Card Center Graphic */}
              <div
                dir="ltr"
                className="my-1 flex items-center justify-center h-[88px]"
              >
                {isDualRing && (
                  <DualRingGraphic
                    u1Ratio={Math.min(1, u1Val / (goal.target || 10000))}
                    u2Ratio={Math.min(1, u2Val / (goal.target || 10000))}
                    u1Color={u1Color}
                    u2Color={u2Color}
                  />
                )}

                {isBubbles && (
                  <BubblesGraphic
                    u1Val={u1Val}
                    u2Val={u2Val}
                    target={goal.target || 20}
                    u1Color={u1Color}
                    u2Color={u2Color}
                  />
                )}

                {goal.visual === 'droplets' && (
                  <DropletsGraphic
                    u1Val={u1Val}
                    u2Val={u2Val}
                    target={goal.target || 8}
                    u1Color={u1Color}
                    u2Color={u2Color}
                    u1Soft={u1Soft}
                    u2Soft={u2Soft}
                  />
                )}

                {goal.visual === 'horiz-bars' && (
                  <HorizBarsGraphic
                    u1Val={u1Val}
                    u2Val={u2Val}
                    target={goal.target || 10}
                    u1Color={u1Color}
                    u2Color={u2Color}
                    u1Soft={u1Soft}
                    u2Soft={u2Soft}
                  />
                )}

                {goal.visual === 'progress-line' && (
                  <ProgressLineGraphic
                    u1Val={u1Val}
                    u2Val={u2Val}
                    target={goal.target || 60}
                    u1Color={u1Color}
                    u2Color={u2Color}
                    u1Soft={u1Soft}
                    u2Soft={u2Soft}
                  />
                )}

                {goal.visual === 'pills' && (
                  <PillsGraphic
                    u1Val={u1Val}
                    u2Val={u2Val}
                    u1Color={u1Color}
                    u2Color={u2Color}
                    u1Soft={u1Soft}
                    u2Soft={u2Soft}
                  />
                )}
              </div>

              {/* Card Bottom Values */}
              <div
                dir="ltr"
                className="flex items-baseline justify-between px-0.5 tabular-nums"
              >
                <span
                  data-testid={`goal-${goal.id}-u1`}
                  className={
                    isDualRing
                      ? 'text-[15px] font-extrabold tracking-[-0.02em]'
                      : isBubbles && u1Val === 0
                        ? 'text-[14px] font-bold text-[#8E9F99]'
                        : u1Val === 0 && goal.id !== 'reading'
                          ? 'text-[14px] font-bold text-[#8E9F99]'
                          : 'text-[14.5px] font-extrabold tracking-[-0.02em]'
                  }
                  style={
                    u1Val === 0 && goal.id !== 'flashcards' && goal.id !== 'reading'
                      ? undefined
                      : { color: u1Color }
                  }
                >
                  <RollingNumber value={formatGoalValue(goal, u1Val)} />
                </span>

                <span
                  data-testid={`goal-${goal.id}-u2`}
                  className={
                    isDualRing
                      ? 'text-[15px] font-extrabold tracking-[-0.02em]'
                      : isBubbles
                        ? u2Val === 0
                          ? 'text-[14px] font-bold text-[#8E9F99]'
                          : 'text-[14px] font-extrabold tracking-[-0.01em]'
                        : u2Val === 0 && goal.id !== 'reading'
                          ? 'text-[14px] font-bold text-[#8E9F99]'
                          : 'text-[14.5px] font-extrabold tracking-[-0.02em]'
                  }
                  style={
                    u2Val === 0 && goal.id !== 'flashcards' && goal.id !== 'reading'
                      ? undefined
                      : { color: u2TextColor }
                  }
                >
                  <RollingNumber value={formatGoalValue(goal, u2Val)} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* "Beyond Today" Periodic Goals Section */}
      {periodicGoals.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between px-0.5 mb-2.5">
            <h3 className="text-[18px] font-bold tracking-[-0.025em] text-[#111B24]">
              {t.beyondToday}
            </h3>
            <span className="text-[11px] font-semibold text-[#6E827B]">
              {t.cumulativeMilestones}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
            {periodicGoals.map((goal, pIdx) => {
              const u1Val = getEffectiveVal(goal, 'user1');
              const u2Val = getEffectiveVal(goal, 'user2');
              const u1Pct = Math.min(100, Math.round((u1Val / (goal.target || 200)) * 100));
              const u2Pct = Math.min(100, Math.round((u2Val / (goal.target || 200)) * 100));

              return (
                <div
                  key={goal.id}
                  onClick={() => onSelectGoal && onSelectGoal(goal.id)}
                  data-testid={`goal-card-${goal.id}`}
                  style={{ '--stagger': dailyGoals.length + pIdx }}
                  className={`flex flex-col justify-between min-h-[146px] ios-stagger-card ${LIQUID_CARD_CLASS}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GoalHeaderIcon iconName={goal.icon} />
                    <span className="text-[13px] font-bold text-[#1B2724] truncate">
                      {getGoalTitle(goal, lang, false)}
                    </span>
                  </div>

                  {/* Dual Liquid Glass Pillar Comparison */}
                  <div
                    dir="ltr"
                    className="my-2 flex items-end justify-center gap-5 h-[52px] px-2"
                  >
                    <div className="flex flex-col items-center gap-1 w-9">
                      <div
                        className="w-full h-[44px] rounded-[10px] overflow-hidden flex items-end p-0.5 liquid-glass-slot"
                        style={{ backgroundColor: u1Soft }}
                      >
                        <div
                          className="w-full rounded-[8px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          style={{
                            height: `${Math.max(14, u1Pct)}%`,
                            backgroundColor: u1Color,
                            boxShadow: 'inset 0 1.5px 1px rgba(255,255,255,0.55)',
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 w-9">
                      <div
                        className="w-full h-[44px] rounded-[10px] overflow-hidden flex items-end p-0.5 liquid-glass-slot"
                        style={{ backgroundColor: u2Soft }}
                      >
                        <div
                          className="w-full rounded-[8px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          style={{
                            height: `${Math.max(14, u2Pct)}%`,
                            backgroundColor: u2Color,
                            boxShadow: 'inset 0 1.5px 1px rgba(255,255,255,0.55)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    dir="ltr"
                    className="flex items-baseline justify-between px-0.5 tabular-nums"
                  >
                    <span
                      className="text-[14.5px] font-extrabold tracking-[-0.02em]"
                      style={{ color: u1Color }}
                    >
                      <RollingNumber value={formatGoalValue(goal, u1Val)} />
                    </span>
                    <span
                      className="text-[14.5px] font-extrabold tracking-[-0.02em]"
                      style={{ color: u2TextColor }}
                    >
                      <RollingNumber value={formatGoalValue(goal, u2Val)} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Specialized Liquid Glass Sub-Graphics --- */

function DualRingGraphic({ u1Ratio, u2Ratio, u1Color, u2Color }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rInner = 28;
  const rOuter = 35.5;
  const cInner = 2 * Math.PI * rInner;
  const cOuter = 2 * Math.PI * rOuter;

  const u1Offset = mounted ? cOuter * (1 - Math.max(0.03, u1Ratio)) : cOuter;
  const u2Offset = mounted ? cInner * (1 - Math.max(0.03, u2Ratio)) : cInner;

  return (
    <svg
      width="92"
      height="92"
      viewBox="0 0 92 92"
      className="overflow-visible"
      style={{ filter: 'drop-shadow(0 5px 12px rgba(0, 168, 232, 0.25))' }}
    >
      {/* Inner Frosted Cyan Track */}
      <circle
        cx="46"
        cy="46"
        r={rInner}
        fill="none"
        stroke="rgba(0, 168, 232, 0.14)"
        strokeWidth="8.5"
      />
      {/* Inner Thick Cyan Ring (User 2: 74% -> 7,400) */}
      <circle
        cx="46"
        cy="46"
        r={rInner}
        fill="none"
        stroke={u2Color}
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeDasharray={cInner}
        strokeDashoffset={u2Offset}
        transform="rotate(-90 46 46)"
        className="transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      />
      {/* Hugging Outer Green Arc (User 1: 22% -> 2,200) */}
      <circle
        cx="46"
        cy="46"
        r={rOuter}
        fill="none"
        stroke={u1Color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={cOuter}
        strokeDashoffset={u1Offset}
        transform="rotate(-90 46 46)"
        className="transition-all duration-700 delay-75 ease-[cubic-bezier(0.22,1,0.36,1)]"
      />
    </svg>
  );
}

function BubblesGraphic({ u1Val, u2Val, target, u1Color, u2Color }) {
  const calcSize = (val) => {
    if (!val || val <= 0) return 11;
    if (val === 5 && target === 20) return 31;
    const ratio = Math.min(1, val / target);
    return Math.round(22 + ratio * 24);
  };

  const s1 = calcSize(u1Val);
  const s2 = calcSize(u2Val);

  return (
    <div className="w-full flex items-center justify-around px-2">
      <div className="w-12 h-12 flex items-center justify-center">
        <span
          className="rounded-full transition-all duration-500"
          style={{
            width: `${s1}px`,
            height: `${s1}px`,
            backgroundColor: u1Color,
            boxShadow: `0 4px 12px ${hexToRgba(u1Color, 0.38)}, inset 0 2px 2px rgba(255,255,255,0.62)`,
          }}
        />
      </div>
      <div className="w-12 h-12 flex items-center justify-center">
        <span
          className="rounded-full transition-all duration-500"
          style={{
            width: `${s2}px`,
            height: `${s2}px`,
            backgroundColor: u2Color,
            boxShadow: `0 5px 14px ${hexToRgba(u2Color, 0.42)}, inset 0 2.5px 3px rgba(255,255,255,0.65)`,
          }}
        />
      </div>
    </div>
  );
}

function DropletsGraphic({ u1Val, u2Val, target, u1Color, u2Color, u1Soft, u2Soft }) {
  const count = Math.min(8, target || 8);
  return (
    <div className="w-full flex items-center justify-between gap-3 px-1">
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: count }).map((_, i) => {
          const filled = i < u1Val;
          return (
            <span
              key={`d1-${i}`}
              className={`w-2.5 h-4 rounded-full transition-all duration-300 ${
                filled ? '' : 'liquid-glass-slot'
              }`}
              style={{
                backgroundColor: filled ? u1Color : u1Soft,
                boxShadow: filled
                  ? 'inset 0 1.5px 1px rgba(255,255,255,0.55)'
                  : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: count }).map((_, i) => {
          const filled = i < u2Val;
          return (
            <span
              key={`d2-${i}`}
              className={`w-2.5 h-4 rounded-full transition-all duration-300 ${
                filled ? '' : 'liquid-glass-slot'
              }`}
              style={{
                backgroundColor: filled ? u2Color : u2Soft,
                boxShadow: filled
                  ? 'inset 0 1.5px 1px rgba(255,255,255,0.55)'
                  : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function HorizBarsGraphic({ u1Val, u2Val, target, u1Color, u2Color, u1Soft, u2Soft }) {
  const bars = 5;
  const u1Filled = Math.min(bars, Math.round((u1Val / (target || 10)) * bars));
  const u2Filled = Math.min(bars, Math.round((u2Val / (target || 10)) * bars));

  return (
    <div className="w-full flex items-center justify-between gap-4 px-1.5">
      <div className="flex-1 flex flex-col-reverse gap-1.5">
        {Array.from({ length: bars }).map((_, i) => {
          const filled = i < u1Filled;
          return (
            <span
              key={`hb1-${i}`}
              className="w-full h-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: filled ? u1Color : u1Soft,
                boxShadow: filled
                  ? 'inset 0 1px 0.5px rgba(255,255,255,0.5)'
                  : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="flex-1 flex flex-col-reverse gap-1.5">
        {Array.from({ length: bars }).map((_, i) => {
          const filled = i < u2Filled;
          return (
            <span
              key={`hb2-${i}`}
              className="w-full h-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: filled ? u2Color : u2Soft,
                boxShadow: filled
                  ? 'inset 0 1px 0.5px rgba(255,255,255,0.5)'
                  : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function ProgressLineGraphic({ u1Val, u2Val, target, u1Color, u2Color, u1Soft, u2Soft }) {
  const p1 = Math.min(100, Math.round((u1Val / (target || 60)) * 100));
  const p2 = Math.min(100, Math.round((u2Val / (target || 60)) * 100));

  return (
    <div className="w-full flex items-center justify-between gap-3 px-1.5">
      <div
        className="flex-1 h-3 rounded-full overflow-hidden flex items-center p-0.5 liquid-glass-slot"
        style={{ backgroundColor: u1Soft }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(14, p1)}%`,
            backgroundColor: u1Color,
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.55)',
          }}
        />
      </div>
      <div
        className="flex-1 h-3 rounded-full overflow-hidden flex items-center p-0.5 liquid-glass-slot"
        style={{ backgroundColor: u2Soft }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(14, p2)}%`,
            backgroundColor: u2Color,
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.55)',
          }}
        />
      </div>
    </div>
  );
}

function PillsGraphic({ u1Val, u2Val, u1Color, u2Color, u1Soft, u2Soft }) {
  return (
    <div className="w-full flex items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-1.5">
        {[0, 1].map((idx) => {
          const done = idx < u1Val;
          return (
            <span
              key={`p1-${idx}`}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                done ? '' : 'liquid-glass-slot'
              }`}
              style={{
                backgroundColor: done ? u1Color : u1Soft,
                boxShadow: done
                  ? 'inset 0 1.5px 1px rgba(255,255,255,0.6)'
                  : undefined,
              }}
            >
              {done && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 1].map((idx) => {
          const done = idx < u2Val;
          return (
            <span
              key={`p2-${idx}`}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                done ? '' : 'liquid-glass-slot'
              }`}
              style={{
                backgroundColor: done ? u2Color : u2Soft,
                boxShadow: done
                  ? 'inset 0 1.5px 1px rgba(255,255,255,0.6)'
                  : undefined,
              }}
            >
              {done && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default StudyBentoGrid;
