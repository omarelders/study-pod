import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Plus,
  ChevronRight,
  ChevronLeft,
  Bell,
  Users,
  Palette,
  RotateCcw,
  LogOut,
  Sliders,
  RefreshCw,
  QrCode,
  Smartphone,
  Globe,
} from 'lucide-react';
import { RING_COLORS } from '../data/studyData.js';
import {
  getTexts,
  getGoalTitle,
  getGoalSubtitle,
} from '../data/i18n.js';
import {
  useIosSheetDrag,
  isRunningStandalone,
  triggerIosHaptic,
} from './IosPwaInstallModal.jsx';

const VISUAL_TYPES = [
  { id: 'slanted-bars', label: 'Slanted Bars (Hours)' },
  { id: 'dual-ring', label: 'Dual Concentric Ring' },
  { id: 'bubbles', label: 'Floating Bubbles' },
  { id: 'horiz-bars', label: 'Horizontal Bars' },
  { id: 'progress-line', label: 'Progress Line' },
];

const RELATIONSHIP_OPTIONS = [
  {
    id: 'My Study Partner',
    label: 'My Study Partner',
    desc: 'Daily Pomodoro, flashcards & exam accountability',
    emoji: '📚',
  },
  {
    id: 'Classmate / Friend',
    label: 'Classmate / Friend',
    desc: 'Sharing lectures, problem sets & syllabus targets',
    emoji: '🎓',
  },
  {
    id: 'Accountability Group Buddy',
    label: 'Accountability Group Buddy',
    desc: 'Focused co-working & daily study streaks',
    emoji: '⚡',
  },
  {
    id: 'Not Sure Yet — Solo Mode',
    label: 'Not Sure Yet — Solo Mode',
    desc: 'Track solo first and invite a partner anytime',
    emoji: '🌱',
  },
];

const IOS_GROUP_CARD =
  'liquid-glass-card rounded-[22px] ios-inset-list overflow-hidden';

/**
 * 1. PodPairingModal (Replicates 00:43 - 00:48 in the YouTube Short)
 */
export function PodPairingModal({
  isOpen,
  onClose,
  state,
  onCreateNewPod,
  onJoinPod,
  onAcceptInvite,
}) {
  const [view, setView] = useState('code'); // 'code' | 'enter' | 'invite'
  const [copied, setCopied] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const { dragHandlers, sheetStyle } = useIosSheetDrag(onClose);

  useEffect(() => {
    if (isOpen) {
      setView('code');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const lang = state?.lang === 'ar' ? 'ar' : 'en';
  const t = getTexts(lang);
  const rtlSign = lang === 'ar' ? -1 : 1;

  const podCode = state?.podCode || 'ZAU8PP';
  const u1Name = state?.user1?.name || 'Ced';
  const u2Name = state?.user2?.name || 'Joe';
  const u1Color = state?.user1?.color || '#00B86B';
  const u2Color = state?.user2?.color || '#00A8E8';

  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(podCode);
      }
    } catch {
      // ignore clipboard permission errors in headless browser
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    try {
      if (
        typeof navigator?.share === 'function' &&
        window.matchMedia?.('(pointer: coarse)')?.matches
      ) {
        await navigator.share({
          title: 'Join my StudyPod',
          text: `Join my StudyPod accountability ring with code ${podCode}`,
          url: window.location.origin,
        });
      }
    } catch {
      // user canceled native share sheet
    }
  };

  const handleJoinSubmit = async (e) => {
    e?.preventDefault?.();
    const code = (inviteCodeInput || podCode).trim().toUpperCase();
    await onJoinPod?.(code);
    setView('invite');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/28 backdrop-blur-sm animate-backdrop">
      <div
        className="flex-1"
        onClick={() => {
          triggerIosHaptic('light');
          onClose?.();
        }}
      />

      <div
        style={sheetStyle}
        className="w-full max-w-[540px] mx-auto rounded-t-[32px] sm:rounded-[32px] sm:mb-6 bg-[#F4F7F5]/95 backdrop-blur-2xl shadow-[0_-12px_48px_rgba(0,0,0,0.15)] border border-white/80 p-4 sm:p-5 ios-safe-sheet relative ios-sheet-enter"
      >
        {/* Authentic iOS Sheet Grabber Pill (Swipe Down to Dismiss) */}
        <div
          {...dragHandlers}
          className="pt-1 pb-2.5 -mt-1 touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="w-9 h-[5px] rounded-full bg-black/18 mx-auto" />
        </div>

        {/* Sub-view Switcher Pills with Physical Sliding Indicator (RTL-aware start-1) */}
        <div className="relative grid grid-cols-3 bg-[#E3EBE7] p-1 rounded-full max-w-[330px] mx-auto mb-3.5 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1 bottom-1 start-1 w-[calc((100%-8px)/3)] rounded-full bg-[#009E5C] shadow-[0_2px_8px_rgba(0,158,92,0.3)]"
            style={{
              transform: `translate3d(${rtlSign * (view === 'code' ? 0 : view === 'enter' ? 1 : 2) * 100}%, 0, 0)`,
              transition: 'transform 380ms cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          />
          <button
            type="button"
            onClick={() => setView('code')}
            className={`relative z-10 py-1 rounded-full text-[11px] font-bold tracking-[-0.01em] transition-colors duration-200 cursor-pointer ${
              view === 'code' ? 'text-white' : 'text-[#5B7068]'
            }`}
          >
            {t.yourPodCodeTab}
          </button>
          <button
            type="button"
            onClick={() => setView('enter')}
            className={`relative z-10 py-1 rounded-full text-[11px] font-bold tracking-[-0.01em] transition-colors duration-200 cursor-pointer ${
              view === 'enter' ? 'text-white' : 'text-[#5B7068]'
            }`}
          >
            {t.enterCodeTab}
          </button>
          <button
            type="button"
            onClick={() => setView('invite')}
            className={`relative z-10 py-1 rounded-full text-[11px] font-bold tracking-[-0.01em] transition-colors duration-200 cursor-pointer ${
              view === 'invite' ? 'text-white' : 'text-[#5B7068]'
            }`}
          >
            {t.inviteSheetTab}
          </button>
        </div>

        {/* Clean Centered iOS Modal Card (00:43 - 00:48) */}
        <div
          key={view}
          className="rounded-[28px] bg-[#F7F9F8] p-6 shadow-2xl border border-white/90 relative animate-fadeIn"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Pairing Modal"
            className="absolute top-4 end-4 w-8 h-8 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-[#334740] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* VIEW 1: Your Pod Code (00:43) */}
          {view === 'code' && (
            <div className="text-center pt-1">
              <h3 className="text-[22px] font-extrabold text-[#16202A] tracking-[-0.03em]">
                {t.yourPodCodeTab}
              </h3>
              <p className="text-[13px] font-medium text-[#697D75] mt-1 tracking-[-0.01em]">
                {t.shareThisCodeDesc}
              </p>

              {/* Tracked Bold Code Box */}
              <div className="my-5 bg-white rounded-[22px] py-5 px-4 border border-black/[0.06] shadow-[0_2px_12px_rgba(15,28,24,0.04)]">
                <div
                  dir="ltr"
                  className="text-[36px] font-black tracking-[0.22em] text-[#16202A] font-mono select-all pl-2 tabular-nums"
                >
                  {podCode}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2.5">
                  <span className="text-[11.5px] font-bold text-[#009E5C]">
                    {state?.paired
                      ? t.pairedWith(u2Name)
                      : t.waitingForPartner}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCreateNewPod?.()}
                    className="text-[11.5px] font-bold text-[#6E827A] hover:text-[#16202A] inline-flex items-center gap-1 underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t.newCode}
                  </button>
                </div>
              </div>

              {/* Full-Width #009E5C Share Code Pill Button */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full py-3.5 px-5 rounded-full bg-[#009E5C] hover:bg-[#008A50] text-white font-extrabold text-[15px] tracking-[-0.01em] shadow-[0_8px_20px_rgba(0,158,92,0.28)] flex items-center justify-center gap-2 active:scale-[0.99] transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.8]" />
                    <span>{t.copiedCode(podCode)}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.4]" />
                    <span>{t.shareCode}</span>
                  </>
                )}
              </button>

              {/* Done & Enter Invite Code Links Below */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[14px] font-bold text-[#4A5D55] hover:text-[#16202A] transition cursor-pointer"
                >
                  {t.done}
                </button>
                <button
                  type="button"
                  onClick={() => setView('enter')}
                  className="text-[12.5px] font-bold text-[#009E5C] hover:underline cursor-pointer"
                >
                  {t.havePartnerCodeLink}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: Enter Invite Code (00:45) */}
          {view === 'enter' && (
            <form onSubmit={handleJoinSubmit} className="text-center pt-1">
              <h3 className="text-[22px] font-extrabold text-[#16202A] tracking-[-0.03em]">
                {t.enterInviteCodeTitle}
              </h3>
              <p className="text-[13px] font-medium text-[#697D75] mt-1">
                {t.enterInviteCodeDesc}
              </p>

              <div className="my-5">
                <input
                  dir="ltr"
                  type="text"
                  maxLength={6}
                  value={inviteCodeInput}
                  onChange={(e) =>
                    setInviteCodeInput(e.target.value.toUpperCase())
                  }
                  placeholder={podCode}
                  aria-label="6-character invite code"
                  className="w-full bg-white rounded-[20px] py-4 px-4 text-center text-[28px] font-black tracking-[0.25em] text-[#16202A] border-2 border-[#009E5C] focus:outline-none font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setView('code')}
                  className="py-3 rounded-full bg-[#E3EBE7] hover:bg-[#D5E2DC] text-[#354841] font-extrabold text-[14px] transition cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-3 rounded-full bg-[#009E5C] hover:bg-[#008A50] text-white font-extrabold text-[14px] shadow-[0_6px_18px_rgba(0,158,92,0.28)] transition cursor-pointer"
                >
                  {t.join}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: Invite Confirmation Sheet (00:48) */}
          {view === 'invite' && (
            <div className="text-center pt-1">
              {/* Overlapping Partner Avatars */}
              <div
                dir="ltr"
                className="flex items-center justify-center -space-x-3 mb-3.5"
              >
                <div
                  className="w-14 h-14 rounded-full border-4 border-[#F7F9F8] flex items-center justify-center text-white text-[20px] font-extrabold shadow-sm"
                  style={{ backgroundColor: u1Color }}
                >
                  {u1Name.charAt(0).toUpperCase()}
                </div>
                <div
                  className="w-14 h-14 rounded-full border-4 border-[#F7F9F8] flex items-center justify-center text-white text-[20px] font-extrabold shadow-sm"
                  style={{ backgroundColor: u2Color }}
                >
                  {u2Name.charAt(0).toUpperCase()}
                </div>
              </div>

              <h3 className="text-[23px] font-extrabold text-[#16202A] tracking-[-0.03em]">
                {t.invitedYou(u2Name)}
              </h3>
              <p className="text-[13px] font-medium text-[#5E726A] mt-1 max-w-[260px] mx-auto">
                {t.joinPodAndTrackDesc}
              </p>

              {/* Green Speckled Accept Invite Pill Button */}
              <button
                type="button"
                onClick={() => {
                  onAcceptInvite?.();
                  onClose?.();
                }}
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(135deg, #00C472 0%, #009E5C 100%)',
                  backgroundSize: '10px 10px, 100% 100%',
                }}
                className="mt-5 w-full py-3.5 px-5 rounded-full text-white font-extrabold text-[15px] shadow-[0_10px_24px_rgba(0,158,92,0.32)] active:scale-[0.99] transition cursor-pointer"
              >
                {t.acceptInvite}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-2.5 w-full py-2.5 rounded-full text-[13.5px] font-bold text-[#6E827A] hover:text-[#16202A] transition cursor-pointer"
              >
                {t.notNow}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Cute smiling green avatar for Step 3 ("I'll keep check-ins gentle", 00:53)
 */
function GentleCheckinBuddyAvatar() {
  return (
    <div className="relative w-28 h-28 mx-auto my-4 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[#00B86B]/20 animate-pulse" />
      <svg width="96" height="96" viewBox="0 0 96 96" className="relative z-10">
        <defs>
          <radialGradient id="buddyGrad" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#34E89E" />
            <stop offset="100%" stopColor="#00A862" />
          </radialGradient>
        </defs>
        <circle cx="48" cy="48" r="44" fill="url(#buddyGrad)" />
        {/* Eyes */}
        <circle cx="34" cy="42" r="4.2" fill="#10231C" />
        <circle cx="62" cy="42" r="4.2" fill="#10231C" />
        <circle cx="32.5" cy="40.5" r="1.4" fill="#FFFFFF" />
        <circle cx="60.5" cy="40.5" r="1.4" fill="#FFFFFF" />
        {/* Rosy Cheeks */}
        <ellipse cx="26" cy="50" rx="5.5" ry="3.2" fill="#FF8FA3" opacity="0.55" />
        <ellipse cx="70" cy="50" rx="5.5" ry="3.2" fill="#FF8FA3" opacity="0.55" />
        {/* Gentle Smile */}
        <path
          d="M 36 53 Q 48 63 60 53"
          fill="none"
          stroke="#10231C"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * 2. SettingsAndOnboardingView (Replicates 00:50 - 00:56 in the YouTube Short)
 */
export function SettingsAndOnboardingView({
  state,
  mode = 'settings',
  backendStatus,
  onRefreshBackendStatus,
  onUpdateState,
  onToggleLanguage,
  onResetDemo,
  onResetCleanZero,
  onStartFreshOnboarding,
  onOpenPairing,
  onOpenPwaInstall,
  onCloseOnboarding,
}) {
  const [wizardOpen, setWizardOpen] = useState(mode === 'onboarding');
  const [verifyingCloud, setVerifyingCloud] = useState(false);
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customUnit, setCustomUnit] = useState('min');
  const [customTarget, setCustomTarget] = useState(45);
  const [customVisual, setCustomVisual] = useState('slanted-bars');

  const lang = state?.lang === 'ar' ? 'ar' : 'en';
  const t = getTexts(lang);
  const rtlSign = lang === 'ar' ? -1 : 1;

  useEffect(() => {
    if (mode === 'onboarding') {
      setWizardOpen(true);
      setStep(1);
    }
  }, [mode]);

  const u1 = state?.user1 || { name: 'Ced', color: '#00B86B' };
  const u2 = state?.user2 || { name: 'Joe', color: '#00A8E8' };
  const goals = state?.goals || [];
  const gentleReminders = state?.gentleReminders ?? true;

  const updatePatch = (patch) => {
    onUpdateState?.({
      ...state,
      ...patch,
    });
  };

  const handleToggleGoalEnabled = (goalId) => {
    const nextGoals = goals.map((g) =>
      g.id === goalId ? { ...g, enabled: !g.enabled } : g
    );
    updatePatch({ goals: nextGoals });
  };

  const handleCreateCustomGoal = (e) => {
    e?.preventDefault?.();
    const cleanTitle = customTitle.trim() || 'Custom Study Block';
    const numericTarget = Math.max(1, Number(customTarget) || 30);
    const newGoal = {
      id: `custom-${Date.now()}`,
      title: cleanTitle,
      subtitle: `Daily · Custom (${numericTarget} ${customUnit})`,
      icon: 'moon',
      visual: customVisual,
      fullWidth: customVisual === 'slanted-bars',
      category: 'daily',
      unit: customUnit || 'min',
      displayFormat: customUnit === 'min' ? 'min' : 'unit',
      target: numericTarget,
      step: Math.max(1, Math.round(numericTarget / 5)),
      user1: 0,
      user2: 0,
      enabled: true,
    };
    updatePatch({ goals: [...goals, newGoal] });
    setCustomTitle('');
    setShowCustomForm(false);
  };

  const handleFinishOnboarding = () => {
    updatePatch({ gentleReminders: true });
    setWizardOpen(false);
    onCloseOnboarding?.();
  };

  // ============================================================================
  // ONBOARDING & GOAL BUILDER WIZARD (00:50 - 00:53)
  // ============================================================================
  if (wizardOpen || mode === 'onboarding') {
    const dailyGoals = goals.filter((g) => g.category === 'daily');
    const periodicGoals = goals.filter((g) => g.category === 'periodic');

    return (
      <div className="px-4 pt-3 pb-28 max-w-[540px] mx-auto animate-fadeIn">
        {/* Top Wizard Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                setWizardOpen(false);
                onCloseOnboarding?.();
              }
            }}
            className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-xl border border-white/90 shadow-2xs flex items-center justify-center text-[#16202A] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.4]" />
          </button>

          {/* Clickable Step Pills */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(s)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  step === s ? 'w-7 bg-[#009E5C]' : 'w-2.5 bg-[#C8DDD0]'
                }`}
                aria-label={`Step ${s}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleFinishOnboarding}
            className="text-[13px] font-bold text-[#009E5C] hover:underline cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* STEP 1 (00:50): Who's going to be in your pod? */}
        {step === 1 && (
          <div>
            <div className="text-[10.5px] font-extrabold tracking-[0.14em] text-[#009E5C] uppercase mb-1">
              STEP 1 OF 3 · YOUR STUDY POD
            </div>
            <h1 className="text-[25px] font-extrabold text-[#16202A] tracking-[-0.03em] leading-tight mb-1.5">
              Who&apos;s going to be in your pod?
            </h1>
            <p className="text-[13px] font-medium text-[#6B7E77] mb-4">
              Choose your accountability setup to tailor your daily study rings.
            </p>

            <div className="space-y-2.5 mb-5">
              {RELATIONSHIP_OPTIONS.map((opt) => {
                const selected = state?.relationship === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      const isSolo = opt.id.includes('Solo');
                      updatePatch({
                        relationship: opt.id,
                        paired: isSolo ? false : state?.paired ?? true,
                      });
                    }}
                    className={`w-full text-left p-4 rounded-[22px] border backdrop-blur-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'bg-white border-2 border-[#009E5C] shadow-xs'
                        : 'bg-white/80 border-white/90 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[22px]">{opt.emoji}</span>
                      <div>
                        <div className="text-[14.5px] font-extrabold text-[#16202A] tracking-[-0.02em]">
                          {opt.label}
                        </div>
                        <div className="text-[12px] font-medium text-[#6E827A]">
                          {opt.desc}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected
                          ? 'border-[#009E5C] bg-[#009E5C] text-white'
                          : 'border-[#C5D8CD]'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-full bg-[#009E5C] hover:bg-[#008A50] text-white font-extrabold text-[15px] shadow-[0_8px_20px_rgba(0,158,92,0.28)] transition cursor-pointer"
            >
              Continue to Study Goals
            </button>
          </div>
        )}

        {/* STEP 2 (00:51 - 00:52): Pick the goals you want + Custom Goal Builder */}
        {step === 2 && (
          <div>
            <div className="text-[10.5px] font-extrabold tracking-[0.14em] text-[#009E5C] uppercase mb-1">
              STEP 2 OF 3 · GOAL BUILDER
            </div>
            <h1 className="text-[25px] font-extrabold text-[#16202A] tracking-[-0.03em] leading-tight mb-1">
              Pick the goals you want.
            </h1>
            <p className="text-[13px] font-medium text-[#6B7E77] mb-4">
              Select the study habits that count toward your shared pod ring.
            </p>

            {/* DAILY · COUNTS TOWARD STREAK */}
            <div className="mb-4">
              <div className="text-[10.5px] font-extrabold tracking-[0.14em] text-[#5F736B] uppercase mb-2 px-1">
                DAILY · COUNTS TOWARD STREAK
              </div>
              <div className="space-y-2">
                {dailyGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleToggleGoalEnabled(goal.id)}
                    className={`w-full text-start px-4 py-3 rounded-[20px] border backdrop-blur-xl flex items-center justify-between gap-2 transition cursor-pointer ${
                      goal.enabled
                        ? 'bg-white/95 border-[#009E5C] shadow-2xs'
                        : 'bg-white/55 border-white/80 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="text-[14px] font-bold text-[#16202A] tracking-[-0.02em]">
                        {getGoalTitle(goal, lang, false)}
                      </div>
                      <div className="text-[11.5px] font-medium text-[#6E827A]">
                        {getGoalSubtitle(goal, lang)}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        goal.enabled
                          ? 'bg-[#009E5C] text-white'
                          : 'border-2 border-[#C5D8CD]'
                      }`}
                    >
                      {goal.enabled && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PERIODIC TRACKED · DOESN'T COUNT TOWARD STREAK */}
            <div className="mb-4">
              <div className="text-[10.5px] font-extrabold tracking-[0.14em] text-[#5F736B] uppercase mb-2 px-1">
                PERIODIC TRACKED · DOESN&apos;T COUNT TOWARD STREAK
              </div>
              <div className="space-y-2">
                {periodicGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleToggleGoalEnabled(goal.id)}
                    className={`w-full text-start px-4 py-3 rounded-[20px] border backdrop-blur-xl flex items-center justify-between gap-2 transition cursor-pointer ${
                      goal.enabled
                        ? 'bg-white/95 border-[#009E5C] shadow-2xs'
                        : 'bg-white/55 border-white/80 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="text-[14px] font-bold text-[#16202A] tracking-[-0.02em]">
                        {getGoalTitle(goal, lang, false)}
                      </div>
                      <div className="text-[11.5px] font-medium text-[#6E827A]">
                        {getGoalSubtitle(goal, lang)}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        goal.enabled
                          ? 'bg-[#009E5C] text-white'
                          : 'border-2 border-[#C5D8CD]'
                      }`}
                    >
                      {goal.enabled && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* + Create Custom Study Goal (00:52) */}
            {!showCustomForm ? (
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="w-full py-3 px-4 rounded-[20px] border-2 border-dashed border-[#009E5C]/45 bg-[#EBF7F0]/80 hover:bg-[#DFF2E7] text-[#008C52] font-extrabold text-[13.5px] flex items-center justify-center gap-1.5 mb-4 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.6]" />
                <span>+ Create Custom Study Goal</span>
              </button>
            ) : (
              <form
                onSubmit={handleCreateCustomGoal}
                className="bg-white/95 backdrop-blur-xl rounded-[22px] p-4 border-2 border-[#009E5C] shadow-sm mb-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-extrabold text-[#009E5C] uppercase tracking-wider">
                    New Custom Study Goal
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="text-[11.5px] font-bold text-[#7A8B85]"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5A6E66] mb-1">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. LeetCode Problems or Research Paper"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5E5DC] text-[13px] font-bold text-[#16202A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5A6E66] mb-1">
                      Daily Target
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={customTarget}
                      onChange={(e) => setCustomTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D5E5DC] text-[13px] font-bold text-[#16202A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5A6E66] mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder="min, pgs, cards"
                      className="w-full px-3 py-2 rounded-xl border border-[#D5E5DC] text-[13px] font-bold text-[#16202A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5A6E66] mb-1">
                    Card Visual Style
                  </label>
                  <select
                    value={customVisual}
                    onChange={(e) => setCustomVisual(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5E5DC] text-[12.5px] font-bold text-[#16202A] bg-white"
                  >
                    {VISUAL_TYPES.map((vt) => (
                      <option key={vt.id} value={vt.id}>
                        {vt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#009E5C] text-white font-extrabold text-[13px] cursor-pointer"
                >
                  Save Custom Goal
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full py-3.5 rounded-full bg-[#009E5C] hover:bg-[#008A50] text-white font-extrabold text-[15px] shadow-[0_8px_20px_rgba(0,158,92,0.28)] transition cursor-pointer"
            >
              Next: Check-In Preferences
            </button>
          </div>
        )}

        {/* STEP 3 (00:53): I'll keep check-ins gentle */}
        {step === 3 && (
          <div className="text-center pt-2">
            <div className="text-[10.5px] font-extrabold tracking-[0.14em] text-[#009E5C] uppercase mb-1">
              STEP 3 OF 3 · GENTLE ACCOUNTABILITY
            </div>

            <GentleCheckinBuddyAvatar />

            <h1 className="text-[26px] font-extrabold text-[#16202A] tracking-[-0.03em] leading-tight">
              I&apos;ll keep check-ins gentle
            </h1>
            <p className="text-[13.5px] font-medium text-[#60746C] mt-2 max-w-[290px] mx-auto leading-relaxed">
              No guilt trips or noisy spam—just warm nudges when {u2.name}{' '}
              starts a focus block or completes a study goal.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full py-3.5 rounded-full bg-[#009E5C] hover:bg-[#008A50] text-white font-extrabold text-[15px] shadow-[0_8px_22px_rgba(0,158,92,0.3)] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>Allow Notifications</span>
              </button>

              <button
                type="button"
                onClick={handleFinishOnboarding}
                className="w-full py-3 rounded-full bg-white/80 backdrop-blur-xl hover:bg-white text-[#354841] font-extrabold text-[13.5px] border border-white/90 transition cursor-pointer"
              >
                Finish Setup
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // GENUINE iOS 18 INSET GROUPED SETTINGS SCREEN (UITableViewStyleInsetGrouped)
  // ============================================================================
  return (
    <div className="px-4 pt-2 pb-28 max-w-[540px] mx-auto animate-fadeIn space-y-5">
      {/* iOS Large Title Header */}
      <div className="px-1">
        <h1 className="text-[28px] font-extrabold text-[#16202A] tracking-[-0.03em] leading-tight">
          {t.youAndPodSettings}
        </h1>
        <p className="text-[13px] font-medium text-[#6E827A] mt-0.5">
          {t.settingsSubtitle}
        </p>
      </div>

      {/* Top Apple ID-Style Profile & Partner Card */}
      <div
        style={{ '--stagger': 0 }}
        className={`${IOS_GROUP_CARD} p-4 ios-stagger-card`}
      >
        <div className="flex items-center gap-3.5 pb-3.5">
          <div dir="ltr" className="flex items-center -space-x-2.5 shrink-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[22px] font-extrabold shadow-xs ring-2 ring-white"
              style={{ backgroundColor: u1.color || '#00B86B' }}
            >
              {(u1.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[16px] font-extrabold shadow-xs ring-2 ring-white"
              style={{ backgroundColor: u2.color || '#00A8E8' }}
            >
              {(u2.name || 'J').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[17px] font-extrabold text-[#16202A] tracking-[-0.03em] truncate">
              {u1.name} &amp; {u2.name}
            </div>
            <div className="text-[12.5px] font-medium text-[#6E827A] truncate">
              {state?.relationship || 'My Study Partner'} · Pod{' '}
              <span dir="ltr" className="font-mono font-bold text-[#009E5C]">
                {state?.podCode || 'ZAU8PP'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-3.5">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.12em] text-[#7A8B85] uppercase mb-1">
              {t.yourName}
            </label>
            <input
              type="text"
              value={u1.name}
              onChange={(e) =>
                updatePatch({
                  user1: { ...u1, name: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 rounded-[12px] bg-[#F2F7F4] border border-black/[0.06] text-[13.5px] font-bold text-[#16202A] tracking-[-0.01em]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-[0.12em] text-[#7A8B85] uppercase mb-1">
              {t.partnerName}
            </label>
            <input
              type="text"
              value={u2.name}
              onChange={(e) =>
                updatePatch({
                  user2: { ...u2, name: e.target.value },
                })
              }
              className="w-full px-3 py-1.5 rounded-[12px] bg-[#F2F7F4] border border-black/[0.06] text-[13.5px] font-bold text-[#16202A] tracking-[-0.01em]"
            />
          </div>
        </div>
      </div>

      {/* LANGUAGE SECTION (English | العربية) */}
      <div style={{ '--stagger': 1 }} className="ios-stagger-card">
        <div className="text-[11px] font-bold tracking-[0.12em] text-[#6E827A] uppercase mb-1.5 px-3">
          {t.languageSection}
        </div>
        <div className={IOS_GROUP_CARD}>
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Globe className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
              </div>
              <span className="text-[14.5px] font-semibold text-[#16202A] tracking-[-0.02em]">
                {t.appLanguage}
              </span>
            </div>

            {/* iOS 26 Segmented Language Switcher (English / العربية) */}
            <div
              data-testid="settings-lang-segmented"
              className="relative grid grid-cols-2 bg-black/[0.055] p-1 rounded-full overflow-hidden border border-white/60 min-w-[164px]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1 bottom-1 start-1 w-[calc((100%-8px)/2)] rounded-full bg-white/95 shadow-[0_2px_8px_rgba(10,38,30,0.10),inset_0_1px_0.5px_#FFFFFF]"
                style={{
                  transform: `translate3d(${rtlSign * (lang === 'ar' ? 100 : 0)}%, 0, 0)`,
                  transition: 'transform 360ms cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  triggerIosHaptic('light');
                  if (onToggleLanguage) {
                    onToggleLanguage('en');
                  } else {
                    updatePatch({ lang: 'en' });
                  }
                }}
                className={`relative z-10 py-1 px-3 rounded-full text-[12px] font-bold transition-colors duration-200 cursor-pointer ${
                  lang === 'en' ? 'text-[#141E28]' : 'text-[#5A6E66]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerIosHaptic('light');
                  if (onToggleLanguage) {
                    onToggleLanguage('ar');
                  } else {
                    updatePatch({ lang: 'ar' });
                  }
                }}
                className={`relative z-10 py-1 px-3 rounded-full text-[12px] font-bold transition-colors duration-200 cursor-pointer ${
                  lang === 'ar' ? 'text-[#141E28]' : 'text-[#5A6E66]'
                }`}
              >
                العربية
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POD SECTION (00:54 - 00:55) */}
      <div style={{ '--stagger': 2 }} className="ios-stagger-card">
        <div className="text-[11px] font-bold tracking-[0.12em] text-[#6E827A] uppercase mb-1.5 px-3">
          {t.podPairingAndSync}
        </div>
        <div className={IOS_GROUP_CARD}>
          {/* Row 1: Pairing Status */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#00B86B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-4 h-4 stroke-[2.3]" />
              </div>
              <span className="text-[14.5px] font-semibold text-[#16202A] tracking-[-0.02em]">
                {state?.paired
                  ? t.pairedWith(u2.name)
                  : t.soloModeUnpaired}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                dir="ltr"
                className="text-[12.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#E9F7F0] text-[#009E5C]"
              >
                {state?.podCode || 'ZAU8PP'}
              </span>
            </div>
          </div>

          {/* Row 2: Cloud Database & Sync Status */}
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  backendStatus?.tableReady
                    ? 'bg-[#00C853] shadow-[0_0_8px_#00C853]'
                    : 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]'
                }`}
              />
              <div className="truncate">
                <div className="text-[13.5px] font-bold text-[#16202A] tracking-[-0.01em] truncate">
                  {backendStatus?.backend === 'supabase' && backendStatus?.tableReady
                    ? 'Supabase Cloud Connected'
                    : backendStatus?.backend === 'local-sqlite'
                      ? 'Local SQLite Connected'
                      : 'Vercel Cloud (Needs Supabase Keys)'}
                </div>
                <div className="text-[11px] font-medium text-[#6E827A] truncate">
                  {backendStatus?.message || 'Real-time pod sync active'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                setVerifyingCloud(true);
                await onRefreshBackendStatus?.();
                setTimeout(() => setVerifyingCloud(false), 400);
              }}
              className="px-2.5 py-1 rounded-full bg-[#E9F7F0] hover:bg-[#D5F0E3] text-[#009E5C] text-[11px] font-bold shrink-0 transition ios-press cursor-pointer"
            >
              {verifyingCloud ? t.syncing : t.verifySync}
            </button>
          </div>

          {/* Row 3: View Pod Details */}
          <button
            type="button"
            onClick={() => onOpenPairing?.()}
            className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-black/[0.02] active:bg-black/[0.04] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#0EA5E9] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <QrCode className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
              </div>
              <span className="text-[14.5px] font-semibold text-[#16202A] tracking-[-0.02em]">
                {t.viewPodDetails}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#8A9B94]">
              <span className="text-[13px] font-medium">{t.shareCode}</span>
              <span className="text-[17px] leading-none font-semibold">
                {lang === 'ar' ? '‹' : '›'}
              </span>
            </div>
          </button>

          {/* Row 4: Install iPhone Home Screen App (PWA) */}
          <button
            type="button"
            onClick={() => onOpenPwaInstall?.()}
            className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-black/[0.02] active:bg-black/[0.04] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Smartphone className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[14.5px] font-semibold text-[#16202A] tracking-[-0.02em]">
                  {t.iphoneHomeScreenApp}
                </div>
                <div className="text-[11px] font-medium text-[#6E827A]">
                  {isRunningStandalone()
                    ? t.runningStandaloneDesc
                    : t.installStandaloneDesc}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#007AFF] shrink-0">
              <span className="text-[12.5px] font-bold">
                {isRunningStandalone() ? t.installed : t.install}
              </span>
              <span className="text-[17px] leading-none font-semibold">
                {lang === 'ar' ? '‹' : '›'}
              </span>
            </div>
          </button>

          {/* Row 5: Leave or Re-pair Pod */}
          {state?.paired ? (
            <button
              type="button"
              onClick={() => updatePatch({ paired: false })}
              className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-rose-50/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-[7px] bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <LogOut className="w-4 h-4 stroke-[2.3]" />
                </div>
                <span className="text-[14.5px] font-semibold text-[#E11D48] tracking-[-0.02em]">
                  {t.leavePod}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#E11D48]/80">
                <span className="text-[12.5px] font-medium">{t.unpairRing}</span>
                <span className="text-[17px] leading-none font-semibold">
                  {lang === 'ar' ? '‹' : '›'}
                </span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => updatePatch({ paired: true })}
              className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-[#EBF7F0] transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-[7px] bg-[#00B86B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <RefreshCw className="w-4 h-4 stroke-[2.3]" />
                </div>
                <span className="text-[14.5px] font-semibold text-[#009E5C] tracking-[-0.02em]">
                  {t.repairWith(u2.name)}
                </span>
              </div>
              <span className="text-[17px] leading-none font-semibold text-[#009E5C]">
                {lang === 'ar' ? '‹' : '›'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* GOALS & NOTIFICATIONS SECTION */}
      <div style={{ '--stagger': 3 }} className="ios-stagger-card">
        <div className="text-[11px] font-bold tracking-[0.12em] text-[#6E827A] uppercase mb-1.5 px-3">
          {t.goalsAndCheckins}
        </div>
        <div className={IOS_GROUP_CARD}>
          {/* Edit Study Goals Row */}
          <button
            type="button"
            onClick={() => {
              setStep(2);
              setWizardOpen(true);
            }}
            className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-black/[0.02] active:bg-black/[0.04] transition cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-[7px] bg-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sliders className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="truncate">
                <div className="text-[14.5px] font-semibold text-[#16202A] tracking-[-0.02em] truncate">
                  {t.editStudyGoals}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#8A9B94] shrink-0">
              <span className="text-[13px] font-medium tabular-nums">
                {t.activeCount(goals.filter((g) => g.enabled).length)}
              </span>
              <span className="text-[17px] leading-none font-semibold">
                {lang === 'ar' ? '‹' : '›'}
              </span>
            </div>
          </button>

          {/* Gentle Reminders Row with Native HTML <input type="checkbox" switch> + iOS UISwitch Fallback */}
          <label
            htmlFor="gentle-reminders-switch"
            className="px-4 py-3 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-[0_2px_5px_rgba(245,158,11,0.28),inset_0_1px_0.5px_rgba(255,255,255,0.45)]">
                <Bell className="w-4 h-4 stroke-[2.3]" aria-hidden="true" />
              </div>
              <div>
                <div className="text-[14.5px] font-semibold text-[#16202A] tracking-[-0.02em]">
                  {t.gentleReminders}
                </div>
                <div className="text-[11.5px] font-medium text-[#7A8B85]">
                  {t.warmNudgesWhen(u2.name)}
                </div>
              </div>
            </div>

            {typeof HTMLInputElement !== 'undefined' &&
            'switch' in HTMLInputElement.prototype ? (
              <input
                id="gentle-reminders-switch"
                type="checkbox"
                {...{ switch: '' }}
                checked={gentleReminders}
                onChange={(e) =>
                  updatePatch({ gentleReminders: e.target.checked })
                }
                aria-label="Toggle Gentle Reminders"
              />
            ) : (
              <span
                dir="ltr"
                className={`relative w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 flex items-center ios-press ${
                  gentleReminders ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
                }`}
              >
                <input
                  id="gentle-reminders-switch"
                  type="checkbox"
                  role="switch"
                  {...{ switch: '' }}
                  checked={gentleReminders}
                  onChange={(e) => {
                    triggerIosHaptic('light');
                    updatePatch({ gentleReminders: e.target.checked });
                  }}
                  aria-label="Toggle Gentle Reminders"
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`w-[27px] h-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    gentleReminders ? 'translate-x-[20px]' : 'translate-x-0'
                  }`}
                />
              </span>
            )}
          </label>
        </div>
      </div>

      {/* APPEARANCE SECTION (Ring Color Picker) */}
      <div style={{ '--stagger': 4 }} className="ios-stagger-card">
        <div className="text-[11px] font-bold tracking-[0.12em] text-[#6E827A] uppercase mb-1.5 px-3">
          {t.appearanceRingColor}
        </div>
        <div className={IOS_GROUP_CARD}>
          {/* User 1 Ring Color */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Palette className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[14px] font-semibold text-[#16202A] tracking-[-0.02em]">
                {t.usersRing(u1.name)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {RING_COLORS.map((c) => {
                const active = u1.color === c.hex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={`${u1.name} color ${c.name}`}
                    onClick={() =>
                      updatePatch({
                        user1: { ...u1, color: c.hex },
                      })
                    }
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full transition cursor-pointer ${
                      active
                        ? 'ring-2 ring-offset-2 ring-[#16202A] scale-110'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* User 2 Ring Color */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#0EA5E9] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-[14px] font-semibold text-[#16202A] tracking-[-0.02em]">
                {t.usersRing(u2.name)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {RING_COLORS.map((c) => {
                const active = u2.color === c.hex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-label={`${u2.name} color ${c.name}`}
                    onClick={() =>
                      updatePatch({
                        user2: { ...u2, color: c.hex },
                      })
                    }
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full transition cursor-pointer ${
                      active
                        ? 'ring-2 ring-offset-2 ring-[#16202A] scale-110'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DEMO & RESET SECTION */}
      <div style={{ '--stagger': 5 }} className="ios-stagger-card">
        <div className="text-[11px] font-bold tracking-[0.12em] text-[#6E827A] uppercase mb-1.5 px-3">
          {t.dataAndReset}
        </div>
        <div className={IOS_GROUP_CARD}>
          <button
            type="button"
            onClick={() => onResetCleanZero?.()}
            className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-black/[0.02] active:bg-black/[0.04] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#009E5C] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <RotateCcw className="w-4 h-4 stroke-[2.3]" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#008C52] tracking-[-0.02em]">
                  {t.resetZeroTitle}
                </div>
                <div className="text-[11px] font-medium text-[#7A8B85]">
                  {t.resetZeroDesc}
                </div>
              </div>
            </div>
            <span className="text-[17px] leading-none font-semibold text-[#8A9B94]">
              {lang === 'ar' ? '‹' : '›'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onResetDemo?.()}
            className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-black/[0.02] active:bg-black/[0.04] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#0EA5E9] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <RotateCcw className="w-4 h-4 stroke-[2.3]" />
              </div>
              <span className="text-[14px] font-semibold text-[#16202A] tracking-[-0.02em]">
                {t.loadDemoTitle}
              </span>
            </div>
            <span className="text-[17px] leading-none font-semibold text-[#8A9B94]">
              {lang === 'ar' ? '‹' : '›'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setWizardOpen(true);
              onStartFreshOnboarding?.();
            }}
            className="w-full px-4 py-3 text-start flex items-center justify-between hover:bg-black/[0.02] active:bg-black/[0.04] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4 stroke-[2.3]" />
              </div>
              <span className="text-[14px] font-semibold text-[#16202A] tracking-[-0.02em]">
                {t.startFreshTitle}
              </span>
            </div>
            <span className="text-[17px] leading-none font-semibold text-[#8A9B94]">
              {lang === 'ar' ? '‹' : '›'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsAndOnboardingView;
