/**
 * Instagram is the whole ordering channel (MASTER-PLAN.md §4), so the handle and
 * the DM link live in one place. `ig.me/m/<user>` opens the DM thread directly —
 * a plain profile link does not.
 */

export const INSTAGRAM_USERNAME =
  process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME ?? "torisabi.ph";

export const INSTAGRAM_DM_URL = `https://ig.me/m/${INSTAGRAM_USERNAME}`;
export const INSTAGRAM_PROFILE_URL = `https://instagram.com/${INSTAGRAM_USERNAME}`;

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}
