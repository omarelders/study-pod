import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
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
import { useIosSheetDrag } from './IosPwaInstallModal.jsx';

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
  { id: '50m', label: '50m Deep Study', seconds: 50 * 60, minutes: 50, subject: 'Deep Study' },
  { id: '15m', label: '15m Recall', seconds: 15 * 60, minutes: 15, subject: 'Quiz & Recall' },
];

function formatCountdown(totalSec = 1500) {
  const safe = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
  const { dragHandlers, sheetStyle } = useIosSheetDrag(onClose);

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
  const u1 = state?.user1 || { name: 'Ced', color: '#00B86B', timerRemainingSec: 1500, studyingNow: false };
  const u2 = state?.user2 || { name: 'Joe', color: '#00A8E8', timerRemainingSec: 1500, studyingNow: false };
  const activeUser = activeLogger === 'user2' ? u2 : u1;
  const activeColor = activeUser.color || (activeLogger === 'user2' ? '#00A8E8' : '#00B86B');

  const selectedPreset =
    TIMER_PRESETS.find((p) => p.id === selectedPresetId) || TIMER_PRESETS[0];

  const isRunning = Boolean(activeUser.studyingNow);
  const displaySeconds = isRunning
    ? activeUser.timerRemainingSec ?? selectedPreset.seconds
    : selectedPreset.seconds;

  const enabledGoals = (state?.goals || []).filter((g) => g.enabled);

  // If opened by tapping a specific goal card, place that goal at the top of the list
  const orderedGoals = initialGoalId
    ? [
        ...enabledGoals.filter((g) => g.id === initialGoalId),
        ...enabledGoals.filter((g) => g.id !== initialGoalId),
      ]
    : enabledGoals;

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    if (isRunning && onToggleTimer) {
      // Restart with new preset duration
      onToggleTimer(activeLogger, preset.seconds, preset.subject);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/25 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Native iOS 26 Centered Liquid Glass Bottom Sheet */}
      <div
        style={sheetStyle}
        className="w-full max-w-[540px] mx-auto rounded-t-[32px] sm:rounded-[32px] sm:mb-6 liquid-glass-sheet ios-sheet-enter max-h-[88dvh] flex flex-col overflow-hidden"
      >
        {/* Authentic iOS Sheet Grabber & Header (Swipe Down to Dismiss) */}
        <div
          {...dragHandlers}
          className="pt-2.5 pb-3 px-5 bg-white/75 backdrop-blur-xl border-b border-black/[0.06] shrink-0 touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="w-9 h-[5px] rounded-full bg-black/18 mx-auto mb-3" />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[19px] font-extrabold text-[#16202A] tracking-[-0.03em] leading-tight">
                Study Log &amp; Focus Timer
              </h2>
              <p className="text-[12px] font-medium text-[#6E827A] tracking-[-0.01em] mt-0.5">
                Instant real-time sync with your study partner
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Quick Log Modal"
              className="icon-button w-8 h-8 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-[#354841] flex items-center justify-center transition ios-press cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </button>
          </div>

          {/* Native iOS 26 UISegmentedControl with Physical Sliding Pill: User 1 (You) vs User 2 (Partner) */}
          <div className="mt-3.5 relative grid grid-cols-2 bg-[#E3EBE7] p-1 rounded-[12px] overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/2)] rounded-[9px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.09),inset_0_1px_0.5px_rgba(255,255,255,0.95)]"
              style={{
                transform: `translate3d(${activeLogger === 'user2' ? 100 : 0}%, 0, 0)`,
                transition: 'transform 380ms cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            />

            <button
              type="button"
              onClick={() => onSwitchActiveLogger?.('user1')}
              className={`relative z-10 py-1.5 px-3 text-[13px] font-semibold tracking-[-0.01em] flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer rounded-[9px] ${
                activeLogger === 'user1'
                  ? 'text-[#16202A]'
                  : 'text-[#5A6E66] hover:text-[#16202A]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-transform duration-300"
                style={{
                  backgroundColor: u1.color || '#00B86B',
                  transform: activeLogger === 'user1' ? 'scale(1.15)' : 'scale(1)',
                }}
              />
              <span>{u1.name} (You)</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchActiveLogger?.('user2')}
              className={`relative z-10 py-1.5 px-3 text-[13px] font-semibold tracking-[-0.01em] flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer rounded-[9px] ${
                activeLogger === 'user2'
                  ? 'text-[#16202A]'
                  : 'text-[#5A6E66] hover:text-[#16202A]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full transition-transform duration-300"
                style={{
                  backgroundColor: u2.color || '#00A8E8',
                  transform: activeLogger === 'user2' ? 'scale(1.15)' : 'scale(1)',
                }}
              />
              <span>{u2.name} (Partner)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar ios-safe-sheet">
          {/* Native iOS Live Activity / Apple Fitness Focus Timer Widget */}
          <div className="bg-gradient-to-br from-[#0E1C18] via-[#132620] to-[#19322A] text-white rounded-[26px] p-4.5 shadow-[0_10px_30px_rgba(14,28,24,0.18)] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[0.13em] uppercase text-[#5EEAD4]">
                <Timer className="w-3.5 h-3.5 text-[#34D399]" />
                <span>LIVE POMODORO FOCUS TIMER</span>
              </div>
              {isRunning ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#34C759]/20 border border-[#34C759]/30 text-[#4ADE80] text-[10.5px] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-ping" />
                  Studying Now
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-semibold">
                  Live Activity Ready
                </span>
              )}
            </div>

            {/* Smooth iOS Preset Duration Pills with Sliding Indicator */}
            <div className="relative grid grid-cols-3 mb-3.5 bg-black/25 p-1 rounded-[14px] overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-[10px] bg-[#00B86B] shadow-[0_2px_10px_rgba(0,184,107,0.4),inset_0_1px_0.5px_rgba(255,255,255,0.4)]"
                style={{
                  transform: `translate3d(${Math.max(0, TIMER_PRESETS.findIndex((p) => p.id === selectedPresetId)) * 100}%, 0, 0)`,
                  transition: 'transform 380ms cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              />
              {TIMER_PRESETS.map((preset) => {
                const active = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative z-10 py-1.5 px-2 rounded-[10px] text-[11.5px] font-bold tracking-[-0.01em] transition-colors duration-200 cursor-pointer ${
                      active
                        ? 'text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Countdown Readout + Start / Pause Action */}
            <div className="flex items-center justify-between gap-3 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-[20px] px-4 py-3.5 mb-3">
              <div>
                <div className="text-[36px] font-extrabold tracking-[-0.03em] leading-none tabular-nums">
                  <RollingNumber value={formatCountdown(displaySeconds)} />
                </div>
                <div className="text-[11.5px] text-white/70 font-medium mt-1 tracking-[-0.01em]">
                  {activeUser.name} · {selectedPreset.subject}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onToggleTimer?.(
                    activeLogger,
                    selectedPreset.seconds,
                    selectedPreset.subject
                  )
                }
                style={{
                  backgroundColor: isRunning ? '#F59E0B' : activeColor,
                }}
                className="px-4.5 py-2.5 rounded-full font-bold text-[13.5px] text-white flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.25)] ios-press transition cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Complete & Credit Button */}
            <button
              type="button"
              onClick={() => onCompletePomodoro?.(25, activeLogger)}
              className="w-full py-2.5 px-3 rounded-[14px] bg-white/10 hover:bg-white/15 text-[#A7F3D0] text-[12.5px] font-bold tracking-[-0.01em] flex items-center justify-center gap-1.5 transition ios-press cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete &amp; Log +25m to Deep Study</span>
            </button>
          </div>

          {/* Habit Quick-Logger List */}
          <div>
            <div className="text-[11px] font-bold tracking-[0.12em] text-[#6B7F77] uppercase mb-2 px-1">
              HABIT QUICK-LOGGER ({activeUser.name.toUpperCase()})
            </div>

            <div className="space-y-2.5 pb-4">
              {orderedGoals.map((goal, idx) => {
                const IconComp = GOAL_ICON_MAP[goal.icon] || Sparkles;
                const currentVal = Number(goal[activeLogger] || 0);
                const targetVal = Number(goal.target || 1);
                const stepVal = Number(goal.step || 1);
                const isHighlighted = initialGoalId === goal.id;
                const pct = Math.min(
                  100,
                  Math.round((currentVal / targetVal) * 100)
                );

                return (
                  <div
                    key={goal.id}
                    style={{ '--stagger': idx }}
                    className={`bg-white/85 backdrop-blur-xl rounded-[22px] p-3.5 border transition shadow-[0_2px_12px_rgba(15,28,24,0.03)] ios-stagger-card ${
                      isHighlighted
                        ? 'border-[#00B86B] ring-2 ring-[#00B86B]/20'
                        : 'border-white/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${activeColor}1F`,
                            color: activeColor,
                          }}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-[14.5px] font-bold text-[#16202A] tracking-[-0.02em] truncate">
                            {goal.title}
                          </div>
                          <div className="text-[11.5px] font-medium text-[#7A8B85] tabular-nums">
                            Target: {formatGoalValue(goal, targetVal)} · {pct}%
                          </div>
                        </div>
                      </div>

                      {/* 1-Tap Hit Target Button */}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateGoalValue?.(goal.id, targetVal, activeLogger)
                        }
                        className="px-2.5 py-1 rounded-full bg-[#E9F7F0] hover:bg-[#D5F0E3] text-[#009E5C] text-[11px] font-bold shrink-0 transition ios-press cursor-pointer"
                      >
                        Hit Target
                      </button>
                    </div>

                    {/* Native iOS Steppers (- / +) and Smooth Slider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[12.5px] font-bold text-[#16202A] px-0.5 tabular-nums">
                          <span>
                            <RollingNumber value={formatGoalValue(goal, currentVal)} />
                          </span>
                          <span className="text-[11px] font-medium text-[#84968F]">
                            ±{stepVal} {goal.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(targetVal, currentVal)}
                          step={stepVal}
                          value={currentVal}
                          onChange={(e) =>
                            onUpdateGoalValue?.(
                              goal.id,
                              Number(e.target.value),
                              activeLogger
                            )
                          }
                          style={{ accentColor: activeColor }}
                          className="w-full rounded-lg cursor-pointer ios-slider"
                        />
                      </div>

                      {/* Authentic iOS Dual Stepper Pill (- | +) */}
                      <div className="inline-flex items-center bg-[#E3EBE7]/90 rounded-[10px] p-0.5 shrink-0">
                        <button
                          type="button"
                          aria-label={`Decrease ${goal.title}`}
                          onClick={() =>
                            onUpdateGoalValue?.(
                              goal.id,
                              Math.max(0, currentVal - stepVal),
                              activeLogger
                            )
                          }
                          className="w-9 h-8 rounded-l-[8px] hover:bg-white/70 text-[#16202A] flex items-center justify-center active:scale-95 transition cursor-pointer"
                        >
                          <Minus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <div className="w-[1px] h-4 bg-black/10" />
                        <button
                          type="button"
                          aria-label={`Increase ${goal.title}`}
                          onClick={() =>
                            onUpdateGoalValue?.(
                              goal.id,
                              currentVal + stepVal,
                              activeLogger
                            )
                          }
                          style={{ backgroundColor: activeColor }}
                          className="w-9 h-8 rounded-[8px] text-white flex items-center justify-center shadow-2xs active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
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
