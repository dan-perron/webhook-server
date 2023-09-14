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
    useGPT4: true,
  },
  yahoo: {
    appId: null,
    clientId: null,
    clientSecret: null,
    leagueKey: null,
  }
};

module.exports = config;
