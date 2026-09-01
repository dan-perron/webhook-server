const config = {
  ai: {
    client: 'google',
  },
  aws: {
    accessKey: '',
    secretAccessKey: '',
    region: 'us-east-2',
    bucket: '',
  },
  bluesky: {
    service: 'https://bsky.social',
    // Set both in config/local.cjs. Use an app password from Bluesky
    // Settings > App Passwords, never the account password. Leaving these
    // null disables the listener.
    identifier: null,
    appPassword: null,
    // How long to let Slack's own unfurler try before we step in.
    unfurlGraceMs: 6000,
    // Render as a threaded reply instead of a message in the channel.
    replyInThread: false,
    // How video is presented:
    //   'thumbnail' — a still image (no extra scopes)
    //   'embed'     — Bluesky's player in a Slack video block. Plays inline
    //                 but re-renders the whole post inside the frame. Needs
    //                 links:read + links:write and embed.bsky.app registered
    //                 as an App Unfurl Domain.
    //   'rehost'    — download the original upload from the author's PDS and
    //                 attach it to Slack, giving a bare native player. Needs
    //                 files:write, and costs workspace file storage.
    // Slack rejects the whole message if a mode's requirements are unmet, so
    // the listener falls back to 'thumbnail' and logs when that happens.
    videoMode: 'thumbnail',
    // Skip re-hosting anything larger than this.
    maxVideoBytes: 100 * 1024 * 1024,
  },
  googleai: {
    key: null,
    model: 'gemini-2.0-flash',
  },
  mongodb: {
    connectionString: process.env.MONGODB_CONNSTRING,
  },
  openai: {
    key: null,
    useComplete: false,
    returnImages: false,
    model: 'gpt-4-1106-preview',
  },
  slack: {
    appToken: null,
    signingSecret: null,
    token: null,
  },
  simulation: {
    hostname: 'windows-facilitator',
  },
  yahoo: {
    appId: null,
    clientId: null,
    clientSecret: null,
    leagueKey: null,
  },
};
module.exports = config;
