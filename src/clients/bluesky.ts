import config from 'config';
import {
  getStoredSession,
  storeSession,
  clearStoredSession,
} from './mongo/repositories/blueskySession.js';
import { toAtUri } from '../utils/bluesky/url.js';
import { createLogger } from '../utils/logging/index.js';

const blueskyLogger = createLogger('bluesky');

const service = config.get<string>('bluesky.service');
const identifier = config.get<string>('bluesky.identifier');
const appPassword = config.get<string>('bluesky.appPassword');

export function isConfigured(): boolean {
  return Boolean(identifier && appPassword);
}

// ---------------------------------------------------------------------------
// Post shapes — only the fields we actually render.
// ---------------------------------------------------------------------------

export interface BlueskyFacet {
  index: { byteStart: number; byteEnd: number };
  features: Array<{
    $type: string;
    uri?: string;
    did?: string;
    tag?: string;
  }>;
}

export interface BlueskyAuthor {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface BlueskyEmbedImage {
  thumb?: string;
  fullsize?: string;
  alt?: string;
}

export interface BlueskyEmbed {
  $type?: string;
  /** Blob CID, present on video views — the handle for fetching the original. */
  cid?: string;
  images?: BlueskyEmbedImage[];
  /** app.bsky.embed.gallery#view carries the same shape under `items`. */
  items?: BlueskyEmbedImage[];
  external?: {
    uri: string;
    title?: string;
    description?: string;
    thumb?: string;
  };
  playlist?: string;
  thumbnail?: string;
  alt?: string;
  // record / recordWithMedia
  record?: BlueskyEmbed & {
    uri?: string;
    author?: BlueskyAuthor;
    value?: { text?: string; createdAt?: string };
    embeds?: BlueskyEmbed[];
  };
  media?: BlueskyEmbed;
}

export interface BlueskyPost {
  uri: string;
  cid: string;
  author: BlueskyAuthor;
  record: {
    text?: string;
    createdAt?: string;
    facets?: BlueskyFacet[];
  };
  embed?: BlueskyEmbed;
  replyCount?: number;
  repostCount?: number;
  likeCount?: number;
  quoteCount?: number;
  indexedAt?: string;
}

// ---------------------------------------------------------------------------
// Session handling
// ---------------------------------------------------------------------------

interface SessionTokens {
  did: string;
  accessJwt: string;
  refreshJwt: string;
}

let session: SessionTokens | null = null;
let inflight: Promise<SessionTokens> | null = null;

async function xrpcPost(
  method: string,
  body: unknown,
  bearer?: string
): Promise<Record<string, unknown>> {
  const response = await fetch(`${service}/xrpc/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${method} failed (${response.status}): ${detail}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

async function login(): Promise<SessionTokens> {
  const result = await xrpcPost('com.atproto.server.createSession', {
    identifier,
    password: appPassword,
  });
  const tokens: SessionTokens = {
    did: result.did as string,
    accessJwt: result.accessJwt as string,
    refreshJwt: result.refreshJwt as string,
  };
  await storeSession({ identifier, ...tokens });
  blueskyLogger.info('Created new Bluesky session', { did: tokens.did });
  return tokens;
}

async function refresh(refreshJwt: string): Promise<SessionTokens> {
  const result = await xrpcPost(
    'com.atproto.server.refreshSession',
    {},
    refreshJwt
  );
  const tokens: SessionTokens = {
    did: result.did as string,
    accessJwt: result.accessJwt as string,
    refreshJwt: result.refreshJwt as string,
  };
  await storeSession({ identifier, ...tokens });
  blueskyLogger.debug('Refreshed Bluesky session');
  return tokens;
}

async function resolveSession(): Promise<SessionTokens> {
  if (session) return session;
  if (inflight) return inflight;

  inflight = (async () => {
    // Reuse the persisted refresh token so a container restart doesn't burn a
    // fresh login against the rate limit.
    const stored = await getStoredSession(identifier);
    if (stored?.refreshJwt) {
      try {
        return await refresh(stored.refreshJwt);
      } catch (error) {
        blueskyLogger.warn('Stored refresh token rejected, logging in fresh', {
          error: (error as Error).message,
        });
        await clearStoredSession(identifier);
      }
    }
    return login();
  })();

  try {
    session = await inflight;
    return session;
  } finally {
    inflight = null;
  }
}

/** GET an XRPC method, refreshing the session once on an auth failure. */
async function xrpcGet(
  method: string,
  params: URLSearchParams
): Promise<Record<string, unknown>> {
  const attempt = async (tokens: SessionTokens) => {
    const response = await fetch(`${service}/xrpc/${method}?${params}`, {
      headers: { Authorization: `Bearer ${tokens.accessJwt}` },
    });
    return response;
  };

  let tokens = await resolveSession();
  let response = await attempt(tokens);

  if (response.status === 400 || response.status === 401) {
    // ExpiredToken / InvalidToken both surface here; re-auth and retry once.
    session = null;
    tokens = await resolveSession();
    response = await attempt(tokens);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${method} failed (${response.status}): ${detail}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------

const didCache = new Map<string, string>();

export async function resolveActorDid(actor: string): Promise<string> {
  if (actor.startsWith('did:')) return actor;

  const cached = didCache.get(actor);
  if (cached) return cached;

  const result = await xrpcGet(
    'com.atproto.identity.resolveHandle',
    new URLSearchParams({ handle: actor })
  );
  const did = result.did as string;
  didCache.set(actor, did);
  return did;
}

/**
 * Hydrate posts by AT URI. getPosts silently omits anything deleted, blocked,
 * or otherwise unavailable, so the result may be shorter than the input.
 */
export async function getPosts(uris: string[]): Promise<BlueskyPost[]> {
  if (uris.length === 0) return [];

  const params = new URLSearchParams();
  for (const uri of uris.slice(0, 25)) params.append('uris', uri);

  const result = await xrpcGet('app.bsky.feed.getPosts', params);
  return (result.posts ?? []) as BlueskyPost[];
}

export async function getPostByRef(
  actor: string,
  rkey: string
): Promise<BlueskyPost | null> {
  const did = await resolveActorDid(actor);
  const posts = await getPosts([toAtUri(did, rkey)]);
  return posts[0] ?? null;
}

// ---------------------------------------------------------------------------
// Blob fetching
//
// Bluesky serves video to clients as HLS, which Slack cannot play. The original
// upload is still on the author's PDS as a plain file, reachable by blob CID.
// ---------------------------------------------------------------------------

const pdsCache = new Map<string, string>();

/** Find the PDS that hosts a DID's repo, via its DID document. */
export async function resolvePds(did: string): Promise<string> {
  const cached = pdsCache.get(did);
  if (cached) return cached;

  let doc: { service?: Array<{ type: string; serviceEndpoint: string }> };
  if (did.startsWith('did:web:')) {
    const host = decodeURIComponent(did.slice('did:web:'.length));
    doc = await (await fetch(`https://${host}/.well-known/did.json`)).json();
  } else {
    doc = await (await fetch(`https://plc.directory/${did}`)).json();
  }

  const endpoint = doc.service?.find(
    (svc) => svc.type === 'AtprotoPersonalDataServer'
  )?.serviceEndpoint;
  if (!endpoint) throw new Error(`No PDS in DID document for ${did}`);

  pdsCache.set(did, endpoint);
  return endpoint;
}

export interface FetchedBlob {
  data: Buffer;
  contentType: string;
}

/**
 * Download an original blob. Returns null when it is missing or larger than
 * maxBytes — re-hosting someone's video is a convenience, never worth blocking
 * the render or filling the workspace over.
 */
export async function fetchBlob(
  did: string,
  cid: string,
  maxBytes: number
): Promise<FetchedBlob | null> {
  const pds = await resolvePds(did);
  const url = `${pds}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(
    did
  )}&cid=${encodeURIComponent(cid)}`;

  const response = await fetch(url);
  if (!response.ok) {
    blueskyLogger.warn('Blob fetch failed', {
      did,
      cid,
      status: response.status,
    });
    return null;
  }

  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > maxBytes) {
    blueskyLogger.info('Blob too large, skipping', {
      did,
      cid,
      bytes: declared,
      maxBytes,
    });
    return null;
  }

  const data = Buffer.from(await response.arrayBuffer());
  if (data.byteLength > maxBytes) {
    blueskyLogger.info('Blob too large, skipping', {
      did,
      cid,
      bytes: data.byteLength,
      maxBytes,
    });
    return null;
  }

  return {
    data,
    contentType:
      response.headers.get('content-type') ?? 'application/octet-stream',
  };
}
