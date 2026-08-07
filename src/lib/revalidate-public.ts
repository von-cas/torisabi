/**
 * Ask the server to refresh the cached public catalogue after an admin write.
 *
 * The admin dashboard mutates Supabase straight from the browser, so it calls
 * this after a successful save to purge the public cache and make the change
 * show immediately. Fire-and-forget on purpose: if the request fails, the
 * hourly ISR backstop still catches up, so it must never block or break the
 * admin action it follows.
 */
export async function revalidatePublicSite(): Promise<void> {
  try {
    await fetch("/api/revalidate", { method: "POST" });
  } catch {
    // Ignore — the ISR backstop covers a missed purge within the hour.
  }
}
