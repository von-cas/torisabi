/**
 * Every Torisabi profile in one place. Handles are env-overridable so a rename
 * is a config change, not a code change; the defaults are the live accounts.
 *
 * `m.me/<id>` opens the Messenger thread — Facebook Messenger is the ordering
 * channel. The Facebook/Instagram/TikTok URLs are the follow links.
 */
const FACEBOOK_ID = process.env.NEXT_PUBLIC_FACEBOOK_ID ?? "61563228086384";
const INSTAGRAM_HANDLE =
  process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "torisabi.ph";
const TIKTOK_HANDLE = process.env.NEXT_PUBLIC_TIKTOK_HANDLE ?? "torisabiph.co";

export const MESSENGER_URL = `https://m.me/${FACEBOOK_ID}`;
export const FACEBOOK_PROFILE_URL = `https://www.facebook.com/people/Torisabi-Ph/${FACEBOOK_ID}/`;
export const FACEBOOK_LABEL = "Torisabi Ph";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}`;
export const TIKTOK_URL = `https://www.tiktok.com/@${TIKTOK_HANDLE}`;
