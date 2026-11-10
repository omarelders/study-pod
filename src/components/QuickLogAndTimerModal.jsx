import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Check,
  CheckCircle2,
  Minus,
  Plus,
  Timer,
  Sparkles,
  Moon,
  Footprints,
  Feather,
  Droplet,
  BookOpen,
  Dumbbell,
  Pill,
  Award,
  Layers,
} from 'lucide-react';
import { formatGoalValue } from '../data/studyData.js';
import { RollingNumber } from './RollingNumber.jsx';
import { useIosSheetDrag, triggerIosHaptic } from './IosPwaInstallModal.jsx';

const GOAL_ICON_MAP = {
  moon: Moon,
  footprints: Footprints,
  feather: Feather,
  droplet: Droplet,
  book: BookOpen,
  dumbbell: Dumbbell,
  pill: Pill,
  piggy: Award,
  scale: Layers,
};

const TIMER_PRESETS = [
  { id: '25m', label: '25m Focus', seconds: 25 * 60, minutes: 25, subject: 'Deep Study' },
  { id: '50m', label: '50m Deep', seconds: 50 * 60, minutes: 50, subject: 'Deep Study' },
  { id: '15m', label: '15m Recall', seconds: 15 * 60, minutes: 15, subject: 'Quiz & Recall' },
];

function formatCountdown(totalSec = 1500) {
  const safe = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats goal value without returning an ambiguous "—" dash when 0 inside the logger
 */
function formatLoggerValue(goal, val) {
  if (!val || val <= 0) {
    if (goal.displayFormat === 'hours-mins' || goal.displayFormat === 'min') {
      return '0m';
    }
    if (goal.displayFormat === 'unit') {
      return `0 ${goal.unit || ''}`.trim();
    }
    if (goal.displayFormat === 'fraction') {
      return `0/${goal.target}`;
    }
    return '0';
  }
  return formatGoalValue(goal, val);
}

/**
 * Formats compact step badge (e.g. "+30m", "+500", "+5", "+1")
 */
function formatStepBadge(goal) {
  const step = Number(goal.step || 1);
  if (goal.displayFormat === 'hours-mins' || goal.displayFormat === 'min') {
    return `+${step}m`;
  }
  if (step >= 1000) {
    return `+${(step / 1000).toFixed(step % 1000 === 0 ? 0 : 1)}k`;
  }
  return `+${step}`;
}

export function QuickLogAndTimerModal({
  isOpen,
  onClose,
  initialGoalId,
  state,
  onUpdateGoalValue,
  onSwitchActiveLogger,
  onToggleTimer,
  onCompletePomodoro,
}) {
  const [selectedPresetId, setSelectedPresetId] = useState('25m');
  const [expandedGoalId, setExpandedGoalId] = useState(
    () => initialGoalId || 'study-hours'
  );
  const { dragHandlers, sheetStyle } = useIosSheetDrag(onClose);

  useEffect(() => {
    if (initialGoalId) {
      setExpandedGoalId(initialGoalId);
    }
  }, [initialGoalId]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeLogger = state?.activeLogger === 'user2' ? 'user2' : 'user1';
  const u1 = state?.user1 || {
    name: 'Omar',
    color: '#00B86B',
    timerRemainingSec: 1500,
    studyingNow: false,
  };
  const u2 = state?.user2 || {
    name: 'Partner',
    color: '#00A8E8',
    timerRemainingSec: 1500,
    studyingNow: false,
  };
  const activeUser = activeLogger === 'user2' ? u2 : u1;
  const activeColor =
    activeUser.color || (activeLogger === 'user2' ? '#00A8E8' : '#00B86B');

  const u1Label =
    u1.name && u1.name.toLowerCase() !== 'you' ? `${u1.name} (You)` : 'You';
  const u2Label =
    u2.name && u2.name.toLowerCase() !== 'partner'
      ? `${u2.name} (Partner)`
      : 'Partner';

  const selectedPreset =
    TIMER_PRESETS.find((p) => p.id === selectedPresetId) || TIMER_PRESETS[0];

  const isRunning = Boolean(activeUser.studyingNow);
  const displaySeconds = isRunning
    ? activeUser.timerRemainingSec ?? selectedPreset.seconds
    : selectedPreset.seconds;
  const timerProgress = Math.max(
    0,
    Math.min(
      1,
      1 -
        displaySeconds /
          Math.max(1, selectedPreset.seconds, displaySeconds)
    )
  );

  const enabledGoals = (state?.goals || []).filter((g) => g.enabled);
  const completedCount = enabledGoals.filter(
    (g) => Number(g[activeLogger] || 0) >= Number(g.target || 1)
  ).length;

  // If opened by tapping a specific goal card, place that goal at the top of the list
  const orderedGoals = initialGoalId
    ? [
        ...enabledGoals.filter((g) => g.id === initialGoalId),
        ...enabledGoals.filter((g) => g.id !== initialGoalId),
      ]
    : enabledGoals;

  const handleSelectPreset = (preset) => {
    triggerIosHaptic('light');
    setSelectedPresetId(preset.id);
    if (isRunning && onToggleTimer) {
      onToggleTimer(activeLogger, preset.seconds, preset.subject);
    }
  };

  const ringRadius = 21;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference * (1 - (isRunning ? Math.max(0.08, timerProgress) : 1));

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/28 backdrop-blur-sm animate-backdrop">
      {/* Backdrop click to close */}
      <div
        className="flex-1"
        onClick={() => {
          triggerIosHaptic('light');
          onClose?.();
        }}
      />

      {/* Native iOS 26 Solarium Liquid Glass Bottom Sheet */}
      <div
        style={sheetStyle}
        className="w-full max-w-[540px] mx-auto rounded-t-[36px] sm:rounded-[36px] sm:mb-5 liquid-glass-sheet ios-sheet-enter max-h-[88dvh] flex flex-col overflow-hidden relative"
      >
        {/* Ambient Chromatic Caustics Behind Sheet Header */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-10 w-48 h-36 rounded-full blur-2xl opacity-25"
          style={{ backgroundColor: u1.color || '#00B86B' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-10 w-48 h-36 rounded-full blur-2xl opacity-25"
          style={{ backgroundColor: u2.color || '#00A8E8' }}
        />

        {/* Authentic iOS Sheet Grabber & Translucent Header (Swipe Down to Dismiss) */}
        <div
          {...dragHandlers}
          className="pt-2.5 pb-3 px-5 shrink-0 touch-none cursor-grab active:cursor-grabbing relative z-10"
        >
          <div className="w-9 h-[5px] rounded-full bg-black/18 mx-auto mb-2.5" />

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[20px] font-extrabold text-[#141E28] tracking-[-0.03em] leading-tight">
                  Study Log &amp; Focus Timer
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold tracking-[-0.01em] font-sf-rounded"
                  style={{
                    backgroundColor: `${activeColor}1A`,
                    color: activeColor,
                  }}
                >
                  {completedCount}/{enabledGoals.length} done
                </span>
              </div>
              <p className="text-[12px] font-medium text-[#60756D] tracking-[-0.01em] mt-0.5">
                Tap <span className="font-bold text-[#141E28]">+</span> for instant step or tap any habit to scrub
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerIosHaptic('light');
                onClose?.();
              }}
              aria-label="Close Quick Log Modal"
              className="icon-button w-8 h-8 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-[#354841] flex items-center justify-center transition ios-press cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </button>
          </div>

          {/* Native iOS 26 UISegmentedControl: Active Logger Switcher */}
          <div className="mt-3 relative grid grid-cols-2 bg-black/[0.055] p-1 rounded-full overflow-hidden border border-white/60 shadow-[inset_0_1px_2px_rgba(12,38,30,0.06)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/2)] rounded-full bg-white/95 shadow-[0_3px_10px_rgba(10,38,30,0.10),inset_0_1px_0.5px_#FFFFFF]"
              style={{
                transform: `translate3d(${activeLogger === 'user2' ? 100 : 0}%, 0, 0)`,
                transition: 'transform 380ms cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            />

            <button
              type="button"
              onClick={() => {
                triggerIosHaptic('light');
                onSwitchActiveLogger?.('user1');
              }}
              className={`relative z-10 py-1.5 px-3 text-[12.5px] font-bold tracking-[-0.01em] flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer rounded-full ${
                activeLogger === 'user1'
                  ? 'text-[#141E28]'
                  : 'text-[#5A6E66] hover:text-[#141E28]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-transform duration-300"
                style={{
                  backgroundColor: u1.color || '#00B86B',
                  boxShadow:
                    activeLogger === 'user1'
                      ? `0 0 8px ${u1.color || '#00B86B'}`
                      : undefined,
                  transform: activeLogger === 'user1' ? 'scale(1.15)' : 'scale(1)',
                }}
              />
              <span className="truncate">{u1Label}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerIosHaptic('light');
                onSwitchActiveLogger?.('user2');
              }}
              className={`relative z-10 py-1.5 px-3 text-[12.5px] font-bold tracking-[-0.01em] flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer rounded-full ${
                activeLogger === 'user2'
                  ? 'text-[#141E28]'
                  : 'text-[#5A6E66] hover:text-[#141E28]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-transform duration-300"
                style={{
                  backgroundColor: u2.color || '#00A8E8',
                  boxShadow:
                    activeLogger === 'user2'
                      ? `0 0 8px ${u2.color || '#00A8E8'}`
                      : undefined,
                  transform: activeLogger === 'user2' ? 'scale(1.15)' : 'scale(1)',
                }}
              />
              <span className="truncate">{u2Label}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 pt-1 pb-4 space-y-3.5 no-scrollbar ios-safe-sheet relative z-10">
          {/* Sculpted Light Liquid Glass Focus Timer Pod (Cohesive iOS 26 Solarium Card) */}
          <div className="liquid-glass-card rounded-[26px] p-3.5">
            {/* Subtle Ambient Glow Inside Timer Card */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 w-36 h-36 rounded-full blur-2xl opacity-20"
              style={{ backgroundColor: activeColor }}
            />

            {/* Top Row: Ring + Countdown Readout + Play/Pause & +25m Credit */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                {/* Circular SVG Focus Ring */}
                <div className="relative w-[50px] h-[50px] flex items-center justify-center shrink-0">
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 50 50"
                    className="-rotate-90 overflow-visible"
                    aria-hidden="true"
                  >
                    <circle
                      cx="25"
                      cy="25"
                      r={ringRadius}
                      fill="none"
                      stroke={`${activeColor}24`}
                      strokeWidth="4.5"
                    />
                    <circle
                      cx="25"
                      cy="25"
                      r={ringRadius}
                      fill="none"
                      stroke={activeColor}
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${activeColor}18`,
                      color: activeColor,
                    }}
                  >
                    <Timer className="w-4 h-4 stroke-[2.3]" aria-hidden="true" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold tracking-[0.11em] uppercase text-[#5E726A]">
                      FOCUS TIMER
                    </span>
                    {isRunning && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#00B86B]/15 text-[#008A50] text-[9.5px] font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00B86B] animate-ping" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[28px] font-extrabold tracking-[-0.035em] leading-none text-[#141E28] font-sf-rounded tabular-nums mt-0.5">
                    <RollingNumber value={formatCountdown(displaySeconds)} />
                  </div>
                  <div className="text-[11px] font-semibold text-[#687C74] truncate mt-0.5">
                    {activeUser.name} · {selectedPreset.subject}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Start/Pause + Quick +25m Log */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerIosHaptic('heavy');
                    onCompletePomodoro?.(selectedPreset.minutes || 25, activeLogger);
                  }}
                  title="Complete & Log +25m to Deep Study"
                  className="liquid-glass-pill px-2.5 py-2 rounded-full text-[11.5px] font-extrabold text-[#008A50] flex items-center gap-1 ios-press cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.4]" aria-hidden="true" />
                  <span>+{selectedPreset.minutes || 25}m</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerIosHaptic('heavy');
                    onToggleTimer?.(
                      activeLogger,
                      selectedPreset.seconds,
                      selectedPreset.subject
                    );
                  }}
                  style={{
                    backgroundColor: isRunning ? '#F59E0B' : activeColor,
                    boxShadow: `0 8px 20px -4px ${
                      isRunning ? 'rgba(245,158,11,0.45)' : `${activeColor}66`
                    }, inset 0 1.5px 1px rgba(255,255,255,0.65)`,
                  }}
                  className="px-4 py-2 rounded-full font-extrabold text-[13px] text-white flex items-center gap-1.5 ios-press transition cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>Start</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compact Segmented Preset Duration Chips */}
            <div className="mt-3 relative grid grid-cols-3 bg-black/[0.045] p-1 rounded-full overflow-hidden border border-white/60">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-white/95 shadow-[0_2px_8px_rgba(10,38,30,0.08),inset_0_1px_0.5px_#FFFFFF]"
                style={{
                  transform: `translate3d(${
                    Math.max(
                      0,
                      TIMER_PRESETS.findIndex((p) => p.id === selectedPresetId)
                    ) * 100
                  }%, 0, 0)`,
                  transition: 'transform 360ms cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              />
              {TIMER_PRESETS.map((preset) => {
                const active = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative z-10 py-1 px-2 rounded-full text-[11px] font-bold tracking-[-0.01em] transition-colors duration-200 cursor-pointer ${
                      active
                        ? 'text-[#141E28]'
                        : 'text-[#60756D] hover:text-[#141E28]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sculpted Liquid Glass Habit Quick-Logger List */}
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10.5px] font-extrabold tracking-[0.12em] text-[#60756D] uppercase">
                DAILY HABITS · {activeUser.name.toUpperCase()}
              </span>
              <span className="text-[10.5px] font-semibold text-[#6E827A]">
                Tap row to fine-tune
              </span>
            </div>

            <div className="space-y-2 pb-2">
              {orderedGoals.map((goal, idx) => {
                const IconComp = GOAL_ICON_MAP[goal.icon] || Sparkles;
                const currentVal = Number(goal[activeLogger] || 0);
                const targetVal = Number(goal.target || 1);
                const stepVal = Number(goal.step || 1);
                const isExpanded = expandedGoalId === goal.id;
                const pct = Math.min(
                  100,
                  Math.round((currentVal / targetVal) * 100)
                );
                const isCompleted = currentVal >= targetVal;
                const sliderMax = Math.max(1, targetVal, currentVal);
                const sliderPct = Math.min(
                  100,
                  Math.round((currentVal / sliderMax) * 100)
                );
                const stepBadge = formatStepBadge(goal);

                return (
                  <div
                    key={goal.id}
                    style={{ '--stagger': idx }}
                    onClick={() => {
                      if (!isExpanded) {
                        triggerIosHaptic('light');
                        setExpandedGoalId(goal.id);
                      }
                    }}
                    className={`relative overflow-hidden rounded-[22px] p-3 border transition-all duration-300 ios-stagger-card cursor-pointer ${
                      isExpanded
                        ? 'bg-white/92 border-white shadow-[0_10px_28px_-6px_rgba(10,38,30,0.09),inset_0_1.5px_1px_#FFFFFF]'
                        : 'bg-white/74 hover:bg-white/86 border-white/85 shadow-[0_3px_12px_rgba(12,38,30,0.035)]'
                    }`}
                  >
                    {/* Subtle Integrated Bottom Progress Fill Bar */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] bg-black/[0.04]"
                    >
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: activeColor,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2.5">
                      {/* Left: Squircle Icon + Title + Zero-Aware Value / Target */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 transition-transform duration-300"
                          style={{
                            backgroundColor: isCompleted
                              ? activeColor
                              : `${activeColor}18`,
                            color: isCompleted ? '#FFFFFF' : activeColor,
                            boxShadow: isCompleted
                              ? `0 4px 10px ${activeColor}4D`
                              : undefined,
                          }}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4 stroke-[2.8]" aria-hidden="true" />
                          ) : (
                            <IconComp className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[14px] font-extrabold text-[#141E28] tracking-[-0.02em] truncate">
                              {goal.title}
                            </span>
                            <span
                              className="text-[11px] font-extrabold font-sf-rounded tabular-nums shrink-0"
                              style={{ color: activeColor }}
                            >
                              {pct}%
                            </span>
                          </div>

                          <div className="text-[12px] font-semibold text-[#5E726A] tabular-nums flex items-center gap-1 mt-0.5">
                            <span className="font-extrabold text-[#141E28] font-sf-rounded">
                              <RollingNumber
                                value={formatLoggerValue(goal, currentVal)}
                              />
                            </span>
                            <span className="text-[#889A93]">
                              / {formatGoalValue(goal, targetVal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Tactile iOS 26 Stepper Controls (- | Max | +Step) */}
                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Decrement (-) Button */}
                        <button
                          type="button"
                          aria-label={`Decrease ${goal.title}`}
                          onClick={() => {
                            triggerIosHaptic('light');
                            onUpdateGoalValue?.(
                              goal.id,
                              Math.max(0, currentVal - stepVal),
                              activeLogger
                            );
                          }}
                          className="icon-button w-8 h-8 rounded-full bg-black/[0.055] hover:bg-black/[0.09] text-[#141E28] flex items-center justify-center active:scale-90 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.6]" aria-hidden="true" />
                        </button>

                        {/* 1-Tap Hit Target Pill */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerIosHaptic('heavy');
                            onUpdateGoalValue?.(goal.id, targetVal, activeLogger);
                          }}
                          className={`px-2.5 h-8 rounded-full text-[11px] font-extrabold transition ios-press cursor-pointer flex items-center justify-center ${
                            isCompleted
                              ? 'bg-[#00B86B]/16 text-[#008A50]'
                              : 'bg-black/[0.045] hover:bg-black/[0.08] text-[#495E56]'
                          }`}
                        >
                          {isCompleted ? 'Done' : 'Hit Target'}
                        </button>

                        {/* Increment (+Step) Orb Pill */}
                        <button
                          type="button"
                          aria-label={`Increase ${goal.title}`}
                          onClick={() => {
                            triggerIosHaptic('light');
                            onUpdateGoalValue?.(
                              goal.id,
                              currentVal + stepVal,
                              activeLogger
                            );
                          }}
                          style={{
                            backgroundColor: activeColor,
                            boxShadow: `0 4px 12px -2px ${activeColor}55, inset 0 1px 0.5px rgba(255,255,255,0.6)`,
                          }}
                          className="h-8 px-2.5 rounded-full text-white text-[11.5px] font-extrabold font-sf-rounded flex items-center justify-center gap-0.5 active:scale-92 transition cursor-pointer"
                        >
                          <span>{stepBadge}</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Precision Scrubber (Shown only on active/focused habit row) */}
                    {isExpanded && (
                      <div
                        className="mt-2.5 pt-2.5 border-t border-black/[0.05] flex items-center gap-3 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="range"
                          min={0}
                          max={sliderMax}
                          step={stepVal}
                          value={currentVal}
                          aria-label={`${goal.title} progress slider`}
                          onChange={(e) =>
                            onUpdateGoalValue?.(
                              goal.id,
                              Number(e.target.value),
                              activeLogger
                            )
                          }
                          style={{
                            accentColor: activeColor,
                            background: `linear-gradient(90deg, ${activeColor} 0%, ${activeColor} ${sliderPct}%, #DCEAE3 ${sliderPct}%, #DCEAE3 100%)`,
                          }}
                          className="flex-1 rounded-lg cursor-pointer ios-slider"
                        />
                        <span className="text-[10.5px] font-bold text-[#6E827A] tabular-nums shrink-0">
                          ±{stepVal} {goal.unit}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickLogAndTimerModal;
