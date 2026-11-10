import React from 'react';
import RollingNumber from './RollingNumber.jsx';
import { triggerIosHaptic } from './IosPwaInstallModal.jsx';
import { getTexts } from '../data/i18n.js';

function hexToRgba(hex, alpha = 0.16) {
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

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

const RADII = [78, 90, 102];
const DOT_RADIUS = 4.6;
// 7 rows from bottom-left (194°) up to top-left (134°) in 10° steps
const LEFT_ROW_ANGLES = [194, 184, 174, 164, 154, 144, 134];
// 7 rows from bottom-right (-14°) up to top-right (46°) in 10° steps
const RIGHT_ROW_ANGLES = [-14, -4, 6, 16, 26, 36, 46];

export function HeroGauge({ state, metrics, onToggleYesterday, onOpenPairing }) {
  const cx = 160;
  const cy = 118;

  const lang = state?.lang === 'ar' ? 'ar' : 'en';
  const t = getTexts(lang);

  const u1Color = state?.user1?.color || '#00B86B';
  const u2Color = state?.user2?.color || '#00A8E8';

  const isDefault43 =
    state?.paired !== false &&
    state?.selectedDayView !== 'yesterday' &&
    (metrics?.combinedPercent ?? 43) === 43 &&
    (metrics?.user1Dots ?? 12) === 12 &&
    (metrics?.user2Dots ?? 12) === 12;

  const u1DotsFilled =
    state?.paired === false ? 0 : isDefault43 ? 17 : (metrics?.user1Dots ?? 12);
  const u2DotsFilled =
    state?.paired === false ? 0 : isDefault43 ? 17 : (metrics?.user2Dots ?? 12);
  const displayPercent =
    state?.paired === false ? 0 : (metrics?.combinedPercent ?? 43);

  const arcRadius = 92;
  const arcCy = 110;
  const arcStart = polarToCartesian(cx, arcCy, arcRadius, 142);
  const arcEnd = polarToCartesian(cx, arcCy, arcRadius, 38);
  const goalsArcPath = `M ${arcStart.x.toFixed(2)} ${arcStart.y.toFixed(2)} A ${arcRadius} ${arcRadius} 0 0 1 ${arcEnd.x.toFixed(2)} ${arcEnd.y.toFixed(2)}`;

  return (
    <section
      className="relative flex flex-col items-center select-none pt-1 pb-2"
      aria-label="Goals Reached Today Gauge"
    >
      {/* Subtle Ambient Chromatic Glow Behind the Gauge */}
      <div
        className="pointer-events-none absolute top-4 w-[280px] h-[150px] rounded-full blur-2xl opacity-55"
        style={{
          background: `linear-gradient(90deg, ${hexToRgba(u1Color, 0.28)} 0%, rgba(255,255,255,0.5) 50%, ${hexToRgba(u2Color, 0.28)} 100%)`,
        }}
      />

      <div
        dir="ltr"
        className="relative w-full max-w-[320px] h-[195px] flex items-center justify-center"
      >
        <svg
          viewBox="0 0 320 195"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`${t.goalsReachedToday}: ${displayPercent}%`}
        >
          <defs>
            <path id="goalsArc" d={goalsArcPath} />
            <filter id="u1Glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor={u1Color} floodOpacity="0.32" />
            </filter>
            <filter id="u2Glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor={u2Color} floodOpacity="0.32" />
            </filter>
          </defs>

          {/* Curved Header Text (English only — iOS WebKit SVG textPath breaks Arabic cursive shaping) */}
          {lang !== 'ar' && (
            <text
              fill="#637871"
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '0.14em',
              }}
              className="uppercase"
            >
              <textPath href="#goalsArc" startOffset="50%" textAnchor="middle">
                {t.goalsReachedToday}
              </textPath>
            </text>
          )}

          {/* Left Dot-Matrix Arc (User 1 — Staggered Liquid Glass Beads) */}
          <g key={`left-arc-${state?.selectedDayView || 'today'}`}>
            {LEFT_ROW_ANGLES.map((angleDeg, rowIdx) =>
              RADII.map((r, colIdx) => {
                const dotIdx = rowIdx * 3 + colIdx;
                const isFilled = dotIdx < u1DotsFilled;
                const unfilledAlpha = rowIdx === 6 ? 0.09 : 0.16;
                const pos = polarToCartesian(cx, cy, r, angleDeg);
                const x = Number(pos.x.toFixed(2));
                const y = Number(pos.y.toFixed(2));
                return (
                  <g
                    key={`l-${rowIdx}-${colIdx}`}
                    className="ios-dot-bloom"
                    style={{ '--dot-row': rowIdx }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={DOT_RADIUS}
                      fill={isFilled ? u1Color : hexToRgba(u1Color, unfilledAlpha)}
                      filter={isFilled ? 'url(#u1Glow)' : undefined}
                      stroke={isFilled ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.48)'}
                      strokeWidth="0.7"
                      className="transition-colors duration-500 ease-out"
                    />
                    <circle
                      cx={x - 1.3}
                      cy={y - 1.4}
                      r={isFilled ? 1.35 : 1.05}
                      fill={isFilled ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.36)'}
                    />
                  </g>
                );
              })
            )}
          </g>

          {/* Right Dot-Matrix Arc (User 2 — Staggered Liquid Glass Beads) */}
          <g key={`right-arc-${state?.selectedDayView || 'today'}`}>
            {RIGHT_ROW_ANGLES.map((angleDeg, rowIdx) =>
              RADII.map((r, colIdx) => {
                const dotIdx = rowIdx * 3 + colIdx;
                const isFilled = dotIdx < u2DotsFilled;
                const unfilledAlpha = rowIdx === 6 ? 0.09 : 0.16;
                const pos = polarToCartesian(cx, cy, r, angleDeg);
                const x = Number(pos.x.toFixed(2));
                const y = Number(pos.y.toFixed(2));
                return (
                  <g
                    key={`r-${rowIdx}-${colIdx}`}
                    className="ios-dot-bloom"
                    style={{ '--dot-row': rowIdx }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={DOT_RADIUS}
                      fill={isFilled ? u2Color : hexToRgba(u2Color, unfilledAlpha)}
                      filter={isFilled ? 'url(#u2Glow)' : undefined}
                      stroke={isFilled ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.48)'}
                      strokeWidth="0.7"
                      className="transition-colors duration-500 ease-out"
                    />
                    <circle
                      cx={x - 1.3}
                      cy={y - 1.4}
                      r={isFilled ? 1.35 : 1.05}
                      fill={isFilled ? 'rgba(255, 255, 255, 0.58)' : 'rgba(255, 255, 255, 0.36)'}
                    />
                  </g>
                );
              })
            )}
          </g>
        </svg>

        {/* Center Metric Readout with iOS 26 Rolling Odometer */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-start ${
            lang === 'ar' ? 'pt-[16px]' : 'pt-[38px]'
          } pointer-events-none`}
        >
          {lang === 'ar' && (
            <span
              dir="rtl"
              className="text-[11.5px] font-bold text-[#5A7068] mb-1.5 leading-none"
            >
              {t.goalsReachedToday}
            </span>
          )}
          <div className="relative flex flex-col items-center">
            <span
              className="text-[72px] font-extrabold tracking-[-0.045em] leading-[0.88] text-[#141E28] drop-shadow-[0_2px_0_rgba(255,255,255,0.8)]"
              data-testid="hero-percent-value"
            >
              <RollingNumber value={displayPercent} staggerMs={55} />
            </span>
            <span
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              className="text-[12.5px] font-extrabold tracking-[0.14em] text-[#141E28] mt-1.5 uppercase"
            >
              {t.percent}
            </span>

            {/* Unpaired "Pair up to start" Liquid Glass CTA overlay */}
            {!state?.paired && (
              <button
                type="button"
                onClick={() => onOpenPairing && onOpenPairing()}
                className="pointer-events-auto absolute top-1/2 -translate-y-1/2 whitespace-nowrap liquid-glass-emerald-orb text-white text-[13px] font-bold px-5 py-2.5 rounded-full ios-press cursor-pointer"
              >
                {t.pairUpToStart}
              </button>
            )}
          </div>

          {/* Warm Amber Liquid Glass Yesterday Comparison Pill */}
          <button
            type="button"
            dir="ltr"
            onClick={() => {
              triggerIosHaptic('light');
              onToggleYesterday && onToggleYesterday();
            }}
            data-testid="yesterday-pill"
            className="pointer-events-auto mt-3.5 liquid-glass-amber-pill px-3.5 py-1 rounded-full text-[10.5px] font-bold tracking-[0.06em] inline-flex items-center gap-1.5 cursor-pointer"
            title="Toggle between Today and Yesterday's snapshot"
          >
            <RollingNumber
              value={`${metrics?.yesterdayPercent ?? state?.yesterdayPercent ?? 0}%`}
              className="text-[#BD8218] font-extrabold"
            />
            <span className="text-[#263330]">
              {state?.selectedDayView === 'yesterday'
                ? t.viewingYesterday
                : t.yesterday}
            </span>
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`w-2.5 h-2.5 text-[#7E8E88] transition-transform duration-300 ${
                state?.selectedDayView === 'yesterday' ? 'rotate-180' : ''
              }`}
            >
              <path d="M3 3l6 6" />
              <path d="M9 4v5H4" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default HeroGauge;
