import config from 'config';
import { app } from '../clients/slack.js';
import { isConfigured, getPostByRef } from '../clients/bluesky.js';
import { extractPostRefs } from '../utils/bluesky/url.js';
import { refsNeedingRender } from '../utils/bluesky/unfurl.js';
import type { BlueskyPostRef } from '../utils/bluesky/url.js';
import { buildPostAttachment, hasVideoBlock } from '../utils/bluesky/render.js';
import { createLogger } from '../utils/logging/index.js';

const blueskyLogger = createLogger('bluesky-unfurl');

const graceMs = config.get<number>('bluesky.unfurlGraceMs');
const replyInThread = config.get<boolean>('bluesky.replyInThread');
const playableVideo = config.get<boolean>('bluesky.playableVideo');

// Flipped off for the rest of the process once Slack rejects a video block, so
// one misconfigured install doesn't cost every later post a wasted round trip.
let videoBlocksUsable = playableVideo;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The subset of a plain user message we care about. */
interface PlainMessage {
  subtype?: string;
  bot_id?: string;
  text?: string;
  channel: string;
  ts: string;
  thread_ts?: string;
  user?: string;
}

// Slack redelivers events on its own retry schedule; keep a short memory of
// what we've already rendered so a redelivery doesn't double-post.
const handled = new Set<string>();
const HANDLED_LIMIT = 500;

function remember(key: string): boolean {
  if (handled.has(key)) return false;
  handled.add(key);
  if (handled.size > HANDLED_LIMIT) {
    handled.delete(handled.values().next().value);
  }
  return true;
}

/** Re-read the posted message and return the refs Slack did NOT unfurl. */
async function unhandledRefs(
  client,
  message: PlainMessage,
  refs: BlueskyPostRef[]
): Promise<BlueskyPostRef[]> {
  const inThread = message.thread_ts && message.thread_ts !== message.ts;

  const result = inThread
    ? await client.conversations.replies({
        channel: message.channel,
        ts: message.thread_ts,
        latest: message.ts,
        inclusive: true,
        limit: 1,
      })
    : await client.conversations.history({
        channel: message.channel,
        latest: message.ts,
        oldest: message.ts,
        inclusive: true,
        limit: 1,
      });

  const posted = (result.messages ?? []).find((m) => m.ts === message.ts);
  return refsNeedingRender(posted?.attachments ?? [], refs);
}

app.message(async ({ message, client }) => {
  if (!isConfigured()) return;

  // Only plain user messages. This also skips the message_changed event Slack
  // fires when its own unfurler attaches a preview, which would otherwise
  // bounce straight back into this handler.
  const event = message as unknown as PlainMessage;
  if (event.subtype !== undefined || event.bot_id) return;

  const refs = extractPostRefs(event.text ?? '');
  if (refs.length === 0) return;

  // Give Slack's unfurler a head start; only step in where it came up empty.
  await sleep(graceMs);

  let pending: BlueskyPostRef[];
  try {
    pending = await unhandledRefs(client, event, refs);
  } catch (error) {
    blueskyLogger.warn('Could not re-read message, rendering all refs', {
      error: (error as Error).message,
    });
    pending = refs;
  }

  for (const ref of pending) {
    if (!remember(`${event.channel}:${event.ts}:${ref.actor}/${ref.rkey}`)) {
      continue;
    }

    try {
      const post = await getPostByRef(ref.actor, ref.rkey);
      if (!post) {
        blueskyLogger.info('Post unavailable', { url: ref.url });
        continue;
      }

      const thread = replyInThread
        ? event.thread_ts ?? event.ts
        : event.thread_ts;

      const send = (attachment: ReturnType<typeof buildPostAttachment>) =>
        client.chat.postMessage({
          channel: event.channel,
          // Stay in the thread when the link was posted in one.
          thread_ts: thread,
          text: attachment.fallback,
          attachments: [attachment],
          unfurl_links: false,
          unfurl_media: false,
        });

      const attachment = buildPostAttachment(post, videoBlocksUsable);
      try {
        await send(attachment);
      } catch (error) {
        // A video block Slack won't accept fails the entire message, not just
        // itself, so retry once without it rather than losing the render.
        const rejected = /invalid_(blocks|attachments)/.test(
          (error as Error).message
        );
        if (!rejected || !hasVideoBlock(attachment)) throw error;

        videoBlocksUsable = false;
        blueskyLogger.warn(
          'Slack rejected the video block; falling back to thumbnails. ' +
            'Check links:read / links:write and the App Unfurl Domains.',
          { error: (error as Error).message }
        );
        await send(buildPostAttachment(post, false));
      }

      blueskyLogger.info('Rendered Bluesky post', {
        url: ref.url,
        channel: event.channel,
      });
    } catch (error) {
      blueskyLogger.error('Failed to render Bluesky post', {
        url: ref.url,
        error: (error as Error).message,
      });
    }
  }
});

blueskyLogger.info('Bluesky unfurl listener registered', {
  configured: isConfigured(),
});
