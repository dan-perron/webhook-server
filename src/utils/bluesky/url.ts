export interface BlueskyPostRef {
  /** Handle or DID exactly as it appeared in the URL. */
  actor: string;
  /** Record key — the trailing path segment. */
  rkey: string;
  /** Canonical permalink, used to match against Slack's unfurl attachments. */
  url: string;
}

// https://bsky.app/profile/<handle-or-did>/post/<rkey>
// Slack delivers links wrapped as <url> or <url|label>, so the trailing
// character classes stop at '>' and '|' on their own.
const POST_URL =
  /https?:\/\/(?:www\.)?bsky\.app\/profile\/([^/\s<>|]+)\/post\/([A-Za-z0-9._~-]+)/g;

export function extractPostRefs(text: string): BlueskyPostRef[] {
  const seen = new Set<string>();
  const refs: BlueskyPostRef[] = [];

  for (const match of text.matchAll(POST_URL)) {
    const [url, actor, rkey] = match;
    const key = `${actor}/${rkey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ actor, rkey, url });
  }

  return refs;
}

export function toAtUri(did: string, rkey: string): string {
  return `at://${did}/app.bsky.feed.post/${rkey}`;
}

/** Rebuild a permalink from a hydrated post, whose author handle we trust. */
export function permalinkFor(handle: string, uri: string): string {
  const rkey = uri.split('/').pop() ?? '';
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}
