import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Sparkles, Smartphone, ArrowDown, ArrowUp } from 'lucide-react';
import { getTexts } from '../data/i18n.js';

/**
 * Trigger genuine iOS 17.4+ / iOS 18 / iOS 26 Safari Taptic Engine Haptics
 * via the native WebKit `<input type="checkbox" switch>` label activation trick,
 * with `navigator.vibrate` fallback on Android/supported browsers.
 */
export function triggerIosHaptic(style = 'light') {
  try {
    if (typeof document !== 'undefined') {
      const label = document.getElementById('ios-haptic-switch-label');
      if (label) {
        label.click();
        return;
      }
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(style === 'heavy' ? 16 : 8);
    }
  } catch {}
}

/**
 * Shared iOS 26 UIKit Bottom-Sheet Pull-to-Dismiss Gesture Hook
 * Supports 1:1 downward finger tracking, upward rubber-band resistance,
 * flick velocity dismissal (> 0.55 px/ms), and threshold haptic tick.
 */
export function useIosSheetDrag(onClose) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(null);
  const startTimeRef = useRef(0);
  const crossedThresholdRef = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = performance.now();
    crossedThresholdRef.current = false;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startYRef.current === null || !e.touches || e.touches.length !== 1) return;
    const delta = e.touches[0].clientY - startYRef.current;
    const nextY = delta < 0 ? delta * 0.16 : delta;
    if (nextY > 84 && !crossedThresholdRef.current) {
      crossedThresholdRef.current = true;
      triggerIosHaptic('light');
    } else if (nextY <= 84 && crossedThresholdRef.current) {
      crossedThresholdRef.current = false;
    }
    setDragY(nextY);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (startYRef.current === null) return;
    const elapsed = Math.max(1, performance.now() - startTimeRef.current);
    const velocity = dragY / elapsed; // px per ms
    startYRef.current = null;
    setIsDragging(false);
    if (dragY > 84 || (dragY > 34 && velocity > 0.55)) {
      triggerIosHaptic('light');
      setDragY(0);
      onClose?.();
    } else {
      setDragY(0);
    }
  }, [dragY, onClose]);

  const sheetStyle =
    isDragging || dragY !== 0
      ? {
          transform: `translate3d(0, ${dragY.toFixed(1)}px, 0)`,
          transition: isDragging ? 'none' : 'transform 0.38s var(--ios-spring)',
        }
      : {
          transition: 'transform 0.38s var(--ios-spring)',
        };

  return {
    dragHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    sheetStyle,
  };
}

/**
 * Detect whether the app is currently running as an installed Home Screen PWA
 */
export function isRunningStandalone() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.navigator?.standalone === true ||
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.matchMedia?.('(display-mode: fullscreen)')?.matches
  );
}

/**
 * Detect iOS browser variant so Share button location is 100% accurate
 */
function detectIosBrowserVariant() {
  if (typeof navigator === 'undefined') {
    return { name: 'iOS Safari', shareLocation: 'bottom bar', isTopBar: false };
  }
  const ua = navigator.userAgent || '';
  if (/CriOS/i.test(ua)) {
    return {
      name: 'Chrome on iPhone',
      shareLocation: 'top-right address bar',
      isTopBar: true,
    };
  }
  if (/FxiOS|EdgiOS|OPiOS/i.test(ua)) {
    return {
      name: 'iPhone Browser',
      shareLocation: 'browser toolbar menu',
      isTopBar: false,
    };
  }
  return {
    name: 'iOS Safari',
    shareLocation: 'Safari bottom toolbar',
    isTopBar: false,
  };
}

/**
 * Authentic Apple SF Symbols "square.and.arrow.up" (iOS Share Icon)
 */
function AppleShareIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M7 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

/**
 * Authentic Apple SF Symbols "plus.square" (Add to Home Screen Icon)
 */
function AppleAddSquareIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.2" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

/**
 * 3D Glossy StudyPod iOS Squircle App Icon
 */
export function StudyPodAppIcon({ size = 60 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.225),
      }}
      className="relative shrink-0 overflow-hidden shadow-[0_12px_28px_-6px_rgba(8,38,28,0.45),0_2px_6px_rgba(0,0,0,0.18),inset_0_1.5px_1.5px_rgba(255,255,255,0.45)] border border-white/25 bg-[#0E2620] flex items-center justify-center"
    >
      <img
        src="/icon.svg"
        alt="StudyPod App Icon"
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[44%] bg-gradient-to-b from-white/25 to-transparent"
      />
    </div>
  );
}

export function IosPwaInstallModal({
  isOpen,
  onClose,
  lang = 'en',
  canNativePrompt,
  onTriggerNativeInstall,
  installStatusText,
  isInstalling,
}) {
  const { dragHandlers, sheetStyle } = useIosSheetDrag(onClose);
  const browserVariant = detectIosBrowserVariant();
  const t = getTexts(lang);

  // Lock background scroll while modal sheet is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-pwa-install-title"
      data-testid="ios-pwa-install-modal"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/28 backdrop-blur-sm animate-backdrop"
    >
      {/* Tap backdrop to dismiss */}
      <div
        className="flex-1"
        onClick={() => {
          triggerIosHaptic('light');
          onClose?.();
        }}
      />

      {/* Native iOS 26 Proximity Sheet (AirPods / App Clip Aesthetic) */}
      <div
        style={sheetStyle}
        className="w-full max-w-[500px] mx-auto rounded-t-[36px] sm:rounded-[36px] sm:mb-5 liquid-glass-sheet ios-safe-sheet px-5 pt-2.5 overflow-hidden relative"
      >
        {/* Ambient Mint & Cyan Specular Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-14 left-1/4 w-44 h-32 rounded-full bg-[#00C472]/20 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-14 right-1/4 w-44 h-32 rounded-full bg-[#00A8E8]/20 blur-2xl"
        />

        {/* Touch-Draggable Sheet Grabber Header */}
        <div
          {...dragHandlers}
          className="pt-1 pb-2 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-9 h-[5px] rounded-full bg-black/18 mx-auto mb-2.5" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <StudyPodAppIcon size={60} />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00B86B]/14 border border-[#00B86B]/25 text-[#008A50] text-[10px] font-extrabold tracking-[0.08em] uppercase mb-1">
                  <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                  <span>{t.iphoneNativeWebApp}</span>
                </div>
                <h2
                  id="ios-pwa-install-title"
                  className="text-[20px] font-extrabold text-[#141E28] tracking-[-0.03em] leading-tight"
                >
                  {t.installStudyPodApp}
                </h2>
                <p className="text-[12.5px] font-medium text-[#5E726A] tracking-[-0.01em] mt-0.5">
                  {t.installModalSubtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerIosHaptic('light');
                onClose?.();
              }}
              aria-label="Close install prompt"
              data-testid="close-pwa-install-modal"
              className="icon-button w-8 h-8 rounded-full bg-black/[0.06] hover:bg-black/[0.1] text-[#354841] flex items-center justify-center shrink-0 ios-press cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Native iPhone Benefits Strip (Dynamic Island + Full Screen + Offline Ready) */}
        <div className="grid grid-cols-3 gap-2 my-3">
          {[
            { title: t.featFullScreen, sub: t.featFullScreenSub },
            { title: t.featGlass, sub: t.featGlassSub },
            { title: t.featLiveSync, sub: t.featLiveSyncSub },
          ].map((feat) => (
            <div
              key={feat.title}
              className="rounded-[16px] bg-white/75 border border-white/90 px-2.5 py-2 text-center shadow-[0_2px_8px_rgba(12,38,30,0.04)]"
            >
              <div className="text-[12px] font-extrabold text-[#141E28] tracking-[-0.02em]">
                {feat.title}
              </div>
              <div className="text-[10.5px] font-semibold text-[#6B7F77]">
                {feat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Direct 1-Tap Browser Install Button (shown when Web Install API or beforeinstallprompt is available) */}
        {canNativePrompt && (
          <div className="mb-3">
            <button
              type="button"
              aria-disabled={isInstalling ? 'true' : undefined}
              onClick={() => {
                triggerIosHaptic('heavy');
                onTriggerNativeInstall?.();
              }}
              data-testid="pwa-direct-install-btn"
              className="w-full py-3.5 px-5 rounded-full liquid-glass-emerald-orb text-white font-extrabold text-[15px] tracking-[-0.01em] flex items-center justify-center gap-2 ios-press cursor-pointer"
            >
              <Smartphone className="w-4 h-4 stroke-[2.4]" aria-hidden="true" />
              <span>
                {isInstalling ? t.installingStudyPod : t.downloadAndInstallNow}
              </span>
            </button>
          </div>
        )}

        {/* Accessible Status Region for Web Install API / beforeinstallprompt outcomes */}
        <p
          id="install-status"
          role="status"
          aria-live="polite"
          className={
            installStatusText
              ? 'text-[12px] font-semibold text-[#008A50] text-center mb-2.5'
              : 'sr-only'
          }
        >
          {installStatusText}
        </p>

        {/* Step-by-Step iOS Safari / Chrome "Add to Home Screen" Native Card */}
        <div className="rounded-[24px] bg-white/88 border border-white/95 p-3.5 shadow-[0_6px_22px_-4px_rgba(12,38,30,0.06)] space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] font-extrabold tracking-[0.13em] text-[#60756D] uppercase">
              {t.howToInstallHeader}
            </span>
            <span className="text-[10.5px] font-bold text-[#009E5C]">
              {browserVariant.name}
            </span>
          </div>

          {/* Step 1: Tap Share */}
          <div className="flex items-center gap-3 rounded-[16px] bg-[#F2F7F4] px-3 py-2.5 border border-black/[0.04]">
            <div className="w-9 h-9 rounded-[11px] bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(0,122,255,0.28)]">
              <AppleShareIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-[#141E28] tracking-[-0.015em]">
                {t.step1Title}{' '}
                <span className="text-[#007AFF]">{t.shareWord}</span>{' '}
                {t.buttonWord}
              </div>
              <div className="text-[11.5px] font-medium text-[#687C74]">
                {t.step1Sub(browserVariant.shareLocation)}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-extrabold shrink-0">
              {t.step1Badge}
            </span>
          </div>

          {/* Step 2: Tap Add to Home Screen */}
          <div className="flex items-center gap-3 rounded-[16px] bg-[#F2F7F4] px-3 py-2.5 border border-black/[0.04]">
            <div className="w-9 h-9 rounded-[11px] bg-[#141E28] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(20,30,40,0.2)]">
              <AppleAddSquareIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-[#141E28] tracking-[-0.015em]">
                {t.step2Title}
              </div>
              <div className="text-[11.5px] font-medium text-[#687C74]">
                {t.step2Sub}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-black/[0.06] text-[#354841] text-[11px] font-extrabold shrink-0">
              {t.step2Badge}
            </span>
          </div>

          {/* Step 3: Tap Add */}
          <div className="flex items-center gap-3 rounded-[16px] bg-[#F2F7F4] px-3 py-2.5 border border-black/[0.04]">
            <div className="w-9 h-9 rounded-[11px] bg-[#00B86B] text-white flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(0,184,107,0.28)]">
              <Check className="w-5 h-5 stroke-[2.8]" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-[#141E28] tracking-[-0.015em]">
                {t.step3Title}
              </div>
              <div className="text-[11.5px] font-medium text-[#687C74]">
                {t.step3Sub}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#00B86B]/12 text-[#008A50] text-[11px] font-extrabold shrink-0">
              {t.step3Badge}
            </span>
          </div>
        </div>

        {/* Dismiss / Continue Action + Bouncing Toolbar Pointer */}
        <div className="mt-3.5 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerIosHaptic('light');
              onClose?.();
            }}
            data-testid="pwa-continue-browser-btn"
            className="w-full py-3 rounded-full bg-black/[0.06] hover:bg-black/[0.09] text-[#141E28] font-extrabold text-[14px] tracking-[-0.01em] ios-press cursor-pointer"
          >
            {t.gotItContinue}
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#007AFF] pt-0.5 animate-bounce-down">
            {browserVariant.isTopBar ? (
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.6]" aria-hidden="true" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 stroke-[2.6]" aria-hidden="true" />
            )}
            <span>{t.tapSharePointer(browserVariant.shareLocation)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IosPwaInstallModal;
