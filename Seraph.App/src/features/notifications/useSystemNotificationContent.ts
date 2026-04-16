/**
 * Fetches localised content for a system notification (announcement, update_available)
 * from the remote content API.
 *
 * TODO: wire to real API endpoint once backend is available.
 * Expected shape: GET /content/{contentId}?lang={lang}
 * Response: { title: string; body: string }
 */
export interface SystemNotificationContent {
  title: string;
  body: string;
}

export function useSystemNotificationContent(
  _contentId: string | undefined,
  _lang: string,
): { content: SystemNotificationContent | null; loading: boolean } {
  // Stub — returns null until API is wired up.
  return { content: null, loading: false };
}
