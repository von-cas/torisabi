/**
 * Two doodles lifted from the logo — a strawberry and a four-point sparkle.
 * Deliberately the only illustrations on the site: they mark the two places
 * that need a hand-drawn touch and nowhere else.
 */

export function Strawberry({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 36"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 34c7.2 0 12-5.6 12-12.6C28 14.5 22.6 10 16 10S4 14.5 4 21.4C4 28.4 8.8 34 16 34Z"
        fill="var(--berry)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 10c0-3.3 2.6-6 6.6-6.6C22.2 6 20.4 8.2 17.8 9.4M16 10c0-3.3-2.6-6-6.6-6.6C9.8 6 11.6 8.2 14.2 9.4"
        fill="var(--leaf)"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g fill="var(--paper)">
        <circle cx="11.5" cy="19.5" r="1.4" />
        <circle cx="20.5" cy="19.5" r="1.4" />
        <circle cx="16" cy="25" r="1.4" />
        <circle cx="9" cy="26" r="1.4" />
        <circle cx="23" cy="26" r="1.4" />
      </g>
    </svg>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="M10 0c.8 5.4 3.8 8.6 10 10-6.2 1.4-9.2 4.6-10 10-.8-5.4-3.8-8.6-10-10C6.2 8.6 9.2 5.4 10 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
