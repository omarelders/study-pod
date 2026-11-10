import React, { useEffect, useState } from 'react';

/**
 * Single vertical slot-reel digit column (0-9) that rolls smoothly like iOS 26 Apple Health / Watch
 */
function DigitReel({ char, delayMs = 0 }) {
  const isDigit = /^[0-9]$/.test(char);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!isDigit) {
    return <span className="inline-block whitespace-pre">{char}</span>;
  }

  const digit = parseInt(char, 10);
  const targetOffset = mounted ? -digit * 10 : 0;

  return (
    <span
      className="inline-flex flex-col overflow-hidden align-bottom relative"
      style={{ height: '1.05em', lineHeight: 1.05 }}
    >
      <span
        className="flex flex-col transition-transform will-change-transform"
        style={{
          transform: `translate3d(0, ${targetOffset}%, 0)`,
          transitionDuration: '680ms',
          transitionDelay: `${delayMs}ms`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="flex items-center justify-center select-none"
            style={{ height: '1.05em', lineHeight: 1.05 }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * iOS 26 Rolling Odometer Number / String
 * Keys digits right-to-left by place value so 9 -> 10 rolls the ones place cleanly.
 */
export function RollingNumber({
  value,
  className = '',
  staggerMs = 38,
  ...rest
}) {
  const str = String(value ?? '');
  const chars = str.split('');
  const totalDigits = chars.filter((c) => /^[0-9]$/.test(c)).length;
  let digitSeen = 0;

  return (
    <span
      dir="ltr"
      className={`inline-flex items-baseline tabular-nums font-sf-rounded ${className}`}
      style={{ lineHeight: 1 }}
      {...rest}
    >
      {chars.map((ch, idx) => {
        const isDigit = /^[0-9]$/.test(ch);
        const curDigitIdx = isDigit ? digitSeen++ : -1;
        const placeFromRight = isDigit ? totalDigits - 1 - curDigitIdx : idx;
        const delay = isDigit ? curDigitIdx * staggerMs : 0;
        return (
          <DigitReel
            key={isDigit ? `d-place-${placeFromRight}` : `sep-${idx}-${ch}`}
            char={ch}
            delayMs={delay}
          />
        );
      })}
    </span>
  );
}

export default RollingNumber;
