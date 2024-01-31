const config = {
  mongodb: {
    connectionString: process.env.MONGODB_CONNSTRING,
  },
  slack: {
    appToken: null,
    signingSecret: null,
    token: null,
    webhookUrls: { civilization: null, test: null, ootp: null },
  },
  openai: {
    key: null,
    useComplete: false,
    returnImages: false,
    model: 'gpt-4-1106-preview',
  },
  yahoo: {
    appId: null,
    clientId: null,
    clientSecret: null,
    leagueKey: null,
  },
}
module.exports = config
