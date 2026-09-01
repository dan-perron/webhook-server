import type { KnownBlock } from '@slack/types';
import type {
  BlueskyEmbed,
  BlueskyFacet,
  BlueskyPost,
} from '../../clients/bluesky.js';
import { permalinkFor } from './url.js';

const SECTION_TEXT_LIMIT = 3000;
const BLUESKY_BLUE = '#1185FE';
const ALT_TEXT_LIMIT = 2000;

/** Slack mrkdwn only requires these three to be escaped. */
function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

function linkFor(facet: BlueskyFacet, label: string): string {
  for (const feature of facet.features) {
    if (feature.uri) return `<${feature.uri}|${escape(label)}>`;
    if (feature.did) {
      return `<https://bsky.app/profile/${feature.did}|${escape(label)}>`;
    }
    if (feature.tag) {
      const tag = encodeURIComponent(feature.tag);
      return `<https://bsky.app/hashtag/${tag}|${escape(label)}>`;
    }
  }
  return escape(label);
}

/**
 * Apply facets to post text. Offsets are UTF-8 byte indices, not JS string
 * indices, so the slicing has to happen on a Buffer — emoji and non-Latin text
 * would land mid-character otherwise. This is also what recovers full URLs:
 * Bluesky truncates long links in the display text and keeps the real target
 * only in the facet.
 */
export function renderPostText(
  text: string,
  facets: BlueskyFacet[] = []
): string {
  const bytes = Buffer.from(text, 'utf8');
  const ordered = facets
    .filter((facet) => facet.index && facet.features?.length)
    .sort((a, b) => a.index.byteStart - b.index.byteStart);

  let cursor = 0;
  let out = '';

  for (const facet of ordered) {
    const { byteStart, byteEnd } = facet.index;
    // Skip overlapping or out-of-range facets rather than corrupting the text.
    if (byteStart < cursor || byteEnd > bytes.length || byteEnd <= byteStart) {
      continue;
    }
    out += escape(bytes.subarray(cursor, byteStart).toString('utf8'));
    out += linkFor(facet, bytes.subarray(byteStart, byteEnd).toString('utf8'));
    cursor = byteEnd;
  }

  out += escape(bytes.subarray(cursor).toString('utf8'));
  return out;
}

function authorLine(post: BlueskyPost): string {
  const { displayName, handle } = post.author;
  const profile = `https://bsky.app/profile/${handle}`;
  const name = displayName ? `*${escape(displayName)}*  ` : '';
  return `${name}<${profile}|@${escape(handle)}>`;
}

function timestampFor(post: BlueskyPost): string {
  const raw = post.record.createdAt ?? post.indexedAt;
  if (!raw) return '';
  const seconds = Math.floor(new Date(raw).getTime() / 1000);
  if (!Number.isFinite(seconds)) return '';
  const fallback = new Date(raw).toISOString().slice(0, 16).replace('T', ' ');
  return `<!date^${seconds}^{date_short_pretty} at {time}|${fallback}>`;
}

function countsLine(post: BlueskyPost): string {
  const parts: string[] = [];
  if (post.replyCount) parts.push(`:speech_balloon: ${post.replyCount}`);
  if (post.repostCount) parts.push(`:repeat: ${post.repostCount}`);
  if (post.likeCount) parts.push(`:heart: ${post.likeCount}`);
  return parts.join('   ');
}

/** Unwrap recordWithMedia so callers get the media and the quote separately. */
function splitEmbed(embed?: BlueskyEmbed): {
  media?: BlueskyEmbed;
  quoted?: BlueskyEmbed['record'];
} {
  if (!embed) return {};
  if (embed.media) return { media: embed.media, quoted: embed.record?.record };
  if (embed.record) return { quoted: embed.record.record ?? embed.record };
  return { media: embed };
}

function mediaBlocks(media?: BlueskyEmbed): KnownBlock[] {
  if (!media) return [];
  const blocks: KnownBlock[] = [];

  for (const image of media.images ?? media.items ?? []) {
    const url = image.fullsize ?? image.thumb;
    if (!url) continue;
    blocks.push({
      type: 'image',
      image_url: url,
      alt_text: truncate(image.alt || 'Image', ALT_TEXT_LIMIT),
    });
  }

  if (media.external) {
    const { uri, title, description } = media.external;
    const heading = title ? `<${uri}|${escape(title)}>` : `<${uri}|${uri}>`;
    const body = description ? `\n${escape(description)}` : '';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: truncate(`:link: ${heading}${body}`, SECTION_TEXT_LIMIT),
      },
    });
  }

  // Video has no still frame Slack can embed reliably; link the thumbnail.
  if (media.playlist && media.thumbnail) {
    blocks.push({
      type: 'image',
      image_url: media.thumbnail,
      alt_text: truncate(media.alt || 'Video thumbnail', ALT_TEXT_LIMIT),
    });
  }

  return blocks;
}

function quoteBlocks(quoted?: BlueskyEmbed['record']): KnownBlock[] {
  if (!quoted?.author || !quoted.value) return [];

  const handle = quoted.author.handle;
  const name = quoted.author.displayName ?? handle;
  const text = renderPostText(quoted.value.text ?? '');
  const link = quoted.uri ? permalinkFor(handle, quoted.uri) : undefined;
  const header = link
    ? `<${link}|*${escape(name)}* @${escape(handle)}>`
    : `*${escape(name)}* @${escape(handle)}`;

  // Slack renders a leading '>' per line as a blockquote.
  const body = text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');

  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: truncate(`> ${header}\n${body}`, SECTION_TEXT_LIMIT),
      },
    },
  ];

  // A quoted post carries its own embeds. Render their media so quoting a
  // photo or video doesn't collapse to bare text. splitEmbed returns no media
  // for a nested quote, which is what stops this recursing.
  for (const embed of quoted.embeds ?? []) {
    blocks.push(...mediaBlocks(splitEmbed(embed).media));
  }

  return blocks;
}

export function buildPostBlocks(post: BlueskyPost): KnownBlock[] {
  const { media, quoted } = splitEmbed(post.embed);
  const blocks: KnownBlock[] = [];

  const header: KnownBlock = {
    type: 'context',
    elements: [
      ...(post.author.avatar
        ? [
            {
              type: 'image' as const,
              image_url: post.author.avatar,
              alt_text: post.author.handle,
            },
          ]
        : []),
      { type: 'mrkdwn' as const, text: authorLine(post) },
    ],
  };
  blocks.push(header);

  const text = renderPostText(post.record.text ?? '', post.record.facets);
  if (text.trim()) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: truncate(text, SECTION_TEXT_LIMIT) },
    });
  }

  blocks.push(...mediaBlocks(media));
  blocks.push(...quoteBlocks(quoted));

  const footer = [
    countsLine(post),
    timestampFor(post),
    `<${permalinkFor(post.author.handle, post.uri)}|View on Bluesky>`,
  ]
    .filter(Boolean)
    .join('  ·  ');

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: footer }],
  });

  return blocks;
}

export interface PostAttachment {
  color: string;
  blocks: KnownBlock[];
  fallback: string;
}

/**
 * Wrap the blocks in an attachment so Slack draws its coloured left bar. That
 * bar is what makes this read as a link preview rather than as a bot post.
 */
export function buildPostAttachment(post: BlueskyPost): PostAttachment {
  return {
    color: BLUESKY_BLUE,
    blocks: buildPostBlocks(post),
    fallback: buildFallbackText(post),
  };
}

/** Plain-text fallback for notifications and clients that ignore blocks. */
export function buildFallbackText(post: BlueskyPost): string {
  const name = post.author.displayName ?? post.author.handle;
  const text = (post.record.text ?? '').replace(/\s+/g, ' ').trim();
  return truncate(`${name} (@${post.author.handle}): ${text}`, 300);
}
