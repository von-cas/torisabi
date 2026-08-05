/**
 * Facebook Messenger is the whole ordering channel — a single button everywhere
 * opens the same chat. The URLs live in `@/lib/social` (the one place every
 * Torisabi profile is defined) and are re-exported here so existing importers
 * keep working.
 *
 * `m.me/<id>` opens the Messenger thread to Torisabi Ph directly — the app on a
 * phone, the web composer on a laptop. Note: neither Messenger nor Facebook
 * lets a link pre-type the composer, so the button opens the chat and the
 * product name + code shown on the page are what the customer references.
 */

export {
  MESSENGER_URL,
  FACEBOOK_PROFILE_URL,
  FACEBOOK_LABEL,
} from "@/lib/social";

/** Facebook Messenger glyph. */
export function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.19.16.14.26.35.27.57l.05 1.78c.03.57.61.94 1.13.71l1.98-.87c.17-.08.36-.09.54-.04 1.02.28 2.1.43 3.22.43 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm6 7.46l-2.94 4.66c-.47.74-1.47.93-2.18.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.18-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63z" />
    </svg>
  );
}
