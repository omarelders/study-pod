import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users,
  BarChart2,
  User,
  ClipboardCheck,
  Flame,
  Menu,
  Download,
} from 'lucide-react';
import {
  createDefaultState,
  createRealInitialState,
  createBlankOnboardingState,
  computePodMetrics,
  getCurrentWeekdayIndexMondayFirst,
} from './data/studyData.js';
import {
  syncPodStateToCloud,
  fetchPodStateFromCloud,
  checkBackendHealth,
} from './data/supabaseSync.js';
import HeroGauge from './components/HeroGauge.jsx';
import StudyBentoGrid from './components/StudyBentoGrid.jsx';
import InsightsView from './components/InsightsView.jsx';
import QuickLogAndTimerModal from './components/QuickLogAndTimerModal.jsx';
import RollingNumber from './components/RollingNumber.jsx';
import {
  PodPairingModal,
  SettingsAndOnboardingView,
} from './components/PodPairingAndSettings.jsx';
import {
  IosPwaInstallModal,
  isRunningStandalone,
} from './components/IosPwaInstallModal.jsx';

const STORAGE_KEY = 'studypod_state_v2';
const PWA_PROMPT_DISMISSED_KEY = 'studypod_pwa_prompt_dismissed_v1';

function enrichStateWithLiveProgress(nextState) {
  const m = computePodMetrics(nextState);
  if (m.isDefaultDemo) return { ...nextState, updatedAt: Date.now() };

  const todayIdx = getCurrentWeekdayIndexMondayFirst();
  const weekly = Array.isArray(nextState.weeklyHistory)
    ? structuredClone(nextState.weeklyHistory)
    : [];
  if (weekly[todayIdx]) {
    weekly[todayIdx].u1 = m.user1Percent >= 20;
    weekly[todayIdx].u2 = m.user2Percent >= 20;
  }

  const anySyncToday = m.inSyncCount > 0 || m.combinedPercent >= 20;
  const nextStreak =
    anySyncToday && (nextState.streak || 0) === 0
      ? 1
      : nextState.streak || 0;
  const nextBest = Math.max(nextState.bestStreak || 0, nextStreak);

  return {
    ...nextState,
    isDemoSnapshot: false,
    podHealth: m.podHealth,
    streak: nextStreak,
    bestStreak: nextBest,
    weeklyHistory: weekly,
    updatedAt: Date.now(),
  };
}

export default function App() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.goals)) return parsed;
      }
    } catch {}
    return createRealInitialState('ZAU8PP');
  });

  const [activeTab, setActiveTab] = useState('together'); // 'together' | 'insights' | 'you' | 'onboarding'
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => isRunningStandalone());
  const [isPwaInstallOpen, setIsPwaInstallOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (isRunningStandalone()) return false;
    try {
      return sessionStorage.getItem(PWA_PROMPT_DISMISSED_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [canNativePrompt, setCanNativePrompt] = useState(
    () =>
      typeof Navigator !== 'undefined' &&
      typeof Navigator.prototype?.install === 'function'
  );
  const [isInstallingPwa, setIsInstallingPwa] = useState(false);
  const [installStatusText, setInstallStatusText] = useState('');
  const deferredInstallPromptRef = useRef(undefined);

  const [backendStatus, setBackendStatus] = useState({
    ok: true,
    backend: 'checking',
    tableReady: false,
    message: 'Checking cloud sync...',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supportsWebInstall =
      typeof Navigator !== 'undefined' &&
      typeof Navigator.prototype?.install === 'function';
    if (supportsWebInstall) {
      setCanNativePrompt(true);
    }

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredInstallPromptRef.current = event;
      if (!supportsWebInstall) {
        setCanNativePrompt(true);
      }
    };

    const mql = window.matchMedia?.('(display-mode: standalone)');
    const onDisplayModeChange = () => {
      const standalone = isRunningStandalone();
      setIsStandalone(standalone);
      if (standalone) setIsPwaInstallOpen(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    mql?.addEventListener?.('change', onDisplayModeChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      mql?.removeEventListener?.('change', onDisplayModeChange);
    };
  }, []);

  const handleClosePwaInstall = useCallback(() => {
    setIsPwaInstallOpen(false);
    try {
      sessionStorage.setItem(PWA_PROMPT_DISMISSED_KEY, '1');
    } catch {}
  }, []);

  const handleTriggerNativeInstall = useCallback(async () => {
    if (isInstallingPwa) return;
    setIsInstallingPwa(true);
    const supportsWebInstall =
      typeof Navigator !== 'undefined' &&
      typeof Navigator.prototype?.install === 'function';

    try {
      if (supportsWebInstall) {
        await navigator.install();
        setInstallStatusText('The app was installed or opened.');
        setCanNativePrompt(false);
        handleClosePwaInstall();
      } else if (deferredInstallPromptRef.current) {
        const promptEvent = deferredInstallPromptRef.current;
        deferredInstallPromptRef.current = undefined;
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        setInstallStatusText(
          outcome === 'accepted'
            ? 'The app was installed.'
            : 'Installation canceled.'
        );
        if (!deferredInstallPromptRef.current) {
          setCanNativePrompt(false);
        }
        if (outcome === 'accepted') {
          handleClosePwaInstall();
        }
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        setInstallStatusText(
          'Installation was canceled or could not complete.'
        );
      } else {
        setInstallStatusText('Installation could not start.');
        console.error(error);
      }
    } finally {
      setIsInstallingPwa(false);
    }
  }, [isInstallingPwa, handleClosePwaInstall]);

  const commitState = useCallback((updater, syncToServer = true) => {
    setState((prev) => {
      const rawNext = typeof updater === 'function' ? updater(prev) : updater;
      const next = syncToServer
        ? enrichStateWithLiveProgress(rawNext)
        : rawNext;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      if (syncToServer && next?.podCode) {
        syncPodStateToCloud(next.podCode, next);
      }
      return next;
    });
  }, []);

  const refreshBackendStatus = useCallback(async () => {
    const status = await checkBackendHealth(state.podCode || 'ZAU8PP', state);
    setBackendStatus(status);
    return status;
  }, [state]);

  // Connect to live Server-Sent Events (SSE) stream + Cloud Poll for real-time 2-device Pod sync
  useEffect(() => {
    const code = state.podCode || 'ZAU8PP';
    let es;
    let cancelled = false;

    const applyRemoteState = (remoteState, force = false) => {
      if (cancelled || !remoteState || !Array.isArray(remoteState.goals)) return;
      setState((prev) => {
        if (
          !force &&
          prev?.updatedAt &&
          remoteState?.updatedAt &&
          remoteState.updatedAt <= prev.updatedAt
        ) {
          return prev;
        }
        const merged = {
          ...remoteState,
          activeLogger: prev.activeLogger || remoteState.activeLogger || 'user1',
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    };

    // Initial cloud sync & seed if empty
    (async () => {
      const status = await checkBackendHealth(code, null);
      if (!cancelled) setBackendStatus(status);
      const remote = await fetchPodStateFromCloud(code);
      if (remote && Array.isArray(remote.goals)) {
        applyRemoteState(remote, true);
      } else {
        await syncPodStateToCloud(code, state);
      }
    })();

    try {
      es = new EventSource(`/api/pods/${encodeURIComponent(code)}/events`);
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.state) applyRemoteState(payload.state);
        } catch {}
      };
    } catch {}

    // 5-second background sync for serverless/Supabase multi-device updates
    const pollId = setInterval(async () => {
      const remote = await fetchPodStateFromCloud(code);
      if (remote) applyRemoteState(remote);
    }, 5000);

    return () => {
      cancelled = true;
      if (es) es.close();
      clearInterval(pollId);
    };
  }, [state.podCode]);

  // Live 1-second Pomodoro / Focus Timer tick
  useEffect(() => {
    const u1Running = state.user1?.studyingNow;
    const u2Running = state.user2?.studyingNow;
    if (!u1Running && !u2Running) return;

    const timer = setInterval(() => {
      commitState((prev) => {
        const next = structuredClone(prev);
        for (const uKey of ['user1', 'user2']) {
          if (next[uKey]?.studyingNow) {
            const rem = (next[uKey].timerRemainingSec ?? 1500) - 1;
            if (rem <= 0) {
              next[uKey].studyingNow = false;
              next[uKey].timerRemainingSec = 1500;
              next.goals = next.goals.map((g) =>
                g.id === 'study-hours'
                  ? { ...g, [uKey]: (g[uKey] || 0) + 25 }
                  : g
              );
            } else {
              next[uKey].timerRemainingSec = rem;
            }
          }
        }
        return next;
      }, false);
    }, 1000);

    return () => clearInterval(timer);
  }, [state.user1?.studyingNow, state.user2?.studyingNow, commitState]);

  const metrics = computePodMetrics(state);

  const handleToggleYesterday = () => {
    commitState((prev) => ({
      ...prev,
      selectedDayView:
        prev.selectedDayView === 'yesterday' ? 'today' : 'yesterday',
    }));
  };

  const handleSwitchActiveLogger = (userKey) => {
    commitState(
      (prev) => ({
        ...prev,
        activeLogger: userKey,
      }),
      false
    );
  };

  const handleUpdateGoalValue = (goalId, newValue, targetUserKey) => {
    const uKey = targetUserKey || state.activeLogger || 'user1';
    commitState((prev) => ({
      ...prev,
      selectedDayView: 'today',
      goals: prev.goals.map((g) =>
        g.id === goalId ? { ...g, [uKey]: Math.max(0, newValue) } : g
      ),
    }));
  };

  const handleQuickStep = (goalId, delta, targetUserKey) => {
    const uKey = targetUserKey || state.activeLogger || 'user1';
    commitState((prev) => ({
      ...prev,
      selectedDayView: 'today',
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const step = delta ?? g.step ?? 1;
        return { ...g, [uKey]: Math.max(0, (g[uKey] || 0) + step) };
      }),
    }));
  };

  const handleSelectGoal = (goalId) => {
    setSelectedGoalId(goalId);
    setIsQuickLogOpen(true);
  };

  const handleToggleTimer = (userKey, durationSec, subjectName) => {
    const uKey = userKey || state.activeLogger || 'user1';
    commitState((prev) => {
      const currentlyRunning = prev[uKey]?.studyingNow;
      return {
        ...prev,
        [uKey]: {
          ...prev[uKey],
          studyingNow: !currentlyRunning,
          timerRemainingSec:
            durationSec ?? prev[uKey]?.timerRemainingSec ?? 1500,
          studySubject:
            subjectName || prev[uKey]?.studySubject || 'Deep Study',
        },
      };
    });
  };

  const handleCompletePomodoro = (minutes = 25, userKey) => {
    const uKey = userKey || state.activeLogger || 'user1';
    commitState((prev) => ({
      ...prev,
      [uKey]: {
        ...prev[uKey],
        studyingNow: false,
        timerRemainingSec: 1500,
      },
      goals: prev.goals.map((g) =>
        g.id === 'study-hours'
          ? { ...g, [uKey]: (g[uKey] || 0) + minutes }
          : g
      ),
    }));
  };

  const handleCreateNewPod = async () => {
    try {
      const res = await fetch('/api/pods/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.code) {
          commitState(
            (prev) => ({ ...prev, podCode: data.code, paired: true }),
            false
          );
          return data.code;
        }
      }
    } catch {}
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomCode = '';
    for (let i = 0; i < 6; i++) {
      randomCode += chars[Math.floor(Math.random() * chars.length)];
    }
    commitState((prev) => ({ ...prev, podCode: randomCode, paired: true }));
    return randomCode;
  };

  const handleJoinPod = async (inviteCode) => {
    const cleanCode = String(inviteCode || '')
      .trim()
      .toUpperCase();
    if (!cleanCode) return;
    const remoteState = await fetchPodStateFromCloud(cleanCode);
    if (remoteState) {
      commitState(
        { ...remoteState, podCode: cleanCode, paired: true },
        true
      );
      return;
    }
    commitState((prev) => ({ ...prev, podCode: cleanCode, paired: true }));
  };

  const handleAcceptInvite = () => {
    commitState((prev) => ({ ...prev, paired: true }));
    setIsPairingOpen(false);
  };

  const handleResetDemo = () => {
    const demo = { ...createDefaultState(), updatedAt: Date.now() };
    setState(demo);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch {}
    syncPodStateToCloud(demo.podCode || 'ZAU8PP', demo);
    setActiveTab('together');
  };

  const handleResetCleanZero = () => {
    const clean = {
      ...createRealInitialState(state.podCode || 'ZAU8PP'),
      user1: {
        ...createRealInitialState().user1,
        name: state.user1?.name === 'Ced' ? 'Omar' : state.user1?.name || 'Omar',
        color: state.user1?.color || '#00B86B',
      },
      user2: {
        ...createRealInitialState().user2,
        name: state.user2?.name === 'Joe' ? 'Partner' : state.user2?.name || 'Partner',
        color: state.user2?.color || '#00A8E8',
      },
      updatedAt: Date.now(),
    };
    setState(clean);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {}
    syncPodStateToCloud(clean.podCode, clean);
    setActiveTab('together');
  };

  const handleStartFreshOnboarding = () => {
    const blank = createBlankOnboardingState();
    commitState(blank, true);
    setActiveTab('onboarding');
  };

  const anyStudyingNow = state.user1?.studyingNow || state.user2?.studyingNow;
  const activeColor =
    state.activeLogger === 'user2'
      ? state.user2?.color || '#00A8E8'
      : state.user1?.color || '#00B86B';

  return (
    <div className="min-h-dvh w-full select-none flex flex-col liquid-canvas-bg relative overflow-x-hidden">
      {/* Native iOS Top Navigation Bar (Seamless Liquid Glass Controls + Dynamic Island Safe Area) */}
      {activeTab !== 'onboarding' && (
        <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-[#D0E9DF]/45 border-b border-white/35">
          <div className="max-w-[760px] mx-auto sm:px-8 pb-2 ios-safe-header flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* 3D Glossy Liquid Glass User Orb */}
              <button
                type="button"
                onClick={() =>
                  handleSwitchActiveLogger(
                    state.activeLogger === 'user1' ? 'user2' : 'user1'
                  )
                }
                aria-label={`Logging as ${
                  state.activeLogger === 'user2'
                    ? state.user2?.name
                    : state.user1?.name
                }. Tap to switch logger`}
                style={{
                  backgroundColor: activeColor,
                  boxShadow: `0 6px 16px -3px ${activeColor}66, inset 0 2px 1.5px rgba(255,255,255,0.75), inset 0 -2px 4px rgba(0,0,0,0.2)`,
                }}
                className="icon-button relative w-[30px] h-[30px] rounded-full border border-white/60 flex items-center justify-center text-white text-[12px] font-extrabold ios-press cursor-pointer"
                title={`Logging as ${
                  state.activeLogger === 'user2'
                    ? state.user2?.name
                    : state.user1?.name
                } — Tap to switch`}
              >
                <span className="pointer-events-none absolute top-[2px] left-[22%] w-[56%] h-[36%] rounded-full bg-gradient-to-b from-white/60 to-transparent" />
              </button>

              {anyStudyingNow && (
                <button
                  type="button"
                  onClick={() => setIsQuickLogOpen(true)}
                  className="liquid-glass-pill pl-2.5 pr-3 py-1 rounded-full text-[11.5px] font-bold text-[#008A50] flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00C472] animate-pulse shadow-[0_0_8px_#00C472]" />
                  <span className="tabular-nums">
                    {Math.floor(
                      ((state.user1?.studyingNow
                        ? state.user1.timerRemainingSec
                        : state.user2.timerRemainingSec) || 1500) / 60
                    )}
                    m Focus
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Native iOS PWA Install Pill (Visible when running in browser) */}
              {!isStandalone && (
                <button
                  type="button"
                  onClick={() => setIsPwaInstallOpen(true)}
                  data-testid="header-pwa-install-pill"
                  className="liquid-glass-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-extrabold text-[#007AFF] cursor-pointer"
                  title="Install StudyPod iPhone App"
                >
                  <Download
                    className="w-[13.5px] h-[13.5px] stroke-[2.5]"
                    aria-hidden="true"
                  />
                  <span>Get App</span>
                </button>
              )}

              {/* Liquid Glass Streak Capsule */}
              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                className="liquid-glass-pill flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer"
                title="Current Study Pod Streak"
              >
                <Flame
                  className="w-[16px] h-[16px] text-[#F59E0B] fill-[#F59E0B] drop-shadow-[0_2px_4px_rgba(245,158,11,0.35)]"
                  aria-hidden="true"
                />
                <RollingNumber
                  value={state.streak}
                  className="text-[13.5px] font-extrabold text-[#364943]"
                />
              </button>

              {/* Liquid Glass Menu Squircle */}
              <button
                type="button"
                aria-label="Pod Settings"
                onClick={() =>
                  setActiveTab(activeTab === 'you' ? 'together' : 'you')
                }
                className="icon-button liquid-glass-pill w-[32px] h-[32px] rounded-[10px] flex items-center justify-center text-[#364943] cursor-pointer"
                title="Pod Settings"
              >
                <Menu className="w-[16px] h-[16px] stroke-[2.3]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area with Keyed iOS 26 View Transition */}
      <main className="flex-1 w-full max-w-[760px] mx-auto sm:px-4 ios-safe-main">
        <div key={activeTab} className="animate-fadeIn">
          {activeTab === 'together' && (
            <>
              <HeroGauge
                state={state}
                metrics={metrics}
                onToggleYesterday={handleToggleYesterday}
                onOpenPairing={() => setIsPairingOpen(true)}
              />
              <StudyBentoGrid
                state={state}
                metrics={metrics}
                onSelectGoal={handleSelectGoal}
                onQuickStep={handleQuickStep}
                onSwitchActiveLogger={handleSwitchActiveLogger}
                onOpenTimer={() => {
                  setSelectedGoalId('study-hours');
                  setIsQuickLogOpen(true);
                }}
              />
            </>
          )}

          {activeTab === 'insights' && (
            <InsightsView state={state} metrics={metrics} />
          )}

          {(activeTab === 'you' || activeTab === 'onboarding') && (
            <SettingsAndOnboardingView
              state={state}
              mode={activeTab === 'onboarding' ? 'onboarding' : 'settings'}
              backendStatus={backendStatus}
              onRefreshBackendStatus={refreshBackendStatus}
              onUpdateState={(next) => commitState(next, true)}
              onResetDemo={handleResetDemo}
              onResetCleanZero={handleResetCleanZero}
              onStartFreshOnboarding={handleStartFreshOnboarding}
              onOpenPairing={() => setIsPairingOpen(true)}
              onOpenPwaInstall={() => setIsPwaInstallOpen(true)}
              onCloseOnboarding={() => setActiveTab('together')}
            />
          )}
        </div>
      </main>

      {/* iOS 26 Floating Liquid Glass Tab Bar + Physical Sliding Droplet + 3D Emerald Sphere */}
      {activeTab !== 'onboarding' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none pt-3 ios-safe-tabbar bg-gradient-to-t from-[#E5F1EC]/90 via-[#E5F1EC]/35 to-transparent">
          <div className="max-w-[620px] mx-auto flex items-center justify-between gap-3.5">
            {/* iOS 26 Liquid Glass Capsule Tab Bar with Sliding 3D Droplet */}
            <nav
              aria-label="Primary Bottom Navigation"
              className="pointer-events-auto relative liquid-glass-tabbar rounded-full p-1.5 grid grid-cols-3 items-center flex-1 max-w-[460px]"
            >
              {/* Physical Sliding 3D Liquid Glass Droplet Indicator */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/3)] rounded-full liquid-glass-tab-active transition-transform duration-450"
                style={{
                  transform: `translate3d(${
                    activeTab === 'insights'
                      ? '100%'
                      : activeTab === 'you'
                        ? '200%'
                        : '0%'
                  }, 0, 0)`,
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.42, 0.64, 1)',
                }}
              />

              {[
                { id: 'together', label: 'Together', Icon: Users },
                { id: 'insights', label: 'Insights', Icon: BarChart2 },
                {
                  id: 'you',
                  label: state.paired ? 'You' : 'Your partner',
                  Icon: User,
                },
              ].map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    aria-current={isActive ? 'page' : undefined}
                    className="relative z-10 py-1.5 rounded-full flex flex-col items-center justify-center gap-0.5 ios-press cursor-pointer transition-colors duration-250"
                  >
                    <Icon
                      aria-hidden="true"
                      className={`w-[19px] h-[19px] transition-all duration-300 ${
                        isActive
                          ? 'text-[#009A58] stroke-[2.4] -translate-y-[0.5px] scale-105'
                          : 'text-[#5C7069] stroke-[2]'
                      }`}
                    />
                    <span
                      className={`text-[10.5px] tracking-[-0.01em] transition-colors duration-300 ${
                        isActive
                          ? 'font-bold text-[#009A58]'
                          : 'font-semibold text-[#5C7069]'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* 3D Emerald Liquid Glass Sphere Action Button */}
            <button
              type="button"
              aria-label="Log Study Progress and Focus Timer"
              onClick={() => {
                setSelectedGoalId(null);
                setIsQuickLogOpen(true);
              }}
              className="pointer-events-auto w-[56px] h-[56px] rounded-full liquid-glass-emerald-orb text-white flex items-center justify-center ios-press cursor-pointer shrink-0"
              title="Log Study Progress & Focus Timer"
            >
              <ClipboardCheck
                aria-hidden="true"
                className="relative z-10 w-[25px] h-[25px] stroke-[2.3] drop-shadow-[0_1px_2px_rgba(0,80,45,0.35)]"
              />
            </button>
          </div>
        </div>
      )}

      {/* Quick Log & Pomodoro Focus Timer Sheet */}
      <QuickLogAndTimerModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        initialGoalId={selectedGoalId}
        state={state}
        onUpdateGoalValue={handleUpdateGoalValue}
        onSwitchActiveLogger={handleSwitchActiveLogger}
        onToggleTimer={handleToggleTimer}
        onCompletePomodoro={handleCompletePomodoro}
      />

      {/* 6-Character Pod Pairing Modal */}
      <PodPairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        state={state}
        onCreateNewPod={handleCreateNewPod}
        onJoinPod={handleJoinPod}
        onAcceptInvite={handleAcceptInvite}
      />

      {/* Native iPhone / iOS 26 PWA Install Sheet (Auto-prompts on open) */}
      <IosPwaInstallModal
        isOpen={isPwaInstallOpen}
        onClose={handleClosePwaInstall}
        canNativePrompt={canNativePrompt}
        onTriggerNativeInstall={handleTriggerNativeInstall}
        installStatusText={installStatusText}
        isInstalling={isInstallingPwa}
      />
    </div>
  );
}
