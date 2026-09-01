import type { BlueskyPostRef } from './url.js';

// What bsky.app puts in og:description when an author restricts their posts to
// signed-in viewers. Matched loosely so small wording changes don't silently
// disable the whole feature.
export const GATED_DESCRIPTION = /visible only to people who are signed in/i;

export interface SlackAttachment {
  text?: string;
  fallback?: string;
  original_url?: string;
  from_url?: string;
  app_unfurl_url?: string;
}

/**
 * Narrow refs down to the ones Slack failed to preview usefully.
 *
 * Slack always attaches an unfurl for these links: bsky.app serves valid OG
 * tags for restricted posts, with og:description set to the sign-in
 * placeholder. So "has an attachment" proves nothing — an attachment only
 * counts as a real preview if it isn't that placeholder.
 */
export function refsNeedingRender(
  attachments: SlackAttachment[],
  refs: BlueskyPostRef[]
): BlueskyPostRef[] {
  const previewed = new Set(
    attachments
      .filter((a) => !GATED_DESCRIPTION.test(a.text ?? a.fallback ?? ''))
      .map((a) => a.original_url ?? a.from_url ?? a.app_unfurl_url)
      .filter(Boolean)
  );

  return refs.filter((ref) => !previewed.has(ref.url));
}
