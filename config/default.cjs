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
    // Embed Bluesky's player so videos play in Slack instead of showing a
    // still. Requires links:read / links:write on the Slack app and
    // embed.bsky.app registered as an App Unfurl Domain; without those Slack
    // rejects the whole message, so this defaults off. The listener falls back
    // to the thumbnail on rejection and logs it.
    playableVideo: false,
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
